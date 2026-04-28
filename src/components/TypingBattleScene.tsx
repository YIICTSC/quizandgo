import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card as ICard, CardType, Enemy, EnemyIntentType, LanguageMode, Player, Potion, SelectionState, VisualEffectInstance } from '../types';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';
import EnemyIllustration from './EnemyIllustration';
import Card from './Card';
import { BattleFinisherCutinOverlay as StandardBattleFinisherCutinOverlay, FloatingTextOverlay as StandardFloatingTextOverlay, VFXOverlay as StandardVFXOverlay } from './BattleScene';
import { AlertCircle, FlaskConical, Gem, Heart, Keyboard, Shield, Skull, Triangle, Zap, Settings } from 'lucide-react';
import { getTypingLessonDefinition, TypingLessonId } from '../data/typingLessonConfig';

interface TypingBattleSceneProps {
    player: Player;
    enemies: Enemy[];
    selectedEnemyId: string | null;
    onSelectEnemy: (id: string) => void;
    onPlayTypingCard: (card: ICard) => void;
    onEndTurn: () => void;
    turnLog: string;
    narrative: string;
    actingEnemyId: string | null;
    selectionState: SelectionState;
    onHandSelection: (card: ICard) => void;
    onCancelSelection: () => void;
    onUsePotion: (potion: Potion) => void;
    combatLog: string[];
    languageMode: LanguageMode;
    activeEffects: VisualEffectInstance[];
    finisherCutinCard?: ICard | null;
    act: number;
    floor: number;
    lessonId?: string;
    onAbort: () => void;
    hideEnemyIntents?: boolean;
    onOpenSettings?: () => void;
}

type FingerId =
    | 'left-pinky'
    | 'left-ring'
    | 'left-middle'
    | 'left-index'
    | 'thumbs'
    | 'right-index'
    | 'right-middle'
    | 'right-ring'
    | 'right-pinky';

type TypingPrompt = {
    id: string;
    title: string;
    text: string;
    answer: string;
    acceptedAnswers: string[];
    guide: string;
    finger: FingerId | null;
};

const KEYBOARD_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '^'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '@', '['],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ':', ']'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '_'],
    ['space']
];

const FINGER_LABELS: Record<FingerId, string> = {
    'left-pinky': '左小指',
    'left-ring': '左薬指',
    'left-middle': '左中指',
    'left-index': '左人差し指',
    thumbs: '親指',
    'right-index': '右人差し指',
    'right-middle': '右中指',
    'right-ring': '右薬指',
    'right-pinky': '右小指'
};

const FINGER_COLORS: Record<FingerId, string> = {
    'left-pinky': 'bg-pink-500/25 border-pink-400 text-pink-200',
    'left-ring': 'bg-red-500/25 border-red-400 text-red-200',
    'left-middle': 'bg-orange-500/25 border-orange-400 text-orange-200',
    'left-index': 'bg-yellow-500/25 border-yellow-400 text-yellow-100',
    thumbs: 'bg-slate-500/25 border-slate-400 text-slate-100',
    'right-index': 'bg-emerald-500/25 border-emerald-400 text-emerald-100',
    'right-middle': 'bg-cyan-500/25 border-cyan-400 text-cyan-100',
    'right-ring': 'bg-blue-500/25 border-blue-400 text-blue-100',
    'right-pinky': 'bg-violet-500/25 border-violet-400 text-violet-100'
};

const KEY_FINGER_MAP: Record<string, FingerId> = {
    '1': 'left-pinky', q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
    '2': 'left-ring', w: 'left-ring', s: 'left-ring', x: 'left-ring',
    '3': 'left-middle', e: 'left-middle', d: 'left-middle', c: 'left-middle',
    '4': 'left-index', '5': 'left-index', r: 'left-index', t: 'left-index', f: 'left-index', g: 'left-index', v: 'left-index', b: 'left-index',
    space: 'thumbs',
    '6': 'right-index', '7': 'right-index', y: 'right-index', u: 'right-index', h: 'right-index', j: 'right-index', n: 'right-index', m: 'right-index',
    '8': 'right-middle', i: 'right-middle', k: 'right-middle', ',': 'right-middle',
    '9': 'right-ring', o: 'right-ring', l: 'right-ring', '.': 'right-ring',
    '0': 'right-pinky', '-': 'right-pinky', '^': 'right-pinky', p: 'right-pinky', '@': 'right-pinky', '[': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky', ']': 'right-pinky', '/': 'right-pinky', _: 'right-pinky'
};

const HOME_ROW_GROUPS = [
    ['f', 'j', 'ff', 'jj', 'fj', 'jf', 'fff', 'jjj', 'fjj', 'jff', 'fjf', 'jfj'],
    ['d', 'k', 'f', 'j', 'df', 'jk', 'dk', 'kj', 'dd', 'kk', 'dfj', 'jkd', 'fdk', 'kjf'],
    ['s', 'l', 'd', 'k', 'f', 'j', 'sd', 'lk', 'sdf', 'jkl', 'sdl', 'lkj', 'asdf', 'jkl;', 'sdfj', 'lkjd'],
    ['a', ';', 's', 'l', 'd', 'k', 'f', 'j', 'asd', 'jkl', 'asdf', 'fjkl', 'asdf', 'jkl;', 'asdfj', 'fjkl;', 'a;','asl;'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', 'asdfg', 'hjkl;', 'ghfj', 'asdfjkl;', 'fghj', 'dfgh', 'hjkl', 'asdfgh', 'ghjkl;', 'asdfghjkl;']
];

const ALPHABET_WORDS = [
    ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'X', 'Y', 'Z'],
    ['apple', 'train', 'music', 'light', 'story', 'paper', 'happy', 'chair', 'clock', 'dream', 'smile', 'water', 'piano', 'candy', 'flower', 'orange'],
    ['school', 'friend', 'garden', 'window', 'yellow', 'lesson', 'pencil', 'planet', 'rabbit', 'summer', 'morning', 'library', 'teacher', 'picture', 'rainbow', 'science'],
    ['adventure', 'question', 'keyboard', 'homework', 'treasure', 'notebook', 'beautiful', 'computer', 'afternoon', 'wonderland', 'classmate', 'breaktime', 'chocolate', 'pineapple', 'snowflake', 'sunshine'],
    ['champion', 'wonderful', 'classroom', 'flashlight', 'breakfast', 'playground', 'dictionary', 'everywhere', 'friendship', 'knowledge', 'technology', 'basketball', 'watermelon', 'understand', 'remembering', 'celebration', 'ABC', 'MusicRoom', 'ClassMate', 'Notebook']
];

const NUMBER_SYMBOL_DRILLS = [
    ['12', '34', '56', '78', '90', '11', '22', '44', '55', '99', '13', '24', '68', '79', '101', '202'],
    ['120', '305', '480', '750', '999', '246', '531', '808', '415', '672', '135', '864', '720', '640', '512', '1000'],
    ['7:30', '12:15', '18:45', '06:20', '20:10', '09:05', '14:40', '16:25', '19:55', '08:08', '10:30', '21:05', '05:45', '13:20', '17:15', '23:59'],
    ['1+1', '3-2', '4*5', '8/2', '10-7', '9+6', '12-4', '7*8', '18/3', '5+9', '25-8', '6*7', '42/6', '11+13', '30-12', '9*9'],
    ['2026/03/09', 'room-3', 'score:88', 'no.12', 'level_5', 'class-1', 'goal:100', 'rank_2', 'day/7', 'page-24', 'zone_A', 'item-05', 'step_4', 'code-99', 'hp:120', 'combo_8', '!?', '()', '[]', '{}', '...']
];

