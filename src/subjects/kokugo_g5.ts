import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G5_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G5_U01: [], KOKUGO_G5_U02: [], KOKUGO_G5_U03: [], KOKUGO_G5_U04: [], KOKUGO_G5_U05: [],
  KOKUGO_G5_U06: [], KOKUGO_G5_U07: [], KOKUGO_G5_U08: [], KOKUGO_G5_U09: [],
};

const kanjiChoicePairs = [
  { word: '測る', sentence: '長さを はかる。' },
  { word: '計る', sentence: '時間を はかる。' },
  { word: '取る', sentence: '本を とる。' },
  { word: '採る', sentence: '意見を とり入れる。' },
];
const storyTurns = ['主人公が 決心する場面', '気もちが 大きく変わる場面', '大事な出会いの場面', '最後の まとめの場面'];
const explanationThemes = ['環境を 守ること', '水を 大切に すること', '読書のよさ', 'あいさつの 大切さ'];
const reportExpressions = ['調べたところ', 'その結果', '資料を見ると', 'わかったことは'];
const speechThemes = ['好きな本', '学校行事', '将来の夢', '地域のよさ'];
const storyPassages = [
  { text: '主人公は まよったあとで、 自分から 友だちに 声を かけた。', answer: '気もちの変化' },
  { text: 'たった 一つの できごとで、 登場人物の考えが 大きく 変わった。', answer: '山場' },
  { text: '同じ景色でも、 見る人の気もちで ちがって 見える。', answer: '人物の見方' },
  { text: '心の中では こわかったが、 えがおで みんなの前に 立った。', answer: '気もちの変化' },
  { text: 'その出会いが、 物語の流れを 大きく かえた。', answer: '山場' },
  { text: '手紙を 読んだあと、 主人公は これまでと ちがう見方を するようになった。', answer: '人物の見方' },
  { text: '言い返さなかった沈黙に、 主人公の強い決意が表れている。', answer: '気もちの変化' },
  { text: 'このできごとを きっかけに、 物語は 結末へ 大きく動き出す。', answer: '山場' },
];
const explanationPassages = [
  { text: '水を大切にすることは、 くらしを守ることにつながる。 たとえば、 使わない水を止めることが できる。', answer: '主張と事例' },
  { text: '読書には、 知らない考えに ふれるよさがある。 そのため、 視野が広がる。', answer: '主張と理由' },
  { text: 'まず 資料を集める。 つぎに 必要なことを えらぶ。', answer: 'じゅんじょ' },
  { text: 'たとえば、 地域の清そう活動は 町をきれいにする。', answer: '例' },
  { text: 'まず 問題を見つける。 そのあとで、 解決の方法を考える。', answer: 'じゅんじょ' },
  { text: 'たとえば、 あいさつが増えると 学校全体のふんいきが明るくなる。', answer: '例' },
  { text: 'ごみを減らすことは、 環境を守ることにつながる。 だから、 むだをへらす工夫が必要だ。', answer: '主張と理由' },
  { text: '図書館を使う人が増えると、 調べ学習がしやすくなる。 たとえば、 すぐに本を見つけられる。', answer: '主張と事例' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G5_U01':
      if (n % 4 === 0) {
        return { question: '漢字の使い分けで 大切なのは？', answer: '文の意味に 合わせる', options: d('文の意味に 合わせる', '画数だけで 決める', 'いつも同じ字を使う', '音だけで 決める'), hint: '文の内容に合う字。' };
      }
      if (n % 4 === 1) {
        return { question: '同じ読みの漢字を 使い分ける 理由は？', answer: '意味が ちがうから', options: d('意味が ちがうから', '見た目だけ', '音が なくなるから', '長くなるから'), hint: '「あう」の使い分けなど。' };
      }
      if (n % 4 === 2) {
        const item = kanjiChoicePairs[n % kanjiChoicePairs.length];
        return {
          question: `「${item.sentence}」の「はかる・とる」を 漢字で 書くと？`,
          answer: item.word,
          options: d(item.word, kanjiChoicePairs[(n + 1) % kanjiChoicePairs.length].word, kanjiChoicePairs[(n + 2) % kanjiChoicePairs.length].word, kanjiChoicePairs[(n + 3) % kanjiChoicePairs.length].word),
          hint: 'ぶんみゃくに 合う 漢字を えらぶ。',
        };
      }
      return { question: '漢字の意味を 考えて 使うと どうなる？', answer: '正しく 伝わる', options: d('正しく 伝わる', '音が 消える', '字が 小さくなる', '文が なくなる'), hint: '使い分けの 効果。' };
    case 'KOKUGO_G5_U02':
      if (n % 4 === 0) {
        return { question: '敬語を 使うのは どんなとき？', answer: '相手に ていねいに 伝えるとき', options: d('相手に ていねいに 伝えるとき', '友だちに 命令するとき', 'ひとりごと', '計算するとき'), hint: '相手や場面に 合わせる。' };
      }
      if (n % 4 === 1) {
        return { question: '「です・ます」は どんな ことばづかい？', answer: 'ていねいな言い方', options: d('ていねいな言い方', '命令', '古文', '俳句'), hint: 'あらたまった場面。' };
      }
      if (n % 4 === 2) {
        return { question: '敬語を 使うと どんな よさがある？', answer: '相手に しつれいなく 伝えられる', options: d('相手に しつれいなく 伝えられる', '話が みじかく なるだけ', '意味が 消える', '命令になる'), hint: '相手との 関係を 考える。' };
      }
      return { question: '学校で 先生に 話す ときに 合うのは？', answer: 'ていねいな言い方', options: d('ていねいな言い方', 'くだけた言い方', '命令の言い方', '一語だけ'), hint: '場面に 合わせる。' };
    case 'KOKUGO_G5_U03':
      if (n % 4 === 0) {
        return { question: '物語文で 変化を 読み取るのは？', answer: '人物の気もち', options: d('人物の気もち', '温度', '地図', '値段'), hint: '前後で どう変わるか。' };
      }
      if (n % 4 === 1) {
        return { question: '物語文で クライマックスを とらえる手がかりは？', answer: '大きなできごと', options: d('大きなできごと', '題名の長さ', '句点の数', '紙の色'), hint: '話が 大きく動くところ。' };
      }
      if (n % 4 === 2) {
        const passage = storyPassages[n % storyPassages.length];
        return { question: `「${passage.text}」から わかるのは？`, answer: passage.answer, options: d(passage.answer, '段落の数', '主語', '要約'), hint: 'できごとや えがき方に 注目する。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '物語文で 人物の変化を とらえるには？', answer: '前と後を 比べる', options: d('前と後を 比べる', '例だけ 集める', '段落番号だけ 見る', 'ことばを けずる'), hint: '変化の 前後に 注目する。' };
    case 'KOKUGO_G5_U04':
      if (n % 4 === 0) {
        return { question: '説明文で 筆者の主張に あたるのは？', answer: '中心となる意見', options: d('中心となる意見', '例だけ', '題名だけ', '会話だけ'), hint: 'いちばん 伝えたい考え。' };
      }
      if (n % 4 === 1) {
        return { question: '説明文で 事例の 役わりは？', answer: '主張を 支える', options: d('主張を 支える', '話題を 変える', '気もちを 書く', '場面を 作る'), hint: 'れいを出して 納得しやすくする。' };
      }
      if (n % 4 === 2) {
        const passage = explanationPassages[n % explanationPassages.length];
        return { question: `「${passage.text}」で つかむと よいのは？`, answer: passage.answer, options: d(passage.answer, '登場人物', '心情', '場面'), hint: '主張と それを 支える文に 注目する。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文を 読む とき、 主張を つかむには？', answer: 'くり返し 出る考えを 見る', options: d('くり返し 出る考えを 見る', '会話だけ 見る', '登場人物だけ 見る', 'かんじの数を 数える'), hint: '中心の考えを 追う。' };
    case 'KOKUGO_G5_U05':
      if (n % 4 === 0) {
        return { question: '要旨とは？', answer: '文章全体の中心', options: d('文章全体の中心', '最初の一文', '最後の一語', 'いちばん長い段落'), hint: '全体を ひとまとめに。' };
      }
      if (n % 4 === 1) {
        return { question: '要約で 大切なのは？', answer: '短く 大事なことを まとめる', options: d('短く 大事なことを まとめる', '全部そのまま写す', '例だけ残す', '題名だけ書く'), hint: '情報をしぼる。' };
      }
      if (n % 4 === 2) {
        return { question: '要旨と 要約の ちがいとして 合うのは？', answer: '要旨は 中心、要約は 短くまとめた文', options: d('要旨は 中心、要約は 短くまとめた文', 'どちらも 題名だけ', 'どちらも 会話文', '要約の方が 文全体'), hint: '意味を 区別する。' };
      }
      return { question: '要約するとき けずることが 多いのは？', answer: '細かな 例', options: d('細かな 例', '中心となる考え', '要旨', '大事な理由'), hint: 'しぼって 短くする。' };
    case 'KOKUGO_G5_U06':
      if (n % 4 === 0) {
        return { question: '意見文で 必要なのは？', answer: '意見を 支える理由', options: d('意見を 支える理由', '感想だけ', 'せりふだけ', 'むずかしい 漢字だけ'), hint: 'なぜそう考えるか。' };
      }
      if (n % 4 === 1) {
        return { question: '意見文で 反対の考えに ふれる よさは？', answer: '自分の考えが はっきりする', options: d('自分の考えが はっきりする', '文が 短くなる', '理由が いらなくなる', '題名が 消える'), hint: '多面的に考える。' };
      }
      if (n % 4 === 2) {
        return { question: '意見文の はじめに 書くことが 多いのは？', answer: '自分の意見', options: d('自分の意見', '反対意見だけ', '会話だけ', '結論を ぬいた文'), hint: '何を 主張するかを 先に示す。' };
      }
      return { question: '意見文を わかりやすくするには？', answer: '意見と理由を つなげる', options: d('意見と理由を つなげる', '理由を 書かない', '会話だけに する', '順序を なくす'), hint: '筋道を はっきり。' };
    case 'KOKUGO_G5_U07':
      if (n % 4 === 0) {
        return { question: '報告文で 大切なのは？', answer: '事実を わかりやすく 書く', options: d('事実を わかりやすく 書く', '思いつきだけ 書く', '順序を なくす', '会話だけにする'), hint: '調べたことを 正確に。' };
      }
      if (n % 4 === 1) {
        return { question: '報告文に 向く表現は？', answer: '調べた結果を まとめる表現', options: d('調べた結果を まとめる表現', '気もちだけの表現', '命令', '古文'), hint: '資料をもとに書く。' };
      }
      if (n % 4 === 2) {
        return { question: `報告文で よく 使う 表現は？`, answer: reportExpressions[n % reportExpressions.length], options: d(reportExpressions[n % reportExpressions.length], 'すごく うれしい', 'たぶん ちがう', 'きっと そう'), hint: '調べたことを もとに 書く。' };
      }
      return { question: '報告文を 読みやすくするには？', answer: '順序よく まとめる', options: d('順序よく まとめる', '思いつきを 並べる', '事実を けす', '理由を なくす'), hint: '流れを 整える。' };
    case 'KOKUGO_G5_U08':
      if (n % 4 === 0) {
        return { question: '討論で 大切なのは？', answer: '相手の意見をふまえて話す', options: d('相手の意見をふまえて話す', '大声で押し切る', '聞かない', '話題を 変える'), hint: '意見を比べる。' };
      }
      if (n % 4 === 1) {
        return { question: '討論で りゆうを つけるのは なぜ？', answer: '意見を わかりやすくするため', options: d('意見を わかりやすくするため', '早く終わるため', '声を大きくするため', '字をふやすため'), hint: '根拠があると伝わる。' };
      }
      if (n % 4 === 2) {
        return { question: '討論で しては いけないことは？', answer: '相手を さえぎる', options: d('相手を さえぎる', '理由を 言う', '聞いて メモを とる', '相手の意見を たしかめる'), hint: '話し合いの ルール。' };
      }
      return { question: '討論を よくするために 必要なのは？', answer: '根拠を もって話す', options: d('根拠を もって話す', '思いつきだけで 話す', '話題を かえる', '相手の話を 聞かない'), hint: '理由や 事実を そえる。' };
    case 'KOKUGO_G5_U09':
      if (n % 4 === 0) {
        return { question: 'スピーチで 大切なのは？', answer: '聞き手を 意識して 話す', options: d('聞き手を 意識して 話す', '下だけ見る', '急に終わる', '同じことだけ言う'), hint: '相手に伝える。' };
      }
      if (n % 4 === 1) {
        return { question: 'スピーチの くみ立てで よいのは？', answer: 'はじめ・中・おわり', options: d('はじめ・中・おわり', '中だけ', 'おわりだけ', '題名だけ'), hint: 'まとまりを作る。' };
      }
      if (n % 4 === 2) {
        return { question: `「${speechThemes[n % speechThemes.length]}」を スピーチするとき 大切なのは？`, answer: '聞く人に わかる 順で話す', options: d('聞く人に わかる 順で話す', '思いついた順にだけ 話す', '小さい声で 話す', '下だけ 見る'), hint: '構成を 考える。' };
      }
      return { question: 'スピーチで 伝わりやすいのは？', answer: '理由や 例を 入れる', options: d('理由や 例を 入れる', '同じ文を くり返す', '急に 終わる', '題だけ 読む'), hint: '聞き手が 理解しやすい。' };
    default:
      return { question: '国語で のばしたい力は？', answer: '考えを ことばで 伝える力', options: d('考えを ことばで 伝える力', '走る力', '計算だけの力', '地図を読む力'), hint: '読む・書く・話す・聞く。' };
  }
};

fillGeneratedUnitProblems(KOKUGO_G5_UNIT_DATA, makeUnitProblem);

export const KOKUGO_G5_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G5_1: Object.values(KOKUGO_G5_UNIT_DATA).flat(),
  ...KOKUGO_G5_UNIT_DATA,
};
