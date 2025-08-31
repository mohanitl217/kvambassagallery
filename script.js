// ===============================================================
// Modern School Gallery - Enhanced Frontend
// ===============================================================

class SchoolGallery {
    constructor() {
        this.API_URL = 'https://script.google.com/macros/s/AKfycbz4cuJPjpo3ww7vTmJso-BK6doOW1x1C2KqpHp1KawmmvHZaZ68yN0P2E37rHzJSRgHkQ/exec';
        this.folderTree = null;
        this.galleryFiles = [];
        this.filteredFiles = [];
        this.currentLightboxIndex = 0;
        this.isAuthenticated = false;
        this.sessionToken = sessionStorage.getItem('adminToken');
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.handleTheme();
        if (this.sessionToken) await this.checkSession();
        await this.fetchFolderTree();
        this.navigateToSection(window.location.hash.slice(1) || 'home');
        this.updateStats();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) this.navigateToSection(section);
            });
        });

        // Gallery controls
        document.getElementById('occasion-select').addEventListener('change', () => this.populateYearSelect());
        document.getElementById('year-select').addEventListener('change', () => this.populateSubfolderSelect());
        document.getElementById('subfolder-select').addEventListener('change', () => this.updateViewButton());
        document.getElementById('view-album-btn').addEventListener('click', () => this.loadGallery());
        document.getElementById('search-input').addEventListener('input', (e) => this.filterGallery(e.target.value));

        // Authentication
        document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('login-modal-close').addEventListener('click', () => this.hideLoginModal());

        // Upload
        document.getElementById('upload-form').addEventListener('submit', (e) => this.handleUpload(e));
        document.getElementById('create-folder-form').addEventListener('submit', (e) => this.handleCreateFolder(e));
        this.setupFileDropZone();

        // Lightbox
        document.getElementById('lightbox-close').addEventListener('click', () => this.hideLightbox());
        document.getElementById('lightbox-prev').addEventListener('click', () => this.navigateLightbox(-1));
        document.getElementById('lightbox-next').addEventListener('click', () => this.navigateLightbox(1));

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Toast close
        document.getElementById('toast-close').addEventListener('click', () => this.hideToast());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Modal backdrop clicks
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                this.hideLoginModal();
                this.hideLightbox();
            });
        });
    }

    setupFileDropZone() {
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('file-input');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            fileInput.files = files;
            this.updateFileDropZone(files);
        });

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.updateFileDropZone(e.target.files));
    }

    updateFileDropZone(files) {
        const dropZone = document.getElementById('file-drop-zone');
        const content = dropZone.querySelector('.drop-zone-content');
        
        if (files && files.length > 0) {
            content.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                <p>${files.length} file${files.length > 1 ? 's' : ''} selected</p>
                <span>Ready to upload</span>
            `;
        }
    }

    // ===============================================================
    // API Communication
    // ===============================================================
    
    async apiCall(action, body = {}, method = 'GET') {
        this.showSpinner(true);
        try {
            let response;
            if (method === 'GET') {
                const params = new URLSearchParams(body);
                response = await fetch(`${this.API_URL}?action=${action}&${params}`);
            } else {
                body.action = action;
                if (this.sessionToken) body.token = this.sessionToken;
                response = await fetch(this.API_URL, {
                    method: 'POST',
                    mode: 'cors',
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
            }
            
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            
            const textResponse = await response.text();
            const jsonResponse = JSON.parse(textResponse);
            
            if (jsonResponse.error) throw new Error(jsonResponse.message);
            return jsonResponse;
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error', error.message, 'error');
            return null;
        } finally {
            this.showSpinner(false);
        }
    }

    // ===============================================================
    // Navigation & UI
    // ===============================================================
    
    navigateToSection(sectionName) {
        // Update URL
        window.location.hash = sectionName;
        
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    showSpinner(show) {
        const spinner = document.getElementById('loading-spinner');
        spinner.classList.toggle('hidden', !show);
    }

    showNotification(title, message, type = 'success') {
        const toast = document.getElementById('notification-toast');
        const toastTitle = document.getElementById('toast-title');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');
        
        // Set content
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Set icon based on type
        const icons = {
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
        };
        
        toastIcon.innerHTML = icons[type] || icons.success;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => this.hideToast(), 5000);
    }

    hideToast() {
        document.getElementById('notification-toast').classList.add('hidden');
    }

    updateAdminUI(isLoggedIn) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.toggle('hidden', !isLoggedIn);
        });
        document.querySelectorAll('.login-only').forEach(el => {
            el.classList.toggle('hidden', isLoggedIn);
        });
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
        
        const moonIcon = document.querySelector('.moon');
        const sunIcon = document.querySelector('.sun');
        
        if (theme === 'dark') {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        this.handleTheme();
    }

    // ===============================================================
    // Authentication
    // ===============================================================
    
    showLoginModal() {
        document.getElementById('login-modal').classList.remove('hidden');
    }

    hideLoginModal() {
        document.getElementById('login-modal').classList.add('hidden');
        document.getElementById('login-error').classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = await this.apiCall('login', { username, password }, 'POST');
        
        if (result?.success) {
            this.sessionToken = result.token;
            sessionStorage.setItem('adminToken', result.token);
            this.isAuthenticated = true;
            this.updateAdminUI(true);
            this.hideLoginModal();
            this.showNotification('Success', 'Logged in successfully!', 'success');
        } else {
            const errorEl = document.getElementById('login-error');
            errorEl.textContent = result?.message || 'Login failed';
            errorEl.classList.remove('hidden');
        }
    }

    async handleLogout() {
        if (this.sessionToken) {
            await this.apiCall('logout', { token: this.sessionToken }, 'POST');
        }
        this.sessionToken = null;
        sessionStorage.removeItem('adminToken');
        this.isAuthenticated = false;
        this.updateAdminUI(false);
        this.navigateToSection('home');
        this.showNotification('Success', 'Logged out successfully', 'success');
    }

    async checkSession() {
        const result = await this.apiCall('checkSession', { token: this.sessionToken }, 'POST');
        this.isAuthenticated = result?.success || false;
        this.updateAdminUI(this.isAuthenticated);
    }

    // ===============================================================
    // Folder & Gallery Management
    // ===============================================================
    
    async fetchFolderTree() {
        const data = await this.apiCall('getFolderTree');
        if (data) {
            this.folderTree = data;
            this.populateSelects();
        }
    }

    populateSelects() {
        this.populateOccasionSelect();
        this.populateUploadFolderSelect();
        this.populateParentFolderSelect();
    }

    populateOccasionSelect() {
        const select = document.getElementById('occasion-select');
        select.innerHTML = '<option value="">Select Occasion</option>';
        
        if (this.folderTree?.children) {
            this.folderTree.children.forEach(occasion => {
                const option = document.createElement('option');
                option.value = occasion.id;
                option.textContent = occasion.name;
                select.appendChild(option);
            });
        }
    }

    populateYearSelect() {
        const occasionSelect = document.getElementById('occasion-select');
        const yearSelect = document.getElementById('year-select');
        const subfolderSelect = document.getElementById('subfolder-select');
        
        yearSelect.innerHTML = '<option value="">Any Year</option>';
        yearSelect.disabled = true;
        subfolderSelect.innerHTML = '<option value="">Any Album</option>';
        subfolderSelect.disabled = true;
        
        const occasionId = occasionSelect.value;
        if (!occasionId) {
            this.updateViewButton();
            return;
        }
        
        const occasion = this.folderTree?.children?.find(o => o.id === occasionId);
        if (occasion?.children) {
            occasion.children.forEach(year => {
                const option = document.createElement('option');
                option.value = year.id;
                option.textContent = year.name;
                yearSelect.appendChild(option);
            });
            yearSelect.disabled = false;
        }
        this.updateViewButton();
    }

    populateSubfolderSelect() {
        const occasionSelect = document.getElementById('occasion-select');
        const yearSelect = document.getElementById('year-select');
        const subfolderSelect = document.getElementById('subfolder-select');
        
        subfolderSelect.innerHTML = '<option value="">Any Album</option>';
        subfolderSelect.disabled = true;
        
        const yearId = yearSelect.value;
        if (!yearId) {
            this.updateViewButton();
            return;
        }
        
        const occasion = this.folderTree?.children?.find(o => o.id === occasionSelect.value);
        const year = occasion?.children?.find(y => y.id === yearId);
        
        if (year?.children) {
            year.children.forEach(subfolder => {
                const option = document.createElement('option');
                option.value = subfolder.id;
                option.textContent = subfolder.name;
                subfolderSelect.appendChild(option);
            });
            subfolderSelect.disabled = false;
        }
        this.updateViewButton();
    }

    updateViewButton() {
        const btn = document.getElementById('view-album-btn');
        btn.disabled = !document.getElementById('occasion-select').value;
    }

    populateUploadFolderSelect() {
        const select = document.getElementById('folder-select-upload');
        select.innerHTML = '<option value="">Select Destination</option>';
        
        if (!this.folderTree) return;
        
        this.folderTree.children?.forEach(occasion => {
            const occasionOption = document.createElement('option');
            occasionOption.value = occasion.id;
            occasionOption.textContent = occasion.name;
            select.appendChild(occasionOption);
            
            occasion.children?.forEach(year => {
                const yearOption = document.createElement('option');
                yearOption.value = year.id;
                yearOption.textContent = `  › ${year.name}`;
                select.appendChild(yearOption);
                
                year.children?.forEach(subfolder => {
                    const subfolderOption = document.createElement('option');
                    subfolderOption.value = subfolder.id;
                    subfolderOption.textContent = `    › ${subfolder.name}`;
                    select.appendChild(subfolderOption);
                });
            });
        });
    }

    populateParentFolderSelect() {
        const select = document.getElementById('parent-folder-select');
        select.innerHTML = '';
        
        if (!this.folderTree) return;
        
        const rootOption = document.createElement('option');
        rootOption.value = this.folderTree.id;
        rootOption.textContent = 'Main Gallery (for new Occasion)';
        select.appendChild(rootOption);
        
        this.folderTree.children?.forEach(occasion => {
            const occasionOption = document.createElement('option');
            occasionOption.value = occasion.id;
            occasionOption.textContent = occasion.name;
            select.appendChild(occasionOption);
            
            occasion.children?.forEach(year => {
                const yearOption = document.createElement('option');
                yearOption.value = year.id;
                yearOption.textContent = `  › ${year.name}`;
                select.appendChild(yearOption);
            });
        });
    }

    // ===============================================================
    // Gallery Loading & Display
    // ===============================================================
    
    async loadGallery() {
        const occasionSelect = document.getElementById('occasion-select');
        const yearSelect = document.getElementById('year-select');
        const subfolderSelect = document.getElementById('subfolder-select');
        
        const targetFolderId = subfolderSelect.value || yearSelect.value || occasionSelect.value;
        
        if (!targetFolderId) {
            this.showNotification('Info', 'Please select at least an occasion.', 'warning');
            return;
        }
        
        const action = subfolderSelect.value ? 'getFiles' : 'getFilesRecursive';
        const galleryGrid = document.getElementById('gallery-grid');
        const emptyMessage = document.getElementById('empty-message');
        
        galleryGrid.innerHTML = '';
        emptyMessage.classList.add('hidden');
        
        const files = await this.apiCall(action, { folderId: targetFolderId });
        
        if (files && files.length > 0) {
            this.galleryFiles = files.sort((a, b) => a.name.localeCompare(b.name));
            this.filteredFiles = [...this.galleryFiles];
            this.renderGallery();
        } else {
            emptyMessage.classList.remove('hidden');
        }
        
        this.updateAdminUI(this.isAuthenticated);
    }

    renderGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = '';
        
        this.filteredFiles.forEach((file, index) => {
            const card = this.createGalleryCard(file, index);
            galleryGrid.appendChild(card);
        });
    }

    createGalleryCard(file, index) {
        const isImage = file.mimeType.startsWith('image/');
        const isVideo = file.mimeType.startsWith('video/');
        
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.dataset.fileName = file.name.toLowerCase();
        
        // Enhanced thumbnail handling with multiple fallbacks
        let mediaContent = '';
        if (isImage) {
            const thumbnailSrc = file.thumbnailUrl || file.directImageUrl || `https://lh3.googleusercontent.com/d/${file.id}=s400`;
            mediaContent = `
                <img src="${thumbnailSrc}" 
                     alt="${file.name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/d/${file.id}=s400';"
                     class="gallery-media">
            `;
        } else if (isVideo) {
            const thumbnailSrc = file.thumbnailUrl || `https://lh3.googleusercontent.com/d/${file.id}=s400`;
            mediaContent = `
                <div class="video-thumbnail">
                    <img src="${thumbnailSrc}" 
                         alt="${file.name}" 
                         loading="lazy"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                         class="gallery-media">
                    <div class="video-placeholder" style="display: none;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                    <div class="video-overlay">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </div>
                </div>
            `;
        } else {
            mediaContent = `
                <div class="file-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                    </svg>
                </div>
            `;
        }
        
        card.innerHTML = `
            <button class="delete-btn hidden" data-id="${file.id}" data-name="${file.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
            </button>
            <div class="gallery-media-container">
                ${mediaContent}
            </div>
            <div class="gallery-card-info">
                <p class="gallery-card-title" title="${file.name}">${file.name}</p>
            </div>
        `;
        
        // Add click handlers
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            this.openLightbox(index);
        });
        
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(file.id, file.name, card);
        });
        
        return card;
    }

    filterGallery(searchTerm) {
        this.filteredFiles = this.galleryFiles.filter(file => 
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderGallery();
    }

    // ===============================================================
    // Lightbox
    // ===============================================================
    
    openLightbox(index) {
        this.currentLightboxIndex = index;
        this.showLightboxMedia();
        document.getElementById('lightbox-modal').classList.remove('hidden');
    }

    hideLightbox() {
        document.getElementById('lightbox-modal').classList.add('hidden');
        document.getElementById('lightbox-video').pause();
    }

    showLightboxMedia() {
        const file = this.filteredFiles[this.currentLightboxIndex];
        if (!file) return;
        
        const title = document.getElementById('lightbox-title');
        const img = document.getElementById('lightbox-img');
        const video = document.getElementById('lightbox-video');
        const download = document.getElementById('lightbox-download');
        
        title.textContent = file.name;
        download.href = file.downloadUrl;
        download.download = file.name;
        
        const isVideo = file.mimeType.startsWith('video/');
        
        if (isVideo) {
            img.classList.add('hidden');
            video.classList.remove('hidden');
            video.src = file.directImageUrl || file.viewUrl;
        } else {
            video.classList.add('hidden');
            img.classList.remove('hidden');
            img.src = file.directImageUrl || file.viewUrl;
        }
        
        // Update navigation buttons
        document.getElementById('lightbox-prev').disabled = this.currentLightboxIndex === 0;
        document.getElementById('lightbox-next').disabled = this.currentLightboxIndex === this.filteredFiles.length - 1;
    }

    navigateLightbox(direction) {
        const newIndex = this.currentLightboxIndex + direction;
        if (newIndex >= 0 && newIndex < this.filteredFiles.length) {
            this.currentLightboxIndex = newIndex;
            this.showLightboxMedia();
        }
    }

    handleKeyboard(e) {
        if (document.getElementById('lightbox-modal').classList.contains('hidden')) return;
        
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

    // ===============================================================
    // Upload & File Management
    // ===============================================================
    
    async handleUpload(e) {
        e.preventDefault();
        
        const folderId = document.getElementById('folder-select-upload').value;
        const files = document.getElementById('file-input').files;
        
        if (!folderId || files.length === 0) {
            this.showNotification('Warning', 'Please select destination and files', 'warning');
            return;
        }
        
        const progressContainer = document.getElementById('upload-progress-container');
        const progressBar = document.getElementById('upload-progress-bar');
        const progressStatus = document.getElementById('upload-status');
        
        progressContainer.classList.remove('hidden');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / files.length) * 100);
            
            progressBar.style.width = `${progress}%`;
            progressStatus.textContent = `Uploading ${i + 1}/${files.length}: ${file.name}`;
            
            try {
                const fileData = await this.readFileAsBase64(file);
                const result = await this.apiCall('uploadFile', {
                    folderId,
                    fileName: file.name,
                    mimeType: file.type,
                    fileData
                }, 'POST');
                
                if (result?.success) successCount++;
                else errorCount++;
            } catch (err) {
                errorCount++;
                console.error('Upload error:', err);
            }
        }
        
        progressStatus.textContent = `Upload complete! ${successCount} succeeded, ${errorCount} failed.`;
        
        this.showNotification(
            'Upload Complete',
            errorCount > 0 ? `Finished with ${errorCount} errors` : `${successCount} files uploaded successfully`,
            errorCount > 0 ? 'warning' : 'success'
        );
        
        document.getElementById('upload-form').reset();
        this.updateFileDropZone(null);
        setTimeout(() => progressContainer.classList.add('hidden'), 5000);
    }

    async handleCreateFolder(e) {
        e.preventDefault();
        
        const parentFolderId = document.getElementById('parent-folder-select').value;
        const folderName = document.getElementById('new-folder-name').value.trim();
        
        if (!folderName) {
            this.showNotification('Warning', 'Folder name cannot be empty', 'warning');
            return;
        }
        
        const result = await this.apiCall('createFolder', { parentFolderId, folderName }, 'POST');
        
        if (result?.success) {
            this.showNotification('Success', `Folder "${result.folderName}" created successfully`);
            document.getElementById('create-folder-form').reset();
            await this.fetchFolderTree();
        }
    }

    async deleteFile(fileId, fileName, cardElement) {
        if (!confirm(`Delete "${fileName}"?`)) return;
        
        const result = await this.apiCall('deleteFile', { id: fileId }, 'POST');
        
        if (result?.success) {
            cardElement.remove();
            this.showNotification('Success', result.message, 'success');
            // Update the filtered files array
            this.filteredFiles = this.filteredFiles.filter(f => f.id !== fileId);
            this.galleryFiles = this.galleryFiles.filter(f => f.id !== fileId);
        }
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ===============================================================
    // Statistics & Utils
    // ===============================================================
    
    updateStats() {
        if (!this.folderTree) return;
        
        let totalEvents = 0;
        let totalAlbums = 0;
        
        this.folderTree.children?.forEach(occasion => {
            totalEvents++;
            occasion.children?.forEach(year => {
                totalAlbums += year.children?.length || 0;
            });
        });
        
        document.getElementById('total-events').textContent = totalEvents;
        document.getElementById('total-albums').textContent = totalAlbums;
        document.getElementById('total-photos').textContent = this.galleryFiles.length;
    }
}

// Initialize the gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new SchoolGallery();
});

// Global navigation function for buttons
function navigateToSection(section) {
    if (window.gallery) {
        window.gallery.navigateToSection(section);
    }
}
