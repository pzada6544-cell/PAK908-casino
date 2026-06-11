// =========================================================================
// 🃏 PAK908 HI-LO CARD GAME ENGINE
// =========================================================================

const CARD_GAME_CONFIG = {
    name: "Hi-Lo Card Game",
    minBet: 20,
    maxBet: 2000,
    suits: ['♠', '♥', '♦', '♣'],
    ranks: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],
    rankValues: {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
};

let CARD_ROOM_STATE = {
    status: 'idle', // idle, dealt, revealed
    currentCard: null,
    nextCard: null,
    activeBet: null,
    gameHistory: []
};

// =========================================================================
// 🃏 CARD GENERATION & LOGIC
// =========================================================================
function generateCard() {
    const suit = CARD_GAME_CONFIG.suits[Math.floor(Math.random() * 4)];
    const rank = CARD_GAME_CONFIG.ranks[Math.floor(Math.random() * 13)];
    const value = CARD_GAME_CONFIG.rankValues[rank];
    
    return {
        suit,
        rank,
        value,
        display: `${rank}${suit}`,
        timestamp: Date.now()
    };
}

function evaluateCardBet(currentCard, nextCard, prediction) {
    const currentValue = currentCard.value;
    const nextValue = nextCard.value;

    let isWin = false;

    if (prediction === 'HIGHER') {
        isWin = nextValue > currentValue;
    } else if (prediction === 'LOWER') {
        isWin = nextValue < currentValue;
    } else if (prediction === 'EQUAL') {
        isWin = nextValue === currentValue;
    }

    return isWin;
}

// =========================================================================
// 🃏 PLAYER BET PLACEMENT & RESOLUTION
// =========================================================================
function placeCardBet(player, betAmount, prediction) {
    // Validation
    if (betAmount < CARD_GAME_CONFIG.minBet || betAmount > CARD_GAME_CONFIG.maxBet) {
        return { 
            success: false, 
            error: `Bet must be between Rs.${CARD_GAME_CONFIG.minBet} and Rs.${CARD_GAME_CONFIG.maxBet}` 
        };
    }

    if (player.walletBalance < betAmount) {
        return { success: false, error: "Insufficient balance" };
    }

    if (!['HIGHER', 'LOWER', 'EQUAL'].includes(prediction)) {
        return { success: false, error: "Invalid prediction. Choose HIGHER, LOWER, or EQUAL" };
    }

    // Deduct bet from wallet
    player.walletBalance -= betAmount;

    // Deal first card
    const firstCard = generateCard();

    CARD_ROOM_STATE.activeBet = {
        playerId: player.id,
        playerName: player.username,
        betAmount,
        prediction,
        placedAt: Date.now()
    };

    CARD_ROOM_STATE.currentCard = firstCard;
    CARD_ROOM_STATE.status = 'dealt';

    return { 
        success: true, 
        message: "Card dealt. Predict if next card is Higher, Lower, or Equal",
        card: firstCard 
    };
}

function resolveCardBet() {
    if (!CARD_ROOM_STATE.activeBet || !CARD_ROOM_STATE.currentCard) {
        return { success: false, error: "No active game" };
    }

    const nextCard = generateCard();
    const bet = CARD_ROOM_STATE.activeBet;
    const isWin = evaluateCardBet(CARD_ROOM_STATE.currentCard, nextCard, bet.prediction);

    let payout = 0;
    let multiplier = 1.95; // Standard multiplier for Hi-Lo

    if (isWin) {
        payout = Math.floor(bet.betAmount * multiplier);
    }

    CARD_ROOM_STATE.nextCard = nextCard;
    CARD_ROOM_STATE.status = 'revealed';

    const result = {
        playerName: bet.playerName,
        betAmount: bet.betAmount,
        prediction: bet.prediction,
        currentCard: CARD_ROOM_STATE.currentCard.display,
        nextCard: nextCard.display,
        isWin,
        payout,
        timestamp: Date.now()
    };

    CARD_ROOM_STATE.gameHistory.push(result);
    if (CARD_ROOM_STATE.gameHistory.length > 25) {
        CARD_ROOM_STATE.gameHistory.shift();
    }

    CARD_ROOM_STATE.activeBet = null;

    return {
        success: true,
        nextCard,
        isWin,
        payout,
        result
    };
}

// =========================================================================
// 🃏 EXPORTS
// =========================================================================
module.exports = {
    CARD_GAME_CONFIG,
    CARD_ROOM_STATE,
    generateCard,
    evaluateCardBet,
    placeCardBet,
    resolveCardBet
};
