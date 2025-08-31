// ===============================================================
// Enhanced Progress Bar Component for Modern School Gallery
// ===============================================================

class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            showPercentage: true,
            showText: true,
            animated: true,
            color: 'primary',
            size: 'medium',
            indeterminate: false,
            autoHide: true,
            hideDelay: 2000,
            ...options
        };
        
        this.progress = 0;
        this.text = '';
        this.isVisible = false;
        this.isIndeterminate = false;
        this.hideTimeout = null;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Progress bar container not found');
            return;
        }

        this.container.className = `progress-container ${this.options.size} ${this.options.color}`;
        if (!this.isVisible) {
            this.container.classList.add('hidden');
        }
        
        this.container.innerHTML = this.createHTML();
        
        this.progressBar = this.container.querySelector('.progress-bar');
        this.progressFill = this.container.querySelector('.progress-fill');
        this.progressText = this.container.querySelector('.progress-text');
        this.progressPercentage = this.container.querySelector('.progress-percentage');
        
        if (this.options.animated) {
            this.container.classList.add('animated');
        }

        if (this.options.indeterminate) {
            this.indeterminate();
        }
    }

    createHTML() {
        return `
            <div class="progress-bar ${this.options.size}">
                <div class="progress-fill"></div>
                ${this.options.showPercentage ? '<span class="progress-percentage">0%</span>' : ''}
            </div>
            ${this.options.showText ? '<div class="progress-text"></div>' : ''}
        `;
    }

    show(text = '') {
        if (!this.container) return this;
        
        // Clear any pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        this.isVisible = true;
        this.container.classList.remove('hidden');
        
        // Force reflow and apply initial state
        this.container.offsetHeight;
        
        // Add show class for animations
        this.container.classList.add('showing');
        
        if (text) {
            this.setText(text);
        }
        
        // Remove showing class after animation
        setTimeout(() => {
            if (this.container) {
                this.container.classList.remove('showing');
            }
        }, 300);
        
        return this;
    }

    hide() {
        if (!this.container || !this.isVisible) return this;
        
        // Clear any pending hide timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        this.container.classList.add('hiding');
        
        setTimeout(() => {
            if (this.container) {
                this.container.classList.add('hidden');
                this.container.classList.remove('hiding');
                this.isVisible = false;
            }
        }, 300);
        
        return this;
    }

    setProgress(percentage, text = '') {
        if (!this.container) return this;
        
        percentage = Math.max(0, Math.min(100, percentage));
        this.progress = percentage;
        
        // Remove indeterminate state if setting specific progress
        if (this.isIndeterminate) {
            this.determinate();
        }
        
        if (this.progressFill) {
            if (this.options.animated) {
                this.progressFill.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
            this.progressFill.style.width = `${percentage}%`;
            
            // Add progress classes for visual feedback
            this.progressFill.classList.remove('progress-low', 'progress-medium', 'progress-high');
            if (percentage <= 30) {
                this.progressFill.classList.add('progress-low');
            } else if (percentage <= 70) {
                this.progressFill.classList.add('progress-medium');
            } else {
                this.progressFill.classList.add('progress-high');
            }
        }
        
        if (this.progressPercentage && this.options.showPercentage) {
            this.progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
        
        if (text && this.progressText && this.options.showText) {
            this.setText(text);
        }
        
        // Handle completion
        if (percentage >= 100) {
            this.handleCompletion();
        } else {
            this.container?.classList.remove('completed');
        }
        
        return this;
    }

    setText(text) {
        if (this.progressText) {
            this.text = text;
            this.progressText.textContent = text;
            
            // Add typing animation for text changes
            if (this.options.animated && text) {
                this.progressText.classList.add('text-updating');
                setTimeout(() => {
                    this.progressText?.classList.remove('text-updating');
                }, 200);
            }
        }
        return this;
    }

    setColor(color) {
        if (!this.container) return this;
        
        // Remove old color classes
        const colorClasses = ['primary', 'success', 'error', 'warning', 'info'];
        colorClasses.forEach(c => this.container.classList.remove(c));
        
        this.options.color = color;
        this.container.classList.add(color);
        
        return this;
    }

    pulse() {
        if (!this.container) return this;
        
        this.container.classList.add('pulse');
        setTimeout(() => {
            this.container?.classList.remove('pulse');
        }, 1000);
        
        return this;
    }

    error(message = 'Error occurred') {
        this.setColor('error');
        this.setText(message);
        this.pulse();
        
        // Auto-hide after longer delay for errors
        if (this.options.autoHide) {
            this.scheduleHide(this.options.hideDelay * 2);
        }
        
        return this;
    }

    success(message = 'Completed successfully') {
        this.setProgress(100, message);
        this.setColor('success');
        this.pulse();
        
        // Auto-hide after delay for success
        if (this.options.autoHide) {
            this.scheduleHide(this.options.hideDelay);
        }
        
        return this;
    }

    warning(message = 'Warning', percentage = null) {
        this.setColor('warning');
        this.setText(message);
        if (percentage !== null) {
            this.setProgress(percentage);
        }
        this.pulse();
        
        return this;
    }

    info(message = 'Processing...', percentage = null) {
        this.setColor('info');
        this.setText(message);
        if (percentage !== null) {
            this.setProgress(percentage);
        }
        
        return this;
    }

    indeterminate() {
        if (!this.container) return this;
        
        this.isIndeterminate = true;
        this.container.classList.add('indeterminate');
        
        if (this.progressPercentage) {
            this.progressPercentage.style.display = 'none';
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = '30%';
        }
        
        return this;
    }

    determinate() {
        if (!this.container) return this;
        
        this.isIndeterminate = false;
        this.container.classList.remove('indeterminate');
        
        if (this.progressPercentage && this.options.showPercentage) {
            this.progressPercentage.style.display = 'inline';
        }
        
        return this;
    }

    handleCompletion() {
        if (!this.container) return;
        
        setTimeout(() => {
            if (this.container) {
                this.container.classList.add('completed');
                
                // Add completion visual effects
                if (this.progressFill) {
                    this.progressFill.classList.add('completed-animation');
                }
                
                // Remove completion animation after effect
                setTimeout(() => {
                    this.progressFill?.classList.remove('completed-animation');
                }, 600);
            }
        }, 100);
    }

    scheduleHide(delay = null) {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        
        const hideDelay = delay !== null ? delay : this.options.hideDelay;
        
        this.hideTimeout = setTimeout(() => {
            this.hide();
        }, hideDelay);
    }

    reset() {
        this.progress = 0;
        this.text = '';
        this.isIndeterminate = false;
        
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
            this.progressFill.classList.remove('progress-low', 'progress-medium', 'progress-high', 'completed-animation');
        }
        
        if (this.progressPercentage) {
            this.progressPercentage.textContent = '0%';
            this.progressPercentage.style.display = this.options.showPercentage ? 'inline' : 'none';
        }
        
        if (this.progressText) {
            this.progressText.textContent = '';
        }
        
        this.container?.classList.remove('completed', 'pulse', 'indeterminate');
        this.setColor('primary');
        
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        
        return this;
    }

    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('progress-container');
        }
        
        this.container = null;
        this.progressBar = null;
        this.progressFill = null;
        this.progressText = null;
        this.progressPercentage = null;
    }

    // Utility methods for common use cases
    showLoading(text = 'Loading...') {
        this.show(text);
        this.indeterminate();
        return this;
    }

    showProgress(percentage, text = '') {
        this.show(text);
        this.determinate();
        this.setProgress(percentage, text);
        return this;
    }

    increment(amount = 1, text = '') {
        const newProgress = Math.min(100, this.progress + amount);
        this.setProgress(newProgress, text);
        return this;
    }
}

