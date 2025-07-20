/**
 * Project Manager - Handles saving and loading project files
 */

class ProjectManager {
    constructor() {
        this.currentProject = null;
        this.projectHistory = [];
        this.maxHistorySize = 10;
        
        // Event callbacks
        this.onProjectLoaded = null;
        this.onProjectSaved = null;
        this.onProjectCreated = null;
    }
    
    createProject(data) {
        try {
            const project = {
                id: Date.now() + Math.random(),
                name: data.name || `Project ${new Date().toISOString().split('T')[0]}`,
                version: data.version || '1.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                
                // Core data
                image: data.image ? {
                    width: data.image.width,
                    height: data.image.height,
                    url: data.image.url,
                    fileName: data.image.file ? data.image.file.name : null,
                    fileType: data.image.file ? data.image.file.type : null,
                    fileSize: data.image.file ? data.image.file.size : null,
                    originalData: data.image
                } : null,
                
                scene: data.scene || null,
                filters: data.filters || {},
                emojis: data.emojis || [],
                
                // Metadata
                metadata: {
                    editCount: 0,
                    totalEditTime: 0,
                    lastEditedElement: null,
                    tags: data.tags || [],
                    notes: data.notes || ''
                }
            };
            
            this.currentProject = project;
            
            // Add to history
            this.addToHistory(project);
            
            // Callback
            if (this.onProjectCreated) {
                this.onProjectCreated(project);
            }
            
            console.log('📝 Project created:', project.name);
            return project;
            
        } catch (error) {
            console.error('❌ Failed to create project:', error);
            throw error;
        }
    }
    
    saveProject(projectData) {
        try {
            if (!this.currentProject) {
                throw new Error('No active project to save');
            }
            
            // Update current project
            this.currentProject.modified = new Date().toISOString();
            this.currentProject.metadata.editCount++;
            
            if (projectData) {
                // Update project data
                if (projectData.image) {
                    this.currentProject.image = {
                        ...this.currentProject.image,
                        ...projectData.image
                    };
                }
                
                if (projectData.scene) {
                    this.currentProject.scene = projectData.scene;
                }
                
                if (projectData.filters) {
                    this.currentProject.filters = projectData.filters;
                }
                
                if (projectData.emojis) {
                    this.currentProject.emojis = projectData.emojis;
                }
                
                if (projectData.metadata) {
                    this.currentProject.metadata = {
                        ...this.currentProject.metadata,
                        ...projectData.metadata
                    };
                }
            }
            
            // Create save data
            const saveData = this.createSaveData(this.currentProject);
            
            // Callback
            if (this.onProjectSaved) {
                this.onProjectSaved(this.currentProject, saveData);
            }
            
            console.log('💾 Project saved:', this.currentProject.name);
            return saveData;
            
        } catch (error) {
            console.error('❌ Failed to save project:', error);
            throw error;
        }
    }
    
    createSaveData(project) {
        // Create a clean save data object without circular references
        const saveData = {
            projectInfo: {
                id: project.id,
                name: project.name,
                version: project.version,
                created: project.created,
                modified: project.modified
            },
            
            image: project.image ? {
                width: project.image.width,
                height: project.image.height,
                url: project.image.url,
                fileName: project.image.fileName,
                fileType: project.image.fileType,
                fileSize: project.image.fileSize
            } : null,
            
            scene: project.scene ? {
                camera: project.scene.camera,
                controls: project.scene.controls,
                lighting: project.scene.lighting,
                settings: project.scene.settings
            } : null,
            
            filters: { ...project.filters },
            
            emojis: project.emojis.map(emoji => ({
                id: emoji.id,
                emoji: emoji.emoji,
                position: emoji.position ? {
                    x: emoji.position.x,
                    y: emoji.position.y,
                    z: emoji.position.z
                } : null,
                rotation: emoji.rotation ? {
                    x: emoji.rotation.x,
                    y: emoji.rotation.y,
                    z: emoji.rotation.z
                } : null,
                size: emoji.size,
                timestamp: emoji.timestamp
            })),
            
            metadata: {
                ...project.metadata,
                exportedAt: new Date().toISOString(),
                appVersion: '1.0'
            }
        };
        
        return saveData;
    }
    
