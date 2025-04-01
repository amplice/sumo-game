/**
 * Game configuration file for Sumo Duel
 * Contains all configurable parameters for game mechanics and visuals
 */

const gameConfig = {
    // Game Area
    ring: {
        radius: 280,     // Radius of the ring in pixels
        color: 0xCCCCCC, // Ring color (light gray)
        borderWidth: 0.1,  // Border width in pixels
        borderColor: 0x000000, // Border color (black)
    },

    // Player Configuration
    player: {
        moveSpeed: 180,                // Base movement speed in pixels per second
        diagonalSpeedModifier: 0.707,  // Speed modifier when moving diagonally (√2/2)
        spriteScale: 2,                // Scale factor for player sprites
        size: 17,                      // Player radius in pixels
        hitboxSize: 20,                // Physics hitbox radius (slightly larger than visual)
        aiSpeed: 180,                  // AI player speed (slightly slower than player)
        outOfBoundsMargin: 0,         // Distance from ring edge to count as out-of-bounds
        indicator: {
            size: 0,                  // Distance from center to indicator
            triangleShape: [           // Triangle indicator shape [x1,y1, x2,y2, x3,y3]
                -4, -3,                // Point 1 (left)
                4, -3,                 // Point 2 (right)
                0, -10                   // Point 3 (bottom)
            ],
            color: 0x000000,           // Indicator color (black)
        },
        colors: {
            player1: 0x0000FF,         // Player 1 color (blue)
            player2: 0xFF0000,         // Player 2 color (red)
        }
    },

    // Push Action
    push: {
        cooldown: 350,                 // Push cooldown in ms
        range: 70,                     // Push detection range in pixels
        width: 40,                     // Push area width in pixels
        distance: 100,                 // How far target is pushed in pixels
        counterPushDistance: 200,      // Extra push distance when target is countering
        visual: {
            color: 0x00FF00,           // Push area color (green)
            alpha: 0,                // Push area transparency
            duration: 300,             // Visual effect duration in ms
        },
        feedback: {
            scaleAmount: 1.3,          // Scale factor for pusher's indicator
            duration: 100,             // Duration of scale animation in ms
            targetFlashColor: 0xFF0000, // Color to flash target's indicator when hit (red)
            targetPushDuration: 300,   // Duration of the push animation in ms
        },
        trail: {                      // Trail effect when pushing a countering player
            color: 0xFF6600,          // Trail color (orange)
            alpha: 0.6,               // Trail transparency
            size: 12,                 // Trail size in pixels
            duration: 400             // Trail fade duration in ms
        }
    },

    // Throw Action
    throw: {
        windupDuration: 600,          // Throw windup duration in ms
        range: 100,                    // Maximum throw range in pixels
        angle: 33,                     // Throw cone angle in degrees
        coneSize: {                    // Cone visual parameters
            length: 95,               // Length of the cone
            halfAngleTangent: 0.28,  // Tangent of half the cone angle (tan(22.5°))
            steps: 10,                 // Number of steps to draw the cone curve
        },
        visual: {
            color: 0xcccccc,           // Throw cone fill color (orange)
            alpha: 0.1,                // Throw cone transparency
            borderColor: 0xcccccc,     // Throw cone border color
            borderWidth: 0,            // Throw cone border width
            fadeOutDuration: 200,      // Cone fade out duration in ms
            windupCircleSize: 15,      // Windup circle size
            windupCircleAlpha: 0,    // Windup circle transparency
        },
        feedback: {
            flashDuration: 100,        // Duration of thrower's flash
            flashAlpha: 0.5,           // Alpha of thrower's flash
            spinDuration: 500,         // Duration of target's spin animation
            lineColor: 0xFF8800,       // Color of the line effect between players
            lineWidth: 0,              // Width of the line effect
            lineFadeDuration: 400,     // Line fade out duration in ms
        }
    },

    // Counter Action
    counter: {
        windupDuration: 300,           // Counter windup duration in ms
        activeDuration: 300,           // Counter active duration in ms
        visual: {
            windupCircleSize: 15,      // Size of windup circle
            windupCircleColor: 0xFFFFFF, // Initial color of windup circle (white)
            windupCircleAlpha: 0,    // Windup circle transparency
            activeCircleSize: 20,      // Size of active counter circle
            activeCircleColor: 0xFFFF00, // Active counter circle color (yellow)
            activeCircleAlpha: 0,    // Active counter circle transparency
            pulseSize: 20,             // Size of the pulse effect
            pulseColor: 0xFFFFFF,      // Pulse effect color (white)
            pulseAlpha: 0,           // Pulse effect transparency
            pulseScale: 1.5,           // How much pulse expands
        },
        feedback: {
            trianglePulsateSpeed: 4,   // Speed of indicator pulsating (multiplier for Math.PI)
            trianglePulsateAmount: 0.3, // Amount of pulsating 
            activePulsateSpeed: 0.3,   // Active counter pulsate amount
            pulsateCycleTime: 200,     // Time for one pulsate cycle in ms
            counterFlashSize: 30,      // Size of flash when counter succeeds
            counterFlashColor: 0xFFFF00, // Color of counter success flash
            counterFlashAlpha: 0,    // Alpha of counter success flash
            counterFlashScale: 2,      // Scale of counter success flash
            counterFlashDuration: 500, // Duration of counter flash animation
            lightningSegments: 6,      // Number of segments in lightning effect
            lightningWidth: 5,         // Width of lightning line
            lightningColor: 0x0000cc,  // Color of lightning effect
            lightningOffset: 15,       // Maximum zigzag offset in pixels
            lightningDuration: 600,    // Lightning effect duration in ms
        }
    },
    
    // Game UI
    ui: {
        fonts: {
            title: { fontSize: '64px', fill: '#FFF', fontStyle: 'bold' },
            header: { fontSize: '36px', fill: '#FFF', fontStyle: 'bold' },
            normal: { fontSize: '24px', fill: '#FFF' },
            small: { fontSize: '18px', fill: '#FFF' },
            winner: { fontSize: '32px', fill: '#FFF', align: 'center' }
        },
        buttons: {
            color: 0x0000AA,
            hoverColor: 0x0000FF,
            pressColor: 0x000077,
            width: 200,
            height: 50
        }
    },
    
// AI behavior
ai: {
    updateInterval: {
        min: 500,  // Minimum time between AI decisions in ms
        max: 1000  // Maximum time between AI decisions in ms
    },
    strategy: {
        edgeDistance: 50,          // Distance to consider opponent "near edge"
        closeDistance: 100,        // Distance to consider "close" to player
        pushChanceNearEdge: 0.7,   // Chance to push when opponent near edge
        pushChanceNormal: 0.4,     // Normal push chance 
        throwChanceNearEdge: 0.2,  // Chance to throw when opponent near edge
        throwChanceNormal: 0.3,    // Normal throw chance
        counterChance: 0.2,        // Chance to use counter randomly
        counterChanceVsThrow: 0.8, // Chance to counter when opponent is throwing
    },
    difficulties: {
        easy: {
            reactionTime: 400,     // Ms delay before reacting
            decisionQuality: 0.5,  // 0-1 chance of making optimal decision
            prediction: 0.2,       // 0-1 ability to predict player movements
            positionAccuracy: 0.3, // 0-1 positioning precision
            edgeAwareness: 0.4     // 0-1 awareness of ring boundaries
        },
        medium: {
            reactionTime: 250,
            decisionQuality: 0.7,
            prediction: 0.5,
            positionAccuracy: 0.6,
            edgeAwareness: 0.7
        },
        hard: {
            reactionTime: 100,
            decisionQuality: 0.9,
            prediction: 0.8,
            positionAccuracy: 0.9,
            edgeAwareness: 0.95
        }
    },
    states: {
        neutral: {
            idealDistance: 120,    // Ideal distance to maintain in neutral state
            actionFrequency: 0.4   // 0-1 frequency of taking actions
        },
        defensive: {
            centerBias: 0.7,       // 0-1 bias towards ring center
            pushFrequency: 0.6     // 0-1 frequency of pushing when close
        },
        aggressive: {
            predictiveFactor: 0.6, // 0-1 factor for predicting opponent position
            throwFrequency: 0.7    // 0-1 frequency of throwing when aligned
        },
        counterReady: {
            counterPriority: 0.9   // 0-1 priority of counter over other actions
        }
    },
    decisionFrequency: 100         // Ms between micro-decisions
}
};

export default gameConfig;