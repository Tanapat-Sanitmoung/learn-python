/**
 * Image Processor - Handles image loading, filtering, and processing
 */

class ImageProcessor {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.originalImageData = null;
        this.processedImageData = null;
        
        this.currentFilters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0
        };
        
        // Event callbacks
        this.onImageProcessed = null;
        
        this.init();
    }
    
    init() {
        // Create an off-screen canvas for image processing
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        
        console.log('🎨 Image Processor initialized');
    }
    
    async loadImage(file) {
        try {
            console.log('📁 Processing image file:', file.name);
            
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            
            // Create image element
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Load image data
            const imageData = await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Set canvas size to image size
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    
                    // Draw image to canvas
                    this.context.clearRect(0, 0, img.width, img.height);
                    this.context.drawImage(img, 0, 0);
                    
                    // Get image data
                    const imageData = {
                        width: img.width,
                        height: img.height,
                        url: this.canvas.toDataURL('image/png'),
                        file: file,
                        originalFile: file
                    };
                    
                    resolve(imageData);
                };
                
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
                
                // Load from file
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
            
            // Store original image data
            this.originalImageData = imageData;
            this.processedImageData = { ...imageData };
            
            // Reset filters
            this.resetFilters();
            
            console.log('✅ Image processed successfully');
            return imageData;
            
        } catch (error) {
            console.error('❌ Failed to process image:', error);
            throw error;
        }
    }
    
    applyFilters(imageData, filters) {
        if (!imageData || !this.originalImageData) {
            console.warn('No image data available for filtering');
            return;
        }
        
        try {
            // Update current filters
            this.currentFilters = { ...this.currentFilters, ...filters };
            
            // Create a new image element from original data
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Set canvas size
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                // Apply CSS filters to context
                this.context.filter = this.buildFilterString();
                
                // Clear and draw image with filters
                this.context.clearRect(0, 0, img.width, img.height);
                this.context.drawImage(img, 0, 0);
                
                // Reset filter for future operations
                this.context.filter = 'none';
                
                // Create processed image data
                const processedImageData = {
                    ...this.originalImageData,
                    url: this.canvas.toDataURL('image/png'),
                    filters: { ...this.currentFilters }
                };
                
                this.processedImageData = processedImageData;
                
                // Callback
                if (this.onImageProcessed) {
                    this.onImageProcessed(processedImageData);
                }
            };
            
            // Load original image
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to apply filters:', error);
        }
    }
    
    buildFilterString() {
        const filters = [];
        
        if (this.currentFilters.brightness !== 100) {
            filters.push(`brightness(${this.currentFilters.brightness}%)`);
        }
        
        if (this.currentFilters.contrast !== 100) {
            filters.push(`contrast(${this.currentFilters.contrast}%)`);
        }
        
        if (this.currentFilters.saturation !== 100) {
            filters.push(`saturate(${this.currentFilters.saturation}%)`);
        }
        
        if (this.currentFilters.hue !== 0) {
            filters.push(`hue-rotate(${this.currentFilters.hue}deg)`);
        }
        
        if (this.currentFilters.blur > 0) {
            filters.push(`blur(${this.currentFilters.blur}px)`);
        }
        
        if (this.currentFilters.sepia > 0) {
            filters.push(`sepia(${this.currentFilters.sepia}%)`);
        }
        
        if (this.currentFilters.grayscale > 0) {
            filters.push(`grayscale(${this.currentFilters.grayscale}%)`);
        }
        
        if (this.currentFilters.invert > 0) {
            filters.push(`invert(${this.currentFilters.invert}%)`);
        }
        
        return filters.length > 0 ? filters.join(' ') : 'none';
    }
    
    setBrightness(value) {
        this.applyFilters(this.originalImageData, { brightness: value });
    }
    
    setContrast(value) {
        this.applyFilters(this.originalImageData, { contrast: value });
    }
    
    setSaturation(value) {
        this.applyFilters(this.originalImageData, { saturation: value });
    }
    
    setHue(value) {
        this.applyFilters(this.originalImageData, { hue: value });
    }
    
    setBlur(value) {
        this.applyFilters(this.originalImageData, { blur: value });
    }
    
    setSepia(value) {
        this.applyFilters(this.originalImageData, { sepia: value });
    }
    
    setGrayscale(value) {
        this.applyFilters(this.originalImageData, { grayscale: value });
    }
    
    setInvert(value) {
        this.applyFilters(this.originalImageData, { invert: value });
    }
    
    resetFilters() {
        this.currentFilters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
            sepia: 0,
            grayscale: 0,
            invert: 0
        };
        
        if (this.originalImageData) {
            this.applyFilters(this.originalImageData, this.currentFilters);
        }
    }
    
    getCurrentFilters() {
        return { ...this.currentFilters };
    }
    
    cropImage(cropData) {
        if (!this.originalImageData) {
            console.warn('No image data available for cropping');
            return;
        }
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Calculate crop dimensions
                const sourceX = cropData.x * img.width;
                const sourceY = cropData.y * img.height;
                const sourceWidth = cropData.width * img.width;
                const sourceHeight = cropData.height * img.height;
                
                // Set canvas to crop size
                this.canvas.width = sourceWidth;
                this.canvas.height = sourceHeight;
                
                // Draw cropped image
                this.context.clearRect(0, 0, sourceWidth, sourceHeight);
                this.context.drawImage(
                    img,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, sourceWidth, sourceHeight
                );
                
                // Create new image data
                const croppedImageData = {
                    width: sourceWidth,
                    height: sourceHeight,
                    url: this.canvas.toDataURL('image/png'),
                    file: this.originalImageData.file,
                    originalFile: this.originalImageData.originalFile,
                    cropped: true,
                    cropData: cropData
                };
                
                // Update original image data to cropped version
                this.originalImageData = croppedImageData;
                
                // Reapply current filters to cropped image
                this.applyFilters(croppedImageData, this.currentFilters);
                
                console.log('✂️ Image cropped successfully');
            };
            
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to crop image:', error);
        }
    }
    
    resizeImage(width, height, maintainAspectRatio = true) {
        if (!this.originalImageData) {
            console.warn('No image data available for resizing');
            return;
        }
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                let targetWidth = width;
                let targetHeight = height;
                
                if (maintainAspectRatio) {
                    const aspectRatio = img.width / img.height;
                    
                    if (width / height > aspectRatio) {
                        targetWidth = height * aspectRatio;
                    } else {
                        targetHeight = width / aspectRatio;
                    }
                }
                
                // Set canvas to target size
                this.canvas.width = targetWidth;
                this.canvas.height = targetHeight;
                
                // Draw resized image
                this.context.clearRect(0, 0, targetWidth, targetHeight);
                this.context.drawImage(img, 0, 0, targetWidth, targetHeight);
                
                // Create new image data
                const resizedImageData = {
                    width: targetWidth,
                    height: targetHeight,
                    url: this.canvas.toDataURL('image/png'),
                    file: this.originalImageData.file,
                    originalFile: this.originalImageData.originalFile,
                    resized: true,
                    originalSize: { width: img.width, height: img.height }
                };
                
                // Update original image data
                this.originalImageData = resizedImageData;
                
                // Reapply current filters
                this.applyFilters(resizedImageData, this.currentFilters);
                
                console.log('📏 Image resized successfully');
            };
            
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to resize image:', error);
        }
    }
    
    flipImage(direction) {
        if (!this.originalImageData) {
            console.warn('No image data available for flipping');
            return;
        }
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                this.context.clearRect(0, 0, img.width, img.height);
                
                // Apply transformation
                this.context.save();
                
                if (direction === 'horizontal') {
                    this.context.scale(-1, 1);
                    this.context.drawImage(img, -img.width, 0);
                } else if (direction === 'vertical') {
                    this.context.scale(1, -1);
                    this.context.drawImage(img, 0, -img.height);
                }
                
                this.context.restore();
                
                // Create new image data
                const flippedImageData = {
                    ...this.originalImageData,
                    url: this.canvas.toDataURL('image/png'),
                    flipped: direction
                };
                
                this.originalImageData = flippedImageData;
                this.applyFilters(flippedImageData, this.currentFilters);
                
                console.log(`🔄 Image flipped ${direction}ly`);
            };
            
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to flip image:', error);
        }
    }
    
    rotateImage(degrees) {
        if (!this.originalImageData) {
            console.warn('No image data available for rotating');
            return;
        }
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const radians = degrees * Math.PI / 180;
                
                // Calculate new canvas size
                const sin = Math.abs(Math.sin(radians));
                const cos = Math.abs(Math.cos(radians));
                const newWidth = img.width * cos + img.height * sin;
                const newHeight = img.width * sin + img.height * cos;
                
                this.canvas.width = newWidth;
                this.canvas.height = newHeight;
                
                this.context.clearRect(0, 0, newWidth, newHeight);
                
                // Apply rotation
                this.context.save();
                this.context.translate(newWidth / 2, newHeight / 2);
                this.context.rotate(radians);
                this.context.drawImage(img, -img.width / 2, -img.height / 2);
                this.context.restore();
                
                // Create new image data
                const rotatedImageData = {
                    ...this.originalImageData,
                    width: newWidth,
                    height: newHeight,
                    url: this.canvas.toDataURL('image/png'),
                    rotated: degrees
                };
                
                this.originalImageData = rotatedImageData;
                this.applyFilters(rotatedImageData, this.currentFilters);
                
                console.log(`↻ Image rotated ${degrees} degrees`);
            };
            
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to rotate image:', error);
        }
    }
    
    addNoise(intensity = 0.1) {
        if (!this.originalImageData) return;
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                this.context.clearRect(0, 0, img.width, img.height);
                this.context.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = this.context.getImageData(0, 0, img.width, img.height);
                const data = imageData.data;
                
                // Add noise
                for (let i = 0; i < data.length; i += 4) {
                    const noise = (Math.random() - 0.5) * intensity * 255;
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
                    // Alpha channel (i + 3) remains unchanged
                }
                
                // Put modified image data back
                this.context.putImageData(imageData, 0, 0);
                
                const noisyImageData = {
                    ...this.originalImageData,
                    url: this.canvas.toDataURL('image/png'),
                    noise: intensity
                };
                
                this.originalImageData = noisyImageData;
                this.applyFilters(noisyImageData, this.currentFilters);
                
                console.log('🔊 Noise added to image');
            };
            
            img.src = this.originalImageData.url;
            
        } catch (error) {
            console.error('❌ Failed to add noise:', error);
        }
    }
    
    getImageInfo() {
        if (!this.originalImageData) return null;
        
        return {
            width: this.originalImageData.width,
            height: this.originalImageData.height,
            aspectRatio: this.originalImageData.width / this.originalImageData.height,
            fileSize: this.originalImageData.file ? this.originalImageData.file.size : null,
            fileName: this.originalImageData.file ? this.originalImageData.file.name : null,
            fileType: this.originalImageData.file ? this.originalImageData.file.type : null,
            filters: this.currentFilters
        };
    }
    
    exportImage(format = 'png', quality = 1.0) {
        if (!this.processedImageData) {
            console.warn('No processed image data available for export');
            return null;
        }
        
        try {
            let mimeType = 'image/png';
            
            if (format.toLowerCase() === 'jpg' || format.toLowerCase() === 'jpeg') {
                mimeType = 'image/jpeg';
            } else if (format.toLowerCase() === 'webp') {
                mimeType = 'image/webp';
            }
            
            return this.canvas.toDataURL(mimeType, quality);
            
        } catch (error) {
            console.error('❌ Failed to export image:', error);
            return null;
        }
    }
    
    dispose() {
        this.canvas = null;
        this.context = null;
        this.originalImageData = null;
        this.processedImageData = null;
        
        console.log('🧹 Image Processor disposed');
    }
}
