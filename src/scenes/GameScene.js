// Replace the entire GameScene class with this implementation
import Player from '../player';
import gameConfig from '../config/gameConfig';
import AIPlayer from '../ai/AIPlayer';
import musicManager from '../config/musicManager';
import MobileControls from '../controls/MobileControls';


export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.initialized = false;
    }

    init(data) {
        console.log('GameScene init called');
        
        // Reset all state variables
        this.gameMode = data.mode || 'twoPlayer';
        this.round = 1;
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.aiDifficulty = data.difficulty || 'medium';
        
        // Clear instance variables that might persist
        this.player1 = null;
        this.player2 = null;
        this.ai = null;
        this.roundEnded = false;

        this.isBeingPushed = false;
        
        // Flag to ensure we don't initialize animations multiple times
        this.initialized = false;
        
        // Add online mode properties
        this.isOnlineMode = data.mode === 'online';
        if (this.isOnlineMode) {
            this.isHost = data.isHost;
            this.lastUpdateTime = 0;
            this.updateInterval = 50; // Send updates every 50ms
            console.log(`Starting online game as ${this.isHost ? 'host' : 'guest'}`);
        }
    }

    preload() {
        // Load the sprite sheet and atlas
        this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');
        
        // Load push attack effect sprite sheet
        this.load.spritesheet('push_attack', 'assets/sprites/push_sprites.png', { 
            frameWidth: 60, 
            frameHeight: 40 
        });

        // Load throw attack effect sprite sheet
        this.load.spritesheet('throw_attack', 'assets/sprites/throw_sprites.png', { 
            frameWidth: 64, 
            frameHeight: 32 
        });

        this.load.spritesheet('throw_end', 'assets/sprites/throw_end_sprites.png', { 
            frameWidth: 64, 
            frameHeight: 64 
        });

        this.load.spritesheet('counter_windup', 'assets/sprites/counter_windup_sprites.png', { 
            frameWidth: 64, 
            frameHeight: 32 
        });

        // Update GameScene.js preload method to load the counter sprites
this.load.spritesheet('counter_attack', 'assets/sprites/counter_sprites.png', { 
    frameWidth: 64, 
    frameHeight: 64 
});

        this.load.image('ring_background', 'assets/sprites/sumo_ring.png');
        musicManager.preloadSounds(this);
        
        // Log when atlas is loaded
        this.load.on('complete', () => {
            console.log("Atlas loaded, checking frames...");
            const atlas = this.textures.get('sumo_sprites');
            const frames = atlas.getFrameNames();
            console.log("Available frames:", frames);
        });
    }

    create() {
        console.log('GameScene create called');
        
        // Add the background image first (will be beneath everything else)
        const backgroundImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'ring_background');
        
        // Set the background image to cover the whole game area
        const scaleX = this.cameras.main.width / backgroundImage.width;
        const scaleY = this.cameras.main.height / backgroundImage.height;
        const scale = Math.max(scaleX, scaleY);
        backgroundImage.setScale(scale);

        // Create the ring (circular boundary)
        this.ringRadius = gameConfig.ring.radius;
        this.ringCenter = { x: 1024/2, y: 350 };

        // The ring circle can now have transparent fill since we have a background image
        const ring = this.add.circle(
            this.ringCenter.x, 
            this.ringCenter.y, 
            this.ringRadius, 
            gameConfig.ring.color,
            0  // More transparent fill
        );
        ring.setStrokeStyle(
            gameConfig.ring.borderWidth, 
            gameConfig.ring.borderColor
        );

        // Add online mode indicators if online
    if (this.isOnlineMode) {
        // Display connection status
        this.connectionText = this.add.text(750, 20, 
            `Online: ${this.isHost ? 'Host' : 'Guest'}`, 
            gameConfig.ui.fonts.small
        );
        
        // Set up listeners for network updates
        this.setupNetworkListeners();
        
        // Start listening for disconnection
        this.listenForDisconnection();
    }
        
        // Create animations only if not already created
        this.createAnimations();
        
        // Add players to the scene
        this.player1 = new Player(this, 1024/2 - 80, 768/2 -30, 'sumo_sprites', gameConfig.player.colors.player1);
        this.player2 = new Player(this, 1024/2 + 80, 768/2 -30, 'sumo_sprites', gameConfig.player.colors.player2);
        
        // Set up collision between players
        this.collider = this.physics.add.collider(this.player1.sprite, this.player2.sprite);
        
        // Turn off physics debug visualization in a safer way
        this.physics.world.drawDebug = false;
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.visible = false;
        }
        
    // Set up input based on platform
    if (window.isMobile && window.isMobile()) {
        console.log('Setting up mobile controls');
        this.setupMobileControls();
    } else {
        console.log('Setting up keyboard controls');
        this.setupInputHandlers();
    }
   
        
        // Add UI elements
        this.roundText = this.add.text(20, 20, 'Round: 1', gameConfig.ui.fonts.normal);
        this.scoreText = this.add.text(20, 50, 'P1: 0  P2: 0', gameConfig.ui.fonts.normal);
        this.winnerText = this.add.text(1024/2, 150, '', gameConfig.ui.fonts.winner)
            .setOrigin(0.5, 0.5)
            .setVisible(false);
        
        // Add pause button with safer event handling
        this.createMenuButton();
        
        // Create AI controller if in single player mode
        if (this.gameMode === 'singlePlayer') {
            this.ai = new AIPlayer(this, this.player2, this.player1, this.ringCenter, this.ringRadius);
            this.ai.setDifficulty(this.aiDifficulty);
        }
        
        // Add difficulty indicator in single player mode
        if (this.gameMode === 'singlePlayer') {
            this.difficultyText = this.add.text(750, 50, 
                `Difficulty: ${this.aiDifficulty.charAt(0).toUpperCase() + this.aiDifficulty.slice(1)}`, 
                gameConfig.ui.fonts.small
            );
        }
// Set current scene in music manager
musicManager.setScene(this);

// Play battle music
musicManager.playMusic(this, 'battle_music');

// Create mute buttons with a short delay to ensure scene is ready
this.time.delayedCall(50, () => {
    this.createMuteButton();
});
 
 this.initialized = true;
 this.roundEnded = false;
 
 console.log('GameScene create completed');
    }

    // Add a new method to setup mobile controls
