import Player from '../player';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.gameMode = data.mode || 'twoPlayer';
        this.round = 1;
        this.player1Wins = 0;
        this.player2Wins = 0;
    }

    create() {
        // Create the ring (circular boundary)
        this.ringRadius = 250;
        this.ringCenter = { x: 400, y: 300 };
        const ring = this.add.circle(this.ringCenter.x, this.ringCenter.y, this.ringRadius, 0xCCCCCC);
        ring.setStrokeStyle(4, 0x000000);
        
        // Add players to the scene
        this.player1 = new Player(this, 300, 400, 'player1', 0x0000FF);
        this.player2 = new Player(this, 500, 200, 'player2', 0xFF0000);
        
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
        this.roundText = this.add.text(20, 20, 'Round: 1', { fontSize: '24px', fill: '#FFF' });
        this.scoreText = this.add.text(20, 50, 'P1: 0  P2: 0', { fontSize: '24px', fill: '#FFF' });
        this.winnerText = this.add.text(400, 150, '', { fontSize: '32px', fill: '#FFF', align: 'center' })
            .setOrigin(0.5, 0.5)
            .setVisible(false);
        
        // Add pause button
        this.pauseButton = this.add.text(750, 20, 'MENU', { fontSize: '20px', fill: '#FFF' })
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.scene.start('MenuScene');
            });
            
        // Set AI timer if in single player mode
        if (this.gameMode === 'singlePlayer') {
            this.aiActionTime = 0;
        }
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
                this.updateAI(delta);
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
                this.time.delayedCall(this.player1.throwWindupDuration, () => {
                    // Execute the throw AND check for hit in the same callback
                    if (this.player1.isThrowWindingUp) {  // Check if still winding up (not canceled by push)
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
                    this.time.delayedCall(this.player2.throwWindupDuration, () => {
                        if (this.player2.isThrowWindingUp) {  // Check if still winding up (not canceled by push)
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

    // Function to update AI player (Player 2 in single player mode)
    updateAI(delta) {
        if (this.gameMode !== 'singlePlayer' || !this.player2.canMove) return;
        
        // AI movement - move toward player but with strategy
        const dx = this.player1.x - this.player2.x;
        const dy = this.player1.y - this.player2.y;
        const distToPlayer = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate distance to ring edge for opponent
        const p1ToCenter = {
            x: this.player1.x - this.ringCenter.x,
            y: this.player1.y - this.ringCenter.y
        };
        const p1DistanceToCenter = Math.sqrt(p1ToCenter.x * p1ToCenter.x + p1ToCenter.y * p1ToCenter.y);
        const p1DistanceToEdge = this.ringRadius - p1DistanceToCenter;
        
        // AI strategy based on opponent's position
        const isPlayerNearEdge = p1DistanceToEdge < 50;
        
        // Normalized direction to player
        let nx = dx / distToPlayer;
        let ny = dy / distToPlayer;
        
        // Direction for movement
        let moveX = 0;
        let moveY = 0;
        
        // Choose AI strategy
        if (isPlayerNearEdge) {
            // If player is near edge, move to push them out
            moveX = nx;
            moveY = ny;
        } else if (distToPlayer < 100) {
            // If close to player, maybe back off to prepare a throw
            moveX = -nx;
            moveY = -ny;
        } else {
            // General approach
            moveX = nx;
            moveY = ny;
        }
        
        // Set AI movement based on direction
        let direction = '';
        if (moveY < -0.5) direction = 'up';
        else if (moveY > 0.5) direction = 'down';
        
        if (moveX < -0.5) {
            direction = direction ? direction + '-left' : 'left';
        } else if (moveX > 0.5) {
            direction = direction ? direction + '-right' : 'right';
        }
        
        if (direction) {
            this.player2.setDirection(direction);
        }
        
        // Apply movement
        const speed = 180; // Slightly slower than player for balance
        this.player2.setVelocity(moveX * speed, moveY * speed);
        
        // AI Actions
        this.aiActionTime -= delta;
        if (this.aiActionTime <= 0) {
            // Reset action timer with random interval
            this.aiActionTime = 500 + Math.random() * 1000;
            
            // Choose an action based on situation
            if (distToPlayer < 100) {
                // If player is near edge, more likely to push
                const pushChance = isPlayerNearEdge ? 0.7 : 0.4;
                const throwChance = isPlayerNearEdge ? 0.2 : 0.3;
                const counterChance = 0.2; // 20% chance to counter
                
                const randomAction = Math.random();
                
                // If player is attempting to throw, higher chance to counter
                if (this.player1.isThrowWindingUp && Math.random() < 0.7) {
                    if (this.player2.startCounter()) {
                        // Counter will activate automatically after windup
                    }
                }
                // Otherwise, use normal action probabilities
                else if (randomAction < pushChance) {
                    if (this.player2.startPush()) {
                        this.attemptPush(this.player2, this.player1);
                    }
                } else if (randomAction < pushChance + throwChance) {
                    // Try to throw if aligned with player
                    if (this.player2.isInCone(this.player1, 45, 100)) {
                        if (this.player2.startThrow()) {
                            // The throw will execute automatically after windup
                            this.time.delayedCall(this.player2.throwWindupDuration, () => {
                                // Check if still winding up (not canceled by push)
                                if (this.player2.isThrowWindingUp) {
                                    this.player2.executeThrow();
                                    this.attemptThrow(this.player2, this.player1);
                                }
                            });
                        }
                    }
                } else if (randomAction < pushChance + throwChance + counterChance) {
                    // Try to counter
                    if (this.player2.startCounter()) {
                        // Counter will activate automatically after windup
                    }
                }
            }
        }
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
    
    // Visual feedback for pusher - highlight the triangle
    this.tweens.add({
        targets: pusher.indicator,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 100,
        yoyo: true
    });
    
    // Create rectangle push area instead of cone
    const startX = pusher.x;
    const startY = pusher.y;
    const angle = Math.atan2(pushDirY, pushDirX);
    
    // Parameters for the push rectangle
    const pushDistance = 70;  // Shorter detection range
    const pushWidth = 40;     // Width of push area
    
    // Use a container with a rectangle for rotation
    const container = this.add.container(startX, startY);
    
    // Create a rectangle for push area, centered properly
    const pushArea = this.add.graphics();
    pushArea.fillStyle(0x00FF00, 0.3);
    pushArea.fillRect(0, -pushWidth/2, pushDistance, pushWidth);
    
    // Add to container and rotate
    container.add(pushArea);
    container.rotation = angle;
    
    // Animate the push effect
    this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            container.destroy();
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
    const hitSuccessful = (projection > 0) && (projection <= pushDistance) && (perpDist <= pushWidth/2);
    
    if (hitSuccessful) {
        // If target is winding up for a throw or counter, cancel it
        if (target.isThrowWindingUp) {
            target.cancelThrow();
        }
        if (target.isCounterWindingUp) {
            target.cancelCounter();
        }
        
        // Hit successful! Show impact effect
        this.tweens.add({
            targets: target.indicator,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 50,
            yoyo: true,
            repeat: 2
        });
        
        // Make target's triangle flash red
        const originalColor = target.indicator.fillColor;
        target.indicator.setFillStyle(0xFF0000);
        
        // Apply push force with tweening for smooth movement
        const targetStartX = target.x;
        const targetStartY = target.y;
        
        // Determine push distance - extra far if target is countering
        const pushDistance = (target.isCounterActive) ? 200 : 100;
        
        // Calculate push destination
        const targetEndX = targetStartX + pushDirX * pushDistance;
        const targetEndY = targetStartY + pushDirY * pushDistance;
        
        // If target is countering, add a visual effect to show the extra push
        if (target.isCounterActive) {
            // Create a trail effect behind the pushed player
            const trail = this.add.graphics();
            trail.fillStyle(0xFF6600, 0.6);
            trail.fillCircle(target.x, target.y, 12);
            
            // Fade out the trail
            this.tweens.add({
                targets: trail,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    trail.destroy();
                }
            });
        }
        
        // Animate the target being pushed
        this.tweens.add({
            targets: [target],
            x: targetEndX,
            y: targetEndY,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                target.indicator.setFillStyle(originalColor);
            }
        });
    }
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
    
    // Get direction vector
    const dirVector = directionVectors[thrower.direction];
    
    // Calculate dx/dy and distance
    const dx = target.x - thrower.x;
    const dy = target.y - thrower.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Maximum throw range - match the visual cone size
    const maxThrowRange = 100;
    
    // Skip if too far away
    if (distance > maxThrowRange) {
        return false;
    }
    
    // Normalize the vector to target
    const targetVector = {
        x: dx / distance,
        y: dy / distance
    };
    
    // Calculate dot product (measures how aligned the vectors are)
    const dotProduct = dirVector.x * targetVector.x + dirVector.y * targetVector.y;
    
    // Define cone angle - use 0.7071 for approx 45 degrees (cos(45°) = 0.7071)
    const coneAngleCosine = 0.7071;
    
    // Check if within the throw cone (cos(angle) > 0.7071 means angle < 45 degrees)
    if (dotProduct > coneAngleCosine) {
        // Check if target is currently in counter active state
        if (target.isCounterActive) {
            // Counter successful! Reverse the throw - target counters thrower
            
            // Visual effect for counter - bright flash around target
            const counterFlash = this.add.circle(target.x, target.y, 30, 0xFFFF00, 0.7);
            
            // Flash and expand
            this.tweens.add({
                targets: counterFlash,
                scale: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    counterFlash.destroy();
                }
            });
            
            // Create lightning effect between players
            const lightning = this.add.graphics();
            lightning.lineStyle(5, 0xFFFF00, 1);
            
            // Zigzag line for lightning effect
            const segments = 6;
            const points = [];
            points.push({ x: target.x, y: target.y });
            
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const midX = target.x + (thrower.x - target.x) * t;
                const midY = target.y + (thrower.y - target.y) * t;
                const offset = 15 * (Math.random() > 0.5 ? 1 : -1) * (1 - t);
                
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
                duration: 600,
                onComplete: () => {
                    lightning.destroy();
                }
            });
            
            // End the counter state
            target.endCounter();
            
            // Make thrower spin to show being thrown
            this.tweens.add({
                targets: thrower.circle,
                scale: 1.3,
                angle: 360,
                duration: 500,
                onComplete: () => {
                    thrower.circle.setScale(1);
                    thrower.circle.angle = 0;
                    
                    // End round with counter victory
                    const winner = target === this.player1 ? 'Player 1' : 'Player 2';
                    this.endRound(winner, true);
                }
            });
            
            return true;
        }
        
        // Normal throw (no counter) - create a throwing animation
        // Make the thrower flash
        this.tweens.add({
            targets: thrower.circle,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
        
        // Make target spin to show being thrown
        this.tweens.add({
            targets: target.circle,
            scale: 1.3,
            angle: 360,
            duration: 500,
            onComplete: () => {
                target.circle.setScale(1);
                target.circle.angle = 0;
                
                // End round with throw victory
                this.endRound(thrower === this.player1 ? 'Player 1' : 'Player 2', true);
            }
        });
        
        // Display throw effect line between players
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xFF8800, 1);
        graphics.lineBetween(thrower.x, thrower.y, target.x, target.y);
        
        // Fade out the line
        this.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                graphics.destroy();
            }
        });
        
        return true;
    }
    
    return false;
}

