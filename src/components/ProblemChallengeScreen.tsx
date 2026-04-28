
import React, { useState, useEffect } from 'react';
import { GameMode, LanguageMode, GameScreen } from '../types';
import { storageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import MathChallengeScreen from './MathChallengeScreen';
import KanjiChallengeScreen from './KanjiChallengeScreen';
import EnglishChallengeScreen from './EnglishChallengeScreen';
import GeneralChallengeScreen from './GeneralChallengeScreen';
import MiniBattleBanner from './MiniBattleBanner';
import { ArrowLeft, Brain, Book, Languages, Music, Play, Trophy, Home, Shuffle, CheckCircle, Target, ChevronRight, LogOut, GraduationCap, Star, Volume2, VolumeX, FlaskConical, Map as MapIcon, Globe, MapPin } from 'lucide-react';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubModeConfig, getChallengeScreenForMode } from '../subjectConfig';
import { ENGLISH_GRADE_UNITS } from '../englishUnitConfig';
import { SCIENCE_GRADE_UNITS, getScienceGradeMode } from '../scienceUnitConfig';
import { SOCIAL_GRADE_UNITS, getSocialGradeMode } from '../socialUnitConfig';
import { trans, transProblemSubjectName } from '../utils/textUtils';

interface ProblemChallengeScreenProps {
  onBack: () => void;
  languageMode: LanguageMode;
  onCorrectAnswers?: (mode: string, correctCount: number) => void;
  modeCorrectCounts?: Record<string, number>;
}

const BGM_OPTIONS = [
  { id: 'random', name: 'ランダム (自動切替)' },
  { id: 'none', name: 'BGMなし' },
  { id: 'school_psyche', name: '一般教室 (風来1)' },
  { id: 'dungeon_gym', name: '体育館 (風来2)' },
  { id: 'dungeon_science', name: '理科室 (風来3)' },
  { id: 'dungeon_music', name: '音楽室 (風来4)' },
  { id: 'dungeon_library', name: '図書室 (風来5)' },
  { id: 'dungeon_roof', name: '屋上 (風来6)' },
  { id: 'dungeon_boss', name: 'ボス戦 (風来)' },
  { id: 'battle', name: '通常バトル (本編)' },
  { id: 'boss', name: 'ボス戦 (本編)' },
  { id: 'mid_boss', name: 'エリート戦 (本編)' },
  { id: 'final_boss', name: '最終決戦 (本編)' },
  { id: 'poker_shop', name: '購買部 (ポーカー)' },
  { id: 'poker_play', name: '勝負中 (ポーカー)' },
  { id: 'survivor_metal', name: '校庭サバイバー' },
  { id: 'paper_plane_setup', name: '格納庫 (紙飛行機)' },
  { id: 'paper_plane_battle', name: '空中戦 (紙飛行機)' },
  { id: 'paper_plane_vacation', name: '休暇中 (紙飛行機)' },
  { id: 'menu', name: 'メインメニュー' },
  { id: 'map', name: 'マップ移動' },
  { id: 'shop', name: 'ショップ' },
  { id: 'event', name: 'イベント' },
  { id: 'rest', name: '休憩' },
  { id: 'reward', name: '報酬獲得' },
  { id: 'math', name: '学習タイム' },
  { id: 'victory', name: '勝利ファンファーレ' },
  { id: 'game_over', name: 'ゲームオーバー' },
];

interface MathUnitOption {
  id: string;
  name: string;
  modes: string[];
}

interface SelectableUnitOption {
  id: string;
  name: string;
  mode?: string;
  modes?: string[];
}