// Update setupMobileControls in GameScene.js
// Setup mobile controls with online functionality
setupMobileControls() {
    console.log('Creating mobile controls');
    
    try {
        // Check if the Rex plugin is available
        const rexPlugin = this.plugins.get('rexVirtualJoystick');
        
        if (!rexPlugin) {
            console.error('Rex VirtualJoystick plugin not found!');
            
            // Create a visible error message on screen
            this.add.text(this.cameras.main.width/2, 100, 
                'Controls plugin not loaded.\nPlease refresh the page.',
                { fontSize: '24px', fill: '#ff0000', align: 'center' })
                .setOrigin(0.5);
                
            return;
        }
        
        console.log('Rex plugin found:', rexPlugin);
        
        // For online mode, only control local player
        if (this.isOnlineMode) {
            const localPlayer = this.isHost ? this.player1 : this.player2;
            const remotePlayer = this.isHost ? this.player2 : this.player1;
            
            this.mobileControls = new MobileControls(this, localPlayer, remotePlayer);
        } else {
            // Regular mobile control setup for local play
            this.mobileControls = new MobileControls(this, this.player1, this.player2);
        }
        
        // In mobile mode, we'll make some UI adjustments
        this.adjustUIForMobile();
    } catch (error) {
        console.error('Error setting up mobile controls:', error);
        
        // Create a visible error message on screen
        this.add.text(this.cameras.main.width/2, 100, 
            'Error setting up mobile controls:\n' + error.message,
            { fontSize: '20px', fill: '#ff0000', align: 'center' })
            .setOrigin(0.5);
    }
}
// Add a method to adjust UI for mobile
// In GameScene.js, update the adjustUIForMobile method
adjustUIForMobile() {
    console.log('Adjusting UI for mobile');
    
    try {
        // Make menu button larger for touch
        if (this.pauseButton) {
            console.log('Adjusting pause button');
            try {
                this.pauseButton.setFontSize(28);
                this.pauseButton.setPadding(10);
                this.pauseButton.setPosition(this.cameras.main.width - 100, 40);
            } catch (e) {
                console.error('Error adjusting pauseButton:', e);
            }
        }
        
        // Add safe text resizing - check for existing methods
        const safeResize = (textObj, size) => {
            if (textObj && typeof textObj.setFontSize === 'function') {
                try {
                    textObj.setFontSize(size);
                } catch (e) {
                    console.error(`Error resizing text to ${size}:`, e);
                }
            }
        };
        
        // Use the safe resize method
        safeResize(this.roundText, 24);
        safeResize(this.scoreText, 24);
        
        // Adjust positions for mobile view if needed
        if (this.roundText) this.roundText.setPosition(20, 20);
        if (this.scoreText) this.scoreText.setPosition(20, 50);
        
        console.log('Mobile UI adjustments completed');
    } catch (e) {
        console.error('Error in adjustUIForMobile:', e);
    }
}

setupNetworkListeners() {
    if (!this.isOnlineMode || !this.game.networking) return;
    
    // Set up listener for network data
    this.game.networking.setDataHandler((data) => {
        this.handleNetworkData(data);
    });
}

listenForDisconnection() {
    if (!this.isOnlineMode || !this.game.networking) return;
    
    this.game.networking.setDisconnectHandler(() => {
        // Only handle if we're still in this scene
        if (this.scene.key === 'GameScene') {
            // Show disconnection message
            this.showDisconnectedMessage();
        }
    });
}

