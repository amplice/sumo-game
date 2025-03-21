import gameConfig from '../config/gameConfig';

export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TutorialScene' });
    }

    create() {
        // Add title
        this.add.text(400, 50, 'HOW TO PLAY', gameConfig.ui.fonts.header)
            .setOrigin(0.5);

        // Instructions text
        const instructions = [
            "CONTROLS:",
            "",
            "Player 1:",
            "- Movement: W,A,S,D",
            "- Push: SPACE",
            `- Throw: SHIFT (has ${gameConfig.throw.windupDuration/1000}-second windup)`,
            `- Counter: C (has ${gameConfig.counter.windupDuration/1000}-second windup, lasts ${gameConfig.counter.activeDuration/1000} seconds)`,
            "",
            "Player 2:",
            "- Movement: Arrow Keys",
            "- Push: Numpad 0",
            `- Throw: Numpad 1 (has ${gameConfig.throw.windupDuration/1000}-second windup)`,
            `- Counter: Numpad 2 (has ${gameConfig.counter.windupDuration/1000}-second windup, lasts ${gameConfig.counter.activeDuration/1000} seconds)`,
            "",
            "RULES:",
            "- Push your opponent out of the ring",
            "- Use Throw for an instant win (requires 1-second windup)",
            "- Best of 3 rounds wins the match",
            "",
            "Your facing direction (shown by the pointer) determines",
            "where your actions will be aimed.",
            "",
            "TIPS:",
            "- You can't move during a throw windup or counter",
            "- If pushed during a throw windup, the throw is cancelled",
            "- If you counter when an opponent throws, you win instead",
            "- If pushed while countering, you get pushed back extra far",
            "- Timing is crucial - counter has a brief active window",
            "- Push has a shorter range but faster execution"
        ];

        // Add instructions text
        const instructionsText = this.add.text(400, 220, instructions, gameConfig.ui.fonts.small)
            .setOrigin(0.5, 0);

        // Back button
        this.createButton(400, 520, 'Back to Menu', () => {
            this.scene.start('MenuScene');
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