const KOKUGO_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'J1_U01', name: 'ひらがな', modes: ['KOKUGO_G1_U01'] },
    { id: 'J1_U02', name: 'ことばあつめ', modes: ['KOKUGO_G1_U02'] },
    { id: 'J1_U03', name: 'のばすおん（ー）', modes: ['KOKUGO_G1_U03'] },
    { id: 'J1_U04', name: 'ちいさい「っ」', modes: ['KOKUGO_G1_U04'] },
    { id: 'J1_U05', name: '「は・を・へ」のつかいかた', modes: ['KOKUGO_G1_U05'] },
    { id: 'J1_U06', name: 'かたかな', modes: ['KOKUGO_G1_U06'] },
    { id: 'J1_U07', name: 'おはなしをよむ', modes: ['KOKUGO_G1_U07'] },
    { id: 'J1_U08', name: 'せつめいぶんをよむ', modes: ['KOKUGO_G1_U08'] },
    { id: 'J1_U09', name: 'ばめんをそうぞうしてよむ', modes: ['KOKUGO_G1_U09'] },
    { id: 'J1_U10', name: 'たいせつなところをみつけてよむ', modes: ['KOKUGO_G1_U10'] },
    { id: 'J1_U11', name: 'ぶんをかく', modes: ['KOKUGO_G1_U11'] },
    { id: 'J1_U12', name: 'かんたんなにっき', modes: ['KOKUGO_G1_U12'] },
    { id: 'J1_U13', name: 'おはなしをつくる', modes: ['KOKUGO_G1_U13'] },
    { id: 'J1_U14', name: 'はなしをきく', modes: ['KOKUGO_G1_U14'] },
    { id: 'J1_U15', name: 'じぶんのことをはなす', modes: ['KOKUGO_G1_U15'] },
    { id: 'J1_U16', name: 'みんなのまえではなす', modes: ['KOKUGO_G1_U16'] },
  ],
  2: [
    { id: 'J2_U01', name: 'かたかなのことば', modes: ['KOKUGO_G2_U01'] },
    { id: 'J2_U02', name: '主語 と 述語', modes: ['KOKUGO_G2_U02'] },
    { id: 'J2_U03', name: '文のきまり', modes: ['KOKUGO_G2_U03'] },
    { id: 'J2_U04', name: '日記を書く', modes: ['KOKUGO_G2_U04'] },
    { id: 'J2_U05', name: 'せつめい文を読む', modes: ['KOKUGO_G2_U05'] },
    { id: 'J2_U06', name: '物語を読む', modes: ['KOKUGO_G2_U06'] },
    { id: 'J2_U07', name: '大事なことを見つける', modes: ['KOKUGO_G2_U07'] },
    { id: 'J2_U08', name: '手紙を書く', modes: ['KOKUGO_G2_U08'] },
    { id: 'J2_U09', name: '作文を書く', modes: ['KOKUGO_G2_U09'] },
    { id: 'J2_U10', name: '話を聞く', modes: ['KOKUGO_G2_U10'] },
    { id: 'J2_U11', name: '順序よく話す', modes: ['KOKUGO_G2_U11'] },
  ],
  3: [
    { id: 'J3_U01', name: '漢字の読み書き', modes: ['KOKUGO_G3_U01'] },
    { id: 'J3_U02', name: '国語辞典の使い方', modes: ['KOKUGO_G3_U02'] },
    { id: 'J3_U03', name: '段落', modes: ['KOKUGO_G3_U03'] },
    { id: 'J3_U04', name: '物語文の読み取り', modes: ['KOKUGO_G3_U04'] },
    { id: 'J3_U05', name: '説明文の読み取り', modes: ['KOKUGO_G3_U05'] },
    { id: 'J3_U06', name: '要点をまとめる', modes: ['KOKUGO_G3_U06'] },
    { id: 'J3_U07', name: '日記・作文', modes: ['KOKUGO_G3_U07'] },
    { id: 'J3_U08', name: '手紙の書き方', modes: ['KOKUGO_G3_U08'] },
    { id: 'J3_U09', name: '話し合い', modes: ['KOKUGO_G3_U09'] },
  ],
  4: [
    { id: 'J4_U01', name: '漢字の使い方', modes: ['KOKUGO_G4_U01'] },
    { id: 'J4_U02', name: '熟語', modes: ['KOKUGO_G4_U02'] },
    { id: 'J4_U03', name: '国語辞典・漢字辞典', modes: ['KOKUGO_G4_U03'] },
    { id: 'J4_U04', name: '段落と要旨', modes: ['KOKUGO_G4_U04'] },
    { id: 'J4_U05', name: '物語文の読み取り', modes: ['KOKUGO_G4_U05'] },
    { id: 'J4_U06', name: '説明文の読み取り', modes: ['KOKUGO_G4_U06'] },
    { id: 'J4_U07', name: '要約', modes: ['KOKUGO_G4_U07'] },
    { id: 'J4_U08', name: '意見文を書く', modes: ['KOKUGO_G4_U08'] },
    { id: 'J4_U09', name: '話し合いと発表', modes: ['KOKUGO_G4_U09'] },
  ],
  5: [
    { id: 'J5_U01', name: '漢字の意味と使い分け', modes: ['KOKUGO_G5_U01'] },
    { id: 'J5_U02', name: '敬語', modes: ['KOKUGO_G5_U02'] },
    { id: 'J5_U03', name: '物語文の読み取り', modes: ['KOKUGO_G5_U03'] },
    { id: 'J5_U04', name: '説明文の読み取り', modes: ['KOKUGO_G5_U04'] },
    { id: 'J5_U05', name: '要約と要旨', modes: ['KOKUGO_G5_U05'] },
    { id: 'J5_U06', name: '意見文を書く', modes: ['KOKUGO_G5_U06'] },
    { id: 'J5_U07', name: '報告文を書く', modes: ['KOKUGO_G5_U07'] },
    { id: 'J5_U08', name: '討論', modes: ['KOKUGO_G5_U08'] },
    { id: 'J5_U09', name: 'スピーチ', modes: ['KOKUGO_G5_U09'] },
  ],
  6: [
    { id: 'J6_U01', name: '漢字のまとめ', modes: ['KOKUGO_G6_U01'] },
    { id: 'J6_U02', name: '熟語と語句', modes: ['KOKUGO_G6_U02'] },
    { id: 'J6_U03', name: '物語文の読み取り', modes: ['KOKUGO_G6_U03'] },
    { id: 'J6_U04', name: '説明文の読み取り', modes: ['KOKUGO_G6_U04'] },
    { id: 'J6_U05', name: '要旨と要約', modes: ['KOKUGO_G6_U05'] },
    { id: 'J6_U06', name: '意見文を書く', modes: ['KOKUGO_G6_U06'] },
    { id: 'J6_U07', name: '提案文を書く', modes: ['KOKUGO_G6_U07'] },
    { id: 'J6_U08', name: '討論', modes: ['KOKUGO_G6_U08'] },
    { id: 'J6_U09', name: 'スピーチ', modes: ['KOKUGO_G6_U09'] },
    { id: 'J6_U10', name: '卒業文集', modes: ['KOKUGO_G6_U10'] },
  ],
  7: [
    { id: 'J7_U01', name: '物語文の読み取り', modes: ['KOKUGO_G7_U01'] },
    { id: 'J7_U02', name: '説明文の読み取り', modes: ['KOKUGO_G7_U02'] },
    { id: 'J7_U03', name: '詩の読み取り', modes: ['KOKUGO_G7_U03'] },
    { id: 'J7_U04', name: '古典（古文の基礎）', modes: ['KOKUGO_G7_U04'] },
    { id: 'J7_U05', name: '漢文の基礎', modes: ['KOKUGO_G7_U05'] },
    { id: 'J7_U06', name: '文の成分（主語・述語など）', modes: ['KOKUGO_G7_U06'] },
    { id: 'J7_U07', name: '品詞', modes: ['KOKUGO_G7_U07'] },
    { id: 'J7_U08', name: '漢字の読み書き', modes: ['KOKUGO_G7_U08'] },
    { id: 'J7_U09', name: '要約', modes: ['KOKUGO_G7_U09'] },
    { id: 'J7_U10', name: '意見文', modes: ['KOKUGO_G7_U10'] },
    { id: 'J7_U11', name: 'スピーチ', modes: ['KOKUGO_G7_U11'] },
    { id: 'J7_U12', name: '話し合い', modes: ['KOKUGO_G7_U12'] },
  ],
  8: [
    { id: 'J8_U01', name: '物語文の読み取り', modes: ['KOKUGO_G8_U01'] },
    { id: 'J8_U02', name: '説明文の読み取り', modes: ['KOKUGO_G8_U02'] },
    { id: 'J8_U03', name: '詩・短歌・俳句', modes: ['KOKUGO_G8_U03'] },
    { id: 'J8_U04', name: '古文（物語・随筆）', modes: ['KOKUGO_G8_U04'] },
    { id: 'J8_U05', name: '漢文（訓読・故事成語）', modes: ['KOKUGO_G8_U05'] },
    { id: 'J8_U06', name: '文法（品詞・活用）', modes: ['KOKUGO_G8_U06'] },
    { id: 'J8_U07', name: '漢字の読み書き', modes: ['KOKUGO_G8_U07'] },
    { id: 'J8_U08', name: '要約', modes: ['KOKUGO_G8_U08'] },
    { id: 'J8_U09', name: '意見文', modes: ['KOKUGO_G8_U09'] },
    { id: 'J8_U10', name: '発表', modes: ['KOKUGO_G8_U10'] },
    { id: 'J8_U11', name: '討論', modes: ['KOKUGO_G8_U11'] },
  ],
  9: [
    { id: 'J9_U01', name: '物語文の読み取り', modes: ['KOKUGO_G9_U01'] },
    { id: 'J9_U02', name: '説明文の読み取り', modes: ['KOKUGO_G9_U02'] },
    { id: 'J9_U03', name: '詩・短歌・俳句', modes: ['KOKUGO_G9_U03'] },
    { id: 'J9_U04', name: '古文（古典文学）', modes: ['KOKUGO_G9_U04'] },
    { id: 'J9_U05', name: '漢文（名文・思想）', modes: ['KOKUGO_G9_U05'] },
    { id: 'J9_U06', name: '文法（文の構造）', modes: ['KOKUGO_G9_U06'] },
    { id: 'J9_U07', name: '漢字の読み書き', modes: ['KOKUGO_G9_U07'] },
    { id: 'J9_U08', name: '要約', modes: ['KOKUGO_G9_U08'] },
    { id: 'J9_U09', name: '論説文を書く', modes: ['KOKUGO_G9_U09'] },
    { id: 'J9_U10', name: 'スピーチ', modes: ['KOKUGO_G9_U10'] },
    { id: 'J9_U11', name: '討論', modes: ['KOKUGO_G9_U11'] },
    { id: 'J9_U12', name: '卒業論文・発表', modes: ['KOKUGO_G9_U12'] },
  ],
};

