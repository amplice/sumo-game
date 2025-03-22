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
    }

    create() {
        // Add dark background
        this.add.rectangle(0, 0, 800, 600, 0x222222)
            .setOrigin(0, 0);

        // Add title with better styling
        this.add.text(400, 30, 'HOW TO PLAY', {
            fontSize: '32px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 3, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Add sumo sprites for visual examples
        const blueSumo = this.add.sprite(200, 200, 'sumo_sprites', 'right_idle').setScale(2);
        const redSumo = this.add.sprite(600, 200, 'sumo_sprites', 'left_idle').setScale(2);
        
        // Create simple animations for demo
        if (!this.anims.exists('tutorial_blue_walk')) {
            this.anims.create({
                key: 'tutorial_blue_walk',
                frames: this.anims.generateFrameNames('sumo_sprites', { 
                    prefix: 'right_walk_',
                    start: 0, 
                    end: 3
                }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('tutorial_red_walk')) {
            this.anims.create({
                key: 'tutorial_red_walk',
                frames: this.anims.generateFrameNames('sumo_sprites', { 
                    prefix: 'left_walk_',
                    start: 0, 
                    end: 3
                }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        // Play walking animations
        blueSumo.play('tutorial_blue_walk');
        redSumo.play('tutorial_red_walk');

        // Instructions text - updated for latest game version and compressed
        const instructions = [
            "CONTROLS:",
            "",
            "Player 1:  Movement: W,A,S,D  |  Push: SPACE  |  Throw: SHIFT  |  Counter: C",
            "Player 2:  Movement: Arrow Keys  |  Push: Numpad 0  |  Throw: Numpad 1  |  Counter: Numpad 2",
            "",
            "RULES:",
            "- Push your opponent out of the ring",
            "- Use Throw for an instant win (requires 1-second windup)",
            "- Best of 3 rounds wins the match",
            "- Your facing direction (shown by the pointer) determines where actions are aimed",
            "",
            "COUNTER MECHANICS:",
            "- During Counter windup (0.5s): You're vulnerable and get pushed extra far",
            "- During Counter active (0.5s): Counters both Throws AND Pushes",
            "- If you counter a throw: You throw your opponent instead (instant win)",
            "- If you counter a push: Your opponent gets pushed back instead",
            "",
            "TIPS:",
            "- You can't move during a throw windup or counter",
            "- If pushed during a throw windup, the throw is cancelled",
            "- If pushed during counter windup, you get pushed extra far",
            "- Timing is crucial - counter has a brief active window",
            "- Push has a shorter range but faster execution"
        ];

        // Create a container with a mask for scrollable content
        const contentY = 80;
        const contentHeight = 400;  // Height of visible content area
        
        // Add instructions text in a more compact format
        const instructionsText = this.add.text(50, contentY, instructions, {
            fontSize: '12px',
            fill: '#FFFFFF',
            lineSpacing: 6
        });

        // Create back button well below the content
        this.createButton(600, 530, 'Back to Menu', 150, 30, () => {
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, text, width, height, callback) {
        const buttonConfig = gameConfig.ui.buttons;
        const button = this.add.rectangle(x, y, width, height, buttonConfig.color)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '12px',
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
}