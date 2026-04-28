
import React, { useState, useEffect } from 'react';
import { Player, Card as ICard, CardType, TargetType, LanguageMode, VSRecord } from '../types';
import Card from './Card';
import { trans } from '../utils/textUtils';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { CHARACTERS, CARDS_LIBRARY } from '../constants';
import { getUpgradedCard } from '../utils/cardUtils';
import { Heart, Shield, Zap, Swords, RotateCcw, Trophy, Skull, User, ArrowRight, Home, AlertCircle, TrendingDown, Droplets, Sword, Hexagon, Radiation, Activity, ShieldPlus, Flame } from 'lucide-react';

interface VSBattleSceneProps {
    player1: Player; // 自分
    player2: Player; // 相手
    onFinish: (winner: 1 | 2) => void;
    languageMode: LanguageMode;
}

const VSBattleScene: React.FC<VSBattleSceneProps> = ({ player1, player2, onFinish, languageMode }) => {
    const [phase, setPhase] = useState<'NAMING' | 'BATTLE' | 'RESULT'>('NAMING');
    const [opponentName, setOpponentName] = useState("");
    const [p1State, setP1State] = useState<Player>(() => initPlayer(player1));
    const [p2State, setP2State] = useState<Player>(() => initPlayer(player2));
    const [turnOwner, setTurnOwner] = useState<1 | 2>(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [logs, setLogs] = useState<string[]>(["対戦開始！"]);
    const [turnCount, setTurnCount] = useState(1);
    const [winner, setWinner] = useState<1 | 2 | null>(null);

    function initPlayer(p: Player): Player {
        const deck = [...p.deck].sort(() => Math.random() - 0.5);
        const drawPile = [...deck];
        const hand = drawPile.splice(0, 5);
        return {
            ...p,
            currentEnergy: 3,
            maxEnergy: 3,
            block: 0,
            hand: hand,
            drawPile: drawPile,
            discardPile: [],
            powers: { ...p.powers },
            cardsPlayedThisTurn: 0,
            attacksPlayedThisTurn: 0,
            typesPlayedThisTurn: [],
            relicCounters: { ...p.relicCounters },
            nextTurnEnergy: 0,
            nextTurnDraw: 0,
            turnFlags: {}
        };
    }

    // --- BGM Control ---
    useEffect(() => {
        if (phase === 'BATTLE') {
            audioService.playBGM('battle');
        } else if (phase === 'RESULT') {
            audioService.stopBGM();
        }
    }, [phase]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev.slice(0, 3)]);

    const applyDebuff = (target: Player, powerId: string, amount: number): Player => {
        const nextPowers = { ...target.powers };
        if (nextPowers['ARTIFACT'] && nextPowers['ARTIFACT'] > 0) {
            nextPowers['ARTIFACT']--;
            addLog("キラキラがデバフを防いだ！");
            return { ...target, powers: nextPowers };
        }
        nextPowers[powerId] = (nextPowers[powerId] || 0) + amount;
        return { ...target, powers: nextPowers };
    };

    const drawCards = (state: Player, count: number) => {
        for (let i = 0; i < count; i++) {
            if (state.drawPile.length === 0) {
                if (state.discardPile.length === 0) break;
                state.drawPile = [...state.discardPile].sort(() => Math.random() - 0.5);
                state.discardPile = [];
            }
            const drawn = state.drawPile.pop();
            if (drawn) state.hand.push(drawn);
        }
    };

    const getFilteredCardPool = (): ICard[] => {
        return Object.values(CARDS_LIBRARY)
            .filter(c => c.type !== CardType.STATUS && c.type !== CardType.CURSE && c.rarity !== 'SPECIAL')
            .map((c, i) => ({ ...c, id: `vs-pool-${i}-${Math.random()}` }));
    };

    const clearCombatDebuffs = (player: Player): Player => {
        const nextPowers = { ...player.powers };
        ['WEAK', 'VULNERABLE', 'FRAIL', 'CONFUSED'].forEach(powerId => {
            if (nextPowers[powerId] > 0) nextPowers[powerId] = 0;
        });
        return { ...player, powers: nextPowers };
    };

    const reviveWithTailEffect = (player: Player): Player | null => {
        const hasTailRelic = player.relics.some(r => r.id === 'LIZARD_TAIL') && !player.relicCounters['LIZARD_TAIL_USED'];
        const hasTailPower = (player.powers['LIZARD_TAIL'] || 0) > 0;
        if (!hasTailRelic && !hasTailPower) return null;

        const nextPlayer: Player = {
            ...player,
            powers: { ...player.powers },
            relicCounters: { ...player.relicCounters },
            currentHp: Math.max(1, Math.floor(player.maxHp * 0.5))
        };

        if (hasTailRelic) {
            nextPlayer.relicCounters['LIZARD_TAIL_USED'] = 1;
        } else {
            nextPlayer.powers['LIZARD_TAIL'] = Math.max(0, (nextPlayer.powers['LIZARD_TAIL'] || 0) - 1);
        }

        return nextPlayer;
    };

    const handleStartBattle = () => {
        if (!opponentName.trim()) {
            audioService.playSound('wrong');
            return;
        }
        audioService.playSound('select');
        setPhase('BATTLE');
    };

    const handlePlayCard = (card: ICard, owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating || phase !== 'BATTLE') return;

        const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
        if (owner === 1 && turnCount === 1 && isAttack) {
            audioService.playSound('wrong');
            addLog("先行1ターン目はアタック不可！");
            return;
        }

        const current = owner === 1 ? p1State : p2State;
        const target = owner === 1 ? p2State : p1State;

        if (current.currentEnergy < card.cost) {
            audioService.playSound('wrong');
            return;
        }

        setIsAnimating(true);
        audioService.playSound(isAttack ? 'attack' : 'block');

        let nextCurrent = { ...current, powers: { ...current.powers }, relicCounters: { ...current.relicCounters } };
        let nextTarget = { ...target, powers: { ...target.powers } };

        nextCurrent.currentEnergy -= card.cost;
        nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== card.id);
        nextCurrent.cardsPlayedThisTurn++;
        
        if (!nextCurrent.typesPlayedThisTurn.includes(card.type)) {
            nextCurrent.typesPlayedThisTurn.push(card.type);
        }
        
        if (isAttack) {
            nextCurrent.attacksPlayedThisTurn++;
        }

        addLog(`${owner === 1 ? 'P1' : 'P2'}が${card.name}を使用`);

        // 多段ヒット
        let hits = 1;
        if (card.playCopies) hits += card.playCopies;
        if (card.hitsPerSkillInHand) hits = nextCurrent.hand.filter(c => c.type === CardType.SKILL).length;
        if (card.hitsPerAttackPlayed) hits = nextCurrent.attacksPlayedThisTurn;

        for (let h = 0; h < hits; h++) {
            if (card.damage !== undefined || card.damageBasedOnBlock || card.damagePerCardInHand || card.damagePerAttackPlayed || card.damagePerStrike || card.damagePerCardInDraw) {
                let baseDmg = card.damage || 0;
                if (card.damageBasedOnBlock) baseDmg += nextCurrent.block;
                if (card.damagePerCardInHand) baseDmg += nextCurrent.hand.length * card.damagePerCardInHand;
                if (card.damagePerAttackPlayed) baseDmg += nextCurrent.attacksPlayedThisTurn * card.damagePerAttackPlayed;
                if (card.damagePerStrike) baseDmg += nextCurrent.deck.filter(c => c.name.includes("えんぴつ攻撃")).length * card.damagePerStrike;
                if (card.damagePerCardInDraw) baseDmg += nextCurrent.drawPile.length * card.damagePerCardInDraw;

                const strScaling = card.strengthScaling || 1;
                baseDmg += (nextCurrent.strength + (nextCurrent.powers['STRENGTH'] || 0)) * strScaling;

                let multiplier = 1;
                if (isAttack && nextCurrent.relics.some(r => r.id === 'PEN_NIB')) {
                    nextCurrent.relicCounters['PEN_NIB'] = (nextCurrent.relicCounters['PEN_NIB'] || 0) + 1;
                    if (nextCurrent.relicCounters['PEN_NIB'] >= 10) {
                        multiplier = 2;
                        nextCurrent.relicCounters['PEN_NIB'] = 0;
                        addLog("ペン先の力が発動！ダメージ2倍！");
                    }
                }

                let finalDmg = Math.floor(baseDmg * multiplier);
                if (nextCurrent.powers['WEAK'] > 0) finalDmg = Math.floor(finalDmg * 0.75);
                if (nextTarget.powers['VULNERABLE'] > 0) finalDmg = Math.floor(finalDmg * 1.5);
                if (nextTarget.powers['INTANGIBLE'] > 0) finalDmg = 1;

                // ブロック計算
                const damageBeforeBlock = finalDmg;
                if (nextTarget.block >= finalDmg) {
                    nextTarget.block -= finalDmg;
                    finalDmg = 0;
                } else {
                    finalDmg -= nextTarget.block;
                    nextTarget.block = 0;
                    nextTarget.currentHp = Math.max(0, nextTarget.currentHp - finalDmg);
                }

                // 吸収（HP削った分だけ回復）
                if (card.lifesteal && damageBeforeBlock > 0) {
                    const actualHeal = Math.min(damageBeforeBlock, target.currentHp);
                    nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + actualHeal);
                }

                if (damageBeforeBlock > 0 && nextTarget.powers['THORNS'] > 0) {
                    nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - nextTarget.powers['THORNS']);
                }
            }
        }

        // ブロック獲得
        if (card.block) {
            let blk = card.block;
            if (nextCurrent.powers['DEXTERITY']) blk += nextCurrent.powers['DEXTERITY'];
            if (nextCurrent.powers['FRAIL'] > 0) blk = Math.floor(blk * 0.75);
            nextCurrent.block += blk;
        }
        if (card.doubleBlock) nextCurrent.block *= 2;

        // 特殊効果
        if (card.heal) nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + card.heal);
        if (card.energy) nextCurrent.currentEnergy += card.energy;
        
        if (card.selfDamage) {
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - card.selfDamage);
            // 成長痛(RUPTURE)との連動
            if (nextCurrent.powers['RUPTURE'] > 0) {
                nextCurrent.powers['STRENGTH'] = (nextCurrent.powers['STRENGTH'] || 0) + nextCurrent.powers['RUPTURE'];
                addLog("成長痛！筋力が上がった！");
            }
        }

        if (card.strength) nextCurrent.strength += card.strength;
        if (card.doubleStrength) nextCurrent.strength *= 2;

        const matchesCardName = (...names: string[]) =>
            names.includes(card.name) || names.some(n => card.originalNames?.includes(n));

        if (matchesCardName('発見', 'DISCOVERY', 'ゼロの発見', 'SANSU_ZERO')) {
            const pool = getFilteredCardPool();
            for (let i = 0; i < 3; i++) {
                const template = pool[Math.floor(Math.random() * pool.length)];
                if (!template) break;
                let newCard = { ...template, id: `discovery-${Date.now()}-${Math.random()}` };
                if (nextCurrent.powers['MASTER_REALITY']) newCard = getUpgradedCard(newCard);
                nextCurrent.hand.push(newCard);
                addLog(`${newCard.name}を手札に加えた！`);
            }
        }

        if (matchesCardName('山勘', 'GAMBLE', '単位変換', 'SANSU_UNIT')) {
            const handToReplace = [...nextCurrent.hand];
            nextCurrent.hand = [];
            handToReplace.forEach(c => nextCurrent.discardPile.push(c));
            drawCards(nextCurrent, handToReplace.length);
            addLog(`${handToReplace.length}枚入れ替えた`);
        }

        // 高優先: 手札操作系の差別化
        if (matchesCardName('パニック', 'MADNESS')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                pick.cost = 0;
                addLog(`パニック: 「${pick.name}」が0コストになった`);
            }
        }
        if (matchesCardName('魅惑のカカオ', 'SWEET_CACAO')) {
            const handToReplace = [...nextCurrent.hand];
            nextCurrent.hand = [];
            handToReplace.forEach(c => nextCurrent.discardPile.push(c));
            drawCards(nextCurrent, handToReplace.length);
            addLog(`魅惑のカカオ: 手札を${handToReplace.length}枚入れ替え`);
        }

        // 高優先: コピー系の差別化
        const addCopy = (template: typeof card) => {
            let copy = { ...template, id: `copy-${Date.now()}-${Math.random()}` };
            if (nextCurrent.powers['MASTER_REALITY']) copy = getUpgradedCard(copy);
            nextCurrent.hand.push(copy);
            addLog(`${copy.name}をコピーした`);
        };
        if (matchesCardName('カンニング', 'HOLOGRAM')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && c.type === CardType.ATTACK);
            if (pool.length > 0) addCopy(pool[Math.floor(Math.random() * pool.length)]);
        }
        if (matchesCardName('お人形遊び', 'GIRLS_DOLL_HOUSE')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && c.type === CardType.SKILL);
            if (pool.length > 0) addCopy(pool[Math.floor(Math.random() * pool.length)]);
        }
        if (matchesCardName('二刀流', 'DUAL_WIELD')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id && (c.type === CardType.ATTACK || c.type === CardType.POWER));
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                addCopy(pick);
                addCopy(pick);
            }
        }
        if (matchesCardName('フォークダンス', 'PE_DANCE')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                addCopy(pick);
                const discardPool = nextCurrent.hand.filter(c => c.id !== pick.id);
                if (discardPool.length > 0) {
                    const toss = discardPool[Math.floor(Math.random() * discardPool.length)];
                    nextCurrent.hand = nextCurrent.hand.filter(c => c.id !== toss.id);
                    nextCurrent.discardPile.push(toss);
                    addLog(`フォークダンス: 「${toss.name}」を捨てた`);
                }
            }
        }
        if (matchesCardName('鏡 (星新一)', 'KAGAMI_HOSHI')) {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                addCopy(pool[Math.floor(Math.random() * pool.length)]);
                nextCurrent = applyDebuff(nextCurrent, 'VULNERABLE', 1);
                addLog('鏡: 自分にびくびく1（反動）');
            }
        }
        if (matchesCardName('きてんの窓', 'KITSUNE_NO_MADO')) {
            const hiCost = nextCurrent.hand.filter(c => c.id !== card.id && c.cost >= 2);
            const pool = hiCost.length > 0 ? hiCost : nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const copy = { ...pick, cost: 0 };
                addCopy(copy);
                addLog('きてんの窓: 高コスト優先コピーを0コスト化');
            }
        }

        // 高優先: エナジー獲得系の差別化
        if (matchesCardName('覚醒のコーヒー', 'AWAKE_COFFEE')) {
            drawCards(nextCurrent, 1);
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - 1);
            addLog('覚醒のコーヒー: 1ドロー（反動でHP-1）');
        }
        if (matchesCardName('産業革命', 'SYAKAI_REVOLUTION')) {
            nextCurrent.currentEnergy = Math.max(0, nextCurrent.currentEnergy - 1);
            nextCurrent.nextTurnEnergy += 1;
            drawCards(nextCurrent, 1);
            addLog('産業革命: Eを来ターンへ分割し1ドロー');
        }

        // 中優先: びくびく付与系の差別化
        if (card.id === 'RIKA_MICROSCOPE') {
            nextCurrent.nextTurnDraw += 1;
            addLog('顕微鏡: 次ターン1ドロー');
        }
        if (card.id === 'GIRLS_SPARKLE_DUST') {
            nextTarget = applyDebuff(nextTarget, 'WEAK', 1);
            addLog('キラキラの粉: へろへろ1を追加');
        }
        if (card.id === 'TRIP') {
            nextCurrent.block += 3;
            addLog('足払い: ブロック3を獲得');
        }
        if (card.id === 'JACHI_BOGYAKU') {
            drawCards(nextCurrent, 1);
            addLog('邪智暴虐: 1ドロー');
        }

        // 中優先: 全体多段/連撃系の差別化
        if (card.id === 'ISSUN_BOSHI') {
            nextCurrent.block += 3;
            addLog('一寸法師: 連撃後にブロック3');
        }
        if (card.id === 'PE_JUMP') {
            nextCurrent.currentHp = Math.max(0, nextCurrent.currentHp - 1);
            addLog('縄跳び: 反動でHP-1');
        }
        if (card.id === 'GIRLS_CANDY_SHOWER') {
            nextTarget = applyDebuff(nextTarget, 'WEAK', 1);
            addLog('飴玉の嵐: へろへろ1を付与');
        }
        if (card.id === 'SWORD_BOOMERANG') {
            nextCurrent.currentEnergy += 1;
            addLog('ブーメラン: エネルギー+1');
        }

        // 中優先: ブロック+ドロー系の差別化
        if (card.id === 'KAIKETSU_ZORORI') {
            nextCurrent.block += 3;
            addLog('かいけつゾロリ: ブロック3');
        }
        if (card.id === 'ACROBATICS') {
            nextCurrent.block += 2;
            addLog('側転: ブロック2');
        }
        if (card.id === 'BOYS_MECHA_DIVE') {
            const pool = nextCurrent.hand.filter(c => c.id !== card.id);
            if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                pick.cost = 0;
                addLog(`電脳世界へのダイブ: 「${pick.name}」を0コスト化`);
            }
        }
        if (card.id === 'OUT_HIDDEN_SHORTCUT' && nextCurrent.drawPile.length > 0) {
            const hiCost = nextCurrent.drawPile.filter(c => c.cost >= 2);
            const pool = hiCost.length > 0 ? hiCost : nextCurrent.drawPile;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            nextCurrent.drawPile = nextCurrent.drawPile.filter(c => c.id !== pick.id);
            nextCurrent.hand.push({ ...pick, cost: 0 });
            addLog(`秘密の近道: 「${pick.name}」を0コストで手札へ`);
        }
        
        if (card.draw) {
            drawCards(nextCurrent, card.draw);
        }
        
        if (card.upgradeHand) nextCurrent.hand = nextCurrent.hand.map(c => getUpgradedCard(c));
        if (card.nextTurnEnergy) nextCurrent.nextTurnEnergy += card.nextTurnEnergy;
        if (card.nextTurnDraw) nextCurrent.nextTurnDraw += card.nextTurnDraw;
        if (nextCurrent.powers['HEAL_ON_PLAY']) {
            nextCurrent.currentHp = Math.min(nextCurrent.maxHp, nextCurrent.currentHp + nextCurrent.powers['HEAL_ON_PLAY']);
        }
        if (card.type === CardType.SKILL && nextCurrent.powers['SKILL_BLOCK']) {
            nextCurrent.block += nextCurrent.powers['SKILL_BLOCK'];
        }

        if (card.poison) {
            nextTarget = applyDebuff(nextTarget, 'POISON', card.poison);
        }
        if (card.weak) {
            nextTarget = applyDebuff(nextTarget, 'WEAK', card.weak);
        }
        if (card.vulnerable) {
            if (card.target === TargetType.SELF) nextCurrent = applyDebuff(nextCurrent, 'VULNERABLE', card.vulnerable);
            else nextTarget = applyDebuff(nextTarget, 'VULNERABLE', card.vulnerable);
        }

        if (card.applyPower) {
            const pid = card.applyPower.id;
            const amt = card.applyPower.amount;
            const debuffs = ['WEAK', 'VULNERABLE', 'POISON', 'FRAIL', 'CONFUSED'];
            if (debuffs.includes(pid)) nextTarget = applyDebuff(nextTarget, pid, amt);
            else if (pid === 'CLEAR_DEBUFFS') nextCurrent = clearCombatDebuffs(nextCurrent);
            else nextCurrent.powers[pid] = (nextCurrent.powers[pid] || 0) + amt;
        }

        const shouldExhaust = card.exhaust || (card.type === CardType.SKILL && nextCurrent.powers['CORRUPTION']);
        if (shouldExhaust || card.promptsExhaust === 99) {
            nextCurrent.discardPile = nextCurrent.discardPile.filter(c => c.id !== card.id);
            if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'];
        } else if (card.type !== CardType.POWER) {
            nextCurrent.discardPile.push(card);
        }

        if (card.promptsExhaust === 99) {
            if (
                card.name === '断捨離' ||
                card.name === 'SEVER_SOUL' ||
                card.name === '読書感想文' ||
                card.name === 'KOKUGO_BOOK_REPORT' ||
                card.originalNames?.includes('断捨離') ||
                card.originalNames?.includes('SEVER_SOUL') ||
                card.originalNames?.includes('読書感想文') ||
                card.originalNames?.includes('KOKUGO_BOOK_REPORT')
            ) {
                const cardsToExhaust = nextCurrent.hand.filter(c => c.type !== CardType.ATTACK);
                if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'] * cardsToExhaust.length;
                nextCurrent.hand = nextCurrent.hand.filter(c => c.type === CardType.ATTACK);
            } else if (card.name === '大掃除' || card.name === 'FIEND_FIRE' || card.originalNames?.includes('大掃除') || card.originalNames?.includes('FIEND_FIRE')) {
                const cardsToExhaust = nextCurrent.hand.length;
                if (nextCurrent.powers['FEEL_NO_PAIN']) nextCurrent.block += nextCurrent.powers['FEEL_NO_PAIN'] * cardsToExhaust;
                nextCurrent.hand = [];
            }
        }

        const revivedTarget = nextTarget.currentHp <= 0 ? reviveWithTailEffect(nextTarget) : null;
        if (revivedTarget) nextTarget = revivedTarget;
        const revivedCurrent = nextCurrent.currentHp <= 0 ? reviveWithTailEffect(nextCurrent) : null;
        if (revivedCurrent) nextCurrent = revivedCurrent;

        if (owner === 1) { setP1State(nextCurrent); setP2State(nextTarget); } 
        else { setP2State(nextCurrent); setP1State(nextTarget); }

        setIsAnimating(false);
        if (nextTarget.currentHp <= 0 || nextCurrent.currentHp <= 0) {
            if (nextTarget.currentHp <= 0) finishMatch(owner);
            else finishMatch(owner === 1 ? 2 : 1);
        }
    };

    const handleEndTurn = (owner: 1 | 2) => {
        if (turnOwner !== owner || isAnimating || phase !== 'BATTLE') return;
        
        const current = owner === 1 ? p1State : p2State;
        const nextOwner = owner === 1 ? 2 : 1;
        const nextToAct = nextOwner === 1 ? p1State : p2State;

        let updatedCurrent = { ...current, powers: { ...current.powers } };
        
        // 毒ダメージ
        if (updatedCurrent.powers['POISON'] > 0) {
            const poisonDmg = updatedCurrent.powers['POISON'];
            updatedCurrent.currentHp = Math.max(0, updatedCurrent.currentHp - poisonDmg);
            updatedCurrent.powers['POISON']--;
        }

        // じわじわ回復(REGEN)
        if (updatedCurrent.powers['REGEN'] > 0) {
            const healAmt = updatedCurrent.powers['REGEN'];
            updatedCurrent.currentHp = Math.min(updatedCurrent.maxHp, updatedCurrent.currentHp + healAmt);
            updatedCurrent.powers['REGEN']--;
            addLog("再生能力で回復！");
        }

        // 金属化(METALLICIZE)
        if (updatedCurrent.powers['METALLICIZE'] > 0) {
            updatedCurrent.block += updatedCurrent.powers['METALLICIZE'];
            addLog("金属化によりブロック獲得");
        }

        // デバフ減少
        ['WEAK', 'VULNERABLE', 'FRAIL', 'CONFUSED'].forEach(p => {
            if (updatedCurrent.powers[p]) updatedCurrent.powers[p]--;
        });

        const revivedCurrent = updatedCurrent.currentHp <= 0 ? reviveWithTailEffect(updatedCurrent) : null;
        if (revivedCurrent) {
            updatedCurrent = revivedCurrent;
        }

        if (owner === 1) setP1State(updatedCurrent); else setP2State(updatedCurrent);

        if (updatedCurrent.currentHp <= 0) {
            finishMatch(nextOwner);
            return;
        }

        if (nextOwner === 1) setTurnCount(prev => prev + 1);

        const processed = { ...nextToAct };
        processed.block = 0; 
        processed.currentEnergy = processed.maxEnergy + (processed.nextTurnEnergy || 0);
        processed.nextTurnEnergy = 0;
        processed.cardsPlayedThisTurn = 0;
        processed.attacksPlayedThisTurn = 0;
        processed.typesPlayedThisTurn = [];

        let drawCount = 5 + (processed.nextTurnDraw || 0);
        processed.nextTurnDraw = 0;
        
        while(processed.hand.length < drawCount) {
            if (processed.drawPile.length === 0) {
                if (processed.discardPile.length === 0) break;
                processed.drawPile = [...processed.discardPile].sort(() => Math.random() - 0.5);
                processed.discardPile = [];
            }
            const drawn = processed.drawPile.pop();
            if (drawn) processed.hand.push(drawn);
            else break;
        }

        if (nextOwner === 1) setP1State(processed); else setP2State(processed);
        setTurnOwner(nextOwner);
        addLog(`${nextOwner === 1 ? 'P1' : opponentName}のターン`);
        audioService.playSound('select');
    };

    const finishMatch = (matchWinner: 1 | 2) => {
        setWinner(matchWinner);
        setPhase('RESULT');
        audioService.playSound('win');
        const p1Char = CHARACTERS.find(c => c.id === player1.id)?.name || "不明";
        const p2Char = CHARACTERS.find(c => c.id === player2.id)?.name || "不明";
        const record: VSRecord = {
            id: `vs-${Date.now()}`,
            date: Date.now(),
            opponentName: opponentName,
            playerCharName: p1Char,
            opponentCharName: p2Char,
            victory: matchWinner === 1,
            turns: turnCount
        };
        storageService.saveVSRecord(record);
    };

    const renderPowers = (powers: Record<string, number>, strength: number) => {
        const badges = [];
        const totalStr = strength + (powers['STRENGTH'] || 0);
        if (totalStr !== 0) {
            badges.push(
                <div key="str" className="flex items-center bg-red-900/60 border border-red-500 rounded px-1 gap-1 text-[10px]" title="ムキムキ">
                    <Sword size={10} className="text-red-400"/>
                    <span className="font-bold text-red-100">{totalStr}</span>
                </div>
            );
        }
        if (powers['DEXTERITY']) {
            badges.push(
                <div key="dex" className="flex items-center bg-blue-900/60 border border-blue-500 rounded px-1 gap-1 text-[10px]" title="カチカチ">
                    <Shield size={10} className="text-blue-400"/>
                    <span className="font-bold text-blue-100">{powers['DEXTERITY']}</span>
                </div>
            );
        }
        if (powers['WEAK'] > 0) {
            badges.push(
                <div key="weak" className="flex items-center bg-slate-700/60 border border-slate-400 rounded px-1 gap-1 text-[10px]" title="へろへろ">
                    <TrendingDown size={10} className="text-slate-300"/>
                    <span className="font-bold text-slate-100">{powers['WEAK']}</span>
                </div>
            );
        }
        if (powers['VULNERABLE'] > 0) {
            badges.push(
                <div key="vul" className="flex items-center bg-pink-900/60 border border-pink-500 rounded px-1 gap-1 text-[10px]" title="びくびく">
                    <AlertCircle size={10} className="text-pink-300"/>
                    <span className="font-bold text-pink-100">{powers['VULNERABLE']}</span>
                </div>
            );
        }
        if (powers['POISON'] > 0) {
            badges.push(
                <div key="psn" className="flex items-center bg-green-900/60 border border-green-500 rounded px-1 gap-1 text-[10px]" title="ドクドク">
                    <Droplets size={10} className="text-green-300"/>
                    <span className="font-bold text-green-100">{powers['POISON']}</span>
                </div>
            );
        }
        if (powers['ARTIFACT'] > 0) {
            badges.push(
                <div key="art" className="flex items-center bg-yellow-900/60 border border-yellow-500 rounded px-1 gap-1 text-[10px]" title="キラキラ">
                    <Hexagon size={10} className="text-yellow-300"/>
                    <span className="font-bold text-yellow-100">{powers['ARTIFACT']}</span>
                </div>
            );
        }
        if (powers['THORNS'] > 0) {
            badges.push(
                <div key="thorns" className="flex items-center bg-orange-900/60 border border-orange-500 rounded px-1 gap-1 text-[10px]" title="トゲトゲ">
                    <Radiation size={10} className="text-orange-400"/>
                    <span className="font-bold text-orange-100">{powers['THORNS']}</span>
                </div>
            );
        }
        if (powers['REGEN'] > 0) {
            badges.push(
                <div key="regen" className="flex items-center bg-green-900/60 border border-green-500 rounded px-1 gap-1 text-[10px]" title="リジェネ">
                    <Activity size={10} className="text-green-400"/>
                    <span className="font-bold text-green-100">{powers['REGEN']}</span>
                </div>
            );
        }
        if (powers['METALLICIZE'] > 0) {
            badges.push(
                <div key="metal" className="flex items-center bg-blue-900/60 border border-blue-400 rounded px-1 gap-1 text-[10px]" title="金属化">
                    <ShieldPlus size={10} className="text-blue-200"/>
                    <span className="font-bold text-blue-100">{powers['METALLICIZE']}</span>
                </div>
            );
        }
        if (powers['RUPTURE'] > 0) {
            badges.push(
                <div key="rupture" className="flex items-center bg-purple-900/60 border border-purple-500 rounded px-1 gap-1 text-[10px]" title="成長痛">
                    <Flame size={10} className="text-purple-300"/>
                    <span className="font-bold text-purple-100">{powers['RUPTURE']}</span>
                </div>
            );
        }
        return badges;
    };

    if (phase === 'NAMING') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-600 p-8 rounded-3xl w-full max-sm shadow-2xl text-center animate-in zoom-in duration-300">
                    <User size={64} className="text-indigo-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-black mb-2 italic tracking-tighter">BATTLE ENTRY</h2>
                    <p className="text-gray-400 text-xs mb-8">対戦相手の名前を入力してください</p>
                    <input 
                        type="text" 
                        value={opponentName}
                        onChange={(e) => setOpponentName(e.target.value)}
                        placeholder="相手の名前"
                        className="w-full bg-black border-2 border-indigo-900 rounded-xl px-4 py-3 text-center text-xl font-bold focus:border-indigo-400 outline-none transition-all mb-8 placeholder:text-gray-700"
                        autoFocus
                    />
                    <button 
                        onClick={handleStartBattle}
                        disabled={!opponentName.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        READY <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'RESULT') {
        return (
            <div className="flex flex-col h-full w-full bg-slate-950 items-center justify-center p-6 text-white font-mono">
                <div className="bg-slate-900 border-4 border-indigo-500 p-8 rounded-3xl w-full max-w-md shadow-[0_0_60px_rgba(79,70,229,0.4)] text-center animate-in zoom-in duration-300">
                    {winner === 1 ? (
                        <>
                            <Trophy size={80} className="text-yellow-400 mx-auto mb-6 animate-bounce" />
                            <h2 className="text-5xl font-black text-yellow-400 italic mb-2 tracking-tighter">WINNER!</h2>
                        </>
                    ) : (
                        <>
                            <Skull size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
                            <h2 className="text-5xl font-black text-red-500 italic mb-2 tracking-tighter">DEFEATED</h2>
                        </>
                    )}
                    <div className="bg-black/40 rounded-2xl p-6 border border-indigo-900/50 mb-8 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-left">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Opponent</p>
                                <p className="text-xl font-black text-indigo-100">{opponentName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Turns</p>
                                <p className="text-xl font-black text-indigo-400">{turnCount}</p>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => onFinish(winner!)}
                        className="w-full bg-white text-slate-900 font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                        <Home size={20}/> タイトルへ戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 overflow-hidden font-mono">
            {/* Player 2 Area (Top, Rotated) */}
            <div className={`flex-1 border-b-2 border-indigo-500/30 relative transform rotate-180 transition-colors duration-300 ${turnOwner === 2 ? 'bg-red-600/10' : 'bg-black/20'}`}>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-red-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p2State.currentHp}/{p2State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p2State.block}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
                                {renderPowers(p2State.powers, p2State.strength)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-red-500 font-bold">{opponentName.toUpperCase() || 'PLAYER 2'}</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1 mt-1">
                                <Zap size={14} fill="currentColor"/> {p2State.currentEnergy}/{p2State.maxEnergy}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 h-44 overflow-x-auto pb-4 custom-scrollbar">
                        {p2State.hand.map(card => (
                            <div key={card.id} className="scale-90 origin-bottom transform-gpu">
                                <Card card={card} onClick={() => handlePlayCard(card, 2)} disabled={turnOwner !== 2 || isAnimating || p2State.currentEnergy < card.cost} languageMode={languageMode}/>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleEndTurn(2)} disabled={turnOwner !== 2 || isAnimating} className={`w-full py-3 rounded-xl font-bold text-lg border-2 shadow-lg transition-all ${turnOwner === 2 ? 'bg-red-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                        TURN END
                    </button>
                </div>
            </div>
            <div className="h-16 bg-black flex items-center justify-between border-y-2 border-indigo-600 px-6 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none"></div>
                <div className="text-xs text-indigo-300 font-black italic tracking-widest z-10">TURN {turnCount}</div>
                <div className="text-sm text-white font-bold truncate max-w-[60%] text-center z-10 px-4 bg-indigo-900/40 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.2)]">
                    {logs[0]}
                </div>
                <div className="text-xs text-indigo-400 font-black z-10">VS</div>
            </div>
            <div className={`flex-1 relative transition-colors duration-300 ${turnOwner === 1 ? 'bg-blue-600/10' : 'bg-black/20'}`}>
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="bg-black/60 p-2 rounded border border-blue-500">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <Heart size={16} fill="currentColor"/> {p1State.currentHp}/{p1State.maxHp}
                            </div>
                            <div className="flex items-center gap-2 text-blue-400 text-xs mt-1">
                                <Shield size={14}/> {p1State.block}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2 max-w-[150px]">
                                {renderPowers(p1State.powers, p1State.strength)}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-blue-400 font-bold uppercase">Player 1 (YOU)</div>
                            <div className="bg-yellow-900/50 px-3 py-1 rounded-full border border-yellow-500 text-yellow-400 font-bold flex items-center gap-1 mt-1">
                                <Zap size={14} fill="currentColor"/> {p1State.currentEnergy}/{p1State.maxEnergy}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-2 h-44 overflow-x-auto pb-4 custom-scrollbar">
                        {p1State.hand.map(card => {
                            const isAttack = card.type === CardType.ATTACK || String(card.type) === 'ATTACK';
                            const isAttackRestricted = turnCount === 1 && isAttack;
                            return (
                                <div key={card.id} className="scale-90 origin-bottom transform-gpu">
                                    <Card card={card} onClick={() => handlePlayCard(card, 1)} disabled={turnOwner !== 1 || isAnimating || p1State.currentEnergy < card.cost || isAttackRestricted} languageMode={languageMode}/>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => handleEndTurn(1)} disabled={turnOwner !== 1 || isAnimating} className={`w-full py-3 rounded-xl font-bold text-lg border-2 shadow-lg transition-all ${turnOwner === 1 ? 'bg-blue-600 border-white text-white animate-pulse' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                        TURN END
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VSBattleScene;