// ===============================================================
// Multi-step Progress Manager
// ===============================================================

class MultiStepProgress {
    constructor(container, steps = []) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.steps = steps;
        this.currentStep = 0;
        this.totalSteps = steps.length;
        this.stepStatuses = new Array(this.totalSteps).fill('pending'); // pending, active, completed, error
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Multi-step progress container not found');
            return;
        }
        
        this.container.className = 'multi-step-progress';
        this.container.innerHTML = this.createHTML();
        
        this.progressBar = new ProgressBar(this.container.querySelector('.overall-progress'), {
            size: 'large',
            animated: true,
            showText: true
        });
        
        this.stepsList = this.container.querySelector('.steps-list');
        
        // Initialize step elements
        this.stepElements = this.stepsList.querySelectorAll('.step-item');
    }

    createHTML() {
        const stepsHTML = this.steps.map((step, index) => `
            <div class="step-item" data-step="${index}">
                <div class="step-icon">
                    <span class="step-number">${index + 1}</span>
                    <i class="step-check" data-lucide="check"></i>
                    <i class="step-error" data-lucide="x"></i>
                    <div class="step-spinner">
                        <div class="spinner"></div>
                    </div>
                </div>
                <div class="step-content">
                    <div class="step-title">${step.title || `Step ${index + 1}`}</div>
                    <div class="step-description">${step.description || ''}</div>
                    <div class="step-progress" style="display: none;">
                        <div class="step-progress-bar">
                            <div class="step-progress-fill"></div>
                        </div>
                        <span class="step-progress-text"></span>
                    </div>
                </div>
                <div class="step-time" style="display: none;"></div>
            </div>
        `).join('');

        return `
            <div class="overall-progress"></div>
            <div class="steps-list">${stepsHTML}</div>
        `;
    }

    start(message = 'Starting process...') {
        this.currentStep = 0;
        this.stepStatuses.fill('pending');
        this.updateUI();
        this.progressBar.show(message);
        return this;
    }

    nextStep(message = '', stepProgress = null) {
        if (this.currentStep < this.totalSteps) {
            // Complete current step
            if (this.currentStep >= 0) {
                this.stepStatuses[this.currentStep] = 'completed';
            }
            
            // Move to next step
            this.currentStep++;
            if (this.currentStep < this.totalSteps) {
                this.stepStatuses[this.currentStep] = 'active';
            }
            
            this.updateUI();
            
            if (message) {
                this.progressBar.setText(message);
            }
            
            if (stepProgress !== null && this.currentStep < this.totalSteps) {
                this.setStepProgress(this.currentStep, stepProgress);
            }
        }
        return this;
    }

    setStep(stepIndex, status = 'active', message = '', stepProgress = null) {
        if (stepIndex >= 0 && stepIndex < this.totalSteps) {
            this.currentStep = stepIndex;
            this.stepStatuses[stepIndex] = status;
            
            this.updateUI();
            
            if (message) {
                this.progressBar.setText(message);
            }
            
            if (stepProgress !== null) {
                this.setStepProgress(stepIndex, stepProgress);
            }
        }
        return this;
    }

    setStepProgress(stepIndex, progress, text = '') {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) return this;
        
        const stepElement = this.stepElements[stepIndex];
        if (!stepElement) return this;
        
        const progressContainer = stepElement.querySelector('.step-progress');
        const progressFill = stepElement.querySelector('.step-progress-fill');
        const progressText = stepElement.querySelector('.step-progress-text');
        
        if (progress === null || progress < 0) {
            progressContainer.style.display = 'none';
        } else {
            progressContainer.style.display = 'block';
            
            if (progressFill) {
                progressFill.style.width = `${Math.min(100, progress)}%`;
            }
            
            if (progressText && text) {
                progressText.textContent = text;
            }
        }
        
        return this;
    }

    complete(message = 'All steps completed') {
        // Mark all steps as completed
        this.stepStatuses.fill('completed');
        this.currentStep = this.totalSteps;
        
        this.updateUI();
        this.progressBar.success(message);
        
        return this;
    }

    error(stepIndex = null, message = 'Error in process') {
        const errorStep = stepIndex !== null ? stepIndex : this.currentStep;
        
        if (errorStep >= 0 && errorStep < this.totalSteps) {
            this.stepStatuses[errorStep] = 'error';
        }
        
        this.updateUI();
        this.progressBar.error(message);
        
        return this;
    }

    updateUI() {
        // Calculate overall progress
        const completedSteps = this.stepStatuses.filter(s => s === 'completed').length;
        const percentage = this.totalSteps > 0 ? (completedSteps / this.totalSteps) * 100 : 0;
        
        // Update overall progress bar
        if (this.currentStep >= this.totalSteps) {
            this.progressBar.setProgress(100);
        } else {
            this.progressBar.setProgress(percentage);
        }
        
        // Update individual steps
        this.stepElements.forEach((element, index) => {
            const status = this.stepStatuses[index];
            
            // Remove all status classes
            element.classList.remove('pending', 'active', 'completed', 'error');
            element.classList.add(status);
            
            // Update time display for completed steps
            const timeElement = element.querySelector('.step-time');
            if (status === 'completed' && timeElement) {
                timeElement.textContent = new Date().toLocaleTimeString();
                timeElement.style.display = 'block';
            } else if (timeElement) {
                timeElement.style.display = 'none';
            }
        });
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    hide() {
        this.progressBar.hide();
        return this;
    }

    reset() {
        this.currentStep = 0;
        this.stepStatuses.fill('pending');
        this.progressBar.reset();
        
        // Reset all step progress bars
        this.stepElements.forEach(element => {
            const progressContainer = element.querySelector('.step-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
            
            const timeElement = element.querySelector('.step-time');
            if (timeElement) {
                timeElement.style.display = 'none';
            }
        });
        
        this.updateUI();
        
        return this;
    }

    destroy() {
        if (this.progressBar) {
            this.progressBar.destroy();
        }
        
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('multi-step-progress');
        }
        
        this.container = null;
        this.stepsList = null;
        this.stepElements = null;
        this.progressBar = null;
    }
}