    async loadProject(projectData) {
        try {
            console.log('📂 Loading project...');
            
            // Validate project data
            this.validateProjectData(projectData);
            
            // Create project object
            const project = {
                id: projectData.projectInfo ? projectData.projectInfo.id : Date.now(),
                name: projectData.projectInfo ? projectData.projectInfo.name : 'Imported Project',
                version: projectData.projectInfo ? projectData.projectInfo.version : '1.0',
                created: projectData.projectInfo ? projectData.projectInfo.created : new Date().toISOString(),
                modified: new Date().toISOString(),
                
                image: projectData.image,
                scene: projectData.scene,
                filters: projectData.filters || {},
                emojis: projectData.emojis || [],
                metadata: projectData.metadata || {}
            };
            
            // Convert emoji data back to Three.js objects
            if (project.emojis.length > 0) {
                project.emojis = project.emojis.map(emoji => ({
                    ...emoji,
                    position: emoji.position ? new THREE.Vector3(
                        emoji.position.x,
                        emoji.position.y,
                        emoji.position.z
                    ) : new THREE.Vector3(0, 0, 0),
                    rotation: emoji.rotation ? new THREE.Euler(
                        emoji.rotation.x,
                        emoji.rotation.y,
                        emoji.rotation.z
                    ) : new THREE.Euler(0, 0, 0)
                }));
            }
            
            this.currentProject = project;
            
            // Add to history
            this.addToHistory(project);
            
            // Callback
            if (this.onProjectLoaded) {
                this.onProjectLoaded(project);
            }
            
            console.log('✅ Project loaded successfully:', project.name);
            return project;
            
        } catch (error) {
            console.error('❌ Failed to load project:', error);
            throw error;
        }
    }
    
