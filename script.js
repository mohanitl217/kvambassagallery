document.addEventListener('DOMContentLoaded', () => {
    // ===============================================================
    // CONFIGURATION
    // ===============================================================
    const API_URL = 'https://script.google.com/macros/s/AKfycbz4cuJPjpo3ww7vTmJso-BK6doOW1x1C2KqpHp1KawmmvHZaZ68yN0P2E37rHzJSRgHkQ/exec';
    
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

    // Upload & Manage elements
    const uploadForm = document.getElementById('upload-form');
    const folderSelectUpload = document.getElementById('folder-select-upload');
    const fileInput = document.getElementById('file-input');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const uploadStatus = document.getElementById('upload-status');
    const createFolderForm = document.getElementById('create-folder-form');
    const parentFolderSelect = document.getElementById('parent-folder-select');
    
    // Modals & Notifications
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
        if (sessionToken) await checkSession();
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
            viewAlbumBtn.disabled = !occasionSelect.value;
        });
        yearSelect.addEventListener('change', () => {
            populateSubfolderSelect();
            viewAlbumBtn.disabled = !occasionSelect.value;
        });
        subfolderSelect.addEventListener('change', () => {
            viewAlbumBtn.disabled = !occasionSelect.value;
        });
        viewAlbumBtn.addEventListener('click', loadGallery);
        searchInput.addEventListener('input', filterGallery);

        loginForm.addEventListener('submit', handleLogin);
        navLogout.addEventListener('click', handleLogout);

        uploadForm.addEventListener('submit', handleUpload);
        createFolderForm.addEventListener('submit', handleCreateFolder);

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
            if (!API_URL || API_URL.includes('YOUR_GAS_WEB_APP_URL')) {
                throw new Error("API_URL is not configured in script.js.");
            }
            let response;
            if (method === 'GET') {
                const params = new URLSearchParams(body);
                response = await fetch(`${API_URL}?action=${action}&${params}`);
            } else {
                body.action = action;
                if (sessionStorage.getItem('adminToken')) body.token = sessionStorage.getItem('adminToken');
                response = await fetch(API_URL, { method: 'POST', mode: 'cors', redirect: 'follow', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
            }
            if (!response.ok) throw new Error(`Network error. Server responded with status: ${response.status}`);
            const textResponse = await response.text();
            try {
                const jsonResponse = JSON.parse(textResponse);
                if (jsonResponse.error) throw new Error(jsonResponse.message || 'An unknown server error occurred.');
                return jsonResponse;
            } catch (e) {
                console.error("Failed to parse JSON. Server response:", textResponse);
                throw new Error("Invalid response from server. Check browser console (F12) for details.");
            }
        } catch (error) {
            console.error('API Call Error:', error);
            showNotification('Error', `Communication Failure: ${error.message}`, 'danger');
            return null;
        } finally {
            showSpinner(false);
        }
    }
    
    // ===============================================================
    // UI, THEME, & AUTH
    // ===============================================================
    function navigateToSection(hash) { const targetId = hash.substring(1); sections.forEach(s => s.classList.toggle('d-none', s.id !== targetId)); navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === hash)); window.location.hash = hash; }
    function showSpinner(show) { loadingSpinner.classList.toggle('d-none', !show); }
    function showNotification(title, message, type = 'success') { const toastTitle = document.getElementById('toast-title'), toastBody = document.getElementById('toast-body'); toastElement.className = 'toast'; toastElement.classList.add(`bg-${type}`, 'text-white'); toastTitle.textContent = title; toastBody.textContent = message; toast.show(); }
    function updateAdminUI(isLoggedIn) { navUpload.classList.toggle('d-none', !isLoggedIn); navLogin.classList.toggle('d-none', isLoggedIn); navLogout.classList.toggle('d-none', !isLoggedIn); document.querySelectorAll('.delete-btn').forEach(btn => btn.classList.toggle('d-none', !isLoggedIn)); }
    function handleTheme() { const theme = localStorage.getItem('theme') || 'light'; document.body.setAttribute('data-bs-theme', theme); document.getElementById('theme-toggle').innerHTML = theme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>'; }
    function toggleTheme() { const newTheme = document.body.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', newTheme); handleTheme(); }
    async function handleLogin(e) { e.preventDefault(); const username = document.getElementById('username').value, password = document.getElementById('password').value, result = await apiCall('login', { username, password }, 'POST'); if (result && result.success) { sessionStorage.setItem('adminToken', result.token); updateAdminUI(true); loginModal.hide(); loginForm.reset(); loginError.classList.add('d-none'); showNotification('Success', 'Logged in successfully!'); } else { loginError.textContent = (result && result.message) ? result.message : 'Login failed. Check API URL/deployment.'; loginError.classList.remove('d-none'); } }
    async function handleLogout() { const token = sessionStorage.getItem('adminToken'); if (token) await apiCall('logout', { token }, 'POST'); sessionStorage.removeItem('adminToken'); updateAdminUI(false); showNotification('Logged Out', 'You have been logged out.'); navigateToSection('#home'); }
    async function checkSession() { const result = await apiCall('checkSession', { token: sessionToken }, 'POST'); if (result && result.success) updateAdminUI(true); else { sessionStorage.removeItem('adminToken'); updateAdminUI(false); } }

    // ===============================================================
    // FOLDER & GALLERY LOGIC
    // ===============================================================
    async function fetchFolderTree() { const data = await apiCall('getFolderTree', {}, 'GET'); if (data && !data.error) { folderTree = data; populateOccasionSelect(); populateUploadFolderSelect(); populateParentFolderSelect(); } }
    function populateOccasionSelect() { occasionSelect.innerHTML = '<option value="">-- Select Occasion --</option>'; if (!folderTree) return; folderTree.children.forEach(occ => occasionSelect.add(new Option(occ.name, occ.id))); }
    function populateYearSelect() { yearSelect.innerHTML = '<option value="">-- Any Year --</option>'; yearSelect.disabled = true; subfolderSelect.innerHTML = '<option value="">-- Any Album --</option>'; subfolderSelect.disabled = true; const occId = occasionSelect.value; if (!occId) return; const occ = folderTree.children.find(o => o.id === occId); if (occ && occ.children) { occ.children.forEach(y => yearSelect.add(new Option(y.name, y.id))); yearSelect.disabled = false; } }
    function populateSubfolderSelect() { subfolderSelect.innerHTML = '<option value="">-- Any Album --</option>'; subfolderSelect.disabled = true; const yearId = yearSelect.value; if (!yearId) return; const occ = folderTree.children.find(o => o.id === occasionSelect.value); const year = occ?.children.find(y => y.id === yearId); if (year && year.children) { year.children.forEach(sf => subfolderSelect.add(new Option(sf.name, sf.id))); subfolderSelect.disabled = false; } }
    function populateUploadFolderSelect() { folderSelectUpload.innerHTML = '<option value="">-- Select Destination --</option>'; if (!folderTree) return; folderTree.children.forEach(occasion => { folderSelectUpload.add(new Option(occasion.name, occasion.id)); occasion.children.forEach(year => { folderSelectUpload.add(new Option(`  › ${year.name}`, year.id)); year.children.forEach(subfolder => { folderSelectUpload.add(new Option(`    › ${subfolder.name}`, subfolder.id)); }); }); }); }
    function populateParentFolderSelect() { parentFolderSelect.innerHTML = ''; if (!folderTree) return; parentFolderSelect.add(new Option('Main Gallery (for new Occasion)', folderTree.id)); folderTree.children.forEach(occasion => { parentFolderSelect.add(new Option(occasion.name, occasion.id)); occasion.children.forEach(year => { parentFolderSelect.add(new Option(`  › ${year.name}`, year.id)); }); }); }

    async function loadGallery() { let targetFolderId = subfolderSelect.value || yearSelect.value || occasionSelect.value; if (!targetFolderId) { showNotification('Info', 'Please select at least an occasion.', 'warning'); return; } const action = subfolderSelect.value ? 'getFiles' : 'getFilesRecursive'; galleryGrid.innerHTML = ''; emptyMessage.classList.add('d-none'); const files = await apiCall(action, { folderId: targetFolderId }, 'GET'); if (files && files.length > 0) { files.sort((a, b) => a.name.localeCompare(b.name)); files.forEach(file => renderGalleryCard(file)); } else if (files) { emptyMessage.classList.remove('d-none'); } updateAdminUI(!!sessionStorage.getItem('adminToken')); }
    
    function renderGalleryCard(file) {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6';
        col.dataset.fileName = file.name.toLowerCase();

        const isImage = file.mimeType.startsWith('image/');
        const isVideo = file.mimeType.startsWith('video/');
        
        // **FIX**: Use thumbnailUrl if available for images, otherwise show an icon.
        let thumb = '';
        if (isImage && file.thumbnailUrl) {
            thumb = `<img src="${file.thumbnailUrl}" class="card-img-top" alt="${file.name}" loading="lazy">`;
        } else if (isVideo) {
            thumb = `<div class="file-icon"><i class="bi bi-film"></i></div>`;
        } else {
            thumb = `<div class="file-icon"><i class="bi bi-file-earmark-text"></i></div>`;
        }

        col.innerHTML = `<div class="card gallery-card"><button class="btn btn-danger btn-sm delete-btn d-none" data-id="${file.id}" data-name="${file.name}"><i class="bi bi-trash-fill"></i></button><div class="card-img-container">${thumb}</div><div class="card-body"><p class="card-title" title="${file.name}">${file.name}</p></div></div>`;
        
        col.querySelector('.gallery-card').addEventListener('click', e => {
            if (e.target.closest('.delete-btn')) return;
            if (isImage) openLightbox(file);
            else if (isVideo) openVideoPlayer(file);
            else window.open(file.downloadUrl, '_blank');
        });
        
        col.querySelector('.delete-btn').addEventListener('click', e => {
            e.stopPropagation();
            if (confirm(`Delete "${file.name}"?`)) deleteFile(file.id, col);
        });
        
        galleryGrid.appendChild(col);
    }

    function filterGallery() { const searchTerm = searchInput.value.toLowerCase(); galleryGrid.querySelectorAll('.col-lg-3').forEach(card => card.style.display = card.dataset.fileName.includes(searchTerm) ? '' : 'none'); }
    async function deleteFile(fileId, element) { const result = await apiCall('deleteFile', { id: fileId }, 'POST'); if (result?.success) { element.remove(); showNotification('Success', result.message, 'success'); } else { showNotification('Error', 'Failed to delete file.', 'danger'); } }
    
    // **FIX**: Use the correct `viewUrl` for full-size images and videos.
    function openLightbox(file) { document.getElementById('lightbox-title').textContent = file.name; document.getElementById('lightbox-img').src = file.viewUrl; document.getElementById('lightbox-download').href = file.downloadUrl; document.getElementById('lightbox-download').download = file.name; lightboxModal.show(); }
    function openVideoPlayer(file) { document.getElementById('video-title').textContent = file.name; const player = document.getElementById('video-player'); player.src = file.viewUrl; document.getElementById('video-download').href = file.downloadUrl; document.getElementById('video-download').download = file.name; videoModal.show(); player.play(); }
    
    // ===============================================================
    // UPLOAD & MANAGE LOGIC
    // ===============================================================
    async function handleCreateFolder(e) { e.preventDefault(); const newFolderNameInput = document.getElementById('new-folder-name'); const parentFolderId = parentFolderSelect.value; const folderName = newFolderNameInput.value.trim(); if (!folderName) { showNotification('Warning', 'Folder name cannot be empty.', 'warning'); return; } const result = await apiCall('createFolder', { parentFolderId, folderName }, 'POST'); if (result && result.success) { showNotification('Success', `Folder "${result.folderName}" created successfully.`); newFolderNameInput.value = ''; await fetchFolderTree(); } }
    async function handleUpload(e) { e.preventDefault(); const folderId = folderSelectUpload.value, files = fileInput.files; if (!folderId || files.length === 0) { showNotification('Warning', 'Please select a destination and files.', 'warning'); return; } progressContainer.classList.remove('d-none'); let successCount = 0, errorCount = 0; for (let i = 0; i < files.length; i++) { const file = files[i]; const progress = Math.round(((i + 1) / files.length) * 100); progressBar.style.width = `${progress}%`; progressBar.textContent = `${progress}%`; uploadStatus.textContent = `Uploading ${i + 1}/${files.length}: ${file.name}`; try { const fileData = await readFileAsBase64(file); const result = await apiCall('uploadFile', { folderId, fileName: file.name, mimeType: file.type, fileData }, 'POST'); if (result?.success) successCount++; else errorCount++; } catch (err) { errorCount++; } } uploadStatus.textContent = `Upload complete. ${successCount} succeeded, ${errorCount} failed.`; showNotification('Upload Complete', errorCount > 0 ? `Finished with ${errorCount} errors.` : `${successCount} files uploaded successfully.`, errorCount > 0 ? 'warning' : 'success'); uploadForm.reset(); setTimeout(() => progressContainer.classList.add('d-none'), 5000); }
    function readFileAsBase64(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = (error) => reject(error); reader.readAsDataURL(file); }); }
});