// ===============================================================
// Loading Bar for Stat Displays
// ===============================================================

class LoadingBar {
    static create(element, options = {}) {
        if (!element) return null;
        
        const config = {
            duration: 1500,
            delay: 0,
            ...options
        };
        
        // Create loading bar HTML
        const loadingBar = document.createElement('div');
        loadingBar.className = 'loading-bar';
        
        const fill = document.createElement('div');
        fill.className = 'loading-bar-fill';
        loadingBar.appendChild(fill);
        
        // Store original content
        const originalContent = element.innerHTML;
        element.innerHTML = '';
        element.appendChild(loadingBar);
        
        // Add loading state class
        element.classList.add('loading');
        
        return {
            complete: (content, delay = config.delay) => {
                setTimeout(() => {
                    element.classList.remove('loading');
                    element.innerHTML = content || originalContent;
                    
                    // Add completion animation
                    element.classList.add('loaded');
                    setTimeout(() => {
                        element.classList.remove('loaded');
                    }, 500);
                }, delay);
            },
            error: (content = 'Error') => {
                element.classList.remove('loading');
                element.classList.add('error');
                element.innerHTML = `<span class="error-text">${content}</span>`;
            },
            update: (content) => {
                if (element.classList.contains('loading')) {
                    // If still loading, just update the content for when it completes
                    element.setAttribute('data-final-content', content);
                } else {
                    element.innerHTML = content;
                }
            }
        };
    }

