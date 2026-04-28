
import { CARDS_LIBRARY, RELIC_LIBRARY, POTION_LIBRARY, ENEMY_LIBRARY } from '../constants';
import { GAME_STORIES } from '../data/stories';
import { FLAVOR_TEXTS, ENEMY_NAMES } from '../services/geminiService';
import { Card as ICard, Relic, Potion, CardType, TargetType, LanguageMode } from '../types';
import Card from './Card';
import { ArrowRight, Trash2, Plus, Gem, FlaskConical, Swords, Shield, Zap, Search, Beaker, RotateCcw, Skull, Clock, History, Languages, FileText, BookOpen, MessageSquare, HelpCircle, AlertCircle, Copy, Check, X } from 'lucide-react';
import { synthesizeCards } from '../utils/cardUtils';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';
import React, { useMemo, useState, useCallback } from 'react';

interface DebugMenuScreenProps {
    onStart: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
    onStartAct3Boss: (deck: ICard[], relics: Relic[], potions: Potion[]) => void;
    onBack: () => void;
    onTimeUpdate: (newDailySeconds: number) => void;
    onAddClearCount: () => void;
    onBoostMathCorrect: () => void;
    clearCount: number;
    totalMathCorrect: number;
    nextMiniGameThreshold: number | null;
    languageMode: LanguageMode;
}

