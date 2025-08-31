// Cache Manager for Modern School Gallery
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.storage = window.localStorage;
        this.cachePrefix = 'kv_gallery_';
        this.defaultTTL = 15 * 60 * 1000; // 15 minutes
        this.maxCacheSize = 50; // Maximum number of cache entries
        
        this.initializeCache();
    }

    initializeCache() {
        try {
            // Load existing cache from localStorage
            const keys = Object.keys(this.storage).filter(key => key.startsWith(this.cachePrefix));
            keys.forEach(key => {
                try {
                    const data = JSON.parse(this.storage.getItem(key));
                    if (data && this.isValidCacheEntry(data)) {
                        const cacheKey = key.replace(this.cachePrefix, '');
                        this.cache.set(cacheKey, data);
                    } else {
                        // Remove invalid entries
                        this.storage.removeItem(key);
                    }
                } catch (error) {
                    console.warn('Failed to parse cache entry:', key, error);
                    this.storage.removeItem(key);
                }
            });

            console.log(`Cache initialized with ${this.cache.size} entries`);
        } catch (error) {
            console.error('Failed to initialize cache:', error);
        }
    }

    isValidCacheEntry(entry) {
        if (!entry || typeof entry !== 'object') return false;
        if (!entry.data || !entry.timestamp || !entry.ttl) return false;
        if (Date.now() > entry.timestamp + entry.ttl) return false;
        return true;
    }

    set(key, data, ttl = this.defaultTTL) {
        try {
            const entry = {
                data,
                timestamp: Date.now(),
                ttl,
                version: '1.0'
            };

            // Check cache size limit
            if (this.cache.size >= this.maxCacheSize) {
                this.evictOldest();
            }

            this.cache.set(key, entry);
            this.storage.setItem(this.cachePrefix + key, JSON.stringify(entry));
            
            console.log(`Cache set: ${key} (TTL: ${ttl}ms)`);
            return true;
        } catch (error) {
            console.error('Failed to set cache:', key, error);
            return false;
        }
    }

    get(key) {
        try {
            const entry = this.cache.get(key);
            
            if (!entry || !this.isValidCacheEntry(entry)) {
                this.delete(key);
                return null;
            }

            console.log(`Cache hit: ${key}`);
            return entry.data;
        } catch (error) {
            console.error('Failed to get cache:', key, error);
            return null;
        }
    }

    has(key) {
        const entry = this.cache.get(key);
        return entry && this.isValidCacheEntry(entry);
    }

    delete(key) {
        try {
            this.cache.delete(key);
            this.storage.removeItem(this.cachePrefix + key);
            console.log(`Cache deleted: ${key}`);
            return true;
        } catch (error) {
            console.error('Failed to delete cache:', key, error);
            return false;
        }
    }

    clear() {
        try {
            // Clear in-memory cache
            this.cache.clear();
            
            // Clear localStorage
            const keys = Object.keys(this.storage).filter(key => key.startsWith(this.cachePrefix));
            keys.forEach(key => this.storage.removeItem(key));
            
            console.log('Cache cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    evictOldest() {
        try {
            let oldestKey = null;
            let oldestTimestamp = Date.now();

            for (const [key, entry] of this.cache.entries()) {
                if (entry.timestamp < oldestTimestamp) {
                    oldestTimestamp = entry.timestamp;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                this.delete(oldestKey);
                console.log(`Evicted oldest cache entry: ${oldestKey}`);
            }
        } catch (error) {
            console.error('Failed to evict oldest cache entry:', error);
        }
    }

    getStats() {
        const totalEntries = this.cache.size;
        const totalSize = JSON.stringify(Array.from(this.cache.entries())).length;
        
        return {
            totalEntries,
            totalSize,
            maxSize: this.maxCacheSize,
            defaultTTL: this.defaultTTL
        };
    }

    // Specialized cache methods for gallery
    setFolderTree(data) {
        return this.set('folder_tree', data, 30 * 60 * 1000); // 30 minutes
    }

    getFolderTree() {
        return this.get('folder_tree');
    }

    setStats(data) {
        return this.set('gallery_stats', data, 10 * 60 * 1000); // 10 minutes
    }

    getStats() {
        return this.get('gallery_stats');
    }

    setGalleryData(path, data) {
        const key = `gallery_${btoa(path).replace(/[^a-zA-Z0-9]/g, '')}`;
        return this.set(key, data, 5 * 60 * 1000); // 5 minutes
    }

    getGalleryData(path) {
        const key = `gallery_${btoa(path).replace(/[^a-zA-Z0-9]/g, '')}`;
        return this.get(key);
    }

    // Cache invalidation methods
    invalidateGalleryData() {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.startsWith('gallery_') && key !== 'gallery_stats') {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
        console.log(`Invalidated ${keysToDelete.length} gallery cache entries`);
    }

    invalidateAll() {
        this.clear();
        console.log('All cache invalidated');
    }

    // Refresh specific data
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
}

// Export for use in main script
window.CacheManager = CacheManager;
