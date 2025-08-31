// Enhanced Progress Bar Component
class ProgressBar {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            showPercentage: true,
            showText: true,
            animated: true,
            color: 'primary',
            size: 'medium',
            ...options
        };
        
        this.progress = 0;
        this.text = '';
        this.isVisible = false;
        
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Progress bar container not found');
            return;
        }

        this.container.className = `progress-container ${this.options.size} ${this.options.color}`;
        this.container.innerHTML = this.createHTML();
        
        this.progressFill = this.container.querySelector('.progress-fill');
        this.progressText = this.container.querySelector('.progress-text');
        this.progressPercentage = this.container.querySelector('.progress-percentage');
        
        if (this.options.animated) {
            this.container.classList.add('animated');
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
        if (!this.container) return;
        
        this.isVisible = true;
        this.container.classList.remove('hidden');
        this.container.style.opacity = '0';
        
        // Fade in animation
        requestAnimationFrame(() => {
            this.container.style.transition = 'opacity 0.3s ease-in-out';
            this.container.style.opacity = '1';
        });
        
        if (text) {
            this.setText(text);
        }
        
        return this;
    }

    hide() {
        if (!this.container || !this.isVisible) return;
        
        this.container.style.transition = 'opacity 0.3s ease-in-out';
        this.container.style.opacity = '0';
        
        setTimeout(() => {
            if (this.container) {
                this.container.classList.add('hidden');
                this.isVisible = false;
            }
        }, 300);
        
        return this;
    }

    setProgress(percentage, text = '') {
        if (!this.container) return;
        
        percentage = Math.max(0, Math.min(100, percentage));
        this.progress = percentage;
        
        if (this.progressFill) {
            // Smooth animation
            if (this.options.animated) {
                this.progressFill.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            }
            this.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.progressPercentage && this.options.showPercentage) {
            this.progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
        
        if (text && this.progressText && this.options.showText) {
            this.setText(text);
        }
        
        // Add completion effect
        if (percentage >= 100) {
            setTimeout(() => {
                if (this.container) {
                    this.container.classList.add('completed');
                }
            }, 300);
        } else {
            this.container?.classList.remove('completed');
        }
        
        return this;
    }

    setText(text) {
        if (this.progressText) {
            this.text = text;
            this.progressText.textContent = text;
        }
        return this;
    }

    setColor(color) {
        if (!this.container) return;
        
        this.container.classList.remove(this.options.color);
        this.options.color = color;
        this.container.classList.add(color);
        
        return this;
    }

    pulse() {
        if (!this.container) return;
        
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
        return this;
    }

    success(message = 'Completed successfully') {
        this.setProgress(100, message);
        this.setColor('success');
        return this;
    }

    indeterminate() {
        if (!this.container) return;
        
        this.container.classList.add('indeterminate');
        if (this.progressPercentage) {
            this.progressPercentage.style.display = 'none';
        }
        
        return this;
    }

    determinate() {
        if (!this.container) return;
        
        this.container.classList.remove('indeterminate');
        if (this.progressPercentage && this.options.showPercentage) {
            this.progressPercentage.style.display = 'inline';
        }
        
        return this;
    }

    reset() {
        this.progress = 0;
        this.text = '';
        
        if (this.progressFill) {
            this.progressFill.style.width = '0%';
        }
        
        if (this.progressPercentage) {
            this.progressPercentage.textContent = '0%';
        }
        
        if (this.progressText) {
            this.progressText.textContent = '';
        }
        
        this.container?.classList.remove('completed', 'pulse');
        this.setColor('primary');
        
        return this;
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('progress-container');
        }
        
        this.container = null;
        this.progressFill = null;
        this.progressText = null;
        this.progressPercentage = null;
    }
}

// Multi-step progress manager
class MultiStepProgress {
    constructor(container, steps = []) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.steps = steps;
        this.currentStep = 0;
        this.totalSteps = steps.length;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.container.className = 'multi-step-progress';
        this.container.innerHTML = this.createHTML();
        
        this.progressBar = new ProgressBar(this.container.querySelector('.overall-progress'), {
            size: 'large',
            animated: true
        });
        
        this.stepsList = this.container.querySelector('.steps-list');
    }

    createHTML() {
        const stepsHTML = this.steps.map((step, index) => `
            <div class="step-item" data-step="${index}">
                <div class="step-icon">
                    <span class="step-number">${index + 1}</span>
                    <i class="step-check" data-lucide="check"></i>
                </div>
                <div class="step-content">
                    <div class="step-title">${step.title || `Step ${index + 1}`}</div>
                    <div class="step-description">${step.description || ''}</div>
                </div>
            </div>
        `).join('');

        return `
            <div class="overall-progress"></div>
            <div class="steps-list">${stepsHTML}</div>
        `;
    }

    start() {
        this.currentStep = 0;
        this.updateUI();
        this.progressBar.show();
        return this;
    }

    nextStep(message = '') {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateUI();
            
            if (message) {
                this.progressBar.setText(message);
            }
        }
        return this;
    }

    setStep(stepIndex, message = '') {
        if (stepIndex >= 0 && stepIndex <= this.totalSteps) {
            this.currentStep = stepIndex;
            this.updateUI();
            
            if (message) {
                this.progressBar.setText(message);
            }
        }
        return this;
    }

    complete(message = 'All steps completed') {
        this.currentStep = this.totalSteps;
        this.updateUI();
        this.progressBar.success(message);
        return this;
    }

    error(message = 'Error in process') {
        this.progressBar.error(message);
        
        // Mark current step as error
        if (this.stepsList) {
            const currentStepElement = this.stepsList.querySelector(`[data-step="${this.currentStep}"]`);
            if (currentStepElement) {
                currentStepElement.classList.add('error');
            }
        }
        
        return this;
    }

    updateUI() {
        const percentage = this.totalSteps > 0 ? (this.currentStep / this.totalSteps) * 100 : 0;
        this.progressBar.setProgress(percentage);
        
        if (this.stepsList) {
            const stepElements = this.stepsList.querySelectorAll('.step-item');
            stepElements.forEach((element, index) => {
                element.classList.remove('active', 'completed', 'error');
                
                if (index < this.currentStep) {
                    element.classList.add('completed');
                } else if (index === this.currentStep) {
                    element.classList.add('active');
                }
            });
        }
        
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
        this.progressBar.reset();
        
        if (this.stepsList) {
            const stepElements = this.stepsList.querySelectorAll('.step-item');
            stepElements.forEach(element => {
                element.classList.remove('active', 'completed', 'error');
            });
        }
        
        return this;
    }
}

// Loading bar for stat displays
class LoadingBar {
    static create(element, options = {}) {
        if (!element) return null;
        
        const loadingBar = document.createElement('div');
        loadingBar.className = 'loading-bar';
        
        const fill = document.createElement('div');
        fill.className = 'loading-bar-fill';
        loadingBar.appendChild(fill);
        
        // Store original content
        const originalContent = element.innerHTML;
        element.innerHTML = '';
        element.appendChild(loadingBar);
        
        return {
            complete: (content) => {
                setTimeout(() => {
                    element.innerHTML = content || originalContent;
                }, options.delay || 0);
            },
            error: (content = 'Error') => {
                element.innerHTML = `<span class="error-text">${content}</span>`;
            }
        };
    }
}

// Export classes
window.ProgressBar = ProgressBar;
window.MultiStepProgress = MultiStepProgress;
window.LoadingBar = LoadingBar;
