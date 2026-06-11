// =========================================================================
// 🎯 PAK908 WHEEL OF FORTUNE GAME ENGINE
// =========================================================================

const WHEEL_CONFIG = {
    name: "Wheel of Fortune",
    minBet: 20,
    maxBet: 2000,
    segments: [
        { id: 1, label: '2x', multiplier: 2.0, color: '#ff6b6b', angle: 0 },
        { id: 2, label: '5x', multiplier: 5.0, color: '#4ecdc4', angle: 45 },
        { id: 3, label: '1.5x', multiplier: 1.5, color: '#ffe66d', angle: 90 },
        { id: 4, label: '10x', multiplier: 10.0, color: '#95e1d3', angle: 135 },
        { id: 5, label: '0.5x', multiplier: 0.5, color: '#ff8c94', angle: 180 },
        { id: 6, label: '3x', multiplier: 3.0, color: '#a8dadc', angle: 225 },
        { id: 7, label: '1.2x', multiplier: 1.2, color: '#f1faee', angle: 270 },
        { id: 8, label: '8x', multiplier: 8.0, color: '#ffd166', angle: 315 }
    ]
};

let WHEEL_STATE = {
    status: 'idle', // idle, spinning, stopped
    currentSpin: null,
    winningSegment: null,
    activeBet: null,
    spinHistory: [],
    wheelRotation: 0
};

// =========================================================================
// 🎯 WHEEL SPIN LOGIC
// =========================================================================
function spinWheel() {
    // Select random segment (0-7, representing 8 segments)
    const segmentIndex = Math.floor(Math.random() * WHEEL_CONFIG.segments.length);
    const winningSegment = WHEEL_CONFIG.segments[segmentIndex];

    // Calculate final rotation (multiple full rotations + final position)
    const fullRotations = 3 + Math.random() * 2; // 3-5 full rotations
    const finalAngle = winningSegment.angle;
    const totalRotation = (fullRotations * 360) + finalAngle;

    return {
        segmentIndex,
        winningSegment,
        rotation: totalRotation,
        finalAngle,
        timestamp: Date.now()
    };
}

function getSegmentByIndex(index) {
    if (index >= 0 && index < WHEEL_CONFIG.segments.length) {
        return WHEEL_CONFIG.segments[index];
    }
    return null;
}

// =========================================================================
// 🎯 PLAYER BET PLACEMENT & RESOLUTION
// =========================================================================
function placeWheelBet(player, betAmount) {
    // Validation
    if (betAmount < WHEEL_CONFIG.minBet || betAmount > WHEEL_CONFIG.maxBet) {
        return { 
            success: false, 
            error: `Bet must be between Rs.${WHEEL_CONFIG.minBet} and Rs.${WHEEL_CONFIG.maxBet}` 
        };
    }

    if (player.walletBalance < betAmount) {
        return { success: false, error: "Insufficient balance" };
    }

    // Deduct bet from wallet
    player.walletBalance -= betAmount;

    WHEEL_STATE.activeBet = {
        playerId: player.id,
        playerName: player.username,
        betAmount,
        placedAt: Date.now()
    };

    WHEEL_STATE.status = 'spinning';

    return { success: true, message: "Spinning the wheel..." };
}

function resolveWheelBet() {
    if (!WHEEL_STATE.activeBet) {
        return { success: false, error: "No active bet" };
    }

    const spin = spinWheel();
    const bet = WHEEL_STATE.activeBet;
    const winningSegment = spin.winningSegment;

    const payout = Math.floor(bet.betAmount * winningSegment.multiplier);

    WHEEL_STATE.currentSpin = spin;
    WHEEL_STATE.winningSegment = winningSegment;
    WHEEL_STATE.status = 'stopped';
    WHEEL_STATE.wheelRotation = spin.rotation;

    const result = {
        playerName: bet.playerName,
        betAmount: bet.betAmount,
        winningSegment: winningSegment.label,
        multiplier: winningSegment.multiplier,
        payout,
        timestamp: Date.now()
    };

    WHEEL_STATE.spinHistory.push(result);
    if (WHEEL_STATE.spinHistory.length > 30) {
        WHEEL_STATE.spinHistory.shift();
    }

    WHEEL_STATE.activeBet = null;

    return {
        success: true,
        spin,
        winningSegment,
        payout,
        result
    };
}

// =========================================================================
// 🎯 STATISTICS
// =========================================================================
function getWheelStats() {
    const history = WHEEL_STATE.spinHistory;
    const segmentStats = {};

    // Initialize all segments
    WHEEL_CONFIG.segments.forEach(segment => {
        segmentStats[segment.label] = {
            count: 0,
            totalPayout: 0,
            percentage: 0
        };
    });

    // Count occurrences
    history.forEach(result => {
        if (segmentStats[result.winningSegment]) {
            segmentStats[result.winningSegment].count++;
            segmentStats[result.winningSegment].totalPayout += result.payout;
        }
    });

    // Calculate percentages
    if (history.length > 0) {
        Object.keys(segmentStats).forEach(label => {
            segmentStats[label].percentage = (
                (segmentStats[label].count / history.length) * 100
            ).toFixed(2);
        });
    }

    return {
        totalSpins: history.length,
        segmentStats,
        lastWinner: history.length > 0 ? history[history.length - 1] : null
    };
}

function getMostLandedSegment() {
    const stats = getWheelStats();
    let maxCount = 0;
    let mostLanded = null;

    Object.entries(stats.segmentStats).forEach(([label, data]) => {
        if (data.count > maxCount) {
            maxCount = data.count;
            mostLanded = label;
        }
    });

    return mostLanded;
}

// =========================================================================
// 🎯 EXPORTS
// =========================================================================
module.exports = {
    WHEEL_CONFIG,
    WHEEL_STATE,
    spinWheel,
    getSegmentByIndex,
    placeWheelBet,
    resolveWheelBet,
    getWheelStats,
    getMostLandedSegment
};
