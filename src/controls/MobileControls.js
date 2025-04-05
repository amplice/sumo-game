// src/controls/MobileControls.js

import gameConfig from '../config/gameConfig';

export default class MobileControls {
    constructor(scene, player, opponent) {
        console.log('MobileControls constructor called');
        
        this.scene = scene;
        this.player = player;
        this.opponent = opponent;
        
        // Create visual debug text if needed
        this.createDebugText();
        
        // Create joystick visuals
        this.createJoystick();
        
        // Create action buttons
        this.createActionButtons();
        
        // Track for each frame if we should override movement
        this.shouldOverrideMovement = false;
        this.currentDirection = null;
        
        console.log('Mobile controls successfully created');
    }
    
    createDebugText() {
        // Create debug text for development
        this.debugText = this.scene.add.text(10, 10, 'Joystick Debug', {
            fontSize: '16px',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 },
            fill: '#fff'
        }).setDepth(9999);
    }
    
    createJoystick() {
        console.log('Creating joystick');
        
        // Position the joystick more toward the center from the lower left
        const baseX = 200;             // Moved right from 150
        const baseY = this.scene.cameras.main.height - 200;  // Moved up from -150
        
        // Further increase size of joystick components
        const baseRadius = 150;       // Further increased from 120
        const thumbRadius = 75;       // Further increased from 60
        const touchAreaRadius = 220;  // Further increased from 180
        
        // Create base circle
        this.joystickBase = this.scene.add.circle(baseX, baseY, baseRadius, 0x888888, 0.5).setDepth(100);
        
        // Create thumb/handle circle
        this.joystickThumb = this.scene.add.circle(baseX, baseY, thumbRadius, 0xcccccc, 0.8).setDepth(101);
        
        // Store joystick position
        this.joystickPos = { x: baseX, y: baseY };
        
        // Add interactive area over the joystick
        this.joystickArea = this.scene.add.circle(baseX, baseY, touchAreaRadius, 0xffffff, 0.01)
            .setInteractive()
            .setDepth(99);
            
        // Add touch event listeners
        this.joystickArea.on('pointerdown', this.handleJoystickDown, this);
        this.joystickArea.on('pointermove', this.handleJoystickMove, this);
        this.joystickArea.on('pointerout', this.handleJoystickUp, this);
        this.joystickArea.on('pointerup', this.handleJoystickUp, this);
        
        // Enable multiple pointers
        this.scene.input.addPointer(2);
    }
    
    handleJoystickDown(pointer) {
        // Start tracking this pointer
        this.joystickPointerId = pointer.id;
        this.handleJoystickMove(pointer);
    }
    
    handleJoystickMove(pointer) {
        // Only process if it's the same pointer that started the joystick
        if (pointer.id !== this.joystickPointerId) return;
        
        // Calculate direction from joystick base to pointer
        const dx = pointer.x - this.joystickPos.x;
        const dy = pointer.y - this.joystickPos.y;
        
        // Calculate distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit thumb position within base radius
        const maxDistance = 75; // Max thumb distance from center
        let thumbX, thumbY;
        
        if (distance > maxDistance) {
            // Normalize direction and scale to max distance
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            thumbX = this.joystickPos.x + normalizedX * maxDistance;
            thumbY = this.joystickPos.y + normalizedY * maxDistance;
        } else {
            // Use pointer position directly
            thumbX = pointer.x;
            thumbY = pointer.y;
        }
        
        // Update thumb position
        this.joystickThumb.x = thumbX;
        this.joystickThumb.y = thumbY;
        
        // If distance is sufficient, convert to 8-direction movement
        if (distance > 20) { // Small deadzone
            // Calculate angle
            const angle = Math.atan2(dy, dx);
            const degrees = Phaser.Math.RadToDeg(angle);
            
            // Convert to 8-direction format
            let direction;
            
            // Use 45-degree sectors for 8-way movement
            if (degrees > -22.5 && degrees <= 22.5) direction = 'right';
            else if (degrees > 22.5 && degrees <= 67.5) direction = 'down-right';
            else if (degrees > 67.5 && degrees <= 112.5) direction = 'down';
            else if (degrees > 112.5 && degrees <= 157.5) direction = 'down-left';
            else if ((degrees > 157.5 && degrees <= 180) || (degrees >= -180 && degrees <= -157.5)) direction = 'left';
            else if (degrees > -157.5 && degrees <= -112.5) direction = 'up-left';
            else if (degrees > -112.5 && degrees <= -67.5) direction = 'up';
            else if (degrees > -67.5 && degrees <= -22.5) direction = 'up-right';
            
            // Store current direction
            this.currentDirection = direction;
            
            // Signal that we should override movement in the next update
            this.shouldOverrideMovement = true;
        }
    }
    
    handleJoystickUp(pointer) {
        // Only handle if it's the joystick pointer
        if (pointer.id === this.joystickPointerId) {
            // Reset joystick
            this.joystickPointerId = null;
            this.joystickThumb.x = this.joystickPos.x;
            this.joystickThumb.y = this.joystickPos.y;
            
            // Stop movement
            this.shouldOverrideMovement = false;
            this.currentDirection = null;
            
            if (this.player && this.player.canMove) {
                this.player.setVelocity(0, 0);
                
                // Reset animation to idle
                if (this.player.sprite && this.player.sprite.anims) {
                    this.player.sprite.anims.stop();
                    this.player.playIdleAnimation();
                }
            }
        }
    }
    
    createActionButtons() {
        const buttonY = this.scene.cameras.main.height - 150;
        const buttonSpacing = 120;
        const buttonsX = this.scene.cameras.main.width - (buttonSpacing * 2);
        
        // Create buttons with touch events
        this.pushButton = this.createButton(buttonsX - buttonSpacing, buttonY, 'PUSH', 0x0000AA);
        this.throwButton = this.createButton(buttonsX, buttonY, 'THROW', 0xAA5500);
        this.counterButton = this.createButton(buttonsX + buttonSpacing, buttonY, 'COUNTER', 0xAA0000);
        
        // Set up button event listeners
        this.setupButtonListeners();
    }
    
    createButton(x, y, text, color) {
        // Create circle for the button
        const button = this.scene.add.circle(x, y, 60, color, 0.7)
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
                
                // Add this to send push action if in online mode
                if (this.scene.isOnlineMode) {
                    this.scene.sendAction('push');
                }
            }
        });
        
        // Throw button
        this.throwButton.visual.on('pointerdown', () => {
            if (this.player.startThrow()) {
                // Add this to send throw start action if in online mode
                if (this.scene.isOnlineMode) {
                    this.scene.sendAction('throwStart');
                }
                
                // Set up callback for when throw executes automatically
                this.scene.time.delayedCall(gameConfig.throw.windupDuration, () => {
                    if (this.player && this.player.isThrowWindingUp) {
                        this.player.executeThrow();
                        this.scene.attemptThrow(this.player, this.opponent);
                        
                        // Add this to send throw complete action if in online mode
                        if (this.scene.isOnlineMode) {
                            this.scene.sendAction('throwComplete');
                        }
                    }
                });
            }
        });
        
        // Counter button
        this.counterButton.visual.on('pointerdown', () => {
            if (this.player.startCounter()) {
                // Add this to send counter start action if in online mode
                if (this.scene.isOnlineMode) {
                    this.scene.sendAction('counterStart');
                }
            }
        });
    }
    
    // Main update method - called every frame
    update() {
        // Don't try to move if player can't move
        if (!this.player || !this.player.canMove) return;
        
        // Apply movement if joystick is active
        if (this.shouldOverrideMovement && this.currentDirection) {
            this.applyMovement(this.currentDirection);
        }
    }
    
    applyMovement(direction) {
        if (!this.player || !this.player.canMove) return;
        
        // Update player direction
        this.player.setDirection(direction);
        
        // Calculate velocity based on direction
        const speed = gameConfig.player.moveSpeed;
        let velocityX = 0;
        let velocityY = 0;
        
        // Calculate velocity based on direction - exactly matching keyboard behavior
        switch(direction) {
            case 'up':
                velocityY = -speed;
                break;
            case 'down':
                velocityY = speed;
                break;
            case 'left':
                velocityX = -speed;
                break;
            case 'right':
                velocityX = speed;
                break;
            case 'up-right':
                velocityX = speed * gameConfig.player.diagonalSpeedModifier;
                velocityY = -speed * gameConfig.player.diagonalSpeedModifier;
                break;
            case 'up-left':
                velocityX = -speed * gameConfig.player.diagonalSpeedModifier;
                velocityY = -speed * gameConfig.player.diagonalSpeedModifier;
                break;
            case 'down-right':
                velocityX = speed * gameConfig.player.diagonalSpeedModifier;
                velocityY = speed * gameConfig.player.diagonalSpeedModifier;
                break;
            case 'down-left':
                velocityX = -speed * gameConfig.player.diagonalSpeedModifier;
                velocityY = speed * gameConfig.player.diagonalSpeedModifier;
                break;
        }
        
        // Apply velocity to player
        this.player.setVelocity(velocityX, velocityY);
        
        // Update debug text
        if (this.debugText) {
            this.debugText.setText(
                `Joystick:\nDirection: ${direction}\n` +
                `Velocity: ${velocityX.toFixed(0)},${velocityY.toFixed(0)}`
            );
        }
    }
    
    destroy() {
        console.log('Destroying mobile controls');
        
        // Clean up debug text
        if (this.debugText) {
            this.debugText.destroy();
        }
        
        // Destroy joystick components
        if (this.joystickBase) this.joystickBase.destroy();
        if (this.joystickThumb) this.joystickThumb.destroy();
        if (this.joystickArea) {
            // Remove all event listeners
            this.joystickArea.off('pointerdown');
            this.joystickArea.off('pointermove');
            this.joystickArea.off('pointerout');
            this.joystickArea.off('pointerup');
            this.joystickArea.destroy();
        }
        
        // Destroy action buttons
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
        
        console.log('Mobile controls destroyed');
    }
}