    validateProjectData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid project data: must be an object');
        }
        
        // Check for required fields
        if (!data.image && !data.emojis && !data.filters) {
            throw new Error('Invalid project data: no content found');
        }
        
        // Validate version compatibility
        if (data.metadata && data.metadata.appVersion) {
            const projectVersion = parseFloat(data.metadata.appVersion);
            const currentVersion = 1.0;
            
            if (projectVersion > currentVersion) {
                console.warn('Project was created with a newer version of the app. Some features may not work correctly.');
            }
        }
        
        // Validate image data
        if (data.image) {
            if (!data.image.width || !data.image.height || !data.image.url) {
                throw new Error('Invalid project data: image data is incomplete');
            }
        }
        
        // Validate emoji data
        if (data.emojis && Array.isArray(data.emojis)) {
            data.emojis.forEach((emoji, index) => {
                if (!emoji.emoji || !emoji.id) {
                    throw new Error(`Invalid project data: emoji at index ${index} is incomplete`);
                }
            });
        }
        
        console.log('✅ Project data validation passed');
    }
    
    addToHistory(project) {
        // Add project to history
        const historyEntry = {
            id: project.id,
            name: project.name,
            modified: project.modified,
            thumbnail: null // Could be generated from the scene
        };
        
        // Remove existing entry with same ID
        this.projectHistory = this.projectHistory.filter(entry => entry.id !== project.id);
        
        // Add to beginning
        this.projectHistory.unshift(historyEntry);
        
        // Limit history size
        if (this.projectHistory.length > this.maxHistorySize) {
            this.projectHistory = this.projectHistory.slice(0, this.maxHistorySize);
        }
        
        // Save to localStorage
        this.saveHistoryToStorage();
    }
    
    getProjectHistory() {
        return [...this.projectHistory];
    }
    
    removeFromHistory(projectId) {
        this.projectHistory = this.projectHistory.filter(entry => entry.id !== projectId);
        this.saveHistoryToStorage();
    }
    
    clearHistory() {
        this.projectHistory = [];
        this.saveHistoryToStorage();
    }
    
    saveHistoryToStorage() {
        try {
            localStorage.setItem('imageEditor_projectHistory', JSON.stringify(this.projectHistory));
        } catch (error) {
            console.warn('Failed to save project history to localStorage:', error);
        }
    }
    
    loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('imageEditor_projectHistory');
            if (stored) {
                this.projectHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load project history from localStorage:', error);
            this.projectHistory = [];
        }
    }
    
    exportProject(format = 'json') {
        if (!this.currentProject) {
            throw new Error('No active project to export');
        }
        
        try {
            const saveData = this.createSaveData(this.currentProject);
            
            if (format === 'json') {
                return JSON.stringify(saveData, null, 2);
            } else {
                throw new Error(`Unsupported export format: ${format}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to export project:', error);
            throw error;
        }
    }
    
    importProject(data, format = 'json') {
        try {
            let projectData;
            
            if (format === 'json') {
                projectData = typeof data === 'string' ? JSON.parse(data) : data;
            } else {
                throw new Error(`Unsupported import format: ${format}`);
            }
            
            return this.loadProject(projectData);
            
        } catch (error) {
            console.error('❌ Failed to import project:', error);
            throw error;
        }
    }
    
    duplicateProject(projectId = null) {
        try {
            const sourceProject = projectId ? 
                this.projectHistory.find(p => p.id === projectId) : 
                this.currentProject;
                
            if (!sourceProject) {
                throw new Error('No project to duplicate');
            }
            
            // Create save data from source project
            const saveData = this.createSaveData(sourceProject);
            
            // Modify for duplication
            saveData.projectInfo.id = Date.now() + Math.random();
            saveData.projectInfo.name += ' (Copy)';
            saveData.projectInfo.created = new Date().toISOString();
            saveData.projectInfo.modified = new Date().toISOString();
            
            // Load as new project
            return this.loadProject(saveData);
            
        } catch (error) {
            console.error('❌ Failed to duplicate project:', error);
            throw error;
        }
    }
    
    getProjectInfo() {
        if (!this.currentProject) {
            return null;
        }
        
        return {
            id: this.currentProject.id,
            name: this.currentProject.name,
            version: this.currentProject.version,
            created: this.currentProject.created,
            modified: this.currentProject.modified,
            hasImage: !!this.currentProject.image,
            emojiCount: this.currentProject.emojis.length,
            hasFilters: Object.keys(this.currentProject.filters).length > 0,
            metadata: this.currentProject.metadata
        };
    }
    
    updateProjectMetadata(metadata) {
        if (!this.currentProject) {
            throw new Error('No active project');
        }
        
        this.currentProject.metadata = {
            ...this.currentProject.metadata,
            ...metadata
        };
        
        this.currentProject.modified = new Date().toISOString();
        
        console.log('📝 Project metadata updated');
    }
    
    renameProject(newName) {
        if (!this.currentProject) {
            throw new Error('No active project');
        }
        
        const oldName = this.currentProject.name;
        this.currentProject.name = newName;
        this.currentProject.modified = new Date().toISOString();
        
        // Update history
        const historyEntry = this.projectHistory.find(entry => entry.id === this.currentProject.id);
        if (historyEntry) {
            historyEntry.name = newName;
            this.saveHistoryToStorage();
        }
        
        console.log(`📝 Project renamed from "${oldName}" to "${newName}"`);
    }
    
    closeProject() {
        if (this.currentProject) {
            console.log('📁 Closing project:', this.currentProject.name);
            this.currentProject = null;
        }
    }
    
    hasUnsavedChanges() {
        // This would need to be implemented based on tracking changes
        // For now, return false
        return false;
    }
    
    generateThumbnail(canvas) {
        try {
            // Create a smaller thumbnail from the canvas
            const thumbnailCanvas = document.createElement('canvas');
            const ctx = thumbnailCanvas.getContext('2d');
            
            const thumbnailSize = 200;
            thumbnailCanvas.width = thumbnailSize;
            thumbnailCanvas.height = thumbnailSize;
            
            // Draw scaled canvas
            ctx.drawImage(canvas, 0, 0, thumbnailSize, thumbnailSize);
            
            return thumbnailCanvas.toDataURL('image/jpeg', 0.7);
            
        } catch (error) {
            console.error('❌ Failed to generate thumbnail:', error);
            return null;
        }
    }
    
    init() {
        // Load project history from storage
        this.loadHistoryFromStorage();
        
        console.log('📁 Project Manager initialized');
        console.log(`📚 Loaded ${this.projectHistory.length} projects from history`);
    }
    
    dispose() {
        this.currentProject = null;
        this.projectHistory = [];
        
        console.log('🧹 Project Manager disposed');
    }
}