interface ActiveChallengeConfig {
  subMode: SubModeConfig;
  modePool?: string[];
}

const getGradeLabel = (grade: number, languageMode: LanguageMode) =>
  languageMode === 'JAPANESE'
    ? (grade <= 6 ? `小${grade}` : `中${grade - 6}`)
    : (grade <= 6 ? `しょう${grade}` : `ちゅう${grade - 6}`);

const getMathGradeMode = (grade: number): GameMode => {
  switch (grade) {
    case 1: return GameMode.MATH_G1_1;
    case 2: return GameMode.MATH_G2_1;
    case 3: return GameMode.MATH_G3_1;
    case 4: return GameMode.MATH_G4_1;
    case 5: return GameMode.MATH_G5_1;
    case 6: return GameMode.MATH_G6_1;
    case 7: return GameMode.MATH_G7_1;
    case 8: return GameMode.MATH_G8_1;
    case 9: return GameMode.MATH_G9_1;
    default: return GameMode.MATH_G1_1;
  }
};

const getKokugoGradeMode = (grade: number): GameMode => {
  switch (grade) {
    case 1: return GameMode.KOKUGO_G1_1;
    case 2: return GameMode.KOKUGO_G2_1;
    case 3: return GameMode.KOKUGO_G3_1;
    case 4: return GameMode.KOKUGO_G4_1;
    case 5: return GameMode.KOKUGO_G5_1;
    case 6: return GameMode.KOKUGO_G6_1;
    case 7: return GameMode.KOKUGO_G7_1;
    case 8: return GameMode.KOKUGO_G8_1;
    case 9: return GameMode.KOKUGO_G9_1;
    default: return GameMode.KOKUGO_G1_1;
  }
};

const getEnglishGradeMode = (grade: number): GameMode => {
  switch (grade) {
    case 3: return GameMode.ENGLISH_G3_1;
    case 4: return GameMode.ENGLISH_G4_1;
    case 5: return GameMode.ENGLISH_G5_1;
    case 6: return GameMode.ENGLISH_G6_1;
    case 7: return GameMode.ENGLISH_G7_1;
    case 8: return GameMode.ENGLISH_G8_1;
    case 9: return GameMode.ENGLISH_G9_1;
    default: return GameMode.ENGLISH_G3_1;
  }
};

const getKanjiGradeMode = (grade: number): string => `KANJI_${grade}`;

const getGradeSummaryModes = (grade: number): string[] => {
  const modes = [
    ...(MATH_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes),
    ...(KOKUGO_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes),
    getKanjiGradeMode(grade),
    ...(ENGLISH_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
    ...(SCIENCE_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
    ...(SOCIAL_GRADE_UNITS[grade] || []).map((unit) => unit.mode),
  ];

  return Array.from(new Set(modes.filter(Boolean)));
};

const getGradeSummaryUnit = (grade: number): SelectableUnitOption => ({
  id: `GRADE_SUMMARY_${grade}`,
  name: '総まとめ（全教科+漢字）',
  modes: getGradeSummaryModes(grade),
});

const getCurrentUnitsForCategory = (categoryId: SubjectCategoryConfig['id'], grade: number): SelectableUnitOption[] => {
  if (categoryId === 'SUMMARY') {
    const summaryUnit = getGradeSummaryUnit(grade);
    return summaryUnit.modes && summaryUnit.modes.length > 0 ? [summaryUnit] : [];
  }

  const baseUnits: SelectableUnitOption[] = categoryId === 'ENGLISH'
    ? (ENGLISH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }))
    : categoryId === 'SCIENCE'
    ? (SCIENCE_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }))
    : categoryId === 'SOCIAL'
    ? (SOCIAL_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }))
    : categoryId === 'KOKUGO_GRADES'
    ? (KOKUGO_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit }))
    : (MATH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit }));

  return baseUnits;
};