// Function to handle player movement
handlePlayerMovement(player, up, down, left, right) {
    const speed = 200;
    let movingX = false;
    let movingY = false;
    let direction = player.direction;
    
    // Always start with velocity set to zero
    player.setVelocity(0, 0);
    
    // Handle Y-axis movement
    if (up) {
        player.setVelocity(0, -speed);
        direction = 'up';
        movingY = true;
    } else if (down) {
        player.setVelocity(0, speed);
        direction = 'down';
        movingY = true;
    }
    
    // Handle X-axis movement
    if (left) {
        player.setVelocity(-speed, 0);
        direction = 'left';
        movingX = true;
    } else if (right) {
        player.setVelocity(speed, 0);
        direction = 'right';
        movingX = true;
    }
    
    // Handle diagonal movement
    if (movingX && movingY) {
        // Calculate normalized diagonal velocity (speed * 0.707)
        const diagonalSpeed = speed * 0.707;
        
        if (up && left) {
            player.setVelocity(-diagonalSpeed, -diagonalSpeed);
            direction = 'up-left';
        } else if (up && right) {
            player.setVelocity(diagonalSpeed, -diagonalSpeed);
            direction = 'up-right';
        } else if (down && left) {
            player.setVelocity(-diagonalSpeed, diagonalSpeed);
            direction = 'down-left';
        } else if (down && right) {
            player.setVelocity(diagonalSpeed, diagonalSpeed);
            direction = 'down-right';
        }
    }
    
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
    return distance > ringRadius - 15;  // 15 is approximate player radius
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
        const menuButton = this.add.text(400, 250, 'Return to Menu', {
            fontSize: '24px',
            fill: '#FFF',
            backgroundColor: '#0000AA',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => {
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
    
    // Reset AI timer if needed
    if (this.gameMode === 'singlePlayer') {
        this.aiActionTime = 1000;
    }
}
}