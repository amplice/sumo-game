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
            
            // Player 2 actions
            p2Push: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO)
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
                const pushChance = isPlayerNearEdge ? 0.8 : 0.5;
                
                if (Math.random() < pushChance) {
                    if (this.player2.startPush()) {
                        this.attemptPush(this.player2, this.player1);
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
        
        // Create push line and arc to show push area
        const startX = pusher.x;
        const startY = pusher.y;
        const endX = startX + pushDirX * 80;
        const endY = startY + pushDirY * 80;
        
        // Calculate angle for the cone
        const angle = Math.atan2(pushDirY, pushDirX);
        
        // Create cone to show push range - centered properly on the player
        const pushCone = this.add.graphics();
        pushCone.fillStyle(0x00FF00, 0.3);
        pushCone.beginPath();
        pushCone.moveTo(startX, startY);
        
        // Draw arc to show 30 degree push cone
        const radius = 100; // Push range
        // Convert 30 degrees to radians: 30 * (Math.PI/180) = Math.PI/6
        pushCone.arc(startX, startY, radius, angle - Math.PI/6, angle + Math.PI/6, false);
        pushCone.closePath();
        pushCone.fillPath();
        
        // Animate the push effect
        this.tweens.add({
            targets: pushCone,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                pushCone.destroy();
            }
        });
        
        // Improved hit detection that matches the visual cone
        // Check if target is actually within the cone area
        const dx = target.x - startX;
        const dy = target.y - startY;
        
        // Calculate distance to target
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate angle between pusher's direction and target
        const targetAngle = Math.atan2(dy, dx);
        
        // Find the difference between angles (normalized to -PI to PI)
        let angleDiff = targetAngle - angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // Check if within cone angle (30 degrees = PI/6 radians) and range
        const hitSuccessful = (Math.abs(angleDiff) <= Math.PI/6) && (distToTarget <= radius);
        
        if (hitSuccessful) {
            // Hit successful! Show impact effect
            // Visual feedback for target - highlight and shake the triangle
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
            const targetEndX = targetStartX + pushDirX * 100;
            const targetEndY = targetStartY + pushDirY * 100;
            
            // Animate the target being pushed
            this.tweens.add({
                targets: [target],
                x: targetEndX,
                y: targetEndY,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // Restore original color after push animation completes
                    target.indicator.setFillStyle(originalColor);
                }
            });
        }
    }

    // Function to attempt a throw
    attemptThrow(thrower, target) {
        // Check if target is within the throw cone (45 degree angle)
        if (thrower.isInCone(target, 45, 120)) {
            // Check if target is in counter mode
            if (target.counterActive) {
                // If countering, target throws the thrower instead
                this.endRound(target === this.player1 ? 'Player 1' : 'Player 2', true);
            } else {
                // Successful throw
                this.endRound(thrower === this.player1 ? 'Player 1' : 'Player 2', true);
            }
        }
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
    endRound(winner) {
        // Update win counts
        if (winner === 'Player 1') {
            this.player1Wins++;
        } else {
            this.player2Wins++;
        }
        
        // Update score text
        this.scoreText.setText(`P1: ${this.player1Wins}  P2: ${this.player2Wins}`);
        
        // Display winner
        this.winnerText.setText(`${winner} wins round ${this.round}!\n(pushed opponent out)`);
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
        
        this.player2.canMove = true;
        this.player2.sprite.clearTint();
        
        // Hide winner text
        this.winnerText.setVisible(false);
        
        // Reset AI timer if needed
        if (this.gameMode === 'singlePlayer') {
            this.aiActionTime = 1000;
        }
    }
}