const getAllSelectableUnits = (): SelectableUnitOption[] => {
  const summaryUnits = Array.from({ length: 9 }, (_, index) => getGradeSummaryUnit(index + 1));
  return [
    ...summaryUnits,
    ...Object.values(MATH_GRADE_UNITS).flat().map((unit) => ({ ...unit })),
    ...Object.values(KOKUGO_GRADE_UNITS).flat().map((unit) => ({ ...unit })),
    ...Object.values(ENGLISH_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
    ...Object.values(SCIENCE_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
    ...Object.values(SOCIAL_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ];
};

const MATH_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'G1_U01', name: 'かずとすうじ（10までの かず）', modes: ['MATH_G1_U01'] },
    { id: 'G1_U02', name: 'いくつといくつ', modes: ['MATH_G1_U02'] },
    { id: 'G1_U03', name: 'かたちあそび', modes: ['MATH_G1_U03'] },
    { id: 'G1_U04', name: 'なんばんめ', modes: ['MATH_G1_U04'] },
    { id: 'G1_U05', name: 'あわせていくつ（たしざん）', modes: ['MATH_G1_U05'] },
    { id: 'G1_U06', name: 'ふえるといくつ（たしざん）', modes: ['MATH_G1_U06'] },
    { id: 'G1_U07', name: 'のこりはいくつ（ひきざん）', modes: ['MATH_G1_U07'] },
    { id: 'G1_U08', name: 'ちがいはいくつ（ひきざん）', modes: ['MATH_G1_U08'] },
    { id: 'G1_U09', name: '20までのかず', modes: ['MATH_G1_U09'] },
    { id: 'G1_U10', name: 'なんじ（とけい）', modes: ['MATH_G1_U10'] },
    { id: 'G1_U11', name: 'ながさくらべ', modes: ['MATH_G1_U11'] },
    { id: 'G1_U12', name: 'かさくらべ', modes: ['MATH_G1_U12'] },
    { id: 'G1_U13', name: 'えぐらふ', modes: ['MATH_G1_U13'] },
    { id: 'G1_U14', name: 'ひょう', modes: ['MATH_G1_U14'] },
    { id: 'G1_U15', name: 'さんかくとしかく', modes: ['MATH_G1_U15'] },
    { id: 'G1_U16', name: 'かたちづくり', modes: ['MATH_G1_U16'] },
    { id: 'G1_U17', name: '3つのかずのけいさん', modes: ['MATH_G1_U17'] },
    { id: 'G1_U18', name: 'ぶんしょうだい', modes: ['MATH_G1_U18'] },
  ],
  2: [
    { id: 'G2_U01', name: '表 と グラフ', modes: ['MATH_G2_U01'] },
    { id: 'G2_U02', name: 'たし算（2けた＋2けた）', modes: ['MATH_G2_U02'] },
    { id: 'G2_U03', name: 'ひき算（2けた−2けた）', modes: ['MATH_G2_U03'] },
    { id: 'G2_U04', name: '長さ（ものさし）', modes: ['MATH_G2_U04'] },
    { id: 'G2_U05', name: '100までの 数', modes: ['MATH_G2_U05'] },
    { id: 'G2_U06', name: 'かさ（リットル・デシリットル）', modes: ['MATH_G2_U06'] },
    { id: 'G2_U07', name: '時こく と 時かん', modes: ['MATH_G2_U07'] },
    { id: 'G2_U08', name: '3けたの 数', modes: ['MATH_G2_U08'] },
    { id: 'G2_U09', name: 'かけ算（かけ算のいみ）', modes: ['MATH_G2_U09'] },
    { id: 'G2_U10', name: 'かけ算（九九）', modes: ['MATH_G2_U10'] },
    { id: 'G2_U11', name: 'はこの 形', modes: ['MATH_G2_U11'] },
    { id: 'G2_U12', name: 'ぶんしょうだい', modes: ['MATH_G2_U12'] },
  ],
  3: [
    { id: 'G3_U01', name: '表 と グラフ', modes: ['MATH_G3_U01'] },
    { id: 'G3_U02', name: '大きい 数（1000より大きい数）', modes: ['MATH_G3_U02'] },
    { id: 'G3_U03', name: 'たし算（3けた・4けた）', modes: ['MATH_G3_U03'] },
    { id: 'G3_U04', name: 'ひき算（3けた・4けた）', modes: ['MATH_G3_U04'] },
    { id: 'G3_U05', name: '時こく と 時かん', modes: ['MATH_G3_U05'] },
    { id: 'G3_U06', name: '長さ（km と m）', modes: ['MATH_G3_U06'] },
    { id: 'G3_U07', name: 'かけ算（2けた×1けた など）', modes: ['MATH_G3_U07'] },
    { id: 'G3_U08', name: '円 と きゅう', modes: ['MATH_G3_U08'] },
    { id: 'G3_U09', name: 'わり算（わり算のいみ）', modes: ['MATH_G3_U09'] },
    { id: 'G3_U10', name: 'わり算（あまりのある計算）', modes: ['MATH_G3_U10'] },
    { id: 'G3_U11', name: '重さ（g と kg）', modes: ['MATH_G3_U11'] },
    { id: 'G3_U12', name: '小数', modes: ['MATH_G3_U12'] },
    { id: 'G3_U13', name: '分数', modes: ['MATH_G3_U13'] },
    { id: 'G3_U14', name: '□をつかった 式', modes: ['MATH_G3_U14'] },
  ],
  4: [
    { id: 'G4_U01', name: '大きい 数（1おくまでの数）', modes: ['MATH_G4_U01'] },
    { id: 'G4_U02', name: 'わり算（2けたでわる計算）', modes: ['MATH_G4_U02'] },
    { id: 'G4_U03', name: '折れ線グラフ', modes: ['MATH_G4_U03'] },
    { id: 'G4_U04', name: '角', modes: ['MATH_G4_U04'] },
    { id: 'G4_U05', name: 'そろばん', modes: ['MATH_G4_U05'] },
    { id: 'G4_U06', name: '小数', modes: ['MATH_G4_U06'] },
    { id: 'G4_U07', name: '小数の たし算 と ひき算', modes: ['MATH_G4_U07'] },
    { id: 'G4_U08', name: '面せき', modes: ['MATH_G4_U08'] },
    { id: 'G4_U09', name: 'がい数', modes: ['MATH_G4_U09'] },
    { id: 'G4_U10', name: '式 と 計算の じゅんじょ', modes: ['MATH_G4_U10'] },
    { id: 'G4_U11', name: '分数', modes: ['MATH_G4_U11'] },
    { id: 'G4_U12', name: '分数の たし算 と ひき算', modes: ['MATH_G4_U12'] },
    { id: 'G4_U13', name: '直方体 と 立方体', modes: ['MATH_G4_U13'] },
    { id: 'G4_U14', name: '変わり方', modes: ['MATH_G4_U14'] },
    { id: 'G4_U15', name: '調べたことを 表 や グラフ にまとめる', modes: ['MATH_G4_U15'] },
  ],
  5: [
    { id: 'G5_U01', name: '整数 と 小数', modes: ['MATH_G5_U01'] },
    { id: 'G5_U02', name: '体積', modes: ['MATH_G5_U02'] },
    { id: 'G5_U03', name: '小数の かけ算', modes: ['MATH_G5_U03'] },
    { id: 'G5_U04', name: '小数の わり算', modes: ['MATH_G5_U04'] },
    { id: 'G5_U05', name: '合同な 図形', modes: ['MATH_G5_U05'] },
    { id: 'G5_U06', name: '分数 と 小数・整数', modes: ['MATH_G5_U06'] },
    { id: 'G5_U07', name: '分数の たし算 と ひき算', modes: ['MATH_G5_U07'] },
    { id: 'G5_U08', name: '平均', modes: ['MATH_G5_U08'] },
    { id: 'G5_U09', name: '単位量あたりの 大きさ', modes: ['MATH_G5_U09'] },
    { id: 'G5_U10', name: '速さ', modes: ['MATH_G5_U10'] },
    { id: 'G5_U11', name: '比例', modes: ['MATH_G5_U11'] },
    { id: 'G5_U12', name: '円 と 正多角形', modes: ['MATH_G5_U12'] },
    { id: 'G5_U13', name: '角柱 と 円柱', modes: ['MATH_G5_U13'] },
    { id: 'G5_U14', name: '割合', modes: ['MATH_G5_U14'] },
    { id: 'G5_U15', name: '帯グラフ と 円グラフ', modes: ['MATH_G5_U15'] },
  ],
  6: [
    { id: 'G6_U01', name: '対称な 図形', modes: ['MATH_G6_U01'] },
    { id: 'G6_U02', name: '文字 と 式', modes: ['MATH_G6_U02'] },
    { id: 'G6_U03', name: '分数の かけ算', modes: ['MATH_G6_U03'] },
    { id: 'G6_U04', name: '分数の わり算', modes: ['MATH_G6_U04'] },
    { id: 'G6_U05', name: '比 と その 利用', modes: ['MATH_G6_U05'] },
    { id: 'G6_U06', name: '比例 と 反比例', modes: ['MATH_G6_U06'] },
    { id: 'G6_U07', name: '拡大図 と 縮図', modes: ['MATH_G6_U07'] },
    { id: 'G6_U08', name: '円の 面積', modes: ['MATH_G6_U08'] },
    { id: 'G6_U09', name: '角柱 と 円柱の 体積', modes: ['MATH_G6_U09'] },
    { id: 'G6_U10', name: 'およその 面積 と 体積', modes: ['MATH_G6_U10'] },
    { id: 'G6_U11', name: '場合の 数', modes: ['MATH_G6_U11'] },
    { id: 'G6_U12', name: '資料の 調べ方', modes: ['MATH_G6_U12'] },
    { id: 'G6_U13', name: '算数の まとめ', modes: ['MATH_G6_U13'] },
  ],
  7: [
    { id: 'G7_U01', name: '正の数 と 負の数', modes: ['MATH_G7_U01'] },
    { id: 'G7_U02', name: '正負の数の 加法 と 減法', modes: ['MATH_G7_U02'] },
    { id: 'G7_U03', name: '正負の数の 乗法 と 除法', modes: ['MATH_G7_U03'] },
    { id: 'G7_U04', name: '文字式', modes: ['MATH_G7_U04'] },
    { id: 'G7_U05', name: '文字式の 計算', modes: ['MATH_G7_U05'] },
    { id: 'G7_U06', name: '一次方程式', modes: ['MATH_G7_U06'] },
    { id: 'G7_U07', name: '一次方程式の 利用', modes: ['MATH_G7_U07'] },
    { id: 'G7_U08', name: '比例 と 反比例', modes: ['MATH_G7_U08'] },
    { id: 'G7_U09', name: '平面図形', modes: ['MATH_G7_U09'] },
    { id: 'G7_U10', name: '空間図形', modes: ['MATH_G7_U10'] },
    { id: 'G7_U11', name: '資料の 整理 と 活用', modes: ['MATH_G7_U11'] },
  ],
  8: [
    { id: 'G8_U01', name: '式の計算', modes: ['MATH_G8_U01'] },
    { id: 'G8_U02', name: '連立方程式', modes: ['MATH_G8_U02'] },
    { id: 'G8_U03', name: '連立方程式の 利用', modes: ['MATH_G8_U03'] },
    { id: 'G8_U04', name: '一次関数', modes: ['MATH_G8_U04'] },
    { id: 'G8_U05', name: '図形の 性質', modes: ['MATH_G8_U05'] },
    { id: 'G8_U06', name: '図形の 合同', modes: ['MATH_G8_U06'] },
    { id: 'G8_U07', name: '三角形 と 四角形', modes: ['MATH_G8_U07'] },
    { id: 'G8_U08', name: '確率', modes: ['MATH_G8_U08'] },
    { id: 'G8_U09', name: 'データの 分析', modes: ['MATH_G8_U09'] },
  ],
  9: [
    { id: 'G9_U01', name: '式の 展開 と 因数分解', modes: ['MATH_G9_U01'] },
    { id: 'G9_U02', name: '平方根', modes: ['MATH_G9_U02'] },
    { id: 'G9_U03', name: '二次方程式', modes: ['MATH_G9_U03'] },
    { id: 'G9_U04', name: '二次方程式の 利用', modes: ['MATH_G9_U04'] },
    { id: 'G9_U05', name: '関数 y=ax²', modes: ['MATH_G9_U05'] },
    { id: 'G9_U06', name: '相似な 図形', modes: ['MATH_G9_U06'] },
    { id: 'G9_U07', name: '三平方の 定理', modes: ['MATH_G9_U07'] },
    { id: 'G9_U08', name: '円の 性質', modes: ['MATH_G9_U08'] },
    { id: 'G9_U09', name: '標本調査', modes: ['MATH_G9_U09'] },
  ],
};