// 翻訳デバッグ用にイベントデータのサンプルを定義 (eventService.tsの内容を網羅)
const EVENT_SAMPLES = [
    { title: "怪しい薬売り", description: "路地裏で男が声をかけてきた。「とびきりの薬, あるよ」", options: [{ label: "買う", text: "20G支払って試す", result: "怪しい薬を手に入れた！" }, { label: "無視", text: "何もせず立ち去る", result: "怪しい男を無視して先へ進んだ。" }] },
    { title: "踊り場の鏡", description: "大きな鏡がある。映っている自分と目が合った。", options: [{ label: "見つめる", text: "じっと見つめる...", result: "鏡の中の自分が何かを手渡してきた。" }, { label: "割る", text: "鏡を叩き割る！", result: "破片が飛び散った！呪い「骨折」を入手。" }] },
    { title: "呪われた書物", description: "古びた祭壇に一冊の本が置かれている。不吉な気配がする。", options: [{ label: "読む", text: "勇気を出して読む", result: "ページをめくると激痛が走った！(HP-10) レリックを入手。" }, { label: "立ち去る", text: "危険を避ける", result: "危険を避けて立ち去った。" }] },
    { title: "伝説の給食", description: "今日は揚げパンの日だ！しかし、最後に一つだけ余っている。クラスメートとジャンケンで勝負だ。", options: [{ label: "グー", text: "力強く出す！", result: "勝った！揚げパンをゲット！" }, { label: "パー", text: "大きく広げる！", result: "お礼に50Gもらった。" }, { label: "チョキ", text: "鋭く出す！", result: "指を突き指した。(HP-5)" }] },
    { title: "校庭の野良犬", description: "授業中, 校庭に野良犬が迷い込んできた！首輪はなく、お腹を空かせているようだ。", options: [{ label: "なでる", text: "優しく近づく", result: "犬は嬉しそうに尻尾を振って去っていった。心が癒やされた。" }, { label: "餌をやる", text: "何かあげる", result: "パンを買ってあげた。お礼に「犬のフン」を置いていった。" }] },
    { title: "謎の転校生", description: "「ねえ, 君のそのカード、僕のと交換しない？」見たことのないカードを持っている。", options: [{ label: "交換", text: "ランダムに交換する", result: "カードが変化した！" }, { label: "断る", text: "自分のカードが大事", result: "断った。転校生はつまらなそうに去った。" }] },
    { title: "席替え", description: "今日は席替えの日だ。窓際の一番後ろになれるか...？それとも最前列か。", options: [{ label: "くじを引く", text: "手札(デッキ)が変わる予感...", result: "席替えの結果、付き合う友達(デッキ)が変わった！" }, { label: "祈る", text: "今の席を維持したい...", result: "なんとか今の席をキープできた。安心してHPが5回復した。" }] },
    { question: "避難訓練", description: "ジリリリリ！非常ベルが鳴り響く。「お・か・し」を守って避難しよう。", options: [{ label: "走る", text: "カードを1枚削除(逃げる)", result: "一目散に逃げ出した！不要なカードを置いてきた。" }, { label: "隠れる", text: "HP回復", result: "机の下に隠れてやり過ごした。HPが15回復した。" }] },
    { title: "プール開き", description: "待ちに待ったプール開きだ！しかし水は冷たそうだ。", options: [{ label: "泳ぐ", text: "全回復するが、風邪を引くかも", result: "最高に気持ちいい！HP全回復！...しかし風邪を引いてしまった。" }, { label: "見学", text: "カードを1枚強化", result: "プールサイドでイメトレをした。カードが強化された！" }] },
    { title: "修学旅行の積立金", description: "集金袋を拾った。中にはお金が入っている。", options: [{ label: "ネコババ", text: "150G入手。呪い「後悔」を得る。", result: "150Gを手に入れた！しかし良心が痛む...呪い「後悔」を入手。" }, { label: "届ける", text: "職員室に届ける", result: "正直者は報われる。先生から「図書カード」をもらった！" }] },
    { title: "魔の掃除時間", description: "廊下のワックスがけの時間だ。ツルツル滑る床は危険だが、滑れば速く移動できるかも？", options: [{ label: "滑る", text: "カード強化。HP-5。", result: "スライディング！(HP-5) カードの扱いが上手くなった！" }, { label: "磨く", text: "カード1枚削除。", result: "心を込めて磨いたら、心が洗われた。" }] },
    { title: "運命のテスト返却", description: "今日は算数のテストが返却される日だ。自信はあるか？", options: [{ label: "自信あり", text: "確率で100GかHP-10。", result: "100点満点だ！お祝いに100Gをもらった！" }, { label: "隠す", text: "呪い「恥」を得る。HP20回復。", result: "親に見つからないように隠した。安心したが、良心が痛む...呪い「恥」を入手。" }] },
    { title: "放送室のジャック", description: "放送室に誰もいない。マイクの電源が入っている。イタズラするチャンス？", options: [{ label: "歌う", text: "最大HP+4。", result: "生徒たちに大ウケだ！人気者になった。最大HP+4。" }, { label: "告白", text: "呪い「後悔」を得る。HP回復。", result: "校長先生の名前を叫んでしまった。呪い「後悔」を入手。" }] },
    { title: "理科室の人体模型", description: "夜の理科室。人体模型が動いている気がする。「心臓ヲ...クレ...」と聞こえた。", options: [{ label: "あげる", text: "HP-10。レリック「保健室の飴」入手。", result: "自分の血を分け与えた(HP-10)お礼に「保健室の飴(レリック)」を貰った。" }, { label: "逃げる", text: "カード1枚削除。", action: () => { }, result: "なんとか逃げ切った。怖かった...恐怖でカードを忘れてしまった。" }] },
    { title: "図書室の静寂", description: "放課後の図書室はとても静かだ。心地よい眠気が襲ってくる...", options: [{ label: "寝る", text: "HP20回復。", result: "ぐっすり眠れた。HPが20回復した。" }, { label: "勉強", text: "「先読み」カード入手。", result: "集中して勉強した。「先読み」のカードを習得した。" }] },
];

