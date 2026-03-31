import { GeneralProblem, d } from './utils';

export const KOKUGO_G7_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G7_U01: [], KOKUGO_G7_U02: [], KOKUGO_G7_U03: [], KOKUGO_G7_U04: [], KOKUGO_G7_U05: [], KOKUGO_G7_U06: [],
  KOKUGO_G7_U07: [], KOKUGO_G7_U08: [], KOKUGO_G7_U09: [], KOKUGO_G7_U10: [], KOKUGO_G7_U11: [], KOKUGO_G7_U12: [],
};

const poemFeatures = ['ことばのひびき', '比ゆ', 'くり返し', '行分け'];
const classicalPoints = ['現代語とのちがい', '言い回し', '文の調子', '歴史的仮名づかい'];
const speechOpeners = ['今日は、私が考えたことを話します。', 'これから、学校生活について話します。', '私の経験から学んだことを話します。', 'みなさんに伝えたいことがあります。'];
const storyPassages = [
  { text: '主人公は ことばには 出さないが、 手を にぎりしめていた。', answer: '心情の手がかり' },
  { text: '同じ場所でも、 前の場面とは まったくちがう雰囲気になった。', answer: '場面の変化' },
  { text: '会話の調子が変わり、 二人の関係が少しずつ近づいていく。', answer: '展開' },
  { text: '行動は小さいが、 ためらいながら進んだことに気持ちが表れている。', answer: '心情の手がかり' },
  { text: 'ラストの一言で、 それまでのすれちがいがほどけたことがわかる。', answer: '展開' },
  { text: '表情の説明はないが、 ことばの選び方から不安がにじんでいる。', answer: '心情の手がかり' },
  { text: '昼の教室から夕方の帰り道へと移り、 場面の空気が大きく変わる。', answer: '場面の変化' },
];
const explanatoryPassages = [
  { text: 'プラスチックごみの問題を解決するには、 使う量を減らすことと 回収の仕組みを整えることが必要だ。', answer: '筆者の考え' },
  { text: 'はじめの段落で問題を示し、 中で理由を説明し、 終わりで結論をまとめている。', answer: '段落ごとの要点を 追う' },
  { text: '調査結果として数字を出すことで、 筆者の主張に具体性が生まれている。', answer: '根拠や事例' },
  { text: '公共交通を使う人が増えると、 二酸化炭素の排出をへらせると筆者は考えている。', answer: '筆者の考え' },
  { text: '第二段落では 例をあげ、 第三段落では その意味を説明している。', answer: '段落ごとの要点を 追う' },
  { text: '実験の結果を出したあとで理由を述べることで、 説明に納得しやすくなっている。', answer: '根拠や事例' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G7_U01':
      if (n % 4 === 0) return { question: '物語文で 読み取る中心は？', answer: '人物の心情と変化', options: d('人物の心情と変化', '筆者の主張', '事実と意見', '段落構成'), hint: '行動・会話・表現に注目。' };
      if (n % 4 === 1) return { question: '物語文で 場面を 整理すると つかみやすいのは？', answer: '展開', options: d('展開', '要約', '熟語の意味', '文法の活用'), hint: '出来事の流れ。' };
      if (n % 4 === 2) return { question: `「${storyPassages[n % storyPassages.length].text}」から わかるのは？`, answer: storyPassages[n % storyPassages.length].answer, options: d(storyPassages[n % storyPassages.length].answer, '筆者の主張', '段落の要点', '文法の働き'), hint: 'えがき方に 注目。', audioPrompt: { text: storyPassages[n % storyPassages.length].text, lang: 'ja-JP', autoPlay: true } };
      return { question: '物語文を 読む とき だいじなのは？', answer: '前後の変化を 比べる', options: d('前後の変化を 比べる', '題だけ 見る', '一文だけ 読む', '音読だけ する'), hint: '人物や場面の変化。' };
    case 'KOKUGO_G7_U02':
      if (n % 4 === 0) return { question: '説明文で 筆者の主張を 支えるものは？', answer: '根拠や事例', options: d('根拠や事例', '会話だけ', '登場人物', '季節だけ'), hint: '主張と根拠の関係。' };
      if (n % 4 === 1) return { question: '説明文で まず つかみたいものは？', answer: '筆者の考え', options: d('筆者の考え', '場面転換', '会話の長さ', '地図記号'), hint: '中心となる意見。' };
      if (n % 4 === 2) {
        const passage = explanatoryPassages[n % explanatoryPassages.length];
        return { question: `「${passage.text}」から つかむと よいのは？`, answer: passage.answer, options: d(passage.answer, '登場人物の心情', '場面の変化', '古語の意味'), hint: '論の流れを つかむ。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '事例の はたらきは？', answer: '主張を わかりやすくする', options: d('主張を わかりやすくする', '話題を 変える', '感想を のせる', '人物を 増やす'), hint: '根拠を 補う。' };
    case 'KOKUGO_G7_U03':
      if (n % 4 === 0) return { question: '詩を 読むとき ちゅうもくするものは？', answer: 'ことばのひびきや表現', options: d('ことばのひびきや表現', '計算の順序', '地図記号', '画数だけ'), hint: 'リズムや比ゆ。' };
      if (n % 4 === 1) return { question: `詩で「${poemFeatures[n % poemFeatures.length]}」に 注目するのは なぜ？`, answer: '表現の効果を つかむため', options: d('表現の効果を つかむため', '計算するため', '地図を読むため', '字を消すため'), hint: '詩らしい 表現。' };
      if (n % 4 === 2) return { question: '詩の ことばの くり返しから わかることは？', answer: '強く伝えたい思い', options: d('強く伝えたい思い', '時刻', '人数', '道順'), hint: '印象を 強める。' };
      return { question: '詩の 行分けに 注目すると つかみやすいのは？', answer: 'リズム', options: d('リズム', '地図', '画数', '値段'), hint: '読みの調子。' };
    case 'KOKUGO_G7_U04':
      if (n % 4 === 0) return { question: '古文の基礎で まず 大切なのは？', answer: '現代語とのちがいに気づくこと', options: d('現代語とのちがいに気づくこと', '全部暗記すること', '漢文を先に読むこと', '英語に直すこと'), hint: '文の調子や語句。' };
      if (n % 4 === 1) return { question: '古文を 読むとき ちゅうもくするものは？', answer: '言葉づかい', options: d('言葉づかい', '地図記号', '計算式', '単位'), hint: '現代語との 違い。' };
      if (n % 4 === 2) return { question: `古文の「${classicalPoints[n % classicalPoints.length]}」を 見るのは なぜ？`, answer: '文の意味を つかむため', options: d('文の意味を つかむため', '英語にするため', '音楽にするため', '図形にするため'), hint: '読み方の 手がかり。' };
      return { question: '古文の 学習で 大切なのは？', answer: '言い回しに 慣れること', options: d('言い回しに 慣れること', '全部を書きかえること', '数字だけ 覚えること', '句点を消すこと'), hint: '古い文の 調子に 慣れる。' };
    case 'KOKUGO_G7_U05':
      if (n % 4 === 0) return { question: '漢文の基礎で 使うのは？', answer: '訓読のきまり', options: d('訓読のきまり', '英作文', '俳句の季語', '地図帳'), hint: '返り点など。' };
      if (n % 4 === 1) return { question: '漢文を 読み下す ときに 見るものは？', answer: '返り点', options: d('返り点', '天気図', '句点の数', 'ページ番号'), hint: '読み順の 手がかり。' };
      if (n % 4 === 2) return { question: '訓読のきまりを 学ぶ 理由は？', answer: '意味の通る日本語で 読むため', options: d('意味の通る日本語で 読むため', '英語にするため', '字を 減らすため', '会話にするため'), hint: '読み順を 整える。' };
      return { question: '漢文の基礎で 大切なのは？', answer: '読み方の約束を 知ること', options: d('読み方の約束を 知ること', '全部暗記すること', '俳句に直すこと', '数字だけ 見ること'), hint: 'まずは 読み方。' };
    case 'KOKUGO_G7_U06':
      if (n % 4 === 0) return { question: '「主語」は 文の中で 何を表す？', answer: 'だれが・なにが', options: d('だれが・なにが', 'どうした', 'どこで', 'いつ'), hint: '文の成分。' };
      if (n % 4 === 1) return { question: '「述語」は 文の中で 何を表す？', answer: 'どうする・どんなだ', options: d('どうする・どんなだ', 'だれが', 'どこで', 'なにを'), hint: '文の中心。' };
      if (n % 4 === 2) return { question: '文の成分を 分けると 何が わかりやすい？', answer: '文の組み立て', options: d('文の組み立て', '地図の見方', '画数', '気温'), hint: '文の はたらき。' };
      return { question: '主語と述語を たしかめる よさは？', answer: '文の意味を 正しくつかめる', options: d('文の意味を 正しくつかめる', '文字が 減る', '音が 消える', '題名だけになる'), hint: '文の 中心を つかむ。' };
    case 'KOKUGO_G7_U07':
      if (n % 4 === 0) return { question: '品詞とは？', answer: '単語のはたらきによる分け方', options: d('単語のはたらきによる分け方', '文の長さ', '漢字の画数', '話の順序'), hint: '名詞・動詞など。' };
      if (n % 4 === 1) return { question: '品詞を 分けるときに 見るのは？', answer: '単語のはたらき', options: d('単語のはたらき', '文字の色', '紙の厚さ', '会話の数'), hint: '文の中での役目。' };
      if (n % 4 === 2) return { question: '「名詞」「動詞」などを まとめて 何という？', answer: '品詞', options: d('品詞', '段落', '修辞', '主題'), hint: '単語の 分類。' };
      return { question: '品詞を 学ぶ よさは？', answer: '文のしくみが わかる', options: d('文のしくみが わかる', '図形が 描ける', '速く走れる', '色が ぬれる'), hint: '文法理解につながる。' };
    case 'KOKUGO_G7_U08':
      if (n % 4 === 0) return { question: '漢字学習で 大切なのは？', answer: '文の中で 正しく使うこと', options: d('文の中で 正しく使うこと', '形だけ見ること', '一度も書かないこと', '音だけ覚えること'), hint: '読み書きと使い方。' };
      if (n % 4 === 1) return { question: '漢字の 読み書きが 役立つのは？', answer: '文章を正確に読むとき', options: d('文章を正確に読むとき', '地図をぬるとき', '走るとき', '音楽だけのとき'), hint: '内容理解につながる。' };
      if (n % 4 === 2) return { question: '漢字を 学ぶ ときに よいのは？', answer: '熟語や文で 確かめる', options: d('熟語や文で 確かめる', '形だけ 覚える', '一回しか見ない', '使わない'), hint: '意味と 用法を つかむ。' };
      return { question: '漢字を 正しく使う 効果は？', answer: '意味が はっきり伝わる', options: d('意味が はっきり伝わる', '文が 消える', '音が なくなる', '会話だけになる'), hint: '適切な表記。' };
    case 'KOKUGO_G7_U09':
      if (n % 4 === 0) return { question: '要約で 大切なのは？', answer: '中心内容を 短くまとめる', options: d('中心内容を 短くまとめる', '全文を書く', '例だけ書く', '題だけ書く'), hint: '要点をしぼる。' };
      if (n % 4 === 1) return { question: '要約で けずることが 多いのは？', answer: '細かな例', options: d('細かな例', '中心の考え', '大事な理由', '要旨'), hint: '情報を しぼる。' };
      if (n % 4 === 2) return { question: '要約するとき よいのは？', answer: '段落の要点を つなぐ', options: d('段落の要点を つなぐ', '一文目だけ 書く', '題だけ 書く', '会話だけ 書く'), hint: '全体の流れを まとめる。' };
      return { question: '要約の 目的は？', answer: '内容を 短く正確に 伝えること', options: d('内容を 短く正確に 伝えること', '文章を 長くすること', '会話にすること', '題名だけにすること'), hint: '要点整理。' };
    case 'KOKUGO_G7_U10':
      if (n % 4 === 0) return { question: '意見文で 必要なのは？', answer: '主張と理由', options: d('主張と理由', '会話だけ', '数字だけ', '題名だけ'), hint: 'なぜそう考えるか。' };
      if (n % 4 === 1) return { question: '意見文を わかりやすくするには？', answer: '根拠を はっきりさせる', options: d('根拠を はっきりさせる', '理由を ぬく', '会話だけに する', '順序を なくす'), hint: '説得力につながる。' };
      if (n % 4 === 2) return { question: '意見文の はじめに 書くことが 多いのは？', answer: '自分の考え', options: d('自分の考え', 'まとめだけ', '反対意見だけ', '会話だけ'), hint: '主張を 先に示す。' };
      return { question: '意見文の まとめで よいのは？', answer: '主張を ふり返る', options: d('主張を ふり返る', '新しい話題だけ 書く', '関係ないことを 書く', '会話だけにする'), hint: 'しめくくり。' };
    case 'KOKUGO_G7_U11':
      if (n % 4 === 0) return { question: 'スピーチで 大切なのは？', answer: '聞き手を 意識すること', options: d('聞き手を 意識すること', '下だけ見ること', '急に終えること', '同じ文をくり返すこと'), hint: '伝える相手がいる。' };
      if (n % 4 === 1) return { question: 'スピーチの はじめに あると よいものは？', answer: '話題の しょうかい', options: d('話題の しょうかい', '終わりの あいさつ', '反対意見だけ', '無言'), hint: '何について話すか。' };
      if (n % 4 === 2) return { question: 'スピーチで わかりやすいのは？', answer: '例を 入れて 話す', options: d('例を 入れて 話す', '同じ文を くり返す', '下だけ 見る', '急に終える'), hint: '聞き手が 想像しやすい。' };
      return { question: 'スピーチの 書き出しとして よいのは？', answer: speechOpeners[n % speechOpeners.length], options: d(speechOpeners[n % speechOpeners.length], 'では 終わります。', '反対です。', '何も ありません。'), hint: '話題を はっきり示す。' };
    case 'KOKUGO_G7_U12':
      if (n % 4 === 0) return { question: '話し合いで よいのは？', answer: '相手の意見を 受けて考える', options: d('相手の意見を 受けて考える', 'さえぎる', '聞かない', '話題をそらす'), hint: '対話的に進める。' };
      if (n % 4 === 1) return { question: '話し合いで しては いけないことは？', answer: '相手の話を さえぎる', options: d('相手の話を さえぎる', '理由をたしかめる', '聞いてメモをとる', '相手の意見を受ける'), hint: '進行の基本。' };
      if (n % 4 === 2) return { question: '話し合いを よくするために 必要なのは？', answer: '理由を そえて話す', options: d('理由を そえて話す', '一語だけで話す', '関係ない話をする', '急に終わる'), hint: 'わかりやすく伝える。' };
      return { question: '話し合いで だいじな たいどは？', answer: '落ち着いて 聞き合う', options: d('落ち着いて 聞き合う', '大声で 押し切る', '自分だけ 話す', '黙ったままにする'), hint: 'おたがいの意見を 尊重する。' };
    default: return { question: '国語で のばしたい力は？', answer: '考えを 筋道立てて 伝える力', options: d('考えを 筋道立てて 伝える力', '走る力', '計算だけの力', '色をぬる力'), hint: '読む・書く・話す・聞く。' };
  }
};

Object.keys(KOKUGO_G7_UNIT_DATA).forEach((unitId) => {
  const problems = KOKUGO_G7_UNIT_DATA[unitId];
  while (problems.length < 20) problems.push(makeUnitProblem(unitId, problems.length));
});

export const KOKUGO_G7_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G7_1: Object.values(KOKUGO_G7_UNIT_DATA).flat(),
  ...KOKUGO_G7_UNIT_DATA,
};