const getCategoryIcon = (id: string) => {
    switch(id) {
        case 'MATH': return <Brain size={20} />;
        case 'KOKUGO_GRADES': return <Book size={20} />;
        case 'KANJI': return <Book size={20} />;
        case 'ENGLISH': return <Languages size={20} />;
        case 'SCIENCE': return <FlaskConical size={20} />;
        case 'SOCIAL': return <Globe size={20} />;
        case 'SUMMARY': return <GraduationCap size={20} />;
        case 'MAP_PREF': return <MapPin size={20} />;
        default: return <Home size={20} />;
    }
};

// カテゴリカラーからボタンの背景色（強度別）を取得するヘルパー
const getTailwindColorClass = (color: string, isSelected: boolean) => {
    switch(color) {
        case 'emerald': return isSelected ? 'bg-emerald-600' : 'bg-emerald-900/60';
        case 'cyan': return isSelected ? 'bg-cyan-600' : 'bg-cyan-900/60';
        case 'indigo': return isSelected ? 'bg-indigo-600' : 'bg-indigo-900/60';
        case 'amber': return isSelected ? 'bg-amber-600' : 'bg-amber-900/60';
        case 'orange': return isSelected ? 'bg-orange-600' : 'bg-orange-900/60';
        case 'rose': return isSelected ? 'bg-rose-600' : 'bg-rose-900/60';
        default: return isSelected ? 'bg-slate-600' : 'bg-slate-900/60';
    }
};