    static createMultiple(elements, options = {}) {
        const bars = Array.from(elements).map(el => LoadingBar.create(el, options));
        
        return {
            complete: (contents, delay) => {
                bars.forEach((bar, index) => {
                    if (bar) {
                        const content = Array.isArray(contents) ? contents[index] : contents;
                        bar.complete(content, delay);
                    }
                });
            },
            error: (content) => {
                bars.forEach(bar => {
                    if (bar) bar.error(content);
                });
            }
        };
    }
}

// ===============================================================
// Upload Progress Manager
// ===============================================================

class UploadProgressManager {
    constructor() {
        this.uploads = new Map();
        this.totalBytes = 0;
        this.uploadedBytes = 0;
        this.startTime = null;
    }

    addUpload(id, file) {
        this.uploads.set(id, {
            file,
            progress: 0,
            uploaded: 0,
            total: file.size,
            speed: 0,
            status: 'pending', // pending, uploading, completed, error
            startTime: null,
            endTime: null
        });
        
        this.totalBytes += file.size;
        this.updateOverallProgress();
    }

    updateUpload(id, progress, uploaded) {
        const upload = this.uploads.get(id);
        if (!upload) return;
        
        const prevUploaded = upload.uploaded;
        upload.progress = progress;
        upload.uploaded = uploaded;
        
        // Calculate speed
        if (upload.startTime) {
            const elapsed = (Date.now() - upload.startTime) / 1000;
            upload.speed = uploaded / elapsed;
        }
        
        // Update total uploaded bytes
        this.uploadedBytes += (uploaded - prevUploaded);
        
        this.updateOverallProgress();
    }

