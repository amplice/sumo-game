import gameConfig from './config/gameConfig';

export default class Player {
    constructor(scene, x, y, spriteKey, color) {
        this.scene = scene;
        
        // Create the main sprite 
        this.sprite = scene.physics.add.sprite(x, y, spriteKey, 'down_idle');
        this.sprite.setScale(gameConfig.player.spriteScale); // Use config value
        this.sprite.body.setCircle(gameConfig.player.hitboxSize / 2, 
            this.sprite.width / 2 - gameConfig.player.hitboxSize / 2,
            this.sprite.height / 2 - gameConfig.player.hitboxSize / 2);
        
        this.direction = 'down';
        this.directionAngle = 0;
        this.color = color;
        
        // Action states
        this.canMove = true;
        this.pushCooldown = 0;
        
        // Throw-related properties
        this.isThrowWindingUp = false;
        this.throwWindupTimer = 0;
        this.throwWindupDuration = gameConfig.throw.windupDuration;
        
        // Counter-related properties
        this.isCounterWindingUp = false;
        this.isCounterActive = false;
        this.counterWindupTimer = 0;
        this.counterActiveTimer = 0;
        this.counterWindupDuration = gameConfig.counter.windupDuration;
        this.counterActiveDuration = gameConfig.counter.activeDuration;
        
        // Visual elements for throw
        const throwVisual = gameConfig.throw.visual;
        this.throwWindupCircle = scene.add.circle(x, y, throwVisual.windupCircleSize, color, throwVisual.windupCircleAlpha);
        this.throwWindupCircle.setVisible(false);
        
        this.throwCone = null; // Will be created when needed
        
        // Visual elements for counter
        const counterVisual = gameConfig.counter.visual;
        this.counterWindupCircle = scene.add.circle(x, y, counterVisual.windupCircleSize, counterVisual.windupCircleColor, counterVisual.windupCircleAlpha);
        this.counterWindupCircle.setVisible(false);
        
        this.counterActiveCircle = scene.add.circle(x, y, counterVisual.activeCircleSize, counterVisual.activeCircleColor, counterVisual.activeCircleAlpha);
        this.counterActiveCircle.setVisible(false);
    }
    
    setVelocity(x, y) {
        this.sprite.setVelocity(x, y);
        
        // Only update animation if not currently playing a special animation (like push or throw)
        if (this.sprite.anims.currentAnim && 
            !this.sprite.anims.currentAnim.repeat && 
            this.sprite.anims.isPlaying &&
            (this.sprite.anims.currentAnim.key.includes('push') || this.sprite.anims.currentAnim.key.includes('throw'))) {
            // Don't interrupt special animations
            return;
        }
        
        // Don't update animation during throw windup - we want to keep the first frame visible
        if (this.isThrowWindingUp) {
            return;
        }
        
        // Update animation based on movement
        if (x === 0 && y === 0) {
            // If not moving, play idle animation
            this.playIdleAnimation();
        } else {
            // If moving, play walk animation for the current direction
            this.playWalkAnimation();
        }
    }
    
    playIdleAnimation() {
        // Skip if in throw windup - we want to keep the first frame visible
        if (this.isThrowWindingUp) {
            return;
        }
        
        // Get base direction and flipping for idle
        const { baseDirection, flipX } = this.getMirroredDirection(this.direction, true);
        
        // Set the correct frame for idle in the current direction
        this.sprite.setFrame(`${baseDirection}_idle`);
        this.sprite.setFlipX(flipX);
    }
    
    // Determine if direction should be mirrored
    getMirroredDirection(direction, isIdle = false) {
        let baseDirection = direction;
        let flipX = false;
        
        // Mirror directions that face left
        switch(direction) {
            case 'left':
                baseDirection = 'right';
                flipX = true;
                break;
            case 'up-left':
                baseDirection = 'up-right';
                flipX = true;
                break;
            case 'down-left':
                baseDirection = 'down-right';
                flipX = true;
                break;
            default:
                // Right-facing directions use original sprites
                break;
        }
        
        return { baseDirection, flipX };
    }
    
    playWalkAnimation() {
        // Skip if in throw windup - we want to keep the first frame visible
        if (this.isThrowWindingUp) {
            return;
        }
        
        // Get base direction and flipping for walking
        const { baseDirection, flipX } = this.getMirroredDirection(this.direction);
        
        const animKey = `${baseDirection}_walk`;
        
        if (this.sprite.anims.currentAnim?.key !== animKey || this.sprite.flipX !== flipX) {
            this.sprite.play(animKey);
            this.sprite.setFlipX(flipX);
        }
    }
    
