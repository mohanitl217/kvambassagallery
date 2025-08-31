// ===============================================================
// Enhanced Cache Manager for Modern School Gallery
// ===============================================================

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.storage = window.localStorage;
        this.cachePrefix = 'kv_gallery_';
        this.defaultTTL = 15 * 60 * 1000; // 15 minutes
        this.maxCacheSize = 100; // Increased from 50 for better performance
        this.compressionEnabled = true;
        
        // Cache statistics
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
        
        this.initializeCache();
        this.setupCacheCleanup();
    }

    initializeCache() {
        try {
            // Load existing cache from localStorage with compression support
            const keys = Object.keys(this.storage).filter(key => key.startsWith(this.cachePrefix));
            let loadedCount = 0;
            let invalidCount = 0;

            keys.forEach(key => {
                try {
                    const rawData = this.storage.getItem(key);
                    const data = this.deserializeData(rawData);
                    
                    if (data && this.isValidCacheEntry(data)) {
                        const cacheKey = key.replace(this.cachePrefix, '');
                        this.cache.set(cacheKey, data);
                        loadedCount++;
                    } else {
                        // Remove invalid entries
                        this.storage.removeItem(key);
                        invalidCount++;
                    }
                } catch (error) {
                    console.warn('Failed to parse cache entry:', key, error);
                    this.storage.removeItem(key);
                    invalidCount++;
                }
            });

            console.log(`Cache initialized: ${loadedCount} entries loaded, ${invalidCount} invalid entries removed`);
        } catch (error) {
            console.error('Failed to initialize cache:', error);
            this.clearMemoryCache(); // Clear memory cache on error
        }
    }

    setupCacheCleanup() {
        // Periodic cleanup every 5 minutes
        setInterval(() => {
            this.performMaintenance();
        }, 5 * 60 * 1000);

        // Cleanup on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performMaintenance();
            }
        });

        // Cleanup before page unload
        window.addEventListener('beforeunload', () => {
            this.performMaintenance();
        });
    }

    isValidCacheEntry(entry) {
        if (!entry || typeof entry !== 'object') return false;
        if (!entry.data || !entry.timestamp || !entry.ttl) return false;
        if (Date.now() > entry.timestamp + entry.ttl) return false;
        return true;
    }

    set(key, data, ttl = this.defaultTTL, priority = 'normal') {
        try {
            const entry = {
                data: this.compressData(data),
                timestamp: Date.now(),
                ttl,
                version: '2.0',
                priority,
                accessCount: 0,
                lastAccessed: Date.now(),
                size: this.calculateSize(data)
            };

            // Check cache size limit and evict if necessary
            if (this.cache.size >= this.maxCacheSize) {
                this.evictEntries(Math.ceil(this.maxCacheSize * 0.1)); // Evict 10%
            }

            // Set in memory cache
            this.cache.set(key, entry);
            
            // Set in localStorage with error handling
            try {
                const serializedData = this.serializeData(entry);
                this.storage.setItem(this.cachePrefix + key, serializedData);
            } catch (storageError) {
                if (storageError.name === 'QuotaExceededError') {
                    console.warn('LocalStorage quota exceeded, cleaning up old entries');
                    this.cleanupOldEntries();
                    try {
                        const serializedData = this.serializeData(entry);
                        this.storage.setItem(this.cachePrefix + key, serializedData);
                    } catch (retryError) {
                        console.error('Failed to store cache entry after cleanup:', retryError);
                    }
                } else {
                    console.error('Failed to store cache entry:', storageError);
                }
            }
            
            this.stats.sets++;
            console.log(`Cache set: ${key} (TTL: ${ttl}ms, Priority: ${priority})`);
            return true;
        } catch (error) {
            console.error('Failed to set cache:', key, error);
            return false;
        }
    }

    get(key) {
        try {
            let entry = this.cache.get(key);
            
            // If not in memory, try localStorage
            if (!entry) {
                try {
                    const rawData = this.storage.getItem(this.cachePrefix + key);
                    if (rawData) {
                        entry = this.deserializeData(rawData);
                        if (entry && this.isValidCacheEntry(entry)) {
                            // Restore to memory cache
                            this.cache.set(key, entry);
                        }
                    }
                } catch (storageError) {
                    console.warn('Failed to retrieve from localStorage:', key, storageError);
                }
            }
            
            if (!entry || !this.isValidCacheEntry(entry)) {
                this.delete(key);
                this.stats.misses++;
                return null;
            }

            // Update access statistics
            entry.accessCount++;
            entry.lastAccessed = Date.now();
            
            this.stats.hits++;
            console.log(`Cache hit: ${key} (${this.stats.hits}/${this.stats.hits + this.stats.misses} hit rate)`);
            
            return this.decompressData(entry.data);
        } catch (error) {
            console.error('Failed to get cache:', key, error);
            this.stats.misses++;
            return null;
        }
    }

    has(key) {
        const entry = this.cache.get(key);
        if (entry && this.isValidCacheEntry(entry)) {
            return true;
        }
        
        // Check localStorage if not in memory
        try {
            const rawData = this.storage.getItem(this.cachePrefix + key);
            if (rawData) {
                const entry = this.deserializeData(rawData);
                return entry && this.isValidCacheEntry(entry);
            }
        } catch (error) {
            console.warn('Failed to check localStorage:', key, error);
        }
        
        return false;
    }

    delete(key) {
        try {
            const deleted = this.cache.delete(key);
            this.storage.removeItem(this.cachePrefix + key);
            
            if (deleted) {
                this.stats.deletes++;
                console.log(`Cache deleted: ${key}`);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to delete cache:', key, error);
            return false;
        }
    }

    clear() {
        try {
            this.clearMemoryCache();
            this.clearStorageCache();
            
            console.log('Cache cleared completely');
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    clearMemoryCache() {
        this.cache.clear();
        this.resetStats();
    }

    clearStorageCache() {
        try {
            const keys = Object.keys(this.storage).filter(key => key.startsWith(this.cachePrefix));
            keys.forEach(key => this.storage.removeItem(key));
        } catch (error) {
            console.error('Failed to clear storage cache:', error);
        }
    }

    evictEntries(count = 1) {
        try {
            const entries = Array.from(this.cache.entries())
                .map(([key, entry]) => ({ key, ...entry }))
                .sort((a, b) => {
                    // Evict based on priority, access frequency, and age
                    const priorityWeight = { low: 3, normal: 2, high: 1 };
                    const aPriority = priorityWeight[a.priority] || 2;
                    const bPriority = priorityWeight[b.priority] || 2;
                    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority; // Higher priority = lower value = kept longer
                    }
                    
                    // If same priority, evict least recently accessed
                    if (a.lastAccessed !== b.lastAccessed) {
                        return a.lastAccessed - b.lastAccessed;
                    }
                    
                    // If same access time, evict oldest
                    return a.timestamp - b.timestamp;
                });

            let evicted = 0;
            for (const entry of entries) {
                if (evicted >= count) break;
                
                this.delete(entry.key);
                evicted++;
                this.stats.evictions++;
            }

            if (evicted > 0) {
                console.log(`Evicted ${evicted} cache entries`);
            }
        } catch (error) {
            console.error('Failed to evict cache entries:', error);
        }
    }

    cleanupOldEntries() {
        try {
            const cutoffTime = Date.now() - (this.defaultTTL * 2); // Remove entries older than 2x default TTL
            let cleaned = 0;

            for (const [key, entry] of this.cache.entries()) {
                if (entry.timestamp < cutoffTime || !this.isValidCacheEntry(entry)) {
                    this.delete(key);
                    cleaned++;
                }
            }

            // Also clean localStorage directly
            const keys = Object.keys(this.storage).filter(key => key.startsWith(this.cachePrefix));
            keys.forEach(key => {
                try {
                    const rawData = this.storage.getItem(key);
                    const entry = this.deserializeData(rawData);
                    if (!entry || entry.timestamp < cutoffTime || !this.isValidCacheEntry(entry)) {
                        this.storage.removeItem(key);
                        cleaned++;
                    }
                } catch (error) {
                    // Remove corrupted entries
                    this.storage.removeItem(key);
                    cleaned++;
                }
            });

            console.log(`Cleaned up ${cleaned} old cache entries`);
        } catch (error) {
            console.error('Failed to cleanup old entries:', error);
        }
    }

    performMaintenance() {
        console.log('Performing cache maintenance...');
        
        // Clean up expired entries
        this.cleanupOldEntries();
        
        // If still over size limit, evict more entries
        if (this.cache.size > this.maxCacheSize) {
            const excess = this.cache.size - Math.floor(this.maxCacheSize * 0.8); // Reduce to 80%
            this.evictEntries(excess);
        }
        
        console.log(`Cache maintenance complete: ${this.cache.size} entries in memory`);
    }

    getDetailedStats() {
        const memorySize = this.cache.size;
        const totalHits = this.stats.hits;
        const totalRequests = this.stats.hits + this.stats.misses;
        const hitRate = totalRequests > 0 ? (totalHits / totalRequests * 100).toFixed(2) : 0;
        
        // Calculate total data size
        let totalDataSize = 0;
        for (const [key, entry] of this.cache.entries()) {
            totalDataSize += entry.size || 0;
        }
        
        return {
            memoryEntries: memorySize,
            maxSize: this.maxCacheSize,
            hitRate: `${hitRate}%`,
            totalRequests,
            ...this.stats,
            totalDataSize: this.formatBytes(totalDataSize),
            defaultTTL: this.defaultTTL
        };
    }

    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0
        };
    }

    // Data compression/decompression
    compressData(data) {
        if (!this.compressionEnabled) return data;
        
        try {
            // Simple JSON stringification with deduplication for objects
            if (typeof data === 'object' && data !== null) {
                return JSON.parse(JSON.stringify(data)); // Deep clone and normalize
            }
            return data;
        } catch (error) {
            console.warn('Failed to compress data:', error);
            return data;
        }
    }

    decompressData(data) {
        if (!this.compressionEnabled) return data;
        return data; // In this simple implementation, no actual compression
    }

    // Serialization for localStorage
    serializeData(entry) {
        return JSON.stringify(entry);
    }

    deserializeData(rawData) {
        if (!rawData) return null;
        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.warn('Failed to deserialize cache data:', error);
            return null;
        }
    }

    calculateSize(data) {
        try {
            return JSON.stringify(data).length;
        } catch (error) {
            return 0;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    // ===============================================================
    // Specialized Cache Methods for Gallery
    // ===============================================================

    setFolderTree(data) {
        return this.set('folder_tree', data, 30 * 60 * 1000, 'high'); // 30 minutes, high priority
    }

    getFolderTree() {
        return this.get('folder_tree');
    }

    setStats(data) {
        return this.set('gallery_stats', data, 10 * 60 * 1000, 'high'); // 10 minutes, high priority
    }

    getStats() {
        return this.get('gallery_stats');
    }

    setGalleryData(path, data) {
        const key = `gallery_${this.hashPath(path)}`;
        return this.set(key, data, 5 * 60 * 1000, 'normal'); // 5 minutes, normal priority
    }

    getGalleryData(path) {
        const key = `gallery_${this.hashPath(path)}`;
        return this.get(key);
    }

    setThumbnail(fileId, thumbnailData) {
        const key = `thumb_${fileId}`;
        return this.set(key, thumbnailData, 60 * 60 * 1000, 'low'); // 1 hour, low priority
    }

    getThumbnail(fileId) {
        const key = `thumb_${fileId}`;
        return this.get(key);
    }

    // Optimized path hashing
    hashPath(path) {
        // Simple but effective hash function for paths
        let hash = 0;
        for (let i = 0; i < path.length; i++) {
            const char = path.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // ===============================================================
    // Cache Invalidation Methods
    // ===============================================================

    invalidateGalleryData() {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith('gallery_') && key !== 'gallery_stats') {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
        console.log(`Invalidated ${keysToDelete.length} gallery cache entries`);
        
        return keysToDelete.length;
    }

    invalidateByPattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
        console.log(`Invalidated ${keysToDelete.length} entries matching pattern: ${pattern}`);
        
        return keysToDelete.length;
    }

    invalidateAll() {
        const count = this.cache.size;
        this.clear();
        console.log(`All cache invalidated: ${count} entries removed`);
        return count;
    }

    // ===============================================================
    // Refresh Methods with Cache Management
    // ===============================================================

    async refreshFolderTree(apiCall) {
        this.delete('folder_tree');
        try {
            const data = await apiCall();
            this.setFolderTree(data);
            return data;
        } catch (error) {
            console.error('Failed to refresh folder tree:', error);
            throw error;
        }
    }

    async refreshStats(apiCall) {
        this.delete('gallery_stats');
        try {
            const data = await apiCall();
            this.setStats(data);
            return data;
        } catch (error) {
            console.error('Failed to refresh stats:', error);
            throw error;
        }
    }

    async refreshGalleryData(path, apiCall) {
        const key = `gallery_${this.hashPath(path)}`;
        this.delete(key);
        try {
            const data = await apiCall();
            this.setGalleryData(path, data);
            return data;
        } catch (error) {
            console.error('Failed to refresh gallery data for path:', path, error);
            throw error;
        }
    }

    // ===============================================================
    // Preloading and Prefetching
    // ===============================================================

    async preloadGalleryData(paths, apiCallFactory) {
        const promises = paths.map(async (path) => {
            if (!this.getGalleryData(path)) {
                try {
                    const apiCall = apiCallFactory(path);
                    const data = await apiCall();
                    this.setGalleryData(path, data);
                    return { path, success: true, data };
                } catch (error) {
                    console.warn('Failed to preload gallery data for path:', path, error);
                    return { path, success: false, error };
                }
            }
            return { path, success: true, cached: true };
        });

        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        
        console.log(`Preloaded ${successful}/${paths.length} gallery paths`);
        return results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason });
    }
}

// Export for use in main script
window.CacheManager = CacheManager;
