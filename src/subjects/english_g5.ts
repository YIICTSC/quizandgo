import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, buildWordUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, uniqueEnglishWordItems } from './english_utils';

const alphabet: EnglishWordItem[] = [
  { en: 'A', jp: 'エー', speech: 'A' },
  { en: 'B', jp: 'ビー', speech: 'B' },
  { en: 'C', jp: 'シー', speech: 'C' },
  { en: 'D', jp: 'ディー', speech: 'D' },
  { en: 'E', jp: 'イー', speech: 'E' },
  { en: 'F', jp: 'エフ', speech: 'F' },
  { en: 'G', jp: 'ジー', speech: 'G' },
  { en: 'H', jp: 'エイチ', speech: 'H' },
  { en: 'I', jp: 'アイ', speech: 'I' },
  { en: 'J', jp: 'ジェー', speech: 'J' },
  { en: 'K', jp: 'ケー', speech: 'K' },
  { en: 'L', jp: 'エル', speech: 'L' },
  { en: 'M', jp: 'エム', speech: 'M' },
  { en: 'N', jp: 'エヌ', speech: 'N' },
  { en: 'O', jp: 'オー', speech: 'O' },
  { en: 'P', jp: 'ピー', speech: 'P' },
  { en: 'Q', jp: 'キュー', speech: 'Q' },
  { en: 'R', jp: 'アール', speech: 'R' },
  { en: 'S', jp: 'エス', speech: 'S' },
  { en: 'T', jp: 'ティー', speech: 'T' },
  { en: 'U', jp: 'ユー', speech: 'U' },
  { en: 'V', jp: 'ブイ', speech: 'V' },
  { en: 'W', jp: 'ダブリュー', speech: 'W' },
  { en: 'X', jp: 'エックス', speech: 'X' },
  { en: 'Y', jp: 'ワイ', speech: 'Y' },
  { en: 'Z', jp: 'ズィー', speech: 'Z' },
];
const selfIntro: EnglishWordItem[] = [
  { en: 'I am ten years old.', jp: 'わたしは 10さいです。', speech: 'I am ten years old', speechAlternates: ["I'm ten years old"] },
  { en: 'My name is Yui.', jp: 'わたしの なまえは ユイです。', speech: 'My name is Yui', speechAlternates: ["I'm Yui"] },
  { en: 'I am from Japan.', jp: 'わたしは 日本の出身です。', speech: 'I am from Japan', speechAlternates: ["I'm from Japan"] },
  { en: 'I like music.', jp: 'わたしは 音楽が好きです。', speech: 'I like music' },
  { en: 'I play soccer.', jp: 'わたしは サッカーをします。', speech: 'I play soccer' },
  { en: 'I live in Yokohama.', jp: 'わたしは 横浜に住んでいます。', speech: 'I live in Yokohama' },
];
const family: EnglishWordItem[] = [
  { en: 'This is my father.', jp: 'こちらは わたしの父です。', speech: 'This is my father' },
  { en: 'This is my mother.', jp: 'こちらは わたしの母です。', speech: 'This is my mother' },
  { en: 'I have one brother.', jp: 'わたしには 兄弟が一人います。', speech: 'I have one brother' },
  { en: 'She is my sister.', jp: '彼女は わたしの姉妹です。', speech: 'She is my sister' },
  { en: 'My family is happy.', jp: 'わたしの家族は しあわせです。', speech: 'My family is happy' },
  { en: 'I love my family.', jp: 'わたしは 家族が大好きです。', speech: 'I love my family' },
];
const birthdays: EnglishWordItem[] = [
  { en: 'January', jp: '1月' },
  { en: 'February', jp: '2月' },
  { en: 'March', jp: '3月' },
  { en: 'April', jp: '4月' },
  { en: 'May', jp: '5月' },
  { en: 'June', jp: '6月' },
  { en: 'July', jp: '7月' },
  { en: 'August', jp: '8月' },
  { en: 'September', jp: '9月' },
  { en: 'October', jp: '10月' },
  { en: 'November', jp: '11月' },
  { en: 'December', jp: '12月' },
];
const favorites: EnglishWordItem[] = [
  { en: 'I like cats.', jp: 'わたしは ねこが好きです。', speech: 'I like cats' },
  { en: 'I like curry.', jp: 'わたしは カレーが好きです。', speech: 'I like curry' },
  { en: 'I like blue.', jp: 'わたしは 青が好きです。', speech: 'I like blue' },
  { en: 'I like tennis.', jp: 'わたしは テニスが好きです。', speech: 'I like tennis' },
  { en: 'I like English.', jp: 'わたしは 英語が好きです。', speech: 'I like English' },
  { en: 'I like dogs.', jp: 'わたしは いぬが好きです。', speech: 'I like dogs' },
  { en: 'I like math.', jp: 'わたしは 算数が好きです。', speech: 'I like math' },
  { en: 'I like strawberries.', jp: 'わたしは いちごが好きです。', speech: 'I like strawberries' },
];
const schoolLife: EnglishWordItem[] = [
  { en: 'clean the classroom', jp: '教室をそうじする', speech: 'clean the classroom' },
  { en: 'read books', jp: '本を読む', speech: 'read books' },
  { en: 'eat lunch', jp: '給食を食べる', speech: 'eat lunch' },
  { en: 'study science', jp: '理科を学ぶ', speech: 'study science' },
  { en: 'play in the park', jp: '校庭で遊ぶ', speech: 'play in the park' },
  { en: 'use a computer', jp: 'コンピュータを使う', speech: 'use a computer' },
  { en: 'talk with friends', jp: '友だちと話す', speech: 'talk with friends' },
  { en: 'write in a notebook', jp: 'ノートに書く', speech: 'write in a notebook' },
  { en: 'listen to the teacher', jp: '先生の話を聞く', speech: 'listen to the teacher' },
];
const weekdays: EnglishWordItem[] = [
  { en: 'Monday', jp: '月曜日' },
  { en: 'Tuesday', jp: '火曜日' },
  { en: 'Wednesday', jp: '水曜日' },
  { en: 'Thursday', jp: '木曜日' },
  { en: 'Friday', jp: '金曜日' },
  { en: 'Saturday', jp: '土曜日' },
  { en: 'Sunday', jp: '日曜日' },
];
const times: EnglishWordItem[] = [
  { en: 'It is six o\'clock.', jp: '6時です。', speech: 'It is six o clock' },
  { en: 'It is seven thirty.', jp: '7時30分です。', speech: 'It is seven thirty' },
  { en: 'It is eight o\'clock.', jp: '8時です。', speech: 'It is eight o clock' },
  { en: 'It is nine fifteen.', jp: '9時15分です。', speech: 'It is nine fifteen' },
  { en: 'It is ten thirty.', jp: '10時30分です。', speech: 'It is ten thirty' },
  { en: 'It is eleven forty-five.', jp: '11時45分です。', speech: 'It is eleven forty five' },
  { en: 'It is twelve o\'clock.', jp: '12時です。', speech: 'It is twelve o clock' },
];
const canDo: EnglishWordItem[] = [
  { en: 'I can swim.', jp: 'わたしは 泳げます。', speech: 'I can swim' },
  { en: 'I can cook.', jp: 'わたしは 料理できます。', speech: 'I can cook' },
  { en: 'I can run fast.', jp: 'わたしは はやく走れます。', speech: 'I can run fast' },
  { en: 'I can play the piano.', jp: 'わたしは ピアノがひけます。', speech: 'I can play the piano' },
  { en: 'I can speak English.', jp: 'わたしは 英語を話せます。', speech: 'I can speak English' },
  { en: 'I can ride a bike.', jp: 'わたしは 自転車に乗れます。', speech: 'I can ride a bike' },
  { en: 'I can dance well.', jp: 'わたしは 上手におどれます。', speech: 'I can dance well' },
  { en: 'I can jump high.', jp: 'わたしは 高くジャンプできます。', speech: 'I can jump high' },
];
const places: EnglishWordItem[] = [
  { en: 'I want to go to Kyoto.', jp: 'わたしは 京都へ行きたいです。', speech: 'I want to go to Kyoto' },
  { en: 'I want to go to the zoo.', jp: 'わたしは 動物園へ行きたいです。', speech: 'I want to go to the zoo' },
  { en: 'I want to go to the beach.', jp: 'わたしは 海へ行きたいです。', speech: 'I want to go to the beach' },
  { en: 'I want to go to the park.', jp: 'わたしは 公園へ行きたいです。', speech: 'I want to go to the park' },
  { en: 'I want to go to Hokkaido.', jp: 'わたしは 北海道へ行きたいです。', speech: 'I want to go to Hokkaido' },
  { en: 'I want to go to the museum.', jp: 'わたしは 博物館へ行きたいです。', speech: 'I want to go to the museum' },
  { en: 'I want to go to Okinawa.', jp: 'わたしは 沖縄へ行きたいです。', speech: 'I want to go to Okinawa' },
  { en: 'I want to go to the aquarium.', jp: 'わたしは 水族館へ行きたいです。', speech: 'I want to go to the aquarium' },
];
const g5ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  ...alphabet,
  ...selfIntro,
  ...family,
  ...birthdays,
  ...favorites,
  ...schoolLife,
  ...weekdays,
  ...times,
  ...canDo,
  ...places,
]);
const g5ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'What is your name?', promptJp: 'おなまえは なんですか。', answerEn: 'My name is Yui.', answerJp: 'わたしの なまえは ユイです。', answerSpeech: 'My name is Yui' },
  { promptEn: 'When is your birthday?', promptJp: 'たん生日は いつですか。', answerEn: 'It is in May.', answerJp: '5月です。', answerSpeech: 'It is in May' },
  { promptEn: 'What day is it today?', promptJp: 'きょうは なんよう日ですか。', answerEn: 'It is Monday.', answerJp: '月よう日です。', answerSpeech: 'It is Monday' },
  { promptEn: 'What can you do?', promptJp: 'なにが できますか。', answerEn: 'I can swim.', answerJp: 'わたしは およげます。', answerSpeech: 'I can swim' },
  { promptEn: 'Where do you want to go?', promptJp: 'どこへ 行きたいですか。', answerEn: 'I want to go to Kyoto.', answerJp: 'わたしは 京都へ 行きたいです。', answerSpeech: 'I want to go to Kyoto' },
  { promptEn: 'What do you like?', promptJp: 'なにが すきですか。', answerEn: 'I like cats.', answerJp: 'わたしは ねこが 好きです。', answerSpeech: 'I like cats' },
];

