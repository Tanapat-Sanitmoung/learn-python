/**
 * Scene Manager - Handles Three.js 3D scene, camera, lighting, and rendering
 */

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        this.imagePlane = null;
        this.imageTexture = null;
        this.originalImageData = null;
        
        this.ambientLight = null;
        this.directionalLight = null;
        this.lightingEnabled = true;
        this.rotation3DEnabled = true;
        
        this.emojis = [];
        this.cropOverlay = null;
        
        this.canvas = null;
        this.overlayCanvas = null;
        this.overlayContext = null;
        
        this.performanceSettings = {
            targetFPS: 60,
            qualityMode: 'balanced'
        };
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Event callbacks
        this.onImageLoaded = null;
        this.onEmojiSelected = null;
        this.onCropAreaSelected = null;
    }
    
    async init() {
        try {
            console.log('🎬 Initializing Scene Manager...');
            
            // Get canvas elements
            this.canvas = document.getElementById('three-canvas');
            this.overlayCanvas = document.getElementById('2d-overlay');
            this.overlayContext = this.overlayCanvas.getContext('2d');
            
            if (!this.canvas) {
                throw new Error('Three.js canvas not found');
            }
            
            // Initialize Three.js components
            this.initScene();
            this.initCamera();
            this.initRenderer();
            this.initLighting();
            this.initControls();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start render loop
            this.startRenderLoop();
            
            // Handle initial resize
            this.onWindowResize();
            
            console.log('✅ Scene Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Scene Manager:', error);
            throw error;
        }
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);
        
        // Add fog for depth perception
        this.scene.fog = new THREE.Fog(0x222222, 10, 50);
    }
    
    initCamera() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
    }
    
    initLighting() {
        // Ambient light for overall illumination
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // Directional light for shadows and depth
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(5, 5, 5);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 1024;
        this.directionalLight.shadow.mapSize.height = 1024;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 50;
        this.scene.add(this.directionalLight);
        
        // Point light for accent lighting
        const pointLight = new THREE.PointLight(0x4080ff, 0.3, 20);
        pointLight.position.set(-5, 0, 5);
        this.scene.add(pointLight);
    }
    
    initControls() {
        // We'll implement custom controls instead of OrbitControls
        // to have better mobile support and custom behavior
        this.controls = {
            enabled: true,
            autoRotate: false,
            autoRotateSpeed: 1.0,
            enableZoom: true,
            enableRotate: true,
            enablePan: false,
            minDistance: 3,
            maxDistance: 20,
            
            // Current state
            spherical: new THREE.Spherical(10, Math.PI / 2, 0),
            target: new THREE.Vector3(0, 0, 0),
            
            // Internal state
            isPointerDown: false,
            pointerDownPosition: new THREE.Vector2(),
            sphericalDelta: new THREE.Spherical(),
            scale: 1
        };
        
        this.updateCameraFromControls();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Click events for emoji placement
        this.canvas.addEventListener('click', this.onClick.bind(this));
        
        // Context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    onPointerDown(event) {
        if (!this.rotation3DEnabled) return;
        
        this.controls.isPointerDown = true;
        this.controls.pointerDownPosition.set(event.clientX, event.clientY);
        this.canvas.style.cursor = 'grabbing';
    }
    
    onPointerMove(event) {
        if (!this.controls.isPointerDown || !this.rotation3DEnabled) return;
        
        const deltaX = event.clientX - this.controls.pointerDownPosition.x;
        const deltaY = event.clientY - this.controls.pointerDownPosition.y;
        
        this.rotateCamera(deltaX * 0.01, deltaY * 0.01);
        
        this.controls.pointerDownPosition.set(event.clientX, event.clientY);
    }
    
    onPointerUp(event) {
        this.controls.isPointerDown = false;
        this.canvas.style.cursor = 'grab';
    }
    
    onWheel(event) {
        event.preventDefault();
        
        if (!this.controls.enableZoom) return;
        
        const delta = event.deltaY * 0.001;
        this.zoomCamera(delta);
    }
    
    onTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length === 1) {
            this.controls.isPointerDown = true;
            this.controls.pointerDownPosition.set(
                event.touches[0].clientX,
                event.touches[0].clientY
            );
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 1 && this.controls.isPointerDown) {
            const deltaX = event.touches[0].clientX - this.controls.pointerDownPosition.x;
            const deltaY = event.touches[0].clientY - this.controls.pointerDownPosition.y;
            
            this.rotateCamera(deltaX * 0.01, deltaY * 0.01);
            
            this.controls.pointerDownPosition.set(
                event.touches[0].clientX,
                event.touches[0].clientY
            );
        }
    }
    
    onTouchEnd(event) {
        this.controls.isPointerDown = false;
    }
    
    onClick(event) {
        // Handle emoji placement or object selection
        this.updateMousePosition(event);
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const intersect = intersects[0];
            
            // Check if clicked on an emoji
            const emojiObject = this.findEmojiObject(intersect.object);
            if (emojiObject && this.onEmojiSelected) {
                this.onEmojiSelected(emojiObject);
                return;
            }
            
            // Check if in emoji placement mode
            if (window.app && window.app.emojiManager && window.app.emojiManager.isPlacementMode) {
                const position = intersect.point;
                window.app.emojiManager.placeEmojiAt(position);
            }
        }
    }
    
    updateMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    rotateCamera(deltaX, deltaY) {
        if (!this.rotation3DEnabled) return;
        
        this.controls.sphericalDelta.theta -= deltaX;
        this.controls.sphericalDelta.phi -= deltaY;
        
        this.updateCameraFromControls();
    }
    
    zoomCamera(delta) {
        this.controls.scale *= (1 + delta);
        this.controls.scale = Math.max(
            this.controls.minDistance / this.controls.spherical.radius,
            Math.min(
                this.controls.maxDistance / this.controls.spherical.radius,
                this.controls.scale
            )
        );
        
        this.updateCameraFromControls();
    }
    
    updateCameraFromControls() {
        // Apply deltas
        this.controls.spherical.theta += this.controls.sphericalDelta.theta;
        this.controls.spherical.phi += this.controls.sphericalDelta.phi;
        this.controls.spherical.radius *= this.controls.scale;
        
        // Clamp phi to prevent flipping
        this.controls.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.controls.spherical.phi));
        
        // Clamp radius
        this.controls.spherical.radius = Math.max(
            this.controls.minDistance,
            Math.min(this.controls.maxDistance, this.controls.spherical.radius)
        );
        
        // Convert spherical to cartesian
        const position = new THREE.Vector3();
        position.setFromSpherical(this.controls.spherical);
        position.add(this.controls.target);
        
        this.camera.position.copy(position);
        this.camera.lookAt(this.controls.target);
        
        // Reset deltas and scale
        this.controls.sphericalDelta.set(0, 0, 0);
        this.controls.scale = 1;
    }
    
    async loadImage(imageData) {
        try {
            console.log('🖼️ Loading image into 3D scene...');
            
            // Store original image data
            this.originalImageData = imageData;
            
            // Remove existing image plane
            if (this.imagePlane) {
                this.scene.remove(this.imagePlane);
                this.imagePlane = null;
            }
            
            // Dispose of existing texture
            if (this.imageTexture) {
                this.imageTexture.dispose();
            }
            
            // Create texture from image
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageData.url || imageData.src;
            });
            
            this.imageTexture = new THREE.Texture(img);
            this.imageTexture.needsUpdate = true;
            this.imageTexture.encoding = THREE.sRGBEncoding;
            this.imageTexture.flipY = true;
            
            // Calculate plane dimensions maintaining aspect ratio
            const aspect = img.width / img.height;
            const maxSize = 8;
            let planeWidth, planeHeight;
            
            if (aspect > 1) {
                planeWidth = maxSize;
                planeHeight = maxSize / aspect;
            } else {
                planeWidth = maxSize * aspect;
                planeHeight = maxSize;
            }
            
            // Create plane geometry and material
            const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
            const material = new THREE.MeshLambertMaterial({
                map: this.imageTexture,
                transparent: true,
                side: THREE.DoubleSide
            });
            
            this.imagePlane = new THREE.Mesh(geometry, material);
            this.imagePlane.receiveShadow = true;
            this.imagePlane.userData = { type: 'image', imageData };
            
            this.scene.add(this.imagePlane);
            
            // Reset camera position for new image
            this.resetCameraPosition();
            
            // Callback
            if (this.onImageLoaded) {
                this.onImageLoaded(imageData);
            }
            
            console.log('✅ Image loaded into 3D scene');
            
        } catch (error) {
            console.error('❌ Failed to load image into scene:', error);
            throw error;
        }
    }
    
    updateTexture(processedImageData) {
        if (!this.imagePlane || !processedImageData) return;
        
        // Update the texture with processed image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (this.imageTexture) {
                this.imageTexture.dispose();
            }
            
            this.imageTexture = new THREE.Texture(img);
            this.imageTexture.needsUpdate = true;
            this.imageTexture.encoding = THREE.sRGBEncoding;
            this.imageTexture.flipY = true;
            
            this.imagePlane.material.map = this.imageTexture;
            this.imagePlane.material.needsUpdate = true;
        };
        img.src = processedImageData.url || processedImageData.src;
    }
    
    addEmoji(emojiData) {
        try {
            // Create emoji as a plane with text texture
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            const size = 512;
            canvas.width = size;
            canvas.height = size;
            
            // Clear canvas
            context.clearRect(0, 0, size, size);
            
            // Draw emoji
            context.font = `${size * 0.8}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(emojiData.emoji, size / 2, size / 2);
            
            // Create texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            
            // Create material
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.DoubleSide
            });
            
            // Create geometry
            const geometry = new THREE.PlaneGeometry(
                emojiData.size || 1,
                emojiData.size || 1
            );
            
            // Create mesh
            const emojiMesh = new THREE.Mesh(geometry, material);
            emojiMesh.position.copy(emojiData.position || new THREE.Vector3(0, 0, 0.1));
            emojiMesh.rotation.copy(emojiData.rotation || new THREE.Euler(0, 0, 0));
            emojiMesh.userData = {
                type: 'emoji',
                emojiData: emojiData,
                id: emojiData.id || Date.now()
            };
            
            this.scene.add(emojiMesh);
            this.emojis.push(emojiMesh);
            
            console.log('😀 Emoji added to scene:', emojiData.emoji);
            
        } catch (error) {
            console.error('❌ Failed to add emoji to scene:', error);
        }
    }
    
    removeEmoji(emojiId) {
        const index = this.emojis.findIndex(emoji => emoji.userData.id === emojiId);
        if (index !== -1) {
            const emoji = this.emojis[index];
            this.scene.remove(emoji);
            emoji.geometry.dispose();
            emoji.material.dispose();
            emoji.material.map.dispose();
            this.emojis.splice(index, 1);
            
            console.log('🗑️ Emoji removed from scene');
        }
    }
    
    findEmojiObject(object) {
        let current = object;
        while (current) {
            if (current.userData && current.userData.type === 'emoji') {
                return current;
            }
            current = current.parent;
        }
        return null;
    }
    
    resetCameraPosition() {
        this.controls.spherical.set(10, Math.PI / 2, 0);
        this.controls.target.set(0, 0, 0);
        this.updateCameraFromControls();
    }
    
    enableLighting(enabled) {
        this.lightingEnabled = enabled;
        this.ambientLight.visible = enabled;
        this.directionalLight.visible = enabled;
        
        // Update materials
        if (this.imagePlane) {
            if (enabled) {
                this.imagePlane.material = new THREE.MeshLambertMaterial({
                    map: this.imageTexture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
            } else {
                this.imagePlane.material = new THREE.MeshBasicMaterial({
                    map: this.imageTexture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
            }
        }
    }
    
    enable3DRotation(enabled) {
        this.rotation3DEnabled = enabled;
        this.controls.enableRotate = enabled;
        
        if (!enabled) {
            // Reset to front view
            this.resetCameraPosition();
        }
        
        this.canvas.style.cursor = enabled ? 'grab' : 'default';
    }
    
    updatePerformanceSettings(settings) {
        this.performanceSettings = { ...this.performanceSettings, ...settings };
        
        // Adjust renderer settings based on performance mode
        if (settings.qualityMode === 'performance') {
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = false;
        } else if (settings.qualityMode === 'quality') {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
        } else { // balanced
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            this.renderer.shadowMap.enabled = this.lightingEnabled;
        }
    }
    
    getSceneData() {
        const data = {
            camera: {
                position: this.camera.position.toArray(),
                rotation: this.camera.rotation.toArray(),
                fov: this.camera.fov
            },
            controls: {
                spherical: {
                    radius: this.controls.spherical.radius,
                    phi: this.controls.spherical.phi,
                    theta: this.controls.spherical.theta
                },
                target: this.controls.target.toArray()
            },
            lighting: {
                enabled: this.lightingEnabled,
                ambientIntensity: this.ambientLight.intensity,
                directionalIntensity: this.directionalLight.intensity
            },
            settings: {
                rotation3DEnabled: this.rotation3DEnabled
            }
        };
        
        return data;
    }
    
    loadSceneData(data) {
        if (data.camera) {
            this.camera.position.fromArray(data.camera.position);
            this.camera.rotation.fromArray(data.camera.rotation);
            this.camera.fov = data.camera.fov;
        }
        
        if (data.controls) {
            this.controls.spherical.set(
                data.controls.spherical.radius,
                data.controls.spherical.phi,
                data.controls.spherical.theta
            );
            this.controls.target.fromArray(data.controls.target);
            this.updateCameraFromControls();
        }
        
        if (data.lighting) {
            this.enableLighting(data.lighting.enabled);
            this.ambientLight.intensity = data.lighting.ambientIntensity;
            this.directionalLight.intensity = data.lighting.directionalIntensity;
        }
        
        if (data.settings) {
            this.enable3DRotation(data.settings.rotation3DEnabled);
        }
    }
    
    renderToCanvas() {
        // Render the scene to a canvas for saving
        const originalSize = this.renderer.getSize(new THREE.Vector2());
        const targetWidth = 1920;
        const targetHeight = 1080;
        
        // Set render size
        this.renderer.setSize(targetWidth, targetHeight);
        this.camera.aspect = targetWidth / targetHeight;
        this.camera.updateProjectionMatrix();
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Get canvas data
        const canvas = this.renderer.domElement;
        
        // Restore original size
        this.renderer.setSize(originalSize.x, originalSize.y);
        this.camera.aspect = originalSize.x / originalSize.y;
        this.camera.updateProjectionMatrix();
        
        return canvas;
    }
    
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
        
        // Update overlay canvas
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
    }
    
    startRenderLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            // Auto-rotation if enabled
            if (this.controls.autoRotate && this.rotation3DEnabled) {
                this.controls.spherical.theta += this.controls.autoRotateSpeed * 0.01;
                this.updateCameraFromControls();
            }
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            // Update overlay canvas (for crop overlay, etc.)
            this.updateOverlay();
        };
        
        animate();
    }
    
    updateOverlay() {
        if (!this.overlayContext) return;
        
        // Clear overlay
        this.overlayContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Draw crop overlay if active
        if (this.cropOverlay && this.cropOverlay.visible) {
            this.drawCropOverlay();
        }
    }
    
    drawCropOverlay() {
        // This will be implemented when crop functionality is added
        // For now, just a placeholder
    }
    
    dispose() {
        // Clean up resources
        if (this.imageTexture) {
            this.imageTexture.dispose();
        }
        
        this.emojis.forEach(emoji => {
            emoji.geometry.dispose();
            emoji.material.dispose();
            if (emoji.material.map) {
                emoji.material.map.dispose();
            }
        });
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('🧹 Scene Manager disposed');
    }
}
