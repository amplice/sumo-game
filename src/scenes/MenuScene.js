import gameConfig from '../config/gameConfig';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedDifficulty = 'medium';
    }

    preload() {
        // Load the sprite sheet and atlas
        this.load.atlas('sumo_sprites', 'assets/sprites/sumo_sprites.png', 'assets/sprites/sumo_atlas.json');
    }

    create() {
        // Create a darker background for better contrast
        this.add.rectangle(0, 0, 800, 600, 0x222222)
            .setOrigin(0, 0);
            
        // Create the ring background - moved down to not block title
        const ringRadius = gameConfig.ring.radius - 20;
        const ring = this.add.circle(400, 340, ringRadius, gameConfig.ring.color);
        ring.setStrokeStyle(gameConfig.ring.borderWidth, gameConfig.ring.borderColor);

        // Add sumo sprites to the menu for visual preview
        const blueSumo = this.add.sprite(300, 340, 'sumo_sprites', 'down_idle').setScale(2);
        const redSumo = this.add.sprite(500, 340, 'sumo_sprites', 'down_idle').setScale(2);
        
        // Create simple idle animations
        if (!this.anims.exists('menu_blue_idle')) {
            this.anims.create({
                key: 'menu_blue_idle',
                frames: [
                    { key: 'sumo_sprites', frame: 'down_idle' },
                    { key: 'sumo_sprites', frame: 'down_walk_0' }
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('menu_red_idle')) {
            this.anims.create({
                key: 'menu_red_idle',
                frames: [
                    { key: 'sumo_sprites', frame: 'down_idle' },
                    { key: 'sumo_sprites', frame: 'down_walk_0' }
                ],
                frameRate: 2,
                repeat: -1
            });
        }
        
        // Play the idle animations
        blueSumo.play('menu_blue_idle');
        redSumo.play('menu_red_idle');

        // Add title - positioned above the ring
        this.add.text(400, 80, 'SUMO DUEL', {
            fontSize: '64px',
            fontStyle: 'bold',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Create buttons with better spacing and consistent sizing
        this.createButton(400, 260, 'Two Player', 250, 50, () => {
            this.scene.start('GameScene', { mode: 'twoPlayer' });
        });

        // Single Player button (with difficulty display)
        this.singlePlayerButton = this.createButton(400, 330, `Single Player (${this.formatDifficulty(this.selectedDifficulty)})`, 250, 50, () => {
            this.scene.start('GameScene', { 
                mode: 'singlePlayer',
                difficulty: this.selectedDifficulty
            });
        });

        // Difficulty selection buttons with better spacing and consistent sizing
        this.createDifficultyButtons();

        this.createButton(400, 450, 'How to Play', 250, 50, () => {
            this.scene.start('TutorialScene');
        });
    }

    createButton(x, y, text, width, height, callback) {
        const buttonConfig = gameConfig.ui.buttons;
        const button = this.add.rectangle(x, y, width, height, buttonConfig.color)
            .setStrokeStyle(2, 0xFFFFFF);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '14px',
            fill: '#FFFFFF',
        }).setOrigin(0.5);
        
        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.fillColor = buttonConfig.hoverColor)
            .on('pointerout', () => button.fillColor = buttonConfig.color)
            .on('pointerdown', () => button.fillColor = buttonConfig.pressColor)
            .on('pointerup', () => {
                button.fillColor = buttonConfig.hoverColor;
                callback();
            });
            
        return { button, text: buttonText };
    }
    
    createDifficultyButtons() {
        const y = 390;
        const spacing = 110;
        const difficulties = ['easy', 'medium', 'hard'];
        this.difficultyButtons = {};
        
        difficulties.forEach((difficulty, index) => {
            const x = 400 + (index - 1) * spacing;
            const color = (difficulty === this.selectedDifficulty) ? 
                          0x00AA00 : // Green for selected
                          0x555555;  // Gray for unselected
            
            const width = 100;
            const height = 40;
                          
            const button = this.add.rectangle(x, y, width, height, color)
                .setStrokeStyle(2, 0xFFFFFF)
                .setInteractive({ useHandCursor: true })
                .on('pointerup', () => {
                    this.setDifficulty(difficulty);
                });
                
            const text = this.add.text(x, y, this.formatDifficulty(difficulty), {
                fontSize: '18px',
                fill: '#FFFFFF',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            
            this.difficultyButtons[difficulty] = { button, text };
        });
    }
    
    setDifficulty(difficulty) {
        // Update the previous selected button
        if (this.selectedDifficulty && this.difficultyButtons[this.selectedDifficulty]) {
            this.difficultyButtons[this.selectedDifficulty].button.fillColor = 0x555555;
        }
        
        // Set new difficulty
        this.selectedDifficulty = difficulty;
        
        // Update the new selected button
        if (this.difficultyButtons[difficulty]) {
            this.difficultyButtons[difficulty].button.fillColor = 0x00AA00;
        }
        
        // Update the Single Player button text
        if (this.singlePlayerButton && this.singlePlayerButton.text) {
            this.singlePlayerButton.text.setText(`Single Player (${this.formatDifficulty(difficulty)})`);
        }
    }
    
    formatDifficulty(difficulty) {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
}