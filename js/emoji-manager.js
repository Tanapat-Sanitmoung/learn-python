/**
 * Emoji Manager - Handles emoji selection, placement, and management
 */

class EmojiManager {
    constructor() {
        this.emojis = [];
        this.selectedEmoji = null;
        this.isPlacementMode = false;
        this.emojiCategories = null;
        this.currentCategory = 'smileys';
        
        // UI elements
        this.emojiPanel = null;
        this.emojiGrid = null;
        this.emojiSearch = null;
        this.categoryButtons = null;
        
        // Event callbacks
        this.onEmojiAdded = null;
        this.onEmojiSelected = null;
        this.onEmojiRemoved = null;
    }
    
    async init() {
        try {
            console.log('😀 Initializing Emoji Manager...');
            
            // Get UI elements
            this.emojiPanel = document.getElementById('emoji-panel');
            this.emojiGrid = document.getElementById('emoji-grid');
            this.emojiSearch = document.getElementById('emoji-search');
            this.categoryButtons = document.querySelectorAll('.emoji-category');
            
            // Load emoji data
            await this.loadEmojiCategories();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize with default category
            this.showCategory(this.currentCategory);
            
            console.log('✅ Emoji Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Emoji Manager:', error);
            throw error;
        }
    }
    
    async loadEmojiCategories() {
        // Emoji database - in a real app, this could be loaded from an external file
        this.emojiCategories = {
            smileys: [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
                '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
                '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
                '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
            ],
            gestures: [
                '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
                '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
                '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
                '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂',
                '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'
            ],
            objects: [
                '📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿',
                '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
                '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏰', '⏲️',
                '⏱️', '⏰', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯',
                '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️'
            ],
            symbols: [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
                '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
                '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
                '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳',
                '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️'
            ]
        };
    }
    
