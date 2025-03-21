import gameConfig from '../config/gameConfig';

/**
 * Advanced AI controller for the computer-controlled player
 */
export default class AIPlayer {
    constructor(scene, player, opponent, ringCenter, ringRadius) {
        this.scene = scene;
        this.player = player;         // AI-controlled player
        this.opponent = opponent;     // Human player
        this.ringCenter = ringCenter;
        this.ringRadius = ringRadius;
        
        // AI state tracking
        this.state = 'neutral';       // Current AI state: neutral, defensive, aggressive, counterReady
        this.actionTime = 0;          // Time until next action decision
        this.decisionFrequency = gameConfig.ai.decisionFrequency; // Make micro-decisions frequently
        this.playerPatterns = {       // Track opponent patterns
            throwAttempts: 0,
            counterAttempts: 0,
            pushAttempts: 0,
            lastActions: [],          // Last 5 actions
            preferredDirection: null  // Direction player favors
        };
        
        // Track match state
        this.roundsWon = 0;
        this.roundsLost = 0;
        this.currentRound = 1;
        
        // Threat assessment
        this.dangerLevel = 0;         // 0-10 scale of current danger
        this.opponentNearEdge = false;
        this.selfNearEdge = false;
        
        // Targeting
        this.predictedPosition = {x: 0, y: 0}; // Where we think opponent will be
        this.targetPosition = {x: 0, y: 0};    // Where AI wants to move to
        
        // Difficulty settings
        this.difficulty = 'medium';    // easy, medium, hard
        this.difficultySettings = gameConfig.ai.difficulties;
    }
    
    /**
     * Sets the AI difficulty level
     * @param {string} level - 'easy', 'medium', or 'hard'
     */
    setDifficulty(level) {
        if (['easy', 'medium', 'hard'].includes(level)) {
            this.difficulty = level;
        }
    }
    
    /**
     * Update method called every frame
     * @param {number} delta - Time since last frame
     */
    update(delta) {
        // Only update if the AI player can move
        if (!this.player.canMove) return;
        
        // Update timers
        this.actionTime -= delta;
        
        // Assess the current situation every frame
        this.assessSituation();
        
        // Make micro-decisions frequently
        if (this.actionTime <= 0) {
            this.actionTime = this.decisionFrequency;
            this.makeDecision(delta);
        }
        
        // Move toward the current target position
        this.moveToTarget();
    }
    
    /**
     * Assesses the current game state to inform AI decisions
     */
    assessSituation() {
        // Calculate positions and distances
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        // Check ring positions
        this.opponentNearEdge = this.isNearEdge(this.opponent);
        this.selfNearEdge = this.isNearEdge(this.player);
        
        // Calculate vectors
        const playerToCenter = {
            x: this.ringCenter.x - this.player.x,
            y: this.ringCenter.y - this.player.y
        };
        const opponentToCenter = {
            x: this.ringCenter.x - this.opponent.x,
            y: this.ringCenter.y - this.opponent.y
        };
        
        // Calculate danger level (0-10)
        this.dangerLevel = 0;
        
        // Increase danger when near edge
        if (this.selfNearEdge) {
            this.dangerLevel += 5;
        }
        
        // Adjust for opponent's position relative to edge and center
        if (this.opponentNearEdge) {
            // Less danger if opponent is near edge
            this.dangerLevel -= 2;
        }
        
        // Detect if opponent is between AI and center (pushing AI outward)
        const aiToOpponentDistance = distToOpponent;
        const aiToCenterDistance = Math.sqrt(playerToCenter.x * playerToCenter.x + playerToCenter.y * playerToCenter.y);
        const opponentToCenterDistance = Math.sqrt(opponentToCenter.x * opponentToCenter.x + opponentToCenter.y * opponentToCenter.y);
        
        if (aiToCenterDistance > opponentToCenterDistance && aiToOpponentDistance < aiToCenterDistance) {
            // Opponent is between AI and center - dangerous!
            this.dangerLevel += 3;
        }
        
        // Check if opponent is winding up for actions
        if (this.opponent.isThrowWindingUp) {
            this.dangerLevel += 7; // Very dangerous!
            this.state = 'counterReady';
        } else if (this.opponent.isCounterWindingUp || this.opponent.isCounterActive) {
            // Avoid throwing when opponent is countering
            this.dangerLevel += 2;
            this.state = 'defensive';
        } else {
            // Set state based on danger
            if (this.dangerLevel >= 7) {
                this.state = 'defensive';
            } else if (this.dangerLevel <= 3 && this.opponentNearEdge) {
                this.state = 'aggressive';
            } else {
                this.state = 'neutral';
            }
        }
        
        // Predict where opponent will be
        this.predictOpponentMovement();
    }
    
