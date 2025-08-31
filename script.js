// ===============================================================
// Modern School Gallery - Enhanced Main Script with Error Handling
// ===============================================================

class ModernSchoolGallery {
    constructor() {
        // Configuration with fallback
        this.API_URL = 'https://script.google.com/macros/s/AKfycbz4cuJPjpo3ww7vTmJso-BK6doOW1x1C2KqpHp1KawmmvHZaZ68yN0P2E37rHzJSRgHkQ/exec';
        
        // Initialize managers
        this.cache = new CacheManager();
        this.progressBars = new Map();
        
        // State management
        this.folderTree = null;
        this.galleryFiles = [];
        this.filteredFiles = [];
        this.currentLightboxIndex = 0;
        this.isAuthenticated = false;
        this.sessionToken = sessionStorage.getItem('adminToken');
        this.currentView = 'grid';
        this.uploadQueue = [];
        this.recentUploads = JSON.parse(localStorage.getItem('recentUploads') || '[]');
        this.uploadInProgress = false;
        this.currentUploadController = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.initializationAttempts = 0;
        
        // UI elements cache
        this.elements = {};
        
        // Bind methods
        this.handleError = this.handleError.bind(this);
        this.retryInitialization = this.retryInitialization.bind(this);
        this.navigateToSection = this.navigateToSection.bind(this);
        
        // Initialize application with error boundary
        this.initializeWithErrorHandling();
    }

    async initializeWithErrorHandling() {
        try {
            await this.init();
        } catch (error) {
            console.error('Critical initialization error:', error);
            this.showErrorBoundary(error);
        }
    }

