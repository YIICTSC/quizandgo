import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, buildWordUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, uniqueEnglishWordItems } from './english_utils';

const greetingsTalk: EnglishWordItem[] = [
  { en: 'How are you?', jp: 'げんきですか。', speech: 'How are you' },
  { en: 'I am fine.', jp: 'げんきです。', speech: 'I am fine', speechAlternates: ["I'm fine"] },
  { en: 'Good afternoon.', jp: 'こんにちは。', speech: 'Good afternoon' },
  { en: 'See you tomorrow.', jp: 'また あした。', speech: 'See you tomorrow' },
  { en: 'Thank you very much.', jp: 'どうも ありがとう。', speech: 'Thank you very much' },
  { en: 'I am great.', jp: 'とても げんきです。', speech: 'I am great', speechAlternates: ["I'm great"] },
  { en: 'I am sleepy.', jp: 'ねむいです。', speech: 'I am sleepy', speechAlternates: ["I'm sleepy"] },
  { en: 'What is your name?', jp: 'おなまえはなんですか。', speech: 'What is your name' },
  { en: 'My name is Taro.', jp: 'わたしのなまえはたろうです。', speech: 'My name is Taro' },
];
const subjects: EnglishWordItem[] = [
  { en: 'math', jp: '算数' },
  { en: 'science', jp: '理科' },
  { en: 'music', jp: '音楽' },
  { en: 'P.E.', jp: '体育', speech: 'P E' },
  { en: 'art', jp: '図工' },
  { en: 'English', jp: '英語' },
  { en: 'Japanese', jp: '国語' },
  { en: 'social studies', jp: '社会', speech: 'social studies' },
];
const dailyLife: EnglishWordItem[] = [
  { en: 'get up', jp: 'おきる', speech: 'get up' },
  { en: 'eat breakfast', jp: '朝ごはんをたべる', speech: 'eat breakfast' },
  { en: 'go to school', jp: '学校へ行く', speech: 'go to school' },
  { en: 'study', jp: 'べんきょうする' },
  { en: 'play', jp: 'あそぶ' },
  { en: 'go to bed', jp: 'ねる', speech: 'go to bed' },
  { en: 'brush my teeth', jp: 'はをみがく', speech: 'brush my teeth' },
  { en: 'do homework', jp: 'しゅくだいをする', speech: 'do homework' },
];
const weather: EnglishWordItem[] = [
  { en: 'sunny', jp: 'はれ' },
  { en: 'cloudy', jp: 'くもり' },
  { en: 'rainy', jp: 'あめ' },
  { en: 'snowy', jp: 'ゆき' },
  { en: 'windy', jp: 'かぜがつよい' },
  { en: 'hot', jp: 'あつい' },
  { en: 'cold', jp: 'さむい' },
  { en: 'warm', jp: 'あたたかい' },
  { en: 'cool', jp: 'すずしい' },
];
const times: EnglishWordItem[] = [
  { en: 'six o\'clock', jp: '6じ', speech: 'six o clock' },
  { en: 'seven o\'clock', jp: '7じ', speech: 'seven o clock' },
  { en: 'eight o\'clock', jp: '8じ', speech: 'eight o clock' },
  { en: 'half past six', jp: '6じ半', speech: 'half past six' },
  { en: 'nine o\'clock', jp: '9じ', speech: 'nine o clock' },
  { en: 'ten o\'clock', jp: '10じ', speech: 'ten o clock' },
  { en: 'half past seven', jp: '7じ半', speech: 'half past seven' },
  { en: 'eleven o\'clock', jp: '11じ', speech: 'eleven o clock' },
  { en: 'twelve o\'clock', jp: '12じ', speech: 'twelve o clock' },
];
const stationery: EnglishWordItem[] = [
  { en: 'pencil', jp: 'えんぴつ' },
  { en: 'eraser', jp: 'けしゴム' },
  { en: 'notebook', jp: 'ノート' },
  { en: 'ruler', jp: 'じょうぎ' },
  { en: 'pen', jp: 'ペン' },
  { en: 'book', jp: '本' },
  { en: 'bag', jp: 'かばん' },
  { en: 'marker', jp: 'マーカー' },
  { en: 'crayon', jp: 'クレヨン' },
];
const places: EnglishWordItem[] = [
  { en: 'park', jp: '公園' },
  { en: 'library', jp: '図書館' },
  { en: 'station', jp: '駅' },
  { en: 'store', jp: '店' },
  { en: 'hospital', jp: '病院' },
  { en: 'school', jp: '学校' },
  { en: 'museum', jp: '博物館' },
  { en: 'zoo', jp: '動物園' },
  { en: 'fire station', jp: '消防署', speech: 'fire station' },
];
const schoolPlaces: EnglishWordItem[] = [
  { en: 'classroom', jp: '教室' },
  { en: 'music room', jp: '音楽室', speech: 'music room' },
  { en: 'library', jp: '図書室' },
  { en: 'gym', jp: '体育館' },
  { en: 'playground', jp: '校庭' },
  { en: 'nurse\'s room', jp: '保健室', speech: 'nurses room' },
  { en: 'science room', jp: '理科室', speech: 'science room' },
  { en: 'computer room', jp: 'コンピュータ室', speech: 'computer room' },
];
const foods: EnglishWordItem[] = [
  { en: 'curry and rice', jp: 'カレーライス', speech: 'curry and rice' },
  { en: 'pizza', jp: 'ピザ' },
  { en: 'sushi', jp: 'すし' },
  { en: 'hamburger', jp: 'ハンバーガー' },
  { en: 'salad', jp: 'サラダ' },
  { en: 'ice cream', jp: 'アイスクリーム', speech: 'ice cream' },
  { en: 'sandwich', jp: 'サンドイッチ' },
  { en: 'omelet rice', jp: 'オムライス', speech: 'omelet rice' },
  { en: 'spaghetti', jp: 'スパゲッティ' },
  { en: 'fried chicken', jp: 'からあげ', speech: 'fried chicken' },
];
const japaneseCulture: EnglishWordItem[] = [
  { en: 'sushi', jp: 'すし' },
  { en: 'kimono', jp: 'きもの' },
  { en: 'festival', jp: 'まつり' },
  { en: 'temple', jp: 'てら' },
  { en: 'origami', jp: 'おりがみ' },
  { en: 'tea', jp: 'お茶' },
  { en: 'shrine', jp: 'じんじゃ' },
  { en: 'rice ball', jp: 'おにぎり', speech: 'rice ball' },
];
const g4ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  ...greetingsTalk,
  ...subjects,
  ...dailyLife,
  ...weather,
  ...times,
  ...stationery,
  ...places,
  ...schoolPlaces,
  ...foods,
  ...japaneseCulture,
]);
const g4ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'How are you?', promptJp: 'げんきですか。', answerEn: 'I am great.', answerJp: 'とても げんきです。', answerSpeech: 'I am great', answerSpeechAlternates: ["I'm great"] },
  { promptEn: 'What subject do you like?', promptJp: 'どの 教科が すきですか。', answerEn: 'I like music.', answerJp: 'わたしは 音楽が すきです。', answerSpeech: 'I like music' },
  { promptEn: 'How is the weather?', promptJp: 'てんきは どうですか。', answerEn: 'It is sunny.', answerJp: 'はれです。', answerSpeech: 'It is sunny' },
  { promptEn: 'What time is it?', promptJp: 'なんじですか。', answerEn: "It is seven o'clock.", answerJp: '7じです。', answerSpeech: 'It is seven o clock' },
  { promptEn: 'What do you have?', promptJp: 'なにを もっていますか。', answerEn: 'I have a pencil.', answerJp: 'わたしは えんぴつを もっています。', answerSpeech: 'I have a pencil' },
  { promptEn: 'What food do you like?', promptJp: 'どんな 食べものが すきですか。', answerEn: 'I like sushi.', answerJp: 'わたしは すしが すきです。', answerSpeech: 'I like sushi' },
];

