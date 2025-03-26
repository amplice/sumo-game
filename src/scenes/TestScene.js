import Phaser from 'phaser';
import gameConfig from '../config/gameConfig';

export default class TestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TestScene' });
    }

    preload() {
        // Load the sprite sheet and atlas
        this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');

        // Debug atlas loading
        this.load.on('complete', () => {
            console.log("Atlas loaded, checking frames...");
            const atlas = this.textures.get('sumo_sprites');
            const frames = atlas.getFrameNames();
            console.log("Available frames:", frames);
            
            // Check for specific push frames
            const pushFrames = ['down_push_0', 'right_push_0', 'up_push_0', 'down-right_push_0', 'up-right_push_0'];
            console.log("Push frames exist:", pushFrames.map(frame => ({
                frame,
                exists: frames.includes(frame)
            })));
        });
    }

    create() {
        // Add a dark background for larger canvas
        this.add.rectangle(0, 0, 1024, 768, 0x222222).setOrigin(0, 0);
        
        // Add title
        this.add.text(1024/2, 30, 'ANIMATION TEST', {
            fontSize: '32px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
        }).setOrigin(0.5);
        
        // Create all animations
        this.createAnimations();
        
        // Add sprites to test different animations
        const spacing = 180; // Wider spacing for larger canvas
        const startY = 200;
        
        // Test 1: Direction animations test sprites
        this.sprites = [];
        
        // Add a row of sprites for each direction - using only available frames
        const directions = ['down', 'right', 'up', 'down-right', 'up-right'];
        directions.forEach((dir, index) => {
            // Create sprite
            const x = spacing + (index * spacing);
            const sprite = this.add.sprite(x, startY, 'sumo_sprites', `${dir}_idle`)
                .setScale(gameConfig.player.spriteScale);
            
            // Add label
            this.add.text(x, startY - 50, dir, {
                fontSize: '16px',
                fill: '#FFFFFF',
            }).setOrigin(0.5);
            
            // Add button to play push animation
            const button = this.add.text(x, startY + 80, 'Play Push', {
                fontSize: '14px',
                fill: '#FFFFFF',
                backgroundColor: '#0000AA',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            button.on('pointerup', () => {
                console.log(`Playing ${dir}_push animation`);
                sprite.play(`${dir}_push`);
            });
            
            // Add button to play walk animation
            const walkButton = this.add.text(x, startY + 120, 'Play Walk', {
                fontSize: '14px',
                fill: '#FFFFFF',
                backgroundColor: '#00AA00',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            walkButton.on('pointerup', () => {
                console.log(`Playing ${dir}_walk animation`);
                sprite.play(`${dir}_walk`);
            });
            
            // Add button to reset to idle
            const idleButton = this.add.text(x, startY + 160, 'Reset Idle', {
                fontSize: '14px',
                fill: '#FFFFFF',
                backgroundColor: '#AA0000',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            
            idleButton.on('pointerup', () => {
                console.log(`Resetting to ${dir}_idle`);
                sprite.anims.stop();
                sprite.setTexture('sumo_sprites', `${dir}_idle`);
            });
            
            // Store sprite for later use
            this.sprites.push({ sprite, direction: dir });
        });
        
        // Add button to play all push animations
        const playAllButton = this.add.text(1024/2, 500, 'Play All Push Animations', {
            fontSize: '18px',
            fill: '#FFFFFF',
            backgroundColor: '#AA0000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        playAllButton.on('pointerup', () => {
            this.sprites.forEach(({ sprite, direction }) => {
                console.log(`Playing ${direction}_push animation on all sprites`);
                sprite.play(`${direction}_push`);
            });
        });
        
        // Add a back button
        const backButton = this.add.text(1024/2, 600, 'Back to Menu', {
            fontSize: '18px',
            fill: '#FFFFFF',
            backgroundColor: '#555555',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        backButton.on('pointerup', () => {
            this.scene.start('MenuScene');
        });
        
        // Add animation completion listener
        this.sprites.forEach(({ sprite, direction }) => {
            sprite.on('animationcomplete', (anim) => {
                console.log(`Animation ${anim.key} completed`);
                // Return to idle
                if (anim.key.includes('push')) {
                    sprite.setTexture('sumo_sprites', `${direction}_idle`);
                }
            });
        });
    }
    
    createAnimations() {
        console.log("Creating animations...");
        
        // Create walk animations for available directions
        const directions = ['down', 'right', 'up', 'down-right', 'up-right'];
        
        directions.forEach(dir => {
            // Walk animations
            this.anims.create({
                key: `${dir}_walk`,
                frames: [
                    { key: 'sumo_sprites', frame: `${dir}_walk_0` },
                    { key: 'sumo_sprites', frame: `${dir}_walk_1` },
                    { key: 'sumo_sprites', frame: `${dir}_walk_2` },
                    { key: 'sumo_sprites', frame: `${dir}_walk_3` }
                ],
                frameRate: 8,
                repeat: -1
            });
            
            // Push animations
            this.anims.create({
                key: `${dir}_push`,
                frames: [
                    { key: 'sumo_sprites', frame: `${dir}_push_0` },
                    { key: 'sumo_sprites', frame: `${dir}_push_1` },
                    { key: 'sumo_sprites', frame: `${dir}_push_2` },
                    { key: 'sumo_sprites', frame: `${dir}_push_3` }
                ],
                frameRate: 12,
                repeat: 0
            });
        });
        
        // Log all created animations
        console.log("Checking animations...");
        directions.forEach(dir => {
            console.log(`Animation ${dir}_push exists: ${this.anims.exists(`${dir}_push`)}`);
            console.log(`Animation ${dir}_walk exists: ${this.anims.exists(`${dir}_walk`)}`);
        });
    }
}