export const ENGLISH_G5_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G5_U01: cycleProblems(buildWordUnit(alphabet, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U02: cycleProblems(buildWordUnit(selfIntro, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U03: cycleProblems(buildWordUnit(family, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U04: cycleProblems(buildWordUnit(birthdays, { enableListening: true })),
  ENGLISH_G5_U05: cycleProblems(buildWordUnit(favorites, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U06: cycleProblems(buildWordUnit(schoolLife, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U07: cycleProblems(buildWordUnit(weekdays, { enableListening: true })),
  ENGLISH_G5_U08: cycleProblems(buildWordUnit(times, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U09: cycleProblems(buildWordUnit(canDo, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U10: cycleProblems(buildWordUnit(places, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G5_U11: buildListeningReviewUnit(g5ReviewItems, '5年生の ことばを きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G5_U12: buildSpeakingReviewUnit(g5ReviewItems, '5年生の ことばを 英語で いってみよう。'),
  ENGLISH_G5_U13: buildRepeatReviewUnit(g5ReviewItems, '5年生の ことばを きいて、英語を くりかえそう。'),
  ENGLISH_G5_U14: buildResponseReviewUnit(g5ResponseItems, '5年生の きほん会話に 英語で こたえよう。'),
};

export const ENGLISH_G5_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G5_1: Object.values(ENGLISH_G5_UNIT_DATA).flat(),
  ...ENGLISH_G5_UNIT_DATA,
};
