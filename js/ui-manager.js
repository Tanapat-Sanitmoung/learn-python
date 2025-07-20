/**
 * UI Manager - Handles user interface interactions and responsive design
 */

class UIManager {
    constructor() {
        this.isMobile = window.innerWidth <= 768 || window.innerHeight <= 600;
        this.isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
        
        this.activePanel = null;
        this.filterValues = {};
        this.cropMode = false;
        this.cropData = null;
        
        // Event callbacks
        this.onFilterChange = null;
        this.onPerformanceChange = null;
        this.onCropApplied = null;
        this.onToolSelected = null;
    }
    
    init() {
        console.log('🎛️ Initializing UI Manager...');
        
        // Detect device type
        this.detectDeviceType();
        
        // Set up responsive design
        this.setupResponsiveDesign();
        
        // Initialize filter controls
        this.initializeFilterControls();
        
        // Initialize crop controls
        this.initializeCropControls();
        
        // Initialize performance controls
        this.initializePerformanceControls();
        
        // Set up mobile UI
        this.setupMobileUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Handle initial window size
        this.handleResize();
        
        console.log('✅ UI Manager initialized');
        console.log(`📱 Device type: ${this.isMobile ? 'Mobile' : this.isTablet ? 'Tablet' : 'Desktop'}`);
    }
    
    detectDeviceType() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.isMobile = width <= 768 || height <= 600;
        this.isTablet = width <= 1024 && width > 768 && !this.isMobile;
        