    completeUpload(id) {
        const upload = this.uploads.get(id);
        if (!upload) return;
        
        upload.status = 'completed';
        upload.progress = 100;
        upload.endTime = Date.now();
        
        this.updateOverallProgress();
    }

    errorUpload(id, error) {
        const upload = this.uploads.get(id);
        if (!upload) return;
        
        upload.status = 'error';
        upload.error = error;
        upload.endTime = Date.now();
        
        this.updateOverallProgress();
    }

    startUpload(id) {
        const upload = this.uploads.get(id);
        if (!upload) return;
        
        upload.status = 'uploading';
        upload.startTime = Date.now();
        
        if (!this.startTime) {
            this.startTime = Date.now();
        }
        
        this.updateOverallProgress();
    }

    updateOverallProgress() {
        const overallProgress = this.totalBytes > 0 ? (this.uploadedBytes / this.totalBytes) * 100 : 0;
        const completedUploads = Array.from(this.uploads.values()).filter(u => u.status === 'completed').length;
        const totalUploads = this.uploads.size;
        
        // Calculate overall speed
        let overallSpeed = 0;
        if (this.startTime) {
            const elapsed = (Date.now() - this.startTime) / 1000;
            overallSpeed = this.uploadedBytes / elapsed;
        }
        
        return {
            progress: overallProgress,
            completedUploads,
            totalUploads,
            speed: overallSpeed,
            uploadedBytes: this.uploadedBytes,
            totalBytes: this.totalBytes,
            uploads: Array.from(this.uploads.entries())
        };
    }

    getUploadStats() {
        const stats = this.updateOverallProgress();
        const activeUploads = Array.from(this.uploads.values()).filter(u => u.status === 'uploading').length;
        const errorUploads = Array.from(this.uploads.values()).filter(u => u.status === 'error').length;
        
        // Estimate time remaining
        let timeRemaining = 0;
        if (stats.speed > 0 && stats.totalBytes > stats.uploadedBytes) {
            timeRemaining = (stats.totalBytes - stats.uploadedBytes) / stats.speed;
        }
        
        return {
            ...stats,
            activeUploads,
            errorUploads,
            timeRemaining,
            isComplete: stats.completedUploads === stats.totalUploads,
            hasErrors: errorUploads > 0
        };
    }

    reset() {
        this.uploads.clear();
        this.totalBytes = 0;
        this.uploadedBytes = 0;
        this.startTime = null;
    }

    formatSpeed(bytesPerSecond) {
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        let size = bytesPerSecond;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    }
}

// Export classes
window.ProgressBar = ProgressBar;
window.MultiStepProgress = MultiStepProgress;
window.LoadingBar = LoadingBar;
window.UploadProgressManager = UploadProgressManager;
