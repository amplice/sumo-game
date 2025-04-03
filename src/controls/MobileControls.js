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
        
        // Set up player state monitoring
        this.previousCanMove = true;
        this.setupPlayerStateListeners();
        
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

    // Method to set up a state change monitor
setupPlayerStateListeners() {
    // Check player state regularly
    this.stateCheckTimer = this.scene.time.addEvent({
        delay: 100, // Check every 100ms
        callback: this.checkPlayerStateChange,
        callbackScope: this,
        loop: true
    });
}

// Method to detect when the player's movement ability changes
checkPlayerStateChange() {
    if (!this.player) return;
    
    // Detect when player transitions from "can't move" to "can move"
    const canMoveNow = this.player.canMove;
    
    if (canMoveNow && !this.previousCanMove) {
        console.log('Player can move again - checking if joystick is active');
        
        // If joystick is still active when player can move again, resume movement
        if (this.isJoystickActive && this.activePointerId !== null) {
            // Safely check for active pointers
            try {
                // First check if input and pointers exist
                if (!this.scene || !this.scene.input || !this.scene.input.pointers) {
                    console.log('Input system not available');
                    return;
                }
                
                // Find the active pointer by ID, safely
                let activePointer = null;
                for (let i = 0; i < this.scene.input.pointers.length; i++) {
                    const pointer = this.scene.input.pointers[i];
                    if (pointer && pointer.id === this.activePointerId) {
                        activePointer = pointer;
                        break;
                    }
                }
                
                // If we found the active pointer, resume movement
                if (activePointer && activePointer.isDown) {
                    console.log('Joystick still active - resuming movement');
                    this.handleJoystickMove(activePointer);
                } else {
                    console.log('Active pointer not found or not down');
                    this.resetJoystick();
                }
            } catch (error) {
                console.error('Error checking for active pointers:', error);
                // Reset joystick state to prevent further issues
                this.resetJoystick();
            }
        }
    }
    
    // Update previous state
    this.previousCanMove = canMoveNow;
}

