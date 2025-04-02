// In src/controls/MobileControls.js

import gameConfig from '../config/gameConfig';

export default class MobileControls {
    constructor(scene, player, opponent) {
        console.log('MobileControls constructor called');
        
        this.scene = scene;
        this.player = player;
        this.opponent = opponent;
        
        // Create visual debug text if needed
        this.createDebugText();
        
        // Create D-pad for movement
        this.createDpad();
        
        // Create action buttons
        this.createActionButtons();
        
        console.log('Mobile controls successfully created');
    }
    
    createDebugText() {
        // Create debug text for development
        this.debugText = this.scene.add.text(10, 10, 'D-pad Debug', {
            fontSize: '16px',
            backgroundColor: '#000',
            padding: { x: 5, y: 5 },
            fill: '#fff'
        }).setDepth(9999);
    }
    
    createDpad() {
        console.log('Creating D-pad controls');
        
        // Position the D-pad in the lower left
        const centerX = 150;
        const centerY = this.scene.cameras.main.height - 150;
        const buttonSize = 70;
        const buttonOffset = 80; // Distance from center
        
        // Create D-pad buttons
        this.dpadButtons = {
            up: this.createDpadButton(centerX, centerY - buttonOffset, '↑', 'up'),
            right: this.createDpadButton(centerX + buttonOffset, centerY, '→', 'right'),
            down: this.createDpadButton(centerX, centerY + buttonOffset, '↓', 'down'),
            left: this.createDpadButton(centerX - buttonOffset, centerY, '←', 'left'),
            upRight: this.createDpadButton(centerX + buttonOffset * 0.7, centerY - buttonOffset * 0.7, '↗', 'up-right'),
            downRight: this.createDpadButton(centerX + buttonOffset * 0.7, centerY + buttonOffset * 0.7, '↘', 'down-right'),
            downLeft: this.createDpadButton(centerX - buttonOffset * 0.7, centerY + buttonOffset * 0.7, '↙', 'down-left'),
            upLeft: this.createDpadButton(centerX - buttonOffset * 0.7, centerY - buttonOffset * 0.7, '↖', 'up-left')
        };
        
        // Create a center button as a background
        this.centerButton = this.scene.add.circle(centerX, centerY, buttonSize - 10, 0x444444, 0.3).setDepth(99);
        
        // Track active direction
        this.activeDirection = null;
        
        // Add listeners for stopping movement on pointer up
        this.scene.input.on('pointerup', () => {
            this.stopMovement();
        });
    }
    
    createDpadButton(x, y, symbol, direction) {
        // Create circle for the button
        const button = this.scene.add.circle(x, y, 40, 0x666666, 0.5)
            .setInteractive({ useHandCursor: true })
            .setDepth(100);
        
        // Add text/symbol
        const text = this.scene.add.text(x, y, symbol, {
            fontSize: '26px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(101);
        
        // Add event listeners
        button.on('pointerdown', () => {
            this.activateDirection(direction);
            button.fillColor = 0x888888; // Visual feedback
        });
        
        button.on('pointerup', () => {
            button.fillColor = 0x666666; // Reset color
        });
        
        button.on('pointerout', () => {
            button.fillColor = 0x666666; // Reset color if pointer moves out
        });
        
        return { visual: button, text, direction };
    }
    
    activateDirection(direction) {
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
                `D-pad:\nDirection: ${direction}\n` +
                `Velocity: ${velocityX.toFixed(0)},${velocityY.toFixed(0)}`
            );
        }
    }
    
    stopMovement() {
        if (this.activeDirection) {
            this.player.setVelocity(0, 0);
            this.activeDirection = null;
            
            // Update debug text
            if (this.debugText) {
                this.debugText.setText('D-pad: Stopped');
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
        // We don't need to do anything here for D-pad since it's all event-based
        // D-pad movement is handled by the pointerdown/pointerup events
    }
    
    destroy() {
        console.log('Destroying mobile controls');
        
        // Clean up debug text
        if (this.debugText) {
            this.debugText.destroy();
        }
        
        // Destroy D-pad buttons
        if (this.dpadButtons) {
            Object.values(this.dpadButtons).forEach(button => {
                if (button.visual) button.visual.destroy();
                if (button.text) button.text.destroy();
            });
        }
        
        // Destroy center button
        if (this.centerButton) {
            this.centerButton.destroy();
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
        
        // Remove global event listeners
        this.scene.input.off('pointerup');
        
        console.log('Mobile controls destroyed');
    }
}