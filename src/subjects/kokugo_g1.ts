import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G1_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G1_U01: [], // ひらがな
  KOKUGO_G1_U02: [], // ことばあつめ
  KOKUGO_G1_U03: [], // のばすおん（ー）
  KOKUGO_G1_U04: [], // ちいさい「っ」
  KOKUGO_G1_U05: [], // は・を・へ
  KOKUGO_G1_U06: [], // かたかな
  KOKUGO_G1_U07: [], // おはなしをよむ
  KOKUGO_G1_U08: [], // せつめいぶんをよむ
  KOKUGO_G1_U09: [], // ばめんをそうぞうしてよむ
  KOKUGO_G1_U10: [], // たいせつなところをみつけてよむ
  KOKUGO_G1_U11: [], // ぶんをかく
  KOKUGO_G1_U12: [], // かんたんなにっき
  KOKUGO_G1_U13: [], // おはなしをつくる
  KOKUGO_G1_U14: [], // はなしをきく
  KOKUGO_G1_U15: [], // じぶんのことをはなす
  KOKUGO_G1_U16: [], // みんなのまえではなす
};

const hira = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ', 'きゃ', 'きゅ', 'きょ', 'しゃ', 'しゅ', 'しょ', 'ちゃ', 'ちゅ', 'ちょ', 'にゃ', 'にゅ', 'にょ', 'ひゃ', 'ひゅ', 'ひょ', 'みゃ', 'みゅ', 'みょ', 'りゃ', 'りゅ', 'りょ', 'ぎゃ', 'ぎゅ', 'ぎょ', 'じゃ', 'じゅ', 'じょ', 'びゃ', 'びゅ', 'びょ', 'ぴゃ', 'ぴゅ', 'ぴょ'];
const kata = ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ', 'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ズ', 'ゼ', 'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ', 'ポ', 'キャ', 'キュ', 'キョ', 'シャ', 'シュ', 'ショ', 'チャ', 'チュ', 'チョ', 'ニャ', 'ニュ', 'ニョ', 'ヒャ', 'ヒュ', 'ヒョ', 'ミャ', 'ミュ', 'ミョ', 'リャ', 'リュ', 'リョ', 'ギャ', 'ギュ', 'ギョ', 'ジャ', 'ジュ', 'ジョ', 'ビャ', 'ビュ', 'ビョ', 'ピャ', 'ピュ', 'ピョ'];
const words = ['いぬ', 'ねこ', 'そら', 'やま', 'かわ', 'はな', 'ほん', 'みず', 'くるま', 'でんしゃ'];
const phoneticWords = ['がっこう', 'ぎゅうにゅう', 'ぱん', 'きゃべつ', 'しゃしん', 'きゅうり', 'じゃんぐる', 'びょういん', 'ぴょんぴょん', 'ちゃいろ', 'にゃんこ', 'りゅう', 'ぎゃくてん', 'じゃがいも', 'びゃくや', 'ぴゃくにん', 'ぎゃらりー', 'じゃんけん', 'びょうぶ', 'ぴゃっと'];
const katakanaPhoneticWords = ['ガッコウ', 'ギュウニュウ', 'パン', 'キャベツ', 'シャシン', 'キュウリ', 'ジャングル', 'ビョウイン', 'ピョンピョン', 'チャイロ', 'ニャンコ', 'リュウ', 'ギャクテン', 'ジャガイモ', 'ビャクヤ', 'ピャクニン', 'ギャラリー', 'ジャンケン', 'ビョウブ', 'ピャット'];
const greetings = ['おはよう', 'こんにちは', 'さようなら', 'ありがとう'];
const wordGroups = [
  { label: 'どうぶつ', answer: 'いぬ', others: ['ねこ', 'うま', 'とり'], distractors: ['くるま', 'ほん', 'そら'] },
  { label: 'のりもの', answer: 'でんしゃ', others: ['くるま', 'ばす', 'ふね'], distractors: ['はな', 'ほん', 'ねこ'] },
  { label: 'しぜん', answer: 'やま', others: ['かわ', 'そら', 'はな'], distractors: ['ほん', 'くるま', 'いぬ'] },
];
const diaryScenes = ['こうえんで あそんだ', 'ほんを よんだ', 'ともだちと はなした', 'おてつだいを した'];
const storySubjects = ['たろう', 'はなこ', 'うさぎ', 'くま'];
const storyPlaces = ['こうえん', 'きょうしつ', 'もり', 'うんどうじょう'];
const longSound = [
  ['けーき', 'ケーキ'],
  ['すーぷ', 'スープ'],
  ['こーひー', 'コーヒー'],
  ['らーめん', 'ラーメン'],
];
const smallTsu = [
  ['きって', 'っ'],
  ['がっこう', 'っ'],
  ['きっぷ', 'っ'],
  ['さっか', 'っ'],
];
const readingStories = [
  { text: 'たろうは こうえんで ぼうるで あそびました。', subject: 'たろう', place: 'こうえん', action: 'ぼうるで あそびました' },
  { text: 'はなこは きょうしつで ほんを よみました。', subject: 'はなこ', place: 'きょうしつ', action: 'ほんを よみました' },
  { text: 'うさぎは もりで かけっこを しました。', subject: 'うさぎ', place: 'もり', action: 'かけっこを しました' },
  { text: 'くまは うんどうじょうで おにごっこを しました。', subject: 'くま', place: 'うんどうじょう', action: 'おにごっこを しました' },
  { text: 'たろうは きょうしつで えを かきました。', subject: 'たろう', place: 'きょうしつ', action: 'えを かきました' },
];
const explanatoryTexts = [
  { text: 'あさがおに みずを あげます。 つぎに ひなたに おきます。', topic: 'そだてかた', order: 'じゅんばん' },
  { text: 'てを あらいます。 そのあと たおるで ふきます。', topic: 'やりかた', order: 'じゅんばん' },
  { text: 'えんぴつを けずります。 つぎに ノートを ひらきます。', topic: 'じゅんばん', order: 'じゅんばん' },
  { text: 'くつを そろえます。 それから へやに はいります。', topic: 'やりかた', order: 'じゅんばん' },
];
const detectKanaChunk = (word: string, chunks: string[]) => chunks.find((chunk) => word.includes(chunk)) || chunks[0];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G1_U01': {
      const i = n % hira.length;
      if (n % 4 === 0) {
        return { question: `おなじ もじは どれ？「${hira[i]}」`, answer: hira[i], options: d(hira[i], hira[(i + 1) % hira.length], hira[(i + 2) % hira.length], hira[(i + 3) % hira.length]), hint: 'もじの かたちを よくみよう。' };
      }
      if (n % 4 === 1) {
        return { question: `「${hira[i]}」の つぎの もじは？`, answer: hira[(i + 1) % hira.length], options: d(hira[(i + 1) % hira.length], hira[i], hira[(i + 2) % hira.length], hira[(i + 3) % hira.length]), hint: 'ごじゅうおんの ならび。' };
      }
      if (n % 4 === 2) {
        const word = phoneticWords[n % phoneticWords.length];
        const chunks = ['っ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'だ', 'ば', 'ぱ', 'きゃ', 'きゅ', 'きょ', 'しゃ', 'しゅ', 'しょ', 'ちゃ', 'ちゅ', 'ちょ', 'にゃ', 'にゅ', 'にょ', 'ひゃ', 'ひゅ', 'ひょ', 'みゃ', 'みゅ', 'みょ', 'りゃ', 'りゅ', 'りょ', 'ぎゃ', 'ぎゅ', 'ぎょ', 'じゃ', 'じゅ', 'じょ', 'びゃ', 'びゅ', 'びょ', 'ぴゃ', 'ぴゅ', 'ぴょ'];
        const target = detectKanaChunk(word, chunks);
        return { question: `「${word}」に ある もじは どれ？`, answer: target, options: d(target, 'か', 'は', 'き'), hint: 'にごるおと・ちいさいやゆよにも ちゅうもく。', audioPrompt: { text: word, lang: 'ja-JP', autoPlay: true } };
      }
      return {
        question: 'おとを きいて、なんと いっている？',
        answer: hira[i],
        options: d(hira[i], hira[(i + 1) % hira.length], hira[(i + 2) % hira.length], hira[(i + 3) % hira.length]),
        hint: 'ボタンで もういちど きける。',
        audioPrompt: { text: hira[i], lang: 'ja-JP', autoPlay: true },
      };
    }
    case 'KOKUGO_G1_U02': {
      const w = words[n % words.length];
      const c = w.charAt(n % w.length);
      const group = wordGroups[n % wordGroups.length];
      if (n % 4 === 0) {
        return { question: `「${w}」に ある もじは どれ？`, answer: c, options: d(c, 'ま', 'ら', 'よ'), hint: 'ことばの なかの もじを さがそう。' };
      }
      if (n % 4 === 1) {
        return { question: `「${c}」から はじまる ことばは どれ？`, answer: w, options: d(w, 'たまご', 'はこ', 'ゆき'), hint: 'はじめの おとに ちゅうもく。' };
      }
      if (n % 4 === 2) {
        return { question: `「${w}」の さいごの もじは？`, answer: w.charAt(w.length - 1), options: d(w.charAt(w.length - 1), w.charAt(0), 'ん', 'さ'), hint: 'おわりの もじを みよう。' };
      }
      return {
        question: `「${group.label}」の なかまは どれ？`,
        answer: group.answer,
        options: d(group.answer, group.distractors[0], group.distractors[1], group.distractors[2]),
        hint: `たとえば ${group.others.join('・')}。`,
      };
    }
    case 'KOKUGO_G1_U03': {
      const item = longSound[n % longSound.length];
      if (n % 3 === 0) {
        return { question: `のばすおん「ー」を つかう ことばは どれ？`, answer: item[1], options: d(item[1], item[1].replace(/ー/g, ''), 'サカナ', 'クルマ'), hint: 'ながく のばして よむ おと。' };
      }
      if (n % 3 === 1) {
        return { question: `「${item[1]}」で のばすおんは どこ？`, answer: 'ー', options: d('ー', 'っ', 'ん', '、'), hint: 'ながく のばす しるし。' };
      }
      return { question: `「${item[1]}」を よむ とき、 のばす おとは どれ？`, answer: 'まえの おと', options: d('まえの おと', 'うしろの おと', 'さいごの おと', 'まんなかの おと'), hint: '「ケー」なら「ケ」の おとを のばす。' };
    }
    case 'KOKUGO_G1_U04': {
      const item = smallTsu[n % smallTsu.length][0];
      if (n % 3 === 0) {
        return { question: `「${item}」で ちいさい「っ」は なにを あらわす？`, answer: 'つまる おと', options: d('つまる おと', 'のばす おと', 'おわる おと', 'やさしい おと'), hint: 'いったん とめて よむ。' };
      }
      if (n % 3 === 1) {
        return { question: `「${item}」に ある ちいさい もじは どれ？`, answer: 'っ', options: d('っ', 'つ', 'ー', 'ん'), hint: 'ふつうの「つ」より ちいさい。' };
      }
      return { question: `ちいさい「っ」を つかう ことばは どれ？`, answer: item, options: d(item, 'かさ', 'いぬ', 'そら'), hint: 'つまる おとが ある ことば。' };
    }
    case 'KOKUGO_G1_U05': {
      const p = n % 6;
      if (p === 0) return { question: '「こうえん__ いく」 あてはまる じは？', answer: 'へ', options: d('へ', 'は', 'を', 'が'), hint: 'いく さき。' };
      if (p === 1) return { question: '「ほん__ よむ」 あてはまる じは？', answer: 'を', options: d('を', 'は', 'へ', 'に'), hint: 'なにを するか。' };
      if (p === 2) return { question: '「わたし__ げんきです」 あてはまる じは？', answer: 'は', options: d('は', 'を', 'へ', 'で'), hint: 'だれ・なにの はなし。' };
      if (p === 3) return { question: '「がっこう__ くる」 あてはまる じは？', answer: 'へ', options: d('へ', 'を', 'は', 'と'), hint: 'むかう ばしょ。' };
      if (p === 4) return { question: '「みかん__ たべる」 あてはまる じは？', answer: 'を', options: d('を', 'へ', 'は', 'の'), hint: 'なにを するか。' };
      return { question: '「ねこ__ かわいい」 あてはまる じは？', answer: 'は', options: d('は', 'を', 'へ', 'に'), hint: '話の もとになる ことば。' };
    }
    case 'KOKUGO_G1_U06': {
      const i = n % kata.length;
      if (n % 4 === 0) {
        return { question: `おなじ カタカナは どれ？「${kata[i]}」`, answer: kata[i], options: d(kata[i], kata[(i + 1) % kata.length], kata[(i + 2) % kata.length], kata[(i + 3) % kata.length]), hint: 'カタカナの かたち。' };
      }
      if (n % 4 === 1) {
        return { question: `「${kata[i]}」と おなじ おとの ひらがなは？`, answer: hira[i], options: d(hira[i], hira[(i + 1) % hira.length], hira[(i + 2) % hira.length], hira[(i + 3) % hira.length]), hint: 'おとは おなじ。' };
      }
      if (n % 4 === 2) {
        const word = katakanaPhoneticWords[n % katakanaPhoneticWords.length];
        const chunks = ['ッ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ダ', 'バ', 'パ', 'キャ', 'キュ', 'キョ', 'シャ', 'シュ', 'ショ', 'チャ', 'チュ', 'チョ', 'ニャ', 'ニュ', 'ニョ', 'ヒャ', 'ヒュ', 'ヒョ', 'ミャ', 'ミュ', 'ミョ', 'リャ', 'リュ', 'リョ', 'ギャ', 'ギュ', 'ギョ', 'ジャ', 'ジュ', 'ジョ', 'ビャ', 'ビュ', 'ビョ', 'ピャ', 'ピュ', 'ピョ'];
        const target = detectKanaChunk(word, chunks);
        return { question: `「${word}」に ある カタカナは どれ？`, answer: target, options: d(target, 'カ', 'ハ', 'キ'), hint: 'にごるおと・ちいさいヤユヨにも ちゅうもく。', audioPrompt: { text: word, lang: 'ja-JP', autoPlay: true } };
      }
      return {
        question: 'おとを きいて、どの カタカナか えらぼう。',
        answer: kata[i],
        options: d(kata[i], kata[(i + 1) % kata.length], kata[(i + 2) % kata.length], kata[(i + 3) % kata.length]),
        hint: 'ボタンで くりかえし きける。',
        audioPrompt: { text: kata[i], lang: 'ja-JP', autoPlay: true },
      };
    }
    case 'KOKUGO_G1_U07': {
      const story = readingStories[n % readingStories.length];
      const subject = story.subject;
      const place = story.place;
      const action = story.action;
      if (n % 4 === 0) {
        return { question: `「${story.text}」 したのは だれ？`, answer: subject, options: d(subject, 'いぬ', 'せんせい', 'みんな'), hint: 'しゅじんこうを みつける。' };
      }
      if (n % 4 === 1) {
        return { question: `「${story.text}」 どこで した？`, answer: place, options: d(place, 'うち', 'みち', 'そら'), hint: 'ばしょに ちゅうもく。' };
      }
      if (n % 4 === 2) {
        return { question: `「${story.text}」 どうした？`, answer: action, options: d(action, 'ねました', 'たべました', 'よみました'), hint: 'したことを さがす。', audioPrompt: { text: story.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: `ものがたりを よむ とき まず みると よいのは？`, answer: 'だれが でてくるか', options: d('だれが でてくるか', 'ねだん', 'じかんわり', 'こたえ'), hint: 'とうじょうじんぶつを つかむ。' };
    }
    case 'KOKUGO_G1_U08': {
      const item = explanatoryTexts[n % explanatoryTexts.length];
      if (n % 4 === 0) {
        return { question: `「${item.text}」のような ぶんを よむ とき、 だいじなのは？`, answer: 'じゅんばん', options: d('じゅんばん', 'おもしろさ', 'ながさ', 'ねだん'), hint: 'どうするかが じゅんに かいてある。' };
      }
      if (n % 4 === 1) {
        return { question: `「${item.text}」で たしかめると よいのは？`, answer: 'なにを するか', options: d('なにを するか', 'だれが かなしいか', 'どの えが すきか', 'どこが こわいか'), hint: 'やりかたや せつめい。', audioPrompt: { text: item.text, lang: 'ja-JP', autoPlay: true } };
      }
      if (n % 4 === 2) {
        return { question: '「まず」「つぎに」が でてきやすいのは どんな ぶん？', answer: 'せつめいぶん', options: d('せつめいぶん', 'ものがたり', 'にっき', 'しりとり'), hint: '手じゅんを しめす ことば。' };
      }
      return { question: 'せつめいぶんで よみとることが 多いのは？', answer: 'やりかた', options: d('やりかた', 'きもち', 'せりふ', 'ゆめ'), hint: 'どうするかが 書いてある。' };
    }
    case 'KOKUGO_G1_U09': {
      const place = storyPlaces[n % storyPlaces.length];
      if (n % 4 === 0) {
        return { question: `「みんなが ${place}で あそんでいます。」 ばめんは どこ？`, answer: place, options: d(place, 'うちゅう', 'うみの そこ', 'やねの うえ'), hint: 'ぶんから ようすを そうぞう。' };
      }
      if (n % 4 === 1) {
        return { question: '「しずかに ほんを よんでいます。」 あいそうな ばめんは？', answer: 'きょうしつ', options: d('きょうしつ', 'プール', 'こうさてん', 'そら'), hint: 'している ことから そうぞう。' };
      }
      if (n % 4 === 2) {
        return { question: '「ブランコで あそんでいます。」 あいそうな ばめんは？', answer: 'こうえん', options: d('こうえん', 'れいぞうこ', 'ろうか', 'えき'), hint: 'ばしょの ようす。' };
      }
      return { question: 'ばめんを そうぞうして よむ とき、 みると よいのは？', answer: 'どこで なにを しているか', options: d('どこで なにを しているか', 'もじの かず', 'さいごの 一もじ', 'かきじゅん'), hint: 'ばしょと こうどう。' };
    }
    case 'KOKUGO_G1_U10': {
      if (n % 4 === 0) {
        return { question: 'ぶんを よむ とき、 たいせつな ところを みつけるには？', answer: 'だれが どうしたかを みる', options: d('だれが どうしたかを みる', 'さいごだけ よむ', 'えだけ みる', 'こえを ださない'), hint: 'しゅごと どうさ。' };
      }
      if (n % 4 === 1) {
        return { question: 'たいせつな ところには なにが かいてあることが 多い？', answer: 'いちばん つたえたいこと', options: d('いちばん つたえたいこと', 'もじの かず', 'かきじゅん', 'ひみつの こたえ'), hint: '中心になる 内容。' };
      }
      if (n % 4 === 2) {
        return { question: 'たいせつな ところを さがす とき、 くりかえし 出る ものは？', answer: 'ことば', options: d('ことば', 'えんぴつ', 'ページ', 'こえ'), hint: '何ども 出る ことばに ちゅうもく。' };
      }
      return { question: '「たろうが みずを のみました。」で たいせつな まとまりは？', answer: 'たろうが のみました', options: d('たろうが のみました', 'みずを。', 'が みず', 'ました たろう'), hint: 'だれが どうしたか。' };
    }
    case 'KOKUGO_G1_U11': {
      const thing = words[n % words.length];
      if (n % 4 === 0) {
        return { question: `「${thing}」を つかって ただしい ぶんは どれ？`, answer: `${thing}が あります。`, options: d(`${thing}が あります。`, `${thing} あります`, `あります ${thing}`, `${thing}。が`), hint: 'ぶんの おわりに「。」' };
      }
      if (n % 4 === 1) {
        return { question: 'ぶんを かく とき、 おわりに つける ものは？', answer: '。', options: d('。', '、', 'っ', 'ー'), hint: '文の しるし。' };
      }
      if (n % 4 === 2) {
        return { question: `「${thing}」を つかった ぶんで よいものは？`, answer: `わたしは ${thing}を みました。`, options: d(`わたしは ${thing}を みました。`, `${thing} わたし`, `みました ${thing}を`, `${thing}。を みました`), hint: 'じゅんと 句点。' };
      }
      return { question: 'わかりやすい ぶんに するには？', answer: 'みじかく まとめる', options: d('みじかく まとめる', 'もじを ぬかす', '「。」を つけない', 'ことばを ならべるだけ'), hint: 'つたわる 文にする。' };
    }
    case 'KOKUGO_G1_U12': {
      const act = diaryScenes[n % diaryScenes.length];
      if (n % 4 === 0) {
        return { question: 'にっきに いれると よいのは どれ？', answer: 'いつ・どこで・なにをしたか', options: d('いつ・どこで・なにをしたか', 'むずかしい ことばだけ', 'ながい ぶんだけ', 'えだけ'), hint: `たとえば「きょう、${act}。」` };
      }
      if (n % 4 === 1) {
        return { question: 'にっきに かくと よいのは？', answer: 'おもったこと', options: d('おもったこと', 'かきじゅんだけ', '一もじだけ', 'なまえだけ'), hint: 'たのしかった・うれしかった など。' };
      }
      if (n % 4 === 2) {
        return { question: `「きょう、${act}。」の つぎに あると よいのは？`, answer: 'たのしかったです。', options: d('たのしかったです。', 'おしまい？', 'みぎ', 'あいうえお'), hint: 'きもちも かく。' };
      }
      return { question: 'にっきの はじめに かくことが 多いのは？', answer: 'きょう', options: d('きょう', 'さようなら', 'おへんじ', 'なぞなぞ'), hint: 'いつの できごとかを 書く。' };
    }
    case 'KOKUGO_G1_U13': {
      if (n % 4 === 0) {
        return { question: 'おはなしを つくる とき、 はじめに あると よいのは？', answer: 'だれが でてくるか', options: d('だれが でてくるか', 'さいごだけ', 'ひらがなだけ', 'こたえだけ'), hint: 'とうじょうじんぶつ。' };
      }
      if (n % 4 === 1) {
        return { question: 'おはなしに あると よいものは？', answer: 'どこで おきたか', options: d('どこで おきたか', 'かきじゅんだけ', 'こたえだけ', 'なまえだけ'), hint: 'ばしょも きめる。' };
      }
      if (n % 4 === 2) {
        return { question: 'おはなしの おわりに あると よいのは？', answer: 'どうなったか', options: d('どうなったか', 'だれも でない', 'もじが ない', 'えだけ'), hint: 'けっかを かく。' };
      }
      return { question: 'おはなしを つくる とき つながりが よくなるのは？', answer: 'じゅんに かく', options: d('じゅんに かく', 'おわりから かく', 'もじを とばす', '一文だけ かく'), hint: 'はじめ・なか・おわり。' };
    }
    case 'KOKUGO_G1_U14': {
      if (n % 4 === 0) {
        return { question: 'はなしを きく とき だいじなことは？', answer: 'はなすひとを みる', options: d('はなすひとを みる', 'あるきまわる', 'ほかの はなしをする', 'よこを むく'), hint: 'よく きく しせい。' };
      }
      if (n % 4 === 1) {
        return { question: 'はなしを きく とき、 しては いけないことは？', answer: 'とちゅうで さえぎる', options: d('とちゅうで さえぎる', 'うなずく', 'しずかに きく', 'あいてを みる'), hint: 'さいごまで きく。' };
      }
      if (n % 4 === 2) {
        return { question: 'きいた あとに よいのは？', answer: 'わからないことを きく', options: d('わからないことを きく', 'すぐ いなくなる', 'べつの ことを いう', 'ねる'), hint: 'たしかめると よい。' };
      }
      return { question: 'はなしを よく きくための たいどは？', answer: 'しずかに する', options: d('しずかに する', 'おおごえを だす', 'うしろを むく', 'あるきつづける'), hint: '聞くじゅんび。' };
    }
    case 'KOKUGO_G1_U15': {
      if (n % 4 === 0) {
        return { question: 'じぶんのことを はなす とき、 つたわりやすいのは？', answer: 'みじかく わかりやすく はなす', options: d('みじかく わかりやすく はなす', 'とても はやく はなす', 'ちいさな こえで はなす', 'とちゅうで やめる'), hint: 'あいてに わかる はなし方。' };
      }
      if (n % 4 === 1) {
        return { question: 'じぶんの すきなものを はなす とき よいのは？', answer: 'りゆうも いう', options: d('りゆうも いう', 'なにも いわない', '一もじだけ いう', 'ちがう ことを いう'), hint: 'なぜ すきかを つける。' };
      }
      if (n % 4 === 2) {
        return { question: 'じぶんのことを はなす とき だいじなのは？', answer: 'あいてに きこえる こえ', options: d('あいてに きこえる こえ', 'したを むく', 'はやすぎる はなし', 'ちいさすぎる こえ'), hint: 'まず きこえること。' };
      }
      return { question: 'じこしょうかいで いうこととして よいのは？', answer: 'なまえ', options: d('なまえ', 'こたえ', 'てんすうだけ', 'ひみつだけ'), hint: 'まず じぶんが だれか つたえる。' };
    }
    case 'KOKUGO_G1_U16': {
      if (n % 4 === 0) {
        return { question: 'みんなの まえで はなす とき だいじなのは？', answer: 'おおきめの こえで はなす', options: d('おおきめの こえで はなす', 'したを むいて はなす', 'とても はやく はなす', 'てを ふらない'), hint: 'みんなに きこえる こえ。' };
      }
      if (n % 4 === 1) {
        return { question: 'まえで はなす とき、 よい しせいは？', answer: 'まえを むく', options: d('まえを むく', 'しただけを みる', 'よこを むく', 'うしろを むく'), hint: '聞く人を 見る。' };
      }
      if (n % 4 === 2) {
        return { question: 'みんなに つたわりやすいのは？', answer: 'ゆっくり はなす', options: d('ゆっくり はなす', 'すごく はやく はなす', 'とちゅうで やめる', 'うつむいて はなす'), hint: 'ききとりやすい 速さ。' };
      }
      return { question: 'はっぴょうの とき よいのは？', answer: 'はじめに あいさつを する', options: d('はじめに あいさつを する', 'なにも いわずに はじめる', 'ちがう はなしを する', 'ずっと したを みる'), hint: 'はじまりを はっきり。' };
    }
    default:
      return { question: 'あ いう え お の つぎは？', answer: 'か', options: d('か', 'お', 'さ', 'た'), hint: 'ごじゅうおん。' };
  }
};

fillGeneratedUnitProblems(KOKUGO_G1_UNIT_DATA, makeUnitProblem);

export const KOKUGO_G1_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G1_1: Object.values(KOKUGO_G1_UNIT_DATA).flat(),
  ...KOKUGO_G1_UNIT_DATA,
};
