import gameConfig from '../config/gameConfig';
import musicManager from '../config/musicManager';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedDifficulty = 'medium';
        this.initialized = false;
    }

    init() {
        console.log('MenuScene init called');
        this.selectedDifficulty = 'medium';
        this.initialized = false;
    }

    preload() {
        // Load the sprite sheet and atlas if not already loaded
        if (!this.textures.exists('sumo_sprites')) {
            this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');
        }
        
        // Load the same background image used in matches
        if (!this.textures.exists('ring_background')) {
            this.load.image('ring_background', 'assets/sprites/sumo_ring.png');
        }
        musicManager.preloadSounds(this);
    }

    create() {
        console.log('MenuScene create called');
        
        // Add the same background image as used in matches
        const backgroundImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'ring_background');
        
        // Set the background image to cover the whole game area
        const scaleX = this.cameras.main.width / backgroundImage.width;
        const scaleY = this.cameras.main.height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);
        backgroundImage.setScale(scale);
            
        // // Create the ring circle over the background
        // const ringRadius = gameConfig.ring.radius - 20;
        // const ring = this.add.circle(1024/2, 400, ringRadius, gameConfig.ring.color, 0.2);
        // ring.setStrokeStyle(gameConfig.ring.borderWidth, gameConfig.ring.borderColor);

        // Add sumo sprites to the menu for visual preview
        const blueSumo = this.add.sprite(1024/2 - 100, 185, 'sumo_sprites', 'down_idle')
            .setScale(gameConfig.player.spriteScale);
        const redSumo = this.add.sprite(1024/2 + 100, 185, 'sumo_sprites', 'down_idle')
            .setScale(gameConfig.player.spriteScale);
        
        // Create simple idle animations
        if (!this.anims.exists('menu_blue_idle')) {
            this.anims.create({
                key: 'menu_blue_idle',
                frames: [
                    { key: 'sumo_sprites', frame: 'down_idle' },
                    { key: 'sumo_sprites', frame: 'down_walk_0' }
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('menu_red_idle')) {
            this.anims.create({
                key: 'menu_red_idle',
                frames: [
                    { key: 'sumo_sprites', frame: 'down_idle' },
                    { key: 'sumo_sprites', frame: 'down_walk_0' }
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        
        // Play the idle animations
        blueSumo.play('menu_blue_idle');
        redSumo.play('menu_red_idle');

        // Add title - positioned above the ring
        this.add.text(1024/2, 100, 'SUMO DUEL', {
            fontSize: '64px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Create buttons with better spacing and consistent sizing
        this.createButton(1024/2, 260, 'Two Player', 250, 50, () => {
            this.safeStartScene('GameScene', { mode: 'twoPlayer' });
        });

        // Single Player button (with difficulty display)
        this.singlePlayerButton = this.createButton(1024/2, 330, `Single Player (${this.formatDifficulty(this.selectedDifficulty)})`, 250, 50, () => {
            this.safeStartScene('GameScene', { 
                mode: 'singlePlayer',
                difficulty: this.selectedDifficulty
            });
        });

        // Difficulty selection buttons with better spacing and consistent sizing
        this.createDifficultyButtons();

        this.createButton(1024/2, 450, 'How to Play', 250, 50, () => {
            this.safeStartScene('TutorialScene');
        });
        
        // // Test Scene button (for debugging)
        // this.createButton(1024/2, 520, 'Animation Test', 250, 50, () => {
        //     this.safeStartScene('TestScene');
        // });
        
// Set current scene in music manager
musicManager.setScene(this);

// Play background music
musicManager.playMusic(this, 'nonbattle_music');

// Create mute buttons with a short delay to ensure scene is ready
this.time.delayedCall(50, () => {
    this.createMuteButton();
});
 
 this.initialized = true;
 console.log('MenuScene create completed');
    }
    
// Update the safeStartScene method in MenuScene.js
safeStartScene(sceneKey, data = {}) {
    console.log(`Safely starting scene: ${sceneKey}`);
    
    // Cancel any active tweens
    this.tweens.killAll();
    
    // Remove any temporary input listeners
    this.input.keyboard.removeAllKeys(true);
    
    // Disable all interactive elements to prevent multiple clicks
    this.children.list.forEach(child => {
        if (child.input && child.input.enabled) {
            child.disableInteractive();
        }
    });
    
    // Short delay before transition to ensure cleanup
    this.time.delayedCall(50, () => {
        this.scene.start(sceneKey, data);
    });
}

    createButton(x, y, text, width, height, callback) {
        const buttonConfig = gameConfig.ui.buttons;
        const button = this.add.rectangle(x, y, width, height, buttonConfig.color)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#FFFFFF',
        }).setOrigin(0.5);
        
        // Use a unique name for each button to avoid issues
        const listenerName = `button-${x}-${y}`;
        
        // Remove any existing listeners to prevent duplicates
        button.removeAllListeners('pointerup');
        
        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.fillColor = buttonConfig.hoverColor)
            .on('pointerout', () => button.fillColor = buttonConfig.color)
            .on('pointerdown', () => button.fillColor = buttonConfig.pressColor)
            .on('pointerup', () => {
                button.fillColor = buttonConfig.hoverColor;
                // Call our callback safely
                callback();
            });
            
        return { button, text: buttonText };
    }
    
    createDifficultyButtons() {
        const y = 390;
        const spacing = 110;
        const difficulties = ['easy', 'medium', 'hard'];
        this.difficultyButtons = {};
        
        difficulties.forEach((difficulty, index) => {
            const x = 1024/2 + (index - 1) * spacing;
            const color = (difficulty === this.selectedDifficulty) ? 
                          0x00AA00 : // Green for selected
                          0x555555;  // Gray for unselected
            
            const width = 100;
            const height = 40;
                          
            const button = this.add.rectangle(x, y, width, height, color)
                .setStrokeStyle(2, 0xFFFFFF);
                
            // Make sure we don't have duplicate listeners
            button.removeAllListeners('pointerup');
            
            button.setInteractive({ useHandCursor: true })
                .on('pointerup', () => {
                    this.setDifficulty(difficulty);
                });
                
            const text = this.add.text(x, y, this.formatDifficulty(difficulty), {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.difficultyButtons[difficulty] = { button, text };
        });
    }
    
    setDifficulty(difficulty) {
        // Update the previous selected button
        if (this.selectedDifficulty && this.difficultyButtons[this.selectedDifficulty]) {
            this.difficultyButtons[this.selectedDifficulty].button.fillColor = 0x555555;
        }
        
        // Set new difficulty
        this.selectedDifficulty = difficulty;
        
        // Update the new selected button
        if (this.difficultyButtons[difficulty]) {
            this.difficultyButtons[difficulty].button.fillColor = 0x00AA00;
        }
        
        // Update the Single Player button text
        if (this.singlePlayerButton && this.singlePlayerButton.text) {
            this.singlePlayerButton.text.setText(`Single Player (${this.formatDifficulty(difficulty)})`);
        }
    }
    
    formatDifficulty(difficulty) {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
    /**
     * Creates a mute button in the top-right corner
     */
// Update the createMuteButton method in both GameScene.js and MenuScene.js

// Update the createMuteButton method in both GameScene.js and MenuScene.js

createMuteButton() {
    // Remove the scene active check entirely as it's causing problems
    // Just create the buttons directly

    // Position in top-right corner
    const x = this.cameras.main.width - 60;
    const musicY = 30;
    const sfxY = 80;
    
    // Make sure musicManager is aware of this scene
    musicManager.setScene(this);
    
    // Get current mute states
    const isMusicMuted = musicManager.isMusicMuted();
    const isSFXMuted = musicManager.isSFXMuted();
    
    // Set button texts based on current states
    const musicButtonText = isMusicMuted ? 'MUSIC OFF' : 'MUSIC ON';
    const sfxButtonText = isSFXMuted ? 'FX OFF' : 'FX ON';
    
    // Create or update music mute button
    if (this.musicMuteButton && this.musicMuteButton.active) {
        this.musicMuteButton.setText(musicButtonText);
    } else {
        this.musicMuteButton = this.add.text(x, musicY, musicButtonText, {
            fontSize: '16px',
            fontStyle: 'bold',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 },
            fixedWidth: 100,
            align: 'center'
        }).setOrigin(0.5);
        
        this.musicMuteButton.setInteractive({ useHandCursor: true });
        
        // Handle click event for music
        this.musicMuteButton.on('pointerup', () => {
            const isMuted = musicManager.toggleMusicMute();
            
            // Update button text
            if (this.musicMuteButton && this.musicMuteButton.active) {
                this.musicMuteButton.setText(isMuted ? 'MUSIC OFF' : 'MUSIC ON');
            }
        });
    }
    
    // Create or update SFX mute button
    if (this.sfxMuteButton && this.sfxMuteButton.active) {
        this.sfxMuteButton.setText(sfxButtonText);
    } else {
        this.sfxMuteButton = this.add.text(x, sfxY, sfxButtonText, {
            fontSize: '16px',
            fontStyle: 'bold',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 },
            fixedWidth: 100,
            align: 'center'
        }).setOrigin(0.5);
        
        this.sfxMuteButton.setInteractive({ useHandCursor: true });
        
        // Handle click event for SFX
        this.sfxMuteButton.on('pointerup', () => {
            const isMuted = musicManager.toggleSFXMute();
            
            // Update button text
            if (this.sfxMuteButton && this.sfxMuteButton.active) {
                this.sfxMuteButton.setText(isMuted ? 'FX OFF' : 'FX ON');
            }
        });
    }

    console.log('Mute buttons created successfully');
}
    // Called when scene is shutting down
    shutdown() {
        console.log('MenuScene shutdown called');
        
        // Kill all running tweens
        this.tweens.killAll();
        
        // Stop all animations
        this.children.list.forEach(child => {
            if (child.anims) {
                child.anims.stop();
            }
        });
        
        // Clear references to buttons to avoid memory leaks
        this.difficultyButtons = {};
        this.singlePlayerButton = null;

        console.log('MenuScene shutdown complete');
    }
}