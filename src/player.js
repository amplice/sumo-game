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
        if (this.pushCooldown <= 0) {
            this.pushCooldown = 500; // 0.5 second cooldown
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
        
        // Calculate angle between players
        let playerAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        // Convert to 0-360 range
        if (playerAngle < 0) playerAngle += 360;
        
        // Check if within the cone based on the player's direction
        const halfAngle = angle / 2;
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
        
        // Calculate the difference between the angles
        let angleDiff = Math.abs(playerAngle - dirAngle);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // Return true if within the cone
        return angleDiff <= halfAngle;
    }
    
    update(delta) {
        // Update cooldowns
        if (this.pushCooldown > 0) {
            this.pushCooldown -= delta;
        }
    }
}