showDisconnectedMessage() {
    // Create an overlay with a message
    const overlay = this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.7)
        .setOrigin(0)
        .setDepth(1000);
        
    const text = this.add.text(1024/2, 768/2 - 50, 'Connection Lost', {
        fontSize: '36px',
        fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(1001);
    
    const subtext = this.add.text(1024/2, 768/2 + 20, 'Opponent disconnected', {
        fontSize: '24px',
        fill: '#FFFFFF'
    }).setOrigin(0.5).setDepth(1001);
    
    // Add return button
    const returnButton = this.add.text(1024/2, 768/2 + 100, 'Return to Menu', {
        fontSize: '24px',
        fill: '#FFFFFF',
        backgroundColor: '#AA0000',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(1001);
    
    returnButton.setInteractive({ useHandCursor: true });
    returnButton.on('pointerup', () => {
        this.scene.start('MenuScene', { message: 'Opponent disconnected' });
    });
}

handleNetworkData(data) {
    // Skip if round has ended
    if (this.roundEnded) return;
    
    // Determine which player is remote
    const remotePlayer = this.isHost ? this.player2 : this.player1;
    const localPlayer = this.isHost ? this.player1 : this.player2;
    
    if (!remotePlayer || !localPlayer) return;
    
    // Skip position state logs but log other message types
    if (data.type !== 'playerState') {
        console.log('Received network data type:', data.type);
    }
    
    // Handle different types of network data
    switch (data.type) {
        case 'playerState':
            // Update remote player position
            remotePlayer.x = data.x;
            remotePlayer.y = data.y;
            
            // Update velocity
            remotePlayer.sprite.body.velocity.x = data.velocityX;
            remotePlayer.sprite.body.velocity.y = data.velocityY;
            
            // Update direction
            if (remotePlayer.direction !== data.direction) {
                remotePlayer.setDirection(data.direction);
            }
            
            // Update states
            remotePlayer.canMove = data.canMove;
            remotePlayer.isThrowWindingUp = data.isThrowWindingUp;
            remotePlayer.isCounterWindingUp = data.isCounterWindingUp;
            remotePlayer.isCounterActive = data.isCounterActive;
            break;
            
        case 'action':
            console.log(`Processing action: ${data.action}`);
            
            // Handle action from remote player
            switch(data.action) {
                case 'push':
                    console.log('Remote player attempting push');
                    if (remotePlayer.startPush()) {
                        this.attemptPush(remotePlayer, localPlayer);
                    }
                    break;
                    
                case 'throwStart':
                    console.log('Remote player starting throw');
                    remotePlayer.startThrow();
                    break;
                    
                case 'throwComplete':
                    console.log('Remote player completing throw');
                    if (remotePlayer.isThrowWindingUp) {
                        remotePlayer.executeThrow();
                        this.attemptThrow(remotePlayer, localPlayer);
                    }
                    break;
                    
                case 'counterStart':
                    console.log('Remote player starting counter');
                    remotePlayer.startCounter();
                    break;
            }
            break;
            
        case 'roundEnd':
            console.log('Received round end notification', data);
            // Remote player has triggered round end
            this.endRound(data.winner, data.byThrow);
            break;
    }
}
sendPlayerState() {
    if (!this.isOnlineMode || !this.game.networking) return;
    
    const localPlayer = this.isHost ? this.player1 : this.player2;
    
    if (!localPlayer) return;
    
    this.game.networking.sendData({
        type: 'playerState',
        x: localPlayer.x,
        y: localPlayer.y,
        velocityX: localPlayer.sprite.body.velocity.x,
        velocityY: localPlayer.sprite.body.velocity.y,
        direction: localPlayer.direction,
        canMove: localPlayer.canMove,
        isThrowWindingUp: localPlayer.isThrowWindingUp,
        isCounterWindingUp: localPlayer.isCounterWindingUp,
        isCounterActive: localPlayer.isCounterActive
    });
}

sendAction(action) {
    if (!this.isOnlineMode || !this.game.networking) return;
    
    console.log(`Sending action: ${action}`);
    const success = this.game.networking.sendData({
        type: 'action',
        action: action
    });
    
    if (!success) {
        console.error(`Failed to send action: ${action}`);
    }
}
    
    setupInputHandlers() {
        // Clean up old input handlers if they exist
        if (this.wasdKeys) {
            // Explicitly null out old references
            this.wasdKeys = null;
        }
        
        if (this.arrowKeys) {
            this.arrowKeys = null;
        }
        
        if (this.actionKeys) {
            this.actionKeys = null;
        }
        
        // WASD keys for Player 1
        this.wasdKeys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Arrow keys for Player 2
        this.arrowKeys = this.input.keyboard.createCursorKeys();
        
        // Action keys
        this.actionKeys = {
            // Player 1 actions
            p1Push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            p1Throw: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            p1Counter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C),
            
            // Player 2 actions
            p2Push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO),
            p2Throw: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
            p2Counter: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO)
        };
    }
    
    createMenuButton() {
        // Remove old button if it exists
        if (this.pauseButton) {
            this.pauseButton.destroy();
        }
        
        this.pauseButton = this.add.text(750, 20, 'MENU', gameConfig.ui.fonts.small);
        this.pauseButton.setInteractive({ useHandCursor: true });
        
        // Remove any existing listeners
        this.pauseButton.removeAllListeners('pointerup');
        
        // Add the new listener with safety checks
        this.pauseButton.on('pointerup', () => {
            console.log('Menu button clicked, safely switching to MenuScene');
            
            // Cancel all ongoing activities
            this.tweens.killAll();
            this.time.removeAllEvents();
            
            // Clean up players
            this.cleanupPlayers();
            
            // Add a brief delay to ensure cleanup completes
            this.time.delayedCall(50, () => {
                this.scene.start('MenuScene');
            });
        });
    }
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
    
    cleanupPlayers() {
        // Clean up player 1
        if (this.player1) {
            this.player1.sprite.anims.stop();
            
            // Clean up visual elements
            if (this.player1.throwWindupCircle) this.player1.throwWindupCircle.setVisible(false);
            if (this.player1.counterWindupCircle) this.player1.counterWindupCircle.setVisible(false);
            if (this.player1.counterActiveCircle) this.player1.counterActiveCircle.setVisible(false);
            
            // Destroy throw cone if it exists
            if (this.player1.throwCone) {
                this.player1.throwCone.destroy();
                this.player1.throwCone = null;
            }
        }
        
        // Clean up player 2
        if (this.player2) {
            this.player2.sprite.anims.stop();
            
            // Clean up visual elements
            if (this.player2.throwWindupCircle) this.player2.throwWindupCircle.setVisible(false);
            if (this.player2.counterWindupCircle) this.player2.counterWindupCircle.setVisible(false);
            if (this.player2.counterActiveCircle) this.player2.counterActiveCircle.setVisible(false);
            
            // Destroy throw cone if it exists
            if (this.player2.throwCone) {
                this.player2.throwCone.destroy();
                this.player2.throwCone = null;
            }
        }
    }
    
    createAnimations() {
        // Skip if animations are already created
        if (this.anims.exists('down_walk')) {
            console.log("Animations already exist, skipping creation");
            return;
        }

        console.log("Creating animations for the first time");
        
        // Create animations with explicit frames
        
        // Down walking animation
        this.anims.create({
            key: 'down_walk',
            frames: [
                { key: 'sumo_sprites', frame: 'down_walk_0' },
                { key: 'sumo_sprites', frame: 'down_walk_1' },
                { key: 'sumo_sprites', frame: 'down_walk_2' },
                { key: 'sumo_sprites', frame: 'down_walk_3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Right walking animation
        this.anims.create({
            key: 'right_walk',
            frames: [
                { key: 'sumo_sprites', frame: 'right_walk_0' },
                { key: 'sumo_sprites', frame: 'right_walk_1' },
                { key: 'sumo_sprites', frame: 'right_walk_2' },
                { key: 'sumo_sprites', frame: 'right_walk_3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Up walking animation
        this.anims.create({
            key: 'up_walk',
            frames: [
                { key: 'sumo_sprites', frame: 'up_walk_0' },
                { key: 'sumo_sprites', frame: 'up_walk_1' },
                { key: 'sumo_sprites', frame: 'up_walk_2' },
                { key: 'sumo_sprites', frame: 'up_walk_3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Down-right walking animation
        this.anims.create({
            key: 'down-right_walk',
            frames: [
                { key: 'sumo_sprites', frame: 'down-right_walk_0' },
                { key: 'sumo_sprites', frame: 'down-right_walk_1' },
                { key: 'sumo_sprites', frame: 'down-right_walk_2' },
                { key: 'sumo_sprites', frame: 'down-right_walk_3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Up-right walking animation
        this.anims.create({
            key: 'up-right_walk',
            frames: [
                { key: 'sumo_sprites', frame: 'up-right_walk_0' },
                { key: 'sumo_sprites', frame: 'up-right_walk_1' },
                { key: 'sumo_sprites', frame: 'up-right_walk_2' },
                { key: 'sumo_sprites', frame: 'up-right_walk_3' }
            ],
            frameRate: 8,
            repeat: -1
        });
        
        // Create idle animations for all directions
        this.anims.create({
            key: 'down_idle',
            frames: [{ key: 'sumo_sprites', frame: 'down_idle' }],
            frameRate: 1,
            repeat: 0
        });
        
        this.anims.create({
            key: 'right_idle',
            frames: [{ key: 'sumo_sprites', frame: 'right_idle' }],
            frameRate: 1,
            repeat: 0
        });
        
        this.anims.create({
            key: 'up_idle',
            frames: [{ key: 'sumo_sprites', frame: 'up_idle' }],
            frameRate: 1,
            repeat: 0
        });
        
        this.anims.create({
            key: 'down-right_idle',
            frames: [{ key: 'sumo_sprites', frame: 'down-right_idle' }],
            frameRate: 1,
            repeat: 0
        });
        
        this.anims.create({
            key: 'up-right_idle',
            frames: [{ key: 'sumo_sprites', frame: 'up-right_idle' }],
            frameRate: 1,
            repeat: 0
        });
        
        // Create push attack animation effect
        this.anims.create({
            key: 'push_attack_anim',
            frames: this.anims.generateFrameNumbers('push_attack', { start: 0, end: 3 }),
            frameRate: 14,
            repeat: 0
        });
        
        // Create push attack animations for each direction
        // Down (South) push animation
        this.anims.create({
            key: 'down_push',
            frames: [
                { key: 'sumo_sprites', frame: 'down_push_0' },
                { key: 'sumo_sprites', frame: 'down_push_1' },
                { key: 'sumo_sprites', frame: 'down_push_2' },
                { key: 'sumo_sprites', frame: 'down_push_3' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Right (East) push animation
        this.anims.create({
            key: 'right_push',
            frames: [
                { key: 'sumo_sprites', frame: 'right_push_0' },
                { key: 'sumo_sprites', frame: 'right_push_1' },
                { key: 'sumo_sprites', frame: 'right_push_2' },
                { key: 'sumo_sprites', frame: 'right_push_3' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Up (North) push animation
        this.anims.create({
            key: 'up_push',
            frames: [
                { key: 'sumo_sprites', frame: 'up_push_0' },
                { key: 'sumo_sprites', frame: 'up_push_1' },
                { key: 'sumo_sprites', frame: 'up_push_2' },
                { key: 'sumo_sprites', frame: 'up_push_3' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Down-right (Southeast) push animation
        this.anims.create({
            key: 'down-right_push',
            frames: [
                { key: 'sumo_sprites', frame: 'down-right_push_0' },
                { key: 'sumo_sprites', frame: 'down-right_push_1' },
                { key: 'sumo_sprites', frame: 'down-right_push_2' },
                { key: 'sumo_sprites', frame: 'down-right_push_3' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Up-right (Northeast) push animation
        this.anims.create({
            key: 'up-right_push',
            frames: [
                { key: 'sumo_sprites', frame: 'up-right_push_0' },
                { key: 'sumo_sprites', frame: 'up-right_push_1' },
                { key: 'sumo_sprites', frame: 'up-right_push_2' },
                { key: 'sumo_sprites', frame: 'up-right_push_3' }
            ],
            frameRate: 12,
            repeat: 0
        });

        // Create throw attack animation effect
        this.anims.create({
            key: 'throw_attack_anim',
            frames: this.anims.generateFrameNumbers('throw_attack', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'throw_end_anim',
            frames: this.anims.generateFrameNumbers('throw_end', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: 0
        });
                // Create throw animations for all directions
        // Down (South) throw animation
        this.anims.create({
            key: 'down_throw',
            frames: [
                { key: 'sumo_sprites', frame: 'down_throw_0' },
                { key: 'sumo_sprites', frame: 'down_throw_1' },
                { key: 'sumo_sprites', frame: 'down_throw_2' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Right (East) throw animation
        this.anims.create({
            key: 'right_throw',
            frames: [
                { key: 'sumo_sprites', frame: 'right_throw_0' },
                { key: 'sumo_sprites', frame: 'right_throw_1' },
                { key: 'sumo_sprites', frame: 'right_throw_2' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Up (North) throw animation
        this.anims.create({
            key: 'up_throw',
            frames: [
                { key: 'sumo_sprites', frame: 'up_throw_0' },
                { key: 'sumo_sprites', frame: 'up_throw_1' },
                { key: 'sumo_sprites', frame: 'up_throw_2' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Down-right (Southeast) throw animation
        this.anims.create({
            key: 'down-right_throw',
            frames: [
                { key: 'sumo_sprites', frame: 'down-right_throw_0' },
                { key: 'sumo_sprites', frame: 'down-right_throw_1' },
                { key: 'sumo_sprites', frame: 'down-right_throw_2' }
            ],
            frameRate: 12,
            repeat: 0
        });
        
        // Up-right (Northeast) throw animation
        this.anims.create({
            key: 'up-right_throw',
            frames: [
                { key: 'sumo_sprites', frame: 'up-right_throw_0' },
                { key: 'sumo_sprites', frame: 'up-right_throw_1' },
                { key: 'sumo_sprites', frame: 'up-right_throw_2' }
            ],
            frameRate: 12,
            repeat: 0
        });

// Create counter windup animation
this.anims.create({
    key: 'counter_windup_anim',
    frames: this.anims.generateFrameNumbers('counter_windup', { start: 0, end: 3 }),
    frameRate: 13.33,
    repeat: 0
});
// Add the counter animation in GameScene.js createAnimations method
this.anims.create({
    key: 'counter_active_anim',
    frames: this.anims.generateFrameNumbers('counter_attack', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: 0
});
        
    }

// Update the update method to handle mobile controls
// Update method with online functionality
update(time, delta) {
    // Skip everything if round has already ended
    if (this.roundEnded) {
        return;
    }
    
    // Update player states
    if (this.player1) this.player1.update(delta);
    if (this.player2) this.player2.update(delta);
    
    // Handle different game modes
    if (this.isOnlineMode) {
        // Online mode - determine which player we control
        const localPlayer = this.isHost ? this.player1 : this.player2;
        const remotePlayer = this.isHost ? this.player2 : this.player1;
        
        // Only process local player input
        if (!window.isMobile || !window.isMobile()) {
            this.handleOnlinePlayerActions(localPlayer, remotePlayer);
        }
        
        // Update mobile controls if they exist (for local player only)
        if (this.mobileControls) {
            this.mobileControls.update();
        }
        
        // Handle keyboard movement for local player
        if (!window.isMobile || !window.isMobile()) {
            if (localPlayer && localPlayer.canMove) {
                if (this.isHost) {
                    // Host uses WASD
                    this.handlePlayerMovement(
                        localPlayer,
                        this.wasdKeys.W.isDown,
                        this.wasdKeys.S.isDown,
                        this.wasdKeys.A.isDown,
                        this.wasdKeys.D.isDown
                    );
                } else {
                    // Guest uses arrow keys
                    this.handlePlayerMovement(
                        localPlayer,
                        this.arrowKeys.up.isDown,
                        this.arrowKeys.down.isDown,
                        this.arrowKeys.left.isDown,
                        this.arrowKeys.right.isDown
                    );
                }
            }
        }
        
        // Send network updates periodically
        if (time > this.lastUpdateTime + this.updateInterval) {
            this.sendPlayerState();
            this.lastUpdateTime = time;
        }
    } else {
        // Normal offline mode
        if (!window.isMobile || !window.isMobile()) {
            // Only handle keyboard actions on non-mobile
            this.handlePlayerActions();
        }
        
        // Update mobile controls if they exist
        if (this.mobileControls) {
            this.mobileControls.update();
        }
        
        // Handle AI if in single player mode
        if (this.gameMode === 'singlePlayer' && this.ai) {
            this.ai.update(delta);
        }
        
        // Handle player movement only if they can move and we're not on mobile
        if (!window.isMobile || !window.isMobile()) {
            if (this.player1 && this.player1.canMove) {
                this.handlePlayerMovement(
                    this.player1,
                    this.wasdKeys.W.isDown,
                    this.wasdKeys.S.isDown,
                    this.wasdKeys.A.isDown,
                    this.wasdKeys.D.isDown
                );
            }
            
            if (this.player2 && this.player2.canMove && this.gameMode === 'twoPlayer') {
                this.handlePlayerMovement(
                    this.player2,
                    this.arrowKeys.up.isDown,
                    this.arrowKeys.down.isDown,
                    this.arrowKeys.left.isDown,
                    this.arrowKeys.right.isDown
                );
            }
        }
    }
    
    // Update player positions
    if (this.player1) this.player1.updatePosition();
    if (this.player2) this.player2.updatePosition();
    
    // Check if players are outside the ring
    if (this.player1 && this.player2) {
        if (this.checkOutOfBounds(this.player1, this.ringCenter, this.ringRadius)) {
            this.endRound('Player 2');
        }
        else if (this.checkOutOfBounds(this.player2, this.ringCenter, this.ringRadius)) {
            this.endRound('Player 1');
        }
    }
}
handleOnlinePlayerActions(localPlayer, remotePlayer) {
    if (!localPlayer || !remotePlayer || !this.actionKeys) return;
    
    // Determine which action keys to use based on host status
    const pushKey = this.isHost ? this.actionKeys.p1Push : this.actionKeys.p2Push;
    const throwKey = this.isHost ? this.actionKeys.p1Throw : this.actionKeys.p2Throw;
    const counterKey = this.isHost ? this.actionKeys.p1Counter : this.actionKeys.p2Counter;
    
    // Push action
    if (Phaser.Input.Keyboard.JustDown(pushKey) && localPlayer.startPush()) {
        this.attemptPush(localPlayer, remotePlayer);
        this.sendAction('push');
    }
    
    // Throw action
    if (Phaser.Input.Keyboard.JustDown(throwKey)) {
        if (localPlayer.startThrow()) {
            // Send throw start action
            this.sendAction('throwStart');
            
            // Set up callback for when throw executes automatically
            this.time.delayedCall(gameConfig.throw.windupDuration, () => {
                if (localPlayer && localPlayer.isThrowWindingUp) {
                    localPlayer.executeThrow();
                    this.attemptThrow(localPlayer, remotePlayer);
                    this.sendAction('throwComplete');
                }
            });
        }
    }
    
    // Counter action
    if (Phaser.Input.Keyboard.JustDown(counterKey)) {
        if (localPlayer.startCounter()) {
            // Counter activates automatically after windup
            this.sendAction('counterStart');
        }
    }
}
    // Function to handle player actions
    handlePlayerActions() {
        if (!this.player1 || !this.player2 || !this.actionKeys) return;
        
        // Player 1 Push Action
        if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p1Push) && this.player1.startPush()) {
            this.attemptPush(this.player1, this.player2);
        }
        
        // Player 2 Push Action (only in two player mode)
        if (this.gameMode === 'twoPlayer') {
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p2Push) && this.player2.startPush()) {
                this.attemptPush(this.player2, this.player1);
            }
        }
        
        // Player 1 Throw Action - just press to start, executes automatically after windup
        if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p1Throw)) {
            if (this.player1.startThrow()) {
                // Set up callback for when throw executes automatically
                this.time.delayedCall(gameConfig.throw.windupDuration, () => {
                    // Execute the throw AND check for hit in the same callback
                    if (this.player1 && this.player1.isThrowWindingUp) {  // Check if still winding up (not canceled by push)
                        // Execute the throw animation/visuals first
                        this.player1.executeThrow();
                        // THEN check for hit detection
                        this.attemptThrow(this.player1, this.player2);
                    }
                });
            }
        }
        
        // Player 2 Throw Action (only in two player mode)
        if (this.gameMode === 'twoPlayer') {
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p2Throw)) {
                if (this.player2.startThrow()) {
                    // Set up callback for when throw executes automatically
                    this.time.delayedCall(gameConfig.throw.windupDuration, () => {
                        if (this.player2 && this.player2.isThrowWindingUp) {  // Check if still winding up (not canceled by push)
                            // Execute the throw animation/visuals first
                            this.player2.executeThrow();
                            // THEN check for hit detection
                            this.attemptThrow(this.player2, this.player1);
                        }
                    });
                }
            }
        }
        
        // Player 1 Counter Action
        if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p1Counter)) {
            if (this.player1.startCounter()) {
                // Counter activates automatically after windup in the player update method
            }
        }
        
        // Player 2 Counter Action (only in two player mode)
        if (this.gameMode === 'twoPlayer') {
            if (Phaser.Input.Keyboard.JustDown(this.actionKeys.p2Counter)) {
                if (this.player2.startCounter()) {
                    // Counter activates automatically after windup in the player update method
                }
            }
        }
    }

    // Function to handle player movement
    handlePlayerMovement(player, up, down, left, right) {
        if (!player) return;
        
        const speed = gameConfig.player.moveSpeed;
        let movingX = false;
        let movingY = false;
        let direction = player.direction;
        
        // Track velocity components instead of setting immediately
        let velocityX = 0;
        let velocityY = 0;
        
        // Handle Y-axis movement
        if (up) {
            velocityY = -speed;
            direction = 'up';
            movingY = true;
        } else if (down) {
            velocityY = speed;
            direction = 'down';
            movingY = true;
        }
        
        // Handle X-axis movement
        if (left) {
            velocityX = -speed;
            direction = 'left';
            movingX = true;
        } else if (right) {
            velocityX = speed;
            direction = 'right';
            movingX = true;
        }
        
        // Handle diagonal movement
        if (movingX && movingY) {
            // Calculate normalized diagonal velocity
            const diagonalFactor = gameConfig.player.diagonalSpeedModifier;
            velocityX *= diagonalFactor;
            velocityY *= diagonalFactor;
            
            if (up && left) {
                direction = 'up-left';
            } else if (up && right) {
                direction = 'up-right';
            } else if (down && left) {
                direction = 'down-left';
            } else if (down && right) {
                direction = 'down-right';
            }
        }
        
        // Apply the final velocity
        player.setVelocity(velocityX, velocityY);
        
        // Update player's direction if they're moving
        if (movingX || movingY) {
            player.setDirection(direction);
        }
    }

    // Function to check if a player is outside the ring boundary
    checkOutOfBounds(player, ringCenter, ringRadius) {
        if (!player) return false;
        
        const dx = player.x - ringCenter.x;
        const dy = player.y - ringCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Return true if the player is outside the ring
        return distance > ringRadius - gameConfig.player.outOfBoundsMargin;
    }

    // Function to attempt a push
    attemptPush(pusher, target) {
        if (!pusher || !target) return;

            // Play the push sound whenever a push is attempted
            musicManager.playSFX(this, 'push_sound');        
        // Calculate push direction vector based on pusher's facing direction
        let pushDirX = 0;
        let pushDirY = 0;
        
        // Set push direction based on pusher's current direction
        switch (pusher.direction) {
            case 'up': pushDirX = 0; pushDirY = -1; break;
            case 'down': pushDirX = 0; pushDirY = 1; break;
            case 'left': pushDirX = -1; pushDirY = 0; break;
            case 'right': pushDirX = 1; pushDirY = 0; break;
            case 'up-left': pushDirX = -0.707; pushDirY = -0.707; break;
            case 'up-right': pushDirX = 0.707; pushDirY = -0.707; break;
            case 'down-left': pushDirX = -0.707; pushDirY = 0.707; break;
            case 'down-right': pushDirX = 0.707; pushDirY = 0.707; break;
        }
        
        const pushConfig = gameConfig.push;
        
        // 1. Play character's push animation - always call directly
        pusher.playPushAnimation();
        
        // 2. Create push attack sprite effect
        const startX = pusher.x;
        const startY = pusher.y;
        const angle = Math.atan2(pushDirY, pushDirX) * (180 / Math.PI);
        
        // Calculate offset for the push attack sprite
        const characterOffset = 15; // Distance to offset from character center
        const spriteStartX = pusher.x + (pushDirX * characterOffset);
        const spriteStartY = pusher.y + (pushDirY * characterOffset);
        
        // Create the push attack sprite
        const pushAttack = this.add.sprite(spriteStartX, spriteStartY, 'push_attack');
        pushAttack.setOrigin(0, 0.5); // Set origin to left-center for proper rotation
        pushAttack.angle = angle; // Rotate to match push direction
        
        // Play the push attack animation
        pushAttack.play('push_attack_anim');
        
        // Remove the sprite when animation completes
        pushAttack.on('animationcomplete', () => {
            pushAttack.destroy();
        });
        
        // 3. Create the green box effect (optional - can be removed)
        // Map directions to exact angles for green box rotation 
        let boxAngle;
        switch (pusher.direction) {
            case 'right': boxAngle = 0; break;
            case 'down-right': boxAngle = 45; break;
            case 'down': boxAngle = 90; break;
            case 'down-left': boxAngle = 135; break;
            case 'left': boxAngle = 180; break;
            case 'up-left': boxAngle = 225; break;
            case 'up': boxAngle = 270; break;
            case 'up-right': boxAngle = 315; break;
            default: boxAngle = 0;
        }
        
        // Use a container with a rectangle for rotation
        const container = this.add.container(startX, startY);
        
        // Create a rectangle for push area, centered properly
        const pushArea = this.add.graphics();
        pushArea.fillStyle(pushConfig.visual.color, pushConfig.visual.alpha);
        pushArea.fillRect(0, -pushConfig.width/2, pushConfig.range, pushConfig.width);
        
        // Add to container and rotate
        container.add(pushArea);
        container.rotation = boxAngle * (Math.PI / 180); // Convert to radians for Phaser rotation
        
        // Animate the push effect
        this.tweens.add({
            targets: container,
            alpha: 0,
            duration: pushConfig.visual.duration,
            onComplete: () => {
                if (container && container.active) {
                    container.destroy();
                }
            }
        });
        
        // Hit detection
        const dx = target.x - startX;
        const dy = target.y - startY;
        
        // Calculate the projection of the target onto the push direction vector
        const projection = dx * pushDirX + dy * pushDirY;
        
        // Calculate perpendicular distance from the center line
        const perpDist = Math.abs(dx * pushDirY - dy * pushDirX);
        
        // Check if within the rectangle (in front of pusher, within width/2 of center line, within range)
        const hitSuccessful = (projection > 0) && (projection <= pushConfig.range) && (perpDist <= pushConfig.width/2);
        
        if (hitSuccessful && target) {
                    // Play the push hit sound when a push successfully lands
                    musicManager.playSFX(this, 'push_hit');            // If target is in counter active state, reverse the push!
            if (target.isCounterActive) {
                // Counter the push - reverse direction and push the original pusher back
                this.counterPush(target, pusher, -pushDirX, -pushDirY);
                return;
            }
            
            // If target is winding up for a throw or counter, cancel// If target is winding up for a throw or counter, cancel it
            if (target.isThrowWindingUp) {
                target.cancelThrow();
            }
            if (target.isCounterWindingUp) {
                target.cancelCounter();
                
                // Extra pushback during counter windup
                const extraFactor = 1.5; // 50% further
                this.applyPush(pusher, target, pushDirX, pushDirY, pushConfig.distance * extraFactor);
                return;
            }
            
            // Normal push
            this.applyPush(pusher, target, pushDirX, pushDirY, pushConfig.distance);
        }
    }
    
    applyPush(pusher, target, dirX, dirY, distance) {
        if (!target) return;
        
        const pushConfig = gameConfig.push;
        
        // Apply push force with tweening for smooth movement
        const targetStartX = target.x;
        const targetStartY = target.y;
        
        // Calculate push destination
        const targetEndX = targetStartX + dirX * distance;
        const targetEndY = targetStartY + dirY * distance;
        
        // Mark the target as being pushed
        target.isBeingPushed = true;
        
        // Animate the target being pushed
        this.tweens.add({
            targets: [target],
            x: targetEndX,
            y: targetEndY,
            duration: pushConfig.feedback.targetPushDuration,
            ease: 'Power2',
            onComplete: () => {
                // Clear the pushed state when animation completes
                if (target) {
                    target.isBeingPushed = false;
                }
            }
        });
        
        // If this is online mode and we're pushing a local player, send the pushed state
        if (this.isOnlineMode && 
            ((this.isHost && target === this.player1) || 
            (!this.isHost && target === this.player2))) {
            
            // Send the pushed position to the other player
            this.game.networking.sendData({
                type: 'pushedState',
                x: targetEndX,
                y: targetEndY
            });
        }
    }
    
    // Function to handle counter-push (when active counter counters a push)
    counterPush(defender, attacker, dirX, dirY) {
        if (!defender || !attacker) return;
        
        const pushConfig = gameConfig.push;
        const counterFeedback = gameConfig.counter.feedback;
        
        // Visual effect for counter - flash around defender
        const counterFlash = this.add.circle(
            defender.x, 
            defender.y, 
            counterFeedback.counterFlashSize, 
            counterFeedback.counterFlashColor, 
            counterFeedback.counterFlashAlpha
        );
        
        // Flash and expand
        this.tweens.add({
            targets: counterFlash,
            scale: counterFeedback.counterFlashScale,
            alpha: 0,
            duration: counterFeedback.counterFlashDuration,
            onComplete: () => {
                if (counterFlash && counterFlash.active) {
                    counterFlash.destroy();
                }
            }
        });
        
        // Create lightning effect between players
        const lightning = this.add.graphics();
        lightning.lineStyle(4, 0xFFFF00, 1);
        lightning.lineBetween(defender.x, defender.y, attacker.x, attacker.y);
        
        // Flash the lightning
        this.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 500,
            onComplete: () => {
                if (lightning && lightning.active) {
                    lightning.destroy();
                }
            }
        });
        
        // Apply a stronger push to the attacker (counter push is stronger)
        this.applyPush(defender, attacker, dirX, dirY, pushConfig.distance * 1.5);
    }

    // Function to attempt a throw
    attemptThrow(thrower, target) {
        // Direction vectors for each direction
        const directionVectors = {
            'up': { x: 0, y: -1 },
            'up-right': { x: 0.7071, y: -0.7071 },
            'right': { x: 1, y: 0 },
            'down-right': { x: 0.7071, y: 0.7071 },
            'down': { x: 0, y: 1 },
            'down-left': { x: -0.7071, y: 0.7071 },
            'left': { x: -1, y: 0 },
            'up-left': { x: -0.7071, y: -0.7071 }
        };
        
        // Check if thrower and target are valid
        if (!thrower || !target) return false;
        
        // Get direction vector
        const dirVector = directionVectors[thrower.direction];
        
        // Calculate dx/dy and distance
        const dx = target.x - thrower.x;
        const dy = target.y - thrower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const throwConfig = gameConfig.throw;
        const counterFeedback = gameConfig.counter.feedback;
        
        // Skip if too far away
        if (distance > throwConfig.range) {
            return false;
        }
        
        // Normalize the vector to target
        const targetVector = {
            x: dx / distance,
            y: dy / distance
        };
        
        // Calculate dot product (measures how aligned the vectors are)
        const dotProduct = dirVector.x * targetVector.x + dirVector.y * targetVector.y;
        
        // Define cone angle - use cosine of half the angle
        const coneAngleCosine = Math.cos(Math.PI * throwConfig.angle / 180 / 2);
        
        // Check if within the throw cone (cos(angle) > cos(cone half-angle) means angle < cone half-angle)
        if (dotProduct > coneAngleCosine) {
            // Check if target is currently in counter active state
            if (target.isCounterActive) {
                // Counter successful! Reverse the throw - target counters thrower
                
                // Visual effect for counter - bright flash around target
                const counterFlash = this.add.circle(
                    target.x, 
                    target.y, 
                    counterFeedback.counterFlashSize, 
                    counterFeedback.counterFlashColor, 
                    counterFeedback.counterFlashAlpha
                );
                
                // Flash and expand
                this.tweens.add({
                    targets: counterFlash,
                    scale: counterFeedback.counterFlashScale,
                    alpha: 0,
                    duration: counterFeedback.counterFlashDuration,
                    onComplete: () => {
                        if (counterFlash && counterFlash.active) {
                            counterFlash.destroy();
                        }
                    }
                });
                
                // Create lightning effect between players
                const lightning = this.add.graphics();
                lightning.lineStyle(
                    counterFeedback.lightningWidth, 
                    counterFeedback.lightningColor, 
                    1
                );
                
                // Zigzag line for lightning effect
                const segments = counterFeedback.lightningSegments;
                const points = [];
                points.push({ x: target.x, y: target.y });
                
                for (let i = 1; i < segments; i++) {
                    const t = i / segments;
                    const midX = target.x + (thrower.x - target.x) * t;
                    const midY = target.y + (thrower.y - target.y) * t;
                    const offset = counterFeedback.lightningOffset * 
                                  (Math.random() > 0.5 ? 1 : -1) * (1 - t);
                    
                    points.push({
                        x: midX + offset * (dy / distance),
                        y: midY - offset * (dx / distance)
                    });
                }
                
                points.push({ x: thrower.x, y: thrower.y });
                
                // Draw the lightning
                lightning.beginPath();
                lightning.moveTo(points[0].x, points[0].y);
                
                for (let i = 1; i < points.length; i++) {
                    lightning.lineTo(points[i].x, points[i].y);
                }
                
                lightning.strokePath();
                
                // Flash the lightning
                this.tweens.add({
                    targets: lightning,
                    alpha: 0,
                    duration: counterFeedback.lightningDuration,
                    onComplete: () => {
                        if (lightning && lightning.active) {
                            lightning.destroy();
                        }
                    }
                });
                
                // End the counter state
                target.endCounter();
                
                // Make thrower spin to show being thrown
                if (thrower.sprite) {
                    this.tweens.add({
                        targets: thrower.sprite,
                        scale: gameConfig.player.spriteScale * 1.25, // Scale up by 25% from base scale
                        angle: 360,
                        duration: throwConfig.feedback.spinDuration,
                        onComplete: () => {
                            if (thrower && thrower.sprite) {
                                thrower.sprite.setScale(gameConfig.player.spriteScale); // Use config value
                                thrower.sprite.angle = 0;
                                
                                // End round with counter victory
                                const winner = target === this.player1 ? 'Player 1' : 'Player 2';
                                this.endRound(winner, true);
                            }
                        }
                    });
                }
                
                return true;
            }
            
            // Normal throw (no counter) - create a throwing animation
            // Make the thrower flash
            if (thrower.sprite) {
                this.tweens.add({
                    targets: thrower.sprite,
                    alpha: throwConfig.feedback.flashAlpha,
                    duration: throwConfig.feedback.flashDuration,
                    yoyo: true,
                    repeat: 1
                });
            }
            
            // Make target spin to show being thrown
            if (target.sprite) {
                this.tweens.add({
                    targets: target.sprite,
                    scale: gameConfig.player.spriteScale * 1.25, // Scale up by 25% from base scale
                    angle: 360,
                    duration: throwConfig.feedback.spinDuration,
                    onComplete: () => {
                        if (target && target.sprite) {
                            target.sprite.setScale(gameConfig.player.spriteScale); // Use config value
                            target.sprite.angle = 0;
                            
                            // End round with throw victory
                            this.endRound(thrower === this.player1 ? 'Player 1' : 'Player 2', true);
                        }
                    }
                });
            }
            
            // Display throw effect line between players
            const graphics = this.add.graphics();
            graphics.lineStyle(
                throwConfig.feedback.lineWidth, 
                throwConfig.feedback.lineColor, 
                1
            );
            graphics.lineBetween(thrower.x, thrower.y, target.x, target.y);
            
            // Fade out the line
            this.tweens.add({
                targets: graphics,
                alpha: 0,
                duration: throwConfig.feedback.lineFadeDuration,
                onComplete: () => {
                    if (graphics && graphics.active) {
                        graphics.destroy();
                    }
                }
            });
            
            return true;
        }
        
        return false;
    }
    
    // Method to clean up all visual effects
    cleanupVisualEffects() {
        console.log('Cleaning up visual effects');
        
        // Destroy any push attack sprites
        this.children.list.forEach(child => {
            // Find and destroy all push_attack sprites
            if (child.texture && child.texture.key === 'push_attack') {
                child.destroy();
            }
            
            // Find and destroy all graphics objects (used for push visuals, throw cones, etc.)
            if (child instanceof Phaser.GameObjects.Graphics) {
                child.destroy();
            }
            
            // Find and destroy all containers (used for push area visuals)
            if (child instanceof Phaser.GameObjects.Container) {
                child.destroy();
            }
        });
        
        // Hide all circle visuals for players
        if (this.player1) {
            if (this.player1.throwWindupCircle) this.player1.throwWindupCircle.setVisible(false);
            if (this.player1.counterWindupCircle) this.player1.counterWindupCircle.setVisible(false);
            if (this.player1.counterActiveCircle) this.player1.counterActiveCircle.setVisible(false);
            
            // Clear any throw cones that might be present
            if (this.player1.throwCone) {
                this.player1.throwCone.destroy();
                this.player1.throwCone = null;
            }
        }
        
        if (this.player2) {
            if (this.player2.throwWindupCircle) this.player2.throwWindupCircle.setVisible(false);
            if (this.player2.counterWindupCircle) this.player2.counterWindupCircle.setVisible(false);
            if (this.player2.counterActiveCircle) this.player2.counterActiveCircle.setVisible(false);
            
            // Clear any throw cones that might be present
            if (this.player2.throwCone) {
                this.player2.throwCone.destroy();
                this.player2.throwCone = null;
            }
        }
        
        // Reset player sprites to idle animations
        if (this.player1 && this.player1.sprite) {
            this.player1.sprite.anims.stop();
            this.player1.playIdleAnimation();
        }
        
        if (this.player2 && this.player2.sprite) {
            this.player2.sprite.anims.stop();
            this.player2.playIdleAnimation();
        }
        
        // Clear any lingering tints or alpha changes
        if (this.player1 && this.player1.sprite) {
            this.player1.sprite.clearTint();
            this.player1.sprite.setAlpha(1);
        }
        
        if (this.player2 && this.player2.sprite) {
            this.player2.sprite.clearTint();
            this.player2.sprite.setAlpha(1);
        }
    }
    
    // Function to end the round and display the winner
    endRound(winner, byThrow = false) {
        // Skip if round is already ended
        if (this.roundEnded) {
            return;
        }
        
        console.log(`Ending round with winner: ${winner}`);
        
        // Immediately cancel all timers and tweens to prevent delayed actions
        this.tweens.killAll();
        this.time.removeAllEvents();
        
        // Add a game state flag to prevent further actions
        this.roundEnded = true;
        
        // Immediately halt all player movement and actions
        if (this.player1) {
            this.player1.canMove = false;
            this.player1.setVelocity(0, 0);
            this.player1.cancelThrow();
            this.player1.endCounter();
        }
        
        if (this.player2) {
            this.player2.canMove = false;
            this.player2.setVelocity(0, 0);
            this.player2.cancelThrow();
            this.player2.endCounter();
        }
        
        // Clean up all visual effects
        this.cleanupVisualEffects();
        if (this.isOnlineMode && this.game.networking) {
            this.game.networking.sendData({
                type: 'roundEnd',
                winner: winner,
                byThrow: byThrow
            });
        }
        // Update win counts
        if (winner === 'Player 1') {
            this.player1Wins++;
        } else {
            this.player2Wins++;
        }
        
        // Update score text
        this.scoreText.setText(`P1: ${this.player1Wins}  P2: ${this.player2Wins}`);
        // Display winner with appropriate message
        const winType = byThrow ? '(threw opponent)' : '(pushed opponent out)';
        this.winnerText.setText(`${winner} wins round ${this.round}!\n${winType}`);
        this.winnerText.setVisible(true);
        
        // Check if match is over (best of 3)
        if (this.player1Wins >= 2 || this.player2Wins >= 2) {
            this.winnerText.setText(`${winner} wins the match!`);
            
            // Add a "Return to Menu" button
            this.createReturnButton();
        } else {
            // Set up next round after 2 seconds
            this.time.delayedCall(2000, () => {
                if (this.scene.key === 'GameScene') { // Safety check to ensure we're still in this scene
                    this.round++;
                    this.roundText.setText(`Round: ${this.round}`);
                    this.resetRound();
                }
            });
        }
        
    }

    createReturnButton() {
        // Clean up an existing button if it exists
        if (this.returnButton) {
            this.returnButton.destroy();
        }
        
        const buttonConfig = gameConfig.ui.buttons;
        this.returnButton = this.add.text(1024/2, 300, 'Return to Menu', {
            fontSize: '24px',
            fill: '#FFF',
            backgroundColor: '#0000AA',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        this.returnButton.setInteractive({ useHandCursor: true });
        
        // Remove any existing listeners to prevent duplicates
        this.returnButton.removeAllListeners('pointerup');
        
        // Add the listener with safety checks
        this.returnButton.on('pointerup', () => {
            console.log('Return to Menu button pressed. Cleaning up...');
            
            // Stop the battle music
            if (this.sound.get('battle_music')) {
                console.log('Stopping battle music before returning to menu');
                this.sound.get('battle_music').stop();
            }
            
            // Immediately prevent further interactions
            this.returnButton.disableInteractive();
            
            // Cancel all timers and tweens
            this.tweens.killAll();
            this.time.removeAllEvents();
            
            // Thorough cleanup
            this.cleanupBeforeSceneChange();
            
            // Transition after a small delay to ensure cleanup completes
            this.time.delayedCall(50, () => {
                this.scene.start('MenuScene');
            });
        });
    }
    
    cleanupBeforeSceneChange() {
        console.log('Performing thorough cleanup before scene change');
        
        // Destroy UI elements safely
        if (this.musicMuteButton) {
            this.musicMuteButton.destroy();
            this.musicMuteButton = null;
        }
        
        if (this.sfxMuteButton) {
            this.sfxMuteButton.destroy();
            this.sfxMuteButton = null;
        }
        
        // Additional cleanup...
        // existing cleanup code remains
    }
    
    // In MenuScene.js, add a similar cleanup in the safeStartScene method
    
    safeStartScene(sceneKey, data = {}) {
        console.log(`Safely starting scene: ${sceneKey}`);
        
        // Clean up text objects
        if (this.musicMuteButton) {
            this.musicMuteButton.destroy();
            this.musicMuteButton = null;
        }
        
        if (this.sfxMuteButton) {
            this.sfxMuteButton.destroy();
            this.sfxMuteButton = null;
        }
        
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

    resetRound() {
        console.log('Resetting round');
        
        // Clear the round ended flag
        this.roundEnded = false;
        
        // Cancel all active tweens and timers
        this.tweens.killAll();
        this.time.removeAllEvents();
        
        // Clean up all visual effects for a fresh start
        this.cleanupVisualEffects();
        
        // Reset player positions
        if (this.player1 && this.player2) {
            this.player1.x = 1024/2 - 80;
            this.player1.y = 768/2 - 30;
            this.player2.x = 1024/2 + 80;
            this.player2.y = 768/2 - 30;
            
            // Reset player states
            this.player1.canMove = true;
            this.player1.sprite.clearTint();
            this.player1.sprite.setScale(gameConfig.player.spriteScale);
            this.player1.sprite.angle = 0;
            this.player1.sprite.setAlpha(1); // Ensure visibility
            this.player1.cancelThrow();
            this.player1.pushCooldown = 0; // Reset cooldowns
            
            // Reset counter states for player 1
            this.player1.isCounterWindingUp = false;
            this.player1.isCounterActive = false;
            this.player1.counterWindupTimer = 0;
            this.player1.counterActiveTimer = 0;
            
            this.player2.canMove = true;
            this.player2.sprite.clearTint();
            this.player2.sprite.setScale(gameConfig.player.spriteScale);
            this.player2.sprite.angle = 0;
            this.player2.sprite.setAlpha(1); // Ensure visibility
            this.player2.cancelThrow();
            this.player2.pushCooldown = 0; // Reset cooldowns
            
            // Reset counter states for player 2
            this.player2.isCounterWindingUp = false;
            this.player2.isCounterActive = false;
            this.player2.counterWindupTimer = 0;
            this.player2.counterActiveTimer = 0;
            
            // Reset player animations to idle
            this.player1.playIdleAnimation();
            this.player2.playIdleAnimation();
        }
        
        // Hide winner text
        this.winnerText.setVisible(false);
        
        // Update AI for the new round
        if (this.gameMode === 'singlePlayer' && this.ai) {
            this.ai.newRound(this.round, this.player1Wins, this.player2Wins);
        }
        
        console.log('Round reset complete');
    }
    
    // Called when scene is about to be switched away from
    shutdown() {
        console.log('GameScene shutdown called');
        
        // Cancel all ongoing processes
        this.tweens.killAll();
        this.time.removeAllEvents();

            // Disconnect networking if in online mode
    if (this.isOnlineMode && this.game.networking) {
        this.game.networking.disconnect();
    }
        
        // Clean up mobile controls if they exist
        if (this.mobileControls) {
            this.mobileControls.destroy();
            this.mobileControls = null;
        }
        
        // Rest of shutdown method...
        this.cleanupBeforeSceneChange();
        
        // Explicitly destroy game objects
        if (this.player1) {
            if (this.player1.throwWindupCircle) this.player1.throwWindupCircle.destroy();
            if (this.player1.counterWindupCircle) this.player1.counterWindupCircle.destroy();
            if (this.player1.counterActiveCircle) this.player1.counterActiveCircle.destroy();
            if (this.player1.throwCone) this.player1.throwCone.destroy();
            if (this.player1.sprite) this.player1.sprite.destroy();
        }
        
        if (this.player2) {
            if (this.player2.throwWindupCircle) this.player2.throwWindupCircle.destroy();
            if (this.player2.counterWindupCircle) this.player2.counterWindupCircle.destroy();
            if (this.player2.counterActiveCircle) this.player2.counterActiveCircle.destroy();
            if (this.player2.throwCone) this.player2.throwCone.destroy();
            if (this.player2.sprite) this.player2.sprite.destroy();
        }
        
        // Clear references to game objects
        this.player1 = null;
        this.player2 = null;
        this.ai = null;
        
        // Stop the music when leaving the scene
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        console.log('GameScene shutdown complete');
    }
}