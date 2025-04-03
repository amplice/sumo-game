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

    // Initialize networking - MUST return a Promise
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
        return this.roomId;
    }

    // Join an existing game
    joinGame(roomId) {
        this.isHost = false;
        this.roomId = roomId;
        
        // Connect to the host
        const conn = this.peer.connect(roomId);
        this.handleConnection(conn);
    }

    // Handle a new connection
    handleConnection(conn) {
        this.connection = conn;
        
        conn.on('open', () => {
            console.log('Connected to peer');
            this.connected = true;
            
            // Start the game
            this.game.scene.start('GameScene', { 
                mode: 'online',
                isHost: this.isHost
            });
        });

        conn.on('data', (data) => {
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
    }

    // Send data to the other player
    sendData(data) {
        if (this.connection && this.connected) {
            this.connection.send(data);
            return true;
        }
        return false;
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