    setupEventListeners() {
        // Panel toggle buttons
        const emojiBtns = ['emoji-btn', 'mobile-emoji-btn'];
        emojiBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => this.toggleEmojiPanel());
            }
        });
        
        // Close panel button
        const closeBtn = document.getElementById('close-emoji-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideEmojiPanel());
        }
        
        // Category buttons
        this.categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.showCategory(category);
            });
        });
        
        // Search functionality
        if (this.emojiSearch) {
            this.emojiSearch.addEventListener('input', (e) => {
                this.searchEmojis(e.target.value);
            });
        }
        
        // Click outside to close panel
        document.addEventListener('click', (e) => {
            if (this.emojiPanel && !this.emojiPanel.contains(e.target) && 
                !e.target.closest('[id$="emoji-btn"]')) {
                this.hideEmojiPanel();
            }
        });
        
        // Escape key to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEmojiPanel();
                this.exitPlacementMode();
            }
        });
    }
    
    toggleEmojiPanel() {
        if (this.emojiPanel.classList.contains('hidden')) {
            this.showEmojiPanel();
        } else {
            this.hideEmojiPanel();
        }
    }
    
    showEmojiPanel() {
        this.emojiPanel.classList.remove('hidden');
        
        // Focus search input
        if (this.emojiSearch) {
            setTimeout(() => this.emojiSearch.focus(), 100);
        }
        
        console.log('😀 Emoji panel opened');
    }
    
    hideEmojiPanel() {
        this.emojiPanel.classList.add('hidden');
        this.exitPlacementMode();
        
        console.log('😀 Emoji panel closed');
    }
    
    showCategory(category) {
        if (!this.emojiCategories[category]) {
            console.warn(`Unknown emoji category: ${category}`);
            return;
        }
        
        this.currentCategory = category;
        
        // Update active category button
        this.categoryButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        // Clear search
        if (this.emojiSearch) {
            this.emojiSearch.value = '';
        }
        
        // Render emojis
        this.renderEmojis(this.emojiCategories[category]);
        
        console.log(`😀 Showing emoji category: ${category}`);
    }
    
    searchEmojis(query) {
        if (!query.trim()) {
            this.showCategory(this.currentCategory);
            return;
        }
        
        const allEmojis = Object.values(this.emojiCategories).flat();
        const searchResults = allEmojis.filter(emoji => {
            // Simple search - could be enhanced with emoji names/keywords
            return this.getEmojiName(emoji).toLowerCase().includes(query.toLowerCase());
        });
        
        this.renderEmojis(searchResults);
        
        console.log(`🔍 Search results for "${query}": ${searchResults.length} emojis`);
    }
    
    renderEmojis(emojiList) {
        if (!this.emojiGrid) return;
        
        this.emojiGrid.innerHTML = '';
        
        emojiList.forEach(emoji => {
            const emojiButton = document.createElement('button');
            emojiButton.className = 'emoji-item';
            emojiButton.textContent = emoji;
            emojiButton.title = this.getEmojiName(emoji);
            
            emojiButton.addEventListener('click', () => {
                this.selectEmoji(emoji);
            });
            
            this.emojiGrid.appendChild(emojiButton);
        });
    }
    
    selectEmoji(emoji) {
        this.selectedEmoji = emoji;
        this.enterPlacementMode();
        this.hideEmojiPanel();
        
        console.log(`😀 Selected emoji: ${emoji}`);
    }
    
    enterPlacementMode() {
        this.isPlacementMode = true;
        
        // Change cursor to indicate placement mode
        const canvas = document.getElementById('three-canvas');
        if (canvas) {
            canvas.style.cursor = 'crosshair';
        }
        
        // Show instruction
        this.showPlacementInstruction();
        
        console.log('✨ Entered emoji placement mode');
    }
    
    exitPlacementMode() {
        this.isPlacementMode = false;
        this.selectedEmoji = null;
        
        // Reset cursor
        const canvas = document.getElementById('three-canvas');
        if (canvas) {
            canvas.style.cursor = window.app && window.app.sceneManager && 
                window.app.sceneManager.rotation3DEnabled ? 'grab' : 'default';
        }
        
        // Hide instruction
        this.hidePlacementInstruction();
        
        console.log('✨ Exited emoji placement mode');
    }
    
    showPlacementInstruction() {
        // Create or show placement instruction
        let instruction = document.getElementById('placement-instruction');
        if (!instruction) {
            instruction = document.createElement('div');
            instruction.id = 'placement-instruction';
            instruction.style.cssText = `
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 14px;
                z-index: 150;
                pointer-events: none;
            `;
            document.getElementById('canvas-container').appendChild(instruction);
        }
        
        instruction.textContent = `Click on the image to place ${this.selectedEmoji} • Press ESC to cancel`;
        instruction.style.display = 'block';
    }
    
    hidePlacementInstruction() {
        const instruction = document.getElementById('placement-instruction');
        if (instruction) {
            instruction.style.display = 'none';
        }
    }
    
    placeEmojiAt(position) {
        if (!this.selectedEmoji || !this.isPlacementMode) return;
        
        const emojiData = {
            id: Date.now() + Math.random(),
            emoji: this.selectedEmoji,
            position: position.clone(),
            rotation: new THREE.Euler(0, 0, 0),
            size: 1,
            timestamp: Date.now()
        };
        
        // Add to emojis array
        this.emojis.push(emojiData);
        
        // Callback to scene manager
        if (this.onEmojiAdded) {
            this.onEmojiAdded(emojiData);
        }
        
        // Exit placement mode
        this.exitPlacementMode();
        
        console.log(`😀 Placed emoji ${this.selectedEmoji} at position:`, position);
    }
    
    removeEmoji(emojiId) {
        const index = this.emojis.findIndex(emoji => emoji.id === emojiId);
        if (index !== -1) {
            const emoji = this.emojis[index];
            this.emojis.splice(index, 1);
            
            // Callback
            if (this.onEmojiRemoved) {
                this.onEmojiRemoved(emojiId);
            }
            
            console.log(`🗑️ Removed emoji: ${emoji.emoji}`);
            return true;
        }
        return false;
    }
    
    updateEmoji(emojiId, updates) {
        const emoji = this.emojis.find(e => e.id === emojiId);
        if (emoji) {
            Object.assign(emoji, updates);
            console.log(`✏️ Updated emoji: ${emoji.emoji}`);
            return true;
        }
        return false;
    }
    
    getEmojis() {
        return [...this.emojis];
    }
    
    loadEmojis(emojiData) {
        this.emojis = [...emojiData];
        
        // Add all emojis to scene
        this.emojis.forEach(emoji => {
            if (this.onEmojiAdded) {
                this.onEmojiAdded(emoji);
            }
        });
        
        console.log(`📂 Loaded ${this.emojis.length} emojis`);
    }
    
    clearAllEmojis() {
        const emojiIds = this.emojis.map(emoji => emoji.id);
        
        emojiIds.forEach(id => {
            if (this.onEmojiRemoved) {
                this.onEmojiRemoved(id);
            }
        });
        
        this.emojis = [];
        
        console.log('🧹 Cleared all emojis');
    }
    
    getEmojiName(emoji) {
        // Simple emoji name mapping - could be enhanced with a proper emoji library
        const emojiNames = {
            '😀': 'grinning face',
            '😃': 'grinning face with big eyes',
            '😄': 'grinning face with smiling eyes',
            '😁': 'beaming face with smiling eyes',
            '😆': 'grinning squinting face',
            '😅': 'grinning face with sweat',
            '🤣': 'rolling on the floor laughing',
            '😂': 'face with tears of joy',
            '🙂': 'slightly smiling face',
            '🙃': 'upside down face',
            '😉': 'winking face',
            '😊': 'smiling face with smiling eyes',
            '😇': 'smiling face with halo',
            '🥰': 'smiling face with hearts',
            '😍': 'smiling face with heart eyes',
            '🤩': 'star struck',
            '😘': 'face blowing a kiss',
            '😗': 'kissing face',
            '☺️': 'smiling face',
            '😚': 'kissing face with closed eyes',
            '😙': 'kissing face with smiling eyes',
            '👋': 'waving hand',
            '🤚': 'raised back of hand',
            '🖐️': 'hand with fingers splayed',
            '✋': 'raised hand',
            '🖖': 'vulcan salute',
            '👌': 'ok hand',
            '🤌': 'pinched fingers',
            '🤏': 'pinching hand',
            '✌️': 'victory hand',
            '🤞': 'crossed fingers',
            '🤟': 'love you gesture',
            '🤘': 'sign of the horns',
            '🤙': 'call me hand',
            '👈': 'backhand index pointing left',
            '👉': 'backhand index pointing right',
            '👆': 'backhand index pointing up',
            '🖕': 'middle finger',
            '👇': 'backhand index pointing down',
            '☝️': 'index pointing up',
            '👍': 'thumbs up',
            '👎': 'thumbs down',
            '👊': 'oncoming fist',
            '✊': 'raised fist',
            '🤛': 'left facing fist',
            '🤜': 'right facing fist',
            '👏': 'clapping hands',
            '🙌': 'raising hands',
            '👐': 'open hands',
            '🤲': 'palms up together',
            '🤝': 'handshake',
            '🙏': 'folded hands',
            '📱': 'mobile phone',
            '💻': 'laptop',
            '🖥️': 'desktop computer',
            '🖨️': 'printer',
            '⌨️': 'keyboard',
            '🖱️': 'computer mouse',
            '🖲️': 'trackball',
            '💽': 'computer disk',
            '💾': 'floppy disk',
            '💿': 'optical disk',
            '📀': 'dvd',
            '📼': 'videocassette',
            '📷': 'camera',
            '📸': 'camera with flash',
            '📹': 'video camera',
            '🎥': 'movie camera',
            '📽️': 'film projector',
            '🎞️': 'film frames',
            '📞': 'telephone receiver',
            '☎️': 'telephone',
            '📟': 'pager',
            '📠': 'fax machine',
            '📺': 'television',
            '📻': 'radio',
            '❤️': 'red heart',
            '🧡': 'orange heart',
            '💛': 'yellow heart',
            '💚': 'green heart',
            '💙': 'blue heart',
            '💜': 'purple heart',
            '🖤': 'black heart',
            '🤍': 'white heart',
            '🤎': 'brown heart',
            '💔': 'broken heart',
            '❣️': 'heart exclamation',
            '💕': 'two hearts',
            '💞': 'revolving hearts',
            '💓': 'beating heart',
            '💗': 'growing heart',
            '💖': 'sparkling heart',
            '💘': 'heart with arrow',
            '💝': 'heart with ribbon'
        };
        
        return emojiNames[emoji] || emoji;
    }
    
    getEmojisByCategory(category) {
        return this.emojiCategories[category] || [];
    }
    
    getAllCategories() {
        return Object.keys(this.emojiCategories);
    }
    
    getEmojiCount() {
        return this.emojis.length;
    }
    
    getEmojiById(id) {
        return this.emojis.find(emoji => emoji.id === id);
    }
    
    exportEmojis() {
        return {
            emojis: this.getEmojis(),
            categories: this.emojiCategories,
            timestamp: Date.now()
        };
    }
    
    importEmojis(data) {
        if (data.emojis) {
            this.loadEmojis(data.emojis);
        }
        
        if (data.categories) {
            this.emojiCategories = { ...this.emojiCategories, ...data.categories };
        }
        
        console.log('📥 Imported emoji data');
    }
    
    dispose() {
        this.emojis = [];
        this.selectedEmoji = null;
        this.isPlacementMode = false;
        
        // Remove placement instruction if it exists
        const instruction = document.getElementById('placement-instruction');
        if (instruction) {
            instruction.remove();
        }
        
        console.log('🧹 Emoji Manager disposed');
    }
}
