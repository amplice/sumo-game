import gameConfig from '../config/gameConfig';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

export default class MobileControls {
    constructor(scene, player, opponent) {
        console.log('MobileControls constructor called');
        
        try {
            this.scene = scene;
            this.player = player;
            this.opponent = opponent;
            
            // Check for Rex plugin
            const rexPlugin = scene.plugins.get('rexVirtualJoystick');
            if (!rexPlugin) {
                console.error('Rex VirtualJoystick plugin not available in MobileControls constructor');
                throw new Error('VirtualJoystick plugin missing');
            }
            
            console.log('Creating joystick with plugin:', rexPlugin);
            
            // Create joystick
            this.createJoystick();
            
            // Create action buttons
            this.createActionButtons();
            
            console.log('Mobile controls successfully created');
        } catch (error) {
            console.error('Error in MobileControls constructor:', error);
            
            // Create a simple fallback control - just action buttons without joystick
            try {
                this.createActionButtonsWithoutJoystick();
            } catch (e) {
                console.error('Failed to create fallback controls:', e);
            }
        }
    }

    // Add a fallback method that doesn't use the joystick
createActionButtonsWithoutJoystick() {
    console.log('Creating fallback controls (buttons only)');
    
    const buttonY = this.scene.cameras.main.height - 150;
    const buttonSpacing = 140;
    const startX = this.scene.cameras.main.width - buttonSpacing * 2.5;
    
    // Create buttons with touch events
    this.pushButton = this.createButton(startX, buttonY, 'PUSH', 0x0000AA);
    this.throwButton = this.createButton(startX + buttonSpacing, buttonY, 'THROW', 0xAA5500);
    this.counterButton = this.createButton(startX + buttonSpacing * 2, buttonY, 'COUNTER', 0xAA0000);
    
    // Add fallback movement buttons
    this.upButton = this.createButton(150, buttonY - 100, '↑', 0x555555);
    this.downButton = this.createButton(150, buttonY + 100, '↓', 0x555555);
    this.leftButton = this.createButton(50, buttonY, '←', 0x555555);
    this.rightButton = this.createButton(250, buttonY, '→', 0x555555);
    
    // Set up directions
    this.upButton.visual.on('pointerdown', () => this.moveInDirection(0, -1, 'up'));
    this.downButton.visual.on('pointerdown', () => this.moveInDirection(0, 1, 'down'));
    this.leftButton.visual.on('pointerdown', () => this.moveInDirection(-1, 0, 'left'));
    this.rightButton.visual.on('pointerdown', () => this.moveInDirection(1, 0, 'right'));
    
    // Stop on pointer up
    this.scene.input.on('pointerup', () => {
        if (this.player) this.player.setVelocity(0, 0);
    });
}

moveInDirection(x, y, direction) {
    if (!this.player || !this.player.canMove) return;
    
    const speed = gameConfig.player.moveSpeed;
    this.player.setVelocity(x * speed, y * speed);
    this.player.setDirection(direction);
}
    
    createJoystick() {
        // Get joystick position based on screen size
        const x = 150;
        const y = this.scene.cameras.main.height - 150;
        
        // Create joystick using Rex Plugins
        this.joystick = this.scene.plugins.get('rexVirtualJoystick').add(this.scene, {
            x: x,
            y: y,
            radius: 100,
            base: this.scene.add.circle(0, 0, 100, 0x888888, 0.5).setDepth(100),
            thumb: this.scene.add.circle(0, 0, 50, 0xcccccc, 0.8).setDepth(100),
            dir: '8dir',   // 8 direction joystick
            forceMin: 16,  // minimum force to be considered as active
            enable: true   // enable immediately
        });
        
        // Store last angle for better direction handling
        this.lastAngle = null;
    }
    
    createActionButtons() {
        const buttonY = this.scene.cameras.main.height - 150;
        const buttonSpacing = 140;
        const startX = this.scene.cameras.main.width - buttonSpacing * 2.5;
        
        // Create buttons with touch events
        this.pushButton = this.createButton(startX, buttonY, 'PUSH', 0x0000AA);
        this.throwButton = this.createButton(startX + buttonSpacing, buttonY, 'THROW', 0xAA5500);
        this.counterButton = this.createButton(startX + buttonSpacing * 2, buttonY, 'COUNTER', 0xAA0000);
        
        // Set up button event listeners
        this.setupButtonListeners();
    }
    
