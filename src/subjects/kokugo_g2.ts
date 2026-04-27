import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G2_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G2_U01: [], // かたかなのことば
  KOKUGO_G2_U02: [], // 主語 と 述語
  KOKUGO_G2_U03: [], // 文のきまり
  KOKUGO_G2_U04: [], // 日記を書く
  KOKUGO_G2_U05: [], // せつめい文を読む
  KOKUGO_G2_U06: [], // 物語を読む
  KOKUGO_G2_U07: [], // 大事なことを見つける
  KOKUGO_G2_U08: [], // 手紙を書く
  KOKUGO_G2_U09: [], // 作文を書く
  KOKUGO_G2_U10: [], // 話を聞く
  KOKUGO_G2_U11: [], // 順序よく話す
};

const katakanaWords = ['パン', 'ノート', 'ボール', 'テレビ', 'ジュース', 'バス', 'ペン', 'ソファ', 'ゲーム', 'ジャム', 'ギョーザ', 'ピアノ', 'チョコ', 'キャンプ', 'シャツ', 'ニュース', 'ギャラリー', 'ジャケット', 'ビャクヤ', 'ピューマ', 'ギョウザ', 'ジュラルミン'];
const subjects = ['わたし', 'ねこ', 'たろう', 'せんせい', 'でんしゃ'];
const predicates = ['はしる', 'わらう', 'よむ', 'たべる', 'きた'];
const diaryActions = ['こうえんで あそびました', '本を よみました', 'ともだちと はなしました', 'えを かきました'];
const storyHeroes = ['たろう', '花子', 'きつね', 'うさぎ'];
const storyPlaces = ['森', '公園', '学校', '川べり'];
const storyActions = ['はしりました', '見つけました', 'わらいました', 'ひろいました'];
const letterOpenings = ['○○さんへ', 'おばあさんへ', '先生へ', 'ともだちへ'];
const orderWords = ['はじめに', 'つぎに', 'それから', 'さいごに'];
const readingPassages = [
  { text: 'たろうは 森で どんぐりを 見つけました。', subject: 'たろう', place: '森', action: 'どんぐりを 見つけました' },
  { text: '花子は 学校で 友だちと わらいました。', subject: '花子', place: '学校', action: '友だちと わらいました' },
  { text: 'うさぎは 川べりで はしりました。', subject: 'うさぎ', place: '川べり', action: 'はしりました' },
  { text: 'きつねは 公園で はっぱを ひろいました。', subject: 'きつね', place: '公園', action: 'はっぱを ひろいました' },
];
const explanatoryPassages = [
  { text: 'まず えんぴつを もちます。 つぎに ノートに かきます。', answer: 'じゅんじょ' },
  { text: '手を あらってから、 ハンカチで ふきます。', answer: 'やり方' },
  { text: 'あさ、 まどを あけます。 それから くうきを いれかえます。', answer: '手じゅん' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G2_U01': {
      const word = katakanaWords[n % katakanaWords.length];
      if (n % 3 === 0) {
        return { question: `カタカナで かく ことばは どれ？`, answer: word, options: d(word, 'いぬ', 'やま', 'かわ'), hint: '外来語や ものの 名前に 多い。' };
      }
      if (n % 3 === 1) {
        return { question: `「${word}」の はじめの もじは？`, answer: word.charAt(0), options: d(word.charAt(0), word.charAt(1) || 'ン', 'ア', 'ラ'), hint: 'はじめの もじを みよう。' };
      }
      return {
        question: 'おとを きいて、どの ことばか えらぼう。',
        answer: word,
        options: d(word, katakanaWords[(n + 1) % katakanaWords.length], katakanaWords[(n + 2) % katakanaWords.length], katakanaWords[(n + 3) % katakanaWords.length]),
        hint: 'カタカナの ことばを ききとる。',
        audioPrompt: { text: word, lang: 'ja-JP', autoPlay: true },
      };
    }
    case 'KOKUGO_G2_U02': {
      const s = subjects[n % subjects.length];
      const p = predicates[n % predicates.length];
      if (n % 4 === 0) {
        return { question: `「${s}が ${p}。」の 主語は？`, answer: s, options: d(s, p, '。', 'が'), hint: 'だれ・なにが。' };
      }
      if (n % 4 === 1) {
        return { question: `「${s}が ${p}。」の 述語は？`, answer: p, options: d(p, s, 'が', '。'), hint: 'どうした。' };
      }
      if (n % 4 === 2) {
        return { question: `主語を あらわす ことばは どれ？`, answer: 'だれ・なにが', options: d('だれ・なにが', 'どうした', 'いつ', 'どこで'), hint: '文の はじめの もと。' };
      }
      return { question: `述語を あらわす ことばは どれ？`, answer: 'どうした', options: d('どうした', 'だれが', 'どこで', 'いつ'), hint: 'しめす うごきや ようす。' };
    }
    case 'KOKUGO_G2_U03': {
      const s = subjects[n % subjects.length];
      const p = predicates[n % predicates.length];
      if (n % 4 === 0) {
        return { question: `ただしい 文は どれ？`, answer: `${s}が ${p}。`, options: d(`${s}が ${p}。`, `${s} ${p}`, `。${s}が ${p}`, `${p}が ${s}。`), hint: '文の おわりに「。」を つける。' };
      }
      if (n % 4 === 1) {
        return { question: `文の おわりに つける きごうは？`, answer: '。', options: d('。', '、', '？', 'っ'), hint: '文の きまり。' };
      }
      if (n % 4 === 2) {
        return { question: '文に するとき ひつような ことは？', answer: 'ことばの じゅんを ととのえる', options: d('ことばの じゅんを ととのえる', 'もじを へらす', '「。」を つけない', '一もじだけに する'), hint: '読みやすい 文の 形。' };
      }
      return { question: '「、」を つかうと よいのは どんな とき？', answer: 'よみやすく くぎる とき', options: d('よみやすく くぎる とき', '文を おわる とき', 'もじを けす とき', '音を のばす とき'), hint: 'くとうてんの つかい方。' };
    }
    case 'KOKUGO_G2_U04': {
      const action = diaryActions[n % diaryActions.length];
      if (n % 4 === 0) {
        return { question: '日記に 入れると よいのは？', answer: 'したこと と 思ったこと', options: d('したこと と 思ったこと', 'むずかしい 漢字だけ', '同じ 文を くりかえす', 'あいさつ だけ'), hint: `たとえば「きょう、${action}。たのしかったです。」` };
      }
      if (n % 4 === 1) {
        return { question: '日記の はじめに かくことが 多いのは？', answer: 'いつの ことか', options: d('いつの ことか', 'さいごの まとめ', 'あいての 名前', 'ねだん'), hint: 'きょう・きのう など。' };
      }
      if (n % 4 === 2) {
        return { question: `「${action}。」の つぎに あると よいのは？`, answer: 'おもったこと', options: d('おもったこと', 'ひらがなひょう', 'なまえだけ', 'きごうだけ'), hint: 'たのしかった・うれしかった など。' };
      }
      return { question: '日記で つたわりやすいのは？', answer: 'じゅんに かく', options: d('じゅんに かく', 'さいごから かく', 'ことばを ぬく', '一文だけに する'), hint: 'できごとの 順。' };
    }
    case 'KOKUGO_G2_U05': {
      const passage = explanatoryPassages[n % explanatoryPassages.length];
      if (n % 4 === 0) {
        return { question: `「${passage.text}」のような ぶんで だいじなのは？`, answer: 'じゅんじょ', options: d('じゅんじょ', 'とうじょうじんぶつ', 'おもしろい せりふ', '気もち'), hint: 'どうするかが 順に書かれる。' };
      }
      if (n % 4 === 1) {
        return { question: `「${passage.text}」で たしかめると よいのは？`, answer: 'なにを どうするか', options: d('なにを どうするか', 'だれが 泣いたか', 'どこが おもしろいか', 'どの えが すきか'), hint: '手じゅんや わけ。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      if (n % 4 === 2) {
        return { question: '「まず」「つぎに」が 出てきやすいのは？', answer: 'せつめい文', options: d('せつめい文', '物語', '日記', 'しりとり'), hint: '手じゅんを あらわす ことば。' };
      }
      return { question: 'せつめい文で よみとることが 多いのは？', answer: 'やり方や わけ', options: d('やり方や わけ', '登場人物の 気もち', '会話の 長さ', 'おもしろい せりふ'), hint: 'せつめいの 中心。' };
    }
    case 'KOKUGO_G2_U06': {
      const story = readingPassages[n % readingPassages.length];
      const hero = story.subject;
      const place = story.place;
      const action = story.action;
      if (n % 4 === 0) {
        return { question: `「${story.text}」 しゅじんこうは だれ？`, answer: hero, options: d(hero, place, 'みち', 'ともだち'), hint: 'ものがたりの 中心。', audioPrompt: { text: story.text, lang: 'ja-JP', autoPlay: true } };
      }
      if (n % 4 === 1) {
        return { question: `「${story.text}」 どこで した？`, answer: place, options: d(place, hero, 'いえ', 'そら'), hint: 'ばしょを たしかめる。' };
      }
      if (n % 4 === 2) {
        return { question: `「${story.text}」 どうした？`, answer: action, options: d(action, 'ねました', 'およぎました', 'うたいました'), hint: 'したことを みつける。' };
      }
      return { question: '物語を よむ とき まず みると よいのは？', answer: 'だれが 出てくるか', options: d('だれが 出てくるか', 'ねだん', '時間わり', '答え'), hint: 'しゅじんこうを つかむ。' };
    }
    case 'KOKUGO_G2_U07': {
      if (n % 4 === 0) {
        return { question: 'ぶんしょうで 大事なことを 見つけるには？', answer: 'くりかえし 出る ことばを みる', options: d('くりかえし 出る ことばを みる', 'さいごだけ よむ', 'えだけ みる', '声を 出さない'), hint: '何ども 出ることばに ちゅうもく。' };
      }
      if (n % 4 === 1) {
        return { question: '大事なことに なりやすいのは？', answer: 'いちばん つたえたいこと', options: d('いちばん つたえたいこと', 'もじの 数', '本の あつさ', '字の 大きさ'), hint: '中心になる 内容。' };
      }
      if (n % 4 === 2) {
        return { question: '大事なことを さがす とき、 よく 見るのは？', answer: 'はじめや さいごの 文', options: d('はじめや さいごの 文', 'ページの 色', '本の 名まえだけ', 'えの 大きさ'), hint: 'まとまりの 目立つ ぶぶん。' };
      }
      return { question: '「いちばん いいたいこと」を 別の いい方で いうと？', answer: '大事なこと', options: d('大事なこと', 'かきじゅん', '字の 形', '音の のばし方'), hint: '文の 中心。' };
    }
    case 'KOKUGO_G2_U08': {
      const opening = letterOpenings[n % letterOpenings.length];
      if (n % 4 === 0) {
        return { question: '手紙の はじめに かくことが 多いのは？', answer: 'あいての 名まえ', options: d('あいての 名まえ', 'さようなら', 'じぶんの しゅみ だけ', '絵 だけ'), hint: 'だれに あてたか。' };
      }
      if (n % 4 === 1) {
        return { question: '手紙の さいごに かくことが 多いのは？', answer: 'かいた 人の 名まえ', options: d('かいた 人の 名まえ', 'あいての 名まえ', 'だい名 だけ', 'きせつの 名まえ'), hint: 'だれが かいたか。' };
      }
      if (n % 4 === 2) {
        return { question: `「${opening}」で はじまる 文は 何を あらわす？`, answer: 'だれに あてたか', options: d('だれに あてたか', 'どこで 書いたか', '何まい 書いたか', '何時に 書いたか'), hint: 'あて名。' };
      }
      return { question: '手紙に あると よいのは？', answer: 'つたえたい こと', options: d('つたえたい こと', 'もじの かずだけ', 'えだけ', '答えだけ'), hint: 'ようけんを 書く。' };
    }
    case 'KOKUGO_G2_U09': {
      if (n % 4 === 0) {
        return { question: '作文を かく とき、 だいじなのは？', answer: 'はじめ・中・おわりを かんがえる', options: d('はじめ・中・おわりを かんがえる', '1文だけ かく', '同じ ことばだけ つかう', '句読点を つけない'), hint: 'じゅんに かくと つたわりやすい。' };
      }
      if (n % 4 === 1) {
        return { question: '作文で つたわりやすいのは？', answer: 'じゅんに できごとを 書く', options: d('じゅんに できごとを 書く', '思いついた ところだけ 書く', '句点を つけない', '一つの 言葉だけ 書く'), hint: 'まとまりを 作る。' };
      }
      if (n % 4 === 2) {
        return { question: '作文に 入れると よいのは？', answer: '思ったこと', options: d('思ったこと', '字の 数だけ', '絵の 説明だけ', 'あいさつだけ'), hint: '気もちも 大切。' };
      }
      return { question: '作文の さいごに あると よいのは？', answer: 'まとめ', options: d('まとめ', 'あて名', 'ねだん', '時こく'), hint: 'しめくくりを 書く。' };
    }
    case 'KOKUGO_G2_U10': {
      if (n % 4 === 0) {
        return { question: '話を 聞く とき よい しせいは？', answer: 'はなす人を 見る', options: d('はなす人を 見る', 'よそ見を する', '歩きまわる', '話を さえぎる'), hint: 'よく きく たいど。' };
      }
      if (n % 4 === 1) {
        return { question: '話を 聞いて わからない ときは？', answer: '聞きなおす', options: d('聞きなおす', 'そのままに する', 'ほかの 話を する', '下を 向く'), hint: 'たしかめることが 大切。' };
      }
      if (n % 4 === 2) {
        return { question: '話を 聞く とき、 しては いけないことは？', answer: 'とちゅうで さえぎる', options: d('とちゅうで さえぎる', 'うなずく', 'さいごまで 聞く', 'しずかに する'), hint: '話し手の 話を さいごまで。' };
      }
      return { question: 'よく 聞けたか たしかめるには？', answer: '聞いたことを 思い出す', options: d('聞いたことを 思い出す', 'すぐ わすれる', 'べつの 話を する', '立って あるく'), hint: '内容を つかむ。' };
    }
    case 'KOKUGO_G2_U11': {
      const first = orderWords[0];
      const second = orderWords[1];
      const third = orderWords[2];
      const last = orderWords[3];
      if (n % 4 === 0) {
        return { question: '順序よく 話す とき、 1ばん はじめに つかう ことばは？', answer: first, options: d(first, second, last, third), hint: 'いちばん 先を あらわす。' };
      }
      if (n % 4 === 1) {
        return { question: '順序よく 話す とき、 おわりに ちかい ことばは？', answer: last, options: d(last, first, second, 'でも'), hint: 'まとめの 前に 使う。' };
      }
      if (n % 4 === 2) {
        return { question: '「つぎに」の あとに つかうと よい ことばは？', answer: third, options: d(third, first, last, 'でも'), hint: '順に ならべる。' };
      }
      return { question: '順序よく 話す と どうなる？', answer: 'わかりやすい', options: d('わかりやすい', 'むずかしく なる', 'みじかく なるだけ', '音が 大きく なる'), hint: '聞く人に 伝わる。' };
    }
    default:
      return { question: 'ただしい 文は どれ？', answer: 'わたしは げんきです。', options: d('わたしは げんきです。', 'わたし げんき', '。わたしは げんき', 'げんきです わたし'), hint: '文の きまり。' };
  }
};

fillGeneratedUnitProblems(KOKUGO_G2_UNIT_DATA, makeUnitProblem);

export const KOKUGO_G2_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G2_1: Object.values(KOKUGO_G2_UNIT_DATA).flat(),
  ...KOKUGO_G2_UNIT_DATA,
};
