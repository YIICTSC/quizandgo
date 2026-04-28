import React, { useState } from 'react';
import { GameMode, LanguageMode } from '../types';
import {
  Brain, Book, Languages, FlaskConical, Globe, MapPin,
  Home, ArrowLeft, GraduationCap
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { SUBJECT_CATEGORIES, SubjectCategoryConfig, SubjectCategoryType } from '../subjectConfig';
import { ENGLISH_GRADE_UNITS } from '../englishUnitConfig';
import { SCIENCE_GRADE_UNITS, getScienceGradeMode } from '../scienceUnitConfig';
import { SOCIAL_GRADE_UNITS, getSocialGradeMode } from '../socialUnitConfig';
import { trans, transProblemSubjectName } from '../utils/textUtils';

interface ModeSelectionScreenProps {
  onSelectMode: (mode: GameMode, modePool?: string[]) => void;
  onBack: () => void;
  languageMode: LanguageMode;
  modeMasteryMap?: Record<string, boolean>;
  modeCorrectCounts?: Record<string, number>;
}

interface MathUnitOption {
  id: string;
  name: string;
  mode?: string;
  modes?: string[];
}

interface SelectableUnitOption {
  id: string;
  name: string;
  mode?: string;
  modes?: string[];
}

const KOKUGO_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'J1_U01', name: 'ひらがな', mode: 'KOKUGO_G1_U01' },
    { id: 'J1_U02', name: 'ことばあつめ', mode: 'KOKUGO_G1_U02' },
    { id: 'J1_U03', name: 'のばすおん（ー）', mode: 'KOKUGO_G1_U03' },
    { id: 'J1_U04', name: 'ちいさい「っ」', mode: 'KOKUGO_G1_U04' },
    { id: 'J1_U05', name: '「は・を・へ」のつかいかた', mode: 'KOKUGO_G1_U05' },
    { id: 'J1_U06', name: 'かたかな', mode: 'KOKUGO_G1_U06' },
    { id: 'J1_U07', name: 'おはなしをよむ', mode: 'KOKUGO_G1_U07' },
    { id: 'J1_U08', name: 'せつめいぶんをよむ', mode: 'KOKUGO_G1_U08' },
    { id: 'J1_U09', name: 'ばめんをそうぞうしてよむ', mode: 'KOKUGO_G1_U09' },
    { id: 'J1_U10', name: 'たいせつなところをみつけてよむ', mode: 'KOKUGO_G1_U10' },
    { id: 'J1_U11', name: 'ぶんをかく', mode: 'KOKUGO_G1_U11' },
    { id: 'J1_U12', name: 'かんたんなにっき', mode: 'KOKUGO_G1_U12' },
    { id: 'J1_U13', name: 'おはなしをつくる', mode: 'KOKUGO_G1_U13' },
    { id: 'J1_U14', name: 'はなしをきく', mode: 'KOKUGO_G1_U14' },
    { id: 'J1_U15', name: 'じぶんのことをはなす', mode: 'KOKUGO_G1_U15' },
    { id: 'J1_U16', name: 'みんなのまえではなす', mode: 'KOKUGO_G1_U16' },
  ],
  2: [
    { id: 'J2_U01', name: 'かたかなのことば', mode: 'KOKUGO_G2_U01' },
    { id: 'J2_U02', name: '主語 と 述語', mode: 'KOKUGO_G2_U02' },
    { id: 'J2_U03', name: '文のきまり', mode: 'KOKUGO_G2_U03' },
    { id: 'J2_U04', name: '日記を書く', mode: 'KOKUGO_G2_U04' },
    { id: 'J2_U05', name: 'せつめい文を読む', mode: 'KOKUGO_G2_U05' },
    { id: 'J2_U06', name: '物語を読む', mode: 'KOKUGO_G2_U06' },
    { id: 'J2_U07', name: '大事なことを見つける', mode: 'KOKUGO_G2_U07' },
    { id: 'J2_U08', name: '手紙を書く', mode: 'KOKUGO_G2_U08' },
    { id: 'J2_U09', name: '作文を書く', mode: 'KOKUGO_G2_U09' },
    { id: 'J2_U10', name: '話を聞く', mode: 'KOKUGO_G2_U10' },
    { id: 'J2_U11', name: '順序よく話す', mode: 'KOKUGO_G2_U11' },
  ],
  3: [
    { id: 'J3_U01', name: '漢字の読み書き', mode: 'KOKUGO_G3_U01' },
    { id: 'J3_U02', name: '国語辞典の使い方', mode: 'KOKUGO_G3_U02' },
    { id: 'J3_U03', name: '段落', mode: 'KOKUGO_G3_U03' },
    { id: 'J3_U04', name: '物語文の読み取り', mode: 'KOKUGO_G3_U04' },
    { id: 'J3_U05', name: '説明文の読み取り', mode: 'KOKUGO_G3_U05' },
    { id: 'J3_U06', name: '要点をまとめる', mode: 'KOKUGO_G3_U06' },
    { id: 'J3_U07', name: '日記・作文', mode: 'KOKUGO_G3_U07' },
    { id: 'J3_U08', name: '手紙の書き方', mode: 'KOKUGO_G3_U08' },
    { id: 'J3_U09', name: '話し合い', mode: 'KOKUGO_G3_U09' },
  ],
  4: [
    { id: 'J4_U01', name: '漢字の使い方', mode: 'KOKUGO_G4_U01' },
    { id: 'J4_U02', name: '熟語', mode: 'KOKUGO_G4_U02' },
    { id: 'J4_U03', name: '国語辞典・漢字辞典', mode: 'KOKUGO_G4_U03' },
    { id: 'J4_U04', name: '段落と要旨', mode: 'KOKUGO_G4_U04' },
    { id: 'J4_U05', name: '物語文の読み取り', mode: 'KOKUGO_G4_U05' },
    { id: 'J4_U06', name: '説明文の読み取り', mode: 'KOKUGO_G4_U06' },
    { id: 'J4_U07', name: '要約', mode: 'KOKUGO_G4_U07' },
    { id: 'J4_U08', name: '意見文を書く', mode: 'KOKUGO_G4_U08' },
    { id: 'J4_U09', name: '話し合いと発表', mode: 'KOKUGO_G4_U09' },
  ],
  5: [
    { id: 'J5_U01', name: '漢字の意味と使い分け', mode: 'KOKUGO_G5_U01' },
    { id: 'J5_U02', name: '敬語', mode: 'KOKUGO_G5_U02' },
    { id: 'J5_U03', name: '物語文の読み取り', mode: 'KOKUGO_G5_U03' },
    { id: 'J5_U04', name: '説明文の読み取り', mode: 'KOKUGO_G5_U04' },
    { id: 'J5_U05', name: '要約と要旨', mode: 'KOKUGO_G5_U05' },
    { id: 'J5_U06', name: '意見文を書く', mode: 'KOKUGO_G5_U06' },
    { id: 'J5_U07', name: '報告文を書く', mode: 'KOKUGO_G5_U07' },
    { id: 'J5_U08', name: '討論', mode: 'KOKUGO_G5_U08' },
    { id: 'J5_U09', name: 'スピーチ', mode: 'KOKUGO_G5_U09' },
  ],
  6: [
    { id: 'J6_U01', name: '漢字のまとめ', mode: 'KOKUGO_G6_U01' },
    { id: 'J6_U02', name: '熟語と語句', mode: 'KOKUGO_G6_U02' },
    { id: 'J6_U03', name: '物語文の読み取り', mode: 'KOKUGO_G6_U03' },
    { id: 'J6_U04', name: '説明文の読み取り', mode: 'KOKUGO_G6_U04' },
    { id: 'J6_U05', name: '要旨と要約', mode: 'KOKUGO_G6_U05' },
    { id: 'J6_U06', name: '意見文を書く', mode: 'KOKUGO_G6_U06' },
    { id: 'J6_U07', name: '提案文を書く', mode: 'KOKUGO_G6_U07' },
    { id: 'J6_U08', name: '討論', mode: 'KOKUGO_G6_U08' },
    { id: 'J6_U09', name: 'スピーチ', mode: 'KOKUGO_G6_U09' },
    { id: 'J6_U10', name: '卒業文集', mode: 'KOKUGO_G6_U10' },
  ],
  7: [
    { id: 'J7_U01', name: '物語文の読み取り', mode: 'KOKUGO_G7_U01' },
    { id: 'J7_U02', name: '説明文の読み取り', mode: 'KOKUGO_G7_U02' },
    { id: 'J7_U03', name: '詩の読み取り', mode: 'KOKUGO_G7_U03' },
    { id: 'J7_U04', name: '古典（古文の基礎）', mode: 'KOKUGO_G7_U04' },
    { id: 'J7_U05', name: '漢文の基礎', mode: 'KOKUGO_G7_U05' },
    { id: 'J7_U06', name: '文の成分（主語・述語など）', mode: 'KOKUGO_G7_U06' },
    { id: 'J7_U07', name: '品詞', mode: 'KOKUGO_G7_U07' },
    { id: 'J7_U08', name: '漢字の読み書き', mode: 'KOKUGO_G7_U08' },
    { id: 'J7_U09', name: '要約', mode: 'KOKUGO_G7_U09' },
    { id: 'J7_U10', name: '意見文', mode: 'KOKUGO_G7_U10' },
    { id: 'J7_U11', name: 'スピーチ', mode: 'KOKUGO_G7_U11' },
    { id: 'J7_U12', name: '話し合い', mode: 'KOKUGO_G7_U12' },
  ],
  8: [
    { id: 'J8_U01', name: '物語文の読み取り', mode: 'KOKUGO_G8_U01' },
    { id: 'J8_U02', name: '説明文の読み取り', mode: 'KOKUGO_G8_U02' },
    { id: 'J8_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G8_U03' },
    { id: 'J8_U04', name: '古文（物語・随筆）', mode: 'KOKUGO_G8_U04' },
    { id: 'J8_U05', name: '漢文（訓読・故事成語）', mode: 'KOKUGO_G8_U05' },
    { id: 'J8_U06', name: '文法（品詞・活用）', mode: 'KOKUGO_G8_U06' },
    { id: 'J8_U07', name: '漢字の読み書き', mode: 'KOKUGO_G8_U07' },
    { id: 'J8_U08', name: '要約', mode: 'KOKUGO_G8_U08' },
    { id: 'J8_U09', name: '意見文', mode: 'KOKUGO_G8_U09' },
    { id: 'J8_U10', name: '発表', mode: 'KOKUGO_G8_U10' },
    { id: 'J8_U11', name: '討論', mode: 'KOKUGO_G8_U11' },
  ],
  9: [
    { id: 'J9_U01', name: '物語文の読み取り', mode: 'KOKUGO_G9_U01' },
    { id: 'J9_U02', name: '説明文の読み取り', mode: 'KOKUGO_G9_U02' },
    { id: 'J9_U03', name: '詩・短歌・俳句', mode: 'KOKUGO_G9_U03' },
    { id: 'J9_U04', name: '古文（古典文学）', mode: 'KOKUGO_G9_U04' },
    { id: 'J9_U05', name: '漢文（名文・思想）', mode: 'KOKUGO_G9_U05' },
    { id: 'J9_U06', name: '文法（文の構造）', mode: 'KOKUGO_G9_U06' },
    { id: 'J9_U07', name: '漢字の読み書き', mode: 'KOKUGO_G9_U07' },
    { id: 'J9_U08', name: '要約', mode: 'KOKUGO_G9_U08' },
    { id: 'J9_U09', name: '論説文を書く', mode: 'KOKUGO_G9_U09' },
    { id: 'J9_U10', name: 'スピーチ', mode: 'KOKUGO_G9_U10' },
    { id: 'J9_U11', name: '討論', mode: 'KOKUGO_G9_U11' },
    { id: 'J9_U12', name: '卒業論文・発表', mode: 'KOKUGO_G9_U12' },
  ],
};

