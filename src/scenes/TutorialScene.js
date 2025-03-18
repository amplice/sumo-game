export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        // Add title
        this.add.text(400, 50, 'HOW TO PLAY', {
            fontSize: '36px',
            fill: '#FFF',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Instructions text
        const instructions = [
            "CONTROLS:",
            "",
            "Player 1:",
            "- Movement: W,A,S,D",
            "- Push: SPACE",
            "",
            "Player 2:",
            "- Movement: Arrow Keys",
            "- Push: Numpad 0",
            "",
            "RULES:",
            "- Push your opponent out of the ring",
            "- Best of 3 rounds wins the match",
            "",
            "Your facing direction (shown by the pointer) determines",
            "where your push action will be aimed."
        ];

        // Add instructions text
        const instructionsText = this.add.text(400, 220, instructions, {
            fontSize: '18px',
            fill: '#FFF',
            align: 'center'
        }).setOrigin(0.5, 0);

        // Back button
        this.createButton(400, 520, 'Back to Menu', () => {
            this.scene.start('MenuScene');
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