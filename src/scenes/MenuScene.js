import gameConfig from '../config/gameConfig';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
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

        this.createButton(400, 320, 'Single Player', () => {
            this.scene.start('GameScene', { mode: 'singlePlayer' });
        });

        this.createButton(400, 390, 'How to Play', () => {
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
    }
}