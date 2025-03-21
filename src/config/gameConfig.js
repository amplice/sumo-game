/**
 * Game configuration file for Sumo Duel
 * Contains all configurable parameters for game mechanics and visuals
 */

const gameConfig = {
    // Game Area
    ring: {
        radius: 250,     // Radius of the ring in pixels
        color: 0xCCCCCC, // Ring color (light gray)
        borderWidth: 4,  // Border width in pixels
        borderColor: 0x000000, // Border color (black)
    },

    // Player Configuration
    player: {
        moveSpeed: 200,                // Base movement speed in pixels per second
        diagonalSpeedModifier: 0.707,  // Speed modifier when moving diagonally (√2/2)
        size: 10,                      // Player radius in pixels
        hitboxSize: 15,                // Physics hitbox radius (slightly larger than visual)
        aiSpeed: 180,                  // AI player speed (slightly slower than player)
        outOfBoundsMargin: 15,         // Distance from ring edge to count as out-of-bounds
        indicator: {
            size: 10,                  // Distance from center to indicator
            triangleShape: [           // Triangle indicator shape [x1,y1, x2,y2, x3,y3]
                -4, -3,                // Point 1 (left)
                4, -3,                 // Point 2 (right)
                0, 6                   // Point 3 (bottom)
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
        cooldown: 500,                 // Push cooldown in ms
        range: 70,                     // Push detection range in pixels
        width: 40,                     // Push area width in pixels
        distance: 100,                 // How far target is pushed in pixels
        counterPushDistance: 200,      // Extra push distance when target is countering
        visual: {
            color: 0x00FF00,           // Push area color (green)
            alpha: 0.3,                // Push area transparency
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
        windupDuration: 1000,          // Throw windup duration in ms
        range: 100,                    // Maximum throw range in pixels
        angle: 45,                     // Throw cone angle in degrees
        coneSize: {                    // Cone visual parameters
            length: 100,               // Length of the cone
            halfAngleTangent: 0.4142,  // Tangent of half the cone angle (tan(22.5°))
            steps: 10,                 // Number of steps to draw the cone curve
        },
        visual: {
            color: 0xFF8800,           // Throw cone fill color (orange)
            alpha: 0.5,                // Throw cone transparency
            borderColor: 0xFF5500,     // Throw cone border color
            borderWidth: 2,            // Throw cone border width
            fadeOutDuration: 600,      // Cone fade out duration in ms
            windupCircleSize: 15,      // Windup circle size
            windupCircleAlpha: 0.3,    // Windup circle transparency
        },
        feedback: {
            flashDuration: 100,        // Duration of thrower's flash
            flashAlpha: 0.5,           // Alpha of thrower's flash
            spinDuration: 500,         // Duration of target's spin animation
            lineColor: 0xFF8800,       // Color of the line effect between players
            lineWidth: 4,              // Width of the line effect
            lineFadeDuration: 400,     // Line fade out duration in ms
        }
    },

    // Counter Action
    counter: {
        windupDuration: 500,           // Counter windup duration in ms
        activeDuration: 500,           // Counter active duration in ms
        visual: {
            windupCircleSize: 15,      // Size of windup circle
            windupCircleColor: 0xFFFFFF, // Initial color of windup circle (white)
            windupCircleAlpha: 0.3,    // Windup circle transparency
            activeCircleSize: 20,      // Size of active counter circle
            activeCircleColor: 0xFFFF00, // Active counter circle color (yellow)
            activeCircleAlpha: 0.4,    // Active counter circle transparency
            pulseSize: 20,             // Size of the pulse effect
            pulseColor: 0xFFFFFF,      // Pulse effect color (white)
            pulseAlpha: 0.6,           // Pulse effect transparency
            pulseScale: 1.5,           // How much pulse expands
        },
        feedback: {
            trianglePulsateSpeed: 4,   // Speed of indicator pulsating (multiplier for Math.PI)
            trianglePulsateAmount: 0.3, // Amount of pulsating 
            activePulsateSpeed: 0.3,   // Active counter pulsate amount
            pulsateCycleTime: 200,     // Time for one pulsate cycle in ms
            counterFlashSize: 30,      // Size of flash when counter succeeds
            counterFlashColor: 0xFFFF00, // Color of counter success flash
            counterFlashAlpha: 0.7,    // Alpha of counter success flash
            counterFlashScale: 2,      // Scale of counter success flash
            counterFlashDuration: 500, // Duration of counter flash animation
            lightningSegments: 6,      // Number of segments in lightning effect
            lightningWidth: 5,         // Width of lightning line
            lightningColor: 0xFFFF00,  // Color of lightning effect
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
            counterChanceVsThrow: 0.7, // Chance to counter when opponent is throwing
        }
    }
};

export default gameConfig;