// Create a new file src/utils/musicManager.js

/**
 * Global music manager to handle background music across scenes
 */
class MusicManager {
    constructor() {
        this.currentMusic = null;
        this.currentKey = null;
        this.scene = null;
    }
    
    /**
     * Play music for a scene, stopping any currently playing music first
     * @param {Phaser.Scene} scene - The scene requesting music
     * @param {string} key - The key for the music asset
     * @param {object} config - Configuration options for the music
     */
    playMusic(scene, key, config = {}) {
        console.log(`MusicManager: Request to play music ${key}`);
        
        // Store the current scene for mute controls
        this.scene = scene;
        
        // Default configuration
        const defaultConfig = {
            volume: 0.5,
            loop: true
        };
        
        // Merge default config with provided config
        const finalConfig = {...defaultConfig, ...config};
        
        // Stop current music if it exists
        this.stopMusic();
        
        // Create new music instance
        this.currentMusic = scene.sound.add(key, finalConfig);
        this.currentKey = key;
        
        // Play the music
        this.currentMusic.play();
        console.log(`MusicManager: Now playing ${key}`);
        
        return this.currentMusic;
    }
    
    /**
     * Stop any currently playing music
     */
    stopMusic() {
        if (this.currentMusic) {
            console.log(`MusicManager: Stopping music ${this.currentKey}`);
            this.currentMusic.stop();
            this.currentMusic.destroy();
            this.currentMusic = null;
            this.currentKey = null;
        }
    }
    
    /**
     * Check if a specific music track is currently playing
     * @param {string} key - The key of the music to check
     * @returns {boolean} - True if the specified music is playing
     */
    isPlaying(key) {
        return this.currentKey === key && this.currentMusic && this.currentMusic.isPlaying;
    }
    
    /**
     * Toggle mute state for all sound
     * @returns {boolean} The new mute state
     */
    toggleMute() {
        const newMuteState = !this.scene.sound.mute;
        console.log(`MusicManager: Setting mute to ${newMuteState}`);
        
        // If we have a valid scene, mute all sound
        if (this.scene) {
            this.scene.sound.mute = newMuteState;
        }
        
        return newMuteState;
    }
    
    /**
     * Set the current scene for the music manager
     * @param {Phaser.Scene} scene - The current scene
     */
    setScene(scene) {
        this.scene = scene;
    }
}

// Create and export a singleton instance
const musicManager = new MusicManager();
export default musicManager;