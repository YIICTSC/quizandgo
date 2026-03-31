import { GeneralProblem, d } from './utils';

export const KOKUGO_G3_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G3_U01: [], KOKUGO_G3_U02: [], KOKUGO_G3_U03: [], KOKUGO_G3_U04: [], KOKUGO_G3_U05: [],
  KOKUGO_G3_U06: [], KOKUGO_G3_U07: [], KOKUGO_G3_U08: [], KOKUGO_G3_U09: [],
};

const dictWords = ['あさがお', '海', '学校', '空', '森林'];
const kanjiPairs = [
  { word: '強い', yomi: 'つよい', sentence: 'つよい かぜが ふく。' },
  { word: '楽しい', yomi: 'たのしい', sentence: 'えんそくは たのしい。' },
  { word: '教室', yomi: 'きょうしつ', sentence: 'きょうしつで べんきょうする。' },
  { word: '道路', yomi: 'どうろ', sentence: 'どうろを わたる。' },
  { word: '畑', yomi: 'はたけ', sentence: 'はたけで やさいを そだてる。' },
  { word: '温度', yomi: 'おんど', sentence: 'おんどを はかる。' },
];
const paragraphTopics = ['春の遠足', '図書館の使い方', '雨の日のようす', '花の育ち方'];
const storyPeople = ['太郎', '花子', 'きつね', 'ゆうき'];
const storyFeelings = ['うれしい', 'かなしい', 'あんしんした', 'おどろいた'];
const explainConnectors = ['まず', 'つぎに', 'そのため', 'たとえば'];
const readingPassages = [
  { text: 'ゆうきは しっぱいして しょんぼりしていたが、 友だちに はげまされて えがおになった。', answer: '気もちの変化' },
  { text: '雨が ふってきたので、 花子は いそいで かさを ひらいた。', answer: 'わけと行動' },
  { text: 'きつねは しずかに 木のかげから ようすを 見ていた。', answer: '人物のようす' },
  { text: '太郎は まよったが、 さいごには 自分で 決めた。', answer: '気もちの変化' },
  { text: '空が くらくなったので、 みんなは いそいで いえに もどった。', answer: 'わけと行動' },
];
const explanatoryPassages = [
  { text: 'まず たねを まきます。 つぎに みずを あげます。', answer: 'じゅんじょ' },
  { text: '雨の日は じめんが すべりやすい。 そのため、 ゆっくり あるく。', answer: 'わけ' },
  { text: 'たとえば、 図書館では しずかに する。', answer: 'れい' },
];
const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G3_U01': {
      const item = kanjiPairs[n % kanjiPairs.length];
      const { word: kanji, yomi, sentence } = item;
      if (n % 4 === 0) {
        return { question: `「${kanji}」の 読みは？`, answer: yomi, options: d(yomi, 'やさしい', 'うれしい', 'きれい'), hint: '文の中でも よく使う。' };
      }
      if (n % 4 === 1) {
        return { question: `「${yomi}」を 漢字で 書くと？`, answer: kanji, options: d(kanji, '元気', '山道', '青空'), hint: '読みと漢字を 結びつける。' };
      }
      if (n % 4 === 2) {
        return {
          question: `「${sentence}」で 漢字で 書く ことばは どれ？`,
          answer: kanji,
          options: d(kanji, kanjiPairs[(n + 1) % kanjiPairs.length].word, kanjiPairs[(n + 2) % kanjiPairs.length].word, kanjiPairs[(n + 3) % kanjiPairs.length].word),
          hint: 'ぶんの いみに 合う ことばを えらぶ。',
        };
      }
      return {
        question: 'おとを きいて、正しい 漢字を えらぼう。',
        answer: kanji,
        options: d(kanji, kanjiPairs[(n + 1) % kanjiPairs.length].word, kanjiPairs[(n + 2) % kanjiPairs.length].word, kanjiPairs[(n + 3) % kanjiPairs.length].word),
        hint: '読みを ききとる。',
        audioPrompt: { text: yomi, lang: 'ja-JP', autoPlay: true },
      };
    }
    case 'KOKUGO_G3_U02': {
      const w = dictWords[n % dictWords.length];
      if (n % 4 === 0) {
        return { question: `国語辞典で 「${w}」を しらべる とき、 まず見るのは？`, answer: 'あいうえお順', options: d('あいうえお順', '画数', 'ページの色', '長さ'), hint: 'ことばの 並び方。' };
      }
      if (n % 4 === 1) {
        return { question: `国語辞典で ことばを しらべると わかることは？`, answer: '意味', options: d('意味', '体重', '天気', '値段'), hint: 'どんなことばかが わかる。' };
      }
      if (n % 4 === 2) {
        return { question: `「${w}」を しらべる とき、 はじめの もじで 見るのは？`, answer: w.charAt(0), options: d(w.charAt(0), w.charAt(1), 'ん', 'ら'), hint: 'さいしょの 一文字。' };
      }
      return { question: '国語辞典を つかうと どんな力が つく？', answer: 'ことばを くわしく 知る力', options: d('ことばを くわしく 知る力', '足が はやくなる力', '絵が うまくなる力', '計算が はやくなる力'), hint: '言葉の 意味や 使い方。' };
    }
    case 'KOKUGO_G3_U03':
      if (n % 4 === 0) {
        return { question: '段落は どこで かわることが 多い？', answer: '話題が かわるところ', options: d('話題が かわるところ', '句点が あるたび', '1行ごと', '名前が 出るたび'), hint: 'ひとまとまりごと。' };
      }
      if (n % 4 === 1) {
        return { question: '段落の はじめで よくすることは？', answer: '一字下げ', options: d('一字下げ', '二字下げ', '空けない', '丸をつける'), hint: '書き方の きまり。' };
      }
      if (n % 4 === 2) {
        return { question: `「${paragraphTopics[n % paragraphTopics.length]}」の つぎに 別の 話に うつるとき どうする？`, answer: '段落を かえる', options: d('段落を かえる', '同じ 行に つづける', '文を 消す', '題を かえる'), hint: '話題の まとまりを 分ける。' };
      }
      return { question: '段落を 分けると どうなる？', answer: '内容が わかりやすい', options: d('内容が わかりやすい', '字が 小さくなる', '読む文が なくなる', '漢字が ひらがなになる'), hint: 'まとまりが 見える。' };
    case 'KOKUGO_G3_U04': {
      const passage = readingPassages[n % readingPassages.length];
      if (n % 4 === 0) {
        return { question: '物語文で ちゅうもくするのは？', answer: '人物の気もち', options: d('人物の気もち', '材料の数', '地図記号', '温度'), hint: 'だれが どう思ったか。' };
      }
      if (n % 4 === 1) {
        return { question: '物語文の できごとを つかむには？', answer: 'いつ・どこで・だれが・なにをしたか', options: d('いつ・どこで・だれが・なにをしたか', '漢字だけ', '最後だけ', '題だけ'), hint: '場面を 整理する。' };
      }
      if (n % 4 === 2) {
        return { question: `「${passage.text}」から わかるのは？`, answer: passage.answer, options: d(passage.answer, '画数', '教室の広さ', '天気'), hint: 'ぶんの ようすを よみとる。' };
      }
      return { question: '物語文で 場面が かわるとき ちゅうもくするのは？', answer: '時間や 場所', options: d('時間や 場所', '数字だけ', '記号だけ', 'ページ数'), hint: 'いつ・どこで。' };
    }
    case 'KOKUGO_G3_U05': {
      const passage = explanatoryPassages[n % explanatoryPassages.length];
      if (n % 4 === 0) {
        return { question: '説明文で 大切なのは？', answer: '事実とわけ', options: d('事実とわけ', 'せりふ', '気もちだけ', '会話の数'), hint: '何が どうして そうなのか。' };
      }
      if (n % 4 === 1) {
        return { question: '説明文の つなぎことばで、 じゅんじょを 表すのは？', answer: 'まず', options: d('まず', 'だから', 'たしかに', 'もし'), hint: '手じゅんの はじめ。' };
      }
      if (n % 4 === 2) {
        return { question: `「${passage.text}」で たしかめると よいのは？`, answer: passage.answer, options: d(passage.answer, 'しゅじんこう', '気もち', '場面'), hint: 'せつめいの しかたに 注目。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文を 読む とき よいのは？', answer: 'わけを たしかめる', options: d('わけを たしかめる', '人物の 会話だけ 見る', '題を けす', '一文目だけ 見る'), hint: 'なぜそうなるか。' };
    }
    case 'KOKUGO_G3_U06':
      if (n % 4 === 0) {
        return { question: '要点を まとめる とき、 のこすと よいものは？', answer: '大事なことば', options: d('大事なことば', '全部の文', '関係ない こと', '同じことの くり返し'), hint: '短く まとめる。' };
      }
      if (n % 4 === 1) {
        return { question: '要点を まとめる ときに することは？', answer: 'にたことを まとめる', options: d('にたことを まとめる', '長く くわしく 書く', '題を 消す', '順番を ばらばらにする'), hint: '短く、正しく。' };
      }
      if (n % 4 === 2) {
        return { question: '要点を まとめる とき、 けずってよいものは？', answer: 'くり返し', options: d('くり返し', '大事な ことば', '中心文', 'わけ'), hint: '同じ 内容は しぼる。' };
      }
      return { question: '要点を まとめると どんな よさがある？', answer: '大事なことが つかみやすい', options: d('大事なことが つかみやすい', '文が なくなる', '答えが ふえる', '字が きえる'), hint: '短く まとまる。' };
    case 'KOKUGO_G3_U07':
      if (n % 4 === 0) {
        return { question: '日記や作文で 大切なのは？', answer: '自分の思いを 入れる', options: d('自分の思いを 入れる', '同じ文を くり返す', '名まえを 書かない', '句点を つけない'), hint: 'したことと 思ったこと。' };
      }
      if (n % 4 === 1) {
        return { question: '作文の くみ立てで よいのは？', answer: 'はじめ・中・おわり', options: d('はじめ・中・おわり', '中・中・中', 'おわり だけ', '題 だけ'), hint: '読みやすい 形。' };
      }
      if (n % 4 === 2) {
        return { question: '日記に 書くと よいのは？', answer: 'できごとと 感想', options: d('できごとと 感想', '数字だけ', '題名だけ', '句点の 数'), hint: 'したことと 思ったこと。' };
      }
      return { question: '作文を わかりやすく するには？', answer: '順序よく 書く', options: d('順序よく 書く', '文を ぬかす', '同じことだけ 書く', 'おわりを 書かない'), hint: '流れを そろえる。' };
    case 'KOKUGO_G3_U08':
      if (n % 4 === 0) {
        return { question: '手紙に 書くと よいのは？', answer: 'あいてに つたえたいこと', options: d('あいてに つたえたいこと', '数字だけ', 'ばらばらな 文', 'あいさつ なし'), hint: 'あいてを 思って 書く。' };
      }
      if (n % 4 === 1) {
        return { question: '手紙の はじめに 入ることが 多いのは？', answer: 'あいさつ', options: d('あいさつ', 'まとめ', 'おわりのことば', '感想 だけ'), hint: 'さいしょの 一文。' };
      }
      if (n % 4 === 2) {
        return { question: '手紙の さいごに 入れることが 多いのは？', answer: '名前', options: d('名前', '題だけ', '値だん', '教科名'), hint: 'だれが 書いたか。' };
      }
      return { question: '手紙を 書く とき 大切なのは？', answer: 'あいてを 考える', options: d('あいてを 考える', '自分だけ わかればよい', '文を ばらばらにする', 'あいさつを ぬく'), hint: '読む相手を 意識する。' };
    case 'KOKUGO_G3_U09':
      if (n % 4 === 0) {
        return { question: '話し合いで 大切なのは？', answer: '友だちの話を よく聞く', options: d('友だちの話を よく聞く', '大声で さえぎる', '自分だけ 話す', '下を むく'), hint: '聞くことも 大切。' };
      }
      if (n % 4 === 1) {
        return { question: '話し合いで 自分の考えを つたえる ときは？', answer: 'りゆうを そえて 話す', options: d('りゆうを そえて 話す', '一語だけ いう', '急に話題を かえる', '小さすぎる声で 話す'), hint: 'わかりやすく。' };
      }
      if (n % 4 === 2) {
        return { question: '話し合いで しては いけないことは？', answer: '人の話を さえぎる', options: d('人の話を さえぎる', 'うなずく', '最後まで 聞く', 'メモを とる'), hint: '相手の 話を 尊重する。' };
      }
      return { question: '話し合いを 進めやすくするには？', answer: '話題を そろえる', options: d('話題を そろえる', '思いつくままに 話す', '関係ない話を する', '理由を 言わない'), hint: '同じ テーマで 話す。' };
    default:
      return { question: '国語の べんきょうで 大切なのは？', answer: 'よく読んで 考える', options: d('よく読んで 考える', '急いで 終える', '見ないで 答える', '一つだけ 覚える'), hint: '読む・書く・話す・聞く。' };
  }
};

Object.keys(KOKUGO_G3_UNIT_DATA).forEach((unitId) => {
  const problems = KOKUGO_G3_UNIT_DATA[unitId];
  while (problems.length < 20) problems.push(makeUnitProblem(unitId, problems.length));
});

export const KOKUGO_G3_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G3_1: Object.values(KOKUGO_G3_UNIT_DATA).flat(),
  ...KOKUGO_G3_UNIT_DATA,
};
