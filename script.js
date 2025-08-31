document.addEventListener('DOMContentLoaded', () => {
    // ===============================================================
    // CONFIGURATION
    // ===============================================================
    const API_URL = 'https://script.google.com/macros/s/AKfycbz4cuJPjpo3ww7vTmJso-BK6doOW1x1C2KqpHp1KawmmvHZaZ68yN0P2E37rHzJSRgHkQ/exec'; // ❗ PASTE YOUR URL HERE
    
    // ===============================================================
    // STATE & DOM ELEMENTS
    // ===============================================================
    let folderTree = null;
    const sessionToken = sessionStorage.getItem('adminToken');

    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const occasionSelect = document.getElementById('occasion-select');
    const yearSelect = document.getElementById('year-select');
    const subfolderSelect = document.getElementById('subfolder-select');
    const viewAlbumBtn = document.getElementById('view-album-btn');
    const galleryGrid = document.getElementById('gallery-grid');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyMessage = document.getElementById('empty-message');
    const searchInput = document.getElementById('search-input');
    
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    const navLogin = document.getElementById('nav-login');
    const navLogout = document.getElementById('nav-logout');
    const navUpload = document.getElementById('nav-upload');

    const uploadForm = document.getElementById('upload-form');
    const folderSelectUpload = document.getElementById('folder-select-upload');
    const fileInput = document.getElementById('file-input');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const uploadStatus = document.getElementById('upload-status');
    
    const lightboxModal = new bootstrap.Modal(document.getElementById('lightboxModal'));
    const videoModal = new bootstrap.Modal(document.getElementById('videoModal'));
    
    const toastElement = document.getElementById('notification-toast');
    const toast = new bootstrap.Toast(toastElement);

    // ===============================================================
    // INITIALIZATION
    // ===============================================================
    init();

    async function init() {
        setupEventListeners();
        handleTheme();
        if (sessionToken) {
            await checkSession();
        }
        await fetchFolderTree();
        navigateToSection(window.location.hash || '#home');
    }

    // ===============================================================
    // EVENT LISTENERS
    // ===============================================================
    function setupEventListeners() {
        navLinks.forEach(link => {
            if (!link.parentElement.id?.includes('logout')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigateToSection(link.getAttribute('href'));
                });
            }
        });
        
        occasionSelect.addEventListener('change', () => {
            populateYearSelect();
            viewAlbumBtn.disabled = !occasionSelect.value; // ** CHANGE **
        });
        yearSelect.addEventListener('change', () => {
            populateSubfolderSelect();
            viewAlbumBtn.disabled = !yearSelect.value; // ** CHANGE **
        });
        subfolderSelect.addEventListener('change', () => {
             viewAlbumBtn.disabled = !subfolderSelect.value;
        });

        viewAlbumBtn.addEventListener('click', loadGallery);
        searchInput.addEventListener('input', filterGallery);

        loginForm.addEventListener('submit', handleLogin);
        navLogout.addEventListener('click', handleLogout);

        uploadForm.addEventListener('submit', handleUpload);

        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        
        document.getElementById('videoModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('video-player').pause();
        });
    }

    // ===============================================================
    // API CALLS
    // ===============================================================
    async function apiCall(action, body = {}, method = 'GET') {
        showSpinner(true);
        try {
            let response;
            const params = new URLSearchParams(body);
            const url = `${API_URL}?action=${action}&${params}`;

            if (method === 'GET') {
                response = await fetch(url);
            } else { // POST
                body.token = sessionStorage.getItem('adminToken');
                response = await fetch(API_URL, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: "follow",
                    body: JSON.stringify(body),
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
                });
            }
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.error) throw new Error(result.message || 'An unknown error occurred.');
            return result;

        } catch (error) {
            console.error('API Call Error:', error);
            showNotification('Error', `Failed to communicate with the server: ${error.message}`, 'danger');
            return null;
        } finally {
            showSpinner(false);
        }
    }
    
    // ===============================================================
    // UI & NAVIGATION (No changes in this section)
    // ===============================================================
    function navigateToSection(hash) {
        const targetId = hash.substring(1);
        sections.forEach(section => {
            section.classList.toggle('d-none', section.id !== targetId);
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === hash);
        });
        window.location.hash = hash;
    }

    function showSpinner(show) {
        loadingSpinner.classList.toggle('d-none', !show);
    }
    
    function showNotification(title, message, type = 'success') {
        const toastTitle = document.getElementById('toast-title');
        const toastBody = document.getElementById('toast-body');
        
        toastElement.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'text-white');
        toastElement.classList.add(`bg-${type}`, 'text-white');
        
        toastTitle.textContent = title;
        toastBody.textContent = message;
        toast.show();
    }

    function updateAdminUI(isLoggedIn) {
        navUpload.classList.toggle('d-none', !isLoggedIn);
        navLogin.classList.toggle('d-none', isLoggedIn);
        navLogout.classList.toggle('d-none', !isLoggedIn);
        document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.toggle('d-none', !isLoggedIn));
    }
    
    function handleTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-bs-theme', savedTheme);
        document.getElementById('theme-toggle').innerHTML = savedTheme === 'dark' 
            ? '<i class="bi bi-sun-fill"></i>' 
            : '<i class="bi bi-moon-stars-fill"></i>';
    }

    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        handleTheme();
    }

    // ===============================================================
    // AUTHENTICATION (No changes in this section)
    // ===============================================================
    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = await apiCall('login', { username, password }, 'POST');
        
        if (result && result.success) {
            sessionStorage.setItem('adminToken', result.token);
            updateAdminUI(true);
            loginModal.hide();
            loginForm.reset();
            loginError.classList.add('d-none');
            showNotification('Success', 'Logged in successfully!');
        } else {
            loginError.textContent = result ? result.message : 'Login failed.';
            loginError.classList.remove('d-none');
        }
    }

    async function handleLogout() {
        const token = sessionStorage.getItem('adminToken');
        if (token) {
            await apiCall('logout', { token }, 'POST');
            sessionStorage.removeItem('adminToken');
        }
        updateAdminUI(false);
        showNotification('Logged Out', 'You have been logged out.');
        navigateToSection('#home');
    }

    async function checkSession() {
        const token = sessionStorage.getItem('adminToken');
        if (!token) return;
        const result = await apiCall('checkSession', { token }, 'POST');
        updateAdminUI(result && result.success);
    }
    
    // ===============================================================
    // GALLERY LOGIC (UPDATED)
    // ===============================================================
    async function fetchFolderTree() {
        const data = await apiCall('getFolderTree');
        if (data && !data.error) {
            folderTree = data;
            populateOccasionSelect();
            populateUploadFolderSelect(); // ** FIX applied here **
        }
    }
    
    function populateOccasionSelect() {
        occasionSelect.innerHTML = '<option value="">-- Select Occasion --</option>';
        if (!folderTree || !folderTree.children) return;
        folderTree.children.forEach(occasion => {
            const option = new Option(occasion.name, occasion.id);
            occasionSelect.appendChild(option);
        });
    }

    function populateYearSelect() {
        const occasionId = occasionSelect.value;
        yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
        subfolderSelect.innerHTML = '<option value="">-- Select Album --</option>';
        yearSelect.disabled = true;
        subfolderSelect.disabled = true;
        
        if (!occasionId) return;

        const occasion = folderTree.children.find(o => o.id === occasionId);
        if (occasion && occasion.children) {
            occasion.children.forEach(year => {
                const option = new Option(year.name, year.id);
                yearSelect.appendChild(option);
            });
            yearSelect.disabled = false;
        }
    }

    function populateSubfolderSelect() {
        const occasionId = occasionSelect.value;
        const yearId = yearSelect.value;
        subfolderSelect.innerHTML = '<option value="">-- Select Album --</option>';
        subfolderSelect.disabled = true;

        if (!yearId) return;

        const occasion = folderTree.children.find(o => o.id === occasionId);
        const year = occasion?.children.find(y => y.id === yearId);
        if (year && year.children) {
            year.children.forEach(subfolder => {
                const option = new Option(subfolder.name, subfolder.id);
                subfolderSelect.appendChild(option);
            });
            subfolderSelect.disabled = false;
        }
    }

    async function loadGallery() {
        // ** NEW LOGIC ** Determine which folder to load
        const folderId = subfolderSelect.value || yearSelect.value || occasionSelect.value;
        if (!folderId) return;
        
        // ** NEW LOGIC ** Determine which API action to use
        const action = subfolderSelect.value ? 'getFiles' : 'getFilesRecursive';

        galleryGrid.innerHTML = '';
        emptyMessage.classList.add('d-none');
        
        const files = await apiCall(action, { folderId });
        
        if (files && files.length > 0) {
            files.forEach(renderGalleryCard);
        } else if (files) {
            emptyMessage.classList.remove('d-none');
        }
        updateAdminUI(!!sessionStorage.getItem('adminToken'));
    }

    function renderGalleryCard(file) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6';
        col.dataset.fileName = file.name.toLowerCase();

        const isImage = file.mimeType.startsWith('image/');
        const isVideo = file.mimeType.startsWith('video/');
        let thumbnailHtml;

        if (isImage) {
            thumbnailHtml = `<img src="${file.downloadUrl}" class="card-img-top" alt="${file.name}" loading="lazy">`;
        } else if (isVideo) {
            thumbnailHtml = `<div class="file-icon"><i class="bi bi-film"></i></div>`;
        } else {
            thumbnailHtml = `<div class="file-icon"><i class="bi bi-file-earmark-text"></i></div>`;
        }

        col.innerHTML = `
            <div class="card gallery-card">
                <button class="btn btn-danger btn-sm delete-btn d-none" data-id="${file.id}" data-name="${file.name}"><i class="bi bi-trash-fill"></i></button>
                <div class="card-img-container">${thumbnailHtml}</div>
                <div class="card-body"><p class="card-title" title="${file.name}">${file.name}</p></div>
            </div>
        `;
        
        col.querySelector('.gallery-card').addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            if (isImage) openLightbox(file);
            else if (isVideo) openVideoPlayer(file);
            else window.open(file.downloadUrl, '_blank');
        });

        col.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                deleteFile(file.id, col);
            }
        });
        
        galleryGrid.appendChild(col);
    }
    
    function filterGallery() {
        const searchTerm = searchInput.value.toLowerCase();
        galleryGrid.querySelectorAll('.col-lg-3').forEach(card => {
            card.style.display = card.dataset.fileName.includes(searchTerm) ? '' : 'none';
        });
    }
    
    async function deleteFile(fileId, elementToRemove) {
        const result = await apiCall('deleteFile', { id: fileId }, 'POST');
        if (result && result.success) {
            elementToRemove.remove();
            showNotification('Success', result.message, 'success');
        }
    }

    function openLightbox(file) {
        document.getElementById('lightbox-title').textContent = file.name;
        document.getElementById('lightbox-img').src = file.downloadUrl;
        document.getElementById('lightbox-download').href = file.downloadUrl;
        document.getElementById('lightbox-download').download = file.name;
        lightboxModal.show();
    }

    function openVideoPlayer(file) {
        document.getElementById('video-title').textContent = file.name;
        const player = document.getElementById('video-player');
        player.src = file.downloadUrl;
        document.getElementById('video-download').href = file.downloadUrl;
        document.getElementById('video-download').download = file.name;
        videoModal.show();
    }
    
    // ===============================================================
    // UPLOAD LOGIC (UPDATED)
    // ===============================================================
    function populateUploadFolderSelect() {
        // ** FIX **: This function is completely rewritten for better UX.
        folderSelectUpload.innerHTML = '<option value="">-- Select Destination --</option>';
        if (!folderTree || !folderTree.children) return;

        const addOption = (name, id, indent) => {
            const option = new Option(`${'\u00A0\u00A0'.repeat(indent)}${name}`, id);
            folderSelectUpload.appendChild(option);
        };

        folderTree.children.forEach(occasion => {
            addOption(occasion.name, occasion.id, 0);
            occasion.children.forEach(year => {
                addOption(year.name, year.id, 1);
                year.children.forEach(subfolder => {
                    addOption(subfolder.name, subfolder.id, 2);
                });
            });
        });
    }
    
    async function handleUpload(e) {
        e.preventDefault();
        const folderId = folderSelectUpload.value;
        const files = fileInput.files;

        if (!folderId || files.length === 0) {
            showNotification('Warning', 'Please select a destination and files to upload.', 'warning');
            return;
        }
        
        progressContainer.classList.remove('d-none');
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = Math.round(((i + 1) / files.length) * 100);
            
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
            uploadStatus.textContent = `Uploading ${i + 1}/${files.length}: ${file.name}`;
            
            try {
                const fileData = await readFileAsBase64(file);
                const result = await apiCall('uploadFile', {
                    action: 'uploadFile', folderId, fileName: file.name,
                    mimeType: file.type, fileData
                }, 'POST');

                if (result && result.success) successCount++;
                else errorCount++;

            } catch (err) {
                errorCount++;
            }
        }
        
        uploadStatus.textContent = `Upload complete. ${successCount} succeeded, ${errorCount} failed.`;
        showNotification(
            errorCount > 0 ? 'Upload Finished' : 'Upload Complete',
            `Finished: ${successCount} succeeded, ${errorCount} failed.`,
            errorCount > 0 ? 'warning' : 'success'
        );
        
        uploadForm.reset();
        setTimeout(() => progressContainer.classList.add('d-none'), 5000);
    }
    
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }
});
