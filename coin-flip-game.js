// =========================================================================
// 💰 PAK908 COIN FLIP GAME ENGINE
// =========================================================================

const COIN_FLIP_CONFIG = {
    name: "Coin Flip",
    minBet: 20,
    maxBet: 2000,
    sides: ['HEADS', 'TAILS'],
    multiplier: 1.95
};

let COIN_FLIP_STATE = {
    status: 'idle', // idle, flipping, result
    currentFlip: null,
    activeBet: null,
    flipHistory: []
};

// =========================================================================
// 💰 COIN FLIP LOGIC
// =========================================================================
function flipCoin() {
    const result = Math.random() < 0.5 ? 'HEADS' : 'TAILS';
    
    return {
        result,
        isHeads: result === 'HEADS',
        isTails: result === 'TAILS',
        timestamp: Date.now()
    };
}

function evaluateCoinBet(flip, prediction) {
    return flip.result === prediction;
}

// =========================================================================
// 💰 PLAYER BET PLACEMENT & RESOLUTION
// =========================================================================
function placeCoinFlipBet(player, betAmount, prediction) {
    // Validation
    if (betAmount < COIN_FLIP_CONFIG.minBet || betAmount > COIN_FLIP_CONFIG.maxBet) {
        return { 
            success: false, 
            error: `Bet must be between Rs.${COIN_FLIP_CONFIG.minBet} and Rs.${COIN_FLIP_CONFIG.maxBet}` 
        };
    }

    if (player.walletBalance < betAmount) {
        return { success: false, error: "Insufficient balance" };
    }

    if (!['HEADS', 'TAILS'].includes(prediction)) {
        return { success: false, error: "Invalid prediction. Choose HEADS or TAILS" };
    }

    // Deduct bet from wallet
    player.walletBalance -= betAmount;

    COIN_FLIP_STATE.activeBet = {
        playerId: player.id,
        playerName: player.username,
        betAmount,
        prediction,
        placedAt: Date.now()
    };

    return { success: true, message: "Coin flip bet placed. Flipping coin..." };
}

function resolveCoinFlipBet() {
    if (!COIN_FLIP_STATE.activeBet) {
        return { success: false, error: "No active bet" };
    }

    const flip = flipCoin();
    const bet = COIN_FLIP_STATE.activeBet;
    const isWin = evaluateCoinBet(flip, bet.prediction);

    let payout = 0;
    if (isWin) {
        payout = Math.floor(bet.betAmount * COIN_FLIP_CONFIG.multiplier);
    }

    COIN_FLIP_STATE.currentFlip = flip;
    COIN_FLIP_STATE.status = 'result';

    const result = {
        playerName: bet.playerName,
        betAmount: bet.betAmount,
        prediction: bet.prediction,
        result: flip.result,
        isWin,
        payout,
        timestamp: Date.now()
    };

    COIN_FLIP_STATE.flipHistory.push(result);
    if (COIN_FLIP_STATE.flipHistory.length > 50) {
        COIN_FLIP_STATE.flipHistory.shift();
    }

    COIN_FLIP_STATE.activeBet = null;

    return {
        success: true,
        flip,
        isWin,
        payout,
        result
    };
}

// =========================================================================
// 💰 STATISTICS
// =========================================================================
function getCoinFlipStats() {
    const history = COIN_FLIP_STATE.flipHistory;
    const headsCount = history.filter(f => f.result === 'HEADS').length;
    const tailsCount = history.filter(f => f.result === 'TAILS').length;

    return {
        totalFlips: history.length,
        headsCount,
        tailsCount,
        headsPercentage: history.length > 0 ? ((headsCount / history.length) * 100).toFixed(2) : 50,
        tailsPercentage: history.length > 0 ? ((tailsCount / history.length) * 100).toFixed(2) : 50
    };
}

// =========================================================================
// 💰 EXPORTS
// =========================================================================
module.exports = {
    COIN_FLIP_CONFIG,
    COIN_FLIP_STATE,
    flipCoin,
    evaluateCoinBet,
    placeCoinFlipBet,
    resolveCoinFlipBet,
    getCoinFlipStats
};