const MATH_GRADE_UNITS: Record<number, MathUnitOption[]> = {
  1: [
    { id: 'G1_U01', name: 'かずとすうじ（10までの かず）', mode: 'MATH_G1_U01' },
    { id: 'G1_U02', name: 'いくつといくつ', mode: 'MATH_G1_U02' },
    { id: 'G1_U03', name: 'かたちあそび', mode: 'MATH_G1_U03' },
    { id: 'G1_U04', name: 'なんばんめ', mode: 'MATH_G1_U04' },
    { id: 'G1_U05', name: 'あわせていくつ（たしざん）', mode: 'MATH_G1_U05' },
    { id: 'G1_U06', name: 'ふえるといくつ（たしざん）', mode: 'MATH_G1_U06' },
    { id: 'G1_U07', name: 'のこりはいくつ（ひきざん）', mode: 'MATH_G1_U07' },
    { id: 'G1_U08', name: 'ちがいはいくつ（ひきざん）', mode: 'MATH_G1_U08' },
    { id: 'G1_U09', name: '20までのかず', mode: 'MATH_G1_U09' },
    { id: 'G1_U10', name: 'なんじ（とけい）', mode: 'MATH_G1_U10' },
    { id: 'G1_U11', name: 'ながさくらべ', mode: 'MATH_G1_U11' },
    { id: 'G1_U12', name: 'かさくらべ', mode: 'MATH_G1_U12' },
    { id: 'G1_U13', name: 'えぐらふ', mode: 'MATH_G1_U13' },
    { id: 'G1_U14', name: 'ひょう', mode: 'MATH_G1_U14' },
    { id: 'G1_U15', name: 'さんかくとしかく', mode: 'MATH_G1_U15' },
    { id: 'G1_U16', name: 'かたちづくり', mode: 'MATH_G1_U16' },
    { id: 'G1_U17', name: '3つのかずのけいさん', mode: 'MATH_G1_U17' },
    { id: 'G1_U18', name: 'ぶんしょうだい', mode: 'MATH_G1_U18' },
  ],
  2: [
    { id: 'G2_U01', name: '表 と グラフ', mode: 'MATH_G2_U01' },
    { id: 'G2_U02', name: 'たし算（2けた＋2けた）', mode: 'MATH_G2_U02' },
    { id: 'G2_U03', name: 'ひき算（2けた−2けた）', mode: 'MATH_G2_U03' },
    { id: 'G2_U04', name: '長さ（ものさし）', mode: 'MATH_G2_U04' },
    { id: 'G2_U05', name: '100までの 数', mode: 'MATH_G2_U05' },
    { id: 'G2_U06', name: 'かさ（リットル・デシリットル）', mode: 'MATH_G2_U06' },
    { id: 'G2_U07', name: '時こく と 時かん', mode: 'MATH_G2_U07' },
    { id: 'G2_U08', name: '3けたの 数', mode: 'MATH_G2_U08' },
    { id: 'G2_U09', name: 'かけ算（かけ算のいみ）', mode: 'MATH_G2_U09' },
    { id: 'G2_U10', name: 'かけ算（九九）', mode: 'MATH_G2_U10' },
    { id: 'G2_U11', name: 'はこの 形', mode: 'MATH_G2_U11' },
    { id: 'G2_U12', name: 'ぶんしょうだい', mode: 'MATH_G2_U12' },
  ],
  3: [
    { id: 'G3_U01', name: '表 と グラフ', mode: 'MATH_G3_U01' },
    { id: 'G3_U02', name: '大きい 数（1000より大きい数）', mode: 'MATH_G3_U02' },
    { id: 'G3_U03', name: 'たし算（3けた・4けた）', mode: 'MATH_G3_U03' },
    { id: 'G3_U04', name: 'ひき算（3けた・4けた）', mode: 'MATH_G3_U04' },
    { id: 'G3_U05', name: '時こく と 時かん', mode: 'MATH_G3_U05' },
    { id: 'G3_U06', name: '長さ（km と m）', mode: 'MATH_G3_U06' },
    { id: 'G3_U07', name: 'かけ算（2けた×1けた など）', mode: 'MATH_G3_U07' },
    { id: 'G3_U08', name: '円 と きゅう', mode: 'MATH_G3_U08' },
    { id: 'G3_U09', name: 'わり算（わり算のいみ）', mode: 'MATH_G3_U09' },
    { id: 'G3_U10', name: 'わり算（あまりのある計算）', mode: 'MATH_G3_U10' },
    { id: 'G3_U11', name: '重さ（g と kg）', mode: 'MATH_G3_U11' },
    { id: 'G3_U12', name: '小数', mode: 'MATH_G3_U12' },
    { id: 'G3_U13', name: '分数', mode: 'MATH_G3_U13' },
    { id: 'G3_U14', name: '□をつかった 式', mode: 'MATH_G3_U14' },
  ],
  4: [
    { id: 'G4_U01', name: '大きい 数（1おくまでの数）', mode: 'MATH_G4_U01' },
    { id: 'G4_U02', name: 'わり算（2けたでわる計算）', mode: 'MATH_G4_U02' },
    { id: 'G4_U03', name: '折れ線グラフ', mode: 'MATH_G4_U03' },
    { id: 'G4_U04', name: '角', mode: 'MATH_G4_U04' },
    { id: 'G4_U05', name: 'そろばん', mode: 'MATH_G4_U05' },
    { id: 'G4_U06', name: '小数', mode: 'MATH_G4_U06' },
    { id: 'G4_U07', name: '小数の たし算 と ひき算', mode: 'MATH_G4_U07' },
    { id: 'G4_U08', name: '面せき', mode: 'MATH_G4_U08' },
    { id: 'G4_U09', name: 'がい数', mode: 'MATH_G4_U09' },
    { id: 'G4_U10', name: '式 と 計算の じゅんじょ', mode: 'MATH_G4_U10' },
    { id: 'G4_U11', name: '分数', mode: 'MATH_G4_U11' },
    { id: 'G4_U12', name: '分数の たし算 と ひき算', mode: 'MATH_G4_U12' },
    { id: 'G4_U13', name: '直方体 と 立方体', mode: 'MATH_G4_U13' },
    { id: 'G4_U14', name: '変わり方', mode: 'MATH_G4_U14' },
    { id: 'G4_U15', name: '調べたことを 表 や グラフ にまとめる', mode: 'MATH_G4_U15' },
  ],
  5: [
    { id: 'G5_U01', name: '整数 と 小数', mode: 'MATH_G5_U01' },
    { id: 'G5_U02', name: '体積', mode: 'MATH_G5_U02' },
    { id: 'G5_U03', name: '小数の かけ算', mode: 'MATH_G5_U03' },
    { id: 'G5_U04', name: '小数の わり算', mode: 'MATH_G5_U04' },
    { id: 'G5_U05', name: '合同な 図形', mode: 'MATH_G5_U05' },
    { id: 'G5_U06', name: '分数 と 小数・整数', mode: 'MATH_G5_U06' },
    { id: 'G5_U07', name: '分数の たし算 と ひき算', mode: 'MATH_G5_U07' },
    { id: 'G5_U08', name: '平均', mode: 'MATH_G5_U08' },
    { id: 'G5_U09', name: '単位量あたりの 大きさ', mode: 'MATH_G5_U09' },
    { id: 'G5_U10', name: '速さ', mode: 'MATH_G5_U10' },
    { id: 'G5_U11', name: '比例', mode: 'MATH_G5_U11' },
    { id: 'G5_U12', name: '円 と 正多角形', mode: 'MATH_G5_U12' },
    { id: 'G5_U13', name: '角柱 と 円柱', mode: 'MATH_G5_U13' },
    { id: 'G5_U14', name: '割合', mode: 'MATH_G5_U14' },
    { id: 'G5_U15', name: '帯グラフ と 円グラフ', mode: 'MATH_G5_U15' },
  ],
  6: [
    { id: 'G6_U01', name: '対称な 図形', mode: 'MATH_G6_U01' },
    { id: 'G6_U02', name: '文字 と 式', mode: 'MATH_G6_U02' },
    { id: 'G6_U03', name: '分数の かけ算', mode: 'MATH_G6_U03' },
    { id: 'G6_U04', name: '分数の わり算', mode: 'MATH_G6_U04' },
    { id: 'G6_U05', name: '比 と その 利用', mode: 'MATH_G6_U05' },
    { id: 'G6_U06', name: '比例 と 反比例', mode: 'MATH_G6_U06' },
    { id: 'G6_U07', name: '拡大図 と 縮図', mode: 'MATH_G6_U07' },
    { id: 'G6_U08', name: '円の 面積', mode: 'MATH_G6_U08' },
    { id: 'G6_U09', name: '角柱 と 円柱の 体積', mode: 'MATH_G6_U09' },
    { id: 'G6_U10', name: 'およその 面積 と 体積', mode: 'MATH_G6_U10' },
    { id: 'G6_U11', name: '場合の 数', mode: 'MATH_G6_U11' },
    { id: 'G6_U12', name: '資料の 調べ方', mode: 'MATH_G6_U12' },
    { id: 'G6_U13', name: '算数の まとめ', mode: 'MATH_G6_U13' },
  ],
  7: [
    { id: 'G7_U01', name: '正の数 と 負の数', mode: 'MATH_G7_U01' },
    { id: 'G7_U02', name: '正負の数の 加法 と 減法', mode: 'MATH_G7_U02' },
    { id: 'G7_U03', name: '正負の数の 乗法 と 除法', mode: 'MATH_G7_U03' },
    { id: 'G7_U04', name: '文字式', mode: 'MATH_G7_U04' },
    { id: 'G7_U05', name: '文字式の 計算', mode: 'MATH_G7_U05' },
    { id: 'G7_U06', name: '一次方程式', mode: 'MATH_G7_U06' },
    { id: 'G7_U07', name: '一次方程式の 利用', mode: 'MATH_G7_U07' },
    { id: 'G7_U08', name: '比例 と 反比例', mode: 'MATH_G7_U08' },
    { id: 'G7_U09', name: '平面図形', mode: 'MATH_G7_U09' },
    { id: 'G7_U10', name: '空間図形', mode: 'MATH_G7_U10' },
    { id: 'G7_U11', name: '資料の 整理 と 活用', mode: 'MATH_G7_U11' },
  ],
  8: [
    { id: 'G8_U01', name: '式の計算', mode: 'MATH_G8_U01' },
    { id: 'G8_U02', name: '連立方程式', mode: 'MATH_G8_U02' },
    { id: 'G8_U03', name: '連立方程式の 利用', mode: 'MATH_G8_U03' },
    { id: 'G8_U04', name: '一次関数', mode: 'MATH_G8_U04' },
    { id: 'G8_U05', name: '図形の 性質', mode: 'MATH_G8_U05' },
    { id: 'G8_U06', name: '図形の 合同', mode: 'MATH_G8_U06' },
    { id: 'G8_U07', name: '三角形 と 四角形', mode: 'MATH_G8_U07' },
    { id: 'G8_U08', name: '確率', mode: 'MATH_G8_U08' },
    { id: 'G8_U09', name: 'データの 分析', mode: 'MATH_G8_U09' },
  ],
  9: [
    { id: 'G9_U01', name: '式の 展開 と 因数分解', mode: 'MATH_G9_U01' },
    { id: 'G9_U02', name: '平方根', mode: 'MATH_G9_U02' },
    { id: 'G9_U03', name: '二次方程式', mode: 'MATH_G9_U03' },
    { id: 'G9_U04', name: '二次方程式の 利用', mode: 'MATH_G9_U04' },
    { id: 'G9_U05', name: '関数 y=ax²', mode: 'MATH_G9_U05' },
    { id: 'G9_U06', name: '相似な 図形', mode: 'MATH_G9_U06' },
    { id: 'G9_U07', name: '三平方の 定理', mode: 'MATH_G9_U07' },
    { id: 'G9_U08', name: '円の 性質', mode: 'MATH_G9_U08' },
    { id: 'G9_U09', name: '標本調査', mode: 'MATH_G9_U09' },
  ],
};

