// =========================================================================
// 🎡 PAK908 ROULETTE GAME ENGINE
// =========================================================================

const ROULETTE_GAME_CONFIG = {
    name: "Classic Roulette",
    minBet: 20,
    maxBet: 2000,
    wheelNumbers: Array.from({ length: 37 }, (_, i) => i), // 0-36
    colors: {
        0: 'green',
        // Red: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
        // Black: 2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
    },
    betTypes: {
        SINGLE: { name: "Single Number", multiplier: 35, winChance: 0.0270 },
        RED: { name: "Red", multiplier: 1.95, winChance: 0.4865 },
        BLACK: { name: "Black", multiplier: 1.95, winChance: 0.4865 },
        ODD: { name: "Odd Numbers", multiplier: 1.95, winChance: 0.4865 },
        EVEN: { name: "Even Numbers", multiplier: 1.95, winChance: 0.4865 },
        DOZEN_1: { name: "First Dozen (1-12)", multiplier: 2.95, winChance: 0.3243 },
        DOZEN_2: { name: "Second Dozen (13-24)", multiplier: 2.95, winChance: 0.3243 },
        DOZEN_3: { name: "Third Dozen (25-36)", multiplier: 2.95, winChance: 0.3243 },
        COLUMN_1: { name: "First Column", multiplier: 2.95, winChance: 0.3243 },
        COLUMN_2: { name: "Second Column", multiplier: 2.95, winChance: 0.3243 },
        COLUMN_3: { name: "Third Column", multiplier: 2.95, winChance: 0.3243 },
        LOW: { name: "Low (1-18)", multiplier: 1.95, winChance: 0.4865 },
        HIGH: { name: "High (19-36)", multiplier: 1.95, winChance: 0.4865 }
    }
};

// Initialize color map
for (let i = 1; i <= 36; i++) {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    ROULETTE_GAME_CONFIG.colors[i] = redNumbers.includes(i) ? 'red' : 'black';
}

let ROULETTE_ROOM_STATE = {
    status: 'idle', // idle, spinning, result
    currentSpin: null,
    lastWinner: null,
    activeBet: null,
    spinHistory: [],
    wheelRotation: 0
};

// =========================================================================
// 🎡 ROULETTE SPIN LOGIC
// =========================================================================
function spinWheel() {
    // Generate random number 0-36
    const winningNumber = Math.floor(Math.random() * 37);
    const color = ROULETTE_GAME_CONFIG.colors[winningNumber];
    
    // Simulate wheel rotation (0-360 degrees)
    const rotation = Math.random() * 360;

    return {
        winningNumber,
        color,
        rotation,
        timestamp: Date.now()
    };
}

function getNumberColor(number) {
    return ROULETTE_GAME_CONFIG.colors[number] || 'green';
}

function evaluateRouletteBet(spin, betType, betValue = null) {
    const { winningNumber, color } = spin;
    let isWin = false;

    switch (betType) {
        case 'SINGLE':
            isWin = winningNumber === betValue;
            break;
        case 'RED':
            isWin = color === 'red';
            break;
        case 'BLACK':
            isWin = color === 'black';
            break;
        case 'ODD':
            isWin = winningNumber !== 0 && winningNumber % 2 !== 0;
            break;
        case 'EVEN':
            isWin = winningNumber !== 0 && winningNumber % 2 === 0;
            break;
        case 'DOZEN_1':
            isWin = winningNumber >= 1 && winningNumber <= 12;
            break;
        case 'DOZEN_2':
            isWin = winningNumber >= 13 && winningNumber <= 24;
            break;
        case 'DOZEN_3':
            isWin = winningNumber >= 25 && winningNumber <= 36;
            break;
        case 'COLUMN_1':
            isWin = winningNumber > 0 && winningNumber % 3 === 1;
            break;
        case 'COLUMN_2':
            isWin = winningNumber > 0 && winningNumber % 3 === 2;
            break;
        case 'COLUMN_3':
            isWin = winningNumber > 0 && winningNumber % 3 === 0;
            break;
        case 'LOW':
            isWin = winningNumber >= 1 && winningNumber <= 18;
            break;
        case 'HIGH':
            isWin = winningNumber >= 19 && winningNumber <= 36;
            break;
        default:
            isWin = false;
    }

    return isWin;
}

