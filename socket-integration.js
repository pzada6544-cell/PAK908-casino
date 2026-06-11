// =========================================================================
// 🎮 PAK908 SOCKET.IO INTEGRATION
// =========================================================================

const diceGame = require('./dice-game');
const rouletteGame = require('./roulette-game');
const wheelGame = require('./wheel-game');
const coinFlipGame = require('./coin-flip-game');
const cardGame = require('./card-game');

module.exports = function initializeGameSockets(io, USER_LEDGER, CRASH_ROOM_STATE, LUDO_ROOMS) {
    
    // =========================================================================
    // 🎲 DICE GAME SOCKETS
    // =========================================================================
    io.on('connection', (socket) => {
        console.log(`[PAK908] Player connected: ${socket.id}`);
        
        // Sync player profile on connection
        socket.on('sync_profile', (playerName) => {
            const player = USER_LEDGER[socket.id] || {};
            socket.emit('profile_synced', {
                username: player.username,
                walletBalance: player.walletBalance,
                vipStreakDays: player.vipStreakDays,
                referralCount: player.referralCount
            });
        });

        // ===================== DICE GAME =====================
        socket.on('place_dice_bet', (data) => {
            const { betAmount, betType, specificNumber } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            const result = diceGame.placeDiceBet(player, betAmount, betType, specificNumber);
            
            if (result.success) {
                socket.emit('dice_bet_placed', { message: result.message });
                io.emit('update_wallet', { playerId: socket.id, balance: player.walletBalance });
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        socket.on('resolve_dice_bet', () => {
            const result = diceGame.resolveDiceBet();

            if (result.success) {
                const player = USER_LEDGER[diceGame.DICE_ROOM_STATE.activeBet?.playerId];
                if (player) {
                    player.walletBalance += result.payout;
                    io.emit('dice_result', {
                        roll: result.totalRoll,
                        isWin: result.isWin,
                        payout: result.payout,
                        diceRoll: result.roll,
                        newBalance: player.walletBalance
                    });
                }
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        // ===================== ROULETTE GAME =====================
        socket.on('place_roulette_bet', (data) => {
            const { betAmount, betType, betValue } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            const result = rouletteGame.placeRouletteBet(player, betAmount, betType, betValue);

            if (result.success) {
                socket.emit('roulette_bet_placed', { message: result.message });
                io.emit('update_wallet', { playerId: socket.id, balance: player.walletBalance });
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        socket.on('spin_roulette', () => {
            const result = rouletteGame.resolveRouletteBet();

            if (result.success) {
                const player = USER_LEDGER[rouletteGame.ROULETTE_ROOM_STATE.lastWinner?.playerName];
                if (player) {
                    player.walletBalance += result.payout;
                    io.emit('roulette_result', {
                        spin: result.spin,
                        isWin: result.isWin,
                        payout: result.payout,
                        winningNumber: result.winningNumber,
                        color: result.color,
                        newBalance: player.walletBalance,
                        stats: rouletteGame.getRouletteStats()
                    });
                }
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        // ===================== WHEEL OF FORTUNE =====================
        socket.on('place_wheel_bet', (data) => {
            const { betAmount } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            const result = wheelGame.placeWheelBet(player, betAmount);

            if (result.success) {
                socket.emit('wheel_bet_placed', { message: result.message });
                io.emit('update_wallet', { playerId: socket.id, balance: player.walletBalance });
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        socket.on('spin_wheel', () => {
            const result = wheelGame.resolveWheelBet();

            if (result.success) {
                const player = USER_LEDGER[wheelGame.WHEEL_STATE.activeBet?.playerId];
                if (player) {
                    player.walletBalance += result.payout;
                    io.emit('wheel_result', {
                        spin: result.spin,
                        winningSegment: result.winningSegment,
                        payout: result.payout,
                        rotation: result.spin.rotation,
                        newBalance: player.walletBalance,
                        stats: wheelGame.getWheelStats()
                    });
                }
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        // ===================== COIN FLIP GAME =====================
        socket.on('place_coin_flip_bet', (data) => {
            const { betAmount, prediction } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            const result = coinFlipGame.placeCoinFlipBet(player, betAmount, prediction);

            if (result.success) {
                socket.emit('coin_flip_bet_placed', { message: result.message });
                io.emit('update_wallet', { playerId: socket.id, balance: player.walletBalance });
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        socket.on('flip_coin', () => {
            const result = coinFlipGame.resolveCoinFlipBet();

            if (result.success) {
                const player = USER_LEDGER[coinFlipGame.COIN_FLIP_STATE.activeBet?.playerId];
                if (player) {
                    player.walletBalance += result.payout;
                    io.emit('coin_flip_result', {
                        flip: result.flip,
                        isWin: result.isWin,
                        payout: result.payout,
                        prediction: result.flip.result,
                        newBalance: player.walletBalance,
                        stats: coinFlipGame.getCoinFlipStats()
                    });
                }
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        // ===================== HI-LO CARD GAME =====================
        socket.on('place_card_bet', (data) => {
            const { betAmount, prediction } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            const result = cardGame.placeCardBet(player, betAmount, prediction);

            if (result.success) {
                socket.emit('card_bet_placed', { 
                    message: result.message,
                    card: result.card 
                });
                io.emit('update_wallet', { playerId: socket.id, balance: player.walletBalance });
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        socket.on('reveal_next_card', () => {
            const result = cardGame.resolveCardBet();

            if (result.success) {
                const player = USER_LEDGER[cardGame.CARD_ROOM_STATE.activeBet?.playerId];
                if (player) {
                    player.walletBalance += result.payout;
                    io.emit('card_result', {
                        nextCard: result.nextCard,
                        isWin: result.isWin,
                        payout: result.payout,
                        newBalance: player.walletBalance
                    });
                }
            } else {
                socket.emit('bet_error', { error: result.error });
            }
        });

        // ===================== WALLET OPERATIONS =====================
        socket.on('claim_vip_bonus', () => {
            const player = USER_LEDGER[socket.id];
            if (!player) return;

            const ECONOMIC_RULES = {
                dailyVipBase: 2
            };

            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;

            if (now - player.lastVipClaimTime > dayInMs) {
                const bonus = ECONOMIC_RULES.dailyVipBase * player.vipStreakDays;
                player.walletBalance += bonus;
                player.lastVipClaimTime = now;
                player.vipStreakDays++;

                socket.emit('vip_bonus_claimed', {
                    bonusAmount: bonus,
                    newBalance: player.walletBalance,
                    newStreakDays: player.vipStreakDays
                });
            } else {
                socket.emit('bet_error', { error: 'VIP bonus already claimed today' });
            }
        });

        socket.on('deposit_cash', (data) => {
            const { amount } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            if (amount < 100 || amount > 100000) {
                socket.emit('bet_error', { error: 'Deposit must be between Rs.100 and Rs.100,000' });
                return;
            }

            player.walletBalance += amount;
            socket.emit('deposit_success', {
                depositAmount: amount,
                newBalance: player.walletBalance
            });
        });

        socket.on('withdraw_cash', (data) => {
            const { amount } = data;
            const player = USER_LEDGER[socket.id];

            if (!player) {
                socket.emit('bet_error', { error: 'Player not found' });
                return;
            }

            if (amount < 200 || amount > 100000) {
                socket.emit('bet_error', { error: 'Withdrawal must be between Rs.200 and Rs.100,000' });
                return;
            }

            if (player.walletBalance < amount) {
                socket.emit('bet_error', { error: 'Insufficient balance' });
                return;
            }

            const ECONOMIC_RULES = { withdrawTax: 0.05 };
            const tax = Math.floor(amount * ECONOMIC_RULES.withdrawTax);
            const netAmount = amount - tax;

            player.walletBalance -= amount;
            socket.emit('withdrawal_success', {
                requestedAmount: amount,
                tax,
                netAmount,
                newBalance: player.walletBalance
            });
        });

        // ===================== DISCONNECT =====================
        socket.on('disconnect', () => {
            console.log(`[PAK908] Player disconnected: ${socket.id}`);
        });
    });
};