    playPushAnimation() {
        // Get base direction and flipping for push
        const { baseDirection, flipX } = this.getMirroredDirection(this.direction);
        
        // Set the flip state
        this.sprite.setFlipX(flipX);
        
        // Animation key
        const animKey = `${baseDirection}_push`;
        
        // Force stop any current animations
        this.sprite.anims.stop();
        
        // Stop player movement
        this.sprite.setVelocity(0, 0);
        
        // Prevent movement during animation by disabling movement
        const originalCanMove = this.canMove;
        this.canMove = false;
        
        // Play the animation
        this.sprite.play(animKey);
        
        // Return to idle when animation completes
        this.sprite.once('animationcomplete', () => {
            // Re-enable movement
            this.canMove = originalCanMove;
            
            // Go back to idle since we've stopped the player
            this.playIdleAnimation();
        });
    }
    
    playThrowAnimation() {
        // Get base direction and flipping for throw
        const { baseDirection, flipX } = this.getMirroredDirection(this.direction);
        
        console.log("playThrowAnimation called - frames 1-2");
        
        // Set the flip state
        this.sprite.setFlipX(flipX);
        
        // Create a custom animation key for the throw completion
        const animKey = `${baseDirection}_throw_complete`;
        
        // Check if we need to create this animation
        if (!this.scene.anims.exists(animKey)) {
            // Create a temporary animation that only uses frames 1 and 2
            this.scene.anims.create({
                key: animKey,
                frames: [
                    { key: 'sumo_sprites', frame: `${baseDirection}_throw_1` },
                    { key: 'sumo_sprites', frame: `${baseDirection}_throw_2` }
                ],
                // Set frame rate to 12fps so it completes in about 167ms
                frameRate: 12,
                repeat: 0
            });
            
            console.log(`Created temporary animation: ${animKey}`);
        }
        
        // Force stop any current animations
        this.sprite.anims.stop();
        
        // Play only the completion part of the throw animation
        this.sprite.play(animKey);
        
        console.log("Playing throw animation:", animKey);
    }
    
    updatePosition() {
        // Update throw windup visual if active
        if (this.throwWindupCircle.visible) {
            this.throwWindupCircle.x = this.sprite.x;
            this.throwWindupCircle.y = this.sprite.y;
            
            // Pulsate the windup circle based on timer progress
            const progress = this.throwWindupTimer / this.throwWindupDuration;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
            this.throwWindupCircle.setScale(scale);
        }
        
        // Update counter windup visual if active
        if (this.counterWindupCircle.visible) {
            this.counterWindupCircle.x = this.sprite.x;
            this.counterWindupCircle.y = this.sprite.y;
        }
        
        // Update counter active visual if active
        if (this.counterActiveCircle.visible) {
            this.counterActiveCircle.x = this.sprite.x;
            this.counterActiveCircle.y = this.sprite.y;
        }
    }
    
    setDirection(direction) {
        if (this.direction !== direction) {
            this.direction = direction;
            
            // Set the angle based on direction
            switch(direction) {
                case 'up': this.directionAngle = 0; break;
                case 'up-right': this.directionAngle = 45; break;
                case 'right': this.directionAngle = 90; break;
                case 'down-right': this.directionAngle = 135; break;
                case 'down': this.directionAngle = 180; break;
                case 'down-left': this.directionAngle = 225; break;
                case 'left': this.directionAngle = 270; break;
                case 'up-left': this.directionAngle = 315; break;
            }
            
            // Only update animation if not in throw windup
            if (!this.isThrowWindingUp) {
                // Update the sprite animation
                if (this.sprite.body.velocity.x === 0 && this.sprite.body.velocity.y === 0) {
                    this.playIdleAnimation();
                } else {
                    this.playWalkAnimation();
                }
            } else {
                // If in throw windup, update the first frame of the throw animation
                const { baseDirection, flipX } = this.getMirroredDirection(this.direction);
                this.sprite.setFrame(`${baseDirection}_throw_0`);
                this.sprite.setFlipX(flipX);
            }
        }
    }
    
    get x() {
        return this.sprite.x;
    }
    
    get y() {
        return this.sprite.y;
    }
    
