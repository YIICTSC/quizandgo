import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G6_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G6_U01: [], KOKUGO_G6_U02: [], KOKUGO_G6_U03: [], KOKUGO_G6_U04: [], KOKUGO_G6_U05: [],
  KOKUGO_G6_U06: [], KOKUGO_G6_U07: [], KOKUGO_G6_U08: [], KOKUGO_G6_U09: [], KOKUGO_G6_U10: [],
};

const graduateThemes = ['運動会', '修学旅行', '委員会活動', 'クラブ活動'];
const proposalThemes = ['図書室を もっと使いやすくする', '校庭を きれいに使う', 'あいさつを 増やす', '休み時間の 過ごし方を 見直す'];
const speechStarts = ['今日は、私の将来の夢について話します。', 'わたしが 大切だと思うことを 話します。', '学校生活で 学んだことを 話します。', '思い出に残っていることを 話します。'];
const storyFlowWords = ['はじめ', '転機', '結末', '変化'];
const storyPassages = [
  { text: '主人公は 友だちの ことばで 勇気をもらい、 自分から 行動した。', answer: '人物の変化' },
  { text: '場面ごとに 出来事を 並べると、 物語の 流れが 見えてくる。', answer: 'できごとの流れ' },
  { text: '同じ出来事でも、 前半と後半では 主人公の受け止め方が変わっている。', answer: '展開' },
  { text: '最後の選択から、 それまでの迷いを乗りこえたことが伝わる。', answer: '人物の変化' },
  { text: '手紙を受け取った場面をさかいに、 主人公の見方が少しずつ広がっていく。', answer: '展開' },
  { text: '何も言わずに立ち上がった行動に、 これまでの成長があらわれている。', answer: '人物の変化' },
  { text: '出来事を順に追うと、 どこで気もちが切り替わったかが見えてくる。', answer: 'できごとの流れ' },
];
const explanatoryPassages = [
  { text: '海を守るためには、 ごみを減らすことと、 一人一人が 行動することが大切だ。', answer: '筆者の考え' },
  { text: '実験では 水の量を変えて 比べた。 この結果から、 日光の当たり方が成長に関係すると分かる。', answer: '理由や 事例' },
  { text: '各段落には役目があり、 はじめに話題を示し、 中で説明し、 終わりでまとめている。', answer: '段落ごとの 大事な文' },
  { text: '節電を進めるには、 一人一人の工夫と 学校全体の取り組みの両方が必要だ。', answer: '筆者の考え' },
  { text: '調べた数字を比べることで、 どの方法が効果的かを具体的に示している。', answer: '理由や 事例' },
  { text: 'はじめの段落で問いを立て、 あとの段落で答えをくわしく説明している。', answer: '段落ごとの 大事な文' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G6_U01':
      if (n % 4 === 0) {
        return { question: '漢字のまとめで 大切なのは？', answer: '読みと意味を 結びつける', options: d('読みと意味を 結びつける', '形だけ 覚える', '一度だけ 書く', '使わない'), hint: '読み書き両方。' };
      }
      if (n % 4 === 1) {
        return { question: '漢字を 文章で 使う よさは？', answer: '意味が はっきりする', options: d('意味が はっきりする', '文が 消える', '音が なくなる', '会話だけになる'), hint: '読み手に伝わりやすい。' };
      }
      if (n % 4 === 2) {
        return { question: '漢字を 学ぶ ときに よいのは？', answer: '文の中で 使って 覚える', options: d('文の中で 使って 覚える', '見ないで 書く', '一回だけ 見る', '音だけ 覚える'), hint: '使い方と いっしょに 覚える。' };
      }
      return { question: '漢字を 正しく 使う 効果は？', answer: '読み手に 正確に 伝わる', options: d('読み手に 正確に 伝わる', '文字が 減る', '意味が なくなる', '会話だけに なる'), hint: '意味を はっきり させる。' };
    case 'KOKUGO_G6_U02':
      if (n % 4 === 0) {
        return { question: '熟語や語句を 学ぶ よさは？', answer: 'ことばの意味が 深くわかる', options: d('ことばの意味が 深くわかる', '字が 減る', '文が 短くなる', '話せなくなる'), hint: 'ことばの数が 広がる。' };
      }
      if (n % 4 === 1) {
        return { question: '語句の意味を 正しく知るには？', answer: '文の中で たしかめる', options: d('文の中で たしかめる', '音だけで 決める', '長さだけ見る', '色で 決める'), hint: '使われ方を見る。' };
      }
      if (n % 4 === 2) {
        return { question: '語句を 学ぶと どんな力が のびる？', answer: '表現する力', options: d('表現する力', '走る力', '計算だけの力', '色をぬる力'), hint: 'ことばを 広く使える。' };
      }
      return { question: '熟語の意味を つかむには？', answer: '組み合わさった漢字の意味を 考える', options: d('組み合わさった漢字の意味を 考える', '字の数だけ 見る', '音だけ 覚える', '長さだけ 見る'), hint: '漢字どうしの 関係。' };
    case 'KOKUGO_G6_U03':
      if (n % 4 === 0) {
        return { question: '物語文で 読み取ることは？', answer: '人物の変化', options: d('人物の変化', '事実と意見', '筆者の主張', '段落構成'), hint: '考えや気もちの変化。' };
      }
      if (n % 4 === 1) {
        return { question: '場面ごとに 整理すると わかりやすいのは？', answer: 'できごとの流れ', options: d('できごとの流れ', '熟語の意味', '文法の活用', '漢字の成り立ち'), hint: '話の進み方。' };
      }
      if (n % 4 === 2) {
        return { question: `物語の「${storyFlowWords[n % storyFlowWords.length]}」に あたるものを つかむと 何が わかる？`, answer: '展開', options: d('展開', '主題', '要旨', '筆者の主張'), hint: '話の 流れを つかむ。' };
      }
      return { question: `「${storyPassages[n % storyPassages.length].text}」から つかむと よいのは？`, answer: storyPassages[n % storyPassages.length].answer, options: d(storyPassages[n % storyPassages.length].answer, '筆者の考え', '段落の要点', 'ことばの敬語'), hint: '物語の中心に 注目する。', audioPrompt: { text: storyPassages[n % storyPassages.length].text, lang: 'ja-JP', autoPlay: true } };
    case 'KOKUGO_G6_U04':
      if (n % 4 === 0) {
        return { question: '説明文で まず つかみたいものは？', answer: '筆者の考え', options: d('筆者の考え', '会話の数', '登場人物', '背景の絵'), hint: '何を言いたいか。' };
      }
      if (n % 4 === 1) {
        return { question: '説明文で 事例を読む 目的は？', answer: '考えを 支えるため', options: d('考えを 支えるため', '長くするため', 'むずかしくするため', '会話をふやすため'), hint: '主張との関係。' };
      }
      if (n % 4 === 2) {
        const passage = explanatoryPassages[n % explanatoryPassages.length];
        return { question: `「${passage.text}」から たしかめると よいのは？`, answer: passage.answer, options: d(passage.answer, '登場人物の心情', '会話の言い方', '品詞の名前'), hint: '説明の中心を とらえる。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文で 筆者の考えを はっきりさせるものは？', answer: '理由や 事例', options: d('理由や 事例', '会話だけ', '題名だけ', '場面転換'), hint: '主張を 支える 内容。' };
    case 'KOKUGO_G6_U05':
      if (n % 4 === 0) {
        return { question: '要旨と要約の ちがいで、 要旨は？', answer: '中心の考え', options: d('中心の考え', '短くした全文', '一文目だけ', '題名だけ'), hint: '筆者の主張に近い。' };
      }
      if (n % 4 === 1) {
        return { question: '要約は どのように書く？', answer: '大事な内容を 短くまとめる', options: d('大事な内容を 短くまとめる', '全文を写す', '例だけ書く', '会話だけ書く'), hint: '情報をしぼる。' };
      }
      if (n % 4 === 2) {
        return { question: '要約で けずることが 多いのは？', answer: '細かい例', options: d('細かい例', '中心の考え', '大事な理由', '要旨'), hint: '短く まとめるため。' };
      }
      return { question: '要旨を つかむ よさは？', answer: '文章全体の中心が わかる', options: d('文章全体の中心が わかる', '字が 消える', '文が 長くなる', '会話だけになる'), hint: '全体を まとめて とらえる。' };
    case 'KOKUGO_G6_U06':
      if (n % 4 === 0) {
        return { question: '意見文で 大切なのは？', answer: '意見と根拠を はっきりさせる', options: d('意見と根拠を はっきりさせる', '感想だけ書く', '会話だけにする', '題名を書かない'), hint: '主張と理由。' };
      }
      if (n % 4 === 1) {
        return { question: '意見文の まとめに 入れると よいものは？', answer: '自分の考えの 再確認', options: d('自分の考えの 再確認', '新しい話題だけ', '無関係なこと', '例だけ'), hint: 'しめくくり。' };
      }
      if (n % 4 === 2) {
        return { question: '意見文を 説得力のある文に するには？', answer: '根拠を 示す', options: d('根拠を 示す', '理由を ぬく', '題だけ 書く', '思いつきだけに する'), hint: '理由や 例を そえる。' };
      }
      return { question: '意見文の はじめに 書くことが 多いのは？', answer: '自分の考え', options: d('自分の考え', 'まとめだけ', '会話だけ', '反対意見だけ'), hint: '何を 主張するか 先に示す。' };
    case 'KOKUGO_G6_U07':
      if (n % 4 === 0) {
        return { question: '提案文で 伝えるべきことは？', answer: '何をどうしたいか', options: d('何をどうしたいか', 'だれが泣いたか', '昔話だけ', '数字だけ'), hint: '目的と方法。' };
      }
      if (n % 4 === 1) {
        return { question: '提案文に 必要なのは？', answer: '相手が 納得できる理由', options: d('相手が 納得できる理由', '大声', '長いだけの文', '会話だけ'), hint: '相手を動かす文章。' };
      }
      if (n % 4 === 2) {
        return { question: `「${proposalThemes[n % proposalThemes.length]}」の ような文で 大切なのは？`, answer: '具体的な方法', options: d('具体的な方法', '昔話', '気もちだけ', '数字だけ'), hint: 'どうするかを 示す。' };
      }
      return { question: '提案文を わかりやすくするには？', answer: '目的と方法を つなげる', options: d('目的と方法を つなげる', '理由を ぬく', '会話だけに する', '順序を なくす'), hint: '何のために、どうするか。' };
    case 'KOKUGO_G6_U08':
      if (n % 4 === 0) {
        return { question: '討論で よいのは？', answer: '反対意見も 聞いて考える', options: d('反対意見も 聞いて考える', '相手の話を切る', '自分だけ話す', '何も言わない'), hint: '多面的に考える。' };
      }
      if (n % 4 === 1) {
        return { question: '討論で 根拠を出す 理由は？', answer: '意見の説得力を 高めるため', options: d('意見の説得力を 高めるため', '時間をのばすため', '字をふやすため', '声を小さくするため'), hint: '理由・例をつける。' };
      }
      if (n % 4 === 2) {
        return { question: '討論で しては いけないことは？', answer: '相手の話を さえぎる', options: d('相手の話を さえぎる', '理由を 言う', '聞いて メモを とる', '意見を たしかめる'), hint: '話し合いの ルール。' };
      }
      return { question: '討論で 大切な たいどは？', answer: '根拠を もって 落ち着いて話す', options: d('根拠を もって 落ち着いて話す', '大声で 押し切る', '話題を 変える', '相手を 見ない'), hint: '相手に 伝わる 話し方。' };
    case 'KOKUGO_G6_U09':
      if (n % 4 === 0) {
        return { question: 'スピーチで 大切なのは？', answer: '聞き手に 合わせて話す', options: d('聞き手に 合わせて話す', '早口だけ', 'うつむく', '同じことだけ'), hint: '伝わる話し方。' };
      }
      if (n % 4 === 1) {
        return { question: 'スピーチの はじめに あると よいものは？', answer: '話題の しょうかい', options: d('話題の しょうかい', '終わりの あいさつ', '反対意見だけ', '無言'), hint: '何について話すか。' };
      }
      if (n % 4 === 2) {
        return { question: `スピーチの はじめとして よいのは？`, answer: speechStarts[n % speechStarts.length], options: d(speechStarts[n % speechStarts.length], 'では 終わります。', '何も 話しません。', '反対です。'), hint: '聞き手に 話題を 示す。' };
      }
      return { question: 'スピーチを わかりやすくするには？', answer: '例を 入れて 話す', options: d('例を 入れて 話す', '同じ文を くり返す', '急に 終わる', '下だけ 見る'), hint: '聞き手が 想像しやすい。' };
    case 'KOKUGO_G6_U10':
      if (n % 4 === 0) {
        return { question: '卒業文集で 大切なのは？', answer: '思い出や考えを 伝えること', options: d('思い出や考えを 伝えること', '数字だけ', '一言だけ', '句点を つけない'), hint: 'これまでをふり返る。' };
      }
      if (n % 4 === 1) {
        return { question: '卒業文集に 向く内容は？', answer: '学校生活で 心に残ったこと', options: d('学校生活で 心に残ったこと', '今日の天気だけ', '買い物の値段だけ', '計算式だけ'), hint: '思い出を 文章にする。' };
      }
      if (n % 4 === 2) {
        return { question: `卒業文集に 書くと よい題材は？`, answer: graduateThemes[n % graduateThemes.length], options: d(graduateThemes[n % graduateThemes.length], '今日の 気温', '買い物の 値段', '計算ドリルの答え'), hint: '学校生活を ふり返る。' };
      }
      return { question: '卒業文集を わかりやすくするには？', answer: '思い出と そのときの考えを 結ぶ', options: d('思い出と そのときの考えを 結ぶ', 'できごとだけ 並べる', '一文で 終わる', '句点を ぬく'), hint: '経験と 思いを つなげる。' };
    default:
      return { question: '国語で 大切な力は？', answer: '相手に伝わるように考える力', options: d('相手に伝わるように考える力', '走る力', '道具だけ使う力', '色をぬる力'), hint: '読む・書く・話す・聞く。' };
  }
};

fillGeneratedUnitProblems(KOKUGO_G6_UNIT_DATA, makeUnitProblem);

export const KOKUGO_G6_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G6_1: Object.values(KOKUGO_G6_UNIT_DATA).flat(),
  ...KOKUGO_G6_UNIT_DATA,
};
