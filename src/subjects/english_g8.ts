import { GeneralProblem } from './utils';
import { buildListeningReviewUnit, buildRepeatReviewUnit, buildResponseReviewUnit, buildSpeakingReviewUnit, cycleProblems, EnglishResponseItem, EnglishWordItem, prompt, uniqueEnglishWordItems } from './english_utils';

const readingPassagesG8: GeneralProblem[] = [
  prompt(
    'つぎの文を読もう。\nYuki was doing her homework when her friend called her. After that, she finished the homework and went to the park.\n最初に 起きたことは？',
    '友だちから電話が来た',
    ['公園へ行った', '宿題を全部終えた', '夕食を作った'],
    '出来事の順序を読む。',
    { audioPrompt: { text: 'Yuki was doing her homework when her friend called her. After that, she finished the homework and went to the park.', lang: 'en-US', autoPlay: true } },
  ),
  prompt(
    'つぎの文を読もう。\nIt will be rainy tomorrow, so our class is going to visit the museum instead of the park.\nクラスは 明日どこへ行く予定ですか？',
    '博物館',
    ['公園', '図書館', '動物園'],
    '未来表現と so に注目。',
    { audioPrompt: { text: 'It will be rainy tomorrow, so our class is going to visit the museum instead of the park.', lang: 'en-US', autoPlay: true } },
  ),
  prompt(
    'つぎの文を読もう。\nThis bag is lighter than mine, but it is more expensive.\n本文の内容として 正しいものは？',
    'そのかばんは私のものより軽い',
    ['そのかばんは私のものより安い', 'そのかばんは私のものより重い', 'そのかばんは無料だ'],
    '比較表現を読む。',
  ),
  prompt(
    'つぎの文を読もう。\nThe room was cleaned by the students after the party. They were tired, but they looked happy.\n生徒たちの様子として 合うのは？',
    'つかれていたがうれしそうだった',
    ['まだパーティー中だった', '先生だけがそうじした', '悲しくて泣いていた'],
    '受動態と気持ちの表現。',
    { audioPrompt: { text: 'The room was cleaned by the students after the party. They were tired, but they looked happy.', lang: 'en-US', autoPlay: false } },
  ),
];
const g8ReviewItems: EnglishWordItem[] = uniqueEnglishWordItems([
  { en: 'I went to the park yesterday.', jp: 'わたしは きのう公園へ行きました。', speech: 'I went to the park yesterday' },
  { en: 'We were eating lunch.', jp: 'わたしたちは 昼食を食べていました。', speech: 'We were eating lunch' },
  { en: 'I will help you.', jp: 'わたしは あなたを助けます。', speech: 'I will help you', speechAlternates: ["I'll help you"] },
  { en: 'You have to wash your hands.', jp: 'あなたは 手を洗わなければなりません。', speech: 'You have to wash your hands' },
  { en: 'I want to be a teacher.', jp: 'わたしは 先生になりたいです。', speech: 'I want to be a teacher' },
  { en: 'Playing soccer is exciting.', jp: 'サッカーをすることは わくわくします。', speech: 'Playing soccer is exciting' },
  { en: 'I was hungry, so I ate lunch.', jp: 'わたしは おなかがすいたので昼食を食べました。', speech: 'I was hungry so I ate lunch' },
  { en: 'Ken is taller than Tom.', jp: 'けんは トムより背が高いです。', speech: 'Ken is taller than Tom' },
  { en: 'The window was broken.', jp: '窓は こわされました。', speech: 'The window was broken' },
  { en: 'The room was cleaned by the students.', jp: 'その部屋は 生徒たちによって そうじされました。', speech: 'The room was cleaned by the students' },
]);
const g8ResponseItems: EnglishResponseItem[] = [
  { promptEn: 'What did you do yesterday?', promptJp: 'きのう 何を しましたか。', answerEn: 'I went to the park yesterday.', answerJp: 'わたしは きのう公園へ行きました。', answerSpeech: 'I went to the park yesterday' },
  { promptEn: 'What were you doing then?', promptJp: 'そのとき 何を していましたか。', answerEn: 'We were eating lunch.', answerJp: 'わたしたちは 昼食を食べていました。', answerSpeech: 'We were eating lunch' },
  { promptEn: 'What will you do tomorrow?', promptJp: 'あした 何を しますか。', answerEn: 'I will help you.', answerJp: 'わたしは あなたを助けます。', answerSpeech: 'I will help you', answerSpeechAlternates: ["I'll help you"] },
  { promptEn: 'What do you have to do?', promptJp: '何を しなければなりませんか。', answerEn: 'I have to wash my hands.', answerJp: '手を洗わなければなりません。', answerSpeech: 'I have to wash my hands' },
  { promptEn: 'What do you want to be?', promptJp: '何に なりたいですか。', answerEn: 'I want to be a teacher.', answerJp: 'わたしは 先生になりたいです。', answerSpeech: 'I want to be a teacher' },
  { promptEn: 'Which is taller, Ken or Tom?', promptJp: 'けんとトムでは どちらが 背が高いですか。', answerEn: 'Ken is taller than Tom.', answerJp: 'けんは トムより背が高いです。', answerSpeech: 'Ken is taller than Tom' },
];

