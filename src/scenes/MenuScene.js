import gameConfig from '../config/gameConfig';
import musicManager from '../config/musicManager';
import SimpleNetworking from '../networking/SimpleNetworking';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedDifficulty = 'medium';
        this.initialized = false;
        this.networkingInitialized = false;
    }

    init(data) {
        console.log('MenuScene init called');
        this.selectedDifficulty = 'medium';
        this.initialized = false;
        
        // Check for message from other scenes
        if (data && data.message) {
            this.pendingMessage = data.message;
        }
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
        this.add.text(1024/2, 100, 'SUMO SMACKDOWN', {
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
        
        // Create online play buttons
        this.createOnlineButtons();

        this.createButton(1024/2, 520, 'How to Play', 250, 50, () => {
            this.safeStartScene('TutorialScene');
        });
        
        // Set current scene in music manager
        musicManager.setScene(this);

        // Play background music
        musicManager.playMusic(this, 'nonbattle_music');

        // Create mute buttons with a short delay to ensure scene is ready
        this.time.delayedCall(50, () => {
            this.createMuteButton();
        });
        
        // Show any pending message
        if (this.pendingMessage) {
            this.showMessage(this.pendingMessage);
            this.pendingMessage = null;
        }
         
        this.initialized = true;
        console.log('MenuScene create completed');
    }
    
    createOnlineButtons() {
        // Create network manager if it doesn't exist
        if (!this.game.networking) {
            this.game.networking = new SimpleNetworking(this.game);
            this.networkingInitialized = false;
        }
        
        // Host Game button
        this.createButton(1024/2 - 120, 400, 'Host Game', 200, 50, () => {
            this.initNetworkingIfNeeded(() => {
                const roomId = this.game.networking.hostGame();
                this.showRoomCode(roomId);
            });
        });
        
        // Join Game button
        this.createButton(1024/2 + 120, 400, 'Join Game', 200, 50, () => {
            this.initNetworkingIfNeeded(() => {
                this.promptForRoomCode();
            });
        });
    }
    
    initNetworkingIfNeeded(callback) {
        if (!this.networkingInitialized) {
            this.showMessage('Initializing network...');
            
            // Create networking instance if needed
            if (!this.game.networking) {
                this.game.networking = new SimpleNetworking(this.game);
            }
            
            this.game.networking.initialize()
                .then(() => {
                    this.networkingInitialized = true;
                    callback();
                })
                .catch(err => {
                    console.error('Failed to initialize networking:', err);
                    this.showMessage('Network error. Try again.');
                });
        } else {
            callback();
        }
    }
    
    // Show room code for host
    showRoomCode(roomId) {
        // Create a modal display with the room code
        const overlay = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();
        
        const panel = this.add.rectangle(1024/2, 768/2, 400, 300, 0x333333)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const titleText = this.add.text(1024/2, 768/2 - 100, 'Share this code:', {
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Display the code in a larger, more readable format
        const codeText = this.add.text(1024/2, 768/2, roomId, {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#FFFF00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        const infoText = this.add.text(1024/2, 768/2 + 60, 'Waiting for opponent...', {
            fontSize: '20px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        const cancelButton = this.createButton(1024/2, 768/2 + 120, 'Cancel', 150, 40, () => {
            this.game.networking.disconnect();
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            codeText.destroy();
            infoText.destroy();
            cancelButton.button.destroy();
            cancelButton.text.destroy();
        });
    }

    // Prompt for room code to join
    promptForRoomCode() {
        // Create simple UI for entering room code
        const overlay = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();
        
        const panel = this.add.rectangle(1024/2, 768/2, 400, 300, 0x333333)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const titleText = this.add.text(1024/2, 768/2 - 100, 'Enter Room Code:', {
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Add a manual input field using graphics and text
        let inputCode = '';
        const maxCodeLength = 4;
        
        // Create a text field for the code
        const codeText = this.add.text(1024/2, 768/2, '', {
            fontSize: '48px',
            fontStyle: 'bold',
            fill: '#FFFF00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // Add an instruction text
        const instructionText = this.add.text(1024/2, 768/2 + 60, 'Type the 4-digit code', {
            fontSize: '18px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        // Set up keyboard input for the code
        const keyboardListener = this.input.keyboard.on('keydown', (event) => {
            // Handle backspace
            if (event.key === 'Backspace') {
                inputCode = inputCode.slice(0, -1);
            } 
            // Handle letters and numbers (limit to 4 characters)
            else if (/^[a-zA-Z0-9]$/.test(event.key) && inputCode.length < maxCodeLength) {
                inputCode += event.key.toUpperCase();
            }
            
            // Update the displayed code
            codeText.setText(inputCode);
        });
        
        // Join button
        const joinButton = this.createButton(1024/2, 768/2 + 120, 'Join', 150, 40, () => {
            if (inputCode.length === maxCodeLength) {
                // Remove keyboard listener
                this.input.keyboard.removeListener('keydown', keyboardListener);
                
                // Attempt to join the game
                this.game.networking.joinGame(inputCode);
                
                // Show connecting message
                titleText.setText('Connecting...');
                codeText.setVisible(false);
                instructionText.setText('Connecting to opponent...');
                joinButton.button.setVisible(false);
                joinButton.text.setVisible(false);
                cancelButton.button.setVisible(false);
                cancelButton.text.setVisible(false);
            } else {
                // Show error for incomplete code
                instructionText.setText('Please enter a 4-digit code').setFill('#FF0000');
            }
        });
        
        // Cancel button
        const cancelButton = this.createButton(1024/2, 768/2 + 180, 'Cancel', 150, 40, () => {
            // Remove keyboard listener
            this.input.keyboard.removeListener('keydown', keyboardListener);
            
            // Clean up UI elements
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            codeText.destroy();
            instructionText.destroy();
            joinButton.button.destroy();
            joinButton.text.destroy();
            cancelButton.button.destroy();
            cancelButton.text.destroy();
        });
    }
    
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
        const y = 460;
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

    createMuteButton() {
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
    
    // Show a message to the user
    showMessage(message, duration = 3000) {
        if (this.messageText) {
            this.messageText.destroy();
        }
        
        this.messageText = this.add.text(1024/2, 300, message, {
            fontSize: '24px',
            fill: '#FFFFFF',
            backgroundColor: '#AA0000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(1000);
        
        // Hide after duration
        this.time.delayedCall(duration, () => {
            if (this.messageText) {
                this.messageText.destroy();
                this.messageText = null;
            }
        });
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