const CATEGORY_LABELS: Record<SubjectCategoryType, string> = {
  MATH: '計算',
  MATH_GRADES: '算数・数学',
  KOKUGO_GRADES: '国語',
  KANJI: '漢字',
  SCIENCE: '生活・理科',
  SOCIAL: '社会',
  ENGLISH: '英語',
  SUMMARY: 'まとめ',
  MAP_PREF: '地図・日本',
  IT_INFO: 'ICT・情報',
};

const SUBMODE_LABELS: Record<string, string> = {
  ADD_1DIGIT: '1けたのたし算',
  ADD_1DIGIT_CARRY: 'たし算（くりあがり）',
  SUB_1DIGIT: '1けたのひき算',
  SUB_1DIGIT_BORROW: 'ひき算（くりさがり）',
  ADDITION: '2けたのたし算',
  SUBTRACTION: '2けたのひき算',
  MULTIPLICATION: 'かけ算',
  DIVISION: 'わり算',
  MIXED: 'ミックス',
  K1: '小1漢字',
  K2: '小2漢字',
  K3: '小3漢字',
  K4: '小4漢字',
  K5: '小5漢字',
  K6: '小6漢字',
  K7: '中1漢字',
  K8: '中2漢字',
  K9: '中3漢字',
  K_MIXED: 'ミックス',
  E_ES: '小学校英語',
  E_J1: '中1英語',
  E_J2: '中2英語',
  E_J3: '中3英語',
  E_MIXED: 'ミックス',
  C1: '会話 Lv1',
  C2: '会話 Lv2',
  C3: '会話 Lv3',
  C4: '会話 Lv4',
  C5: '会話 Lv5',
  MS: '地図記号',
  PF: '都道府県',
  PC: '県庁所在地',
  IT_WIN: 'Windows',
  IT_IPAD: 'iPad',
  IT_CHROME: 'Chromebook',
  IT_NET: 'スマホ・ネット',
  IT_LIT: '情報リテラシー',
  IT_PROG: 'プログラミング',
  IT_SEC: 'モラル・セキュリティ',
};