export const ENGLISH_G4_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G4_U01: cycleProblems(buildWordUnit(greetingsTalk, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G4_U02: cycleProblems(buildWordUnit(subjects, { enableListening: true })),
  ENGLISH_G4_U03: cycleProblems(buildWordUnit(dailyLife, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G4_U04: cycleProblems(buildWordUnit(weather, { enableListening: true })),
  ENGLISH_G4_U05: cycleProblems(buildWordUnit(times, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G4_U06: cycleProblems(buildWordUnit(stationery, { enableListening: true })),
  ENGLISH_G4_U07: cycleProblems(buildWordUnit(places, { enableListening: true })),
  ENGLISH_G4_U08: cycleProblems(buildWordUnit(schoolPlaces, { enableListening: true })),
  ENGLISH_G4_U09: cycleProblems(buildWordUnit(foods, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G4_U10: cycleProblems(buildWordUnit(japaneseCulture, { enableListening: true })),
  ENGLISH_G4_U11: buildListeningReviewUnit(g4ReviewItems, '4年生の ことばを きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G4_U12: buildSpeakingReviewUnit(g4ReviewItems, '4年生の ことばを 英語で いってみよう。'),
  ENGLISH_G4_U13: buildRepeatReviewUnit(g4ReviewItems, '4年生の ことばを きいて、英語を くりかえそう。'),
  ENGLISH_G4_U14: buildResponseReviewUnit(g4ResponseItems, '4年生の きほん会話に 英語で こたえよう。'),
};

export const ENGLISH_G4_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G4_1: Object.values(ENGLISH_G4_UNIT_DATA).flat(),
  ...ENGLISH_G4_UNIT_DATA,
};