    async init() {
        try {
            console.log('Initializing Kendriya Vidyalaya Gallery...');
            
            // Show initialization progress
            this.showInitializationProgress();
            
            // Cache elements first
            this.cacheElements();
            
            // Setup basic event listeners
            this.setupEventListeners();
            
            // Handle theme
            this.handleTheme();
            
            // Update progress
            this.updateInitProgress(25, 'Setting up authentication...');
            
            // Check session
            if (this.sessionToken) {
                await this.checkSession();
            }
            
            // Update progress
            this.updateInitProgress(50, 'Loading folder structure...');
            
            // Fetch folder tree with caching
            await this.fetchFolderTreeWithCache();
            
            // Update progress
            this.updateInitProgress(75, 'Loading statistics...');
            
            // Update stats with loading indicators
            await this.updateStatsWithProgress();
            
            // Render recent uploads
            this.renderRecentUploads();
            
            // Update progress
            this.updateInitProgress(90, 'Finalizing setup...');
            
            // Handle initial navigation
            const initialSection = window.location.hash.slice(1) || 'home';
            this.navigateToSection(initialSection);
            
            // Complete initialization
            this.updateInitProgress(100, 'Gallery ready!');
            
            setTimeout(() => {
                this.hideInitializationProgress();
            }, 1000);
            
            console.log('Kendriya Vidyalaya Gallery initialized successfully');
            this.showNotification('Success', 'Gallery loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            
            // Increment attempt counter
            this.initializationAttempts++;
            
            if (this.initializationAttempts < this.maxRetries) {
                console.log(`Retrying initialization (attempt ${this.initializationAttempts}/${this.maxRetries})...`);
                this.showRetryNotification();
                
                // Exponential backoff
                const delay = Math.pow(2, this.initializationAttempts) * 1000;
                setTimeout(() => {
                    this.retryInitialization();
                }, delay);
            } else {
                this.hideInitializationProgress();
                this.handleInitializationFailure(error);
            }
        }
    }

    showInitializationProgress() {
        const container = document.createElement('div');
        container.id = 'initialization-progress';
        container.className = 'initialization-progress';
        container.innerHTML = `
            <div class="init-progress-content">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb b/ba/KVS_SVG_logo.svg/1200px-KVS_SVG_logo.svg.png" 
                     alt="KVS Logo" class="init-logo">
                <h2>Kendriya Vidyalaya Ambassa</h2>
                <p>Loading Gallery...</p>
                <div class="init-progress-bar">
                    <div class="init-progress-fill" id="init-progress-fill"></div>
                </div>
                <div class="init-progress-text" id="init-progress-text">Initializing...</div>
            </div>
        `;
        
        // Add styles
        container.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, var(--primary-50), var(--secondary-50));
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
        `;
        
        const content = container.querySelector('.init-progress-content');
        content.style.cssText = `
            text-align: center;
            background: white;
            padding: 3rem;
            border-radius: 2rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 400px;
            width: 90%;
        `;
        
        const logo = container.querySelector('.init-logo');
        logo.style.cssText = `
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 1.5rem;
        `;
        
        const progressBar = container.querySelector('.init-progress-bar');
        progressBar.style.cssText = `
            width: 100%;
            height: 12px;
            background: var(--gray-200);
            border-radius: 9999px;
            overflow: hidden;
            margin: 1.5rem 0 1rem;
        `;
        
        const progressFill = container.querySelector('.init-progress-fill');
        progressFill.style.cssText = `
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--kv-primary), var(--primary-500));
            border-radius: 9999px;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        document.body.appendChild(container);
    }

    updateInitProgress(percentage, text) {
        const fill = document.getElementById('init-progress-fill');
        const textEl = document.getElementById('init-progress-text');
        
        if (fill) {
            fill.style.width = `${percentage}%`;
        }
        
        if (textEl) {
            textEl.textContent = text;
        }
    }

    hideInitializationProgress() {
        const container = document.getElementById('initialization-progress');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'scale(0.95)';
            container.style.transition = 'all 0.3s ease-out';
            
            setTimeout(() => {
                container.remove();
            }, 300);
        }
    }

    showRetryNotification() {
        this.showNotification(
            'Retrying...',
            `Loading failed. Attempting retry ${this.initializationAttempts}/${this.maxRetries}...`,
            'warning'
        );
    }

    async retryInitialization() {
        // Clear any existing error UI
        this.hideErrorBoundary();
        
        // Reset state
        this.folderTree = null;
        this.galleryFiles = [];
        this.filteredFiles = [];
        
        // Try initialization again
        await this.init();
    }

    handleInitializationFailure(error) {
        console.error('All initialization attempts failed:', error);
        
        // Show detailed error information
        const errorMessage = this.getDetailedErrorMessage(error);
        this.showErrorBoundary(error, errorMessage);
        
        // Show persistent error notification
        this.showNotification(
            'Initialization Failed',
            'Unable to load the gallery. Please check your connection and try again.',
            'error',
            0 // Don't auto-hide
        );
    }

    getDetailedErrorMessage(error) {
        if (!navigator.onLine) {
            return 'No internet connection detected. Please check your network connection and try again.';
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return 'Unable to connect to the server. The service may be temporarily unavailable.';
        }
        
        if (error.status === 403) {
            return 'Access denied. The gallery service may require authentication.';
        }
        
        if (error.status === 500) {
            return 'Server error occurred. Please try again later.';
        }
        
        return error.message || 'An unexpected error occurred during initialization.';
    }

    showErrorBoundary(error, customMessage = null) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = customMessage || this.getDetailedErrorMessage(error);
            errorBoundary.classList.remove('hidden');
        }
    }

    hideErrorBoundary() {
        const errorBoundary = document.getElementById('error-boundary');
        if (errorBoundary) {
            errorBoundary.classList.add('hidden');
        }
    }

    // ===============================================================
    // Element Caching & Setup
    // ===============================================================
    
    cacheElements() {
        // Navigation
        this.elements.navLinks = document.querySelectorAll('.nav-link');
        this.elements.sections = document.querySelectorAll('.section');
        
        // Gallery controls
        this.elements.occasionSelect = document.getElementById('occasion-select');
        this.elements.yearSelect = document.getElementById('year-select');
        this.elements.subfolderSelect = document.getElementById('subfolder-select');
        this.elements.viewAlbumBtn = document.getElementById('view-album-btn');
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.viewToggles = document.querySelectorAll('.view-toggle');
        this.elements.refreshCacheBtn = document.getElementById('refresh-cache-btn');
        
        // Gallery display
        this.elements.galleryGrid = document.getElementById('gallery-grid');
        this.elements.galleryProgress = document.getElementById('gallery-progress');
        this.elements.emptyMessage = document.getElementById('empty-message');
        
        // Authentication
        this.elements.loginBtn = document.getElementById('login-btn');
        this.elements.logoutBtn = document.getElementById('logout-btn');
        this.elements.loginModal = document.getElementById('login-modal');
        this.elements.loginForm = document.getElementById('login-form');
        this.elements.loginModalClose = document.getElementById('login-modal-close');
        this.elements.loginError = document.getElementById('login-error');
        this.elements.usernameInput = document.getElementById('username');
        this.elements.passwordInput = document.getElementById('password');
        
        // Upload
        this.elements.uploadForm = document.getElementById('upload-form');
        this.elements.createFolderForm = document.getElementById('create-folder-form');
        this.elements.folderSelectUpload = document.getElementById('folder-select-upload');
        this.elements.parentFolderSelect = document.getElementById('parent-folder-select');
        this.elements.fileInput = document.getElementById('file-input');
        this.elements.fileDropZone = document.getElementById('file-drop-zone');
        this.elements.newFolderName = document.getElementById('new-folder-name');
        
        // File preview and progress
        this.elements.filePreviewContainer = document.getElementById('file-preview-container');
        this.elements.filePreviewList = document.getElementById('file-preview-list');
        this.elements.clearFilesBtn = document.getElementById('clear-files');
        this.elements.uploadProgressPanel = document.getElementById('upload-progress-panel');
        this.elements.overallProgressBar = document.getElementById('overall-progress-bar');
        this.elements.overallPercentage = document.getElementById('overall-percentage');
        this.elements.uploadStats = document.getElementById('upload-stats');
        this.elements.uploadSpeed = document.getElementById('upload-speed');
        this.elements.fileProgressList = document.getElementById('file-progress-list');
        this.elements.cancelUpload = document.getElementById('cancel-upload');
        
        // Recent uploads
        this.elements.recentUploadsGrid = document.getElementById('recent-uploads-grid');
        this.elements.refreshRecent = document.getElementById('refresh-recent');
        
        // Lightbox
        this.elements.lightboxModal = document.getElementById('lightbox-modal');
        this.elements.lightboxImage = document.getElementById('lightbox-image');
        this.elements.lightboxVideo = document.getElementById('lightbox-video');
        this.elements.lightboxTitle = document.getElementById('lightbox-title');
        this.elements.lightboxFilename = document.getElementById('lightbox-filename');
        this.elements.lightboxDetails = document.getElementById('lightbox-details');
        this.elements.lightboxCounter = document.getElementById('lightbox-counter');
        this.elements.lightboxClose = document.getElementById('lightbox-close');
        this.elements.lightboxPrev = document.getElementById('lightbox-prev');
        this.elements.lightboxNext = document.getElementById('lightbox-next');
        this.elements.lightboxDownload = document.getElementById('lightbox-download');
        this.elements.lightboxZoomIn = document.getElementById('lightbox-zoom-in');
        this.elements.lightboxZoomOut = document.getElementById('lightbox-zoom-out');
        this.elements.lightboxFullscreen = document.getElementById('lightbox-fullscreen');
        this.elements.lightboxBackdrop = document.querySelector('.lightbox-backdrop');
        
        // Theme and notifications
        this.elements.themeToggle = document.getElementById('theme-toggle');
        this.elements.moonIcon = document.querySelector('.moon');
        this.elements.sunIcon = document.querySelector('.sun');
        this.elements.toast = document.getElementById('notification-toast');
        this.elements.toastIcon = document.getElementById('toast-icon');
        this.elements.toastTitle = document.getElementById('toast-title');
        this.elements.toastMessage = document.getElementById('toast-message');
        this.elements.toastClose = document.getElementById('toast-close');
        
        // Stats
        this.elements.totalPhotos = document.getElementById('total-photos');
        this.elements.totalVideos = document.getElementById('total-videos');
        this.elements.totalSize = document.getElementById('total-size');
        
        // Admin-only elements
        this.elements.adminOnly = document.querySelectorAll('.admin-only');
        this.elements.loginOnly = document.querySelectorAll('.login-only');
        
        // Error boundary
        this.elements.retryBtn = document.getElementById('retry-initialization');
    }

    setupEventListeners() {
        // Navigation
        this.elements.navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) this.navigateToSection(section);
            });
        });

        // Gallery controls
        this.elements.occasionSelect?.addEventListener('change', () => this.populateYearSelect());
        this.elements.yearSelect?.addEventListener('change', () => this.populateSubfolderSelect());
        this.elements.subfolderSelect?.addEventListener('change', () => this.updateViewButton());
        this.elements.viewAlbumBtn?.addEventListener('click', () => this.loadGallery());
        this.elements.searchInput?.addEventListener('input', (e) => this.filterGallery(e.target.value));
        this.elements.refreshCacheBtn?.addEventListener('click', () => this.refreshCache());

        // View toggles
        this.elements.viewToggles?.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const view = toggle.dataset.view;
                this.setView(view);
            });
        });

        // Authentication
        this.elements.loginBtn?.addEventListener('click', () => this.showLoginModal());
        this.elements.logoutBtn?.addEventListener('click', () => this.handleLogout());
        this.elements.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.elements.loginModalClose?.addEventListener('click', () => this.hideLoginModal());

        // Upload
        this.elements.uploadForm?.addEventListener('submit', (e) => this.handleUpload(e));
        this.elements.createFolderForm?.addEventListener('submit', (e) => this.handleCreateFolder(e));
        this.elements.clearFilesBtn?.addEventListener('click', () => this.clearFileSelection());
        this.elements.cancelUpload?.addEventListener('click', () => this.cancelUpload());
        this.elements.refreshRecent?.addEventListener('click', () => this.renderRecentUploads());
        
        this.setupFileDropZone();

        // Lightbox
        this.elements.lightboxClose?.addEventListener('click', () => this.hideLightbox());
        this.elements.lightboxPrev?.addEventListener('click', () => this.navigateLightbox(-1));
        this.elements.lightboxNext?.addEventListener('click', () => this.navigateLightbox(1));
        this.elements.lightboxDownload?.addEventListener('click', () => this.downloadCurrentImage());
        this.elements.lightboxZoomIn?.addEventListener('click', () => this.zoomImage(1.2));
        this.elements.lightboxZoomOut?.addEventListener('click', () => this.zoomImage(0.8));
        this.elements.lightboxFullscreen?.addEventListener('click', () => this.toggleFullscreen());
        this.elements.lightboxBackdrop?.addEventListener('click', () => this.hideLightbox());

        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Toast close
        this.elements.toastClose?.addEventListener('click', () => this.hideToast());

        // Error boundary retry
        this.elements.retryBtn?.addEventListener('click', () => this.retryInitialization());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Modal backdrop clicks
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.hideAllModals();
                }
            });
        });

        // Online/offline detection
        window.addEventListener('online', () => {
            this.showNotification('Connection Restored', 'Internet connection is back online.', 'success');
            this.retryFailedOperations();
        });

        window.addEventListener('offline', () => {
            this.showNotification('Connection Lost', 'You are now offline. Some features may be limited.', 'warning');
        });
    }

    // ===============================================================
    // API Communication with Retry Logic
    // ===============================================================

    async makeAPICall(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
            const response = await fetch(`${this.API_URL}?action=${endpoint}`, {
                method: 'GET',
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - please check your connection');
            }
            
            throw error;
        }
    }

    async makeAPICallWithRetry(endpoint, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    console.log(`Retrying API call (${attempt}/${maxRetries}) after ${delay}ms...`);
                    await this.delay(delay);
                }
                
                const result = await this.makeAPICall(endpoint, options);
                
                // Reset retry count on success
                if (endpoint === 'getFolders') {
                    this.initializationAttempts = 0;
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                console.error(`API call attempt ${attempt + 1} failed:`, error);
                
                // Don't retry on certain errors
                if (error.message.includes('403') || error.message.includes('401')) {
                    throw error;
                }
            }
        }
        
        throw lastError;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===============================================================
    // Cache Management
    // ===============================================================

    async fetchFolderTreeWithCache() {
        try {
            // Try to get from cache first
            const cachedTree = this.cache.getFolderTree();
            if (cachedTree) {
                console.log('Using cached folder tree');
                this.folderTree = cachedTree;
                this.populateOccasionSelect();
                this.populateUploadFolders();
                return;
            }
            
            // Fetch from API with retry
            console.log('Fetching folder tree from API...');
            const data = await this.makeAPICallWithRetry('getFolders');
            
            this.folderTree = data.folders || {};
            
            // Cache the result
            this.cache.setFolderTree(this.folderTree);
            
            this.populateOccasionSelect();
            this.populateUploadFolders();
            
        } catch (error) {
            console.error('Failed to fetch folder tree:', error);
            
            // Try to use stale cache data
            const staleData = this.cache.get('folder_tree');
            if (staleData) {
                console.log('Using stale cache data');
                this.folderTree = staleData.data;
                this.populateOccasionSelect();
                this.populateUploadFolders();
                
                this.showNotification(
                    'Using Cached Data',
                    'Displaying previously loaded data. Some information may be outdated.',
                    'warning'
                );
            } else {
                throw new Error('Unable to load folder structure: ' + error.message);
            }
        }
    }

    async updateStatsWithProgress() {
        try {
            // Check cache first
            const cachedStats = this.cache.getStats();
            if (cachedStats) {
                console.log('Using cached stats');
                this.displayStats(cachedStats);
                return;
            }
            
            // Show loading bars
            this.showStatsLoading();
            
            // Fetch from API
            console.log('Fetching stats from API...');
            const data = await this.makeAPICallWithRetry('getStats');
            
            const stats = {
                totalPhotos: data.totalPhotos || 0,
                totalVideos: data.totalVideos || 0,
                totalSize: data.totalSize || '0 MB'
            };
            
            // Cache the result
            this.cache.setStats(stats);
            
            // Display with animation
            this.displayStats(stats);
            
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            this.displayStatsError();
        }
    }

    showStatsLoading() {
        const loadingBars = [
            LoadingBar.create(this.elements.totalPhotos),
            LoadingBar.create(this.elements.totalVideos),
            LoadingBar.create(this.elements.totalSize)
        ];
        
        this.statsLoadingBars = loadingBars;
    }

    displayStats(stats) {
        // Animate stats display
        setTimeout(() => {
            if (this.elements.totalPhotos) {
                this.elements.totalPhotos.innerHTML = this.animateNumber(0, stats.totalPhotos, 1000);
            }
        }, 200);
        
        setTimeout(() => {
            if (this.elements.totalVideos) {
                this.elements.totalVideos.innerHTML = this.animateNumber(0, stats.totalVideos, 1000);
            }
        }, 400);
        
        setTimeout(() => {
            if (this.elements.totalSize) {
                this.elements.totalSize.innerHTML = stats.totalSize;
            }
        }, 600);
    }

    displayStatsError() {
        if (this.statsLoadingBars) {
            this.statsLoadingBars.forEach(bar => {
                if (bar) bar.error('Error');
            });
        }
    }

    animateNumber(start, end, duration) {
        const startTime = Date.now();
        const element = document.createElement('span');
        element.textContent = start.toString();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.round(start + (end - start) * progress);
            
            element.textContent = current.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
        return element.outerHTML;
    }

    async refreshCache() {
        try {
            // Show loading state
            if (this.elements.refreshCacheBtn) {
                this.elements.refreshCacheBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>Refreshing...</span>';
                this.elements.refreshCacheBtn.disabled = true;
            }
            
            // Clear all cache
            this.cache.invalidateAll();
            
            // Show progress
            const progressBar = new ProgressBar('gallery-progress', {
                showText: true,
                animated: true,
                color: 'primary'
            });
            
            progressBar.show('Refreshing data...');
            
            // Refresh folder tree
            progressBar.setProgress(25, 'Refreshing folder structure...');
            await this.fetchFolderTreeWithCache();
            
            // Refresh stats
            progressBar.setProgress(75, 'Refreshing statistics...');
            await this.updateStatsWithProgress();
            
            // Complete
            progressBar.setProgress(100, 'Refresh complete!');
            
            setTimeout(() => {
                progressBar.hide();
            }, 1000);
            
            this.showNotification('Cache Refreshed', 'All data has been updated successfully.', 'success');
            
        } catch (error) {
            console.error('Failed to refresh cache:', error);
            this.showNotification('Refresh Failed', 'Unable to refresh data. Please try again.', 'error');
        } finally {
            // Reset refresh button
            if (this.elements.refreshCacheBtn) {
                this.elements.refreshCacheBtn.innerHTML = '<i data-lucide="refresh-cw"></i><span>Refresh</span>';
                this.elements.refreshCacheBtn.disabled = false;
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    // ===============================================================
    // Gallery Management
    // ===============================================================

    populateOccasionSelect() {
        if (!this.elements.occasionSelect || !this.folderTree) return;
        
        // Clear existing options except the first one
        this.elements.occasionSelect.innerHTML = '<option value="">Select Occasion</option>';
        
        // Add occasions
        Object.keys(this.folderTree).forEach(occasion => {
            const option = document.createElement('option');
            option.value = occasion;
            option.textContent = this.formatOccasionName(occasion);
            this.elements.occasionSelect.appendChild(option);
        });
    }

    formatOccasionName(occasion) {
        return occasion.replace(/[-_]/g, ' ')
                     .replace(/\b\w/g, l => l.toUpperCase());
    }

    populateYearSelect() {
        const occasionSelect = this.elements.occasionSelect;
        const yearSelect = this.elements.yearSelect;
        
        if (!occasionSelect || !yearSelect) return;
        
        const selectedOccasion = occasionSelect.value;
        
        // Reset year select
        yearSelect.innerHTML = '<option value="">Any Year</option>';
        yearSelect.disabled = !selectedOccasion;
        
        if (selectedOccasion && this.folderTree[selectedOccasion]) {
            const years = Object.keys(this.folderTree[selectedOccasion]).sort().reverse();
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
            
            yearSelect.disabled = false;
        }
        
        // Reset dependent selects
        this.populateSubfolderSelect();
    }

    populateSubfolderSelect() {
        const occasionSelect = this.elements.occasionSelect;
        const yearSelect = this.elements.yearSelect;
        const subfolderSelect = this.elements.subfolderSelect;
        
        if (!occasionSelect || !yearSelect || !subfolderSelect) return;
        
        const selectedOccasion = occasionSelect.value;
        const selectedYear = yearSelect.value;
        
        // Reset subfolder select
        subfolderSelect.innerHTML = '<option value="">Any Album</option>';
        subfolderSelect.disabled = !selectedOccasion || !selectedYear;
        
        if (selectedOccasion && selectedYear && 
            this.folderTree[selectedOccasion] && 
            this.folderTree[selectedOccasion][selectedYear]) {
            
            const subfolders = this.folderTree[selectedOccasion][selectedYear];
            subfolders.forEach(subfolder => {
                const option = document.createElement('option');
                option.value = subfolder;
                option.textContent = this.formatOccasionName(subfolder);
                subfolderSelect.appendChild(option);
            });
            
            subfolderSelect.disabled = false;
        }
        
        this.updateViewButton();
    }

    updateViewButton() {
        const viewBtn = this.elements.viewAlbumBtn;
        if (!viewBtn) return;
        
        const occasion = this.elements.occasionSelect?.value;
        const year = this.elements.yearSelect?.value;
        
        viewBtn.disabled = !occasion || !year;
        
        if (occasion && year) {
            const subfolder = this.elements.subfolderSelect?.value;
            const path = subfolder ? `${occasion}/${year}/${subfolder}` : `${occasion}/${year}`;
            viewBtn.onclick = () => this.loadGallery(path);
        }
    }

    async loadGallery(customPath = null) {
        try {
            let path = customPath;
            
            if (!path) {
                const occasion = this.elements.occasionSelect?.value;
                const year = this.elements.yearSelect?.value;
                const subfolder = this.elements.subfolderSelect?.value;
                
                if (!occasion || !year) {
                    this.showNotification('Selection Required', 'Please select an occasion and year.', 'warning');
                    return;
                }
                
                path = subfolder ? `${occasion}/${year}/${subfolder}` : `${occasion}/${year}`;
            }
            
            // Show loading progress
            const progressBar = new ProgressBar('gallery-progress', {
                showText: true,
                animated: true,
                color: 'primary'
            });
            
            progressBar.show('Loading gallery...');
            
            // Check cache first
            const cachedData = this.cache.getGalleryData(path);
            if (cachedData) {
                console.log('Using cached gallery data for:', path);
                progressBar.setProgress(50, 'Loading from cache...');
                this.displayGallery(cachedData.files);
                progressBar.success('Gallery loaded!');
                
                setTimeout(() => progressBar.hide(), 1500);
                return;
            }
            
            progressBar.setProgress(25, 'Fetching images...');
            
            // Fetch from API
            const data = await this.makeAPICallWithRetry('getFiles', {
                method: 'POST',
                body: JSON.stringify({ path })
            });
            
            progressBar.setProgress(75, 'Processing images...');
            
            const files = data.files || [];
            
            // Cache the result
            this.cache.setGalleryData(path, { files, path });
            
            progressBar.setProgress(90, 'Rendering gallery...');
            
            // Display gallery
            this.displayGallery(files);
            
            progressBar.success('Gallery loaded successfully!');
            
            setTimeout(() => progressBar.hide(), 1500);
            
        } catch (error) {
            console.error('Failed to load gallery:', error);
            
            const progressBar = this.progressBars.get('gallery-progress');
            if (progressBar) {
                progressBar.error('Failed to load gallery');
                setTimeout(() => progressBar.hide(), 3000);
            }
            
            this.showNotification('Loading Failed', 'Unable to load gallery. Please try again.', 'error');
            this.showEmptyState();
        }
    }

    displayGallery(files) {
        const galleryGrid = this.elements.galleryGrid;
        const emptyMessage = this.elements.emptyMessage;
        
        if (!galleryGrid) return;
        
        if (!files || files.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Hide empty state
        if (emptyMessage) {
            emptyMessage.classList.add('hidden');
        }
        
        // Store files for lightbox and filtering
        this.galleryFiles = files;
        this.filteredFiles = files;
        
        // Render gallery items
        galleryGrid.innerHTML = '';
        files.forEach((file, index) => {
            const item = this.createGalleryItem(file, index);
            galleryGrid.appendChild(item);
        });
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    createGalleryItem(file, index) {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.onclick = () => this.openLightbox(index);
        
        const isVideo = this.isVideoFile(file.name);
        const fileType = isVideo ? 'video' : 'photo';
        
        item.innerHTML = `
            <div class="gallery-item-type">${fileType}</div>
            <img src="${file.thumbnailUrl || file.url}" 
                 alt="${file.name}" 
                 class="gallery-item-image"
                 loading="lazy">
            <div class="gallery-item-info">
                <div class="gallery-item-title">${this.truncateFilename(file.name)}</div>
                <div class="gallery-item-details">
                    <span>${this.formatFileSize(file.size || 0)}</span>
                    <span>${this.formatDate(file.dateCreated)}</span>
                </div>
            </div>
        `;
        
        return item;
    }

    isVideoFile(filename) {
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        const extension = filename.split('.').pop()?.toLowerCase();
        return videoExtensions.includes(extension);
    }

    truncateFilename(filename, maxLength = 30) {
        if (filename.length <= maxLength) return filename;
        
        const extension = filename.split('.').pop();
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4);
        
        return `${truncatedName}...${extension}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showEmptyState() {
        const galleryGrid = this.elements.galleryGrid;
        const emptyMessage = this.elements.emptyMessage;
        
        if (galleryGrid) {
            galleryGrid.innerHTML = '';
        }
        
        if (emptyMessage) {
            emptyMessage.classList.remove('hidden');
        }
    }

    filterGallery(searchTerm) {
        if (!this.galleryFiles) return;
        
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredFiles = this.galleryFiles;
        } else {
            this.filteredFiles = this.galleryFiles.filter(file => 
                file.name.toLowerCase().includes(term) ||
                (file.tags && file.tags.some(tag => tag.toLowerCase().includes(term)))
            );
        }
        
        this.displayGallery(this.filteredFiles);
    }

    setView(view) {
        this.currentView = view;
        
        // Update toggle states
        this.elements.viewToggles?.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });
        
        // Update gallery grid class
        const galleryGrid = this.elements.galleryGrid;
        if (galleryGrid) {
            galleryGrid.className = `gallery-grid ${view}-view`;
        }
    }

    // ===============================================================
    // Navigation & UI Management
    // ===============================================================

    navigateToSection(sectionId) {
        // Update URL
        window.history.pushState({}, '', `#${sectionId}`);
        
        // Hide all sections
        this.elements.sections?.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        this.elements.navLinks?.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });
        
        // Handle section-specific logic
        if (sectionId === 'gallery' && !this.galleryFiles.length) {
            // Auto-load some default data if available
            if (this.folderTree && Object.keys(this.folderTree).length > 0) {
                const firstOccasion = Object.keys(this.folderTree)[0];
                const firstYear = Object.keys(this.folderTree[firstOccasion])[0];
                
                if (this.elements.occasionSelect) {
                    this.elements.occasionSelect.value = firstOccasion;
                    this.populateYearSelect();
                    
                    if (this.elements.yearSelect) {
                        this.elements.yearSelect.value = firstYear;
                        this.populateSubfolderSelect();
                        this.updateViewButton();
                    }
                }
            }
        }
    }

    // ===============================================================
    // Authentication
    // ===============================================================

    async checkSession() {
        if (!this.sessionToken) return false;
        
        try {
            const response = await this.makeAPICall('checkSession', {
                method: 'POST',
                body: JSON.stringify({ token: this.sessionToken })
            });
            
            if (response.valid) {
                this.isAuthenticated = true;
                this.showAdminUI();
                return true;
            } else {
                this.sessionToken = null;
                sessionStorage.removeItem('adminToken');
                return false;
            }
        } catch (error) {
            console.error('Session check failed:', error);
            return false;
        }
    }

    showLoginModal() {
        const modal = this.elements.loginModal;
        if (modal) {
            modal.classList.remove('hidden');
            
            // Focus on username input
            setTimeout(() => {
                this.elements.usernameInput?.focus();
            }, 100);
        }
    }

    hideLoginModal() {
        const modal = this.elements.loginModal;
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Clear form
        if (this.elements.loginForm) {
            this.elements.loginForm.reset();
        }
        
        // Clear error
        if (this.elements.loginError) {
            this.elements.loginError.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.elements.usernameInput?.value;
        const password = this.elements.passwordInput?.value;
        
        if (!username || !password) {
            this.showLoginError('Please enter both username and password');
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>Logging in...</span>';
                submitBtn.disabled = true;
            }
            
            const response = await this.makeAPICall('login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (response.success && response.token) {
                this.sessionToken = response.token;
                sessionStorage.setItem('adminToken', response.token);
                this.isAuthenticated = true;
                
                this.hideLoginModal();
                this.showAdminUI();
                this.showNotification('Login Successful', 'Welcome to the admin panel!', 'success');
            } else {
                this.showLoginError(response.message || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showLoginError('Login failed. Please check your connection and try again.');
        } finally {
            // Reset submit button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = originalText || '<i data-lucide="log-in"></i><span>Login</span>';
                submitBtn.disabled = false;
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    showLoginError(message) {
        const errorElement = this.elements.loginError;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    handleLogout() {
        this.sessionToken = null;
        sessionStorage.removeItem('adminToken');
        this.isAuthenticated = false;
        
        this.hideAdminUI();
        this.showNotification('Logged Out', 'You have been logged out successfully.', 'info');
        
        // Redirect to home
        this.navigateToSection('home');
    }

    showAdminUI() {
        this.elements.adminOnly?.forEach(element => {
            element.classList.remove('hidden');
        });
        
        this.elements.loginOnly?.forEach(element => {
            element.classList.add('hidden');
        });
    }

    hideAdminUI() {
        this.elements.adminOnly?.forEach(element => {
            element.classList.add('hidden');
        });
        
        this.elements.loginOnly?.forEach(element => {
            element.classList.remove('hidden');
        });
    }

    // ===============================================================
    // File Upload with Progress
    // ===============================================================

    setupFileDropZone() {
        const dropZone = this.elements.fileDropZone;
        const fileInput = this.elements.fileInput;
        
        if (!dropZone || !fileInput) return;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        }, false);
        
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });
        
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleFileSelection(files) {
        if (!files || files.length === 0) return;
        
        this.uploadQueue = Array.from(files).filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
            
            if (!isValidType) {
                this.showNotification('Invalid File', `${file.name} is not a valid image or video file.`, 'error');
                return false;
            }
            
            if (!isValidSize) {
                this.showNotification('File Too Large', `${file.name} exceeds the 50MB size limit.`, 'error');
                return false;
            }
            
            return true;
        });
        
        this.displayFilePreview();
    }

    displayFilePreview() {
        const container = this.elements.filePreviewContainer;
        const list = this.elements.filePreviewList;
        
        if (!container || !list || this.uploadQueue.length === 0) return;
        
        container.classList.remove('hidden');
        list.innerHTML = '';
        
        this.uploadQueue.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            
            const isVideo = file.type.startsWith('video/');
            
            item.innerHTML = `
                <div class="file-preview-thumb">
                    ${isVideo ? '<i data-lucide="video"></i>' : '<i data-lucide="image"></i>'}
                </div>
                <div class="file-preview-info">
                    <div class="file-preview-name">${file.name}</div>
                    <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button type="button" class="file-preview-remove" onclick="gallery.removeFileFromQueue(${index})">
                    <i data-lucide="x"></i>
                </button>
            `;
            
            list.appendChild(item);
        });
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    removeFileFromQueue(index) {
        this.uploadQueue.splice(index, 1);
        
        if (this.uploadQueue.length === 0) {
            this.clearFileSelection();
        } else {
            this.displayFilePreview();
        }
    }

    clearFileSelection() {
        this.uploadQueue = [];
        
        const container = this.elements.filePreviewContainer;
        const fileInput = this.elements.fileInput;
        
        if (container) {
            container.classList.add('hidden');
        }
        
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async handleUpload(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) {
            this.showNotification('Authentication Required', 'Please login to upload files.', 'error');
            return;
        }
        
        if (this.uploadQueue.length === 0) {
            this.showNotification('No Files Selected', 'Please select files to upload.', 'warning');
            return;
        }
        
        const folder = this.elements.folderSelectUpload?.value;
        if (!folder) {
            this.showNotification('Folder Required', 'Please select a destination folder.', 'warning');
            return;
        }
        
        try {
            this.uploadInProgress = true;
            this.showUploadProgress();
            
            const totalFiles = this.uploadQueue.length;
            let completedFiles = 0;
            
            for (let i = 0; i < this.uploadQueue.length; i++) {
                const file = this.uploadQueue[i];
                
                try {
                    await this.uploadSingleFile(file, folder, i);
                    completedFiles++;
                    
                    const overallProgress = (completedFiles / totalFiles) * 100;
                    this.updateOverallProgress(overallProgress, `Uploaded ${completedFiles}/${totalFiles} files`);
                    
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    this.updateFileProgress(i, 100, 'error', `Failed: ${error.message}`);
                }
            }
            
            // Complete upload
            this.completeUpload(completedFiles, totalFiles);
            
        } catch (error) {
            console.error('Upload process failed:', error);
            this.showNotification('Upload Failed', error.message, 'error');
        } finally {
            this.uploadInProgress = false;
        }
    }

    showUploadProgress() {
        const panel = this.elements.uploadProgressPanel;
        if (panel) {
            panel.classList.remove('hidden');
        }
        
        // Initialize file progress items
        const fileProgressList = this.elements.fileProgressList;
        if (fileProgressList) {
            fileProgressList.innerHTML = '';
            
            this.uploadQueue.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-progress-item';
                item.innerHTML = `
                    <div class="file-progress-header">
                        <span class="file-progress-name">${file.name}</span>
                        <span class="file-progress-size">${this.formatFileSize(file.size)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="file-progress-${index}"></div>
                    </div>
                    <div class="file-progress-status" id="file-status-${index}">Waiting...</div>
                `;
                
                fileProgressList.appendChild(item);
            });
        }
    }

    async uploadSingleFile(file, folder, index) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        formData.append('token', this.sessionToken);
        
        // Update file status
        this.updateFileProgress(index, 0, 'uploading', 'Uploading...');
        
        try {
            const response = await fetch(`${this.API_URL}?action=uploadFile`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            // Complete file upload
            this.updateFileProgress(index, 100, 'success', 'Completed');
            
            // Add to recent uploads
            this.addToRecentUploads({
                name: file.name,
                size: file.size,
                folder: folder,
                uploadTime: new Date().toISOString(),
                url: result.url
            });
            
            return result;
            
        } catch (error) {
            this.updateFileProgress(index, 100, 'error', `Failed: ${error.message}`);
            throw error;
        }
    }

    updateFileProgress(index, progress, status, statusText) {
        const progressBar = document.getElementById(`file-progress-${index}`);
        const statusElement = document.getElementById(`file-status-${index}`);
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
            
            // Update color based on status
            progressBar.className = `progress-fill ${status}`;
        }
        
        if (statusElement) {
            statusElement.textContent = statusText;
            statusElement.className = `file-progress-status ${status}`;
        }
    }

    updateOverallProgress(progress, statusText) {
        const progressBar = this.elements.overallProgressBar;
        const percentage = this.elements.overallPercentage;
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (percentage) {
            percentage.textContent = `${Math.round(progress)}%`;
        }
        
        // Update status text if needed
        const uploadStats = this.elements.uploadStats;
        if (uploadStats) {
            uploadStats.textContent = statusText;
        }
    }

    completeUpload(completed, total) {
        if (completed === total) {
            this.showNotification('Upload Complete', `Successfully uploaded ${completed} files!`, 'success');
        } else {
            this.showNotification('Upload Finished', `Uploaded ${completed}/${total} files. Some files failed.`, 'warning');
        }
        
        // Clear upload queue and hide progress after delay
        setTimeout(() => {
            this.clearFileSelection();
            this.hideUploadProgress();
            this.renderRecentUploads();
            
            // Invalidate gallery cache to show new uploads
            this.cache.invalidateGalleryData();
        }, 3000);
    }

    hideUploadProgress() {
        const panel = this.elements.uploadProgressPanel;
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    addToRecentUploads(uploadInfo) {
        this.recentUploads.unshift(uploadInfo);
        
        // Keep only last 20 uploads
        if (this.recentUploads.length > 20) {
            this.recentUploads = this.recentUploads.slice(0, 20);
        }
        
        // Save to localStorage
        localStorage.setItem('recentUploads', JSON.stringify(this.recentUploads));
    }

    renderRecentUploads() {
        const grid = this.elements.recentUploadsGrid;
        if (!grid) return;
        
        if (this.recentUploads.length === 0) {
            grid.innerHTML = `
                <div class="empty-recent">
                    <i data-lucide="upload"></i>
                    <p>No recent uploads</p>
                </div>
            `;
        } else {
            grid.innerHTML = '';
            
            this.recentUploads.slice(0, 6).forEach(upload => {
                const item = document.createElement('div');
                item.className = 'recent-upload-item';
                
                const timeAgo = this.getTimeAgo(upload.uploadTime);
                
                item.innerHTML = `
                    <div class="recent-upload-thumb">
                        ${this.isVideoFile(upload.name) ? '<i data-lucide="video"></i>' : '<i data-lucide="image"></i>'}
                    </div>
                    <div class="recent-upload-info">
                        <div class="recent-upload-name">${this.truncateFilename(upload.name, 20)}</div>
                        <div class="recent-upload-details">
                            <span>${this.formatFileSize(upload.size)}</span>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                `;
                
                grid.appendChild(item);
            });
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getTimeAgo(dateString) {
        const now = new Date();
        const uploadTime = new Date(dateString);
        const diffInMinutes = Math.floor((now - uploadTime) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return uploadTime.toLocaleDateString();
    }

    populateUploadFolders() {
        const select = this.elements.folderSelectUpload;
        const parentSelect = this.elements.parentFolderSelect;
        
        if (!this.folderTree) return;
        
        // Populate upload folder select
        if (select) {
            select.innerHTML = '<option value="">Select Destination</option>';
            
            Object.keys(this.folderTree).forEach(occasion => {
                Object.keys(this.folderTree[occasion]).forEach(year => {
                    const folderPath = `${occasion}/${year}`;
                    const option = document.createElement('option');
                    option.value = folderPath;
                    option.textContent = `${this.formatOccasionName(occasion)} - ${year}`;
                    select.appendChild(option);
                    
                    // Add subfolders
                    if (this.folderTree[occasion][year] && this.folderTree[occasion][year].length) {
                        this.folderTree[occasion][year].forEach(subfolder => {
                            const subOption = document.createElement('option');
                            subOption.value = `${occasion}/${year}/${subfolder}`;
                            subOption.textContent = `${this.formatOccasionName(occasion)} - ${year} - ${this.formatOccasionName(subfolder)}`;
                            select.appendChild(subOption);
                        });
                    }
                });
            });
        }
        
        // Populate parent folder select for new folder creation
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">Root Directory</option>';
            
            Object.keys(this.folderTree).forEach(occasion => {
                const option = document.createElement('option');
                option.value = occasion;
                option.textContent = this.formatOccasionName(occasion);
                parentSelect.appendChild(option);
                
                Object.keys(this.folderTree[occasion]).forEach(year => {
                    const yearOption = document.createElement('option');
                    yearOption.value = `${occasion}/${year}`;
                    yearOption.textContent = `${this.formatOccasionName(occasion)} - ${year}`;
                    parentSelect.appendChild(yearOption);
                });
            });
        }
    }

    async handleCreateFolder(e) {
        e.preventDefault();
        
        if (!this.isAuthenticated) {
            this.showNotification('Authentication Required', 'Please login to create folders.', 'error');
            return;
        }
        
        const parentFolder = this.elements.parentFolderSelect?.value || '';
        const folderName = this.elements.newFolderName?.value?.trim();
        
        if (!folderName) {
            this.showNotification('Folder Name Required', 'Please enter a folder name.', 'warning');
            return;
        }
        
        // Validate folder name
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(folderName)) {
            this.showNotification('Invalid Name', 'Folder name can only contain letters, numbers, spaces, hyphens, and underscores.', 'error');
            return;
        }
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn?.innerHTML;
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i data-lucide="loader" class="animate-spin"></i><span>Creating...</span>';
                submitBtn.disabled = true;
            }
            
            const response = await this.makeAPICall('createFolder', {
                method: 'POST',
                body: JSON.stringify({
                    parentFolder,
                    folderName,
                    token: this.sessionToken
                })
            });
            
            if (response.success) {
                this.showNotification('Folder Created', `Successfully created folder "${folderName}".`, 'success');
                
                // Clear form
                if (this.elements.newFolderName) {
                    this.elements.newFolderName.value = '';
                }
                
                // Refresh folder tree
                this.cache.delete('folder_tree');
                await this.fetchFolderTreeWithCache();
            } else {
                throw new Error(response.message || 'Failed to create folder');
            }
            
        } catch (error) {
            console.error('Failed to create folder:', error);
            this.showNotification('Creation Failed', error.message, 'error');
        } finally {
            // Reset submit button
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn && originalText) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    // ===============================================================
    // Lightbox Implementation
    // ===============================================================

    openLightbox(index) {
        if (!this.filteredFiles || index < 0 || index >= this.filteredFiles.length) return;
        
        this.currentLightboxIndex = index;
        const file = this.filteredFiles[index];
        
        const modal = this.elements.lightboxModal;
        const image = this.elements.lightboxImage;
        const video = this.elements.lightboxVideo;
        const title = this.elements.lightboxTitle;
        const filename = this.elements.lightboxFilename;
        const details = this.elements.lightboxDetails;
        const counter = this.elements.lightboxCounter;
        
        if (!modal) return;
        
        // Update content
        if (title) title.textContent = this.truncateFilename(file.name, 50);
        if (filename) filename.textContent = file.name;
        if (details) details.textContent = `${this.formatFileSize(file.size || 0)} • ${this.formatDate(file.dateCreated)}`;
        if (counter) counter.textContent = `${index + 1} / ${this.filteredFiles.length}`;
        
        // Show appropriate media element
        const isVideo = this.isVideoFile(file.name);
        
        if (isVideo) {
            if (image) image.style.display = 'none';
            if (video) {
                video.src = file.url;
                video.style.display = 'block';
                video.load();
            }
        } else {
            if (video) video.style.display = 'none';
            if (image) {
                image.src = file.url;
                image.alt = file.name;
                image.style.display = 'block';
            }
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Focus management for accessibility
        modal.setAttribute('aria-hidden', 'false');
        this.elements.lightboxClose?.focus();
        
        // Disable body scroll
        document.body.style.overflow = 'hidden';
    }

    hideLightbox() {
        const modal = this.elements.lightboxModal;
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        
        // Reset media
        if (this.elements.lightboxVideo) {
            this.elements.lightboxVideo.src = '';
        }
        
        // Enable body scroll
        document.body.style.overflow = '';
    }

    navigateLightbox(direction) {
        if (!this.filteredFiles || this.filteredFiles.length === 0) return;
        
        let newIndex = this.currentLightboxIndex + direction;
        
        // Handle wraparound
        if (newIndex < 0) {
            newIndex = this.filteredFiles.length - 1;
        } else if (newIndex >= this.filteredFiles.length) {
            newIndex = 0;
        }
        
        this.openLightbox(newIndex);
    }

    downloadCurrentImage() {
        if (!this.filteredFiles || this.currentLightboxIndex < 0) return;
        
        const file = this.filteredFiles[this.currentLightboxIndex];
        if (!file) return;
        
        // Create download link
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Download Started', `Downloading ${file.name}...`, 'info');
    }

    zoomImage(factor) {
        const image = this.elements.lightboxImage;
        if (!image || image.style.display === 'none') return;
        
        const currentScale = parseFloat(image.style.transform.replace('scale(', '').replace(')', '')) || 1;
        const newScale = Math.max(0.5, Math.min(3, currentScale * factor));
        
        image.style.transform = `scale(${newScale})`;
        image.style.transformOrigin = 'center center';
    }

    toggleFullscreen() {
        const modal = this.elements.lightboxModal;
        if (!modal) return;
        
        if (!document.fullscreenElement) {
            modal.requestFullscreen?.() ||
            modal.webkitRequestFullscreen?.() ||
            modal.msRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() ||
            document.webkitExitFullscreen?.() ||
            document.msExitFullscreen?.();
        }
    }

    // ===============================================================
    // Theme Management
    // ===============================================================

    handleTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const moonIcon = this.elements.moonIcon;
        const sunIcon = this.elements.sunIcon;
        
        if (moonIcon && sunIcon) {
            if (theme === 'dark') {
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            } else {
                moonIcon.classList.remove('hidden');
                sunIcon.classList.add('hidden');
            }
        }
    }

    // ===============================================================
    // Keyboard Navigation
    // ===============================================================

    handleKeyboard(e) {
        // Lightbox navigation
        if (!this.elements.lightboxModal?.classList.contains('hidden')) {
            switch (e.key) {
                case 'Escape':
                    this.hideLightbox();
                    break;
                case 'ArrowLeft':
                    this.navigateLightbox(-1);
                    break;
                case 'ArrowRight':
                    this.navigateLightbox(1);
                    break;
                case 'd':
                case 'D':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        this.downloadCurrentImage();
                    }
                    break;
                case 'f':
                case 'F':
                    if (!e.ctrlKey) {
                        e.preventDefault();
                        this.toggleFullscreen();
                    }
                    break;
            }
            return;
        }
        
        // Modal management
        if (e.key === 'Escape') {
            this.hideAllModals();
        }
        
        // Quick navigation
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToSection('home');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToSection('gallery');
                    break;
                case '3':
                    e.preventDefault();
                    if (this.isAuthenticated) {
                        this.navigateToSection('upload');
                    }
                    break;
                case '4':
                    e.preventDefault();
                    this.navigateToSection('about');
                    break;
            }
        }
    }

    hideAllModals() {
        this.hideLoginModal();
        this.hideLightbox();
    }

    // ===============================================================
    // Notification System
    // ===============================================================

    showNotification(title, message, type = 'info', duration = 5000) {
        const toast = this.elements.toast;
        if (!toast) return;
        
        const toastIcon = this.elements.toastIcon;
        const toastTitle = this.elements.toastTitle;
        const toastMessage = this.elements.toastMessage;
        
        // Update content
        if (toastTitle) toastTitle.textContent = title;
        if (toastMessage) toastMessage.textContent = message;
        
        // Update icon
        if (toastIcon) {
            let iconName = 'info';
            switch (type) {
                case 'success':
                    iconName = 'check-circle';
                    break;
                case 'error':
                    iconName = 'alert-circle';
                    break;
                case 'warning':
                    iconName = 'alert-triangle';
                    break;
            }
            toastIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
        }
        
        // Update styling
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        
        // Auto-hide after duration (unless duration is 0)
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast();
            }, duration);
        }
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    hideToast() {
        const toast = this.elements.toast;
        if (toast) {
            toast.classList.add('hidden');
        }
    }

    // ===============================================================
    // Error Recovery
    // ===============================================================

    retryFailedOperations() {
        // Retry failed folder tree fetch
        if (!this.folderTree && navigator.onLine) {
            console.log('Retrying folder tree fetch...');
            this.fetchFolderTreeWithCache().catch(error => {
                console.error('Retry failed:', error);
            });
        }
        
        // Retry failed stats fetch
        if (navigator.onLine) {
            console.log('Retrying stats fetch...');
            this.updateStatsWithProgress().catch(error => {
                console.error('Stats retry failed:', error);
            });
        }
    }

    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        let userMessage = 'An unexpected error occurred.';
        
        if (!navigator.onLine) {
            userMessage = 'You are offline. Please check your internet connection.';
        } else if (error.message.includes('fetch')) {
            userMessage = 'Unable to connect to the server. Please try again later.';
        } else if (error.status === 403) {
            userMessage = 'Access denied. Please check your permissions.';
        } else if (error.status >= 500) {
            userMessage = 'Server error. Please try again later.';
        }
        
        this.showNotification('Error', userMessage, 'error');
        
        // Log detailed error for debugging
        if (window.console && console.error) {
            console.error('Detailed error info:', {
                error: error,
                context: context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            });
        }
    }
}

// ===============================================================
// Initialize Application
// ===============================================================

// Wait for DOM and dependencies to load
document.addEventListener('DOMContentLoaded', () => {
    // Check for required dependencies
    if (typeof CacheManager === 'undefined' || typeof ProgressBar === 'undefined') {
        console.error('Required dependencies not loaded');
        document.getElementById('error-boundary')?.classList.remove('hidden');
        return;
    }
    
    // Initialize gallery
    try {
        window.gallery = new ModernSchoolGallery();
        console.log('Kendriya Vidyalaya Gallery application started');
    } catch (error) {
        console.error('Failed to initialize gallery application:', error);
        
        // Show error boundary
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        
        if (errorBoundary && errorMessage) {
            errorMessage.textContent = 'Failed to start the application. Please refresh the page and try again.';
            errorBoundary.classList.remove('hidden');
        }
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.gallery) {
        // Page became visible again, retry any failed operations
        window.gallery.retryFailedOperations();
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    if (window.gallery && typeof window.gallery.handleError === 'function') {
        window.gallery.handleError(e.error, 'Global');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (window.gallery && typeof window.gallery.handleError === 'function') {
        window.gallery.handleError(e.reason, 'Promise');
    }
});

