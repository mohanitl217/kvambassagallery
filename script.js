// ===============================================================
// Modern School Gallery - Enhanced Frontend JavaScript
// ===============================================================

class ModernSchoolGallery {
    constructor() {
        // Configuration
        this.API_URL = 'mock-api'; // Using mock API for demonstration
        
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
        
        // Initialize cache and progress managers
        this.cache = new CacheManager();
        this.progressBar = null;
        
        // UI elements cache
        this.elements = {};
        
        // Initialize application
        this.init();
    }

    async init() {
        try {
            this.cacheElements();
            this.setupEventListeners();
            this.handleTheme();
            
            // Initialize progress bar for gallery loading
            this.progressBar = new ProgressBar('gallery-progress', {
                showPercentage: false,
                showText: true,
                animated: true,
                color: 'primary',
                size: 'medium'
            });
            
            if (this.sessionToken) {
                await this.checkSession();
            }
            
            await this.fetchFolderTree();
            await this.updateStats();
            this.renderRecentUploads();
            
            // Handle initial navigation
            const initialSection = window.location.hash.slice(1) || 'home';
            this.navigateToSection(initialSection);
            
            console.log('Modern School Gallery initialized successfully');
        } catch (error) {
            console.error('Failed to initialize gallery:', error);
            this.showNotification('Error', 'Failed to initialize gallery. Please refresh the page.', 'error');
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
        
        // File preview
        this.elements.filePreviewContainer = document.getElementById('file-preview-container');
        this.elements.filePreviewList = document.getElementById('file-preview-list');
        this.elements.clearFilesBtn = document.getElementById('clear-files');
        
        // Upload progress
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
        this.elements.lightboxCounter = document.getElementById('lightbox-counter');
        this.elements.lightboxClose = document.getElementById('lightbox-close');
        this.elements.lightboxPrev = document.getElementById('lightbox-prev');
        this.elements.lightboxNext = document.getElementById('lightbox-next');
        this.elements.lightboxDownload = document.getElementById('lightbox-download');
        this.elements.lightboxZoomIn = document.getElementById('lightbox-zoom-in');
        this.elements.lightboxZoomOut = document.getElementById('lightbox-zoom-out');
        this.elements.lightboxFullscreen = document.getElementById('lightbox-fullscreen');
        this.elements.lightboxBackdrop = document.querySelector('.lightbox-backdrop');
        
        // Theme toggle
        this.elements.themeToggle = document.getElementById('theme-toggle');
        this.elements.moonIcon = document.querySelector('.moon');
        this.elements.sunIcon = document.querySelector('.sun');
        
        // Toast notifications
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
    }

    setupEventListeners() {
        // Navigation
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) this.navigateToSection(section);
            });
        });

        // Gallery controls
        if (this.elements.occasionSelect) {
            this.elements.occasionSelect.addEventListener('change', () => this.populateYearSelect());
        }
        if (this.elements.yearSelect) {
            this.elements.yearSelect.addEventListener('change', () => this.populateSubfolderSelect());
        }
        if (this.elements.subfolderSelect) {
            this.elements.subfolderSelect.addEventListener('change', () => this.updateViewButton());
        }
        if (this.elements.viewAlbumBtn) {
            this.elements.viewAlbumBtn.addEventListener('click', () => this.loadGallery());
        }
        if (this.elements.refreshCacheBtn) {
            this.elements.refreshCacheBtn.addEventListener('click', () => this.refreshCache());
        }
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => this.filterGallery(e.target.value));
        }

        // View toggles
        this.elements.viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const view = toggle.dataset.view;
                this.setView(view);
            });
        });

        // Authentication
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => this.showLoginModal());
        }
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.elements.loginModalClose) {
            this.elements.loginModalClose.addEventListener('click', () => this.hideLoginModal());
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Toast close
        if (this.elements.toastClose) {
            this.elements.toastClose.addEventListener('click', () => this.hideToast());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Modal backdrop clicks
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    const modal = backdrop.closest('.modal');
                    if (modal) modal.classList.add('hidden');
                }
            });
        });

        // Lightbox events
        if (this.elements.lightboxClose) {
            this.elements.lightboxClose.addEventListener('click', () => this.hideLightbox());
        }
        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        }
        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.addEventListener('click', () => this.navigateLightbox(1));
        }
        if (this.elements.lightboxBackdrop) {
            this.elements.lightboxBackdrop.addEventListener('click', () => this.hideLightbox());
        }
    }

    // ===============================================================
    // Cache Management
    // ===============================================================
    
    async refreshCache() {
        try {
            this.showNotification('Cache', 'Refreshing data...', 'info');
            
            // Show refresh icon animation
            const refreshIcon = this.elements.refreshCacheBtn?.querySelector('i');
            if (refreshIcon) {
                refreshIcon.style.animation = 'spin 1s linear infinite';
            }
            
            // Clear relevant cache entries
            this.cache.invalidateAll();
            
            // Refresh data
            await this.fetchFolderTree(true);
            await this.updateStats(true);
            
            this.showNotification('Success', 'Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Failed to refresh cache:', error);
            this.showNotification('Error', 'Failed to refresh data', 'error');
        } finally {
            // Stop refresh animation
            const refreshIcon = this.elements.refreshCacheBtn?.querySelector('i');
            if (refreshIcon) {
                refreshIcon.style.animation = '';
            }
        }
    }

    // ===============================================================
    // API Calls with Enhanced Caching
    // ===============================================================
    
    async fetchFolderTree(forceRefresh = false) {
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedData = this.cache.getFolderTree();
                if (cachedData) {
                    console.log('Using cached folder tree');
                    this.folderTree = cachedData;
                    this.populateOccasionSelect();
                    return cachedData;
                }
            }
            
            const response = await window.mockFetch(`${this.API_URL}?action=getFolderTree`, {
                method: 'POST',
                body: JSON.stringify({ action: 'getFolderTree' })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch folder tree');
            }
            
            // Transform the nested folder tree to flat structure expected by the UI
            const flatStructure = this.transformFolderTree(result.data);
            
            // Cache the data
            this.cache.setFolderTree(flatStructure);
            this.folderTree = flatStructure;
            this.populateOccasionSelect();
            
            return flatStructure;
        } catch (error) {
            console.error('Failed to fetch folder tree:', error);
            throw error;
        }
    }
    
    // Transform nested folder tree to flat structure for UI compatibility
    transformFolderTree(nestedTree) {
        const flatStructure = {};
        
        if (nestedTree && nestedTree.children) {
            nestedTree.children.forEach(category => {
                if (category.children) {
                    category.children.forEach(folder => {
                        if (!flatStructure[category.name]) {
                            flatStructure[category.name] = {};
                        }
                        if (!flatStructure[category.name]['2024']) {
                            flatStructure[category.name]['2024'] = {};
                        }
                        flatStructure[category.name]['2024'][folder.name] = folder.id;
                    });
                }
            });
        }
        
        return flatStructure;
    }

    async updateStats(forceRefresh = false) {
        try {
            // Check cache first unless force refresh
            if (!forceRefresh) {
                const cachedStats = this.cache.getStats();
                if (cachedStats) {
                    console.log('Using cached stats');
                    this.displayStats(cachedStats);
                    return cachedStats;
                }
            }
            
            const response = await window.mockFetch(`${this.API_URL}?action=getStats`, {
                method: 'POST',
                body: JSON.stringify({ action: 'getStats' })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch stats');
            }
            
            // Cache the stats
            this.cache.setStats(result.data);
            this.displayStats(result.data);
            
            return stats;
        } catch (error) {
            console.error('Failed to update stats:', error);
            
            // Show error state in stats
            const statElements = [this.elements.totalPhotos, this.elements.totalVideos, this.elements.totalSize];
            statElements.forEach(element => {
                if (element) {
                    element.innerHTML = '<span class="error-text">Error</span>';
                }
            });
        }
    }

    displayStats(stats) {
        // Use LoadingBar to complete the loading states
        if (this.elements.totalPhotos) {
            LoadingBar.create(this.elements.totalPhotos).complete(stats.totalFiles?.toLocaleString() || '0');
        }
        if (this.elements.totalVideos) {
            LoadingBar.create(this.elements.totalVideos).complete(stats.totalFolders?.toLocaleString() || '0');
        }
        if (this.elements.totalSize) {
            LoadingBar.create(this.elements.totalSize).complete(stats.totalSize || '0 B');
        }
    }

    async loadGallery() {
        try {
            const occasion = this.elements.occasionSelect?.value;
            const year = this.elements.yearSelect?.value;
            const subfolder = this.elements.subfolderSelect?.value;
            
            if (!occasion || !year || !subfolder) {
                this.showNotification('Error', 'Please select all required filters', 'error');
                return;
            }
            
            const path = `${occasion}/${year}/${subfolder}`;
            
            // Check cache first
            const cachedData = this.cache.getGalleryData(path);
            if (cachedData) {
                console.log('Using cached gallery data for:', path);
                this.galleryFiles = cachedData;
                this.displayGallery(cachedData);
                return;
            }
            
            // Show progress bar
            this.progressBar.show('Loading gallery...');
            this.progressBar.indeterminate();
            
            // Hide gallery grid and empty message
            if (this.elements.galleryGrid) this.elements.galleryGrid.innerHTML = '';
            if (this.elements.emptyMessage) this.elements.emptyMessage.classList.add('hidden');
            
            const response = await window.mockFetch(`${this.API_URL}?action=getFolderFiles`, {
                method: 'POST',
                body: JSON.stringify({ action: 'getFolderFiles', folderId: subfolder })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to load gallery');
            }
            
            // Cache the gallery data
            this.cache.setGalleryData(path, result.data);
            
            this.galleryFiles = result.data || [];
            this.displayGallery(this.galleryFiles);
            
            // Complete progress bar
            this.progressBar.success(`Loaded ${this.galleryFiles.length} items`);
            setTimeout(() => {
                this.progressBar.hide();
            }, 2000);
            
        } catch (error) {
            console.error('Failed to load gallery:', error);
            this.progressBar.error('Failed to load gallery');
            setTimeout(() => {
                this.progressBar.hide();
            }, 3000);
            this.showNotification('Error', 'Failed to load gallery', 'error');
        }
    }

    // ===============================================================
    // Gallery Display
    // ===============================================================
    
    displayGallery(files) {
        if (!this.elements.galleryGrid) return;
        
        this.filteredFiles = files;
        
        if (!files || files.length === 0) {
            this.elements.galleryGrid.innerHTML = '';
            if (this.elements.emptyMessage) {
                this.elements.emptyMessage.classList.remove('hidden');
            }
            return;
        }
        
        if (this.elements.emptyMessage) {
            this.elements.emptyMessage.classList.add('hidden');
        }
        
        this.elements.galleryGrid.innerHTML = files.map((file, index) => {
            const isVideo = file.mimeType?.startsWith('video/');
            const thumbnailUrl = file.thumbnailLink || file.webViewLink;
            
            return `
                <div class="gallery-item" onclick="gallery.openLightbox(${index})" data-index="${index}">
                    <div class="gallery-item-image-container">
                        ${isVideo ? 
                            `<video class="gallery-item-image" src="${thumbnailUrl}" preload="metadata">
                                <div class="video-overlay">
                                    <i data-lucide="play-circle"></i>
                                </div>
                            </video>` :
                            `<img class="gallery-item-image" src="${thumbnailUrl}" alt="${file.name}" loading="lazy">`
                        }
                    </div>
                    <div class="gallery-item-content">
                        <h3 class="gallery-item-title">${file.name}</h3>
                        <div class="gallery-item-meta">
                            <div class="gallery-item-type">
                                <i data-lucide="${isVideo ? 'video' : 'image'}"></i>
                                <span>${isVideo ? 'Video' : 'Photo'}</span>
                            </div>
                            <span class="gallery-item-size">${this.formatFileSize(file.size)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    filterGallery(searchTerm) {
        if (!this.galleryFiles) return;
        
        const filtered = this.galleryFiles.filter(file => 
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.displayGallery(filtered);
    }

    setView(view) {
        this.currentView = view;
        
        // Update toggle buttons
        this.elements.viewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });
        
        // Update gallery grid classes
        if (this.elements.galleryGrid) {
            this.elements.galleryGrid.className = `gallery-grid ${view === 'list' ? 'list-view' : ''}`;
        }
    }

    // ===============================================================
    // Folder Navigation
    // ===============================================================
    
    populateOccasionSelect() {
        if (!this.elements.occasionSelect || !this.folderTree) return;
        
        const occasions = Object.keys(this.folderTree);
        this.elements.occasionSelect.innerHTML = '<option value="">Select Occasion</option>' +
            occasions.map(occasion => `<option value="${occasion}">${occasion}</option>`).join('');
    }

    populateYearSelect() {
        const occasion = this.elements.occasionSelect?.value;
        if (!occasion || !this.folderTree?.[occasion]) {
            this.resetYearSelect();
            return;
        }
        
        const years = Object.keys(this.folderTree[occasion]).sort((a, b) => b.localeCompare(a));
        this.elements.yearSelect.innerHTML = '<option value="">Any Year</option>' +
            years.map(year => `<option value="${year}">${year}</option>`).join('');
        this.elements.yearSelect.disabled = false;
        
        this.resetSubfolderSelect();
    }

    populateSubfolderSelect() {
        const occasion = this.elements.occasionSelect?.value;
        const year = this.elements.yearSelect?.value;
        
        if (!occasion || !year || !this.folderTree?.[occasion]?.[year]) {
            this.resetSubfolderSelect();
            return;
        }
        
        const subfolders = this.folderTree[occasion][year];
        this.elements.subfolderSelect.innerHTML = '<option value="">Any Album</option>' +
            subfolders.map(folder => `<option value="${folder}">${folder}</option>`).join('');
        this.elements.subfolderSelect.disabled = false;
        
        this.updateViewButton();
    }

    resetYearSelect() {
        if (this.elements.yearSelect) {
            this.elements.yearSelect.innerHTML = '<option value="">Any Year</option>';
            this.elements.yearSelect.disabled = true;
        }
        this.resetSubfolderSelect();
    }

    resetSubfolderSelect() {
        if (this.elements.subfolderSelect) {
            this.elements.subfolderSelect.innerHTML = '<option value="">Any Album</option>';
            this.elements.subfolderSelect.disabled = true;
        }
        this.updateViewButton();
    }

    updateViewButton() {
        const hasSelection = this.elements.occasionSelect?.value && 
                           this.elements.yearSelect?.value && 
                           this.elements.subfolderSelect?.value;
        
        if (this.elements.viewAlbumBtn) {
            this.elements.viewAlbumBtn.disabled = !hasSelection;
        }
    }

    // ===============================================================
    // Lightbox
    // ===============================================================
    
    openLightbox(index) {
        if (!this.filteredFiles || !this.filteredFiles[index]) return;
        
        this.currentLightboxIndex = index;
        const file = this.filteredFiles[index];
        
        // Show modal
        if (this.elements.lightboxModal) {
            this.elements.lightboxModal.classList.remove('hidden');
        }
        
        // Update content
        if (this.elements.lightboxTitle) {
            this.elements.lightboxTitle.textContent = file.name;
        }
        if (this.elements.lightboxFilename) {
            this.elements.lightboxFilename.textContent = `${this.formatFileSize(file.size)}`;
        }
        if (this.elements.lightboxCounter) {
            this.elements.lightboxCounter.textContent = `${index + 1} of ${this.filteredFiles.length}`;
        }
        
        // Show appropriate media
        const isVideo = file.mimeType?.startsWith('video/');
        
        if (isVideo) {
            if (this.elements.lightboxVideo) {
                this.elements.lightboxVideo.src = file.webViewLink;
                this.elements.lightboxVideo.classList.remove('hidden');
            }
            if (this.elements.lightboxImage) {
                this.elements.lightboxImage.classList.add('hidden');
            }
        } else {
            if (this.elements.lightboxImage) {
                this.elements.lightboxImage.src = file.webViewLink;
                this.elements.lightboxImage.alt = file.name;
                this.elements.lightboxImage.classList.remove('hidden');
            }
            if (this.elements.lightboxVideo) {
                this.elements.lightboxVideo.classList.add('hidden');
            }
        }
        
        // Update navigation buttons
        this.updateLightboxNavigation();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    navigateLightbox(direction) {
        const newIndex = this.currentLightboxIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.filteredFiles.length) {
            this.openLightbox(newIndex);
        }
    }

    updateLightboxNavigation() {
        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.disabled = this.currentLightboxIndex <= 0;
        }
        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.disabled = this.currentLightboxIndex >= this.filteredFiles.length - 1;
        }
    }

    hideLightbox() {
        if (this.elements.lightboxModal) {
            this.elements.lightboxModal.classList.add('hidden');
        }
        
        // Stop videos
        if (this.elements.lightboxVideo) {
            this.elements.lightboxVideo.pause();
            this.elements.lightboxVideo.src = '';
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // ===============================================================
    // Navigation
    // ===============================================================
    
    navigateToSection(sectionId) {
        // Update URL
        window.location.hash = sectionId;
        
        // Update navigation
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === sectionId);
        });
        
        // Update sections
        this.elements.sections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
        
        // Handle admin-only sections
        if (sectionId === 'upload' && !this.isAuthenticated) {
            this.showLoginModal();
            return;
        }
    }

    // ===============================================================
    // Authentication
    // ===============================================================
    
    showLoginModal() {
        if (this.elements.loginModal) {
            this.elements.loginModal.classList.remove('hidden');
        }
        if (this.elements.usernameInput) {
            this.elements.usernameInput.focus();
        }
    }

    hideLoginModal() {
        if (this.elements.loginModal) {
            this.elements.loginModal.classList.add('hidden');
        }
        if (this.elements.loginError) {
            this.elements.loginError.classList.add('hidden');
        }
        
        // Clear form
        if (this.elements.loginForm) {
            this.elements.loginForm.reset();
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
            const response = await window.mockFetch(`${this.API_URL}?action=authenticate`, {
                method: 'POST',
                body: JSON.stringify({ action: 'authenticate', username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isAuthenticated = true;
                this.sessionToken = result.data.token;
                sessionStorage.setItem('adminToken', result.data.token);
                
                this.updateUIForAuthentication();
                this.hideLoginModal();
                this.showNotification('Success', 'Login successful', 'success');
                
                // Navigate to upload section
                this.navigateToSection('upload');
            } else {
                this.showLoginError(result.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showLoginError('Login failed. Please try again.');
        }
    }

    showLoginError(message) {
        if (this.elements.loginError) {
            this.elements.loginError.textContent = message;
            this.elements.loginError.classList.remove('hidden');
        }
    }

    handleLogout() {
        this.isAuthenticated = false;
        this.sessionToken = null;
        sessionStorage.removeItem('adminToken');
        
        this.updateUIForAuthentication();
        this.navigateToSection('home');
        this.showNotification('Success', 'Logged out successfully', 'success');
    }

    async checkSession() {
        try {
            const response = await window.mockFetch(`${this.API_URL}?action=checkSession`, {
                method: 'POST',
                body: JSON.stringify({ action: 'checkSession', token: this.sessionToken })
            });
            
            const result = await response.json();
            
            if (result.success && result.data.valid) {
                this.isAuthenticated = true;
                this.updateUIForAuthentication();
            } else {
                this.handleLogout();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            this.handleLogout();
        }
    }

    updateUIForAuthentication() {
        this.elements.adminOnly.forEach(element => {
            element.classList.toggle('hidden', !this.isAuthenticated);
        });
        
        this.elements.loginOnly.forEach(element => {
            element.classList.toggle('hidden', this.isAuthenticated);
        });
    }

    // ===============================================================
    // Theme Management
    // ===============================================================
    
    handleTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeIcons(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcons(newTheme);
    }

    updateThemeIcons(theme) {
        if (this.elements.moonIcon && this.elements.sunIcon) {
            this.elements.moonIcon.classList.toggle('hidden', theme === 'dark');
            this.elements.sunIcon.classList.toggle('hidden', theme === 'light');
        }
    }

    // ===============================================================
    // Notifications
    // ===============================================================
    
    showNotification(title, message, type = 'info') {
        if (!this.elements.toast) return;
        
        // Set content
        if (this.elements.toastTitle) {
            this.elements.toastTitle.textContent = title;
        }
        if (this.elements.toastMessage) {
            this.elements.toastMessage.textContent = message;
        }
        
        // Set type
        this.elements.toast.className = `toast ${type}`;
        
        // Update icon
        if (this.elements.toastIcon) {
            const icons = {
                success: 'check',
                error: 'x',
                warning: 'alert-triangle',
                info: 'info'
            };
            this.elements.toastIcon.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i>`;
        }
        
        // Show toast
        this.elements.toast.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    hideToast() {
        if (this.elements.toast) {
            this.elements.toast.classList.add('hidden');
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
            }
        }
        
        // Modal close
        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    }

    // ===============================================================
    // Utility Functions
    // ===============================================================
    
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    renderRecentUploads() {
        if (!this.elements.recentUploadsGrid) return;
        
        if (this.recentUploads.length === 0) {
            this.elements.recentUploadsGrid.innerHTML = '<p class="empty-text">No recent uploads</p>';
            return;
        }
        
        this.elements.recentUploadsGrid.innerHTML = this.recentUploads.slice(0, 6).map(upload => `
            <div class="recent-upload-item">
                <img src="${upload.thumbnail}" alt="${upload.name}" loading="lazy">
                <div class="recent-upload-info">
                    <span class="recent-upload-name">${upload.name}</span>
                    <span class="recent-upload-date">${new Date(upload.uploadedAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }
}

// Global navigation function for buttons
function navigateToSection(sectionId) {
    if (window.gallery) {
        window.gallery.navigateToSection(sectionId);
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new ModernSchoolGallery();
});

// Handle browser back/forward navigation
window.addEventListener('hashchange', () => {
    const section = window.location.hash.slice(1) || 'home';
    if (window.gallery) {
        window.gallery.navigateToSection(section);
    }
});
