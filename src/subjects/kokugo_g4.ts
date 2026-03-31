import { GeneralProblem, d } from './utils';

export const KOKUGO_G4_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G4_U01: [], KOKUGO_G4_U02: [], KOKUGO_G4_U03: [], KOKUGO_G4_U04: [], KOKUGO_G4_U05: [],
  KOKUGO_G4_U06: [], KOKUGO_G4_U07: [], KOKUGO_G4_U08: [], KOKUGO_G4_U09: [],
};

const kanjiUsagePairs = [
  { word: '会う', sentence: '友だちに あう。' },
  { word: '合う', sentence: 'こたえが あう。' },
  { word: '開く', sentence: 'まどを ひらく。' },
  { word: '空く', sentence: 'せきが あく。' },
];
const jukugoWords = ['森林', '電車', '学校', '教室', '気温'];
const dictTargets = ['協力', '発見', '成長', '努力'];
const storyScenes = ['朝の 教室', '雨の日の 帰り道', '運動会の 前', '図書室での できごと'];
const opinionThemes = ['読書は 大切だ', '早ね早おきが よい', 'あいさつは 必要だ', 'そうじは みんなで するべきだ'];
const storyPassages = [
  { text: 'ぼくは 教室の すみで だまって まっていた。', answer: '人物のようす' },
  { text: '運動会の 前の日、 花子は どきどきして ねむれなかった。', answer: '気もち' },
  { text: '雨が やみ、 校庭に ひかりが さしこんだ。', answer: '場面の変化' },
  { text: '友だちの ひとことで、 ぼくの 気もちが かわった。', answer: '気もち' },
  { text: '夕方に なり、 教室の ふんいきが しずかに かわった。', answer: '場面の変化' },
  { text: 'はじめは うつむいていたが、 さいごは まっすぐ前を見て話した。', answer: '人物のようす' },
  { text: 'だれも いない図書室で、 ページを めくる音だけが ひびいた。', answer: '場面の変化' },
  { text: 'しっぱいしたあとの 一言で、 主人公は ほっとした。', answer: '気もち' },
];
const explanatoryPassages = [
  { text: 'たとえば、 リサイクルを すると ごみを へらすことが できる。', answer: '例' },
  { text: '植物は 日光を あびると よく そだつ。 そのため、 ひなたに おく。', answer: 'わけ' },
  { text: 'まず しらべる。 つぎに まとめる。', answer: 'じゅんじょ' },
  { text: 'まず けいかくを 立てる。 そのあとで しらべる。', answer: 'じゅんじょ' },
  { text: 'たとえば、 近くの川をそうじすると 町がきれいに見える。', answer: '例' },
  { text: '雨の日は すべりやすい。 だから、 ゆっくり歩く。', answer: 'わけ' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G4_U01':
      if (n % 4 === 0) {
        return { question: '漢字を 使うよさは？', answer: '意味が わかりやすくなる', options: d('意味が わかりやすくなる', '音が 消える', '文が なくなる', '話せなくなる'), hint: '読み手に 伝わりやすい。' };
      }
      if (n % 4 === 1) {
        return { question: '同じ読みでも 漢字を 使い分けるのは なぜ？', answer: '意味を 区別するため', options: d('意味を 区別するため', '字を ふやすため', '早く書くため', '音を かえるため'), hint: '「会う」「合う」など。' };
      }
      if (n % 4 === 2) {
        const item = kanjiUsagePairs[n % kanjiUsagePairs.length];
        return {
          question: `「${item.sentence}」の「あう・ひらく・あく」を 漢字で 書くと？`,
          answer: item.word,
          options: d(item.word, kanjiUsagePairs[(n + 1) % kanjiUsagePairs.length].word, kanjiUsagePairs[(n + 2) % kanjiUsagePairs.length].word, kanjiUsagePairs[(n + 3) % kanjiUsagePairs.length].word),
          hint: 'ぶんの いみに 合う 漢字を えらぶ。',
        };
      }
      return { question: '漢字を 正しく 使うと どうなる？', answer: '文の意味が 正しく 伝わる', options: d('文の意味が 正しく 伝わる', '読むところが なくなる', '音が でなくなる', '行が 消える'), hint: '使い分けの 効果。' };
    case 'KOKUGO_G4_U02':
      if (n % 4 === 0) {
        return { question: '「森林」のような ことばを 何という？', answer: '熟語', options: d('熟語', '単語', '文', '段落'), hint: '漢字が 2つ以上。' };
      }
      if (n % 4 === 1) {
        return { question: '熟語を 調べるのに 役立つのは？', answer: '漢字の意味', options: d('漢字の意味', '温度', '地図', '音楽'), hint: '組み合わせで 意味ができる。' };
      }
      if (n % 4 === 2) {
        const word = jukugoWords[n % jukugoWords.length];
        return { question: `「${word}」は どれに あたる？`, answer: '熟語', options: d('熟語', '文', '会話', '段落'), hint: '漢字の 組み合わせ。' };
      }
      return { question: '熟語を 学ぶと どんなことが わかりやすい？', answer: 'ことばの意味', options: d('ことばの意味', '教室の広さ', '天気の変化', '走る速さ'), hint: '漢字どうしの つながり。' };
    case 'KOKUGO_G4_U03':
      if (n % 4 === 0) {
        return { question: '国語辞典で 調べるのに 向くのは？', answer: 'ことばの意味', options: d('ことばの意味', '画数だけ', '理科の実験', '地図記号'), hint: 'ことば全体。' };
      }
      if (n % 4 === 1) {
        return { question: '漢字辞典で 調べるのに 向くのは？', answer: '漢字の読みや画数', options: d('漢字の読みや画数', '物語のあらすじ', '気もち', '天気'), hint: '漢字そのものを 調べる。' };
      }
      if (n % 4 === 2) {
        const word = dictTargets[n % dictTargets.length];
        return { question: `「${word}」の 意味を しらべたい。使うと よいのは？`, answer: '国語辞典', options: d('国語辞典', '漢字辞典', '地図帳', '図かん'), hint: 'ことばの意味を 調べる。' };
      }
      return { question: '一つの 漢字の 画数を 調べたい。使うと よいのは？', answer: '漢字辞典', options: d('漢字辞典', '国語辞典', '百科事典', '図工の本'), hint: '漢字そのものを 調べる。' };
    case 'KOKUGO_G4_U04':
      if (n % 4 === 0) {
        return { question: '要旨とは？', answer: '文章の いちばん 大事な内容', options: d('文章の いちばん 大事な内容', '一文目', '最後の一文字', '題名だけ'), hint: '全体の 中心。' };
      }
      if (n % 4 === 1) {
        return { question: '段落ごとの だいじなことを まとめると 何に 近づく？', answer: '要旨', options: d('要旨', '会話文', '手紙', '俳句'), hint: '全体の まとめ。' };
      }
      if (n % 4 === 2) {
        return { question: '要旨を つかむ とき、 まず 見ると よいのは？', answer: '各段落の 大事な文', options: d('各段落の 大事な文', '最後の 一文字', '漢字の画数', '作者の名前だけ'), hint: '段落の 中心を 集める。' };
      }
      return { question: '要旨が わかると 何が しやすくなる？', answer: '文章全体の 内容を つかむ', options: d('文章全体の 内容を つかむ', '字を けす', '文を なくす', '音を 変える'), hint: '全体の 中心を とらえる。' };
    case 'KOKUGO_G4_U05':
      if (n % 4 === 0) {
        return { question: '物語文で 人物の気もちを とらえる 手がかりは？', answer: '行動や会話', options: d('行動や会話', '画数', '段落の数', '紙の色'), hint: 'どうしたか、何を言ったか。' };
      }
      if (n % 4 === 1) {
        return { question: '場面が 変わったかを たしかめる ときに みるものは？', answer: '時間や場所', options: d('時間や場所', '文字の大きさ', '紙の重さ', '作者の年れい'), hint: 'いつ・どこで。' };
      }
      if (n % 4 === 2) {
        const passage = storyPassages[n % storyPassages.length];
        return { question: `「${passage.text}」から わかるのは？`, answer: passage.answer, options: d(passage.answer, '主語', '理由', '順序'), hint: 'ぶんの えがき方に ちゅうもく。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '物語文を 読む とき、 人物の気もちを つかむには？', answer: 'ことばの ようすを たしかめる', options: d('ことばの ようすを たしかめる', 'だんらくの 数だけ 見る', '字の形だけ 見る', '題名だけ 見る'), hint: '会話や 行動に 注目する。' };
    case 'KOKUGO_G4_U06':
      if (n % 4 === 0) {
        return { question: '説明文で 筆者が いちばん つたえたいことは？', answer: '中心となる考え', options: d('中心となる考え', '例', '感想', 'せりふ'), hint: '事例よりも 上の まとめ。' };
      }
      if (n % 4 === 1) {
        return { question: '説明文の 例は 何のために ある？', answer: '考えを わかりやすくするため', options: d('考えを わかりやすくするため', '話題を しめすため', '気もちを つたえるため', '会話を ふやすため'), hint: 'れいを出して 説明。' };
      }
      if (n % 4 === 2) {
        const passage = explanatoryPassages[n % explanatoryPassages.length];
        return { question: `「${passage.text}」で つかむと よいのは？`, answer: passage.answer, options: d(passage.answer, 'しゅじんこう', '気もち', '場面'), hint: '説明の しかたに 注目。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文の「例」と「考え」の 関係は？', answer: '例は 考えを 支える', options: d('例は 考えを 支える', '例が 主題になる', '考えと べつべつ', '例が 結論になる'), hint: '事例で 説明を はっきりさせる。' };
    case 'KOKUGO_G4_U07':
      if (n % 4 === 0) {
        return { question: '要約で のこすものは？', answer: '大事な内容', options: d('大事な内容', '細かすぎる例', '関係ないこと', '同じことのくり返し'), hint: '短く 正しく。' };
      }
      if (n % 4 === 1) {
        return { question: '要約するときに することは？', answer: '言いかえて まとめる', options: d('言いかえて まとめる', 'そのまま 全部写す', '一文だけにする', '題名を 消す'), hint: '自分のことばで。' };
      }
      if (n % 4 === 2) {
        return { question: '要約で けずることが 多いのは？', answer: '細かい 例', options: d('細かい 例', '中心の考え', '大事なことば', '要旨'), hint: '短くするために しぼる。' };
      }
      return { question: '要約の よさは？', answer: '内容を 短く 正しく 伝えられる', options: d('内容を 短く 正しく 伝えられる', '文が なくなる', '意味が 消える', '音が 大きくなる'), hint: '要点だけを 残す。' };
    case 'KOKUGO_G4_U08':
      if (n % 4 === 0) {
        return { question: '意見文で 必要なのは？', answer: '理由', options: d('理由', '会話だけ', '題名だけ', '感想なし'), hint: 'なぜそう思うか。' };
      }
      if (n % 4 === 1) {
        return { question: '意見文の くみ立てで よいのは？', answer: '意見→理由→まとめ', options: d('意見→理由→まとめ', '理由→題名→会話', 'まとめだけ', '会話→会話→会話'), hint: '筋道を 立てる。' };
      }
      if (n % 4 === 2) {
        return { question: `「${opinionThemes[n % opinionThemes.length]}」の あとに つづくと よいのは？`, answer: '理由', options: d('理由', '計算式', '会話だけ', '段落番号だけ'), hint: '意見を 支える。' };
      }
      return { question: '意見文を わかりやすくするには？', answer: '考えと 理由を つなげる', options: d('考えと 理由を つなげる', '理由を 書かない', '思いつきを 並べる', 'まとめを 消す'), hint: '筋道を はっきりさせる。' };
    case 'KOKUGO_G4_U09':
      if (n % 4 === 0) {
        return { question: '発表で 気をつけることは？', answer: '聞く人に わかる声で話す', options: d('聞く人に わかる声で話す', '下だけ 見る', '急に 終わる', '小さすぎる声'), hint: '相手に伝える。' };
      }
      if (n % 4 === 1) {
        return { question: '話し合いで よい たいどは？', answer: '相手の意見も聞く', options: d('相手の意見も聞く', '自分だけ話す', 'さえぎる', '何も聞かない'), hint: '話し合いは 双方向。' };
      }
      if (n % 4 === 2) {
        return { question: '発表を わかりやすくするには？', answer: '順序よく 話す', options: d('順序よく 話す', '思いついたことを とつぜん言う', '小声で 話す', '下を 見つづける'), hint: '流れを 整える。' };
      }
      return { question: '話し合いで 自分の意見を 言うとき よいのは？', answer: '理由を そえる', options: d('理由を そえる', '一言だけにする', '関係ない話を する', '急に 終わる'), hint: '相手に わかるように。' };
    default:
      return { question: '国語で 大切なのは？', answer: '考えを ことばで 伝える', options: d('考えを ことばで 伝える', '絵だけで 伝える', '話を きかない', '文を 読まない'), hint: '読む・書く・話す・聞く。' };
  }
};

Object.keys(KOKUGO_G4_UNIT_DATA).forEach((unitId) => {
  const problems = KOKUGO_G4_UNIT_DATA[unitId];
  while (problems.length < 20) problems.push(makeUnitProblem(unitId, problems.length));
});

export const KOKUGO_G4_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G4_1: Object.values(KOKUGO_G4_UNIT_DATA).flat(),
  ...KOKUGO_G4_UNIT_DATA,
};
