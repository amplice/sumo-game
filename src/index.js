import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import TutorialScene from './scenes/TutorialScene';
import TestScene from './scenes/TestScene';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width:1024,
    height: 768,
    backgroundColor: '#333333',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, TutorialScene, TestScene],
    parent: 'game'
};

// Initialize the game
const game = new Phaser.Game(config);

// Preload common assets
function preloadAssets() {
    // This is handled in individual scenes now
}