const getCategoryIcon = (id: SubjectCategoryType) => {
  switch (id) {
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

const getDisplayGradeLabel = (grade: number, languageMode: LanguageMode) =>
  languageMode === 'JAPANESE'
    ? (grade <= 6 ? `${grade}年` : `中${grade - 6}`)
    : (grade <= 6 ? `${grade}ねん` : `ちゅう${grade - 6}`);

const getDisplayTermLabel = (term: number, languageMode: LanguageMode) =>
  languageMode === 'JAPANESE' ? `${term}学期` : `${term}がっき`;

const getKanjiGradeMode = (grade: number): string => `KANJI_${grade}`;

const getGradeSummaryModes = (grade: number): string[] => {
  const modes = [
    ...(MATH_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes || (unit.mode ? [unit.mode] : [])),
    ...(KOKUGO_GRADE_UNITS[grade] || []).flatMap((unit) => unit.modes || (unit.mode ? [unit.mode] : [])),
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

const getCurrentUnitsForCategory = (categoryId: SubjectCategoryType, grade: number): SelectableUnitOption[] => {
  if (categoryId === 'SUMMARY') {
    const summaryUnit = getGradeSummaryUnit(grade);
    return summaryUnit.modes && summaryUnit.modes.length > 0 ? [summaryUnit] : [];
  }
  if (categoryId === 'ENGLISH') return (ENGLISH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'SCIENCE') return (SCIENCE_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'SOCIAL') return (SOCIAL_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: [unit.mode] }));
  if (categoryId === 'KOKUGO_GRADES') return (KOKUGO_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) }));
  if (categoryId === 'MATH_GRADES') return (MATH_GRADE_UNITS[grade] || []).map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) }));
  return [];
};

