import gameConfig from '../config/gameConfig';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.selectedDifficulty = 'medium';
    }

    create() {
        // Add title
        this.add.text(400, 100, 'SUMO DUEL', gameConfig.ui.fonts.title)
            .setOrigin(0.5);

        // Create the ring background
        const ringRadius = gameConfig.ring.radius - 50; // Slightly smaller for menu
        const ring = this.add.circle(400, 300, ringRadius, gameConfig.ring.color);
        ring.setStrokeStyle(gameConfig.ring.borderWidth, gameConfig.ring.borderColor);

        // Create buttons
        this.createButton(400, 250, 'Two Player', () => {
            this.scene.start('GameScene', { mode: 'twoPlayer' });
        });

        // Single Player button (with difficulty display)
        this.singlePlayerButton = this.createButton(400, 320, `Single Player (${this.formatDifficulty(this.selectedDifficulty)})`, () => {
            this.scene.start('GameScene', { 
                mode: 'singlePlayer',
                difficulty: this.selectedDifficulty
            });
        });

        // Difficulty selection buttons
        this.createDifficultyButtons();

        this.createButton(400, 440, 'How to Play', () => {
            this.scene.start('TutorialScene');
        });
    }

    createButton(x, y, text, callback) {
        const buttonConfig = gameConfig.ui.buttons;
        const button = this.add.rectangle(x, y, buttonConfig.width, buttonConfig.height, buttonConfig.color);
        
        const buttonText = this.add.text(x, y, text, gameConfig.ui.fonts.normal)
            .setOrigin(0.5);
        
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
        const y = 370;
        const spacing = 120;
        const difficulties = ['easy', 'medium', 'hard'];
        this.difficultyButtons = {};
        
        difficulties.forEach((difficulty, index) => {
            const x = 400 + (index - 1) * spacing;
            const color = (difficulty === this.selectedDifficulty) ? 
                          0x00AA00 : // Green for selected
                          0x555555;  // Gray for unselected
                          
            const button = this.add.rectangle(x, y, 100, 40, color)
                .setInteractive({ useHandCursor: true })
                .on('pointerup', () => {
                    this.setDifficulty(difficulty);
                });
                
            const text = this.add.text(x, y, this.formatDifficulty(difficulty), {
                fontSize: '18px',
                fill: '#FFF'
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