const getGlowColorClass = (color: string) => {
    switch(color) {
        case 'emerald': return 'shadow-[0_0_15px_rgba(16,185,129,0.5)]';
        case 'cyan': return 'shadow-[0_0_15px_rgba(6,182,212,0.5)]';
        case 'indigo': return 'shadow-[0_0_15px_rgba(79,70,229,0.5)]';
        case 'amber': return 'shadow-[0_0_15px_rgba(245,158,11,0.5)]';
        case 'orange': return 'shadow-[0_0_15px_rgba(249,115,22,0.5)]';
        case 'rose': return 'shadow-[0_0_15px_rgba(244,63,94,0.5)]';
        default: return 'shadow-[0_0_15px_rgba(255,255,255,0.3)]';
    }
};

const getCategoryClasses = (color: string) => {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-900' };
    case 'cyan': return { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-900' };
    case 'indigo': return { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-900' };
    case 'amber': return { bg: 'bg-amber-600', hover: 'hover:bg-amber-500', text: 'text-amber-400', border: 'border-amber-900' };
    case 'orange': return { bg: 'bg-orange-600', hover: 'hover:bg-orange-500', text: 'text-orange-400', border: 'border-orange-900' };
    case 'rose': return { bg: 'bg-rose-600', hover: 'hover:bg-rose-500', text: 'text-rose-400', border: 'border-rose-900' };
    default: return { bg: 'bg-slate-600', hover: 'hover:bg-slate-500', text: 'text-slate-400', border: 'border-slate-900' };
  }
};

const ProblemChallengeScreen: React.FC<ProblemChallengeScreenProps> = ({
  onBack,
  languageMode,
  onCorrectAnswers,
  modeCorrectCounts = {},
}) => {
  const [phase, setPhase] = useState<'SELECT' | 'CHALLENGE'>('SELECT');
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategoryConfig>(SUBJECT_CATEGORIES[0]);
  const [selectedSubMode, setSelectedSubMode] = useState<SubModeConfig>(SUBJECT_CATEGORIES[0].subModes[0]);
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallengeConfig | null>(null);
  const [selectedMathGrade, setSelectedMathGrade] = useState<number>(1);
  const [selectedMathUnitIds, setSelectedMathUnitIds] = useState<string[]>([]);
  const [selectedBgmId, setSelectedBgmId] = useState('random');
  const [streak, setStreak] = useState(0);
  const [records, setRecords] = useState<Record<string, number>>({});
  const [isQuitting, setIsQuitting] = useState(false);
  const isUnitCategory = selectedCategory.id === 'MATH_GRADES' || selectedCategory.id === 'KOKUGO_GRADES' || selectedCategory.id === 'ENGLISH' || selectedCategory.id === 'SCIENCE' || selectedCategory.id === 'SOCIAL' || selectedCategory.id === 'SUMMARY';
  
  // Voice feature control
  const [voiceEnabled, setVoiceEnabled] = useState(() => storageService.getEnglishVoiceEnabled());
  const getCategoryLabel = (name: string) => transProblemSubjectName(name, languageMode);
  const getSubLabel = (sub: SubModeConfig) => trans(sub.name, languageMode);

  useEffect(() => {
    audioService.init();
    setRecords(storageService.getChallengeRecords());
  }, []);

  const getCombinedSelection = (): ActiveChallengeConfig => {
    const allUnits = getAllSelectableUnits();
    
    const selectedUnits = allUnits.filter((u) => selectedMathUnitIds.includes(u.id));
    const modePool = Array.from(new Set(selectedUnits.flatMap((u) => u.modes || (u.mode ? [u.mode] : []))));

    const representativeMode = (selectedUnits[0]?.modes?.[0] || selectedUnits[0]?.mode || GameMode.MATH_G1_1) as GameMode;

    const label = selectedUnits.length === 1
      ? selectedUnits[0].name
      : selectedUnits.length > 0
      ? `${trans('ミックス選択', languageMode)} (${selectedUnits.length}${trans('単元', languageMode)})`
      : trans('単元未選択', languageMode);
      
    const subModeId = `COMBINED_MIX_${selectedUnits.map((u) => u.id).sort().join('_') || 'NONE'}`;

    return {
      subMode: { 
        id: subModeId, 
        name: label, 
        mode: representativeMode
      },
      modePool,
    };
  };

  const getSelectableGrades = (categoryId: SubjectCategoryConfig['id']): number[] => {
    if (categoryId === 'ENGLISH' || categoryId === 'SOCIAL') return [3, 4, 5, 6, 7, 8, 9];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  };

  const handleMathGradeSelect = (grade: number) => {
    setSelectedMathGrade(grade);
    audioService.playSound('select');
  };

  const toggleMathUnit = (unitId: string) => {
    setSelectedMathUnitIds((prev) => {
      if (prev.includes(unitId)) {
        return prev.filter((id) => id !== unitId);
      }
      return [...prev, unitId];
    });
    audioService.playSound('select');
  };

  const clearSelectedUnits = () => {
    setSelectedMathUnitIds([]);
    audioService.playSound('select');
  };

  const handleCategorySelect = (cat: SubjectCategoryConfig) => {
      setSelectedCategory(cat);
      setSelectedSubMode(cat.subModes[0]); 
      setActiveChallenge(null);
      if (cat.id === 'ENGLISH' && selectedMathGrade < 3) {
        setSelectedMathGrade(3);
      }
      audioService.playSound('select');
  };

  const handleStart = () => {
    if (isUnitCategory && selectedMathUnitIds.length === 0) {
      return;
    }
    const challengeConfig = isUnitCategory 
      ? getCombinedSelection()
      : { subMode: selectedSubMode };

    setActiveChallenge(challengeConfig);
    setPhase('CHALLENGE');
    setStreak(0);
    
    if (selectedBgmId === 'random') {
      audioService.playRandomBGM();
    } else if (selectedBgmId === 'none') {
      audioService.stopBGM();
    } else {
      audioService.playBGM(selectedBgmId as any, true);
    }
  };

  const handleCompleteOne = (correctCount: number) => {
    const challengeSubMode = activeChallenge?.subMode ?? selectedSubMode;
    const challengeModePool = activeChallenge?.modePool;

    if (correctCount > 0) {
      if (!challengeModePool || challengeModePool.length === 0) {
        onCorrectAnswers?.(challengeSubMode.mode, correctCount);
      }
      const newStreak = streak + correctCount;
      setStreak(newStreak);
      
      const recordKey = `${selectedCategory.id}_${challengeSubMode.id}`;
      if (!records[recordKey] || newStreak > records[recordKey]) {
          storageService.saveChallengeRecord(recordKey, newStreak);
          setRecords(prev => ({ ...prev, [recordKey]: newStreak }));
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setIsQuitting(true);
    setTimeout(() => {
        setPhase('SELECT');
        setIsQuitting(false);
        setActiveChallenge(null);
        audioService.playBGM('menu');
    }, 800);
  };

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    storageService.saveEnglishVoiceEnabled(newVal);
    audioService.playSound('select');
  };

  const getUnitCorrectCount = (unit: { mode?: string; modes?: string[] }) => {
    if (unit.modes && unit.modes.length > 0) {
      return unit.modes.reduce((total, mode) => total + (modeCorrectCounts[mode] || 0), 0);
    }
    if (unit.mode) return modeCorrectCounts[unit.mode] || 0;
    return 0;
  };

  if (phase === 'CHALLENGE') {
    const challengeSubMode = activeChallenge?.subMode ?? selectedSubMode;
    const challengeModePool = activeChallenge?.modePool;
    const ChallengeScreen = getChallengeScreenForMode(challengeSubMode.mode);
    
    return (
      <div className="w-full h-full relative bg-black flex flex-col">
        <div className="bg-black/80 border-b-2 border-gray-700 p-2 flex justify-between items-center z-50 shrink-0">
          <div className="flex gap-4 items-center">
            <div className="text-yellow-400 font-bold flex items-center gap-2">
              <Target size={20}/> 正解数: <span className="text-2xl font-mono">{streak}</span>
            </div>
            <div className="text-gray-500 text-xs font-bold border-l border-gray-700 pl-4 hidden sm:block">
              {challengeSubMode.name} ベスト: <span className="text-white font-mono">{records[`${selectedCategory.id}_${challengeSubMode.id}`] || 0}</span> 問
            </div>
          </div>
          <button 
            onClick={handleFinish}
            className="bg-red-900/60 hover:bg-red-800 border border-red-500 px-4 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            <LogOut size={14}/> 終了
          </button>
        </div>

        <MiniBattleBanner key={challengeSubMode.id} streak={streak} />

        <div className="flex-1 min-h-0 relative">
          {ChallengeScreen === GameScreen.MATH_CHALLENGE && (
            <MathChallengeScreen 
              key={streak} 
              mode={challengeSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.KANJI_CHALLENGE && (
            <KanjiChallengeScreen 
              key={streak}
              mode={challengeSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.ENGLISH_CHALLENGE && (
            <EnglishChallengeScreen 
              key={streak}
              mode={challengeSubMode.mode} 
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
          {ChallengeScreen === GameScreen.GENERAL_CHALLENGE && (
            <GeneralChallengeScreen 
              key={streak}
              mode={challengeSubMode.mode}
              modePool={challengeModePool}
              onModeCorrect={onCorrectAnswers}
              onComplete={handleCompleteOne} 
              isChallenge={true}
              streak={streak}
            />
          )}
        </div>

        {isQuitting && (
            <div className="absolute inset-0 bg-black/90 z-[100] flex items-center justify-center animate-in fade-in duration-300">
                <div className="text-center">
                    <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-2xl font-bold text-white mb-2">チャレンジ終了！</h3>
                    <p className="text-gray-400">今回の記録: <span className="text-yellow-400 text-xl font-bold">{streak}</span> 問</p>
                    <p className="text-green-400 text-xs mt-4 animate-pulse">※累計正解数に加算されました</p>
                </div>
            </div>
        )}
      </div>
    );
  }

  const previewSelection = isUnitCategory ? getCombinedSelection() : null;

  const currentUnits = getCurrentUnitsForCategory(selectedCategory.id, selectedMathGrade);
  const canStart = !isUnitCategory || selectedMathUnitIds.length > 0;
  const footerSelectionLabel = previewSelection
    ? previewSelection.subMode.name
    : getSubLabel(selectedSubMode);

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 texture-dark-matter opacity-30 pointer-events-none"></div>
      
      <div className="z-10 w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header - Fixed */}
        <div className="text-center border-b border-slate-800 p-3 shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-emerald-400 tracking-widest mb-1">
            {trans('問題チャレンジ', languageMode)}
          </h2>
          <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold text-[9px] uppercase tracking-wider">
            <Star size={8} fill="currentColor"/> {trans('ミニゲーム解放カウント対象', languageMode)} <Star size={8} fill="currentColor"/>
          </div>
        </div>

        {/* Main Selection Area - Flexible with Scrollbars */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
          
          {/* Left: Category Selector - Grid on mobile, vertically flex on PC */}
          <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-5 lg:flex lg:flex-col gap-1 lg:gap-1.5 pb-1 lg:pb-0 overflow-y-auto lg:overflow-x-visible custom-scrollbar shrink-0">
            {SUBJECT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center justify-center lg:justify-start gap-2 px-2 py-1.5 sm:p-2.5 lg:p-3 rounded-lg lg:rounded-xl border-2 transition-all shrink-0 lg:shrink-0 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-0 ${selectedCategory.id === cat.id ? `bg-emerald-900/40 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <div className={`${selectedCategory.id === cat.id ? `text-emerald-400` : 'text-slate-500'} scale-75 lg:scale-100 hidden lg:flex items-center justify-center h-4 lg:h-auto`}>
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="font-bold text-sm sm:text-base lg:text-sm text-center lg:text-left leading-tight w-full whitespace-normal break-words">
                  {getCategoryLabel(cat.name)}
                </span>
              </button>
            ))}
          </div>

          {/* Middle: SubMode Selector - Scrollable vertically */}
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-2 uppercase tracking-tight shrink-0">
              <ChevronRight size={10} className="text-emerald-500"/> {trans('種目を選択', languageMode)}
            </h3>
            <div className="bg-black/40 p-3 rounded-xl border border-slate-800 flex-grow overflow-y-auto custom-scrollbar shadow-inner min-h-[160px]">
                {isUnitCategory ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] text-gray-400 mb-1">{trans('学年', languageMode)}</div>
                      <div className="grid grid-cols-9 sm:grid-cols-5 gap-1">
                        {getSelectableGrades(selectedCategory.id).map((grade) => {
                          const isSelected = selectedMathGrade === grade;
                          const theme = getCategoryClasses(selectedCategory.color);
                          return (
                            <button
                              key={grade}
                              onClick={() => handleMathGradeSelect(grade)}
                              className={`px-0.5 py-1 rounded border text-[9px] sm:text-[10px] font-bold leading-none transition-colors ${isSelected ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                            >
                              {getGradeLabel(grade, languageMode)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="text-[10px] text-gray-400">{trans('単元', languageMode)}</div>
                        <button
                          type="button"
                          onClick={clearSelectedUnits}
                          disabled={selectedMathUnitIds.length === 0}
                          className={`rounded border px-2 py-0.5 text-[9px] font-bold transition-colors ${selectedMathUnitIds.length > 0 ? 'border-slate-500 text-slate-200 hover:bg-slate-700' : 'border-slate-700 text-slate-500 cursor-not-allowed opacity-60'}`}
                        >
                          {trans('選択解除', languageMode)}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {currentUnits.map((unit) => {
                          const isSelected = selectedMathUnitIds.includes(unit.id);
                          const theme = getCategoryClasses(selectedCategory.color);
                          return (
                            <button
                              key={unit.id}
                              onClick={() => toggleMathUnit(unit.id)}
                              className={`relative w-full p-1.5 pr-12 sm:p-2 sm:pr-14 rounded-lg border text-left text-[10px] sm:text-xs font-bold leading-snug transition-colors ${isSelected ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-200 hover:border-slate-400'}`}
                            >
                              <span className="block">{unit.name}</span>
                              <span className="absolute right-1 top-1 rounded-full bg-black/45 border border-white/15 px-1 py-0.5 text-[7px] sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px] font-mono leading-none text-white/90">
                                {getUnitCorrectCount(unit)}問
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-black/40 px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-300">
                      {trans('出題範囲', languageMode)}: {previewSelection?.subMode.name}
                    </div>
                    {selectedMathUnitIds.length === 0 && (
                      <div className="text-[10px] text-amber-300">
                        {currentUnits.length > 0 ? trans('単元を1つ以上選ぶと開始できます', languageMode) : trans('この学年の単元はまだ未実装です', languageMode)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`grid ${selectedCategory.id === 'KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                      {selectedCategory.subModes.map((sub) => {
                        const recordKey = `${selectedCategory.id}_${sub.id}`;
                        const isSelected = selectedSubMode.id === sub.id;
                        const theme = getCategoryClasses(selectedCategory.color);
                        
                        return (
                          <button
                            key={sub.id}
                            onClick={() => { setSelectedSubMode(sub); audioService.playSound('select'); }}
                            className={`p-2 rounded-lg border text-left text-[10px] md:text-xs font-bold transition-colors ${isSelected ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                          >
                            <div className="flex justify-between items-center mb-1 w-full truncate gap-2">
                                <span className={isSelected ? 'text-white' : ''}>{getSubLabel(sub)}</span>
                                {isSelected && <CheckCircle size={12} className="text-white animate-pulse shrink-0" />}
                            </div>
                            <div className="bg-black/40 px-1.5 rounded text-[8px] md:text-[9px] font-mono text-white/90 border border-white/10 w-fit">
                              BEST: {records[recordKey] || 0}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
            </div>
          </div>

          {/* Right: Settings - Scrollable vertically */}
          <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar shrink-0">
             <div className="bg-black/40 rounded-xl border border-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">{trans('選択中', languageMode)}</div>
              <div className="text-xs font-bold text-emerald-400">{getCategoryLabel(selectedCategory.name)} / {footerSelectionLabel}</div>
            </div>
            
            <button 
              onClick={handleStart}
              disabled={!canStart}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 ${canStart ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none animate-pulse' : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'}`}
            >
              <Play fill="currentColor" size={20}/> {trans('チャレンジ開始！', languageMode)}
            </button>
             {!canStart && (
              <div className="text-[10px] text-amber-300">
                {isUnitCategory
                  ? trans('単元を1つ以上選ぶと開始できます', languageMode)
                  : trans('開始条件を確認してください', languageMode)}
              </div>
            )}

            <div className="flex flex-col mt-2">
                <h3 className="text-[10px] md:text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-2 uppercase tracking-tight shrink-0">
                <Music size={10} className="text-emerald-500"/> BGM
                </h3>
                <select
                  value={selectedBgmId}
                  onChange={(e) => {
                    setSelectedBgmId(e.target.value);
                    audioService.playSound('select');
                  }}
                  className="w-full bg-slate-800 border-2 border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {BGM_OPTIONS.map(bgm => (
                    <option key={bgm.id} value={bgm.id}>
                      {bgm.name}
                    </option>
                  ))}
                </select>
            </div>

            {selectedCategory.id === 'ENGLISH' && (
                <div className="flex flex-col shrink-0">
                    <h3 className="text-[10px] md:text-xs font-bold text-gray-400 mb-1.5 flex items-center gap-2 uppercase tracking-tight">
                    <Volume2 size={10} className="text-emerald-500"/> 読み上げ
                    </h3>
                    <button 
                        onClick={toggleVoice}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border-2 font-bold transition-all ${voiceEnabled ? 'bg-cyan-900/40 border-cyan-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        <div className="flex items-center gap-2">
                            {voiceEnabled ? <Volume2 size={14} className="text-cyan-400"/> : <VolumeX size={14}/>}
                            <span className="text-[10px]">{voiceEnabled ? 'オン' : 'オフ'}</span>
                        </div>
                        <div className={`w-7 h-3.5 rounded-full relative transition-colors ${voiceEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                            <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full transition-all ${voiceEnabled ? 'left-4' : 'left-0.5'}`}></div>
                        </div>
                    </button>
                </div>
            )}
            
            <button onClick={onBack} className="mt-auto text-slate-400 hover:text-white flex items-center gap-2 transition-colors py-1 text-xs">
              <ArrowLeft size={14} /> もどる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemChallengeScreen;