    createButton(x, y, text, color) {
        // Create circle for the button
        const button = this.scene.add.circle(x, y, 70, color, 0.7)
            .setInteractive()
            .setDepth(100);
            
        // Add text label
        const buttonText = this.scene.add.text(x, y, text, {
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(101);
        
        return { visual: button, text: buttonText };
    }
    
    setupButtonListeners() {
        // Push button
        this.pushButton.visual.on('pointerdown', () => {
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
            }
        });
        
        // Throw button
        this.throwButton.visual.on('pointerdown', () => {
            if (this.player.startThrow()) {
                // Set up callback for when throw executes automatically
                this.scene.time.delayedCall(gameConfig.throw.windupDuration, () => {
                    if (this.player && this.player.isThrowWindingUp) {
                        this.player.executeThrow();
                        this.scene.attemptThrow(this.player, this.opponent);
                    }
                });
            }
        });
        
        // Counter button
        this.counterButton.visual.on('pointerdown', () => {
            this.player.startCounter();
        });
    }
    
    update() {
        // Skip if player can't move
        if (!this.player || !this.player.canMove) return;
        
        // Handle joystick input for movement
        if (this.joystick.force > 0) {
            const speed = gameConfig.player.moveSpeed;
            const angle = this.joystick.angle;
            const force = Math.min(this.joystick.force / 50, 1); // Normalize force
            
            // Calculate velocities based on joystick angle and force
            let velocityX = Math.cos(angle) * speed * force;
            let velocityY = Math.sin(angle) * speed * force;
            
            // Handle diagonal movement - apply the same logic as keyboard controls
            if (Math.abs(velocityX) > 0 && Math.abs(velocityY) > 0) {
                velocityX *= gameConfig.player.diagonalSpeedModifier;
                velocityY *= gameConfig.player.diagonalSpeedModifier;
            }
            
            // Apply movement to player
            this.player.setVelocity(velocityX, velocityY);
            
            // Update facing direction based on joystick angle
            this.updatePlayerDirection(angle);
            
            // Store this angle
            this.lastAngle = angle;
        } else {
            // No joystick input, stop movement
            if (this.player.sprite && this.player.sprite.body) {
                this.player.setVelocity(0, 0);
            }
        }
    }
    
    updatePlayerDirection(angle) {
        // Convert angle (radians) to 8-direction format
        const degrees = Phaser.Math.RadToDeg(angle);
        
        let direction = '';
        
        // Map degrees to 8 directions
        if (degrees >= -22.5 && degrees < 22.5) direction = 'right';
        else if (degrees >= 22.5 && degrees < 67.5) direction = 'down-right';
        else if (degrees >= 67.5 && degrees < 112.5) direction = 'down';
        else if (degrees >= 112.5 && degrees < 157.5) direction = 'down-left';
        else if ((degrees >= 157.5 && degrees <= 180) || (degrees >= -180 && degrees < -157.5)) direction = 'left';
        else if (degrees >= -157.5 && degrees < -112.5) direction = 'up-left';
        else if (degrees >= -112.5 && degrees < -67.5) direction = 'up';
        else if (degrees >= -67.5 && degrees < -22.5) direction = 'up-right';
        
        // Only update direction if it's changed
        if (direction && this.player.direction !== direction) {
            this.player.setDirection(direction);
        }
    }
    
    destroy() {
        // Clean up all resources
        if (this.joystick) {
            this.joystick.destroy();
        }
        
        // Destroy buttons
        if (this.pushButton) {
            this.pushButton.visual.destroy();
            this.pushButton.text.destroy();
        }
        
        if (this.throwButton) {
            this.throwButton.visual.destroy();
            this.throwButton.text.destroy();
        }
        
        if (this.counterButton) {
            this.counterButton.visual.destroy();
            this.counterButton.text.destroy();
        }
    }
}