    /**
     * Checks if a player is near the edge of the ring
     * @param {Object} entity - Player to check
     * @returns {boolean} True if player is near edge
     */
    isNearEdge(entity) {
        const dx = entity.x - this.ringCenter.x;
        const dy = entity.y - this.ringCenter.y;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Consider "near edge" when within 60 pixels of boundary
        return (this.ringRadius - distanceFromCenter) < 60;
    }
    
    /**
     * Predicts opponent's future position based on movement
     */
    predictOpponentMovement() {
        // Get current velocity from physics body if available
        let velX = 0;
        let velY = 0;
        
        if (this.opponent.sprite && this.opponent.sprite.body) {
            velX = this.opponent.sprite.body.velocity.x;
            velY = this.opponent.sprite.body.velocity.y;
        }
        
        // Apply prediction factor based on difficulty
        const predictionStrength = this.difficultySettings[this.difficulty].prediction;
        const predictionTimeMs = 300 * predictionStrength; // Look ahead time in ms
        
        // Calculate predicted position
        this.predictedPosition = {
            x: this.opponent.x + (velX * predictionTimeMs / 1000),
            y: this.opponent.y + (velY * predictionTimeMs / 1000)
        };
        
        // Constrain prediction to within ring bounds
        const dx = this.predictedPosition.x - this.ringCenter.x;
        const dy = this.predictedPosition.y - this.ringCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.ringRadius - 20) {
            // Scale back to ring boundary
            const scale = (this.ringRadius - 20) / distance;
            this.predictedPosition.x = this.ringCenter.x + dx * scale;
            this.predictedPosition.y = this.ringCenter.y + dy * scale;
        }
    }
    
    /**
     * Makes a strategic decision about what action to take
     */
    makeDecision() {
        // Use difficulty to determine if we make optimal decision
        const decisionQuality = this.difficultySettings[this.difficulty].decisionQuality;
        
        // Random chance to make sub-optimal decision based on difficulty
        if (Math.random() > decisionQuality) {
            this.makeRandomDecision();
            return;
        }
        
        // Choose strategy based on current state
        switch (this.state) {
            case 'defensive':
                this.defensiveStrategy();
                break;
            case 'aggressive':
                this.aggressiveStrategy();
                break;
            case 'counterReady':
                this.counterStrategy();
                break;
            case 'neutral':
            default:
                this.neutralStrategy();
                break;
        }
    }
    
    /**
     * Takes random actions - used when making sub-optimal decisions
     */
    makeRandomDecision() {
        const action = Math.random();
        
        // Calculate distance to opponent
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        // Set movement target randomly but somewhat intelligently
        if (this.selfNearEdge) {
            // Move toward center when near edge
            this.targetPosition = {
                x: this.ringCenter.x + (Math.random() * 100 - 50),
                y: this.ringCenter.y + (Math.random() * 100 - 50)
            };
        } else if (distToOpponent < 80) {
            // Random direction when close to opponent
            const angle = Math.random() * Math.PI * 2;
            this.targetPosition = {
                x: this.player.x + Math.cos(angle) * 100,
                y: this.player.y + Math.sin(angle) * 100
            };
        } else {
            // Move somewhat toward opponent
            this.targetPosition = {
                x: this.player.x + dx * 0.7,
                y: this.player.y + dy * 0.7
            };
        }
        
        // Random action with some constraints
        if (action < 0.7 && distToOpponent < gameConfig.push.range) {
            // Push if close enough
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
            }
        } else if (action < 0.85 && distToOpponent < gameConfig.throw.range && !this.opponent.isCounterActive) {
            // Throw if in range and opponent not countering
            if (this.player.startThrow()) {
                // The throw will execute automatically after windup
                this.scene.time.delayedCall(gameConfig.throw.windupDuration, () => {
                    if (this.player.isThrowWindingUp) {
                        this.player.executeThrow();
                        this.scene.attemptThrow(this.player, this.opponent);
                    }
                });
            }
        } else if (action < 0.95 && !this.opponent.isThrowWindingUp) {
            // Counter sometimes, but not when it would be too late
            if (this.player.startCounter()) {
                // Counter will activate automatically after windup
            }
        }
    }
    
    /**
     * Defensive strategy - less passive, more tactical retreats
     */
    defensiveStrategy() {
        // Calculate vectors
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        const toCenter = {
            x: this.ringCenter.x - this.player.x,
            y: this.ringCenter.y - this.player.y
        };
        const distToCenter = Math.sqrt(toCenter.x * toCenter.x + toCenter.y * toCenter.y);
        
        // Calculate opponent's vector to center
        const opponentToCenter = {
            x: this.ringCenter.x - this.opponent.x,
            y: this.ringCenter.y - this.opponent.y
        };
        const opponentDistToCenter = Math.sqrt(opponentToCenter.x * opponentToCenter.x + opponentToCenter.y * opponentToCenter.y);
        
        // Even in defensive mode, look for opportunities to push
        if (distToOpponent < gameConfig.push.range * 0.9 && !this.selfNearEdge) {
            // If not in immediate danger from the edge, still try to push
            if (Math.random() < 0.65) {
                if (this.player.startPush()) {
                    this.scene.attemptPush(this.player, this.opponent);
                }
            }
        }
        
        // When in extreme danger, move away from opponent toward center
        if (this.selfNearEdge) {
            if (opponentDistToCenter < distToCenter && Math.random() < 0.4) {
                // Sometimes try to move around the opponent instead of straight to center
                // This helps avoid getting cornered
                
                // Calculate perpendicular vector to create a curved escape path
                const perpX = -dy / distToOpponent;
                const perpY = dx / distToOpponent;
                
                // Choose direction randomly
                const direction = Math.random() < 0.5 ? 1 : -1;
                
                // Move in an arc rather than straight to center
                this.targetPosition = {
                    x: this.player.x + toCenter.x * 0.5 + perpX * direction * 70,
                    y: this.player.y + toCenter.y * 0.5 + perpY * direction * 70
                };
            } else {
                // Move toward center but avoid opponent
                // Don't go straight to center - add some angle to avoid predictability
                const centerAngle = Math.atan2(toCenter.y, toCenter.x);
                const angleOffset = (Math.random() * 0.6 - 0.3); // -0.3 to +0.3 radians
                const moveDistance = distToCenter * 0.5;
                
                this.targetPosition = {
                    x: this.player.x + Math.cos(centerAngle + angleOffset) * moveDistance,
                    y: this.player.y + Math.sin(centerAngle + angleOffset) * moveDistance
                };
            }
        } else {
            // Still in a good position - be more strategic
            // Sometimes move laterally to find a better angle
            if (Math.random() < 0.4) {
                // Calculate perpendicular vector for sideways movement
                const perpX = -dy / distToOpponent;
                const perpY = dx / distToOpponent;
                
                // Choose direction randomly
                const direction = Math.random() < 0.5 ? 1 : -1;
                
                // Move sideways with a bit of backwards movement
                this.targetPosition = {
                    x: this.player.x - dx * 0.3 + perpX * direction * 60,
                    y: this.player.y - dy * 0.3 + perpY * direction * 60
                };
            } else {
                // Move to safer position with some randomness
                // Blend between moving away from opponent and toward center
                const blendFactor = Math.min(distToCenter / (this.ringRadius * 0.8), 1) * 
                                  gameConfig.ai.states.defensive.centerBias;
                
                // Add slight random variation to create less predictable movement
                const randomX = (Math.random() * 60) - 30;
                const randomY = (Math.random() * 60) - 30;
                
                this.targetPosition = {
                    x: this.player.x - dx * (1 - blendFactor) + toCenter.x * blendFactor * 0.5 + randomX,
                    y: this.player.y - dy * (1 - blendFactor) + toCenter.y * blendFactor * 0.5 + randomY
                };
            }
        }
        
        // When opponent is throw winding-up and in range, try to counter
        if (this.opponent.isThrowWindingUp && distToOpponent < gameConfig.throw.range * 1.2) {
            if (this.player.startCounter()) {
                // Counter activates automatically
                return;
            }
        }
        
        // Even in defensive mode, look for opportunities to push
        if (distToOpponent < gameConfig.push.range * 0.8) {
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
            }
        }
    }
    
    /**
     * Aggressive strategy - try to win
     */
    aggressiveStrategy() {
        // Calculate distances
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        // Get direction to opponent
        const dirX = dx / distToOpponent;
        const dirY = dy / distToOpponent;
        
        // If opponent is throwing, attempt a counter with high priority
        if (this.opponent.isThrowWindingUp) {
            // Higher chance to counter based on difficulty
            const counterChance = 0.8 * this.difficultySettings[this.difficulty].decisionQuality;
            if (Math.random() < counterChance) {
                if (this.player.startCounter()) {
                    return; // Counter activates automatically
                }
            }
        }
        
        // If opponent is near edge, position to push them out
        if (this.opponentNearEdge) {
            // Calculate vector from center to opponent
            const centerToOpponent = {
                x: this.opponent.x - this.ringCenter.x,
                y: this.opponent.y - this.ringCenter.y
            };
            
            // Normalize
            const dist = Math.sqrt(centerToOpponent.x * centerToOpponent.x + centerToOpponent.y * centerToOpponent.y);
            const normX = centerToOpponent.x / dist;
            const normY = centerToOpponent.y / dist;
            
            // Position slightly inside from opponent, between them and center
            this.targetPosition = {
                x: this.opponent.x - normX * 60,
                y: this.opponent.y - normY * 60
            };
            
            // Push when in position and in range - increased probability from implicit random check to explicit 85% chance
            if (distToOpponent < gameConfig.push.range * 0.9 && Math.random() < 0.85) {
                if (this.player.startPush()) {
                    this.scene.attemptPush(this.player, this.opponent);
                }
            }
        } 
        // Try to throw if opponent is not near edge but in range
        else if (distToOpponent < gameConfig.throw.range * 0.9 && 
                !this.opponent.isCounterActive && 
                !this.opponent.isCounterWindingUp) {
            // Position to face opponent directly
            this.targetPosition = {
                x: this.opponent.x - dirX * 60, // Stand a bit away
                y: this.opponent.y - dirY * 60
            };
            
            // Throw when we're facing the right direction - reduced throw frequency
            const throwChance = 0.7 * this.difficultySettings[this.difficulty].decisionQuality;
            if (this.isAlignedWithOpponent() && Math.random() < throwChance) {
                if (this.player.startThrow()) {
                    this.scene.time.delayedCall(gameConfig.throw.windupDuration, () => {
                        if (this.player.isThrowWindingUp) {
                            this.player.executeThrow();
                            this.scene.attemptThrow(this.player, this.opponent);
                        }
                    });
                }
            }
            // If not throwing, try pushing
            else if (distToOpponent < gameConfig.push.range * 0.9 && Math.random() < 0.7) {
                if (this.player.startPush()) {
                    this.scene.attemptPush(this.player, this.opponent);
                }
            }
        }
        // Otherwise move toward opponent
        else {
            // Target opponent's predicted position with factor from config
            const predictiveFactor = gameConfig.ai.states.aggressive.predictiveFactor;
            this.targetPosition = {
                x: this.player.x + (this.predictedPosition.x - this.player.x) * predictiveFactor - dirX * 50,
                y: this.player.y + (this.predictedPosition.y - this.player.y) * predictiveFactor - dirY * 50
            };
            
            // If within push range, have a high chance to push
            if (distToOpponent < gameConfig.push.range * 0.9 && Math.random() < 0.75) {
                if (this.player.startPush()) {
                    this.scene.attemptPush(this.player, this.opponent);
                }
            }
        }
    }
    
    /**
     * Counter strategy - used when opponent is winding up a throw
     */
    counterStrategy() {
        // Check how long the opponent has been winding up
        // Only counter if we think we can get it off in time
        // Higher difficulties have better reaction timing
        
        // If opponent is throwing, counter immediately with priority based on difficulty
        if (this.opponent.isThrowWindingUp) {
            // Base counter chance on difficulty and how long the throw has been winding up
            // This makes AI more likely to counter at the right time rather than too early
            const counterChance = gameConfig.ai.states.counterReady.counterPriority * 
                                this.difficultySettings[this.difficulty].decisionQuality;
            
            if (Math.random() < counterChance) {
                if (this.player.startCounter()) {
                    // Counter activates automatically
                    return;
                }
            }
        }
        
        // If still here, either counter failed to start or we need another strategy
        // In most cases, try to push instead of counter
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        if (distToOpponent < gameConfig.push.range) {
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
                return;
            }
        }
        
        // Otherwise use defensive strategy
        this.defensiveStrategy();
    }
    
    /**
     * Neutral strategy - more aggressive approach with variable behavior
     */
    neutralStrategy() {
        // Calculate distance to opponent
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const distToOpponent = Math.sqrt(dx * dx + dy * dy);
        
        // Determine if we should directly engage or try to flank based on situation
        // Add some randomness to make behavior less predictable
        const directEngagement = Math.random() < 0.7;
        
        // Calculate vectors to opponent and center
        const toCenter = {
            x: this.ringCenter.x - this.player.x,
            y: this.ringCenter.y - this.player.y
        };
        
        let targetX, targetY;
        
        // Prevent backing away too much - use a much closer ideal distance
        const closeCombatDistance = gameConfig.push.range * 0.9; // Stay within push range
        
        if (this.selfNearEdge) {
            // When near edge, move toward center but at an angle toward/away from opponent
            // Don't move directly to center, mix with opponent position
            const centerWeight = 0.7; // Prioritize getting away from edge
            const opponentWeight = 0.3; // But still keep opponent in mind
            
            const angleFactor = (Math.random() < 0.5) ? -0.3 : 0.3; // Random angle adjustment
            
            targetX = this.player.x + toCenter.x * centerWeight + dx * angleFactor;
            targetY = this.player.y + toCenter.y * centerWeight + dy * angleFactor;
        }
        // Close combat approach - get in push range and stay there
        else if (distToOpponent > closeCombatDistance || directEngagement) {
            // Calculate how aggressively to approach
            const approachFactor = 0.4 + (Math.random() * 0.4); // Between 0.4 and 0.8
            
            if (distToOpponent > closeCombatDistance * 2) {
                // Far away - approach directly but with slight angle variation
                const angle = Math.atan2(dy, dx) + (Math.random() * 0.5 - 0.25); // ±0.25 radians variation
                const moveDistance = approachFactor * distToOpponent;
                
                targetX = this.player.x + Math.cos(angle) * moveDistance;
                targetY = this.player.y + Math.sin(angle) * moveDistance;
            } else {
                // Close enough - move to striking distance with some angle variation
                const circleAmount = (Math.random() < 0.4) ? 0.4 : 0; // Sometimes circle, sometimes direct
                
                // Calculate perpendicular vector for subtle circling
                const perpX = -dy / distToOpponent;
                const perpY = dx / distToOpponent;
                
                // Move toward opponent with slight sideways motion for more organic movement
                targetX = this.player.x + dx * approachFactor + perpX * circleAmount * 40;
                targetY = this.player.y + dy * approachFactor + perpY * circleAmount * 40;
            }
        } 
        // Flanking approach - try to get an angle
        else {
            // Get a vector perpendicular to the line between opponent and center
            const opponentToCenter = {
                x: this.ringCenter.x - this.opponent.x,
                y: this.ringCenter.y - this.opponent.y
            };
            
            // Normalize this vector
            const otcLength = Math.sqrt(opponentToCenter.x * opponentToCenter.x + opponentToCenter.y * opponentToCenter.y);
            const normOtcX = opponentToCenter.x / otcLength;
            const normOtcY = opponentToCenter.y / otcLength;
            
            // Get perpendicular vector (rotated 90 degrees)
            const perpX = -normOtcY;
            const perpY = normOtcX;
            
            // Choose direction randomly but with persistence
            const flankDirection = (Math.random() < 0.9) ? 1 : -1; // 90% chance to maintain current direction
            
            // Move to a position that's both close to opponent and at an angle to center
            // This creates a flanking movement that tries to get behind the opponent toward the edge
            targetX = this.opponent.x + perpX * flankDirection * 70 - normOtcX * 30;
            targetY = this.opponent.y + perpY * flankDirection * 70 - normOtcY * 30;
        }
        
        // Adjust target to avoid going near the edge - more permissive to allow closer edge play
        const targetToCenter = {
            x: this.ringCenter.x - targetX,
            y: this.ringCenter.y - targetY
        };
        const targetDistToCenter = Math.sqrt(targetToCenter.x * targetToCenter.x + targetToCenter.y * targetToCenter.y);
        
        if (targetDistToCenter > this.ringRadius - 40) { // Smaller safety margin
            // Too close to edge, adjust toward center but not as much as before
            const adjustment = (targetDistToCenter - (this.ringRadius - 40)) / targetDistToCenter;
            targetX += targetToCenter.x * adjustment * 0.7; // Only 70% correction to allow more aggressive play
            targetY += targetToCenter.y * adjustment * 0.7;
        }
        
        this.targetPosition = { x: targetX, y: targetY };
        
        // Choose actions based on the situation - more aggressive behavior
        
        // If opponent is countering, don't throw
        if (this.opponent.isCounterActive || this.opponent.isCounterWindingUp) {
            // Try to push if in range
            if (distToOpponent < gameConfig.push.range * 0.9) {
                if (this.player.startPush()) {
                    this.scene.attemptPush(this.player, this.opponent);
                }
            }
        } 
        // If opponent is throwing, counter only if the timing is right
        else if (this.opponent.isThrowWindingUp) {
            if (Math.random() < 0.7 * this.difficultySettings[this.difficulty].decisionQuality) {
                if (this.player.startCounter()) {
                    // Counter activates automatically
                }
            }
        }
        // More frequent throw attempts when in position
        else if (distToOpponent < gameConfig.throw.range * 0.8 && Math.random() < 0.3 && this.isAlignedWithOpponent()) {
            if (this.player.startThrow()) {
                this.scene.time.delayedCall(gameConfig.throw.windupDuration, () => {
                    if (this.player.isThrowWindingUp) {
                        this.player.executeThrow();
                        this.scene.attemptThrow(this.player, this.opponent);
                    }
                });
            }
        }
        // Higher push probability - most common action
        else if (distToOpponent < gameConfig.push.range && Math.random() < 0.7) {
            if (this.player.startPush()) {
                this.scene.attemptPush(this.player, this.opponent);
            }
        }
    }
    
    /**
     * Checks if AI is well-aligned with opponent for actions
     * @returns {boolean} True if aligned
     */
    isAlignedWithOpponent() {
        // Direction vectors for each direction
        const directionVectors = {
            'up': { x: 0, y: -1 },
            'up-right': { x: 0.7071, y: -0.7071 },
            'right': { x: 1, y: 0 },
            'down-right': { x: 0.7071, y: 0.7071 },
            'down': { x: 0, y: 1 },
            'down-left': { x: -0.7071, y: 0.7071 },
            'left': { x: -1, y: 0 },
            'up-left': { x: -0.7071, y: -0.7071 }
        };
        
        // Get current direction vector
        const dirVector = directionVectors[this.player.direction];
        
        // Calculate vector to opponent
        const dx = this.opponent.x - this.player.x;
        const dy = this.opponent.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize
        const toOpponentX = dx / dist;
        const toOpponentY = dy / dist;
        
        // Calculate dot product (how aligned the vectors are)
        const dotProduct = dirVector.x * toOpponentX + dirVector.y * toOpponentY;
        
        // Consider aligned if dot product is high (vectors pointing in similar directions)
        return dotProduct > 0.7; // Roughly 45 degrees or less
    }
    
    /**
     * Moves the AI character toward the current target position with more organic movement
     */
    moveToTarget() {
        // Skip movement if the player is casting an action that prevents movement
        if (!this.player.canMove || 
            this.player.isThrowWindingUp || 
            this.player.isCounterWindingUp || 
            this.player.isCounterActive) {
            return;
        }
        
        // Calculate direction vector to target
        const dx = this.targetPosition.x - this.player.x;
        const dy = this.targetPosition.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If already at target (or very close), don't move
        if (distance < 5) {
            this.player.setVelocity(0, 0);
            return;
        }
        
        // Add subtle movement variations for more organic movement
        // Calculate a "jitter" factor based on the AI difficulty - lower difficulties have more erratic movement
        const jitterFactor = 0.2 - (this.difficultySettings[this.difficulty].positionAccuracy * 0.15);
        
        // Apply small random adjustments to movement vector
        const jitterX = (Math.random() * 2 - 1) * jitterFactor * gameConfig.player.aiSpeed;
        const jitterY = (Math.random() * 2 - 1) * jitterFactor * gameConfig.player.aiSpeed;
        
        // Normalize direction
        const speedFactor = 0.85 + (Math.random() * 0.3); // Speed varies between 85% and 115%
        const speed = gameConfig.player.aiSpeed * speedFactor;
        
        let moveX = (dx / distance * speed) + jitterX;
        let moveY = (dy / distance * speed) + jitterY;
        
        // Determine facing direction from movement
        let direction = '';
        if (moveY < -0.5 * speed) direction = 'up';
        else if (moveY > 0.5 * speed) direction = 'down';
        
        if (moveX < -0.5 * speed) {
            direction = direction ? direction + '-left' : 'left';
        } else if (moveX > 0.5 * speed) {
            direction = direction ? direction + '-right' : 'right';
        }
        
        // Update direction
        if (direction) {
            this.player.setDirection(direction);
        }
        
        // Occasional deliberate direction changes for more human-like movement
        // This makes the AI sometimes look in a different direction than it's moving
        if (Math.random() < 0.05) {  // 5% chance each frame
            const directions = ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];
            const randomDirection = directions[Math.floor(Math.random() * directions.length)];
            this.player.setDirection(randomDirection);
        }
        
        // Apply movement
        this.player.setVelocity(moveX, moveY);
    }
    
    /**
     * Update the AI when a new round starts
     */
    newRound(roundNumber, playerWins, aiWins) {
        this.currentRound = roundNumber;
        this.roundsWon = aiWins;
        this.roundsLost = playerWins;
        
        // Reset state
        this.state = 'neutral';
        this.actionTime = 0;
        
        // Adjust strategy based on match progress
        if (this.roundsLost > this.roundsWon) {
            // Behind in score, be more aggressive
            this.difficultySettings.easy.decisionQuality += 0.1;
            this.difficultySettings.medium.decisionQuality += 0.1;
            this.difficultySettings.hard.decisionQuality += 0.05;
        }
    }
}