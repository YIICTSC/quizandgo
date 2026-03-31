import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, buildWordUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, uniqueEnglishWordItems } from './english_utils';

const selfIntro: EnglishWordItem[] = [
  { en: 'I am in sixth grade.', jp: 'わたしは 6年生です。', speech: 'I am in sixth grade' },
  { en: 'I live in Osaka.', jp: 'わたしは 大阪に 住んでいます。', speech: 'I live in Osaka' },
  { en: 'My hobby is reading.', jp: 'わたしの しゅみは 読書です。', speech: 'My hobby is reading' },
  { en: 'I like basketball.', jp: 'わたしは バスケットボールが好きです。', speech: 'I like basketball' },
  { en: 'I am eleven years old.', jp: 'わたしは 11さいです。', speech: 'I am eleven years old', speechAlternates: ["I'm eleven years old"] },
  { en: 'I am good at science.', jp: 'わたしは 理科が得意です。', speech: 'I am good at science', speechAlternates: ["I'm good at science"] },
  { en: 'I am good at English.', jp: 'わたしは 英語が得意です。', speech: 'I am good at English', speechAlternates: ["I'm good at English"] },
  { en: 'My favorite season is winter.', jp: 'わたしの好きな季節は冬です。', speech: 'My favorite season is winter' },
];
const dreams: EnglishWordItem[] = [
  { en: 'I want to be a doctor.', jp: 'わたしは 医者になりたいです。', speech: 'I want to be a doctor' },
  { en: 'I want to be a teacher.', jp: 'わたしは 先生になりたいです。', speech: 'I want to be a teacher' },
  { en: 'I want to be a soccer player.', jp: 'わたしは サッカー選手になりたいです。', speech: 'I want to be a soccer player' },
  { en: 'I want to be a chef.', jp: 'わたしは 料理人になりたいです。', speech: 'I want to be a chef' },
  { en: 'I want to help people.', jp: 'わたしは 人を助けたいです。', speech: 'I want to help people' },
  { en: 'I want to be a scientist.', jp: 'わたしは 科学者になりたいです。', speech: 'I want to be a scientist' },
  { en: 'I want to be a singer.', jp: 'わたしは 歌手になりたいです。', speech: 'I want to be a singer' },
  { en: 'I want to be an artist.', jp: 'わたしは 芸術家になりたいです。', speech: 'I want to be an artist' },
];
const dailyLife: EnglishWordItem[] = [
  { en: 'I wash my face.', jp: 'わたしは 顔をあらいます。', speech: 'I wash my face' },
  { en: 'I do my homework.', jp: 'わたしは 宿題をします。', speech: 'I do my homework' },
  { en: 'I help my mother.', jp: 'わたしは 母を手伝います。', speech: 'I help my mother' },
  { en: 'I watch TV.', jp: 'わたしは テレビを見ます。', speech: 'I watch TV' },
  { en: 'I practice every day.', jp: 'わたしは 毎日れんしゅうします。', speech: 'I practice every day' },
  { en: 'I walk to school.', jp: 'わたしは 歩いて学校へ行きます。', speech: 'I walk to school' },
  { en: 'I read books after dinner.', jp: 'わたしは 夕食の後に本を読みます。', speech: 'I read books after dinner' },
  { en: 'I take a bath at night.', jp: 'わたしは 夜におふろに入ります。', speech: 'I take a bath at night' },
];
const japaneseCulture: EnglishWordItem[] = [
  { en: 'We eat sushi in Japan.', jp: '日本では すしを食べます。', speech: 'We eat sushi in Japan' },
  { en: 'Kimono is traditional.', jp: 'きものは 伝統的です。', speech: 'Kimono is traditional' },
  { en: 'We enjoy festivals.', jp: 'わたしたちは 祭りを楽しみます。', speech: 'We enjoy festivals' },
  { en: 'Origami is popular.', jp: 'おりがみは 人気です。', speech: 'Origami is popular' },
  { en: 'Tea is important in Japan.', jp: '日本では お茶が大切です。', speech: 'Tea is important in Japan' },
  { en: 'We visit shrines on New Year\'s Day.', jp: 'わたしたちは 元日に 神社へ行きます。', speech: 'We visit shrines on New Years Day' },
  { en: 'Cherry blossoms are beautiful in spring.', jp: '春のさくらは うつくしいです。', speech: 'Cherry blossoms are beautiful in spring' },
];
const countries: EnglishWordItem[] = [
  { en: 'I want to go to Canada.', jp: 'わたしは カナダへ行きたいです。', speech: 'I want to go to Canada' },
  { en: 'I want to go to Australia.', jp: 'わたしは オーストラリアへ行きたいです。', speech: 'I want to go to Australia' },
  { en: 'I want to go to the U.S.', jp: 'わたしは アメリカへ行きたいです。', speech: 'I want to go to the U S' },
  { en: 'I want to go to Korea.', jp: 'わたしは 韓国へ行きたいです。', speech: 'I want to go to Korea' },
  { en: 'I want to go to France.', jp: 'わたしは フランスへ行きたいです。', speech: 'I want to go to France' },
  { en: 'I want to go to Singapore.', jp: 'わたしは シンガポールへ行きたいです。', speech: 'I want to go to Singapore' },
  { en: 'I want to go to China.', jp: 'わたしは 中国へ行きたいです。', speech: 'I want to go to China' },
  { en: 'I want to go to Italy.', jp: 'わたしは イタリアへ行きたいです。', speech: 'I want to go to Italy' },
  { en: 'I want to go to Spain.', jp: 'わたしは スペインへ行きたいです。', speech: 'I want to go to Spain' },
];
const memories: EnglishWordItem[] = [
  { en: 'I visited Kyoto.', jp: 'わたしは 京都を おとずれました。', speech: 'I visited Kyoto' },
  { en: 'I enjoyed the trip.', jp: 'わたしは 旅行を楽しみました。', speech: 'I enjoyed the trip' },
  { en: 'I saw beautiful leaves.', jp: 'わたしは きれいな葉を見ました。', speech: 'I saw beautiful leaves' },
  { en: 'I played with my friends.', jp: 'わたしは 友だちと遊びました。', speech: 'I played with my friends' },
  { en: 'It was a great day.', jp: 'それは すばらしい日でした。', speech: 'It was a great day' },
  { en: 'I took many pictures.', jp: 'わたしは たくさん写真をとりました。', speech: 'I took many pictures' },
  { en: 'We stayed at a hotel.', jp: 'わたしたちは ホテルに とまりました。', speech: 'We stayed at a hotel' },
  { en: 'I bought a souvenir.', jp: 'わたしは おみやげを買いました。', speech: 'I bought a souvenir' },
];
const pastEvents: EnglishWordItem[] = [
  { en: 'played', jp: '遊んだ' },
  { en: 'watched', jp: '見た' },
  { en: 'visited', jp: 'おとずれた' },
  { en: 'studied', jp: '勉強した' },
  { en: 'helped', jp: '手伝った' },
  { en: 'cooked', jp: '料理した' },
  { en: 'went', jp: '行った' },
  { en: 'saw', jp: '見た' },
  { en: 'ate', jp: '食べた' },
  { en: 'made', jp: '作った' },
];
const favorites: EnglishWordItem[] = [
  { en: 'My favorite sport is baseball.', jp: 'わたしの好きなスポーツは 野球です。', speech: 'My favorite sport is baseball' },
  { en: 'My favorite food is ramen.', jp: 'わたしの好きな食べ物は ラーメンです。', speech: 'My favorite food is ramen' },
  { en: 'My favorite season is spring.', jp: 'わたしの好きな季節は 春です。', speech: 'My favorite season is spring' },
  { en: 'My favorite subject is science.', jp: 'わたしの好きな教科は 理科です。', speech: 'My favorite subject is science' },
  { en: 'My favorite animal is panda.', jp: 'わたしの好きな動物は パンダです。', speech: 'My favorite animal is panda' },
  { en: 'My favorite place is the library.', jp: 'わたしの好きな場所は 図書館です。', speech: 'My favorite place is the library' },
  { en: 'My favorite food is curry and rice.', jp: 'わたしの好きな食べ物は カレーライスです。', speech: 'My favorite food is curry and rice' },
];
const worldCulture: EnglishWordItem[] = [
  { en: 'pizza', jp: 'ピザ' },
  { en: 'taco', jp: 'タコス' },
  { en: 'castle', jp: '城' },
  { en: 'dance', jp: 'おどり' },
  { en: 'museum', jp: 'はくぶつかん' },
  { en: 'language', jp: '言語' },
  { en: 'soccer', jp: 'サッカー' },
  { en: 'opera', jp: 'オペラ' },
  { en: 'desert', jp: 'さばく' },
  { en: 'flag', jp: '旗' },
];
const futurePlans: EnglishWordItem[] = [
  { en: 'I will study English hard.', jp: 'わたしは 英語をしっかり勉強します。', speech: 'I will study English hard' },
  { en: 'I will travel abroad.', jp: 'わたしは 海外旅行をします。', speech: 'I will travel abroad' },
  { en: 'I will help my family.', jp: 'わたしは 家族を手伝います。', speech: 'I will help my family' },
  { en: 'I will make new friends.', jp: 'わたしは 新しい友だちを作ります。', speech: 'I will make new friends' },
  { en: 'I will do my best.', jp: 'わたしは せいいっぱいがんばります。', speech: 'I will do my best' },
  { en: 'I will practice every day.', jp: 'わたしは 毎日れんしゅうします。', speech: 'I will practice every day' },
  { en: 'I will read more books.', jp: 'わたしは もっと本を読みます。', speech: 'I will read more books' },
  { en: 'I will try new things.', jp: 'わたしは 新しいことにちょうせんします。', speech: 'I will try new things' },
];
const g6ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  ...selfIntro,
  ...dreams,
  ...dailyLife,
  ...japaneseCulture,
  ...countries,
  ...memories,
  ...pastEvents,
  ...favorites,
  ...worldCulture,
  ...futurePlans,
]);
const g6ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'What do you want to be?', promptJp: 'しょうらい 何に なりたいですか。', answerEn: 'I want to be a doctor.', answerJp: 'わたしは 医者に なりたいです。', answerSpeech: 'I want to be a doctor' },
  { promptEn: 'What do you do every day?', promptJp: '毎日 何を しますか。', answerEn: 'I practice every day.', answerJp: 'わたしは 毎日れんしゅうします。', answerSpeech: 'I practice every day' },
  { promptEn: 'Where do you want to go?', promptJp: 'どこへ 行きたいですか。', answerEn: 'I want to go to Canada.', answerJp: 'わたしは カナダへ 行きたいです。', answerSpeech: 'I want to go to Canada' },
  { promptEn: 'What did you do last Sunday?', promptJp: 'この前の日よう日に 何を しましたか。', answerEn: 'I visited Kyoto.', answerJp: 'わたしは 京都を おとずれました。', answerSpeech: 'I visited Kyoto' },
  { promptEn: 'What is your favorite sport?', promptJp: 'すきな スポーツは 何ですか。', answerEn: 'My favorite sport is baseball.', answerJp: 'わたしの 好きなスポーツは 野球です。', answerSpeech: 'My favorite sport is baseball' },
  { promptEn: 'What will you do next year?', promptJp: '来年 何を しますか。', answerEn: 'I will study English hard.', answerJp: 'わたしは 英語を しっかり勉強します。', answerSpeech: 'I will study English hard' },
];

