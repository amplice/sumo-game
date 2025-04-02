import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import TutorialScene from './scenes/TutorialScene';
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';
// import TestScene from './scenes/TestScene';

// Add device detection function
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Make this available globally
window.isMobile = isMobile;

// Game configuration with improved scene management and responsive scaling
const config = {
    type: Phaser.AUTO,
    // Add scale manager configuration for responsive design
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1024,
        height: 768,
        // Set max width/height to maintain aspect ratio on larger screens
        max: {
            width: 1600,
            height: 1200
        }
    },
    backgroundColor: '#333333',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    plugins: {
        global: [
            {
                key: 'rexVirtualJoystick',
                plugin: VirtualJoystickPlugin,
                start: true
            }
        ]
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
            console.log('Running on mobile: ' + isMobile());
            
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

// Add resize event listener to handle orientation changes
window.addEventListener('resize', function() {
    if (game) {
        // Force resize and refresh
        game.scale.refresh();
    }
});