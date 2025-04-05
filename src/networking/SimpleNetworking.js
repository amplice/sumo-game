// src/networking/SimpleNetworking.js

import Peer from 'peerjs';

export default class SimpleNetworking {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.roomId = null;
        this.connected = false;
        this.dataHandler = null;
        this.disconnectHandler = null;
    }

    // Initialize networking
    initialize() {
        return new Promise((resolve, reject) => {
            try {
                // Create a new peer with a random ID
                this.peer = new Peer();
                
                this.peer.on('open', (id) => {
                    console.log('My peer ID is: ' + id);
                    resolve(); // Resolve the promise when connected
                });
    
                this.peer.on('connection', (conn) => {
                    this.handleConnection(conn);
                });
    
                this.peer.on('error', (err) => {
                    console.error('PeerJS error:', err);
                    reject(err); // Reject the promise on error
                });
            } catch (err) {
                console.error('Error initializing PeerJS:', err);
                reject(err);
            }
        });
    }

    // Set handler for incoming data
    setDataHandler(callback) {
        this.dataHandler = callback;
    }

    // Set handler for disconnection
    setDisconnectHandler(callback) {
        this.disconnectHandler = callback;
    }

    // Host a new game
    hostGame() {
        this.isHost = true;
        this.roomId = this.peer.id;
        console.log(`Hosting game with room ID: ${this.roomId}`);
        return this.roomId;
    }

    // Join an existing game
    joinGame(roomId) {
        this.isHost = false;
        this.roomId = roomId;
        
        console.log(`Joining game with room ID: ${roomId}`);
        
        // Connect to the host - original simple version that was working before
        const conn = this.peer.connect(roomId);
        this.handleConnection(conn);
    }

    // Handle a new connection
    // Simplified handleConnection method
handleConnection(conn) {
    console.log('New connection being set up');
    
    // Store the connection
    this.connection = conn;
    
    conn.on('open', () => {
        console.log('Connection fully opened');
        this.connected = true;
        
        // Start the game
        this.game.scene.start('GameScene', { 
            mode: 'online',
            isHost: this.isHost
        });
    });

    conn.on('data', (data) => {
        // Only log non-playerState messages
        if (data.type !== 'playerState') {
            console.log('Received peer data type:', data.type);
        }
        
        if (this.dataHandler) {
            this.dataHandler(data);
        }
    });

    conn.on('close', () => {
        console.log('Connection closed');
        this.connected = false;
        
        if (this.disconnectHandler) {
            this.disconnectHandler();
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        
        if (this.disconnectHandler) {
            this.disconnectHandler();
        }
    });
}

    // Send data to the other player
    sendData(data) {
        // Only log non-playerState messages to reduce noise
        if (data.type !== 'playerState') {
            console.log('Sending data type:', data.type, data);
        }
        
        if (this.connection && this.connected) {
            try {
                // If it's an action, add a timestamp to help with ordering
                if (data.type === 'action') {
                    data.timestamp = Date.now();
                }
                
                this.connection.send(data);
                return true;
            } catch (err) {
                console.error('Error sending data:', err);
                return false;
            }
        } else {
            console.warn('Cannot send data - not connected', this.connection, this.connected);
            return false;
        }
    }

    // Disconnect
    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
        
        if (this.peer) {
            this.peer.destroy();
        }
        
        this.connection = null;
        this.peer = null;
        this.connected = false;
    }
}