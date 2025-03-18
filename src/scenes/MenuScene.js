export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // Add title
        this.add.text(400, 100, 'SUMO DUEL', {
            fontSize: '64px',
            fill: '#FFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Create the ring background
        const ringRadius = 200;
        const ring = this.add.circle(400, 300, ringRadius, 0xCCCCCC);
        ring.setStrokeStyle(4, 0x000000);

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
        const button = this.add.rectangle(x, y, 200, 50, 0x0000AA);
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '24px',
            fill: '#FFFFFF'
        }).setOrigin(0.5);
        
        button.setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.fillColor = 0x0000FF)
            .on('pointerout', () => button.fillColor = 0x0000AA)
            .on('pointerdown', () => button.fillColor = 0x000077)
            .on('pointerup', () => {
                button.fillColor = 0x0000FF;
                callback();
            });
    }
}