export const ENGLISH_G8_UNIT_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G8_U01: cycleProblems([
    prompt('I ___ to the park yesterday.', 'went', ['go', 'goes', 'going'], '過去形。', { audioPrompt: { text: 'I went to the park yesterday.', lang: 'en-US', autoPlay: true } }),
    prompt('She played tennis. の いみは？', '彼女は テニスをしました。', ['彼女は テニスをします。', '彼女は テニスをしています。', '彼女は テニスができます。'], '過去形の文。'),
    prompt('They ___ TV last night.', 'watched', ['watch', 'watches', 'watching'], 'last night に注目。'),
    prompt('「I visited Kyoto.」を よんでみよう。', 'I visited Kyoto.', ['I visit Kyoto.', 'I am visited Kyoto.', 'I visiting Kyoto.'], '過去の出来事。', { speechPrompt: { expected: 'I visited Kyoto', alternates: ['I visited Kyoto.'], lang: 'en-US', buttonLabel: '過去形を はなす' } }),
    prompt('He ___ his grandmother last Sunday.', 'helped', ['helps', 'help', 'helping'], '過去の文。'),
    prompt('We enjoyed the school festival yesterday. の いみは？', 'わたしたちは きのう学校祭を楽しみました。', ['わたしたちは 毎日学校祭を開きます。', 'わたしたちは 学校祭で勉強しています。', 'わたしたちは 学校祭を計画しています。'], '学校行事の語彙。'),
  ]),
  ENGLISH_G8_U02: cycleProblems([
    prompt('I ___ studying then.', 'was', ['is', 'are', 'were'], '過去進行形。', { audioPrompt: { text: 'I was studying then.', lang: 'en-US', autoPlay: true } }),
    prompt('They were playing soccer. の いみは？', '彼らは サッカーをしていました。', ['彼らは サッカーをします。', '彼らは サッカーをしました。', '彼らは サッカーができます。'], 'were + -ing。'),
    prompt('She ___ reading at seven.', 'was', ['were', 'is', 'be'], 'she に合う形。'),
    prompt('「We were eating lunch.」を いってみよう。', 'We were eating lunch.', ['We are eating lunch.', 'We eating lunch.', 'We were eat lunch.'], '過去進行形を発話。', { speechPrompt: { expected: 'We were eating lunch', alternates: ['We were eating lunch.'], lang: 'en-US', buttonLabel: '過去進行形を はなす' } }),
    prompt('At six yesterday, I ___ my homework.', 'was doing', ['did', 'am doing', 'were doing'], '過去のその時。'),
    prompt('My father was driving then. の いみは？', 'そのとき父は運転していました。', ['そのとき父は運転します。', 'そのとき父は歩いていました。', 'そのとき父は運転したいです。'], '生活語彙。'),
  ]),
  ENGLISH_G8_U03: cycleProblems([
    prompt('I ___ visit my grandmother tomorrow.', 'will', ['am', 'do', 'did'], '未来。', { audioPrompt: { text: 'I will visit my grandmother tomorrow.', lang: 'en-US', autoPlay: true } }),
    prompt('I am going to play tennis. の いみは？', 'わたしは テニスをする予定です。', ['わたしは テニスをしています。', 'わたしは テニスをしました。', 'わたしは テニスができます。'], 'be going to。'),
    prompt('She is going to ___ a book.', 'read', ['reads', 'reading', 'reads to'], '未来表現。'),
    prompt('「I will help you.」を よんでみよう。', 'I will help you.', ['I helping you.', 'I do help you.', 'I will helps you.'], 'will + 動詞。', { speechPrompt: { expected: 'I will help you', alternates: ["I'll help you", 'I will help you.'], lang: 'en-US', buttonLabel: '未来の文を はなす' } }),
    prompt('We are going to ___ soccer tomorrow.', 'play', ['plays', 'playing', 'played'], 'be going to。'),
    prompt('I will visit my cousin next week. の いみは？', 'わたしは 来週いとこをたずねます。', ['わたしは 先週いとこをたずねました。', 'わたしは 毎日いとこを見ます。', 'わたしは いとこになりたいです。'], '家族語彙。'),
  ]),
  ENGLISH_G8_U04: cycleProblems([
    prompt('You ___ do your homework.', 'must', ['can', 'will', 'are'], '義務。'),
    prompt('I have to get up early. の いみは？', 'わたしは 早く起きなければなりません。', ['わたしは 早く起きたいです。', 'わたしは 早く起きています。', 'わたしは 早く起きました。'], 'have to。'),
    prompt('May I use this pen? に 合う こたえは？', 'Yes, you may.', ['Yes, you do.', 'Yes, you are.', 'Yes, you must.'], '許可の表現。'),
    prompt('「I must study tonight.」を いってみよう。', 'I must study tonight.', ['I must studies tonight.', 'I am must study tonight.', 'I study must tonight.'], '助動詞の文。', { speechPrompt: { expected: 'I must study tonight', alternates: ['I must study tonight.'], lang: 'en-US', buttonLabel: '助動詞の文を はなす' } }),
    prompt('You ___ wash your hands before lunch.', 'have to', ['must to', 'can', 'are'], '義務の表現。'),
    prompt('We must protect the environment. の いみは？', 'わたしたちは 環境を守らなければなりません。', ['わたしたちは 環境を作れます。', 'わたしたちは 環境を見に行きます。', 'わたしたちは 環境を失いました。'], '教科書でよく出る語彙。'),
  ]),
  ENGLISH_G8_U05: cycleProblems([
    prompt('I want ___ English.', 'to study', ['study', 'studies', 'studying'], '不定詞。', { audioPrompt: { text: 'I want to study English.', lang: 'en-US', autoPlay: true } }),
    prompt('He went to the store to buy milk. の いみは？', '彼は 牛乳を買うために 店へ行きました。', ['彼は 牛乳を買って 店へ行きました。', '彼は 店で 牛乳を飲みました。', '彼は 店へ行きたいです。'], 'to + 動詞。'),
    prompt('It is easy ___ this book.', 'to read', ['read', 'reading', 'reads'], 'it is ... to。'),
    prompt('「I want to be a teacher.」を いってみよう。', 'I want to be a teacher.', ['I want be a teacher.', 'I wanting to be a teacher.', 'I want to am a teacher.'], '不定詞を発話。', { speechPrompt: { expected: 'I want to be a teacher', alternates: ['I want to be a teacher.'], lang: 'en-US', buttonLabel: '不定詞の文を はなす' } }),
    prompt('She went to the library to ___ books.', 'read', ['reads', 'reading', 'reads to'], '目的を表す不定詞。'),
    prompt('I need some time to finish the report. の いみは？', 'わたしは レポートを終えるための時間が必要です。', ['わたしは レポートを読むのが好きです。', 'わたしは レポートをすでに終えました。', 'わたしは レポートを書きません。'], 'school/work 系語彙。'),
  ]),
  ENGLISH_G8_U06: cycleProblems([
    prompt('I enjoy ___ music.', 'listening to', ['listen', 'to listen', 'listens'], '動名詞。', { audioPrompt: { text: 'I enjoy listening to music.', lang: 'en-US', autoPlay: true } }),
    prompt('Swimming is fun. の いみは？', '泳ぐことは 楽しい。', ['泳いでいます。', '泳げます。', '泳ぎました。'], '動名詞が主語。'),
    prompt('She likes ___ books.', 'reading', ['read', 'to read', 'reads'], 'like + 動名詞。'),
    prompt('「Playing soccer is exciting.」を いってみよう。', 'Playing soccer is exciting.', ['Play soccer is exciting.', 'Playing soccer exciting.', 'Playing soccer are exciting.'], '動名詞を発話。', { speechPrompt: { expected: 'Playing soccer is exciting', alternates: ['Playing soccer is exciting.'], lang: 'en-US', buttonLabel: '動名詞の文を はなす' } }),
    prompt('I like ___ with my friends.', 'talking', ['talk', 'to talk', 'talks'], '動名詞。'),
    prompt('Cooking dinner is fun. の いみは？', '夕食を作ることは楽しい。', ['夕食はもうできています。', '夕食を食べるつもりです。', '夕食を作れません。'], '生活語彙。'),
  ]),
  ENGLISH_G8_U07: cycleProblems([
    prompt('I was tired, ___ I went to bed early.', 'so', ['and', 'but', 'because'], '接続詞。'),
    prompt('Because it was rainy, we stayed home. の いみは？', '雨だったので、わたしたちは 家にいました。', ['雨だったけれど、出かけました。', '雨なので、学校へ行きました。', '雨だったので、走りました。'], 'because。'),
    prompt('I like dogs, ___ my sister likes cats.', 'but', ['so', 'because', 'if'], '対比。'),
    prompt('「I was hungry, so I ate lunch.」を いってみよう。', 'I was hungry, so I ate lunch.', ['I was hungry, but I ate lunch.', 'I hungry so ate lunch.', 'I was hungry, so I eat lunch.'], '接続詞を発話。', { speechPrompt: { expected: 'I was hungry so I ate lunch', alternates: ['I was hungry, so I ate lunch', 'I was hungry so I ate lunch.'], lang: 'en-US', buttonLabel: '接続詞の文を はなす' } }),
    prompt('I stayed home ___ it was snowy.', 'because', ['but', 'so', 'and'], '理由を表す。'),
    prompt('We were tired, but we finished the game. の いみは？', 'わたしたちは つかれていたが 試合を終えた。', ['わたしたちは つかれたので寝た。', 'わたしたちは 試合を始めた。', 'わたしたちは 試合を見ていた。'], '部活動語彙。'),
  ]),
  ENGLISH_G8_U08: cycleProblems([
    prompt('Ken is ___ than Tom.', 'taller', ['tall', 'tallest', 'more tall'], '比較級。', { audioPrompt: { text: 'Ken is taller than Tom.', lang: 'en-US', autoPlay: true } }),
    prompt('This is the most interesting book. の いみは？', 'これは いちばん おもしろい本です。', ['これは おもしろい本です。', 'これは もっとも新しい本です。', 'これは 本よりおもしろいです。'], '最上級。'),
    prompt('Mt. Fuji is the ___ mountain in Japan.', 'highest', ['higher', 'high', 'most high'], '最上級。'),
    prompt('「My bag is bigger than yours.」を いってみよう。', 'My bag is bigger than yours.', ['My bag is biggest than yours.', 'My bag bigger yours.', 'My bag is big than yours.'], '比較級を発話。', { speechPrompt: { expected: 'My bag is bigger than yours', alternates: ['My bag is bigger than yours.'], lang: 'en-US', buttonLabel: '比較文を はなす' } }),
    prompt('This river is the ___ in the city.', 'longest', ['longer', 'long', 'most long'], '最上級。'),
    prompt('This smartphone is more useful than that one. の いみは？', 'このスマートフォンは あれより便利です。', ['このスマートフォンは あれより小さいです。', 'このスマートフォンは あれと同じです。', 'このスマートフォンは 古いです。'], '現代的な語彙。'),
  ]),
  ENGLISH_G8_U09: cycleProblems([
    prompt('This book ___ by my father.', 'was written', ['wrote', 'is writing', 'was write'], '受動態。', { audioPrompt: { text: 'This book was written by my father.', lang: 'en-US', autoPlay: true } }),
    prompt('English is spoken in many countries. の いみは？', '英語は 多くの国で 話されています。', ['英語は 多くの国で 話します。', '英語は 多くの国で 話されました。', '英語は 多くの国で 話せます。'], 'be + 過去分詞。'),
    prompt('The room ___ cleaned every day.', 'is', ['are', 'was', 'be'], '受動態の be動詞。'),
    prompt('「The window was broken.」を いってみよう。', 'The window was broken.', ['The window broke.', 'The window was break.', 'The window is broken yesterday.'], '受動態を発話。', { speechPrompt: { expected: 'The window was broken', alternates: ['The window was broken.'], lang: 'en-US', buttonLabel: '受動態を はなす' } }),
    prompt('These cookies ___ by my sister.', 'were made', ['made', 'was made', 'were make'], '受動態の複数。'),
    prompt('The song was loved by many students. の いみは？', 'その歌は 多くの生徒に愛されていた。', ['その歌は 多くの生徒が作った。', 'その歌は 多くの生徒が歌っただけだ。', 'その歌は 生徒を愛していた。'], '学校・文化語彙。'),
  ]),
  ENGLISH_G8_U10: buildListeningReviewUnit(g8ReviewItems, '中2の 重要表現を きいて、あてはまる 英語を えらぼう。'),
  ENGLISH_G8_U11: buildSpeakingReviewUnit(g8ReviewItems, '中2の 重要表現を 英語で いってみよう。'),
  ENGLISH_G8_U12: buildRepeatReviewUnit(g8ReviewItems, '中2の 重要表現を きいて、英語を くりかえそう。'),
  ENGLISH_G8_U13: buildResponseReviewUnit(g8ResponseItems, '中2の 会話に 英語で こたえよう。'),
};

export const ENGLISH_G8_DATA: Record<string, GeneralProblem[]> = {
  ENGLISH_G8_1: [...Object.values(ENGLISH_G8_UNIT_DATA).flat(), ...readingPassagesG8],
  ...ENGLISH_G8_UNIT_DATA,
};
