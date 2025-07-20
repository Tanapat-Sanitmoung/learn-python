/**
 * Main Application Controller
 * Coordinates all modules and handles initialization
 */

class App {
    constructor() {
        this.sceneManager = null;
        this.imageProcessor = null;
        this.emojiManager = null;
        this.projectManager = null;
        this.uiManager = null;
        
        this.isInitialized = false;
        this.currentImage = null;
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 20;
        
        this.performanceSettings = {
            targetFPS: 60,
            qualityMode: 'balanced' // 'performance', 'balanced', 'quality'
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🚀 Initializing 3D Image Editor...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize touch controls for mobile
            this.setupTouchControls();
            
            // Hide loading screen and show main interface
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            console.log('✅ 3D Image Editor initialized successfully!');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize the application. Please refresh and try again.');
        }
    }
    
    async initializeModules() {
        // Initialize Scene Manager (Three.js setup)
        this.sceneManager = new SceneManager();
        await this.sceneManager.init();
        
        // Initialize Image Processor
        this.imageProcessor = new ImageProcessor();
        
        // Initialize Emoji Manager
        this.emojiManager = new EmojiManager();
        await this.emojiManager.init();
        
        // Initialize Project Manager
        this.projectManager = new ProjectManager();
        
        // Initialize UI Manager
        this.uiManager = new UIManager();
        this.uiManager.init();
        
        // Connect modules
        this.connectModules();
    }
    
    connectModules() {
        // Scene Manager connections
        this.sceneManager.onImageLoaded = (imageData) => {
            this.currentImage = imageData;
            this.saveState();
            this.uiManager.updateImageControls(true);
        };
        
        // Image Processor connections
        this.imageProcessor.onImageProcessed = (processedImage) => {
            this.sceneManager.updateTexture(processedImage);
            this.saveState();
        };
        
        // Emoji Manager connections
        this.emojiManager.onEmojiAdded = (emojiData) => {
            this.sceneManager.addEmoji(emojiData);
            this.saveState();
        };
        
        // Project Manager connections
        this.projectManager.onProjectLoaded = (projectData) => {
            this.loadProject(projectData);
        };
        
        // UI Manager connections
        this.uiManager.onFilterChange = (filterData) => {
            this.imageProcessor.applyFilters(this.currentImage, filterData);
        };
        
        this.uiManager.onPerformanceChange = (settings) => {
            this.updatePerformanceSettings(settings);
        };
    }
    
    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('file-input');
        const uploadBtns = ['upload-btn', 'mobile-upload-btn'];
        
        uploadBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => fileInput.click());
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.loadImage(e.target.files[0]);
            }
        });
        
        // Drag and drop
        this.setupDragAndDrop();
        
        // Save functions
        const saveBtns = ['save-btn', 'mobile-save-btn'];
        saveBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.saveImage());
            }
        });
        
        // Project save/load
        const saveProjectBtns = ['save-project-btn', 'mobile-save-project-btn'];
        saveProjectBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.saveProject());
            }
        });
        
        const loadProjectBtns = ['load-project-btn', 'mobile-load-project-btn'];
        loadProjectBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.loadProjectDialog());
            }
        });
        
        // Undo/Redo
        const undoBtns = ['undo-btn', 'mobile-undo-btn'];
        undoBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.undo());
            }
        });
        
        const redoBtns = ['redo-btn', 'mobile-redo-btn'];
        redoBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.redo());
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 's':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.saveProject();
                        } else {
                            this.saveImage();
                        }
                        break;
                    case 'o':
                        e.preventDefault();
                        fileInput.click();
                        break;
                }
            }
        });
        
        // Performance monitoring
        this.startPerformanceMonitoring();
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.sceneManager) {
                this.sceneManager.onWindowResize();
            }
        });
    }
    
    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        const canvasContainer = document.getElementById('canvas-container');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            canvasContainer.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        canvasContainer.addEventListener('dragenter', () => {
            dropZone.classList.remove('hidden');
        });
        
        canvasContainer.addEventListener('dragleave', (e) => {
            if (!canvasContainer.contains(e.relatedTarget)) {
                dropZone.classList.add('hidden');
            }
        });
        
        canvasContainer.addEventListener('drop', (e) => {
            dropZone.classList.add('hidden');
            
            const files = Array.from(e.dataTransfer.files);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length > 0) {
                this.loadImage(imageFiles[0]);
            }
        });
    }
    
    setupTouchControls() {
        if (!this.isMobile()) return;
        
        const canvas = document.getElementById('three-canvas');
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTouchDistance = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            
            if (e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                
                if (this.sceneManager && this.sceneManager.controls) {
                    this.sceneManager.rotateCamera(deltaX * 0.01, deltaY * 0.01);
                }
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                const deltaDistance = currentDistance - lastTouchDistance;
                
                if (this.sceneManager && this.sceneManager.controls) {
                    this.sceneManager.zoomCamera(deltaDistance * 0.01);
                }
                
                lastTouchDistance = currentDistance;
            }
        });
    }
    
    async loadImage(file) {
        try {
            console.log('📁 Loading image:', file.name);
            
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('Image file is too large. Please select a file smaller than 10MB');
            }
            
            const imageData = await this.imageProcessor.loadImage(file);
            await this.sceneManager.loadImage(imageData);
            
            this.clearHistory();
            
            console.log('✅ Image loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load image:', error);
            this.showError(`Failed to load image: ${error.message}`);
        }
    }
    
    saveImage() {
        if (!this.currentImage) {
            this.showError('No image to save');
            return;
        }
        
        try {
            const canvas = this.sceneManager.renderToCanvas();
            
            // Create download link
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `edited-image-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('💾 Image saved successfully');
            }, 'image/png', 1.0);
            
        } catch (error) {
            console.error('❌ Failed to save image:', error);
            this.showError(`Failed to save image: ${error.message}`);
        }
    }
    
    saveProject() {
        if (!this.currentImage) {
            this.showError('No project to save');
            return;
        }
        
        try {
            const projectData = this.projectManager.createProject({
                image: this.currentImage,
                scene: this.sceneManager.getSceneData(),
                filters: this.imageProcessor.getCurrentFilters(),
                emojis: this.emojiManager.getEmojis(),
                version: '1.0'
            });
            
            // Download project file
            const blob = new Blob([JSON.stringify(projectData, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('💾 Project saved successfully');
            
        } catch (error) {
            console.error('❌ Failed to save project:', error);
            this.showError(`Failed to save project: ${error.message}`);
        }
    }
    
    loadProjectDialog() {
        const projectInput = document.getElementById('project-input');
        projectInput.click();
        
        projectInput.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.loadProjectFile(e.target.files[0]);
            }
        };
    }
    
    async loadProjectFile(file) {
        try {
            const text = await file.text();
            const projectData = JSON.parse(text);
            await this.loadProject(projectData);
            
            console.log('📂 Project loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load project:', error);
            this.showError(`Failed to load project: ${error.message}`);
        }
    }
    
    async loadProject(projectData) {
        try {
            // Load image
            if (projectData.image) {
                await this.sceneManager.loadImage(projectData.image);
                this.currentImage = projectData.image;
            }
            
            // Restore scene
            if (projectData.scene) {
                this.sceneManager.loadSceneData(projectData.scene);
            }
            
            // Apply filters
            if (projectData.filters) {
                this.imageProcessor.applyFilters(this.currentImage, projectData.filters);
            }
            
            // Add emojis
            if (projectData.emojis) {
                this.emojiManager.loadEmojis(projectData.emojis);
            }
            
            this.clearHistory();
            this.saveState();
            
        } catch (error) {
            throw new Error(`Invalid project file: ${error.message}`);
        }
    }
    
    saveState() {
        if (!this.currentImage) return;
        
        const state = {
            timestamp: Date.now(),
            image: this.currentImage,
            scene: this.sceneManager.getSceneData(),
            filters: this.imageProcessor.getCurrentFilters(),
            emojis: this.emojiManager.getEmojis()
        };
        
        this.undoStack.push(state);
        
        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // Clear redo stack when new action is performed
        this.redoStack = [];
        
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.undoStack.length <= 1) return;
        
        const currentState = this.undoStack.pop();
        this.redoStack.push(currentState);
        
        const previousState = this.undoStack[this.undoStack.length - 1];
        this.restoreState(previousState);
        
        this.updateUndoRedoButtons();
        console.log('↶ Undo performed');
    }
    
    redo() {
        if (this.redoStack.length === 0) return;
        
        const state = this.redoStack.pop();
        this.undoStack.push(state);
        this.restoreState(state);
        
        this.updateUndoRedoButtons();
        console.log('↷ Redo performed');
    }
    
    restoreState(state) {
        if (state.image) {
            this.sceneManager.loadImage(state.image);
            this.currentImage = state.image;
        }
        
        if (state.scene) {
            this.sceneManager.loadSceneData(state.scene);
        }
        
        if (state.filters) {
            this.imageProcessor.applyFilters(this.currentImage, state.filters);
        }
        
        if (state.emojis) {
            this.emojiManager.loadEmojis(state.emojis);
        }
    }
    
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }
    
    updateUndoRedoButtons() {
        const undoBtns = ['undo-btn', 'mobile-undo-btn'];
        const redoBtns = ['redo-btn', 'mobile-redo-btn'];
        
        undoBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = this.undoStack.length <= 1;
            }
        });
        
        redoBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = this.redoStack.length === 0;
            }
        });
    }
    
    updatePerformanceSettings(settings) {
        this.performanceSettings = { ...this.performanceSettings, ...settings };
        
        if (this.sceneManager) {
            this.sceneManager.updatePerformanceSettings(this.performanceSettings);
        }
        
        console.log('⚡ Performance settings updated:', this.performanceSettings);
    }
    
    startPerformanceMonitoring() {
        const fpsCounter = document.getElementById('fps-counter');
        if (!fpsCounter) return;
        
        let lastTime = performance.now();
        let frameCount = 0;
        let fps = 0;
        
        const updateFPS = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                fpsCounter.textContent = `FPS: ${fps}`;
                
                frameCount = 0;
                lastTime = currentTime;
                
                // Auto-adjust performance if FPS is too low
                if (fps < 30 && this.performanceSettings.targetFPS === 60) {
                    this.updatePerformanceSettings({ targetFPS: 30 });
                }
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }
    
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainInterface = document.getElementById('main-interface');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (mainInterface) mainInterface.style.display = 'none';
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainInterface = document.getElementById('main-interface');
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (mainInterface) mainInterface.style.display = 'block';
        }, 500); // Small delay for smooth transition
    }
    
    showError(message) {
        // Simple error display - could be enhanced with a proper modal
        alert(`Error: ${message}`);
    }
    
    isMobile() {
        return window.innerWidth <= 768 || window.innerHeight <= 600;
    }
}

// Initialize app when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
    });
} else {
    app = new App();
}

// Make app globally accessible for debugging
window.app = app;
