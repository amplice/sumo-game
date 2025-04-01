import gameConfig from '../config/gameConfig';

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    preload() {
        // Load the sprite sheet and atlas if not already loaded
        if (!this.textures.exists('sumo_sprites')) {
            this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');
        }
        this.load.audio('nonbattle_music', 'assets/audio/nonbattle_music.mp3');
    }

    create() {
        // Add dark background
        this.add.rectangle(0, 0, 1024, 768, 0x222222)
            .setOrigin(0, 0);

        // Add title with better styling
        this.add.text(1024/2, 80, 'HOW TO PLAY', {
            fontSize: '32px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, stroke: true, fill: true }
        }).setOrigin(0.5);

        // // Add sumo sprites for visual examples - using available frames
        // const blueSumo = this.add.sprite(300, 200, 'sumo_sprites', 'right_idle')
        //     .setScale(gameConfig.player.spriteScale);
        
        // // For the red sumo, we'll use right_idle but flip it horizontally to simulate left
        // const redSumo = this.add.sprite(700, 200, 'sumo_sprites', 'right_idle')
        //     .setScale(gameConfig.player.spriteScale)
        //     .setFlipX(true); // Flip horizontally to simulate looking left
        
        // // Create simple animations for demo - use existing frames
        // if (!this.anims.exists('tutorial_blue_walk')) {
        //     this.anims.create({
        //         key: 'tutorial_blue_walk',
        //         frames: [
        //             { key: 'sumo_sprites', frame: 'right_walk_0' },
        //             { key: 'sumo_sprites', frame: 'right_walk_1' },
        //             { key: 'sumo_sprites', frame: 'right_walk_2' },
        //             { key: 'sumo_sprites', frame: 'right_walk_3' }
        //         ],
        //         frameRate: 8,
        //         repeat: -1
        //     });
        // }
        
        // if (!this.anims.exists('tutorial_red_walk')) {
        //     // Use the same frames as blue but will be flipped horizontally
        //     this.anims.create({
        //         key: 'tutorial_red_walk',
        //         frames: [
        //             { key: 'sumo_sprites', frame: 'right_walk_0' },
        //             { key: 'sumo_sprites', frame: 'right_walk_1' },
        //             { key: 'sumo_sprites', frame: 'right_walk_2' },
        //             { key: 'sumo_sprites', frame: 'right_walk_3' }
        //         ],
        //         frameRate: 8,
        //         repeat: -1
        //     });
        // }
        
        // // Play walking animations
        // blueSumo.play('tutorial_blue_walk');
        // redSumo.play('tutorial_red_walk');

        // Instructions text - updated for latest game version and compressed
        const instructions = [
            "CONTROLS:",
            "",
            "Player 1:  Movement: W,A,S,D  |  Push: SPACE  |  Throw: SHIFT  |  Counter: C",
            "Player 2:  Movement: Arrow Keys  |  Push: Numpad 0  |  Throw: Numpad 1  |  Counter: Numpad 2",
            "",
            "RULES:",
            "- Push your opponent out of the ring",
            "- Use Throw for an instant win (requires 0.6-second windup)",
            "- Best of 3 rounds wins the match",
            "- Your facing direction is set by your last movement and determines where actions aim",
            "",
            "COUNTER MECHANICS:",
            "- During Counter windup (0.3s): You're vulnerable and can be pushed",
            "- During Counter active (0.3s): Counters both Throws AND Pushes",
            "- If you counter a throw: You throw your opponent instead (instant win)",
            "- If you counter a push: Your opponent gets pushed back instead (1.5x stronger)",
            "",
            "TIPS:",
            "- You can't move during throw windup, counter windup, or active counter",
            "- If pushed during a throw windup, the throw is cancelled",
            "- If pushed during counter windup, you get pushed extra far",
            "- Timing is crucial - counter has a brief active window",
            "- Push has a 70-pixel range while throw has 100-pixel range",
            "- Single-player has three difficulty levels that affect AI behavior"
        ];

        // Create a container with a mask for scrollable content
        const contentY = 120;
        const contentHeight = 400;  // Height of visible content area
        
        // Add instructions text in a more compact format - adjusted for larger screen
        const instructionsText = this.add.text(100, contentY, instructions, {
            fontSize: '16px',
            fill: '#FFFFFF',
            lineSpacing: 8
        });

        // Create back button well below the content
        this.createButton(1024/2, 700, 'Back to Menu', 200, 40, () => {
            this.scene.start('MenuScene');
        });
            // Check if music is already playing from the menu scene
    if (!this.sound.get('nonbattle_music')) {
        // If not, play it
        this.backgroundMusic = this.sound.add('nonbattle_music', {
            volume: 0.5,
            loop: true
        });
        this.backgroundMusic.play();
    }
    }

    createButton(x, y, text, width, height, callback) {
        const buttonConfig = gameConfig.ui.buttons;
        const button = this.add.rectangle(x, y, width, height, buttonConfig.color)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.fillColor = buttonConfig.hoverColor)
            .on('pointerout', () => button.fillColor = buttonConfig.color)
            .on('pointerdown', () => button.fillColor = buttonConfig.pressColor)
            .on('pointerup', () => {
                button.fillColor = buttonConfig.hoverColor;
                callback();
            });
    }
// Called when scene is shutting down
shutdown() {
    console.log('TutorialScene shutdown called');
    
    // Kill all running tweens
    this.tweens.killAll();
    
    // Only stop the music if we're not going back to the menu
    // This prevents music interruption when switching between menu and tutorial
    const music = this.sound.get('nonbattle_music');
    if (music && this.scene.next !== 'MenuScene') {
        music.stop();
    }
    
    console.log('TutorialScene shutdown complete');
}
}