    set x(value) {
        this.sprite.x = value;
        this.updatePosition();
    }
    
    set y(value) {
        this.sprite.y = value;
        this.updatePosition();
    }
    
    // Action methods
    startPush() {
        if (this.pushCooldown <= 0 && !this.isThrowWindingUp) {
            this.pushCooldown = gameConfig.push.cooldown;
            return true;
        }
        return false;
    }
    
    startThrow() {
        // Can only start throw if not already throwing and can move
        if (!this.isThrowWindingUp && this.canMove) {
            this.isThrowWindingUp = true;
            this.throwWindupTimer = 0;
            this.canMove = false; // Prevent movement during windup
            
            // Immediately stop all movement
            this.setVelocity(0, 0);
            
            // Show windup visual
            this.throwWindupCircle.setVisible(true);
            this.throwWindupCircle.setAlpha(gameConfig.throw.visual.windupCircleAlpha);
// Add throw dust effect at the player's feet
const throwDustEffect = this.scene.add.sprite(this.x, this.y + 10, 'throw_attack');
throwDustEffect.setOrigin(0.5, 0);
throwDustEffect.play('throw_attack_anim');

// Remove the sprite when animation completes
throwDustEffect.once('animationcomplete', () => {
    throwDustEffect.destroy();
});
            
            // Get base direction and flipping for throw
            const { baseDirection, flipX } = this.getMirroredDirection(this.direction);
            
            // Set the flip state
            this.sprite.setFlipX(flipX);
            
            // Set the first frame of the throw animation during windup
            this.sprite.anims.stop();
            this.sprite.setFrame(`${baseDirection}_throw_0`);
            
            console.log("Throw windup started - showing first frame:", `${baseDirection}_throw_0`);
            
            return true;
        }
        return false;
    }
    
    // Only used when player is pushed during windup
    cancelThrow() {
        if (this.isThrowWindingUp) {
            this.isThrowWindingUp = false;
            this.throwWindupTimer = 0;
            this.canMove = true;
            this.throwWindupCircle.setVisible(false);
            
            // Clear any throw cone visuals
            if (this.throwCone) {
                this.throwCone.destroy();
                this.throwCone = null;
            }
            
            // Reset to idle animation
            this.playIdleAnimation();
        }
    }
    