        // Also check for touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (hasTouch && !this.isMobile) {
            this.isTablet = true;
        }
    }
    
    setupResponsiveDesign() {
        const body = document.body;
        
        // Add device class to body
        body.classList.remove('mobile', 'tablet', 'desktop');
        
        if (this.isMobile) {
            body.classList.add('mobile');
        } else if (this.isTablet) {
            body.classList.add('tablet');
        } else {
            body.classList.add('desktop');
        }
        
        // Update CSS custom properties for dynamic sizing
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    
    initializeFilterControls() {
        // Brightness control
        const brightnessSlider = document.getElementById('brightness');
        const brightnessValue = document.getElementById('brightness-value');
        
        if (brightnessSlider && brightnessValue) {
            this.setupSliderControl(brightnessSlider, brightnessValue, 'brightness', '%');
        }
        
        // Contrast control
        const contrastSlider = document.getElementById('contrast');
        const contrastValue = document.getElementById('contrast-value');
        
        if (contrastSlider && contrastValue) {
            this.setupSliderControl(contrastSlider, contrastValue, 'contrast', '%');
        }
        
        // Saturation control
        const saturationSlider = document.getElementById('saturation');
        const saturationValue = document.getElementById('saturation-value');
        
        if (saturationSlider && saturationValue) {
            this.setupSliderControl(saturationSlider, saturationValue, 'saturation', '%');
        }
        
        // Store initial filter values
        this.filterValues = {
            brightness: 100,
            contrast: 100,
            saturation: 100
        };
    }
    
    setupSliderControl(slider, valueDisplay, filterName, unit) {
        slider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            valueDisplay.textContent = value + unit;
            
            this.filterValues[filterName] = value;
            
            // Debounce filter application
            clearTimeout(this.filterTimeout);
            this.filterTimeout = setTimeout(() => {
                if (this.onFilterChange) {
                    this.onFilterChange(this.filterValues);
                }
            }, 100);
        });
        
        // Initialize display
        valueDisplay.textContent = slider.value + unit;
    }
    
    initializeCropControls() {
        const cropBtn = document.getElementById('crop-btn');
        const mobileCropBtn = document.getElementById('mobile-crop-btn');
        const cropControls = document.getElementById('crop-controls');
        const applyCropBtn = document.getElementById('apply-crop-btn');
        const cancelCropBtn = document.getElementById('cancel-crop-btn');
        const cropRatioSelect = document.getElementById('crop-ratio');
        
        // Crop button handlers
        [cropBtn, mobileCropBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.toggleCropMode());
            }
        });
        
        // Apply crop
        if (applyCropBtn) {
            applyCropBtn.addEventListener('click', () => this.applyCrop());
        }
        
        // Cancel crop
        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', () => this.cancelCrop());
        }
        
        // Crop ratio change
        if (cropRatioSelect) {
            cropRatioSelect.addEventListener('change', (e) => {
                this.updateCropRatio(e.target.value);
            });
        }
    }
    
    initializePerformanceControls() {
        // Desktop performance controls
        const performanceMode = document.getElementById('performance-mode');
        const enable3DRotation = document.getElementById('enable-3d-rotation');
        const enableLighting = document.getElementById('enable-lighting');
        
        // Mobile performance controls
        const mobilePerformance = document.getElementById('mobile-performance');
        const mobile3DRotation = document.getElementById('mobile-3d-rotation');
        const mobileLighting = document.getElementById('mobile-lighting');
        
        // Performance mode handlers
        [performanceMode, mobilePerformance].forEach(select => {
            if (select) {
                select.addEventListener('change', (e) => {
                    this.updatePerformanceMode(e.target.value);
                });
            }
        });
        
        // 3D rotation handlers
        [enable3DRotation, mobile3DRotation].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggle3DRotation(e.target.checked);
                });
            }
        });
        
        // Lighting handlers
        [enableLighting, mobileLighting].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggleLighting(e.target.checked);
                });
            }
        });
    }
    
    setupMobileUI() {
        if (!this.isMobile) return;
        
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Orientation change for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Filter buttons
        const filtersBtn = document.getElementById('filters-btn');
        const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
        
        [filtersBtn, mobileFiltersBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.toggleFiltersPanel());
            }
        });
    }
    
    handleResize() {
        // Update device type detection
        this.detectDeviceType();
        
        // Update responsive design
        this.setupResponsiveDesign();
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        
        // Adjust UI elements for new size
        this.adjustUIForSize();
    }
    
    adjustUIForSize() {
        // Hide/show elements based on size
        const desktopElements = document.querySelectorAll('.desktop-only');
        const mobileElements = document.querySelectorAll('.mobile-only');
        
        desktopElements.forEach(el => {
            el.style.display = this.isMobile ? 'none' : '';
        });
        
        mobileElements.forEach(el => {
            el.style.display = this.isMobile ? '' : 'none';
        });
        
        // Adjust panel sizes for tablets
        if (this.isTablet) {
            const sidePanel = document.getElementById('side-panel');
            if (sidePanel) {
                sidePanel.style.width = '180px';
            }
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case 'c':
                if (!e.ctrlKey && !e.metaKey) {
                    this.toggleCropMode();
                    e.preventDefault();
                }
                break;
                
            case 'e':
                if (!e.ctrlKey && !e.metaKey) {
                    this.toggleEmojiPanel();
                    e.preventDefault();
                }
                break;
                
            case 'f':
                if (!e.ctrlKey && !e.metaKey) {
                    this.toggleFiltersPanel();
                    e.preventDefault();
                }
                break;
                
            case 'r':
                if (!e.ctrlKey && !e.metaKey) {
                    this.resetFilters();
                    e.preventDefault();
                }
                break;
                
            case 'escape':
                this.closeAllPanels();
                break;
        }
    }
    
    updateImageControls(hasImage) {
        // Enable/disable controls based on whether an image is loaded
        const controls = [
            'save-btn', 'mobile-save-btn',
            'crop-btn', 'mobile-crop-btn',
            'emoji-btn', 'mobile-emoji-btn',
            'filters-btn', 'mobile-filters-btn',
            'brightness', 'contrast', 'saturation'
        ];
        
        controls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !hasImage;
                if (hasImage) {
                    element.classList.remove('disabled');
                } else {
                    element.classList.add('disabled');
                }
            }
        });
    }
    
    toggleCropMode() {
        this.cropMode = !this.cropMode;
        
        const cropControls = document.getElementById('crop-controls');
        const cropBtns = ['crop-btn', 'mobile-crop-btn'];
        
        if (this.cropMode) {
            // Enter crop mode
            if (cropControls) {
                cropControls.style.display = 'block';
            }
            
            cropBtns.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.classList.add('active');
                    btn.textContent = btn.textContent.replace('✂️ Crop', '✂️ Exit Crop');
                }
            });
            
            this.showCropOverlay();
            console.log('✂️ Entered crop mode');
            
        } else {
            // Exit crop mode
            if (cropControls) {
                cropControls.style.display = 'none';
            }
            
            cropBtns.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    btn.classList.remove('active');
                    btn.textContent = btn.textContent.replace('✂️ Exit Crop', '✂️ Crop');
                }
            });
            
            this.hideCropOverlay();
            console.log('✂️ Exited crop mode');
        }
    }
    
    showCropOverlay() {
        // This would create a crop overlay UI
        // For now, just log the action
        console.log('📐 Showing crop overlay');
    }
    
    hideCropOverlay() {
        // This would hide the crop overlay UI
        console.log('📐 Hiding crop overlay');
    }
    
    applyCrop() {
        if (!this.cropData) {
            console.warn('No crop area selected');
            return;
        }
        
        if (this.onCropApplied) {
            this.onCropApplied(this.cropData);
        }
        
        this.toggleCropMode();
        console.log('✂️ Crop applied');
    }
    
    cancelCrop() {
        this.cropData = null;
        this.toggleCropMode();
        console.log('✂️ Crop cancelled');
    }
    
    updateCropRatio(ratio) {
        console.log('📐 Crop ratio updated:', ratio);
        // This would update the crop overlay to use the new ratio
    }
    
    updatePerformanceMode(mode) {
        let settings = {};
        
        switch (mode) {
            case '60fps':
                settings = { targetFPS: 60, qualityMode: 'performance' };
                break;
            case '30fps':
                settings = { targetFPS: 30, qualityMode: 'balanced' };
                break;
            case 'quality':
                settings = { targetFPS: 30, qualityMode: 'quality' };
                break;
        }
        
        if (this.onPerformanceChange) {
            this.onPerformanceChange(settings);
        }
        
        console.log('⚡ Performance mode updated:', mode);
    }
    
    toggle3DRotation(enabled) {
        if (window.app && window.app.sceneManager) {
            window.app.sceneManager.enable3DRotation(enabled);
        }
        
        // Sync checkboxes
        const checkboxes = ['enable-3d-rotation', 'mobile-3d-rotation'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked !== enabled) {
                checkbox.checked = enabled;
            }
        });
        
        console.log('🔄 3D Rotation:', enabled ? 'enabled' : 'disabled');
    }
    
    toggleLighting(enabled) {
        if (window.app && window.app.sceneManager) {
            window.app.sceneManager.enableLighting(enabled);
        }
        
        // Sync checkboxes
        const checkboxes = ['enable-lighting', 'mobile-lighting'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked !== enabled) {
                checkbox.checked = enabled;
            }
        });
        
        console.log('💡 Lighting:', enabled ? 'enabled' : 'disabled');
    }
    
    toggleFiltersPanel() {
        // For now, just focus on the filters section
        const filtersSection = document.querySelector('.panel-section h3');
        if (filtersSection && filtersSection.textContent.includes('Filters')) {
            filtersSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('🎨 Filters panel toggled');
    }
    
    toggleEmojiPanel() {
        if (window.app && window.app.emojiManager) {
            window.app.emojiManager.toggleEmojiPanel();
        }
    }
    
    resetFilters() {
        // Reset all filter sliders to default values
        const sliders = [
            { id: 'brightness', value: 100, display: 'brightness-value' },
            { id: 'contrast', value: 100, display: 'contrast-value' },
            { id: 'saturation', value: 100, display: 'saturation-value' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const display = document.getElementById(slider.display);
            
            if (element) {
                element.value = slider.value;
            }
            
            if (display) {
                display.textContent = slider.value + '%';
            }
        });
        
        // Reset filter values
        this.filterValues = {
            brightness: 100,
            contrast: 100,
            saturation: 100
        };
        
        // Apply reset filters
        if (this.onFilterChange) {
            this.onFilterChange(this.filterValues);
        }
        
        console.log('🔄 Filters reset to default values');
    }
    
    closeAllPanels() {
        // Close emoji panel
        const emojiPanel = document.getElementById('emoji-panel');
        if (emojiPanel) {
            emojiPanel.classList.add('hidden');
        }
        
        // Close mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
        }
        
        // Exit crop mode
        if (this.cropMode) {
            this.toggleCropMode();
        }
        
        console.log('🚪 All panels closed');
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4488ff'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    updateProgressBar(progress, message = '') {
        // This could be used for loading states
        console.log(`Progress: ${progress}% ${message}`);
    }
    
    showLoadingState(element, loading = true) {
        if (!element) return;
        
        if (loading) {
            element.classList.add('loading');
            element.disabled = true;
        } else {
            element.classList.remove('loading');
            element.disabled = false;
        }
    }
    
    createTooltip(element, text) {
        if (!element) return;
        
        element.title = text;
        
        // Could be enhanced with custom tooltip implementation
    }
    
    getDeviceInfo() {
        return {
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            isDesktop: !this.isMobile && !this.isTablet,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            hasTouch: 'ontouchstart' in window,
            userAgent: navigator.userAgent
        };
    }
    
    dispose() {
        // Clean up any event listeners or resources
        this.activePanel = null;
        this.filterValues = {};
        this.cropMode = false;
        this.cropData = null;
        
        console.log('🧹 UI Manager disposed');
    }
}
