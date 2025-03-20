export default class Player {
    constructor(scene, x, y, sprite, color) {
        this.scene = scene;
        
        // Create invisible physics body with circle hitbox
        this.sprite = scene.physics.add.sprite(x, y, sprite);
        this.sprite.setVisible(false);
        this.sprite.setScale(0.3);
        this.sprite.body.setCircle(15); // Circle hitbox
        
        this.direction = 'down';
        this.directionAngle = 0;
        
        // Main circle visual
        this.circle = scene.add.circle(x, y, 10, color);
        
        // Small direction indicator triangle
        this.indicator = scene.add.triangle(
            x, y + 10, // Position slightly offset from circle center
            -4, -3,
            4, -3,
            0, 6,
            0x000000 // Black triangle
        );
        
        // Action states
        this.canMove = true;
        this.pushCooldown = 0;
        
        // Throw-related properties
        this.isThrowWindingUp = false;
        this.throwWindupTimer = 0;
        this.throwWindupDuration = 1000; // 1 second wind-up
        
        // Visual elements for throw
        this.throwWindupCircle = scene.add.circle(x, y, 15, color, 0.3);
        this.throwWindupCircle.setVisible(false);
        
        this.throwCone = null; // Will be created when needed
        
        this.updateIndicator();
    }
    
    setVelocity(x, y) {
        this.sprite.setVelocity(x, y);
    }
    
    updatePosition() {
        // Update visual elements to follow the sprite
        this.circle.x = this.sprite.x;
        this.circle.y = this.sprite.y;
        this.updateIndicator();
        
        // Update throw windup visual if active
        if (this.throwWindupCircle.visible) {
            this.throwWindupCircle.x = this.sprite.x;
            this.throwWindupCircle.y = this.sprite.y;
            
            // Pulsate the windup circle based on timer progress
            const progress = this.throwWindupTimer / this.throwWindupDuration;
            const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
            this.throwWindupCircle.setScale(scale);
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
            
            this.updateIndicator();
        }
    }
    
    updateIndicator() {
        // Calculate position on the edge of the circle
        const radians = Phaser.Math.DegToRad(this.directionAngle);
        const distance = 10; // Distance from center to indicator
        
        this.indicator.x = this.sprite.x + Math.sin(radians) * distance;
        this.indicator.y = this.sprite.y + Math.cos(radians) * distance;
        this.indicator.rotation = radians;
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
            this.pushCooldown = 500; // 0.5 second cooldown
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
            
            // Show windup visual
            this.throwWindupCircle.setVisible(true);
            this.throwWindupCircle.setAlpha(0.3);
            
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
        }
    }
    
    executeThrow() {
        // Execute the throw (will be called automatically after windup)
        if (this.isThrowWindingUp) {
            this.isThrowWindingUp = false;
            this.canMove = true;
            this.throwWindupCircle.setVisible(false);
            
            // Calculate correct angles based on direction
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
            
            const directionAngle = directionToAngle[this.direction];
            const radians = Phaser.Math.DegToRad(directionAngle);
            
            // Create a cone graphic for throw area
            if (this.throwCone) {
                this.throwCone.destroy();
            }
            
            // Create a new cone graphic
            this.throwCone = this.scene.add.graphics();
            this.throwCone.fillStyle(0xFF8800, 0.5);
            
            // Draw cone shape - match actual hitbox dimensions
            const coneLength = 100; // Exact hitbox range
            const coneAngle = 45; // 45 degree cone (matches hitbox)
            const halfConeAngle = coneAngle / 2;
            
            // Starting point
            const startX = this.x;
            const startY = this.y;
            
            // Calculate the angles for the cone edges in radians
            const leftAngleRad = radians - Phaser.Math.DegToRad(halfConeAngle);
            const rightAngleRad = radians + Phaser.Math.DegToRad(halfConeAngle);
            
            // Draw a triangle for the cone
            this.throwCone.beginPath();
            this.throwCone.moveTo(startX, startY);
            
            // Calculate end points on the arc
            const endLeftX = startX + Math.cos(leftAngleRad) * coneLength;
            const endLeftY = startY + Math.sin(leftAngleRad) * coneLength;
            
            const endRightX = startX + Math.cos(rightAngleRad) * coneLength;
            const endRightY = startY + Math.sin(rightAngleRad) * coneLength;
            
            // Draw an arc between the two points
            this.throwCone.lineTo(endLeftX, endLeftY);
            
            // Draw points along the arc for a smoother curve
            const steps = 10;
            for (let i = 1; i < steps; i++) {
                const arcAngle = leftAngleRad + (rightAngleRad - leftAngleRad) * (i / steps);
                const arcX = startX + Math.cos(arcAngle) * coneLength;
                const arcY = startY + Math.sin(arcAngle) * coneLength;
                this.throwCone.lineTo(arcX, arcY);
            }
            
            this.throwCone.lineTo(endRightX, endRightY);
            this.throwCone.lineTo(startX, startY);
            this.throwCone.closePath();
            this.throwCone.fillPath();
            
            // Add outline
            this.throwCone.lineStyle(2, 0xFF5500, 0.8);
            this.throwCone.strokePath();
            
            // Animate the cone fading out
            this.scene.tweens.add({
                targets: this.throwCone,
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    this.throwCone.destroy();
                    this.throwCone = null;
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
    
    update(delta) {
        // Update cooldowns
        if (this.pushCooldown > 0) {
            this.pushCooldown -= delta;
        }
        
        // Update throw windup timer
        if (this.isThrowWindingUp) {
            this.throwWindupTimer += delta;
            
            // Pulsate the player during windup
            const pulsateProgress = (this.throwWindupTimer % 500) / 500;
            const pulsateScale = 1 + Math.sin(pulsateProgress * Math.PI * 2) * 0.2;
            this.indicator.setScale(pulsateScale);
            
            // Update windup circle size proportional to progress
            const progress = Math.min(this.throwWindupTimer / this.throwWindupDuration, 1);
            this.throwWindupCircle.setScale(progress * 1.5);
        }
    }
}