const ROMAJI_BASIC = [
    [
        { text: 'あ', accepted: ['a'] }, { text: 'い', accepted: ['i'] }, { text: 'う', accepted: ['u'] }, { text: 'え', accepted: ['e'] }, { text: 'お', accepted: ['o'] },
        { text: 'あい', accepted: ['ai'] }, { text: 'あお', accepted: ['ao'] }, { text: 'あさ', accepted: ['asa'] }, { text: 'あめ', accepted: ['ame'] }, { text: 'あし', accepted: ['ashi', 'asi'] },
        { text: 'いえ', accepted: ['ie'] }, { text: 'いぬ', accepted: ['inu'] }, { text: 'いし', accepted: ['ishi', 'isi'] }, { text: 'いと', accepted: ['ito'] }, { text: 'いす', accepted: ['isu'] },
        { text: 'うえ', accepted: ['ue'] }, { text: 'うみ', accepted: ['umi'] }, { text: 'うた', accepted: ['uta'] }, { text: 'うし', accepted: ['ushi', 'usi'] }, { text: 'うで', accepted: ['ude'] },
        { text: 'えき', accepted: ['eki'] }, { text: 'えだ', accepted: ['eda'] }, { text: 'えほん', accepted: ['ehon'] }, { text: 'えび', accepted: ['ebi'] }, { text: 'えがお', accepted: ['egao'] },
        { text: 'おに', accepted: ['oni'] }, { text: 'おと', accepted: ['oto'] }, { text: 'おか', accepted: ['oka'] }, { text: 'おけ', accepted: ['oke'] }, { text: 'おや', accepted: ['oya'] }
    ],
    [
        { text: 'か', accepted: ['ka'] }, { text: 'き', accepted: ['ki'] }, { text: 'く', accepted: ['ku'] }, { text: 'け', accepted: ['ke'] }, { text: 'こ', accepted: ['ko'] },
        { text: 'かい', accepted: ['kai'] }, { text: 'かお', accepted: ['kao'] }, { text: 'かき', accepted: ['kaki'] }, { text: 'かさ', accepted: ['kasa'] }, { text: 'かに', accepted: ['kani'] },
        { text: 'きく', accepted: ['kiku'] }, { text: 'きり', accepted: ['kiri'] }, { text: 'きのこ', accepted: ['kinoko'] }, { text: 'きつね', accepted: ['kitsune'] }, { text: 'きもの', accepted: ['kimono'] },
        { text: 'くし', accepted: ['kushi', 'kusi'] }, { text: 'くも', accepted: ['kumo'] }, { text: 'くり', accepted: ['kuri'] }, { text: 'くじら', accepted: ['kujira'] }, { text: 'くさ', accepted: ['kusa'] },
        { text: 'けし', accepted: ['keshi', 'kesi'] }, { text: 'けむり', accepted: ['kemuri'] }, { text: 'けもの', accepted: ['kemono'] }, { text: 'けいと', accepted: ['keito'] }, { text: 'けむし', accepted: ['kemushi', 'kemusi'] },
        { text: 'こい', accepted: ['koi'] }, { text: 'こえ', accepted: ['koe'] }, { text: 'こま', accepted: ['koma'] }, { text: 'こな', accepted: ['kona'] }, { text: 'こや', accepted: ['koya'] }
    ],
    [
        { text: 'さ', accepted: ['sa'] }, { text: 'し', accepted: ['shi', 'si'] }, { text: 'す', accepted: ['su'] }, { text: 'せ', accepted: ['se'] }, { text: 'そ', accepted: ['so'] },
        { text: 'さくら', accepted: ['sakura'] }, { text: 'さかな', accepted: ['sakana'] }, { text: 'さとう', accepted: ['satou', 'sato'] }, { text: 'さる', accepted: ['saru'] }, { text: 'さかなつり', accepted: ['sakanatsuri'] },
        { text: 'しお', accepted: ['shio', 'sio'] }, { text: 'しか', accepted: ['shika', 'sika'] }, { text: 'しま', accepted: ['shima', 'sima'] }, { text: 'しろ', accepted: ['shiro', 'siro'] }, { text: 'しんぶん', accepted: ['shinbun', 'sinbun'] },
        { text: 'すいか', accepted: ['suika'] }, { text: 'すな', accepted: ['suna'] }, { text: 'すし', accepted: ['sushi', 'susi'] }, { text: 'すもう', accepted: ['sumou', 'sumo'] }, { text: 'すず', accepted: ['suzu'] },
        { text: 'せみ', accepted: ['semi'] }, { text: 'せかい', accepted: ['sekai'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'せなか', accepted: ['senaka'] }, { text: 'せんろ', accepted: ['senro'] },
        { text: 'そら', accepted: ['sora'] }, { text: 'そば', accepted: ['soba'] }, { text: 'そと', accepted: ['soto'] }, { text: 'そり', accepted: ['sori'] }, { text: 'そうじ', accepted: ['souji', 'soji'] }
    ],
    [{ text: 'た', accepted: ['ta'] }, { text: 'ち', accepted: ['chi', 'ti'] }, { text: 'つ', accepted: ['tsu', 'tu'] }, { text: 'て', accepted: ['te'] }, { text: 'と', accepted: ['to'] }, { text: 'な', accepted: ['na'] }, { text: 'に', accepted: ['ni'] }, { text: 'ぬ', accepted: ['nu'] }, { text: 'ね', accepted: ['ne'] }, { text: 'の', accepted: ['no'] }, { text: 'は', accepted: ['ha'] }, { text: 'ひ', accepted: ['hi'] }, { text: 'ふ', accepted: ['fu', 'hu'] }, { text: 'へ', accepted: ['he'] }, { text: 'ほ', accepted: ['ho'] }, { text: 'ま', accepted: ['ma'] }, { text: 'み', accepted: ['mi'] }, { text: 'む', accepted: ['mu'] }, { text: 'め', accepted: ['me'] }, { text: 'も', accepted: ['mo'] }, { text: 'や', accepted: ['ya'] }, { text: 'ゆ', accepted: ['yu'] }, { text: 'よ', accepted: ['yo'] }, { text: 'ら', accepted: ['ra'] }, { text: 'り', accepted: ['ri'] }, { text: 'る', accepted: ['ru'] }, { text: 'れ', accepted: ['re'] }, { text: 'ろ', accepted: ['ro'] }, { text: 'わ', accepted: ['wa'] }, { text: 'を', accepted: ['wo', 'o'] }, { text: 'ん', accepted: ['n', 'nn'] }, { text: 'とけい', accepted: ['tokei'] }, { text: 'ちから', accepted: ['chikara', 'tikara'] }],
    [
        { text: 'たこ', accepted: ['tako'] }, { text: 'たまご', accepted: ['tamago'] }, { text: 'たから', accepted: ['takara'] }, { text: 'たいこ', accepted: ['taiko'] }, { text: 'たぬき', accepted: ['tanuki'] },
        { text: 'ちず', accepted: ['chizu', 'tizu'] }, { text: 'ちから', accepted: ['chikara', 'tikara'] }, { text: 'ちきゅう', accepted: ['chikyuu', 'tikyuu'] }, { text: 'ちずちょう', accepted: ['chizuchou', 'tizutyou'] }, { text: 'ちいき', accepted: ['chiiki', 'tiiki'] },
        { text: 'つき', accepted: ['tsuki', 'tuki'] }, { text: 'つな', accepted: ['tsuna', 'tuna'] }, { text: 'つる', accepted: ['tsuru', 'turu'] }, { text: 'つばさ', accepted: ['tsubasa', 'tubasa'] }, { text: 'つみき', accepted: ['tsumiki', 'tumiki'] },
        { text: 'てら', accepted: ['tera'] }, { text: 'てがみ', accepted: ['tegami'] }, { text: 'てつどう', accepted: ['tetsudou', 'tetudou'] }, { text: 'てぶくろ', accepted: ['tebukuro'] }, { text: 'てんき', accepted: ['tenki'] },
        { text: 'とけい', accepted: ['tokei'] }, { text: 'とり', accepted: ['tori'] }, { text: 'とびら', accepted: ['tobira'] }, { text: 'ともだち', accepted: ['tomodachi', 'tomodati'] }, { text: 'とら', accepted: ['tora'] },
        { text: 'がっこう', accepted: ['gakkou', 'gakko'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'きょうしつ', accepted: ['kyoushitsu', 'kyositu'] }, { text: 'ぼうけん', accepted: ['bouken', 'boken'] }, { text: 'しんごう', accepted: ['shingou', 'singo'] },
        { text: 'はなみ', accepted: ['hanami'] }, { text: 'ふね', accepted: ['fune', 'hune'] }, { text: 'へや', accepted: ['heya'] }, { text: 'ほし', accepted: ['hoshi', 'hosi'] },
        { text: 'まど', accepted: ['mado'] }, { text: 'みず', accepted: ['mizu'] }, { text: 'むし', accepted: ['mushi', 'musi'] }, { text: 'めがね', accepted: ['megane'] }, { text: 'もり', accepted: ['mori'] },
        { text: 'やま', accepted: ['yama'] }, { text: 'ゆめ', accepted: ['yume'] }, { text: 'よる', accepted: ['yoru'] },
        { text: 'らいおん', accepted: ['raion'] }, { text: 'りす', accepted: ['risu'] }, { text: 'るすばん', accepted: ['rusuban'] }, { text: 'れもん', accepted: ['remon'] }, { text: 'ろうか', accepted: ['rouka', 'roka'] },
        { text: 'わに', accepted: ['wani'] }, { text: 'わごむ', accepted: ['wagomu'] }, { text: 'をとこ', accepted: ['wotoko', 'otoko'] }, { text: 'しんぶん', accepted: ['shinbun', 'sinbun'] },
        { text: 'なつやすみ', accepted: ['natsuyasumi'] }, { text: 'はくぶつかん', accepted: ['hakubutsukan'] }, { text: 'まほう', accepted: ['mahou', 'maho'] }, { text: 'ゆうぐ', accepted: ['yuugu', 'yugu'] }, { text: 'れきし', accepted: ['rekishi'] }, { text: 'わらいごえ', accepted: ['waraigoe'] }
    ]
];

const ROMAJI_ADVANCED = [
    [
        { text: 'が', accepted: ['ga'] }, { text: 'ぎ', accepted: ['gi'] }, { text: 'ぐ', accepted: ['gu'] }, { text: 'げ', accepted: ['ge'] }, { text: 'ご', accepted: ['go'] },
        { text: 'ざ', accepted: ['za'] }, { text: 'じ', accepted: ['ji', 'zi'] }, { text: 'ず', accepted: ['zu'] }, { text: 'ぜ', accepted: ['ze'] }, { text: 'ぞ', accepted: ['zo'] },
        { text: 'だ', accepted: ['da'] }, { text: 'ぢ', accepted: ['di', 'ji'] }, { text: 'づ', accepted: ['du', 'zu'] }, { text: 'で', accepted: ['de'] }, { text: 'ど', accepted: ['do'] },
        { text: 'ば', accepted: ['ba'] }, { text: 'び', accepted: ['bi'] }, { text: 'ぶ', accepted: ['bu'] }, { text: 'べ', accepted: ['be'] }, { text: 'ぼ', accepted: ['bo'] },
        { text: 'ぱ', accepted: ['pa'] }, { text: 'ぴ', accepted: ['pi'] }, { text: 'ぷ', accepted: ['pu'] }, { text: 'ぺ', accepted: ['pe'] }, { text: 'ぽ', accepted: ['po'] },
        { text: 'きゃ', accepted: ['kya'] }, { text: 'きゅ', accepted: ['kyu'] }, { text: 'きょ', accepted: ['kyo'] },
        { text: 'しゃ', accepted: ['sha', 'sya'] }, { text: 'しゅ', accepted: ['shu', 'syu'] }, { text: 'しょ', accepted: ['sho', 'syo'] },
        { text: 'ちゃ', accepted: ['cha', 'tya'] }, { text: 'ちゅ', accepted: ['chu', 'tyu'] }, { text: 'ちょ', accepted: ['cho', 'tyo'] }
    ],
    [
        { text: 'にゃ', accepted: ['nya'] }, { text: 'にゅ', accepted: ['nyu'] }, { text: 'にょ', accepted: ['nyo'] },
        { text: 'ひゃ', accepted: ['hya'] }, { text: 'ひゅ', accepted: ['hyu'] }, { text: 'ひょ', accepted: ['hyo'] },
        { text: 'みゃ', accepted: ['mya'] }, { text: 'みゅ', accepted: ['myu'] }, { text: 'みょ', accepted: ['myo'] },
        { text: 'りゃ', accepted: ['rya'] }, { text: 'りゅ', accepted: ['ryu'] }, { text: 'りょ', accepted: ['ryo'] },
        { text: 'ぎゃ', accepted: ['gya'] }, { text: 'ぎゅ', accepted: ['gyu'] }, { text: 'ぎょ', accepted: ['gyo'] },
        { text: 'じゃ', accepted: ['ja', 'zya'] }, { text: 'じゅ', accepted: ['ju', 'zyu'] }, { text: 'じょ', accepted: ['jo', 'zyo'] },
        { text: 'びゃ', accepted: ['bya'] }, { text: 'びゅ', accepted: ['byu'] }, { text: 'びょ', accepted: ['byo'] },
        { text: 'ぴゃ', accepted: ['pya'] }, { text: 'ぴゅ', accepted: ['pyu'] }, { text: 'ぴょ', accepted: ['pyo'] },
        { text: 'きゃく', accepted: ['kyaku'] }, { text: 'きゅうり', accepted: ['kyuuri', 'kyuri'] }, { text: 'きょう', accepted: ['kyou', 'kyo'] },
        { text: 'しゃしん', accepted: ['shashin', 'syasin'] }, { text: 'しゅくだい', accepted: ['shukudai', 'syukudai'] }, { text: 'しょうがく', accepted: ['shougaku', 'syougaku', 'shogaku'] },
        { text: 'ちゃわん', accepted: ['chawan', 'tyawan'] }, { text: 'ちゅうがく', accepted: ['chuugaku', 'tyuugaku'] }, { text: 'ちょうちょ', accepted: ['choucho', 'tyoutyo'] },
        { text: 'にゃんこ', accepted: ['nyanko'] }, { text: 'にゅうがく', accepted: ['nyuugaku', 'nyugaku'] }, { text: 'にょきにょき', accepted: ['nyokinyoki'] },
        { text: 'ひゃく', accepted: ['hyaku'] }, { text: 'ひゅう', accepted: ['hyuu', 'hyu'] }, { text: 'ひょう', accepted: ['hyou', 'hyo'] },
        { text: 'みゃく', accepted: ['myaku'] }, { text: 'みゅーじっく', accepted: ['myu-jikku', 'myuujikku'] }, { text: 'みょうじ', accepted: ['myouji', 'myoji'] },
        { text: 'りゃく', accepted: ['ryaku'] }, { text: 'りゅう', accepted: ['ryuu', 'ryu'] }, { text: 'りょうり', accepted: ['ryouri', 'ryori'] },
        { text: 'ぁ', accepted: ['la', 'xa'] }, { text: 'ぃ', accepted: ['li', 'xi'] }, { text: 'ぅ', accepted: ['lu', 'xu'] }, { text: 'ぇ', accepted: ['le', 'xe'] }, { text: 'ぉ', accepted: ['lo', 'xo'] }
    ],
    [
        { text: 'がっこう', accepted: ['gakkou', 'gakko'] }, { text: 'きって', accepted: ['kitte'] }, { text: 'さっか', accepted: ['sakka'] }, { text: 'しっぱい', accepted: ['shippai'] }, { text: 'ざっし', accepted: ['zasshi'] }, { text: 'きっさてん', accepted: ['kissaten'] }, { text: 'がっしょう', accepted: ['gasshou', 'gassyo'] }, { text: 'きっちん', accepted: ['kicchin'] }, { text: 'はっぴ', accepted: ['happi'] }, { text: 'ろっかー', accepted: ['rokkaa', 'rokka-'] },
        { text: 'おかあさん', accepted: ['okaasan', 'okasan'] }, { text: 'せんせい', accepted: ['sensei'] }, { text: 'こうえん', accepted: ['kouen', 'koen'] }, { text: 'コーヒー', accepted: ['ko-hi-', 'koohii'] }, { text: 'ほん', accepted: ['hon'] }, { text: 'かんじ', accepted: ['kanji'] }, { text: 'てんき', accepted: ['tenki'] },
        { text: 'あ、あの', accepted: ['a,ano', 'a、あの'] }, { text: 'ぼ、ぼく', accepted: ['bo,boku', 'bo、ぼく'] }, { text: 'えっ', accepted: ['えっ', 'extsu', 'extu', 'eltsu', 'eltu'] }
    ],
    [
        { text: 'ぎゃく', accepted: ['gyaku'] }, { text: 'ぎゅうにゅう', accepted: ['gyuunyuu', 'gyunyuu'] }, { text: 'ぎょうれつ', accepted: ['gyouretsu', 'gyoretsu'] }, { text: 'じゃがいも', accepted: ['jagaimo', 'zyagaimo'] }, { text: 'じゃんけん', accepted: ['janken', 'zyanken'] }, { text: 'じゅぎょう', accepted: ['jugyou', 'zyugyou'] }, { text: 'じょうほう', accepted: ['jouhou', 'zyouhou'] }, { text: 'びゃくや', accepted: ['byakuya'] }, { text: 'びゅー', accepted: ['byu-', 'byuu'] }, { text: 'びょういん', accepted: ['byouin', 'byoin'] }, { text: 'ぴゃの', accepted: ['pyano'] }, { text: 'ぴゅあ', accepted: ['pyua'] }, { text: 'ぴょう', accepted: ['pyou', 'pyo'] }, { text: 'ぴょんぴょん', accepted: ['pyonpyon'] }, { text: 'ちょうちょ', accepted: ['choucho', 'tyoutyo'] }, { text: 'りゅうがく', accepted: ['ryuugaku', 'ryugaku'] }, { text: 'じゅんびちゅう', accepted: ['junbichuu', 'zyunbityuu'] }, { text: 'きゃんぷじょう', accepted: ['kyanpujou', 'kyanpuzyou'] }, { text: 'しゃしんちょう', accepted: ['shashinchou', 'syasinchou'] },
        { text: 'ふぁ', accepted: ['fa'] }, { text: 'ふぃ', accepted: ['fi'] }, { text: 'ふぇ', accepted: ['fe'] }, { text: 'ふぉ', accepted: ['fo'] },
        { text: 'てぃ', accepted: ['ti'] }, { text: 'でぃ', accepted: ['di'] }, { text: 'とぅ', accepted: ['tu'] }, { text: 'どぅ', accepted: ['du'] },
        { text: 'つぁ', accepted: ['tsa'] }, { text: 'つぃ', accepted: ['tsi'] }, { text: 'つぇ', accepted: ['tse'] }, { text: 'つぉ', accepted: ['tso'] },
        { text: 'しぇ', accepted: ['she', 'sye'] }, { text: 'じぇ', accepted: ['je', 'zye'] }, { text: 'ちぇ', accepted: ['che', 'tye'] }
    ],
    [
        { text: 'しょうがっこう', accepted: ['shougakkou', 'syougakkou', 'shogakko'] }, { text: 'きょうりゅう', accepted: ['kyouryuu', 'kyoryuu'] }, { text: 'ちゅうしゃじょう', accepted: ['chuushajou', 'tyuusyajou'] }, { text: 'りょこうちゅう', accepted: ['ryokouchuu', 'ryokotyuu'] }, { text: 'じゅぎょうちゅう', accepted: ['jugyouchuu', 'zyugyoutyuu'] }, { text: 'ぎゃくてんしゅうり', accepted: ['gyakutenshuuri'] }, { text: 'びょうどうしょうぶ', accepted: ['byoudoushoubu', 'byodoshoubu'] }, { text: 'じゃんぐるじむ', accepted: ['jangurujimu', 'zyangurujimu'] }, { text: 'ぴゃくにんいっしゅ', accepted: ['pyakuninisshu'] }, { text: 'きゅうしょくとうばん', accepted: ['kyuushokutouban', 'kyusyokutouban'] },
        { text: 'ヴァイオリン', accepted: ['vaiorin'] }, { text: 'ヴィーナス', accepted: ['vi-nasu', 'viinasu'] }, { text: 'ヴ', accepted: ['vu'] }, { text: 'ヴェール', accepted: ['ve-ru', 'veeru'] }, { text: 'ヴォイス', accepted: ['voisu'] },
        { text: '。', accepted: ['。', '.'] }, { text: '、', accepted: ['、', ','] }, { text: '！', accepted: ['！', '!'] }, { text: '？', accepted: ['？', '?'] }, { text: '・', accepted: ['・', '/'] }, { text: '「」', accepted: ['「」', '[]'] }, { text: '（）', accepted: ['（）', '()'] }, { text: 'ー', accepted: ['ー', '-'] },
        { text: 'いい', accepted: ['ii'] }, { text: 'おお', accepted: ['oo'] }
    ]
];

const ROMAJI_NA_HA = [
    { text: 'な', accepted: ['na'] }, { text: 'に', accepted: ['ni'] }, { text: 'ぬ', accepted: ['nu'] }, { text: 'ね', accepted: ['ne'] }, { text: 'の', accepted: ['no'] },
    { text: 'は', accepted: ['ha'] }, { text: 'ひ', accepted: ['hi'] }, { text: 'ふ', accepted: ['fu', 'hu'] }, { text: 'へ', accepted: ['he'] }, { text: 'ほ', accepted: ['ho'] },
    { text: 'はな', accepted: ['hana'] }, { text: 'にわ', accepted: ['niwa'] }, { text: 'ふね', accepted: ['fune', 'hune'] }, { text: 'ほし', accepted: ['hoshi', 'hosi'] }, { text: 'ねこ', accepted: ['neko'] },
    { text: 'なのはな', accepted: ['nanohana'] }, { text: 'はなび', accepted: ['hanabi'] }, { text: 'にほん', accepted: ['nihon'] }, { text: 'ひこうき', accepted: ['hikouki', 'hikoki'] }, { text: 'ほうかご', accepted: ['houkago', 'hokago'] }
];

const ROMAJI_MA_YA_RA_WA = [
    { text: 'ま', accepted: ['ma'] }, { text: 'み', accepted: ['mi'] }, { text: 'む', accepted: ['mu'] }, { text: 'め', accepted: ['me'] }, { text: 'も', accepted: ['mo'] },
    { text: 'や', accepted: ['ya'] }, { text: 'ゆ', accepted: ['yu'] }, { text: 'よ', accepted: ['yo'] },
    { text: 'ら', accepted: ['ra'] }, { text: 'り', accepted: ['ri'] }, { text: 'る', accepted: ['ru'] }, { text: 'れ', accepted: ['re'] }, { text: 'ろ', accepted: ['ro'] },
    { text: 'わ', accepted: ['wa'] }, { text: 'を', accepted: ['wo', 'o'] }, { text: 'ん', accepted: ['n', 'nn'] },
    { text: 'まど', accepted: ['mado'] }, { text: 'やま', accepted: ['yama'] }, { text: 'りす', accepted: ['risu'] }, { text: 'れもん', accepted: ['remon'] }, { text: 'わに', accepted: ['wani'] },
    { text: 'みらい', accepted: ['mirai'] }, { text: 'ゆうやけ', accepted: ['yuuyake', 'yuyake'] }, { text: 'ろうか', accepted: ['rouka', 'roka'] }, { text: 'わらいごえ', accepted: ['waraigoe'] }, { text: 'まほう', accepted: ['mahou', 'maho'] }
];

const SCHOOL_WORDS = [
    [{ text: 'がっこう', accepted: ['がっこう', 'gakkou', 'gakko'] }, { text: 'きょうしつ', accepted: ['きょうしつ', 'kyoushitsu', 'kyositu'] }, { text: 'せんせい', accepted: ['せんせい', 'sensei'] }, { text: 'ともだち', accepted: ['ともだち', 'tomodachi', 'tomodati'] }, { text: 'こくご', accepted: ['こくご', 'kokugo'] }, { text: 'さんすう', accepted: ['さんすう', 'sansuu'] }, { text: 'りか', accepted: ['りか', 'rika'] }, { text: 'しゃかい', accepted: ['しゃかい', 'shakai'] }, { text: 'おんがく', accepted: ['おんがく', 'ongaku'] }, { text: 'たいいく', accepted: ['たいいく', 'taiiku'] }, { text: 'えんぴつ', accepted: ['えんぴつ', 'enpitsu'] }, { text: 'けしごむ', accepted: ['けしごむ', 'keshigomu'] }],
    [{ text: 'きゅうしょく', accepted: ['きゅうしょく', 'kyuushoku'] }, { text: 'しゅくだい', accepted: ['しゅくだい', 'shukudai'] }, { text: 'のうと', accepted: ['のうと', 'nouto', 'noto'] }, { text: 'つくえ', accepted: ['つくえ', 'tsukue'] }, { text: 'いす', accepted: ['いす', 'isu'] }, { text: 'としょしつ', accepted: ['としょしつ', 'toshoshitsu'] }, { text: 'こうてい', accepted: ['こうてい', 'koutei', 'kotei'] }, { text: 'たいそう', accepted: ['たいそう', 'taisou', 'taiso'] }, { text: 'あさのかい', accepted: ['あさのかい', 'asanokai'] }, { text: 'かえりのかい', accepted: ['かえりのかい', 'kaerinokai'] }, { text: 'そうじ', accepted: ['そうじ', 'souji', 'soji'] }, { text: 'ほうかご', accepted: ['ほうかご', 'houkago', 'hokago'] }],
    [{ text: 'きゅうしょくとうばん', accepted: ['きゅうしょくとうばん', 'kyuushokutouban', 'kyusyokutouban'] }, { text: 'きょうかしょ', accepted: ['きょうかしょ', 'kyoukasho'] }, { text: 'したじき', accepted: ['したじき', 'shitajiki'] }, { text: 'ふでばこ', accepted: ['ふでばこ', 'fudebako'] }, { text: 'じょうぎ', accepted: ['じょうぎ', 'jougi', 'zyougi'] }, { text: 'えのぐ', accepted: ['えのぐ', 'enogu'] }, { text: 'ずこうしつ', accepted: ['ずこうしつ', 'zukoushitsu', 'zukositu'] }, { text: 'りかしつ', accepted: ['りかしつ', 'rikashitsu'] }, { text: 'おんがくしつ', accepted: ['おんがくしつ', 'ongakushitsu'] }, { text: 'たいいくかん', accepted: ['たいいくかん', 'taiikukan'] }, { text: 'こうしゃ', accepted: ['こうしゃ', 'kousha', 'kosya'] }, { text: 'せいと', accepted: ['せいと', 'seito'] }],
    [{ text: 'せき', accepted: ['せき', 'seki'] }, { text: 'ばんしょ', accepted: ['ばんしょ', 'bansho', 'bansyo'] }, { text: 'こくばん', accepted: ['こくばん', 'kokuban'] }, { text: 'じゅぎょう', accepted: ['じゅぎょう', 'jugyou', 'zyugyou'] }, { text: 'きょうだい', accepted: ['きょうだい', 'kyoudai'] }, { text: 'こうちょう', accepted: ['こうちょう', 'kouchou', 'kotyou'] }, { text: 'きょうとう', accepted: ['きょうとう', 'kyoutou', 'kyoto'] }, { text: 'いいんかい', accepted: ['いいんかい', 'iinkai'] }, { text: 'しょくいんしつ', accepted: ['しょくいんしつ', 'shokuinshitsu'] }, { text: 'うんどうかい', accepted: ['うんどうかい', 'undoukai', 'undokai'] }, { text: 'えんそく', accepted: ['えんそく', 'ensoku'] }, { text: 'しゃかいかけんがく', accepted: ['しゃかいかけんがく', 'shakaikakengaku'] }],
    [{ text: 'そつぎょう', accepted: ['そつぎょう', 'sotsugyou', 'sotugyou'] }, { text: 'おはようございます', accepted: ['おはようございます', 'ohayougozaimasu', 'ohayogozaimasu'] }, { text: 'ありがとうございました', accepted: ['ありがとうございました', 'arigatougozaimashita'] }, { text: 'よろしくおねがいします', accepted: ['よろしくおねがいします', 'yoroshikuonegaishimasu'] }, { text: 'しつれいします', accepted: ['しつれいします', 'shitsureishimasu'] }, { text: 'おしえてください', accepted: ['おしえてください', 'oshietekudasai'] }, { text: 'きこえましたか', accepted: ['きこえましたか', 'kikoemashitaka'] }, { text: 'じゅんびはいいですか', accepted: ['じゅんびはいいですか', 'junbiwaiidesuka'] }, { text: 'きょうもげんきにがんばろう', accepted: ['きょうもげんきにがんばろう', 'kyoumogenkiniganbarou'] }, { text: 'わからないところはしらべよう', accepted: ['わからないところはしらべよう', 'wakaranaitokorohashirabeyou'] }]
];

const SENTENCE_DRILLS = [
    [{ text: 'わたしはねこがすきです', accepted: ['わたしはねこがすきです', 'watashihanekogasukidesu'] }, { text: 'きょうはいいてんきです', accepted: ['きょうはいいてんきです', 'kyouhaiitenkidesu'] }, { text: 'あしたはがっこうです', accepted: ['あしたはがっこうです', 'ashitahagakkoudesu'] }, { text: 'ともだちとあそびます', accepted: ['ともだちとあそびます', 'tomodachitoasobimasu'] }, { text: 'こうえんであそびます', accepted: ['こうえんであそびます', 'kouendeasobimasu'] }, { text: 'きょうはたいいくがあります', accepted: ['きょうはたいいくがあります', 'kyouhataiikugaarimasu'] }, { text: 'ぼくはりんごがすきです', accepted: ['ぼくはりんごがすきです', 'bokuharingogasukidesu'] }],
    [{ text: 'わたしはほんをよみます', accepted: ['わたしはほんをよみます', 'watashihahonyomimasu'] }, { text: 'きょうはえんそくです', accepted: ['きょうはえんそくです', 'kyouhaensokudesu'] }, { text: 'せんせいにあいさつします', accepted: ['せんせいにあいさつします', 'senseiniaisatsushimasu'] }, { text: 'ぼくは がっこうへ いく。', accepted: ['ぼくはがっこうへいく', 'bokuhagakkouheiku'] }, { text: 'ほんを よんで しらべる。', accepted: ['ほんをよんでしらべる', 'honwoyondeshiraberu'] }, { text: 'みずを のんで やすむ。', accepted: ['みずをのんでやすむ', 'mizuwonondeyasumu'] }, { text: 'えんぴつを もって すわる。', accepted: ['えんぴつをもってすわる', 'enpitsuwomottesuwaru'] }],
    [{ text: 'きょうの よていを たしかめる。', accepted: ['きょうのよていをたしかめる', 'kyounoyoteiwotashikameru'] }, { text: 'ともだちと こうえんで あそびます。', accepted: ['ともだちとこうえんであそびます', 'tomodachitokouendeasobimasu'] }, { text: 'あめのひは ほんを よむことが おおいです。', accepted: ['あめのひはほんをよむことがおおいです', 'amenohihahonyomukotogaooidesu'] }, { text: 'きゅうしょくの じかんが たのしみです。', accepted: ['きゅうしょくのじかんがたのしみです', 'kyuushokunojikangatanojimidesu'] }, { text: 'きょうもたのしいいちにちでした', accepted: ['きょうもたのしいいちにちでした', 'kyoumotanoshiiichinichideshita'] }, { text: 'しゅくだいをしてからあそびます', accepted: ['しゅくだいをしてからあそびます', 'shukudaiwoshitekaraasobimasu'] }, { text: 'ほんをよんであたらしいことをしります', accepted: ['ほんをよんであたらしいことをしります', 'honwoyondeatarashiikotowoshirimasu'] }],
    [{ text: 'こんにちは', accepted: ['こんにちは', 'konnichiwa', 'konnitiha'] }, { text: 'ありがとうございます', accepted: ['ありがとうございます', 'arigatougozaimasu'] }, { text: 'おはようございます', accepted: ['おはようございます', 'ohayougozaimasu', 'ohayogozaimasu'] }, { text: 'よろしくおねがいします', accepted: ['よろしくおねがいします', 'yoroshikuonegaishimasu'] }, { text: 'しんかんせん', accepted: ['しんかんせん', 'shinkansen', 'sinkansen'] }, { text: 'かえるぴょこぴょこ', accepted: ['かえるぴょこぴょこ', 'kaerupyokopyoko', 'kaerupykopyoko'] }, { text: 'きょうもたのしくたいぴんぐれんしゅう', accepted: ['きょうもたのしくたいぴんぐれんしゅう', 'kyoumotanoshikutaipingurenshuu'] }],
    [{ text: 'とうきょうとっきょきょかきょく', accepted: ['とうきょうとっきょきょかきょく', 'toukyoutokkyokyokakyoku', 'tokyotokkyokyokakyoku'] }, { text: 'すもももももももものうち', accepted: ['すもももももももものうち', 'sumomomomomomomonouchi'] }, { text: 'なまむぎなまごめなまたまご', accepted: ['なまむぎなまごめなまたまご', 'namamuginamagomenamatamago'] }, { text: 'あかまきがみあおまきがみ', accepted: ['あかまきがみあおまきがみ', 'akamakigamiaomakigami'] }, { text: 'ていねいにうつことで ただしいタイピングがみにつく。', accepted: ['ていねいにうつことでただしいたいぴんぐがみにつく', 'teineiniutsukotodetadashiitaipingugaminitsuku'] }, { text: 'あきらめずにつづけると すこしずつはやくなる。', accepted: ['あきらめずにつづけるとすこしずつはやくなる', 'akiramezunitsuzukerutosukoshizutsuhayakunaru'] }, { text: 'まちがえたところをたしかめると つぎはもっとじょうずになる。', accepted: ['まちがえたところをたしかめるとつぎはもっとじょうずになる', 'machigaetatokorowotashikamerutotsugihamottojouzuninaru'] }]
];

const ENGLISH_DRILLS = [
    ['cat', 'dog', 'sun', 'book', 'pen', 'milk', 'desk', 'ball', 'star', 'fish', 'apple', 'music', 'table', 'chair', 'water', 'clock'],
    ['hello', 'thank you', 'good job', 'school', 'friend', 'teacher', 'pencil', 'library', 'music room', 'play time', 'good morning', 'see you', 'classroom', 'notebook', 'science room', 'lunch time'],
    ['I like apples.', 'This is my book.', 'We play soccer.', 'Open the window.', 'Close the door.', 'I have two pencils.', 'My bag is blue.', 'She likes music.', 'It is a red ball.', 'We read every day.'],
    ['Can you help me?', 'I want to read this story.', 'Today is a sunny day.', 'My favorite subject is music.', 'We clean the classroom after lunch.', 'Please show me your notebook.', 'I can speak a little English.', 'My brother plays the piano.', 'We will visit the library today.', 'Do you have a yellow pencil?'],
    ['Typing practice makes me faster.', 'We study English in the classroom.', 'Please check your homework carefully.', 'Reading every day helps me learn new words.', 'I will do my best and keep practicing.', 'Our team worked together and won the game.', 'I want to share my idea with the class.', 'Learning new words helps me read longer stories.', 'Please write your answer on this worksheet.', 'I am getting better because I practice every day.']
];

const MIXED_DRILLS = [
    ['fj', 'dk', '12', 'cat', 'あ', '45', 'sun', 'い', '34', 'pen', 'う', 'jk'],
    ['book', '7:30', 'か', 'friend', 'きょう', 'desk', '9:15', 'hello', 'school', '23', 'のうと', 'thank you'],
    ['gakkou', 'hello', '3+4', 'しゅくだい', 'music', 'kyoushitsu', 'pen', '8/2', 'sensei', 'library', 'きゅうしょく', '4*6'],
    ['きょうはいいてんきです', 'Can you help me?', 'room-3', 'じゃんけん', 'keyboard', 'score:88', 'しんごう', '2026/03/09', 'I like apples.', 'きょうしつ'],
    ['みんなでちからをあわせる', 'Typing practice makes me faster.', '2026/03/09', 'しょうがっこう', 'wonderful', 'じゅぎょうちゅう', 'Please check your homework carefully.', 'きゅうしょくとうばん', 'level_5', 'Our team worked together and won the game.']
];

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');
const isPrefixValid = (input: string, answers: string[]) => {
    const normalized = normalizeAnswer(input);
    return answers.some(answer => normalizeAnswer(answer).startsWith(normalized));
};
const pickBiased = <T,>(items: T[], score: (item: T) => number): T => {
    const weighted = items.map(item => ({ item, weight: Math.max(1, score(item)) }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of weighted) {
        roll -= entry.weight;
        if (roll <= 0) return entry.item;
    }
    return weighted[weighted.length - 1].item;
};

const getLessonStage = (act: number, floor: number) => {
    const progress = Math.max(0, (act - 1) * 12 + Math.max(0, floor));
    if (progress < 3) return 0;
    if (progress < 8) return 1;
    if (progress < 15) return 2;
    if (progress < 24) return 3;
    return 4;
};

const buildWeakCharSet = (lessonId?: string) => {
    const weakMap = storageService.getTypingWeakKeys();
    const entries = Object.entries(weakMap[lessonId || 'HOME_ROW'] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return new Set(entries.map(([char]) => char));
};

const getWeakKeyEntries = (lessonId?: string) => {
    const weakMap = storageService.getTypingWeakKeys();
    return Object.entries(weakMap[lessonId || 'HOME_ROW'] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
};

const buildSequencePrompt = (lessonId: TypingLessonId, stage: number, cardName: string, weakChars: Set<string>): TypingPrompt => {
    const source = HOME_ROW_GROUPS[Math.min(stage, HOME_ROW_GROUPS.length - 1)];
    const len = Math.min(2 + stage, 6);
    const answer = Array.from({ length: len }, () => pickBiased(source, (candidate) => weakChars.has(candidate[0]) ? 4 : 1)).join('');
    const lesson = getTypingLessonDefinition(lessonId);
    return {
        id: `${lessonId}-${cardName}-${stage}-${answer}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text: answer,
        answer,
        acceptedAnswers: [answer],
        guide: stage === 0 ? 'ホームポジションを確認しながら打とう' : '同じ指だけに頼らず、左右の移動を意識しよう',
        finger: KEY_FINGER_MAP[answer[0]] ?? null
    };
};

const buildWordPrompt = (lessonId: TypingLessonId, stage: number, cardName: string, words: string[], guide: string, weakChars: Set<string>): TypingPrompt => {
    const lesson = getTypingLessonDefinition(lessonId);
    const entry = pickBiased(words, (candidate) => {
        const normalized = normalizeAnswer(candidate);
        let hits = 0;
        weakChars.forEach((char) => {
            if (normalized.includes(char)) hits += 1;
        });
        return 1 + hits * 3;
    });
    return {
        id: `${lessonId}-${cardName}-${stage}-${entry}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text: entry,
        answer: entry,
        acceptedAnswers: [entry.toLowerCase()],
        guide,
        finger: KEY_FINGER_MAP[entry.trim().toLowerCase()[0]] ?? null
    };
};

const buildKanaPrompt = (lessonId: TypingLessonId, stage: number, cardName: string, source: { text: string; accepted: string[] }[], guide: string, weakChars: Set<string>): TypingPrompt => {
    const lesson = getTypingLessonDefinition(lessonId);
    const count = stage >= 4 ? 2 : 1;
    const selected = Array.from({ length: count }, () => pickBiased(source, (candidate) => {
        const normalized = normalizeAnswer(candidate.accepted[0] || candidate.text);
        let hits = 0;
        weakChars.forEach((char) => {
            if (normalized.includes(char)) hits += 1;
        });
        return 1 + hits * 3;
    }));
    const text = selected.map(item => item.text).join(' ');
    const acceptedAnswers = selected.map(item => item.accepted[0]).concat(selected.length === 1 ? selected[0].accepted : []);
    const mergedAccepted = selected.length === 1
        ? selected[0].accepted
        : [selected.map(item => item.accepted[0]).join('')];
    return {
        id: `${lessonId}-${cardName}-${stage}-${text}`,
        title: `${lesson.shortTitle} Lv.${stage + 1}`,
        text,
        answer: mergedAccepted[0],
        acceptedAnswers: mergedAccepted,
        guide,
        finger: KEY_FINGER_MAP[normalizeAnswer(mergedAccepted[0])[0]] ?? null
    };
};

const buildPromptFromLesson = (lessonId: string | undefined, act: number, floor: number, cardName: string): TypingPrompt => {
    const resolvedLessonId = (lessonId as TypingLessonId | undefined) ?? 'HOME_ROW';
    const stage = getLessonStage(act, floor);
    const weakChars = buildWeakCharSet(resolvedLessonId);
    switch (resolvedLessonId) {
        case 'HOME_ROW':
            return buildSequencePrompt('HOME_ROW', stage, cardName, weakChars);
        case 'ALPHABET':
            if (stage <= 1) return buildSequencePrompt('ALPHABET', stage + 1, cardName, weakChars);
            return buildWordPrompt('ALPHABET', stage, cardName, ALPHABET_WORDS[Math.max(0, Math.min(stage, ALPHABET_WORDS.length - 1))], 'アルファベットの位置を見失わずに単語を打とう', weakChars);
        case 'NUMBERS_SYMBOLS':
            return buildWordPrompt('NUMBERS_SYMBOLS', stage, cardName, NUMBER_SYMBOL_DRILLS[Math.min(stage, NUMBER_SYMBOL_DRILLS.length - 1)], '数字段と記号の位置を確かめながら打とう', weakChars);
        case 'ROMAJI_VOWELS':
            return buildKanaPrompt('ROMAJI_VOWELS', Math.min(stage, 1), cardName, [ROMAJI_BASIC[0][0], ROMAJI_BASIC[0][1], ROMAJI_BASIC[0][2], ROMAJI_BASIC[0][3], ROMAJI_BASIC[0][4], ROMAJI_BASIC[0][5], ROMAJI_BASIC[0][6]], 'あいうえお と 母音の語を入力しよう', weakChars);
        case 'ROMAJI_KA':
            return buildKanaPrompt('ROMAJI_KA', Math.min(stage + 1, 2), cardName, ROMAJI_BASIC[1], 'か行をくり返して、指と音の対応を覚えよう', weakChars);
        case 'ROMAJI_SA':
            return buildKanaPrompt('ROMAJI_SA', Math.min(stage + 2, 3), cardName, ROMAJI_BASIC[2], 'さ行と shi の形に慣れよう', weakChars);
        case 'ROMAJI_TA':
            return buildKanaPrompt('ROMAJI_TA', Math.min(stage + 2, 3), cardName, ROMAJI_BASIC[3], 'た行と chi / tsu の入力を固めよう', weakChars);
        case 'ROMAJI_NA_HA':
            return buildKanaPrompt('ROMAJI_NA_HA', 4, cardName, ROMAJI_NA_HA, 'な行・は行を含む語を打とう', weakChars);
        case 'ROMAJI_MA_YA_RA_WA':
            return buildKanaPrompt('ROMAJI_MA_YA_RA_WA', 4, cardName, ROMAJI_MA_YA_RA_WA, 'ま行以降と ん を含む語を打とう', weakChars);
        case 'ROMAJI_BASIC':
            return buildKanaPrompt('ROMAJI_BASIC', stage, cardName, ROMAJI_BASIC[Math.min(stage, ROMAJI_BASIC.length - 1)], 'かなを見て基本のローマ字で入力しよう', weakChars);
        case 'ROMAJI_ADVANCED':
            return buildKanaPrompt('ROMAJI_ADVANCED', stage, cardName, ROMAJI_ADVANCED[Math.min(stage, ROMAJI_ADVANCED.length - 1)], '拗音・促音・長音を意識して正確に入力しよう', weakChars);
        case 'WORDS':
            return buildKanaPrompt('WORDS', stage, cardName, SCHOOL_WORDS[Math.min(stage, SCHOOL_WORDS.length - 1)], '学校や生活のことばをテンポよく入力しよう', weakChars);
        case 'SENTENCES':
            return buildKanaPrompt('SENTENCES', stage, cardName, SENTENCE_DRILLS[Math.min(stage, SENTENCE_DRILLS.length - 1)], '文のまとまりを意識して、読みながら打とう', weakChars);
        case 'ENGLISH':
            return buildWordPrompt('ENGLISH', stage, cardName, ENGLISH_DRILLS[Math.min(stage, ENGLISH_DRILLS.length - 1)], '英単語と英文を、スペースも含めて正確に打とう', weakChars);
        case 'MIXED': {
            const mixed = MIXED_DRILLS[Math.min(stage, MIXED_DRILLS.length - 1)];
            const pick = pickBiased(mixed, (candidate) => {
                const normalized = normalizeAnswer(candidate);
                let hits = 0;
                weakChars.forEach((char) => {
                    if (normalized.includes(char)) hits += 1;
                });
                return 1 + hits * 3;
            });
            const accepted = /^[\u3040-\u309fー\s。]+$/.test(pick)
                ? [pick.replace(/\s+/g, ''), normalizeAnswer(pick)]
                : [pick.toLowerCase()];
            return {
                id: `MIXED-${cardName}-${stage}-${pick}`,
                title: `総合 Lv.${stage + 1}`,
                text: pick,
                answer: accepted[0],
                acceptedAnswers: accepted,
                guide: 'かな・英語・数字記号が混ざる。内容の切り替えに対応しよう',
                finger: KEY_FINGER_MAP[normalizeAnswer(accepted[0])[0]] ?? null
            };
        }
        default:
            return buildSequencePrompt('HOME_ROW', stage, cardName);
    }
};

const renderIntent = (enemy: Enemy, hideEnemyIntents: boolean) => {
    if (hideEnemyIntents) {
        return <span className="tracking-[0.25em] text-slate-200">???</span>;
    }
    const intent = enemy.nextIntent;
    if (
        intent.type === EnemyIntentType.ATTACK ||
        intent.type === EnemyIntentType.ATTACK_DEBUFF ||
        intent.type === EnemyIntentType.ATTACK_DEFEND ||
        intent.type === EnemyIntentType.PIERCE_ATTACK
    ) {
        return (
            <>
                {intent.type === EnemyIntentType.PIERCE_ATTACK ? (
                    <div className="relative mr-1 flex items-center justify-center">
                        <Triangle size={16} className="fill-yellow-400 text-yellow-400" />
                        <span className="absolute top-[2px] text-[9px] font-black text-red-900">!</span>
                    </div>
                ) : (
                    <Skull size={12} className="mr-1 text-red-600" />
                )}
                {intent.value}
            </>
        );
    }
    if (intent.type === EnemyIntentType.DEFEND) {
        return <><Shield size={12} className="mr-1 text-blue-600" /> {intent.value}</>;
    }
    if (intent.type === EnemyIntentType.BUFF || intent.type === EnemyIntentType.DEBUFF || intent.type === EnemyIntentType.SLEEP) {
        return <><Zap size={12} className="mr-1 fill-yellow-500 text-yellow-500" /> !</>;
    }
    return <span className="text-gray-600">?</span>;
};

const HAND_FINGER_SEGMENTS: Record<'left' | 'right', Array<{ id: FingerId; path: string }>> = {
    left: [
        { id: 'left-pinky', path: 'M26 18 C18 20, 16 34, 20 49 C22 57, 29 57, 31 50 C34 39, 33 29, 36 18 Z' },
        { id: 'left-ring', path: 'M40 12 C33 12, 31 29, 33 48 C34 59, 42 61, 46 50 C49 38, 49 24, 50 13 Z' },
        { id: 'left-middle', path: 'M55 9 C48 9, 46 27, 47 50 C48 61, 57 63, 61 51 C64 36, 63 22, 64 9 Z' },
        { id: 'left-index', path: 'M71 12 C64 14, 62 31, 63 49 C64 58, 72 60, 76 51 C81 39, 81 25, 80 14 Z' },
        { id: 'thumbs', path: 'M68 56 C59 57, 51 63, 46 71 C42 77, 47 84, 55 83 C66 82, 76 74, 80 66 C83 60, 77 55, 68 56 Z' },
    ],
    right: [
        { id: 'right-pinky', path: 'M74 18 C82 20, 84 34, 80 49 C78 57, 71 57, 69 50 C66 39, 67 29, 64 18 Z' },
        { id: 'right-ring', path: 'M60 12 C67 12, 69 29, 67 48 C66 59, 58 61, 54 50 C51 38, 51 24, 50 13 Z' },
        { id: 'right-middle', path: 'M45 9 C52 9, 54 27, 53 50 C52 61, 43 63, 39 51 C36 36, 37 22, 36 9 Z' },
        { id: 'right-index', path: 'M29 12 C36 14, 38 31, 37 49 C36 58, 28 60, 24 51 C19 39, 19 25, 20 14 Z' },
        { id: 'thumbs', path: 'M32 56 C41 57, 49 63, 54 71 C58 77, 53 84, 45 83 C34 82, 24 74, 20 66 C17 60, 23 55, 32 56 Z' },
    ]
};

const TypingHandGuide: React.FC<{ side: 'left' | 'right'; activeFinger: FingerId | null }> = ({ side, activeFinger }) => (
    <div className="hidden h-40 w-28 shrink-0 flex-col items-center justify-end gap-1 lg:flex xl:h-44 xl:w-32">
        <div className="text-[9px] font-black tracking-[0.18em] text-slate-400">{side === 'left' ? 'LEFT HAND' : 'RIGHT HAND'}</div>
        <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_0_12px_rgba(0,0,0,0.4)]">
            <defs>
                <linearGradient id={`palm-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(241,245,249,0.32)" />
                    <stop offset="100%" stopColor="rgba(148,163,184,0.18)" />
                </linearGradient>
            </defs>
            <path d={side === 'left' ? 'M18 60 C18 43, 31 35, 48 35 H60 C79 35, 88 48, 86 66 C84 81, 74 90, 56 90 H36 C24 90, 18 79, 18 60 Z' : 'M82 60 C82 43, 69 35, 52 35 H40 C21 35, 12 48, 14 66 C16 81, 26 90, 44 90 H64 C76 90, 82 79, 82 60 Z'} fill={`url(#palm-${side})`} stroke="rgba(226,232,240,0.7)" strokeWidth="2.2" />
            {HAND_FINGER_SEGMENTS[side].map(segment => {
                const isActive = activeFinger === segment.id;
                return (
                    <g key={segment.id}>
                        <path
                            d={segment.path}
                            fill={isActive ? 'rgba(251,191,36,0.8)' : 'rgba(248,250,252,0.22)'}
                            stroke={isActive ? 'rgba(254,240,138,1)' : 'rgba(226,232,240,0.68)'}
                            strokeWidth={isActive ? 3.2 : 2}
                        />
                        {isActive && <path d={segment.path} fill="none" stroke="rgba(251,191,36,0.75)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />}
                    </g>
                );
            })}
            <circle cx="50" cy="80" r="16" fill="rgba(15,23,42,0.42)" />
        </svg>
        <div className="rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-slate-200">
            {activeFinger ? FINGER_LABELS[activeFinger] : '待機'}
        </div>
    </div>
);

const TypingBattleScene: React.FC<TypingBattleSceneProps> = ({
    player,
    enemies,
    selectedEnemyId,
    onSelectEnemy,
    onPlayTypingCard,
    onEndTurn,
    turnLog,
    narrative,
    actingEnemyId,
    selectionState,
    onHandSelection,
    onCancelSelection,
    onUsePotion,
    combatLog,
    languageMode,
    activeEffects,
    finisherCutinCard,
    act,
    floor,
    lessonId,
    onAbort,
    hideEnemyIntents = false,
    onOpenSettings
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autoEndTimerRef = useRef<number | null>(null);
    const rtbIntervalRef = useRef<number | null>(null);
    const prevActingRef = useRef<string | null>(null);
    const mistypeFlashTimerRef = useRef<number | null>(null);
    const mistypeShakeTimerRef = useRef<number | null>(null);

    const [input, setInput] = useState('');
    const [prompt, setPrompt] = useState<TypingPrompt | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('タイピング準備OK');
    const [rtbDeadline, setRtbDeadline] = useState<number | null>(null);
    const [rtbNow, setRtbNow] = useState(Date.now());
    const [isShaking, setIsShaking] = useState(false);
    const [lastVisibleEnemies, setLastVisibleEnemies] = useState<Enemy[]>([]);
    const [wrongInputStreak, setWrongInputStreak] = useState(0);
    const [mistypeFlashActive, setMistypeFlashActive] = useState(false);
    const [mistypeShakeActive, setMistypeShakeActive] = useState(false);

    const currentCard = useMemo(() => {
        if (player.hand.length === 0) return null;
        return player.hand[0] ?? null;
    }, [player.hand]);
    const queuedHandCards = useMemo(() => player.hand.slice(1), [player.hand]);
    const normalizedAnswers = useMemo(() => (prompt?.acceptedAnswers ?? []).map(normalizeAnswer), [prompt]);
    const getRelicCounter = (relicId: string) => {
        if (relicId === 'KUNAI' || relicId === 'SHURIKEN' || relicId === 'ORNAMENTAL_FAN') {
            return player.relicCounters['ATTACK_COUNT'];
        }
        return player.relicCounters[relicId];
    };
    const displayedRelics = useMemo(() => {
        return [...player.relics].sort((a, b) => {
            const countA = getRelicCounter(a.id) || 0;
            const countB = getRelicCounter(b.id) || 0;
            if (countA > 0 && countB <= 0) return -1;
            if (countA <= 0 && countB > 0) return 1;
            return 0;
        });
    }, [player.relicCounters, player.relics]);
    const nextExpectedKey = useMemo(() => {
        if (!prompt) return '';
        const base = prompt.acceptedAnswers[0] ?? prompt.answer;
        const answer = normalizeAnswer(base);
        const typed = normalizeAnswer(input);
        return answer[typed.length] ?? answer[answer.length - 1] ?? '';
    }, [prompt, input]);
    const currentFinger = (nextExpectedKey && KEY_FINGER_MAP[nextExpectedKey]) || prompt?.finger || null;
    const isWrongPrefix = !!prompt && normalizeAnswer(input).length > 0 && !isPrefixValid(input, prompt.acceptedAnswers);
    const weakKeyEntries = useMemo(() => getWeakKeyEntries(lessonId), [lessonId, prompt?.id, input.length]);

    const rtbDurationMs = useMemo(() => {
        const duration = 7000 - act * 700 - floor * 70;
        return Math.max(2800, duration);
    }, [act, floor]);

    const rtbRatio = useMemo(() => {
        if (!rtbDeadline) return 1;
        return Math.max(0, Math.min(1, (rtbDeadline - rtbNow) / rtbDurationMs));
    }, [rtbDeadline, rtbNow, rtbDurationMs]);
    const isFinisherActive = !!finisherCutinCard;
    const visualEnemies = useMemo(() => (isFinisherActive && enemies.length === 0 ? lastVisibleEnemies : enemies), [isFinisherActive, enemies, lastVisibleEnemies]);

    const promptFillCount = useMemo(() => {
        if (!prompt) return 0;
        const typedLen = normalizeAnswer(input).length;
        const answerLen = Math.max(1, normalizeAnswer(prompt.acceptedAnswers[0] ?? prompt.answer).length);
        return Math.min(prompt.text.length, Math.ceil((typedLen / answerLen) * prompt.text.length));
    }, [prompt, input]);

    useEffect(() => {
        if (currentCard) {
            setPrompt(buildPromptFromLesson(lessonId, act, floor, currentCard.name));
            setInput('');
            setStatusMessage(`${trans(currentCard.name, languageMode)} をタイピングで起動`);
        } else {
            setPrompt(null);
            setInput('');
            setStatusMessage(selectionState.active ? '手札から必要なカードを選択' : '使えるカードがないためターンを進めます');
        }
    }, [currentCard?.id, currentCard?.name, act, floor, languageMode, selectionState.active, lessonId]);

    useEffect(() => {
        const prevActing = prevActingRef.current;
        if (!actingEnemyId && (prevActing || rtbDeadline === null) && !selectionState.active && enemies.length > 0) {
            setRtbDeadline(Date.now() + rtbDurationMs);
        }
        if (actingEnemyId) {
            setRtbDeadline(null);
        }
        prevActingRef.current = actingEnemyId;
    }, [actingEnemyId, enemies.length, selectionState.active, rtbDurationMs, rtbDeadline]);

    useEffect(() => {
        if (rtbIntervalRef.current) window.clearInterval(rtbIntervalRef.current);
        rtbIntervalRef.current = window.setInterval(() => setRtbNow(Date.now()), 100);
        return () => {
            if (rtbIntervalRef.current) window.clearInterval(rtbIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (rtbRatio > 0 || !rtbDeadline || actingEnemyId || selectionState.active) return;
        setRtbDeadline(null);
        onEndTurn();
    }, [rtbRatio, rtbDeadline, actingEnemyId, selectionState.active, onEndTurn]);

    useEffect(() => {
        if (activeEffects.length > 0) {
            const hasImpact = activeEffects.some(effect => ['SLASH', 'FIRE', 'EXPLOSION', 'LIGHTNING', 'CRITICAL'].includes(effect.type));
            if (hasImpact) {
                setIsShaking(true);
                const timer = window.setTimeout(() => setIsShaking(false), 400);
                return () => window.clearTimeout(timer);
            }
        }
    }, [activeEffects]);

    useEffect(() => {
        if (enemies.length > 0) {
            setLastVisibleEnemies(enemies.map(enemy => ({ ...enemy })));
        }
    }, [enemies]);

    useEffect(() => {
        if (!selectionState.active && !actingEnemyId) {
            inputRef.current?.focus();
        }
    }, [prompt?.id, selectionState.active, actingEnemyId]);

    useEffect(() => {
        if (wrongInputStreak < 20) return;
        audioService.playSound('wrong');
        setStatusMessage('ミスタイプが続いたため タイトルへ もどります');
        const timer = window.setTimeout(() => {
            onAbort();
        }, 700);
        return () => window.clearTimeout(timer);
    }, [onAbort, wrongInputStreak]);

    useEffect(() => {
        if (autoEndTimerRef.current) {
            window.clearTimeout(autoEndTimerRef.current);
            autoEndTimerRef.current = null;
        }
        if (!currentCard && !selectionState.active && !actingEnemyId && enemies.length > 0) {
            autoEndTimerRef.current = window.setTimeout(() => onEndTurn(), 900);
        }
        return () => {
            if (autoEndTimerRef.current) window.clearTimeout(autoEndTimerRef.current);
        };
    }, [currentCard, selectionState.active, actingEnemyId, enemies.length, onEndTurn]);

    useEffect(() => {
        return () => {
            if (mistypeFlashTimerRef.current) window.clearTimeout(mistypeFlashTimerRef.current);
            if (mistypeShakeTimerRef.current) window.clearTimeout(mistypeShakeTimerRef.current);
        };
    }, []);

    const handleSuccess = () => {
        if (!prompt || !currentCard) return;
        audioService.playSound('attack');
        setStatusMessage(`${trans(currentCard.name, languageMode)} を自動使用`);
        setWrongInputStreak(0);
        if (lessonId && nextExpectedKey) {
            storageService.decayTypingWeakKey(lessonId, nextExpectedKey, 1);
        }
        setInput('');
        onPlayTypingCard(currentCard);
    };

    const triggerMistypeFeedback = () => {
        audioService.playSound('wrong');
        setMistypeFlashActive(true);
        setMistypeShakeActive(true);

        if (mistypeFlashTimerRef.current) window.clearTimeout(mistypeFlashTimerRef.current);
        if (mistypeShakeTimerRef.current) window.clearTimeout(mistypeShakeTimerRef.current);

        mistypeFlashTimerRef.current = window.setTimeout(() => setMistypeFlashActive(false), 180);
        mistypeShakeTimerRef.current = window.setTimeout(() => setMistypeShakeActive(false), 220);
    };

    const handleInputChange = (value: string) => {
        if (!prompt) return;
        const normalized = normalizeAnswer(value);
        if (normalized.length === 0) {
            setInput(value);
            return;
        }
        if (!normalizedAnswers.some(answer => answer.startsWith(normalized))) {
            triggerMistypeFeedback();
            setWrongInputStreak(prev => prev + 1);
            if (lessonId && nextExpectedKey) {
                storageService.recordTypingWeakKey(lessonId, nextExpectedKey);
            }
            return;
        }
        setWrongInputStreak(0);
        setInput(value);
        if (normalizedAnswers.includes(normalized)) {
            handleSuccess();
        }
    };

    const focusInput = () => inputRef.current?.focus();

    return (
        <div className={`flex h-full w-full flex-col overflow-hidden bg-gray-950 text-white ${isShaking ? 'animate-screen-shake' : ''}`} onClick={focusInput}>
            <input
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onBlur={() => setTimeout(() => inputRef.current?.focus(), 0)}
                disabled={!prompt || !!actingEnemyId || selectionState.active}
                className="absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
            />

            <div className={`relative shrink-0 border-b-2 border-gray-700 bg-black p-2 shadow-md ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                <div className={`pointer-events-none absolute inset-0 bg-red-500/20 transition-opacity duration-150 ${mistypeFlashActive ? 'opacity-100' : 'opacity-0'}`} />
                <div className="flex w-full flex-col overflow-hidden pr-24">
                    <div className="mb-0.5 truncate text-xs font-bold leading-snug text-green-400 drop-shadow-md">
                        <span className="mr-2 animate-pulse">&gt;&gt;</span> {trans(narrative, languageMode)}
                    </div>
                    <div className="truncate text-[10px] leading-snug text-gray-200">{statusMessage}</div>
                </div>
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <div className="rounded border border-yellow-700 bg-gray-900/80 px-2 py-0.5 text-[10px] font-bold text-yellow-400">{trans(turnLog, languageMode)}</div>
                    <div className="rounded border border-amber-500/50 bg-amber-900/30 px-2 py-0.5 text-[10px] font-bold text-amber-100">{prompt?.title ?? 'AUTO TURN'}</div>
                    {onOpenSettings && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenSettings();
                            }}
                            className="flex items-center gap-1 border-2 border-slate-500 bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-100 shadow-[2px_2px_0_0_rgba(15,23,42,0.95)] transition-all hover:bg-slate-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            title="セッティング"
                        >
                            <Settings size={10} /> SET
                        </button>
                    )}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-y-auto bg-gray-800/50 p-2 custom-scrollbar">
                <div className="flex min-h-[118px] shrink-0 items-start justify-center gap-2 pt-6 md:min-h-[140px] md:pt-8">
                    {visualEnemies.map(enemy => {
                        const enemyHpPercent = Math.max(0, (enemy.currentHp / enemy.maxHp) * 100);
                        const isSelected = !isFinisherActive && selectedEnemyId === enemy.id;
                        const enemyName = trans(enemy.name, languageMode);
                        return (
                            <div
                                key={enemy.id}
                                onClick={() => {
                                    if (!isFinisherActive) onSelectEnemy(enemy.id);
                                }}
                                className={`relative z-10 flex flex-col items-center transition-all duration-200 ${isFinisherActive ? '!z-[300]' : ''} ${isSelected ? 'z-20 scale-105 cursor-pointer' : !isFinisherActive ? 'cursor-pointer hover:scale-105' : ''}`}
                            >
                                {!isFinisherActive && (
                                    <div className="absolute -top-5 left-1/2 z-30 flex min-w-[36px] -translate-x-1/2 items-center justify-center rounded border-2 border-red-600 bg-white px-1 py-0.5 text-[10px] font-extrabold text-black shadow-xl">
                                        {renderIntent(enemy, hideEnemyIntents)}
                                    </div>
                                )}

                                <div className="relative mb-1 h-20 w-20 transition-all duration-300 md:h-24 md:w-24">
                                    <EnemyIllustration name={enemy.name} seed={enemy.id} className="relative z-10 h-full w-full drop-shadow-lg" />
                                    {!isFinisherActive && <StandardFloatingTextOverlay data={enemy.floatingText} languageMode={languageMode} />}
                                    {!isFinisherActive && <StandardVFXOverlay effects={activeEffects} targetId={enemy.id} />}
                                </div>

                                {!isFinisherActive && (
                                    <div className={`relative z-10 w-20 rounded border-2 bg-black/90 px-1 py-0.5 text-[8px] text-white shadow-md md:w-24 md:text-[9px] ${isSelected ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-gray-600'}`}>
                                        <div className="mb-0.5 flex h-4 w-full items-center justify-between overflow-hidden">
                                            <div className="min-w-0 flex-1 truncate font-bold text-red-200">{enemyName}</div>
                                            {enemy.block > 0 && (
                                                <span className="ml-1 flex shrink-0 items-center rounded bg-blue-900/80 px-1 text-[8px] font-bold text-blue-300">
                                                    <Shield size={8} className="mr-0.5" /> {enemy.block}
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative mb-0.5 h-3 w-full overflow-hidden rounded-full border border-gray-600 bg-gray-800">
                                            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500" style={{ width: `${enemyHpPercent}%` }} />
                                            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                                                {enemy.currentHp}/{enemy.maxHp}
                                            </div>
                                        </div>
                                        <div className="flex min-h-[12px] flex-wrap justify-center gap-0.5">
                                            {enemy.vulnerable > 0 && (
                                                <div className="flex items-center rounded border border-pink-500/50 bg-pink-900/80 px-0.5">
                                                    <AlertCircle size={8} className="text-pink-300" /> <span className="ml-0.5 text-[8px] font-bold">{enemy.vulnerable}</span>
                                                </div>
                                            )}
                                            {enemy.weak > 0 && (
                                                <div className="flex items-center rounded border border-gray-500/50 bg-gray-700/80 px-0.5">
                                                    <span className="text-[8px] font-bold text-gray-300">弱 {enemy.weak}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto flex items-start justify-between gap-2">
                    <div className="flex min-h-[124px] min-w-0 flex-1 items-start p-1.5">
                        <div className="relative mr-2 h-24 w-24 shrink-0">
                            <img src={player.imageData} alt="Hero" className="h-full w-full pixel-art" style={{ imageRendering: 'pixelated' }} />
                            <StandardVFXOverlay effects={activeEffects} targetId="player" />
                            <StandardFloatingTextOverlay data={player.floatingText} languageMode={languageMode} />
                        </div>
                        <div className="flex h-[124px] min-w-0 w-44 flex-col rounded border-2 border-white bg-black/80 p-1.5 text-xs text-white shadow-lg">
                            <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-200">Player</div>
                            <div className="mb-1 flex items-center justify-between">
                                <span className="flex items-center font-bold text-red-400"><Heart size={12} className="mr-1" /> {player.currentHp}/{player.maxHp}</span>
                                <span className="flex items-center font-bold text-blue-400"><Shield size={12} className="mr-1" /> {player.block}</span>
                            </div>
                            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full border border-gray-500 bg-gray-700">
                                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.max(0, (player.currentHp / player.maxHp) * 100)}%` }} />
                            </div>
                            <div className="mb-1 flex items-center justify-between border-t border-gray-700 pt-1">
                                <div className="flex min-w-0 flex-1 -space-x-1 overflow-hidden">
                                    {displayedRelics.slice(0, 5).map(relic => {
                                        const counter = getRelicCounter(relic.id);
                                        return (
                                            <div key={relic.id} className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-yellow-600 bg-gray-700">
                                                <Gem size={9} className="text-yellow-400" />
                                                {counter !== undefined && counter > 0 && (
                                                    <div className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white bg-red-600 text-[7px] font-bold text-white">
                                                        {counter}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {player.relics.length > 5 && (
                                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-gray-500 bg-gray-800 text-[7px] font-bold text-white">
                                            +{player.relics.length - 5}
                                        </div>
                                    )}
                                    {player.relics.length === 0 && <span className="text-[8px] text-gray-500">No Relics</span>}
                                </div>
                                <div className="ml-2 flex shrink-0 gap-0.5">
                                    {player.potions.map(potion => (
                                        <button
                                            key={potion.id}
                                            onClick={() => {
                                                if (!actingEnemyId && !selectionState.active) onUsePotion(potion);
                                            }}
                                            className="flex h-4 w-4 items-center justify-center rounded border border-white bg-gray-800 hover:scale-110 disabled:opacity-50"
                                            disabled={!!actingEnemyId || selectionState.active}
                                            title={trans(potion.name, languageMode)}
                                        >
                                            <FlaskConical size={9} style={{ color: potion.color }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between text-[8px] text-gray-300">
                                <span>手札 {player.hand.length}</span>
                                <span>山札 {player.drawPile.length}</span>
                                <span>捨札 {player.discardPile.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex h-[124px] min-w-[128px] max-w-[180px] shrink-0 flex-col items-center p-1.5">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">Next Card</div>
                        <div className="flex h-full w-full items-center justify-center p-1">
                            {currentCard ? (
                                <div className="relative h-[92px] w-[82px]">
                                    {queuedHandCards.slice(0, 5).map((card, index) => {
                                        const depth = Math.min(queuedHandCards.length - index, 5);
                                        return (
                                            <div
                                                key={card.id}
                                                className="absolute left-1/2 top-1/2 z-0 origin-top -translate-x-1/2 -translate-y-1/2 scale-[0.58] opacity-70 md:scale-[0.64]"
                                                style={{
                                                    marginLeft: `${depth * 3}px`,
                                                    marginTop: `${depth * 1.5}px`,
                                                    zIndex: 10 - depth
                                                }}
                                            >
                                                <Card card={card} onClick={() => {}} disabled={false} />
                                            </div>
                                        );
                                    })}
                                    <div className="absolute left-1/2 top-1/2 z-10 origin-top -translate-x-1/2 -translate-y-1/2 scale-[0.58] md:scale-[0.64]">
                                        <Card card={currentCard} onClick={() => {}} disabled={false} />
                                    </div>
                                    {queuedHandCards.length > 0 && (
                                        <div className="absolute -right-1 -top-1 z-20 rounded-full border border-emerald-300/60 bg-emerald-950/90 px-1.5 py-0.5 text-[9px] font-black text-emerald-200">
                                            +{queuedHandCards.length}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="px-2 text-center text-xs font-bold text-slate-400">使えるカード待機中</div>
                            )}
                        </div>
                    </div>
                </div>

                {selectionState.active && (
                    <div className="rounded-xl border border-indigo-500/60 bg-indigo-950/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-indigo-200">
                            <span>効果で手札選択が必要です</span>
                            <button onClick={onCancelSelection} className="rounded border border-rose-500/60 px-2 py-1 text-rose-200 hover:bg-rose-900/30">選択をやめる</button>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {player.hand.map(card => (
                                <button key={card.id} onClick={() => onHandSelection(card)} className="shrink-0 rounded border border-indigo-400/50 bg-slate-950/70 p-1">
                                    <div className="origin-top-left scale-[0.75]">
                                        <Card card={card} onClick={() => {}} disabled={false} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="relative flex h-16 shrink-0 items-center justify-between border-t-2 border-white bg-gray-800 px-2 shadow-lg">
                <div className="flex min-w-[150px] items-center gap-2">
                    <div className="flex items-center rounded-full border-2 border-yellow-500 bg-black px-2 py-0.5 text-yellow-400 shadow-lg">
                        <Zap size={14} className="mr-1 fill-yellow-400" />
                        <span className="text-lg font-bold">{player.currentEnergy}/{player.maxEnergy}</span>
                    </div>
                    <div className="rounded border border-slate-600 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300">ACT {act} / FLOOR {Math.max(1, floor)}</div>
                </div>

                <div className="absolute left-1/2 top-1/2 flex w-[min(52vw,560px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 px-2">
                    <div className={`w-full overflow-hidden rounded-2xl border px-3 py-1.5 text-center text-lg font-black tracking-[0.2em] text-white md:text-xl transition-[transform,border-color,box-shadow,background-color] duration-150 ${mistypeFlashActive ? 'border-red-400/80 bg-red-950/60 shadow-[0_0_22px_rgba(248,113,113,0.28)]' : 'border-cyan-400/40 bg-slate-950/90'} ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                        <div className="mb-1.5 flex items-center gap-2">
                            <span className="shrink-0 text-[9px] font-black tracking-[0.22em] text-cyan-300 md:text-[10px]">RTB</span>
                            <div className="h-1.5 w-full overflow-hidden rounded-full border border-slate-700 bg-slate-900/90">
                                <div className={`h-full transition-[width] duration-100 ${rtbRatio > 0.35 ? 'bg-emerald-400' : rtbRatio > 0.15 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${rtbRatio * 100}%` }} />
                            </div>
                        </div>
                        {prompt ? prompt.text.split('').map((char, index) => (
                            <span
                                key={`${prompt.id}-${index}`}
                                className={`inline-block min-w-[0.8em] rounded px-[1px] transition-all duration-200 ${index < promptFillCount ? 'bg-cyan-400 text-slate-950 scale-105 shadow-[0_0_10px_rgba(34,211,238,0.35)]' : 'text-white/90'} ${isWrongPrefix ? 'border-b border-red-400' : ''}`}
                                style={index < promptFillCount ? { animation: 'typing-fill-pop 180ms ease-out' } : undefined}
                            >
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        )) : '...'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                        <span className={`rounded border px-2 py-0.5 transition-colors duration-150 ${mistypeFlashActive ? 'border-red-400/70 text-red-100' : 'border-slate-600'}`}>次キー: {nextExpectedKey || '-'}</span>
                        <span className={`rounded border px-2 py-0.5 transition-colors duration-150 ${mistypeFlashActive ? 'border-red-400/70 text-red-100' : 'border-slate-600'}`}>担当指: {currentFinger ? FINGER_LABELS[currentFinger] : 'IME入力'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300">
                        <span className="rounded border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 font-bold text-amber-200">今の重点練習</span>
                        {weakKeyEntries.length > 0 ? weakKeyEntries.map(([char, count]) => (
                            <span key={char} className="rounded border border-slate-600 bg-slate-950/70 px-2 py-0.5 font-bold text-slate-200">
                                {char} x{count}
                            </span>
                        )) : (
                            <span className="text-slate-500">まだ記録なし</span>
                        )}
                    </div>
                </div>

                <button
                    onClick={!actingEnemyId && !selectionState.active ? onEndTurn : undefined}
                    disabled={!!actingEnemyId || selectionState.active}
                    className={`ml-auto rounded border-2 border-white bg-red-600 px-4 py-1.5 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                        !actingEnemyId && !selectionState.active ? 'cursor-pointer hover:bg-red-500 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : 'cursor-not-allowed opacity-50 grayscale'
                    }`}
                >
                    {selectionState.active ? trans('選択', languageMode) : trans('ターン終了', languageMode)}
                </button>
            </div>

            <div className={`relative z-10 h-52 border-t border-gray-700 bg-gray-900 transition-colors duration-150 sm:h-56 md:h-60 lg:h-64 ${selectionState.active ? 'bg-blue-900/20' : ''} ${mistypeFlashActive ? 'bg-red-950/35' : ''}`} onClick={focusInput}>
                <div className="group/keyboard flex h-full w-full items-end justify-center gap-3 overflow-x-auto px-3 pb-3 pt-3 custom-scrollbar sm:px-4 sm:pb-4">
                    <TypingHandGuide side="left" activeFinger={currentFinger} />
                    <div className={`w-full max-w-5xl rounded-xl border bg-slate-950/70 p-2 transition-[transform,border-color,box-shadow] duration-150 sm:p-3 ${mistypeFlashActive ? 'border-red-400/70 shadow-[0_0_18px_rgba(248,113,113,0.18)]' : 'border-slate-700'} ${mistypeShakeActive ? 'animate-mistype-jolt' : ''}`}>
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-300">
                            <Keyboard size={14} /> JIS Keyboard Guide
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            {KEYBOARD_ROWS.map((row, rowIndex) => (
                                <div key={`row-${rowIndex}`} className="flex flex-wrap justify-center gap-1">
                                    {row.map(key => {
                                        const finger = KEY_FINGER_MAP[key];
                                        const isActive = nextExpectedKey === key;
                                        const isHome = key === 'f' || key === 'j';
                                        return (
                                            <div
                                                key={key}
                                                className={`flex h-8 min-w-8 items-center justify-center rounded border px-2 text-[11px] font-black uppercase transition-[transform,border-color,background-color,box-shadow] duration-150 sm:h-9 sm:min-w-9 sm:text-xs ${
                                                    isActive ? (mistypeFlashActive ? 'border-red-300 bg-red-500/35 text-white shadow-[0_0_18px_rgba(248,113,113,0.35)]' : 'border-amber-300 bg-amber-500/40 text-white shadow-[0_0_18px_rgba(251,191,36,0.35)]') :
                                                    finger ? `${FINGER_COLORS[finger]} border` :
                                                    'border-slate-700 bg-slate-950/70 text-slate-300'
                                                } ${mistypeShakeActive && isActive ? 'animate-mistype-jolt' : ''} ${key === 'space' ? 'min-w-28 sm:min-w-40' : ''}`}
                                            >
                                                {key}
                                                {isHome && <span className="ml-1 text-[9px] text-amber-200">•</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <TypingHandGuide side="right" activeFinger={currentFinger} />
                </div>
            </div>

            {finisherCutinCard && <StandardBattleFinisherCutinOverlay card={finisherCutinCard} languageMode={languageMode} />}
            <style>{`
                @keyframes typing-fill-pop {
                    0% { transform: scale(0.85); filter: brightness(1.6); }
                    70% { transform: scale(1.12); filter: brightness(1.15); }
                    100% { transform: scale(1.05); filter: brightness(1); }
                }
                @keyframes mistype-jolt {
                    0% { transform: translate3d(0, 0, 0); }
                    20% { transform: translate3d(-3px, 0, 0); }
                    40% { transform: translate3d(3px, -1px, 0); }
                    60% { transform: translate3d(-2px, 1px, 0); }
                    80% { transform: translate3d(2px, 0, 0); }
                    100% { transform: translate3d(0, 0, 0); }
                }
                .animate-mistype-jolt {
                    animation: mistype-jolt 180ms ease-out;
                }
            `}</style>
        </div>
    );
};

export default TypingBattleScene;
