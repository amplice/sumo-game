import Player from '../player';
import gameConfig from '../config/gameConfig';
import AIPlayer from '../ai/AIPlayer';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameMode = data.mode || 'twoPlayer';
        this.round = 1;
        this.player1Wins = 0;
        this.player2Wins = 0;
        this.aiDifficulty = data.difficulty || 'medium';
    }

    preload() {
        // Load the sprite sheet and atlas
        this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');
    }

    create() {
        // Create the ring (circular boundary)
        this.ringRadius = gameConfig.ring.radius;
        this.ringCenter = { x: 400, y: 300 };
        const ring = this.add.circle(
            this.ringCenter.x, 
            this.ringCenter.y, 
            this.ringRadius, 
            gameConfig.ring.color
        );
        ring.setStrokeStyle(
            gameConfig.ring.borderWidth, 
            gameConfig.ring.borderColor
        );
        
        // Create animations for all directions
        this.createAnimations();
        
        // Add players to the scene
        this.player1 = new Player(this, 300, 400, 'sumo_sprites', gameConfig.player.colors.player1);
        this.player2 = new Player(this, 500, 200, 'sumo_sprites', gameConfig.player.colors.player2);
        
        // Set up collision between players
        this.physics.add.collider(this.player1.sprite, this.player2.sprite);
        
        // Turn off physics debug visualization in a safer way
        this.physics.world.drawDebug = false;
        if (this.physics.world.debugGraphic) {
            this.physics.world.debugGraphic.visible = false;
        }
        
        // Set up input keys
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
        
        // Add UI elements
        this.roundText = this.add.text(20, 20, 'Round: 1', gameConfig.ui.fonts.normal);
        this.scoreText = this.add.text(20, 50, 'P1: 0  P2: 0', gameConfig.ui.fonts.normal);
        this.winnerText = this.add.text(400, 150, '', gameConfig.ui.fonts.winner)
            .setOrigin(0.5, 0.5)
            .setVisible(false);
        
        // Add pause button
        this.pauseButton = this.add.text(750, 20, 'MENU', gameConfig.ui.fonts.small)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.scene.start('MenuScene');
            });
        
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
    }
    
    createAnimations() {
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
    }

    update(time, delta) {
        // Update player states
        this.player1.update(delta);
        this.player2.update(delta);
        
        // Only process gameplay if not showing winner text
        if (!this.winnerText.visible) {
            // Process player actions first
            this.handlePlayerActions();
            
            // Handle AI if in single player mode
            if (this.gameMode === 'singlePlayer') {
                this.ai.update(delta);
            }
            
            // Handle player movement only if they can move
            if (this.player1.canMove) {
                this.handlePlayerMovement(
                    this.player1,
                    this.wasdKeys.W.isDown,
                    this.wasdKeys.S.isDown,
                    this.wasdKeys.A.isDown,
                    this.wasdKeys.D.isDown
                );
            }
            
            if (this.player2.canMove && this.gameMode === 'twoPlayer') {
                this.handlePlayerMovement(
                    this.player2,
                    this.arrowKeys.up.isDown,
                    this.arrowKeys.down.isDown,
                    this.arrowKeys.left.isDown,
                    this.arrowKeys.right.isDown
                );
            }
            
            // Update player positions
            this.player1.updatePosition();
            this.player2.updatePosition();
            
            // Check if players are outside the ring
            if (this.checkOutOfBounds(this.player1, this.ringCenter, this.ringRadius)) {
                this.endRound('Player 2');
            }
            else if (this.checkOutOfBounds(this.player2, this.ringCenter, this.ringRadius)) {
                this.endRound('Player 1');
            }
        }
    }

    // Function to handle player actions
    handlePlayerActions() {
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
    // Function to handle player movement
handlePlayerMovement(player, up, down, left, right) {
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
        const dx = player.x - ringCenter.x;
        const dy = player.y - ringCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Return true if the player is outside the ring
        return distance > ringRadius - gameConfig.player.outOfBoundsMargin;
    }

    // Function to attempt a push
    attemptPush(pusher, target) {
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
        
        // Create rectangle push area instead of cone
        const startX = pusher.x;
        const startY = pusher.y;
        const angle = Math.atan2(pushDirY, pushDirX);
        
        // Use a container with a rectangle for rotation
        const container = this.add.container(startX, startY);
        
        // Create a rectangle for push area, centered properly
        const pushArea = this.add.graphics();
        pushArea.fillStyle(pushConfig.visual.color, pushConfig.visual.alpha);
        pushArea.fillRect(0, -pushConfig.width/2, pushConfig.range, pushConfig.width);
        
        // Add to container and rotate
        container.add(pushArea);
        container.rotation = angle;
        
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
        
        // Hit detection for rectangular area
        const dx = target.x - startX;
        const dy = target.y - startY;
        
        // Calculate the projection of the target onto the push direction vector
        const projection = dx * pushDirX + dy * pushDirY;
        
        // Calculate perpendicular distance from the center line
        const perpDist = Math.abs(dx * pushDirY - dy * pushDirX);
        
        // Check if within the rectangle (in front of pusher, within width/2 of center line, within range)
        const hitSuccessful = (projection > 0) && (projection <= pushConfig.range) && (perpDist <= pushConfig.width/2);
        
        if (hitSuccessful && target) {
            // If target is in counter active state, reverse the push!
            if (target.isCounterActive) {
                // Counter the push - reverse direction and push the original pusher back
                this.counterPush(target, pusher, -pushDirX, -pushDirY);
                return;
            }
            
            // If target is winding up for a throw or counter, cancel it
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
    
    // Function to apply a push with visual effects
    applyPush(pusher, target, dirX, dirY, distance) {
        const pushConfig = gameConfig.push;
        
        // Apply push force with tweening for smooth movement
        const targetStartX = target.x;
        const targetStartY = target.y;
        
        // Calculate push destination
        const targetEndX = targetStartX + dirX * distance;
        const targetEndY = targetStartY + dirY * distance;
        
        // Animate the target being pushed
        this.tweens.add({
            targets: [target],
            x: targetEndX,
            y: targetEndY,
            duration: pushConfig.feedback.targetPushDuration,
            ease: 'Power2',
            onComplete: () => {
                if (target && target.indicator) {
                    target.indicator.setFillStyle(originalColor);
                }
            }
        });
    }
    
    // Function to handle counter-push (when active counter counters a push)
    counterPush(defender, attacker, dirX, dirY, flashColor) {
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
                        scale: 2.5,
                        angle: 360,
                        duration: throwConfig.feedback.spinDuration,
                        onComplete: () => {
                            if (thrower && thrower.sprite) {
                                thrower.sprite.setScale(2);
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
                    scale: 2.5,
                    angle: 360,
                    duration: throwConfig.feedback.spinDuration,
                    onComplete: () => {
                        if (target && target.sprite) {
                            target.sprite.setScale(2);
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

    // Function to end the round and display the winner
    endRound(winner, byThrow = false) {
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
            const buttonConfig = gameConfig.ui.buttons;
            const menuButton = this.add.text(400, 250, 'Return to Menu', {
                fontSize: '24px',
                fill: '#FFF',
                backgroundColor: '#0000AA',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5)
              .setInteractive({ useHandCursor: true })
              .on('pointerup', () => {
                  // Cancel all timers and tweens to prevent callbacks firing after scene change
                  this.tweens.killAll();
                  this.time.removeAllEvents();
                  this.scene.start('MenuScene');
              });
        } else {
            // Set up next round after 2 seconds
            this.time.delayedCall(2000, () => {
                this.round++;
                this.roundText.setText(`Round: ${this.round}`);
                this.resetRound();
            });
        }
    }

    // Function to reset players for a new round
    resetRound() {
        // Cancel all active tweens to prevent callbacks firing during or after reset
        this.tweens.killAll();
        
        // Reset player positions
        this.player1.x = 300;
        this.player1.y = 400;
        this.player2.x = 500;
        this.player2.y = 200;
        
        // Reset player states
        this.player1.canMove = true;
        this.player1.sprite.clearTint();
        this.player1.cancelThrow();
        // Reset counter states for player 1
        this.player1.isCounterWindingUp = false;
        this.player1.isCounterActive = false;
        this.player1.counterWindupCircle.setVisible(false);
        this.player1.counterActiveCircle.setVisible(false);
        
        this.player2.canMove = true;
        this.player2.sprite.clearTint();
        this.player2.cancelThrow();
        // Reset counter states for player 2
        this.player2.isCounterWindingUp = false;
        this.player2.isCounterActive = false;
        this.player2.counterWindupCircle.setVisible(false);
        this.player2.counterActiveCircle.setVisible(false);
        
        // Hide winner text
        this.winnerText.setVisible(false);
        
        // Update AI for the new round
        if (this.gameMode === 'singlePlayer' && this.ai) {
            this.ai.newRound(this.round, this.player1Wins, this.player2Wins);
        }
    }
}