const getAllSelectableUnits = (): SelectableUnitOption[] => [
  ...Array.from({ length: 9 }, (_, index) => getGradeSummaryUnit(index + 1)),
  ...Object.values(ENGLISH_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(SCIENCE_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(SOCIAL_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: [unit.mode] })),
  ...Object.values(KOKUGO_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) })),
  ...Object.values(MATH_GRADE_UNITS).flat().map((unit) => ({ ...unit, modes: unit.modes || (unit.mode ? [unit.mode] : []) })),
];

const getSelectableGrades = (categoryId: SubjectCategoryType): number[] => {
  if (categoryId === 'ENGLISH' || categoryId === 'SOCIAL') return [3, 4, 5, 6, 7, 8, 9];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9];
};

const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  onSelectMode,
  onBack,
  languageMode,
  modeMasteryMap = {},
  modeCorrectCounts = {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategoryConfig>(SUBJECT_CATEGORIES[0]);
  const [selectedSubModeId, setSelectedSubModeId] = useState<string>(SUBJECT_CATEGORIES[0].subModes[0]?.id || '');
  const [selectedGrade, setSelectedGrade] = useState<number>(3);
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedMathGrade, setSelectedMathGrade] = useState<number>(1);
  const [selectedMathUnitIds, setSelectedMathUnitIds] = useState<string[]>([]);
  const isUnitCategory = selectedCategory.id === 'MATH_GRADES' || selectedCategory.id === 'KOKUGO_GRADES' || selectedCategory.id === 'ENGLISH' || selectedCategory.id === 'SCIENCE' || selectedCategory.id === 'SOCIAL' || selectedCategory.id === 'SUMMARY';

  const handleSelect = (mode: string, modePool?: string[]) => {
    audioService.playSound('select');
    onSelectMode(mode as GameMode, modePool);
  };

  const isMastered = (mode: string) => !!modeMasteryMap[mode];
  const getCategoryLabel = (id: SubjectCategoryType) => transProblemSubjectName(CATEGORY_LABELS[id] || id, languageMode);
  const getSubLabel = (id: string, fallback: string) => trans(SUBMODE_LABELS[id] || fallback, languageMode);
  const getUnitCorrectCount = (unit: { mode?: string; modes?: string[] }) => {
    if (unit.modes && unit.modes.length > 0) {
      return unit.modes.reduce((total, mode) => total + (modeCorrectCounts[mode] || 0), 0);
    }
    if (unit.mode) return modeCorrectCounts[unit.mode] || 0;
    return 0;
  };

  const clearSelectedUnits = () => {
    setSelectedMathUnitIds([]);
    audioService.playSound('select');
  };

  const renderMasteryPrefix = (mode: string) => {
    if (!isMastered(mode)) return null;
    return <span className="text-red-500 font-black font-sans mr-1">◎</span>;
  };

  const handleCategorySelect = (cat: SubjectCategoryConfig) => {
    setSelectedCategory(cat);
    setSelectedSubModeId(cat.subModes[0]?.id || '');
    if (cat.id === 'ENGLISH' && selectedMathGrade < 3) {
      setSelectedMathGrade(3);
    }
    audioService.playSound('select');
  };

  const selectedSubMode = selectedCategory.subModes.find((sub) => sub.id === selectedSubModeId) || selectedCategory.subModes[0];

  const getModeSelectionPreview = () => {
    if (isUnitCategory) {
      const allUnitsAcrossAllCategories = getAllSelectableUnits();
      const selectedUnits = allUnitsAcrossAllCategories.filter((u) => selectedMathUnitIds.includes(u.id));

      const modePool = Array.from(new Set(selectedUnits.flatMap((u) => u.modes || (u.mode ? [u.mode] : []))));
      const representativeMode = (selectedUnits[0]?.modes?.[0] || selectedUnits[0]?.mode || GameMode.MATH_G1_1) as string;
      const detailLabel = selectedUnits.length === 1
        ? selectedUnits[0].name
        : selectedUnits.length > 0
        ? `${trans('ミックス選択', languageMode)} (${selectedUnits.length}${trans('単元', languageMode)})`
        : trans('単元未選択', languageMode);

      return {
        mode: representativeMode,
        modePool,
        canStart: selectedUnits.length > 0,
        label: `${getCategoryLabel(selectedCategory.id)} / ${detailLabel}`,
      };
    }

    if (selectedCategory.uiType === 'english_mixed') {
      if (selectedSubModeId === 'ENGLISH_MIXED') {
        return {
          mode: GameMode.ENGLISH_MIXED as string,
          canStart: true,
          label: `${getCategoryLabel(selectedCategory.id)} / ${trans('ミックス', languageMode)}`,
        };
      }
    }

    if (selectedCategory.uiType === 'grade_term') {
      const mode = (() => {
        if (selectedCategory.id === 'SCIENCE') return selectedGrade <= 2 ? `LIFE_${selectedGrade}_${selectedTerm}` : `SCIENCE_${selectedGrade}_${selectedTerm}`;
        if (selectedCategory.id === 'SOCIAL') return `SOCIAL_${selectedGrade}_${selectedTerm}`;
        return selectedSubMode?.mode || selectedCategory.subModes[0]?.mode;
      })() as string;

      return {
        mode,
        canStart: !!mode,
        label: `${getCategoryLabel(selectedCategory.id)} / ${getDisplayGradeLabel(selectedGrade, languageMode)} / ${getDisplayTermLabel(selectedTerm, languageMode)}`,
      };
    }

    if (selectedSubMode) {
      return {
        mode: selectedSubMode.mode as string,
        canStart: true,
        label: `${getCategoryLabel(selectedCategory.id)} / ${getSubLabel(selectedSubMode.id, selectedSubMode.name)}`,
      };
    }

    return {
      mode: '',
      canStart: false,
      label: `${getCategoryLabel(selectedCategory.id)} / ${trans('未選択', languageMode)}`,
    };
  };

  const selectionPreview = getModeSelectionPreview();

  const renderModeSelectionPanel = () => {
    const theme = getCategoryClasses(selectedCategory.color);

    if (isUnitCategory) {
      const gradeUnits = getCurrentUnitsForCategory(selectedCategory.id, selectedMathGrade);
      const grades = getSelectableGrades(selectedCategory.id);

      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学年', languageMode)}</div>
            <div className="grid grid-cols-9 sm:grid-cols-5 gap-1">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => {
                    setSelectedMathGrade(grade);
                    // Do not clear selected units when switching grades to allow cross-grade mix
                    audioService.playSound('select');
                  }}
                  className={`px-0.5 py-1 rounded border text-[9px] sm:text-[10px] font-bold leading-none transition-colors ${selectedMathGrade === grade ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayGradeLabel(grade, languageMode)}
                </button>
              ))}
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
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[48vh] overflow-y-auto custom-scrollbar pr-1">
              {gradeUnits.map((unit) => {
                const isSelected = selectedMathUnitIds.includes(unit.id);
                return (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setSelectedMathUnitIds((prev) => prev.includes(unit.id)
                        ? prev.filter((id) => id !== unit.id)
                        : [...prev, unit.id]);
                      audioService.playSound('select');
                    }}
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
        </div>
      );
    }

    if (selectedCategory.uiType === 'grade_term') {
      const grades = selectedCategory.id === 'SCIENCE' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [3, 4, 5, 6, 7, 8, 9];

      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学年', languageMode)}</div>
            <div className="grid grid-cols-5 gap-1.5">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => { setSelectedGrade(grade); audioService.playSound('select'); }}
                  className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedGrade === grade ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayGradeLabel(grade, languageMode)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{trans('学期', languageMode)}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((term) => (
                <button
                  key={term}
                  onClick={() => { setSelectedTerm(term); audioService.playSound('select'); }}
                  className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedTerm === term ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getDisplayTermLabel(term, languageMode)}
                </button>
              ))}
            </div>
          </div>
          {selectedCategory.id === 'SOCIAL' && (
            <div>
              <div className="text-[10px] text-gray-400 mb-1">{languageMode === 'JAPANESE' ? '単独モード' : 'たんどく モード'}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {selectedCategory.subModes.filter((sub) => !sub.id.includes('SO')).map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubModeId(sub.id);
                      audioService.playSound('select');
                    }}
                    className={`p-1.5 rounded border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                  >
                    {getSubLabel(sub.id, sub.name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedCategory.uiType === 'english_mixed') {
      const words = selectedCategory.subModes.filter((sub) => sub.id.startsWith('E_'));
      const convs = selectedCategory.subModes.filter((sub) => sub.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{languageMode === 'JAPANESE' ? '単語' : 'たんご'}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {words.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubModeId(sub.id); audioService.playSound('select'); }}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getSubLabel(sub.id, sub.name)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">{languageMode === 'JAPANESE' ? '会話' : 'かいわ'}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {convs.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelectedSubModeId(sub.id); audioService.playSound('select'); }}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
                >
                  {getSubLabel(sub.id, sub.name)}
                </button>
              ))}
              <button
                onClick={() => { setSelectedSubModeId('ENGLISH_MIXED'); audioService.playSound('select'); }}
                className={`p-2 rounded-lg border text-[10px] font-bold transition-colors ${selectedSubModeId === 'ENGLISH_MIXED' ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
              >
                {trans('ミックス', languageMode)}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`grid ${selectedCategory.id === 'KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
        {selectedCategory.subModes.map((sub) => (
          <button
            key={sub.id}
            onClick={() => {
              setSelectedSubModeId(sub.id);
              audioService.playSound('select');
            }}
            className={`p-2 rounded-lg border text-left text-[10px] md:text-xs font-bold transition-colors ${selectedSubModeId === sub.id ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'}`}
          >
            {renderMasteryPrefix(sub.mode)}
            {getSubLabel(sub.id, sub.name)}
          </button>
        ))}
      </div>
    );
  };

  const renderCategoryContent = (cat: SubjectCategoryConfig) => {
    const theme = getCategoryClasses(cat.color);

    if (cat.uiType === 'grid') {
      return (
        <div className={`grid ${cat.id === 'KANJI' ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5`}>
          {cat.subModes.map(sub => (
            <button
              key={sub.id}
              onClick={() => handleSelect(sub.mode)}
              className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-white transition-colors text-[10px] md:text-xs font-bold truncate"
            >
              {renderMasteryPrefix(sub.mode)}
              {getSubLabel(sub.id, sub.name)}
            </button>
          ))}
        </div>
      );
    }

    if (cat.uiType === 'grade_term') {
      if (cat.id === 'MATH_GRADES' || cat.id === 'KOKUGO_GRADES' || cat.id === 'ENGLISH' || cat.id === 'SCIENCE' || cat.id === 'SOCIAL') {
        const isKokugo = cat.id === 'KOKUGO_GRADES';
        const isEnglish = cat.id === 'ENGLISH';
        const isScience = cat.id === 'SCIENCE';
        const isSocial = cat.id === 'SOCIAL';
        const gradeUnits = isEnglish
          ? (ENGLISH_GRADE_UNITS[selectedMathGrade] || [])
          : isScience
          ? (SCIENCE_GRADE_UNITS[selectedMathGrade] || [])
          : isSocial
          ? (SOCIAL_GRADE_UNITS[selectedMathGrade] || [])
          : isKokugo
          ? (KOKUGO_GRADE_UNITS[selectedMathGrade] || [])
          : (MATH_GRADE_UNITS[selectedMathGrade] || []);
        const allUnitsAcrossGrades = [
          ...Object.values(ENGLISH_GRADE_UNITS).flat(),
          ...Object.values(SCIENCE_GRADE_UNITS).flat(),
          ...Object.values(SOCIAL_GRADE_UNITS).flat(),
          ...Object.values(KOKUGO_GRADE_UNITS).flat(),
          ...Object.values(MATH_GRADE_UNITS).flat()
        ];

        const selectedUnits = allUnitsAcrossGrades.filter((u) => selectedMathUnitIds.includes(u.id));
        const defaultMode = GameMode.MATH_G1_1;
        const selectedMode = (selectedUnits[0] && ('mode' in selectedUnits[0] ? selectedUnits[0].mode : ('modes' in selectedUnits[0] && selectedUnits[0].modes ? selectedUnits[0].modes[0] : defaultMode))) as string;
        const modePool = [...new Set(selectedUnits.flatMap((u) => {
          const modes: string[] = [];
          if ('mode' in u && u.mode) modes.push(u.mode as string);
          if ('modes' in u && u.modes && Array.isArray(u.modes)) modes.push(...u.modes);
          return modes;
        }))];
        const canStartUnits = selectedUnits.length > 0;
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] text-gray-500 whitespace-nowrap mt-1">{trans('学年', languageMode)}</span>
              <div className="flex-1 grid grid-cols-9 sm:grid-cols-5 gap-1">
                {(isEnglish ? [3, 4, 5, 6, 7, 8, 9] : isSocial ? [3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedMathGrade(g);
                      // Do not clear.
                    }}
                    className={`px-0.5 py-1 rounded text-[9px] md:text-[10px] font-bold leading-none border transition-colors ${selectedMathGrade === g ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-400'}`}
                  >
                    {getDisplayGradeLabel(g, languageMode)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-500 whitespace-nowrap">{trans('単元', languageMode)}</div>
                <button
                  type="button"
                  onClick={clearSelectedUnits}
                  disabled={selectedMathUnitIds.length === 0}
                  className={`rounded border px-2 py-0.5 text-[9px] font-bold transition-colors ${selectedMathUnitIds.length > 0 ? 'border-slate-500 text-slate-200 hover:bg-slate-700' : 'border-slate-700 text-slate-500 cursor-not-allowed opacity-60'}`}
                >
                  {trans('選択解除', languageMode)}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                {gradeUnits.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setSelectedMathUnitIds((prev) => {
                        if (prev.includes(unit.id)) {
                          return prev.filter((id) => id !== unit.id);
                        }
                        return [...prev, unit.id];
                      });
                    }}
                    className={`relative w-full p-1.5 pr-12 sm:pr-14 rounded text-[10px] md:text-xs font-bold leading-snug border text-left transition-colors ${selectedMathUnitIds.includes(unit.id) ? `${theme.bg} border-white text-white` : 'bg-slate-700 border-slate-600 text-gray-300 hover:border-slate-400'}`}
                  >
                    <span className="block">{unit.name}</span>
                    <span className="absolute right-1 top-1 rounded-full bg-black/45 border border-white/15 px-1 py-0.5 text-[7px] sm:right-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px] md:text-[9px] font-mono leading-none text-white/90">
                      {getUnitCorrectCount(unit)}問
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                if (!canStartUnits) return;
                handleSelect(selectedMode, modePool.length > 0 ? modePool : undefined);
              }}
              disabled={!canStartUnits}
              className={`w-full p-2 rounded font-bold text-xs shadow-lg transition-all text-white ${canStartUnits ? `${theme.bg} ${theme.hover}` : 'bg-slate-700 cursor-not-allowed opacity-50'}`}
            >
              {renderMasteryPrefix(selectedMode)}
              {trans('この単元ミックスで開始', languageMode)}
            </button>
            {!canStartUnits && (
              <div className="text-[10px] text-amber-300">
                {gradeUnits.length > 0 ? trans('単元を1つ以上選ぶと開始できます', languageMode) : trans('この学年の単元はまだ未実装です', languageMode)}
              </div>
            )}
          </div>
        );
      }
    }

    if (cat.uiType === 'english_mixed') {
      const words = cat.subModes.filter(s => s.id.startsWith('E_'));
      const convs = cat.subModes.filter(s => s.id.startsWith('C'));
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {words.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-slate-800 border border-slate-600 p-1.5 rounded hover:border-indigo-400 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-700 my-1"></div>
          <div className="grid grid-cols-3 gap-1.5">
            {convs.map(sub => (
              <button key={sub.id} onClick={() => handleSelect(sub.mode)} className="bg-pink-900/40 border border-pink-500/50 p-1 rounded hover:bg-pink-800 text-[10px] font-bold">
                {renderMasteryPrefix(sub.mode)}
                {getSubLabel(sub.id, sub.name)}
              </button>
            ))}
            <button onClick={() => handleSelect(GameMode.ENGLISH_MIXED)} className="bg-indigo-900/60 border border-indigo-500 p-1 rounded hover:bg-indigo-800 text-[10px] font-bold">
              {renderMasteryPrefix(GameMode.ENGLISH_MIXED)}
              ミックス
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col text-white overflow-hidden">
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="text-center border-b border-slate-800 p-4 shrink-0">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 tracking-widest">{trans('モード選択', languageMode)}</h2>
        </div>

        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
          <div className="lg:col-span-2 grid grid-cols-3 sm:grid-cols-5 lg:flex lg:flex-col gap-1 lg:gap-1.5 pb-1 lg:pb-0 overflow-y-auto lg:overflow-x-visible custom-scrollbar shrink-0">
            {SUBJECT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center justify-center lg:justify-start gap-2 px-2 py-1.5 sm:p-2.5 lg:p-3 rounded-lg lg:rounded-xl border-2 transition-all shrink-0 min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-0 ${selectedCategory.id === cat.id ? 'bg-yellow-900/35 border-yellow-400 text-white shadow-[0_0_10px_rgba(250,204,21,0.18)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              >
                <div className={`${selectedCategory.id === cat.id ? 'text-yellow-300' : 'text-slate-500'} scale-75 lg:scale-100 hidden lg:flex items-center justify-center h-4 lg:h-auto`}>
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="font-bold text-sm sm:text-base lg:text-sm text-center lg:text-left leading-tight w-full whitespace-normal break-words">
                  {getCategoryLabel(cat.id)}
                </span>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 flex flex-col min-h-0">
            <h3 className="text-[10px] md:text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-tight shrink-0">
              {trans('単元', languageMode)} / {trans('種目', languageMode)}
            </h3>
            <div className="bg-black/40 p-3 rounded-xl border border-slate-800 flex-grow overflow-y-auto custom-scrollbar shadow-inner min-h-[160px]">
              {renderModeSelectionPanel()}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar shrink-0">
            <div className="bg-black/40 rounded-xl border border-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">{trans('選択中', languageMode)}</div>
              <div className="text-sm font-bold text-yellow-300">{selectionPreview.label}</div>
            </div>
            {isUnitCategory && (
              <div className="bg-black/40 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">
                {trans('学年', languageMode)}: {getDisplayGradeLabel(selectedMathGrade, languageMode)}
                <br />
                {trans('選択単元数', languageMode)}: {selectedMathUnitIds.length}
              </div>
            )}
            {selectedCategory.uiType === 'grade_term' && !isUnitCategory && (
              <div className="bg-black/40 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">
                {trans('学年', languageMode)}: {getDisplayGradeLabel(selectedGrade, languageMode)}
                <br />
                {trans('学期', languageMode)}: {getDisplayTermLabel(selectedTerm, languageMode)}
              </div>
            )}
            <button
              onClick={() => {
                if (!selectionPreview.canStart || !selectionPreview.mode) return;
                handleSelect(selectionPreview.mode, selectionPreview.modePool);
              }}
              disabled={!selectionPreview.canStart}
              className={`w-full py-3 rounded-xl font-bold text-base transition-all ${selectionPreview.canStart ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_4px_0_rgb(161,98,7)] active:translate-y-1 active:shadow-none' : 'bg-slate-700 text-slate-400 opacity-60 cursor-not-allowed'}`}
            >
              {selectionPreview.canStart ? trans('この条件で開始', languageMode) : trans('単元を選択してください', languageMode)}
            </button>
            {!selectionPreview.canStart && (
              <div className="text-[10px] text-amber-300">
                {isUnitCategory
                  ? trans('単元を1つ以上選ぶと開始できます', languageMode)
                  : trans('開始条件を確認してください', languageMode)}
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

export default ModeSelectionScreen;