export const ENGLISH_G6_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G6_U01: cycleProblems(buildWordUnit(selfIntro, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U02: cycleProblems(buildWordUnit(dreams, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U03: cycleProblems(buildWordUnit(dailyLife, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U04: cycleProblems(buildWordUnit(japaneseCulture, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U05: cycleProblems(buildWordUnit(countries, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U06: cycleProblems(buildWordUnit(memories, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U07: cycleProblems(buildWordUnit(pastEvents, { enableListening: true })),
  ENGLISH_G6_U08: cycleProblems(buildWordUnit(favorites, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U09: cycleProblems(buildWordUnit(worldCulture, { enableListening: true })),
  ENGLISH_G6_U10: cycleProblems(buildWordUnit(futurePlans, { enableListening: true, enableSpeaking: true })),
  ENGLISH_G6_U11: buildListeningReviewUnit(g6ReviewItems, '6年生の ことばを きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G6_U12: buildSpeakingReviewUnit(g6ReviewItems, '6年生の ことばを 英語で いってみよう。'),
  ENGLISH_G6_U13: buildRepeatReviewUnit(g6ReviewItems, '6年生の ことばを きいて、英語を くりかえそう。'),
  ENGLISH_G6_U14: buildResponseReviewUnit(g6ResponseItems, '6年生の 会話に 英語で こたえよう。'),
};

export const ENGLISH_G6_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G6_1: Object.values(ENGLISH_G6_UNIT_DATA).flat(),
  ...ENGLISH_G6_UNIT_DATA,
};
