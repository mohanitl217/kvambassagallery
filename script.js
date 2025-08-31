// ===============================================================
// Modern School Gallery - Enhanced Frontend JavaScript
// ===============================================================

class ModernSchoolGallery {
    constructor() {
        // Configuration
        this.API_URL = 'https://script.google.com/macros/s/AKfycbz4cuJPjpo3ww7vTmJso-BK6doOW1x1C2KqpHp1KawmmvHZaZ68yN0P2E37rHzJSRgHkQ/exec';
        
        // State management
        this.folderTree = null;
        this.galleryFiles = [];
        this.filteredFiles = [];
        this.currentLightboxIndex = 0;
        this.isAuthenticated = false;
        this.sessionToken = sessionStorage.getItem('adminToken');
        this.currentView = 'grid';
        this.uploadQueue = [];
        
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
            
            if (this.sessionToken) {
                await this.checkSession();
            }
            
            await this.fetchFolderTree();
            await this.updateStats();
            
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
        
        // Gallery display
        this.elements.galleryGrid = document.getElementById('gallery-grid');
        this.elements.loadingSpinner = document.getElementById('loading-spinner');
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
        this.elements.uploadProgressContainer = document.getElementById('upload-progress-container');
        this.elements.uploadProgressBar = document.getElementById('upload-progress-bar');
        this.elements.uploadStatus = document.getElementById('upload-status');
        this.elements.newFolderName = document.getElementById('new-folder-name');
        
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
        
        // Global loading
        this.elements.globalLoading = document.getElementById('global-loading');
        
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

        // Upload
        if (this.elements.uploadForm) {
            this.elements.uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }
        if (this.elements.createFolderForm) {
            this.elements.createFolderForm.addEventListener('submit', (e) => this.handleCreateFolder(e));
        }
        
        this.setupFileDropZone();

        // Lightbox
        if (this.elements.lightboxClose) {
            this.elements.lightboxClose.addEventListener('click', () => this.hideLightbox());
        }
        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        }
        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.addEventListener('click', () => this.navigateLightbox(1));
        }
        if (this.elements.lightboxDownload) {
            this.elements.lightboxDownload.addEventListener('click', () => this.downloadCurrentImage());
        }
        if (this.elements.lightboxBackdrop) {
            this.elements.lightboxBackdrop.addEventListener('click', () => this.hideLightbox());
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
                    this.hideLoginModal();
                }
            });
        });

        // Window events
        window.addEventListener('hashchange', () => {
            const section = window.location.hash.slice(1) || 'home';
            this.navigateToSection(section);
        });

        window.addEventListener('resize', () => this.handleResize());
    }

    setupFileDropZone() {
        if (!this.elements.fileDropZone || !this.elements.fileInput) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.elements.fileDropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.elements.fileDropZone.addEventListener(eventName, () => {
                this.elements.fileDropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.elements.fileDropZone.addEventListener(eventName, () => {
                this.elements.fileDropZone.classList.remove('drag-over');
            });
        });

        this.elements.fileDropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileSelection(files);
        });

        this.elements.fileDropZone.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
    }

    handleFileSelection(files) {
        if (files.length === 0) return;

        // Validate files
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            
            if (!isValidType) {
                this.showNotification('Invalid File', `${file.name} is not a supported file type.`, 'error');
                return false;
            }
            
            if (!isValidSize) {
                this.showNotification('File Too Large', `${file.name} exceeds the 10MB limit.`, 'error');
                return false;
            }
            
            return true;
        });

        if (validFiles.length > 0) {
            this.updateFileDropZone(validFiles);
        }
    }

    updateFileDropZone(files) {
        if (!files || files.length === 0) return;

        const content = this.elements.fileDropZone.querySelector('.drop-zone-content');
        if (content) {
            content.innerHTML = `
                <i data-lucide="file-check"></i>
                <p>${files.length} file${files.length > 1 ? 's' : ''} selected</p>
                <span>Ready to upload</span>
            `;
            
            // Reinitialize Lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    // ===============================================================
    // API Communication
    // ===============================================================
    
    async apiCall(action, body = {}, method = 'GET') {
        this.showGlobalLoading(true);
        
        try {
            let response;
            
            if (method === 'GET') {
                const params = new URLSearchParams(body);
                const url = `${this.API_URL}?action=${action}&${params.toString()}`;
                response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors'
                });
            } else {
                body.action = action;
                if (this.sessionToken) {
                    body.token = this.sessionToken;
                }
                
                response = await fetch(this.API_URL, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify(body),
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    }
                });
            }
            
            if (!response.ok) {
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }
            
            const textResponse = await response.text();
            let jsonResponse;
            
            try {
                jsonResponse = JSON.parse(textResponse);
            } catch (parseError) {
                console.error('Failed to parse response:', textResponse);
                throw new Error('Invalid response format from server');
            }
            
            if (jsonResponse.error) {
                throw new Error(jsonResponse.message || 'Unknown server error');
            }
            
            return jsonResponse;
            
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error', error.message || 'An unexpected error occurred', 'error');
            return null;
        } finally {
            this.showGlobalLoading(false);
        }
    }

    // ===============================================================
    // Navigation & UI Management
    // ===============================================================
    
    navigateToSection(sectionName) {
        // Update URL
        if (window.location.hash.slice(1) !== sectionName) {
            window.location.hash = sectionName;
        }
        
        // Hide all sections
        this.elements.sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        this.elements.navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load section-specific data
        if (sectionName === 'upload') {
            this.loadUploadFolders();
        }
    }

    showGlobalLoading(show) {
        if (this.elements.globalLoading) {
            this.elements.globalLoading.classList.toggle('hidden', !show);
        }
    }

    showSpinner(show) {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.classList.toggle('hidden', !show);
        }
    }

    showNotification(title, message, type = 'success') {
        if (!this.elements.toast) return;

        const icons = {
            success: '<i data-lucide="check-circle"></i>',
            error: '<i data-lucide="x-circle"></i>',
            warning: '<i data-lucide="alert-triangle"></i>',
            info: '<i data-lucide="info"></i>'
        };
        
        // Set content
        this.elements.toastTitle.textContent = title;
        this.elements.toastMessage.textContent = message;
        this.elements.toastIcon.innerHTML = icons[type] || icons.success;
        
        // Set class
        this.elements.toast.className = `toast toast-${type}`;
        this.elements.toast.classList.remove('hidden');
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Auto hide after 5 seconds
        setTimeout(() => this.hideToast(), 5000);
    }

    hideToast() {
        if (this.elements.toast) {
            this.elements.toast.classList.add('hidden');
        }
    }

    setView(viewType) {
        this.currentView = viewType;
        
        // Update toggle buttons
        this.elements.viewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === viewType);
        });
        
        // Update grid class
        if (this.elements.galleryGrid) {
            this.elements.galleryGrid.className = viewType === 'list' ? 'gallery-list' : 'gallery-grid';
        }
        
        // Re-render current gallery
        this.renderGallery(this.filteredFiles);
    }

    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth < 768) {
            // Mobile adjustments
            this.setView('grid');
        }
    }

    handleKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'k':
                    e.preventDefault();
                    if (this.elements.searchInput) {
                        this.elements.searchInput.focus();
                    }
                    break;
            }
        }
        
        // Lightbox navigation
        if (!this.elements.lightboxModal.classList.contains('hidden')) {
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
        
        // Modal handling
        if (e.key === 'Escape') {
            this.hideLoginModal();
        }
    }

    updateAdminUI(isLoggedIn) {
        this.isAuthenticated = isLoggedIn;
        
        this.elements.adminOnly.forEach(el => {
            el.classList.toggle('hidden', !isLoggedIn);
        });
        
        this.elements.loginOnly.forEach(el => {
            el.classList.toggle('hidden', isLoggedIn);
        });
        
        // Update delete buttons in gallery cards
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.classList.toggle('hidden', !isLoggedIn);
        });
    }

    // ===============================================================
    // Theme Management
    // ===============================================================
    
    handleTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', theme);
        
        if (this.elements.moonIcon && this.elements.sunIcon) {
            if (theme === 'dark') {
                this.elements.moonIcon.classList.add('hidden');
                this.elements.sunIcon.classList.remove('hidden');
            } else {
                this.elements.moonIcon.classList.remove('hidden');
                this.elements.sunIcon.classList.add('hidden');
            }
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        this.handleTheme();
        
        this.showNotification('Theme Changed', `Switched to ${newTheme} theme`, 'success');
    }

    // ===============================================================
    // Authentication
    // ===============================================================
    
    showLoginModal() {
        if (this.elements.loginModal) {
            this.elements.loginModal.classList.remove('hidden');
            if (this.elements.usernameInput) {
                this.elements.usernameInput.focus();
            }
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
        
        const result = await this.apiCall('login', { username, password }, 'POST');
        
        if (result?.success) {
            this.sessionToken = result.token;
            sessionStorage.setItem('adminToken', result.token);
            this.updateAdminUI(true);
            this.hideLoginModal();
            this.showNotification('Success', 'Logged in successfully!', 'success');
        } else {
            this.showLoginError(result?.message || 'Login failed. Please check your credentials.');
        }
    }

    showLoginError(message) {
        if (this.elements.loginError) {
            this.elements.loginError.textContent = message;
            this.elements.loginError.classList.remove('hidden');
        }
    }

    async handleLogout() {
        await this.apiCall('logout', { token: this.sessionToken }, 'POST');
        
        this.sessionToken = null;
        sessionStorage.removeItem('adminToken');
        this.updateAdminUI(false);
        this.showNotification('Success', 'Logged out successfully!', 'success');
        
        // Navigate to home
        this.navigateToSection('home');
    }

    async checkSession() {
        if (!this.sessionToken) return;
        
        const result = await this.apiCall('checkSession', { token: this.sessionToken }, 'POST');
        
        if (result?.success) {
            this.updateAdminUI(true);
        } else {
            this.sessionToken = null;
            sessionStorage.removeItem('adminToken');
            this.updateAdminUI(false);
        }
    }

    // ===============================================================
    // Data Loading
    // ===============================================================
    
    async fetchFolderTree() {
        const result = await this.apiCall('getFolderTree');
        
        if (result) {
            this.folderTree = result;
            this.populateOccasionSelect();
            this.populateUploadFolders();
        }
    }

    async updateStats() {
        const result = await this.apiCall('getStats');
        
        if (result && this.elements.totalPhotos) {
            this.elements.totalPhotos.textContent = result.totalImages || '0';
            this.elements.totalVideos.textContent = result.totalVideos || '0';
            this.elements.totalSize.textContent = result.totalSize || '0 MB';
        }
    }

    populateOccasionSelect() {
        if (!this.folderTree || !this.elements.occasionSelect) return;

        this.elements.occasionSelect.innerHTML = '<option value="">Select Occasion</option>';
        
        this.folderTree.children.forEach(occasion => {
            const option = document.createElement('option');
            option.value = occasion.id;
            option.textContent = `${occasion.name} (${occasion.fileCount || 0} files)`;
            this.elements.occasionSelect.appendChild(option);
        });
    }

    populateYearSelect() {
        if (!this.elements.yearSelect) return;

        const selectedOccasionId = this.elements.occasionSelect?.value;
        this.elements.yearSelect.innerHTML = '<option value="">Any Year</option>';
        this.elements.yearSelect.disabled = !selectedOccasionId;
        
        if (selectedOccasionId) {
            const occasion = this.folderTree.children.find(o => o.id === selectedOccasionId);
            if (occasion) {
                occasion.children.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year.id;
                    option.textContent = `${year.name} (${year.fileCount || 0} files)`;
                    this.elements.yearSelect.appendChild(option);
                });
            }
        }
        
        this.populateSubfolderSelect();
    }

    populateSubfolderSelect() {
        if (!this.elements.subfolderSelect) return;

        const selectedYearId = this.elements.yearSelect?.value;
        this.elements.subfolderSelect.innerHTML = '<option value="">Any Album</option>';
        this.elements.subfolderSelect.disabled = !selectedYearId;
        
        if (selectedYearId) {
            const year = this.findFolderById(selectedYearId);
            if (year && year.children) {
                year.children.forEach(subfolder => {
                    const option = document.createElement('option');
                    option.value = subfolder.id;
                    option.textContent = `${subfolder.name} (${subfolder.fileCount || 0} files)`;
                    this.elements.subfolderSelect.appendChild(option);
                });
            }
        }
        
        this.updateViewButton();
    }

    updateViewButton() {
        if (!this.elements.viewAlbumBtn) return;

        const hasSelection = this.elements.occasionSelect?.value || 
                           this.elements.yearSelect?.value || 
                           this.elements.subfolderSelect?.value;
        
        this.elements.viewAlbumBtn.disabled = !hasSelection;
    }

    findFolderById(id) {
        if (!this.folderTree) return null;
        
        const searchInFolder = (folder) => {
            if (folder.id === id) return folder;
            
            if (folder.children) {
                for (const child of folder.children) {
                    const found = searchInFolder(child);
                    if (found) return found;
                }
            }
            
            return null;
        };
        
        return searchInFolder(this.folderTree);
    }

    async loadGallery() {
        const folderId = this.elements.subfolderSelect?.value || 
                        this.elements.yearSelect?.value || 
                        this.elements.occasionSelect?.value;
        
        if (!folderId) {
            this.showNotification('Error', 'Please select a folder to view', 'error');
            return;
        }
        
        this.showSpinner(true);
        this.elements.emptyMessage?.classList.add('hidden');
        
        const action = this.elements.subfolderSelect?.value ? 'getFiles' : 'getFilesRecursive';
        const result = await this.apiCall(action, { folderId });
        
        this.showSpinner(false);
        
        if (result) {
            this.galleryFiles = result;
            this.filteredFiles = [...result];
            this.renderGallery(this.filteredFiles);
            
            // Clear search when loading new gallery
            if (this.elements.searchInput) {
                this.elements.searchInput.value = '';
            }
        }
    }

    filterGallery(searchTerm) {
        if (!searchTerm) {
            this.filteredFiles = [...this.galleryFiles];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredFiles = this.galleryFiles.filter(file =>
                file.name.toLowerCase().includes(term)
            );
        }
        
        this.renderGallery(this.filteredFiles);
    }

    renderGallery(files) {
        if (!this.elements.galleryGrid) return;

        if (files.length === 0) {
            this.elements.galleryGrid.innerHTML = '';
            this.elements.emptyMessage?.classList.remove('hidden');
            return;
        }
        
        this.elements.emptyMessage?.classList.add('hidden');
        
        const galleryHTML = files.map((file, index) => {
            const isVideo = file.mimeType.startsWith('video/');
            const thumbnailUrl = file.thumbnailUrl || file.directImageUrl;
            
            return `
                <div class="gallery-card" data-index="${index}" role="button" tabindex="0" aria-label="View ${file.name}">
                    <div class="gallery-media-container">
                        ${thumbnailUrl ? `
                            <img 
                                src="${thumbnailUrl}" 
                                alt="${file.name}" 
                                class="gallery-media"
                                loading="lazy"
                                onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEsMTUgMTYsMTAgNSwyMSI+PC9wb2x5bGluZT48L3N2Zz4='"
                            >
                        ` : `
                            <div class="gallery-media placeholder">
                                <i data-lucide="${isVideo ? 'video' : 'image'}"></i>
                            </div>
                        `}
                        
                        ${isVideo ? `
                            <div class="video-indicator">
                                <i data-lucide="play"></i>
                                <span>Video</span>
                            </div>
                        ` : ''}
                        
                        <div class="media-overlay">
                            <div class="media-info">
                                <div>${file.formattedSize || 'Unknown size'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gallery-card-content">
                        <h3 class="gallery-card-title">${file.name}</h3>
                        <div class="gallery-card-meta">
                            <span>${new Date(file.dateCreated).toLocaleDateString()}</span>
                            <span>${file.formattedSize || ''}</span>
                        </div>
                        
                        <div class="gallery-card-actions">
                            <button class="action-btn" onclick="window.open('${file.viewUrl}', '_blank')" aria-label="View in Google Drive">
                                <i data-lucide="external-link"></i>
                            </button>
                            <button class="action-btn" onclick="window.open('${file.downloadUrl}', '_blank')" aria-label="Download">
                                <i data-lucide="download"></i>
                            </button>
                            ${this.isAuthenticated ? `
                                <button class="action-btn delete-btn" onclick="gallery.deleteFile('${file.id}')" aria-label="Delete file">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        this.elements.galleryGrid.innerHTML = galleryHTML;
        
        // Add click listeners to gallery cards
        this.elements.galleryGrid.querySelectorAll('.gallery-card').forEach((card, index) => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.gallery-card-actions')) {
                    this.showLightbox(index);
                }
            });
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!e.target.closest('.gallery-card-actions')) {
                        this.showLightbox(index);
                    }
                }
            });
        });
        
        // Reinitialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ===============================================================
    // Lightbox
    // ===============================================================
    
    showLightbox(index) {
        if (!this.filteredFiles || this.filteredFiles.length === 0) return;
        
        this.currentLightboxIndex = index;
        this.elements.lightboxModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        this.updateLightboxContent();
    }

    hideLightbox() {
        this.elements.lightboxModal?.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Pause any playing video
        if (this.elements.lightboxVideo && !this.elements.lightboxVideo.paused) {
            this.elements.lightboxVideo.pause();
        }
    }

    navigateLightbox(direction) {
        if (!this.filteredFiles || this.filteredFiles.length === 0) return;
        
        this.currentLightboxIndex = (this.currentLightboxIndex + direction + this.filteredFiles.length) % this.filteredFiles.length;
        this.updateLightboxContent();
    }

    updateLightboxContent() {
        if (!this.filteredFiles || this.filteredFiles.length === 0) return;
        
        const file = this.filteredFiles[this.currentLightboxIndex];
        if (!file) return;
        
        const isVideo = file.mimeType.startsWith('video/');
        
        // Update title and details
        if (this.elements.lightboxTitle) {
            this.elements.lightboxTitle.textContent = 'Media Viewer';
        }
        if (this.elements.lightboxFilename) {
            this.elements.lightboxFilename.textContent = file.name;
        }
        if (this.elements.lightboxDetails) {
            const details = [
                new Date(file.dateCreated).toLocaleDateString(),
                file.formattedSize || 'Unknown size'
            ];
            if (file.mediaInfo?.width && file.mediaInfo?.height) {
                details.push(`${file.mediaInfo.width}×${file.mediaInfo.height}`);
            }
            this.elements.lightboxDetails.textContent = details.join(' • ');
        }
        if (this.elements.lightboxCounter) {
            this.elements.lightboxCounter.textContent = `${this.currentLightboxIndex + 1} of ${this.filteredFiles.length}`;
        }
        
        // Update media
        if (isVideo) {
            this.elements.lightboxImage?.classList.add('hidden');
            this.elements.lightboxVideo?.classList.remove('hidden');
            
            if (this.elements.lightboxVideo) {
                this.elements.lightboxVideo.src = file.directImageUrl || file.viewUrl;
                this.elements.lightboxVideo.poster = file.thumbnailUrl || '';
            }
        } else {
            this.elements.lightboxVideo?.classList.add('hidden');
            this.elements.lightboxImage?.classList.remove('hidden');
            
            if (this.elements.lightboxImage) {
                this.elements.lightboxImage.src = file.highResThumbnailUrl || file.directImageUrl || file.thumbnailUrl || '';
                this.elements.lightboxImage.alt = file.name;
            }
        }
        
        // Update download button
        if (this.elements.lightboxDownload) {
            this.elements.lightboxDownload.onclick = () => {
                window.open(file.downloadUrl, '_blank');
            };
        }
        
        // Update navigation button states
        if (this.elements.lightboxPrev) {
            this.elements.lightboxPrev.disabled = this.filteredFiles.length <= 1;
        }
        if (this.elements.lightboxNext) {
            this.elements.lightboxNext.disabled = this.filteredFiles.length <= 1;
        }
    }

    downloadCurrentImage() {
        if (this.filteredFiles && this.filteredFiles[this.currentLightboxIndex]) {
            const file = this.filteredFiles[this.currentLightboxIndex];
            window.open(file.downloadUrl, '_blank');
        }
    }

    // ===============================================================
    // File Upload
    // ===============================================================
    
    async loadUploadFolders() {
        if (!this.folderTree) return;
        
        const populateSelect = (select, folders, prefix = '') => {
            if (!select) return;
            
            select.innerHTML = '<option value="">Select Destination</option>';
            
            const addFolderOptions = (folder, currentPrefix = '') => {
                const displayName = currentPrefix + folder.name;
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = displayName;
                select.appendChild(option);
                
                if (folder.children) {
                    folder.children.forEach(child => {
                        addFolderOptions(child, currentPrefix + '  ');
                    });
                }
            };
            
            folders.forEach(folder => addFolderOptions(folder, prefix));
        };
        
        // Populate upload destination select
        populateSelect(this.elements.folderSelectUpload, this.folderTree.children);
        
        // Populate parent folder select for new folder creation
        populateSelect(this.elements.parentFolderSelect, [this.folderTree, ...this.folderTree.children]);
    }

    async handleUpload(e) {
        e.preventDefault();
        
        const folderId = this.elements.folderSelectUpload?.value;
        const files = this.elements.fileInput?.files;
        
        if (!folderId) {
            this.showNotification('Error', 'Please select a destination folder', 'error');
            return;
        }
        
        if (!files || files.length === 0) {
            this.showNotification('Error', 'Please select files to upload', 'error');
            return;
        }
        
        this.showUploadProgress(true);
        this.updateUploadProgress(0, 'Preparing upload...');
        
        try {
            const uploadPromises = Array.from(files).map((file, index) => 
                this.uploadSingleFile(file, folderId, index, files.length)
            );
            
            const results = await Promise.all(uploadPromises);
            const successCount = results.filter(r => r?.success).length;
            
            this.showUploadProgress(false);
            
            if (successCount === files.length) {
                this.showNotification('Success', `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`, 'success');
            } else {
                this.showNotification('Partial Success', `Uploaded ${successCount} of ${files.length} files`, 'warning');
            }
            
            // Reset form
            this.elements.uploadForm?.reset();
            this.resetFileDropZone();
            
            // Reload gallery if we're viewing the uploaded folder
            if (this.galleryFiles.length > 0) {
                this.loadGallery();
            }
            
        } catch (error) {
            this.showUploadProgress(false);
            this.showNotification('Upload Failed', error.message, 'error');
        }
    }

    async uploadSingleFile(file, folderId, index, total) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const fileData = e.target.result;
                    
                    this.updateUploadProgress(
                        ((index + 1) / total) * 100,
                        `Uploading ${file.name}...`
                    );
                    
                    const result = await this.apiCall('uploadFile', {
                        folderId,
                        fileData,
                        fileName: file.name,
                        mimeType: file.type
                    }, 'POST');
                    
                    resolve(result);
                    
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    resolve({ success: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                resolve({ success: false, error: 'Failed to read file' });
            };
            
            reader.readAsDataURL(file);
        });
    }

    showUploadProgress(show) {
        if (this.elements.uploadProgressContainer) {
            this.elements.uploadProgressContainer.classList.toggle('hidden', !show);
        }
    }

    updateUploadProgress(percent, status) {
        if (this.elements.uploadProgressBar) {
            this.elements.uploadProgressBar.style.width = `${percent}%`;
            this.elements.uploadProgressBar.setAttribute('aria-valuenow', percent);
        }
        
        if (this.elements.uploadStatus) {
            this.elements.uploadStatus.textContent = status;
        }
    }

    resetFileDropZone() {
        if (this.elements.fileDropZone) {
            const content = this.elements.fileDropZone.querySelector('.drop-zone-content');
            if (content) {
                content.innerHTML = `
                    <i data-lucide="upload-cloud"></i>
                    <p>Drop files here or click to browse</p>
                    <span>Supports images and videos (Max 10MB each)</span>
                `;
                
                // Reinitialize Lucide icons
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    async handleCreateFolder(e) {
        e.preventDefault();
        
        const parentFolderId = this.elements.parentFolderSelect?.value;
        const folderName = this.elements.newFolderName?.value?.trim();
        
        if (!parentFolderId) {
            this.showNotification('Error', 'Please select a parent folder', 'error');
            return;
        }
        
        if (!folderName) {
            this.showNotification('Error', 'Please enter a folder name', 'error');
            return;
        }
        
        const result = await this.apiCall('createFolder', {
            parentFolderId,
            folderName
        }, 'POST');
        
        if (result?.success) {
            this.showNotification('Success', `Folder "${folderName}" created successfully`, 'success');
            this.elements.createFolderForm?.reset();
            
            // Refresh folder tree
            await this.fetchFolderTree();
        }
    }

    // ===============================================================
    // Admin Actions
    // ===============================================================
    
    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
            return;
        }
        
        const result = await this.apiCall('deleteFile', { id: fileId }, 'POST');
        
        if (result?.success) {
            this.showNotification('Success', 'File deleted successfully', 'success');
            
            // Remove from current gallery
            this.galleryFiles = this.galleryFiles.filter(f => f.id !== fileId);
            this.filteredFiles = this.filteredFiles.filter(f => f.id !== fileId);
            this.renderGallery(this.filteredFiles);
            
            // Update stats
            this.updateStats();
        }
    }

    async deleteFolder(folderId) {
        if (!confirm('Are you sure you want to delete this folder and all its contents? This action cannot be undone.')) {
            return;
        }
        
        const result = await this.apiCall('deleteFolder', { id: folderId }, 'POST');
        
        if (result?.success) {
            this.showNotification('Success', 'Folder deleted successfully', 'success');
            
            // Refresh folder tree
            await this.fetchFolderTree();
            
            // Clear current gallery if it was showing the deleted folder
            this.galleryFiles = [];
            this.filteredFiles = [];
            this.renderGallery([]);
        }
    }
}

// ===============================================================
// Global Functions
// ===============================================================

// Navigation helper for inline onclick handlers
function navigateToSection(section) {
    if (window.gallery) {
        window.gallery.navigateToSection(section);
    }
}

// ===============================================================
// Initialize Application
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize gallery
    window.gallery = new ModernSchoolGallery();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('Modern School Gallery loaded successfully');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.gallery) {
        // Refresh session when page becomes visible
        window.gallery.checkSession();
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.gallery) {
        window.gallery.showNotification('Connection Restored', 'You are back online', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.gallery) {
        window.gallery.showNotification('Connection Lost', 'You are currently offline', 'warning');
    }
});

// Service Worker registration (optional, for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Can be implemented later for offline functionality
    });
}