const TranslationRow = React.memo(({ original, context, debugLanguageMode, isInline = false }: { original: string, context?: string, debugLanguageMode: LanguageMode, isInline?: boolean }) => {
    const translated = trans(original, debugLanguageMode);
    const isMissing = debugLanguageMode === 'HIRAGANA' && translated === original && original.match(/[一-龠]/);

    return (
        <div className={`p-2 border-b border-gray-700 flex flex-col gap-1 ${isMissing ? 'bg-red-900/20' : 'hover:bg-white/5'}`}>
            {context && <div className="text-[10px] text-gray-500 font-bold uppercase">{context}</div>}
            <div className={`flex ${isInline ? 'flex-row items-center gap-4' : 'flex-col md:flex-row gap-2'}`}>
                <div className="flex-1 text-xs text-gray-400 font-mono bg-black/40 p-1 rounded">
                    {original}
                </div>
                <div className="hidden md:flex items-center text-gray-600"><ArrowRight size={14} /></div>
                <div className={`flex-1 text-xs font-bold p-1 rounded ${isMissing ? 'text-red-400 bg-red-900/40' : 'text-green-400 bg-green-900/20'}`}>
                    {translated}
                </div>
            </div>
            {isMissing && <div className="text-[8px] text-red-500 font-bold italic tracking-tighter">MISSING TRANSLATION IN DICTIONARY</div>}
        </div>
    );
});

