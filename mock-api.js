// ===============================================================
// Mock API for Modern School Gallery - Simulates Google Apps Script Backend
// ===============================================================

class MockAPI {
    constructor() {
        this.mockData = {
            folderTree: {
                name: 'School Gallery',
                id: 'root',
                children: [
                    {
                        name: 'Academic Events',
                        id: 'academic',
                        children: [
                            { name: 'Science Fair 2024', id: 'science-fair-2024', type: 'folder' },
                            { name: 'Annual Function', id: 'annual-function', type: 'folder' },
                            { name: 'Sports Day', id: 'sports-day', type: 'folder' }
                        ]
                    },
                    {
                        name: 'Cultural Programs',
                        id: 'cultural',
                        children: [
                            { name: 'Dance Competition', id: 'dance-comp', type: 'folder' },
                            { name: 'Music Festival', id: 'music-fest', type: 'folder' },
                            { name: 'Art Exhibition', id: 'art-exhibition', type: 'folder' }
                        ]
                    },
                    {
                        name: 'Field Trips',
                        id: 'trips',
                        children: [
                            { name: 'Museum Visit', id: 'museum-visit', type: 'folder' },
                            { name: 'Nature Camp', id: 'nature-camp', type: 'folder' }
                        ]
                    }
                ]
            },
            
            files: {
                'science-fair-2024': [
                    {
                        id: 'img1',
                        name: 'Science Project Display.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&q=80',
                        uploadDate: '2024-03-15',
                        size: '2.4 MB'
                    },
                    {
                        id: 'img2',
                        name: 'Students Presenting.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=300&q=80',
                        uploadDate: '2024-03-15',
                        size: '1.8 MB'
                    },
                    {
                        id: 'img3',
                        name: 'Award Ceremony.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300&q=80',
                        uploadDate: '2024-03-16',
                        size: '3.1 MB'
                    }
                ],
                
                'annual-function': [
                    {
                        id: 'img4',
                        name: 'Stage Performance.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&q=80',
                        uploadDate: '2024-02-20',
                        size: '2.7 MB'
                    },
                    {
                        id: 'img5',
                        name: 'Cultural Dance.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=300&q=80',
                        uploadDate: '2024-02-20',
                        size: '2.2 MB'
                    }
                ],
                
                'sports-day': [
                    {
                        id: 'img6',
                        name: 'Running Race.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
                        uploadDate: '2024-01-15',
                        size: '1.9 MB'
                    },
                    {
                        id: 'img7',
                        name: 'Basketball Match.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&q=80',
                        uploadDate: '2024-01-15',
                        size: '2.5 MB'
                    }
                ],
                
                'dance-comp': [
                    {
                        id: 'img8',
                        name: 'Classical Dance.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80',
                        uploadDate: '2024-04-10',
                        size: '2.1 MB'
                    }
                ],
                
                'music-fest': [
                    {
                        id: 'img9',
                        name: 'School Band.jpg',
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
                        thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
                        uploadDate: '2024-04-12',
                        size: '2.8 MB'
                    }
                ]
            },
            
            stats: {
                totalFolders: 8,
                totalFiles: 54,
                totalSize: '145.7 MB',
                recentUploads: 12
            }
        };
        
        this.isAuthenticated = false;
        this.sessionToken = null;
        
        // Simulate network delay
        this.networkDelay = 500; // 500ms delay to simulate real API
    }
    
    // Simulate network delay
    async delay(ms = this.networkDelay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Mock folder tree endpoint
    async getFolderTree() {
        await this.delay();
        return {
            success: true,
            data: this.mockData.folderTree
        };
    }
    
    // Mock folder files endpoint
    async getFolderFiles(folderId) {
        await this.delay();
        const files = this.mockData.files[folderId] || [];
        return {
            success: true,
            data: files
        };
    }
    
    // Mock stats endpoint
    async getStats() {
        await this.delay(200); // Faster for stats
        return {
            success: true,
            data: this.mockData.stats
        };
    }
    
    // Mock authentication
    async authenticate(username, password) {
        await this.delay();
        
        // Simple mock authentication
        if (username === 'admin' && password === 'admin123') {
            this.isAuthenticated = true;
            this.sessionToken = 'mock-session-token-' + Date.now();
            return {
                success: true,
                data: {
                    token: this.sessionToken,
                    message: 'Authentication successful'
                }
            };
        }
        
        return {
            success: false,
            error: 'Invalid credentials'
        };
    }
    
    // Mock session check
    async checkSession(token) {
        await this.delay(100);
        
        if (token === this.sessionToken && this.isAuthenticated) {
            return {
                success: true,
                data: { valid: true }
            };
        }
        
        return {
            success: false,
            error: 'Invalid session'
        };
    }
    
    // Mock file upload
    async uploadFiles(files, folderId) {
        await this.delay(2000); // Longer delay for uploads
        
        if (!this.isAuthenticated) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }
        
        // Simulate successful upload
        const uploadedFiles = files.map((file, index) => ({
            id: 'uploaded-' + Date.now() + '-' + index,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80', // Placeholder
            thumbnailUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&q=80',
            uploadDate: new Date().toISOString().split('T')[0],
            size: Math.round(file.size / 1024 / 1024 * 10) / 10 + ' MB'
        }));
        
        return {
            success: true,
            data: {
                uploaded: uploadedFiles,
                message: `Successfully uploaded ${files.length} file(s)`
            }
        };
    }
    
    // Mock folder creation
    async createFolder(name, parentId) {
        await this.delay();
        
        if (!this.isAuthenticated) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }
        
        return {
            success: true,
            data: {
                id: 'folder-' + Date.now(),
                name: name,
                message: 'Folder created successfully'
            }
        };
    }
}

// Global mock API instance
window.mockAPI = new MockAPI();

// Helper function to simulate fetch requests to the Google Apps Script API
window.mockFetch = async function(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};
    
    try {
        let response;
        
        // Route requests based on action parameter
        const action = body.action || new URL(url).searchParams.get('action');
        
        switch (action) {
            case 'getFolderTree':
                response = await window.mockAPI.getFolderTree();
                break;
            case 'getFolderFiles':
                response = await window.mockAPI.getFolderFiles(body.folderId);
                break;
            case 'getStats':
                response = await window.mockAPI.getStats();
                break;
            case 'authenticate':
                response = await window.mockAPI.authenticate(body.username, body.password);
                break;
            case 'checkSession':
                response = await window.mockAPI.checkSession(body.token);
                break;
            case 'uploadFiles':
                response = await window.mockAPI.uploadFiles(body.files, body.folderId);
                break;
            case 'createFolder':
                response = await window.mockAPI.createFolder(body.name, body.parentId);
                break;
            default:
                response = {
                    success: false,
                    error: 'Unknown action: ' + action
                };
        }
        
        return {
            ok: response.success,
            status: response.success ? 200 : 400,
            json: async () => response
        };
        
    } catch (error) {
        return {
            ok: false,
            status: 500,
            json: async () => ({
                success: false,
                error: error.message
            })
        };
    }
};