    // Start counter windup
    startCounter() {
        // Can only start counter if not already countering, not throwing, and can move
        if (!this.isCounterWindingUp && !this.isCounterActive && !this.isThrowWindingUp && this.canMove) {
            this.isCounterWindingUp = true;
            this.counterWindupTimer = 0;
            this.canMove = false; // Prevent movement during counter windup
            
            // Immediately stop all movement
            this.setVelocity(0, 0);
            
            const counterVisual = gameConfig.counter.visual;
            
            // Show counter windup visual
            this.counterWindupCircle.setVisible(true);
            this.counterWindupCircle.setAlpha(counterVisual.windupCircleAlpha);

            // Add counter windup effect at the player's feet
const counterWindupEffect = this.scene.add.sprite(this.x, this.y+5 , 'counter_windup');
counterWindupEffect.setOrigin(0.5, 0);
counterWindupEffect.play('counter_windup_anim');

// Remove the sprite when animation completes
counterWindupEffect.once('animationcomplete', () => {
    counterWindupEffect.destroy();
});
            
            // Create a pulsing effect around the player during counter windup
            const pulseEffect = this.scene.add.circle(
                this.x, 
                this.y, 
                counterVisual.pulseSize, 
                counterVisual.pulseColor, 
                counterVisual.pulseAlpha
            );
            
            this.scene.tweens.add({
                targets: pulseEffect,
                scale: counterVisual.pulseScale,
                alpha: 0,
                duration: this.counterWindupDuration,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    // Keep the pulse centered on the player as they move
                    pulseEffect.x = this.x;
                    pulseEffect.y = this.y;
                },
                onComplete: () => {
                    pulseEffect.destroy();
                }
            });
            
            return true;
        }
        return false;
    }
    
    // Cancel counter (used when pushed during windup)
    cancelCounter() {
        if (this.isCounterWindingUp) {
            this.isCounterWindingUp = false;
            this.counterWindupTimer = 0;
            this.canMove = true;
            this.counterWindupCircle.setVisible(false);
        }
    }
    
    // Activate counter (called after windup completes)
    activateCounter() {
        if (this.isCounterWindingUp) {
            this.isCounterWindingUp = false;
            this.isCounterActive = true;
            this.counterActiveTimer = 0;
            this.canMove = false; // Still can't move during active counter
            
            // Ensure velocity is still zero when counter activates
            this.setVelocity(0, 0);
            
            // Hide windup visual and show active visual
            this.counterWindupCircle.setVisible(false);
            this.counterActiveCircle.setVisible(true);
            
            return true;
        }
        return false;
    }
    
    // End counter (called when active period ends)
    endCounter() {
        if (this.isCounterActive) {
            this.isCounterActive = false;
            this.counterActiveTimer = 0;
            this.canMove = true;
            this.counterActiveCircle.setVisible(false);
        }
    }
    
    executeThrow() {
        // Execute the throw (will be called automatically after windup)
        if (this.isThrowWindingUp) {
            // Change state variables
            this.isThrowWindingUp = false;
            this.canMove = true;
            this.throwWindupCircle.setVisible(false);
            
            console.log("executeThrow - Throw execution (animation already playing)");
            
            // Note: We no longer need to start the animation here as it was
            // already started at ~72% of the windup time
            
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
            const dirVector = directionVectors[this.direction];

            // Calculate position for throw end effect - a bit further out than the player
const effectDistance = 60; // Distance from player center
const effectX = this.x + (dirVector.x * effectDistance);
const effectY = this.y + (dirVector.y * effectDistance);
// Calculate angle based on direction
const angle = Math.atan2(dirVector.y, dirVector.x) * (180 / Math.PI); // Add 90 degrees because sprite is north-facing by default

// Create the throw end effect sprite
const throwEndEffect = this.scene.add.sprite(effectX, effectY, 'throw_end');
throwEndEffect.setOrigin(0.5, 0.5);
throwEndEffect.angle = angle; // Rotate to match throw direction
throwEndEffect.setScale(1.3); // Make it a bit larger

// Play the throw end animation
throwEndEffect.play('throw_end_anim');

// Remove the sprite when animation completes
throwEndEffect.once('animationcomplete', () => {
    throwEndEffect.destroy();
});
            
            // Create a cone graphic for throw area
            if (this.throwCone) {
                this.throwCone.destroy();
            }
            
            const throwConfig = gameConfig.throw;
            const visual = throwConfig.visual;
            
            // Create a new cone graphic
            this.throwCone = this.scene.add.graphics();
            this.throwCone.fillStyle(visual.color, visual.alpha);
            
            // Draw cone shape with exact angle from config
            const startX = this.x;
            const startY = this.y;
            const coneLength = throwConfig.coneSize.length;
            
            // Calculate unit vector perpendicular to direction
            const perpX = -dirVector.y;
            const perpY = dirVector.x;
            
            // Cone width at maximum distance
            const halfConeWidth = coneLength * throwConfig.coneSize.halfAngleTangent;
            
            // Draw the cone
            this.throwCone.beginPath();
            this.throwCone.moveTo(startX, startY);
            
            // Create smooth arc for the cone edge
            const steps = throwConfig.coneSize.steps;
            
            // Left half of the cone
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = startX + dirVector.x * coneLength * t + perpX * halfConeWidth * t;
                const y = startY + dirVector.y * coneLength * t + perpY * halfConeWidth * t;
                this.throwCone.lineTo(x, y);
            }
            
            // Right half of the cone
            for (let i = steps; i >= 0; i--) {
                const t = i / steps;
                const x = startX + dirVector.x * coneLength * t - perpX * halfConeWidth * t;
                const y = startY + dirVector.y * coneLength * t - perpY * halfConeWidth * t;
                this.throwCone.lineTo(x, y);
            }
            
            this.throwCone.closePath();
            this.throwCone.fillPath();
            
            // Add outline to make the range more visible
            this.throwCone.lineStyle(visual.borderWidth, visual.borderColor, visual.alpha);
            this.throwCone.strokePath();
            
            // Animate the cone fading out
            this.scene.tweens.add({
                targets: this.throwCone,
                alpha: 0,
                duration: visual.fadeOutDuration,
                onComplete: () => {
                    if (this.throwCone && this.throwCone.active) {
                        this.throwCone.destroy();
                        this.throwCone = null;
                    }
                }
            });
            
            // Signal to scene that throw is executed
            return true;
        }
        return false;
    }
    
    isInCone(other, angle, distance) {
        // Calculate distance between players
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const playerDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if within range
        if (playerDistance > distance) {
            return false;
        }
        
        // Direction to angle mapping
        const directionToAngle = {
            'up': 270,
            'up-right': 315,
            'right': 0,
            'down-right': 45,
            'down': 90,
            'down-left': 135,
            'left': 180,
            'up-left': 225
        };
        
        // Get the current direction's angle
        const dirAngle = directionToAngle[this.direction];
        
        // Calculate angle between players in degrees
        let playerAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Convert to 0-360 range
        if (playerAngle < 0) playerAngle += 360;
        
        // Calculate the difference between the angles
        let angleDiff = Math.abs(playerAngle - dirAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // Return true if within the cone
        return angleDiff <= angle / 2;
    }
    
    /**
     * Update method called every frame
     * @param {number} delta - Time since last frame
     */
    update(delta) {
        // Update cooldowns
        if (this.pushCooldown > 0) {
            this.pushCooldown -= delta;
        }
        
        // Update throw windup timer
        if (this.isThrowWindingUp) {
            this.throwWindupTimer += delta;
            
            // Ensure velocity remains at zero during windup
            this.setVelocity(0, 0);
            
            // Update windup circle size proportional to progress
            const progress = Math.min(this.throwWindupTimer / this.throwWindupDuration, 1);
            this.throwWindupCircle.setScale(progress * 1.5);
            
            // Start playing frames 1-2 at 72.2% of windup (for 12fps)
            if (progress > 0.74 && !this.sprite.anims.isPlaying) {
                this.playThrowAnimation();
            }
        }
        
        // Update counter windup timer
        if (this.isCounterWindingUp) {
            this.counterWindupTimer += delta;
            
            // Ensure velocity remains at zero during counter windup
            this.setVelocity(0, 0);
            
            const counterFeedback = gameConfig.counter.feedback;
            const progress = Math.min(this.counterWindupTimer / this.counterWindupDuration, 1);
            
            // Update windup circle size proportional to progress
            this.counterWindupCircle.setScale(progress * 1.5);
            
            // Color shift from white to yellow as the counter charge progresses
            const colorProgress = Math.min(this.counterWindupTimer / this.counterWindupDuration, 1);
            const r = 255;
            const g = 255;
            const b = Math.floor(255 * (1 - colorProgress));
            this.counterWindupCircle.fillColor = Phaser.Display.Color.GetColor(r, g, b);
            
            // If windup is complete, activate the counter
            if (this.counterWindupTimer >= this.counterWindupDuration) {
                this.activateCounter();
            }
        }
        
        // Update counter active timer
        if (this.isCounterActive) {
            this.counterActiveTimer += delta;
            
            // Ensure velocity remains at zero during active counter
            this.setVelocity(0, 0);
            
            const counterFeedback = gameConfig.counter.feedback;
            
            // Pulsate the active counter circle
            const pulsateProgress = (this.counterActiveTimer % counterFeedback.pulsateCycleTime) / 
                                   counterFeedback.pulsateCycleTime;
            const pulsateScale = 1 + Math.sin(pulsateProgress * Math.PI * 2) * 
                                counterFeedback.activePulsateSpeed;
            this.counterActiveCircle.setScale(pulsateScale);
            
            // End counter when active period is over
            if (this.counterActiveTimer >= this.counterActiveDuration) {
                this.endCounter();
            }
        }
        
        // Only update animation if not currently playing a non-looping animation
        // This prevents animation interruptions during push and throw actions
        if (this.sprite.anims.currentAnim && 
            !this.sprite.anims.currentAnim.repeat && 
            this.sprite.anims.isPlaying &&
            (this.sprite.anims.currentAnim.key.includes('push') || this.sprite.anims.currentAnim.key.includes('throw'))) {
            // Animation is playing and non-looping (push or throw) - don't interrupt
            return;
        }
        
        // Skip animation updates during throw windup
        if (this.isThrowWindingUp) {
            return;
        }
        
        // Update animation based on movement if no special animation is playing
        if (this.sprite.body.velocity.x === 0 && this.sprite.body.velocity.y === 0) {
            // Only switch to idle if we're not playing any other animation
            if (!this.sprite.anims.isPlaying) {
                this.playIdleAnimation();
            }
        } else {
            // Only update walk animation if we're actually moving
            this.playWalkAnimation();
        }
    }
}