const DebugMenuScreen: React.FC<DebugMenuScreenProps> = ({
    onStart,
    onStartAct3Boss,
    onBack,
    onTimeUpdate,
    onAddClearCount,
    onBoostMathCorrect,
    clearCount,
    totalMathCorrect,
    nextMiniGameThreshold,
    languageMode: initialLanguageMode
}) => {
    const [activeTab, setActiveTab] = useState<'CARDS' | 'RELICS' | 'POTIONS' | 'SYNTHESIS' | 'SYSTEM' | 'TRANSLATION'>('CARDS');
    const [searchTerm, setSearchTerm] = useState("");
    const [debugLanguageMode, setDebugLanguageMode] = useState<LanguageMode>(initialLanguageMode);
    const [transSubTab, setTransSubTab] = useState<'STORY' | 'FLAVOR' | 'CARD' | 'EVENT' | 'ENEMY' | 'MISSING'>('STORY');
    const [copied, setCopied] = useState(false);

    const [selectedDeck, setSelectedDeck] = useState<ICard[]>([]);
    const [selectedRelics, setSelectedRelics] = useState<Relic[]>([]);
    const [selectedPotions, setSelectedPotions] = useState<Potion[]>([]);

    const [synthSlot1, setSynthSlot1] = useState<ICard | null>(null);
    const [synthSlot2, setSynthSlot2] = useState<ICard | null>(null);
    const [synthResult, setSynthResult] = useState<ICard | null>(null);

    const allCards = useMemo(() => Object.values(CARDS_LIBRARY).sort((a, b) => a.type.localeCompare(b.type) || a.cost - b.cost), []);
    const allRelics = useMemo(() => Object.values(RELIC_LIBRARY), []);
    const allPotions = useMemo(() => Object.values(POTION_LIBRARY), []);

    const filteredCards = useMemo(() => allCards.filter(c =>
        c.name.includes(searchTerm) ||
        c.description.includes(searchTerm) ||
        c.type.includes(searchTerm)
    ), [allCards, searchTerm]);

    const handleAddCard = useCallback((template: any) => {
        const newCard: ICard = { ...template, id: `debug-${Date.now()}-${Math.random()}` };
        if (activeTab === 'SYNTHESIS') {
            if (!synthSlot1) setSynthSlot1(newCard);
            else if (!synthSlot2) setSynthSlot2(newCard);
        } else {
            setSelectedDeck(prev => [...prev, newCard]);
        }
    }, [activeTab, synthSlot1, synthSlot2]);

    const handleRemoveCard = useCallback((index: number) => {
        setSelectedDeck(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    const toggleRelic = useCallback((relic: Relic) => {
        setSelectedRelics(prev => {
            if (prev.find(r => r.id === relic.id)) {
                return prev.filter(r => r.id !== relic.id);
            } else {
                return [...prev, relic];
            }
        });
    }, []);

    const togglePotion = useCallback((potionTemplate: any) => {
        setSelectedPotions(prev => {
            if (prev.length >= 3) return prev;
            const newPotion: Potion = { ...potionTemplate, id: `debug-pot-${Date.now()}` };
            return [...prev, newPotion];
        });
    }, []);

    const removePotion = useCallback((index: number) => {
        setSelectedPotions(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    }, []);

    const clearDeck = () => setSelectedDeck([]);

    const performSynthesis = () => {
        if (!synthSlot1 || !synthSlot2) return;
        const newCard = synthesizeCards(synthSlot1, synthSlot2);
        setSynthResult(newCard);
    };

    const addSynthToDeck = () => {
        if (synthResult) {
            setSelectedDeck(prev => [...prev, { ...synthResult, id: `synth-added-${Date.now()}` }]);
        }
    };

    const addDebugTime = () => {
        const current = storageService.getDailyPlayTime();
        const next = current + (58 * 60);
        storageService.saveDailyPlayTime(next);
        onTimeUpdate(next);
        alert("きょうの ぼうけんじかんを 58ふん プラスしました。");
    };

    const resetDebugTime = () => {
        storageService.saveDailyPlayTime(0);
        onTimeUpdate(0);
        alert("きょうの ぼうけんじかんを リセットしました。");
    };

    // --- MISSING LIST LOGIC ---
    const missingList = useMemo(() => {
        const collected = new Set<string>();
        const kanjiRegex = /[一-龠]/;

        const check = (str: string) => {
            if (!str) return;
            const translated = trans(str, 'HIRAGANA');
            if (translated.match(kanjiRegex)) {
                collected.add(str);
            }
        };

        GAME_STORIES.forEach(s => s.parts.forEach(p => { check(p.title); check(p.content); }));
        FLAVOR_TEXTS.forEach(check);
        allCards.forEach(c => { check(c.name); check(c.description); });
        allRelics.forEach(r => { check(r.name); check(r.description); });
        allPotions.forEach(p => { check(p.name); check(p.description); });
        Object.values(ENEMY_LIBRARY).forEach(e => check(e.name));
        ENEMY_NAMES.forEach(check);
        EVENT_SAMPLES.forEach(ev => {
            check(ev.title);
            check(ev.description);
            ev.options.forEach(opt => { check(opt.label); check(opt.text); });
        });

        return Array.from(collected).sort();
    }, [allCards, allRelics, allPotions]);

    const copyMissingToClipboard = () => {
        const text = missingList.map(item => `"${item}": "",`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
            <div className="bg-red-900/90 border-b-2 border-red-500 p-2 md:p-4 flex justify-between items-center shrink-0 z-20">
                <h2 className="text-lg md:text-xl font-bold text-red-100 flex items-center">
                    <Zap size={20} className="mr-2" /> DEBUG
                </h2>
                <div className="flex gap-2 md:gap-4 text-sm md:text-base">
                    <button onClick={onBack} className="text-gray-300 hover:text-white underline">{trans("戻る", initialLanguageMode)}</button>
                    <button
                        onClick={() => onStartAct3Boss(selectedDeck, selectedRelics, selectedPotions)}
                        className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-1 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg border border-purple-400 text-xs"
                    >
                        ACT3 BOSS <Skull size={14} className="ml-1" />
                    </button>
                    <button
                        onClick={() => onStart(selectedDeck, selectedRelics, selectedPotions)}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 md:px-6 md:py-2 rounded font-bold flex items-center shadow-lg border-2 border-white animate-pulse text-xs md:text-sm"
                    >
                        {trans("出発する", initialLanguageMode)} <ArrowRight size={14} className="ml-1" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
                <div className="w-full md:w-3/4 h-[60%] md:h-full border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-800/50 min-h-0">
                    <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto shrink-0">
                        <button onClick={() => setActiveTab('CARDS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'CARDS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>カード</button>
                        <button onClick={() => setActiveTab('RELICS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'RELICS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>レリック</button>
                        <button onClick={() => setActiveTab('POTIONS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'POTIONS' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-750'}`}>ポーション</button>
                        <button onClick={() => setActiveTab('SYNTHESIS')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYNTHESIS' ? 'bg-purple-900 text-white' : 'text-purple-400 hover:bg-gray-750'}`}>合成</button>
                        <button onClick={() => setActiveTab('SYSTEM')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'SYSTEM' ? 'bg-indigo-900 text-white' : 'text-indigo-400 hover:bg-gray-750'}`}>システム</button>
                        <button onClick={() => setActiveTab('TRANSLATION')} className={`flex-1 py-3 px-2 text-xs md:text-sm font-bold whitespace-nowrap ${activeTab === 'TRANSLATION' ? 'bg-emerald-900 text-white' : 'text-emerald-400 hover:bg-gray-750'}`}>翻訳確認</button>
                    </div>

                    {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                        <div className="p-2 bg-gray-800/80 border-b border-gray-700 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="検索..."
                                    className="w-full bg-black border border-gray-600 rounded pl-9 p-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto p-2 md:p-4 custom-scrollbar min-h-0">
                        {activeTab === 'TRANSLATION' && (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 items-center bg-black/30 p-2 rounded-lg border border-gray-700 sticky top-0 z-10 backdrop-blur-md">
                                    <button
                                        onClick={() => setDebugLanguageMode(prev => prev === 'JAPANESE' ? 'HIRAGANA' : 'JAPANESE')}
                                        className={`px-4 py-1.5 rounded-full font-bold text-xs flex items-center gap-2 border-2 transition-all ${debugLanguageMode === 'HIRAGANA' ? 'bg-emerald-600 border-white text-white shadow-lg' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                                    >
                                        <Languages size={14} />
                                        {debugLanguageMode === 'JAPANESE' ? '日本語 モード' : 'ひらがな モード'}
                                    </button>
                                    <div className="h-4 w-px bg-gray-700 mx-2"></div>
                                    <button onClick={() => setTransSubTab('STORY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'STORY' ? 'bg-white text-black' : 'text-gray-400'}`}><BookOpen size={12} /> ストーリー</button>
                                    <button onClick={() => setTransSubTab('FLAVOR')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'FLAVOR' ? 'bg-white text-black' : 'text-gray-400'}`}><MessageSquare size={12} /> ログ</button>
                                    <button onClick={() => setTransSubTab('CARD')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'CARD' ? 'bg-white text-black' : 'text-gray-400'}`}><Swords size={12} /> カード</button>
                                    <button onClick={() => setTransSubTab('EVENT')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'EVENT' ? 'bg-white text-black' : 'text-gray-400'}`}><HelpCircle size={12} /> イベント</button>
                                    <button onClick={() => setTransSubTab('ENEMY')} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 ${transSubTab === 'ENEMY' ? 'bg-white text-black' : 'text-gray-400'}`}><Skull size={12} /> 敵</button>
                                    <button
                                        onClick={() => setTransSubTab('MISSING')}
                                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 relative ${transSubTab === 'MISSING' ? 'bg-red-600 text-white' : 'text-red-400'}`}
                                    >
                                        <AlertCircle size={12} /> 未登録リスト
                                        {missingList.length > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[8px] px-1 rounded-full font-black border border-red-600">
                                                {missingList.length}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="bg-black/20 rounded-xl overflow-hidden border border-gray-700">
                                    {transSubTab === 'STORY' && GAME_STORIES.map(set => (
                                        <React.Fragment key={set.id}>
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-indigo-400 border-y border-gray-700">SET: {set.id}</div>
                                            {set.parts.map((part, i) => (
                                                <React.Fragment key={i}>
                                                    <TranslationRow original={part.title} context={`Act ${i + 1} Title`} debugLanguageMode={debugLanguageMode} />
                                                    <TranslationRow original={part.content} context={`Act ${i + 1} Content`} debugLanguageMode={debugLanguageMode} />
                                                </React.Fragment>
                                            ))}
                                        </React.Fragment>
                                    ))}

                                    {transSubTab === 'FLAVOR' && FLAVOR_TEXTS.map((text, i) => (
                                        <TranslationRow key={i} original={text} context={`Flavor ${i + 1}`} debugLanguageMode={debugLanguageMode} />
                                    ))}

                                    {transSubTab === 'CARD' && allCards.map((card, i) => (
                                        <React.Fragment key={i}>
                                            <TranslationRow original={card.name} context={`${card.type} Name`} debugLanguageMode={debugLanguageMode} />
                                            <TranslationRow original={card.description} context={`${card.name} Desc`} debugLanguageMode={debugLanguageMode} />
                                        </React.Fragment>
                                    ))}

                                    {transSubTab === 'EVENT' && EVENT_SAMPLES.map((event, i) => (
                                        <div key={i} className="border-b-2 border-indigo-900/50 bg-black/10 last:border-0">
                                            <div className="bg-indigo-950/40 p-1 px-3 text-[10px] font-black text-indigo-300">EVENT: {event.title}</div>
                                            <TranslationRow original={event.title} context="Title" debugLanguageMode={debugLanguageMode} />
                                            <TranslationRow original={event.description} context="Description" debugLanguageMode={debugLanguageMode} />
                                            {event.options.map((opt, oi) => (
                                                <div key={oi} className="ml-4 border-l-2 border-indigo-800/30">
                                                    <TranslationRow original={opt.label} context={`Option ${oi + 1} Label`} debugLanguageMode={debugLanguageMode} isInline />
                                                    <TranslationRow original={opt.text} context={`Option ${oi + 1} Explain`} debugLanguageMode={debugLanguageMode} isInline />
                                                </div>
                                            ))}
                                        </div>
                                    ))}

                                    {transSubTab === 'ENEMY' && (
                                        <>
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-red-400 border-y border-gray-700">LIBRARY ENEMIES</div>
                                            {Object.values(ENEMY_LIBRARY).map((enemy, i) => (
                                                <TranslationRow key={i} original={enemy.name} context={`Tier ${enemy.tier}`} debugLanguageMode={debugLanguageMode} />
                                            ))}
                                            <div className="bg-gray-800/80 p-1 px-3 text-[10px] font-black text-orange-400 border-y border-gray-700">GENERATED NAMES</div>
                                            {ENEMY_NAMES.map((name, i) => (
                                                <TranslationRow key={i} original={name} context="Random Enemy" debugLanguageMode={debugLanguageMode} />
                                            ))}
                                        </>
                                    )}

                                    {transSubTab === 'MISSING' && (
                                        <div className="p-4 flex flex-col gap-4 bg-slate-900/80 min-h-[400px]">
                                            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                                                    <AlertCircle size={16} /> 辞書未登録・漢字残留項目
                                                </h3>
                                                <button
                                                    onClick={copyMissingToClipboard}
                                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs transition-all ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                                                >
                                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                                    {copied ? 'COPIED!' : '辞書形式でコピー'}
                                                </button>
                                            </div>
                                            <textarea
                                                readOnly
                                                className="w-full h-96 bg-black text-green-500 font-mono text-[10px] p-4 rounded border border-gray-700 focus:outline-none custom-scrollbar"
                                                value={missingList.map(item => `"${item}": "",`).join('\n')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'SYSTEM' && (
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-amber-300 font-bold mb-4 flex items-center"><Plus size={18} className="mr-2" /> 解禁モーダル確認</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={onAddClearCount}
                                            className="bg-amber-700 hover:bg-amber-600 text-white p-4 rounded-xl border border-amber-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <Plus size={32} />
                                            <div className="font-bold">主人公解禁用にクリア回数を+1</div>
                                            <div className="text-xs text-amber-100/80">現在: {clearCount} クリア</div>
                                        </button>
                                        <button
                                            onClick={onBoostMathCorrect}
                                            className="bg-cyan-700 hover:bg-cyan-600 text-white p-4 rounded-xl border border-cyan-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <BookOpen size={32} />
                                            <div className="font-bold">次のミニゲーム解禁まで正解数を加算</div>
                                            <div className="text-xs text-cyan-100/80">
                                                {nextMiniGameThreshold
                                                    ? `現在: ${totalMathCorrect} 問 / 次: ${nextMiniGameThreshold} 問`
                                                    : `現在: ${totalMathCorrect} 問 / 全解禁済み`}
                                            </div>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">
                                        ここで増やした分は、デバッグメニューから戻った時に既存の解禁モーダルで確認できます。
                                    </p>
                                </section>

                                <section>
                                    <h3 className="text-indigo-300 font-bold mb-4 flex items-center"><Clock size={18} className="mr-2" /> 時間制限テスト</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            onClick={addDebugTime}
                                            className="bg-indigo-700 hover:bg-indigo-600 text-white p-4 rounded-xl border border-indigo-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <History size={32} />
                                            <div className="font-bold">今日のプレイ時間を58分進める</div>
                                        </button>
                                        <button
                                            onClick={resetDebugTime}
                                            className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl border border-slate-500 shadow-lg flex flex-col items-center gap-2 transition-transform active:scale-95"
                                        >
                                            <RotateCcw size={32} />
                                            <div className="font-bold">今日のプレイ時間をリセット</div>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'SYNTHESIS' && (
                            <div className="mb-8 border-b-2 border-purple-500 pb-4">
                                <h3 className="text-purple-300 font-bold mb-4 flex items-center text-sm md:text-base"><Beaker className="mr-2" /> SYNTHESIS LAB</h3>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4 bg-black/40 p-4 rounded-xl">
                                    <div className="flex gap-4">
                                        <div
                                            className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                            onClick={() => setSynthSlot1(null)}
                                        >
                                            {synthSlot1 ? (
                                                <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot1} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">Slot 1</span>
                                            )}
                                        </div>
                                        <div className="flex items-center"><Plus size={20} className="text-gray-500" /></div>
                                        <div
                                            className="w-20 h-32 md:w-24 md:h-36 border-2 border-dashed border-gray-500 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 bg-gray-900"
                                            onClick={() => setSynthSlot2(null)}
                                        >
                                            {synthSlot2 ? (
                                                <div className="scale-[0.6] md:scale-75 pointer-events-none"><Card card={synthSlot2} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                            ) : (
                                                <span className="text-gray-600 text-xs">Slot 2</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col gap-2 items-center">
                                        <button
                                            onClick={performSynthesis}
                                            disabled={!synthSlot1 || !synthSlot2}
                                            className={`px-4 py-2 rounded font-bold text-xs md:text-sm ${!synthSlot1 || !synthSlot2 ? 'bg-gray-700 text-gray-500' : 'bg-purple-600 text-white hover:bg-purple-500 animate-pulse'}`}
                                        >
                                            Mix
                                        </button>
                                        <button
                                            onClick={() => { setSynthSlot1(null); setSynthSlot2(null); setSynthResult(null); }}
                                            className="text-gray-500 hover:text-white text-xs flex items-center justify-center"
                                        >
                                            <RotateCcw size={12} className="mr-1" /> やめる
                                        </button>
                                    </div>

                                    {synthResult && (
                                        <>
                                            <ArrowRight size={24} className="text-purple-400 rotate-90 md:rotate-0" />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="scale-[0.8] md:scale-90"><Card card={synthResult} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} /></div>
                                                <button
                                                    onClick={addSynthToDeck}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold w-full"
                                                >
                                                    ゲット
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {(activeTab === 'CARDS' || activeTab === 'SYNTHESIS') && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                {filteredCards.map((c, idx) => (
                                    <div key={idx} className="cursor-pointer hover:scale-105 transition-transform flex justify-center" onClick={() => handleAddCard(c)}>
                                        <div className="scale-90 origin-top pointer-events-none -mb-4">
                                            <Card card={{ ...c, id: 'temp' }} onClick={() => { }} disabled={false} languageMode={initialLanguageMode} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'RELICS' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {allRelics.map((r) => {
                                    const isSelected = selectedRelics.some(sr => sr.id === r.id);
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => toggleRelic(r)}
                                            className={`p-2 rounded border cursor-pointer flex flex-col items-center text-center transition-all ${isSelected ? 'bg-yellow-900/50 border-yellow-400 scale-105' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
                                        >
                                            <Gem size={20} className={isSelected ? "text-yellow-400" : "text-gray-500"} />
                                            <span className="text-[10px] mt-1 font-bold leading-tight">{trans(r.name, initialLanguageMode)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'POTIONS' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {allPotions.map((p, idx) => {
                                    const isOwned = selectedPotions.some(sp => sp.templateId === p.templateId);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => togglePotion(p)}
                                            className={`p-2 rounded border transition-all bg-black/40 cursor-pointer flex flex-col items-center text-center ${isOwned ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-700 hover:border-white'}`}
                                        >
                                            <FlaskConical size={20} style={{ color: p.color }} />
                                            <span className="text-[10px] mt-1 font-bold">{trans(p.name, initialLanguageMode)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-1/4 h-[40%] md:h-full flex flex-col bg-black/20 text-xs min-h-0">
                    <div className="p-2 bg-black/50 border-b border-gray-700 font-bold text-gray-300 text-[10px] md:text-xs shrink-0">
                        LOADOUT
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 md:p-3 custom-scrollbar space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-blue-300 flex items-center text-[10px] md:text-xs"><Swords size={12} className="mr-1" /> デッキ ({selectedDeck.length})</h3>
                                <button onClick={clearDeck} className="text-[10px] text-red-400 hover:text-red-200">Clear</button>
                            </div>
                            <div className="space-y-1">
                                {selectedDeck.map((c, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700 group">
                                        <span className={`truncate text-[10px] ${c.type === CardType.ATTACK ? 'text-red-300' : c.type === CardType.SKILL ? 'text-blue-300' : 'text-yellow-300'}`}>
                                            {trans(c.name, initialLanguageMode)}
                                        </span>
                                        <button onClick={() => handleRemoveCard(idx)} className="text-gray-500 hover:text-red-500 ml-1 shrink-0">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-yellow-300 mb-1 flex items-center text-[10px] md:text-xs"><Gem size={12} className="mr-1" /> レリック ({selectedRelics.length})</h3>
                            <div className="flex flex-wrap gap-1">
                                {selectedRelics.map(r => (
                                    <div key={r.id} className="bg-gray-800 p-1 rounded border border-yellow-700 flex items-center shadow-sm">
                                        <span className="truncate max-w-[60px] text-[9px]">{trans(r.name, initialLanguageMode)}</span>
                                        <button onClick={() => toggleRelic(r)} className="ml-1 text-gray-500 hover:text-red-500"><X size={10} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-purple-300 mb-1 flex items-center text-[10px] md:text-xs"><FlaskConical size={12} className="mr-1" /> ポーション ({selectedPotions.length})</h3>
                            <div className="space-y-1">
                                {selectedPotions.map((p, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-800 p-1 rounded border border-gray-700">
                                        <span style={{ color: p.color }} className="truncate text-[10px]">{trans(p.name, initialLanguageMode)}</span>
                                        <button onClick={() => removePotion(idx)} className="text-gray-500 hover:text-red-500 ml-1 shrink-0">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugMenuScreen;
