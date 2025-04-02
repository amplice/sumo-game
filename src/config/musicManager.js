// Fix for src/config/musicManager.js

/**
 * Global music manager to handle background music across scenes
 */
class MusicManager {
    constructor() {
        this.currentMusic = null;
        this.currentKey = null;
        this.scene = null;
        this.musicMuted = false;
        this.sfxMuted = false;
    }
    
    /**
     * Play music for a scene, stopping any currently playing music first
     * @param {Phaser.Scene} scene - The scene requesting music
     * @param {string} key - The key for the music asset
     * @param {object} config - Configuration options for the music
     */
    preloadSounds(scene) {

        scene.load.audio('windup_sound', 'assets/audio/windup_sound.mp3');
        scene.load.audio('throw_sound', 'assets/audio/throw_sound.mp3');
        scene.load.audio('counter_sound', 'assets/audio/counter_sound.mp3');
        scene.load.audio('push_sound', 'assets/audio/push_sound.mp3');
        scene.load.audio('push_hit', 'assets/audio/push_hit.mp3');
        scene.load.audio('battle_music', 'assets/audio/battle_music.mp3');
        scene.load.audio('nonbattle_music', 'assets/audio/nonbattle_music.mp3');
    }

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
        
        // Apply current mute state
        this.currentMusic.setMute(this.musicMuted);
        
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
     * Set the current scene for the music manager
     * @param {Phaser.Scene} scene - The current scene
     */
    setScene(scene) {
        this.scene = scene;
    }
    
    /**
     * Toggle mute state specifically for music
     * @returns {boolean} The new music mute state
     */
    toggleMusicMute() {
        this.musicMuted = !this.musicMuted;
        console.log(`MusicManager: Setting music mute to ${this.musicMuted}`);
        
        // Apply to current music if it exists
        if (this.currentMusic) {
            this.currentMusic.setMute(this.musicMuted);
        }
        
        return this.musicMuted;
    }
    
    /**
     * Toggle mute state for sound effects
     * @returns {boolean} The new SFX mute state
     */
    toggleSFXMute() {
        this.sfxMuted = !this.sfxMuted;
        console.log(`MusicManager: Setting SFX mute to ${this.sfxMuted}`);
        
        // If we have a valid scene, set the mute state for all non-music sounds
        if (this.scene) {
            // For existing sounds, we need to update them individually (except music)
            this.scene.sound.sounds.forEach(sound => {
                // Skip the current music when muting sfx
                if (sound !== this.currentMusic) {
                    sound.setMute(this.sfxMuted);
                }
            });
        }
        
        return this.sfxMuted;
    }
    
    /**
     * Get current mute state for music
     * @returns {boolean} True if music is muted
     */
    isMusicMuted() {
        return this.musicMuted;
    }
    
    /**
     * Get current mute state for sound effects
     * @returns {boolean} True if SFX are muted
     */
    isSFXMuted() {
        return this.sfxMuted;
    }
    
    /**
     * Play a sound effect with the current SFX mute state applied
     * @param {Phaser.Scene} scene - The scene to play the sound in
     * @param {string} key - The sound key
     * @param {object} config - Configuration for the sound
     * @returns {Phaser.Sound.BaseSound} The sound object
     */
    playSFX(scene, key, config = {}) {
        const sound = scene.sound.add(key, config);
        sound.setMute(this.sfxMuted);
        sound.play();
        return sound;
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
}

// Create and export a singleton instance
const musicManager = new MusicManager();
export default musicManager;