// Add a safe method to reset joystick state
resetJoystick() {
    this.isJoystickActive = false;
    this.activePointerId = null;
    
    // Reset joystick visuals if they exist
    if (this.joystickThumb && this.joystickPos) {
        this.joystickThumb.x = this.joystickPos.x;
        this.joystickThumb.y = this.joystickPos.y;
    }
}
    
    createJoystick() {
        console.log('Creating joystick');
        
        // Position the joystick in the lower left
        const baseX = 150;
        const baseY = this.scene.cameras.main.height - 150;
        
        // Create base circle
        this.joystickBase = this.scene.add.circle(baseX, baseY, 100, 0x888888, 0.5).setDepth(100);
        
        // Create thumb/handle circle
        this.joystickThumb = this.scene.add.circle(baseX, baseY, 50, 0xcccccc, 0.8).setDepth(101);
        
        // Store joystick position
        this.joystickPos = { x: baseX, y: baseY };
        
        // Add interactive area over the joystick
        this.joystickArea = this.scene.add.circle(baseX, baseY, 150, 0xffffff, 0.01)
            .setInteractive()
            .setDepth(99);
            
        // Track active direction
        this.activeDirection = null;
        this.isJoystickActive = false;
        this.activePointerId = null;
        
        // Add touch event listeners - attach them directly to the joystick area
        this.joystickArea.on('pointerdown', this.handleJoystickDown, this);
        this.joystickArea.on('pointermove', this.handleJoystickMove, this);
        this.joystickArea.on('pointerout', this.handleJoystickUp, this);
        this.joystickArea.on('pointerup', this.handleJoystickUp, this);
        
        // CRITICAL: Enable multi-touch in the scene
        this.scene.input.addPointer(2); // Support at least 3 touches (default is 2)
    }
    
    handleJoystickDown(pointer) {
        // Only activate if no other pointer is controlling the joystick
        if (!this.isJoystickActive) {
            this.isJoystickActive = true;
            this.activePointerId = pointer.id; // Track this pointer's ID
            console.log(`Joystick activated with pointer ID: ${pointer.id}`);
            this.handleJoystickMove(pointer);
        }
    }
    
    handleJoystickMove(pointer) {
        // Only respond to the pointer that activated the joystick
        if (!this.isJoystickActive || pointer.id !== this.activePointerId) return;
        
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
            
            // Only update if direction changed
            if (direction !== this.activeDirection) {
                this.activateDirection(direction);
            }
        }
    }
    
    handleJoystickUp(pointer) {
        // Only respond to the pointer that activated the joystick
        if (this.isJoystickActive && pointer.id === this.activePointerId) {
            console.log(`Joystick released with pointer ID: ${pointer.id}`);
            // Reset joystick
            this.isJoystickActive = false;
            this.activePointerId = null;
            this.joystickThumb.x = this.joystickPos.x;
            this.joystickThumb.y = this.joystickPos.y;
            
            // Stop movement
            this.stopMovement();
        }
    }
    
    activateDirection(direction) {
        // Skip if player can't move
        if (!this.player || !this.player.canMove) return;
        
        // Set current direction
        this.activeDirection = direction;
        
        // Update player direction
        this.player.setDirection(direction);
        
        // Apply movement based on direction
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
                `Velocity: ${velocityX.toFixed(0)},${velocityY.toFixed(0)}\n` +
                `PointerId: ${this.activePointerId}`
            );
        }
    }
    
    stopMovement() {
        if (this.player && this.activeDirection) {
            // Stop the player's velocity
            this.player.setVelocity(0, 0);
            
            // Reset animation to idle
            if (this.player.sprite && this.player.sprite.anims) {
                this.player.sprite.anims.stop();
                this.player.playIdleAnimation();
            }
            
            this.activeDirection = null;
            
            // Update debug text
            if (this.debugText) {
                this.debugText.setText('Joystick: Stopped');
            }
        }
    }
    
    createActionButtons() {
        const buttonY = this.scene.cameras.main.height - 150;
        const buttonSpacing = 120;
        const buttonsX = this.scene.cameras.main.width - (buttonSpacing * 2);
        
        // Create buttons with touch events - slightly larger for easier touch
        this.pushButton = this.createButton(buttonsX - buttonSpacing, buttonY, 'PUSH', 0x0000AA, 70);
        this.throwButton = this.createButton(buttonsX, buttonY, 'THROW', 0xAA5500, 70);
        this.counterButton = this.createButton(buttonsX + buttonSpacing, buttonY, 'COUNTER', 0xAA0000, 70);
        
        // Set up button event listeners
        this.setupButtonListeners();
    }
    
    createButton(x, y, text, color, size = 60) {
        // Create circle for the button
        const button = this.scene.add.circle(x, y, size, color, 0.7)
            .setInteractive({ useHandCursor: true })
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
        this.pushButton.visual.on('pointerdown', (pointer) => {
            console.log(`Push button pressed with pointer ID: ${pointer.id}`);
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
            }
        });
        
        // Throw button
        this.throwButton.visual.on('pointerdown', (pointer) => {
            console.log(`Throw button pressed with pointer ID: ${pointer.id}`);
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
        this.counterButton.visual.on('pointerdown', (pointer) => {
            console.log(`Counter button pressed with pointer ID: ${pointer.id}`);
            this.player.startCounter();
        });
        
        // Add visual feedback to buttons
        const addButtonFeedback = (button) => {
            button.on('pointerdown', () => {
                button.fillAlpha = 1.0; // Brighten on press
            });
            button.on('pointerup', () => {
                button.fillAlpha = 0.7; // Return to normal
            });
            button.on('pointerout', () => {
                button.fillAlpha = 0.7; // Return to normal if pointer leaves
            });
        };
        
        addButtonFeedback(this.pushButton.visual);
        addButtonFeedback(this.throwButton.visual);
        addButtonFeedback(this.counterButton.visual);
    }
    
    update() {
        // We don't need to do much here since movement is handled by events,
        // but we can add safety checks or additional logic if needed
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
            this.pushButton.visual.off('pointerdown');
            this.pushButton.visual.off('pointerup');
            this.pushButton.visual.off('pointerout');
            this.pushButton.visual.destroy();
            this.pushButton.text.destroy();
        }
        
        if (this.throwButton) {
            this.throwButton.visual.off('pointerdown');
            this.throwButton.visual.off('pointerup');
            this.throwButton.visual.off('pointerout');
            this.throwButton.visual.destroy();
            this.throwButton.text.destroy();
        }
        
        if (this.counterButton) {
            this.counterButton.visual.off('pointerdown');
            this.counterButton.visual.off('pointerup');
            this.counterButton.visual.off('pointerout');
            this.counterButton.visual.destroy();
            this.counterButton.text.destroy();
        }
        
        console.log('Mobile controls destroyed');
    }
}