// =========================================================================
// 🎡 PLAYER BET PLACEMENT & RESOLUTION
// =========================================================================
function placeRouletteBet(player, betAmount, betType, betValue = null) {
    // Validation
    if (betAmount < ROULETTE_GAME_CONFIG.minBet || betAmount > ROULETTE_GAME_CONFIG.maxBet) {
        return { 
            success: false, 
            error: `Bet must be between Rs.${ROULETTE_GAME_CONFIG.minBet} and Rs.${ROULETTE_GAME_CONFIG.maxBet}` 
        };
    }

    if (player.walletBalance < betAmount) {
        return { success: false, error: "Insufficient balance" };
    }

    if (!ROULETTE_GAME_CONFIG.betTypes[betType]) {
        return { success: false, error: "Invalid bet type" };
    }

    // For single number bets, validate number is 0-36
    if (betType === 'SINGLE' && (betValue < 0 || betValue > 36)) {
        return { success: false, error: "Invalid number. Choose 0-36" };
    }

    // Deduct bet from wallet
    player.walletBalance -= betAmount;

    // Store active bet
    ROULETTE_ROOM_STATE.activeBet = {
        playerId: player.id,
        playerName: player.username,
        betAmount,
        betType,
        betValue,
        placedAt: Date.now()
    };

    return { success: true, message: "Roulette bet placed successfully" };
}

function resolveRouletteBet() {
    if (!ROULETTE_ROOM_STATE.activeBet) {
        return { success: false, error: "No active bet" };
    }

    const spin = spinWheel();
    const bet = ROULETTE_ROOM_STATE.activeBet;
    const isWin = evaluateRouletteBet(spin, bet.betType, bet.betValue);
    const gameConfig = ROULETTE_GAME_CONFIG.betTypes[bet.betType];

    let payout = 0;
    if (isWin) {
        payout = Math.floor(bet.betAmount * gameConfig.multiplier);
    }

    ROULETTE_ROOM_STATE.currentSpin = spin;
    ROULETTE_ROOM_STATE.status = 'result';
    ROULETTE_ROOM_STATE.lastWinner = {
        playerName: bet.playerName,
        betType: bet.betType,
        betValue: bet.betValue,
        betAmount: bet.betAmount,
        winningNumber: spin.winningNumber,
        color: spin.color,
        isWin,
        payout,
        timestamp: Date.now()
    };

    // Update spin history
    ROULETTE_ROOM_STATE.spinHistory.push(ROULETTE_ROOM_STATE.lastWinner);
    if (ROULETTE_ROOM_STATE.spinHistory.length > 30) {
        ROULETTE_ROOM_STATE.spinHistory.shift();
    }

    ROULETTE_ROOM_STATE.activeBet = null;

    return {
        success: true,
        spin,
        isWin,
        payout,
        winningNumber: spin.winningNumber,
        color: spin.color
    };
}

// =========================================================================
// 🎡 HELPER FUNCTIONS
// =========================================================================
function getRouletteStats() {
    const history = ROULETTE_ROOM_STATE.spinHistory;
    const redCount = history.filter(s => s.color === 'red').length;
    const blackCount = history.filter(s => s.color === 'black').length;
    const greenCount = history.filter(s => s.color === 'green').length;

    return {
        totalSpins: history.length,
        redCount,
        blackCount,
        greenCount,
        redPercentage: history.length > 0 ? ((redCount / history.length) * 100).toFixed(2) : 0,
        blackPercentage: history.length > 0 ? ((blackCount / history.length) * 100).toFixed(2) : 0,
        greenPercentage: history.length > 0 ? ((greenCount / history.length) * 100).toFixed(2) : 0
    };
}

// =========================================================================
// 🎡 EXPORTS
// =========================================================================
module.exports = {
    ROULETTE_GAME_CONFIG,
    ROULETTE_ROOM_STATE,
    spinWheel,
    getNumberColor,
    evaluateRouletteBet,
    placeRouletteBet,
    resolveRouletteBet,
    getRouletteStats
};
