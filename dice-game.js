// =========================================================================
// 🎲 PAK908 DICE GAME ENGINE
// =========================================================================

const DICE_GAME_CONFIG = {
    name: "Dice Roller",
    minBet: 20,
    maxBet: 2000,
    gameTypes: {
        OVER: { name: "Over 3.5", multiplier: 1.95, winChance: 0.5 },
        UNDER: { name: "Under 3.5", multiplier: 1.95, winChance: 0.5 },
        ODD: { name: "Odd", multiplier: 1.95, winChance: 0.5 },
        EVEN: { name: "Even", multiplier: 1.95, winChance: 0.5 },
        SPECIFIC: { name: "Specific Number", multiplier: 5.5, winChance: 0.1667 }
    }
};

let DICE_ROOM_STATE = {
    status: 'idle', // idle, rolling, result
    currentRoll: null,
    lastWinner: null,
    activeBet: null,
    rollHistory: []
};

// =========================================================================
// 🎲 DICE ROLL LOGIC
// =========================================================================
function rollDice() {
    // Roll 2 dice (1-6 each), return sum (2-12)
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    return {
        dice1,
        dice2,
        total: dice1 + dice2,
        timestamp: Date.now()
    };
}

function evaluateDiceBet(roll, betType, specificNumber = null) {
    const { total } = roll;
    let isWin = false;

    switch (betType) {
        case 'OVER':
            isWin = total > 3.5; // 4-12 wins
            break;
        case 'UNDER':
            isWin = total < 3.5; // 2-3 wins
            break;
        case 'ODD':
            isWin = total % 2 !== 0;
            break;
        case 'EVEN':
            isWin = total % 2 === 0;
            break;
        case 'SPECIFIC':
            isWin = total === specificNumber;
            break;
        default:
            isWin = false;
    }

    return isWin;
}

// =========================================================================
// 🎲 PLAYER BET PLACEMENT & RESOLUTION
// =========================================================================
function placeDiceBet(player, betAmount, betType, specificNumber = null) {
    // Validation
    if (betAmount < DICE_GAME_CONFIG.minBet || betAmount > DICE_GAME_CONFIG.maxBet) {
        return { success: false, error: `Bet must be between Rs.${DICE_GAME_CONFIG.minBet} and Rs.${DICE_GAME_CONFIG.maxBet}` };
    }

    if (player.walletBalance < betAmount) {
        return { success: false, error: "Insufficient balance" };
    }

    if (!DICE_GAME_CONFIG.gameTypes[betType]) {
        return { success: false, error: "Invalid bet type" };
    }

    // Deduct bet from wallet
    player.walletBalance -= betAmount;

    // Store active bet
    DICE_ROOM_STATE.activeBet = {
        playerId: player.id,
        playerName: player.username,
        betAmount,
        betType,
        specificNumber,
        placedAt: Date.now()
    };

    return { success: true, message: "Bet placed successfully" };
}

function resolveDiceBet() {
    if (!DICE_ROOM_STATE.activeBet) {
        return { success: false, error: "No active bet" };
    }

    const roll = rollDice();
    const bet = DICE_ROOM_STATE.activeBet;
    const isWin = evaluateDiceBet(roll, bet.betType, bet.specificNumber);
    const gameConfig = DICE_GAME_CONFIG.gameTypes[bet.betType];

    let payout = 0;
    if (isWin) {
        payout = Math.floor(bet.betAmount * gameConfig.multiplier);
    }

    DICE_ROOM_STATE.currentRoll = roll;
    DICE_ROOM_STATE.status = 'result';
    DICE_ROOM_STATE.lastWinner = {
        playerName: bet.playerName,
        betType: bet.betType,
        betAmount: bet.betAmount,
        roll: roll.total,
        isWin,
        payout,
        timestamp: Date.now()
    };

    // Update roll history
    DICE_ROOM_STATE.rollHistory.push(DICE_ROOM_STATE.lastWinner);
    if (DICE_ROOM_STATE.rollHistory.length > 20) {
        DICE_ROOM_STATE.rollHistory.shift();
    }

    DICE_ROOM_STATE.activeBet = null;

    return {
        success: true,
        roll,
        isWin,
        payout,
        totalRoll: roll.total
    };
}

// =========================================================================
// 🎲 EXPORTS
// =========================================================================
module.exports = {
    DICE_GAME_CONFIG,
    DICE_ROOM_STATE,
    rollDice,
    evaluateDiceBet,
    placeDiceBet,
    resolveDiceBet
};
