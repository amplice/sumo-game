import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import TutorialScene from './scenes/TutorialScene';
// import TestScene from './scenes/TestScene';

// Game configuration with improved scene management
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: '#333333',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, TutorialScene],
    // scene: [MenuScene, GameScene, TutorialScene, TestScene],

    parent: 'game',
    // Add callbacks for better scene management
    callbacks: {
        preBoot: function (game) {
            console.log('Game preBoot');
        },
        postBoot: function (game) {
            console.log('Game postBoot');
            
            // Add global error handling to prevent game crashes
            window.addEventListener('error', function(e) {
                console.error('Game error caught:', e.error);
                // Attempt to recover by returning to menu if in an active scene
                if (game.scene.isActive('GameScene')) {
                    console.log('Error occurred in GameScene, attempting to return to menu');
                    game.scene.stop('GameScene');
                    game.scene.start('MenuScene');
                }
                // This prevents the browser from showing the error
                e.preventDefault();
                return true;
            });
        }
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Add global reference for debugging
window.game = game;

// Add logging for scene transitions
game.scene.rootScene = 'MenuScene'; // Track current main scene

// Add a custom method to the Scene Manager to detect when scenes are switched
const originalStart = game.scene.start;
game.scene.start = function (key, data) {
    console.log(`Scene transition: ${game.scene.rootScene} → ${key}`);
    game.scene.rootScene = key;
    return originalStart.call(this, key, data);
};