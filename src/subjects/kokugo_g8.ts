import { GeneralProblem, d } from './utils';

export const KOKUGO_G8_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G8_U01: [], KOKUGO_G8_U02: [], KOKUGO_G8_U03: [], KOKUGO_G8_U04: [], KOKUGO_G8_U05: [], KOKUGO_G8_U06: [],
  KOKUGO_G8_U07: [], KOKUGO_G8_U08: [], KOKUGO_G8_U09: [], KOKUGO_G8_U10: [], KOKUGO_G8_U11: [],
};

const poetryTypes = ['短歌', '俳句', '詩', '短歌'];
const presentationPoints = ['資料', '構成', '声の大きさ', '視線'];
const discussionGoals = ['考えを深める', 'よりよい案を見つける', '意見を比べる', '共通点を見つける'];
const storyPassages = [
  { text: '二人の会話の しかたが 変わり、 そのあとの 行動も 変わった。', answer: '人物関係の変化' },
  { text: '表面は 明るくふるまっているが、 心の中では 迷っている。', answer: '心情' },
  { text: '同じ言葉でも、 場面が変わると 受け取られ方が大きく変わる。', answer: '展開' },
  { text: '目立たないしぐさが、 相手との距離の変化を表している。', answer: '人物関係の変化' },
  { text: '以前は言えなかった言葉を 口にしたことで、 人物の関係が動き出す。', answer: '人物関係の変化' },
  { text: '静かな返事の中に、 迷いと決意の両方が読み取れる。', answer: '心情' },
  { text: '章の切れ目で視点が変わり、 物語の見え方も大きく変化する。', answer: '展開' },
];
const explanatoryPassages = [
  { text: '食品ロスを減らすには、 買いすぎを防ぎ、 必要な量だけ使う工夫が必要だ。', answer: '筆者の主張' },
  { text: 'アンケート結果を示したあとで理由を説明することで、 主張の確かさが高まっている。', answer: '主張の確かさ' },
  { text: '第一段落は問題提起、 第二段落と第三段落は根拠、 最後はまとめの役割をもつ。', answer: '段落ごとの役割を 考える' },
  { text: '地域で使える電力をふやすには、 再生可能エネルギーの活用が必要だと筆者は述べている。', answer: '筆者の主張' },
  { text: '資料の数字と実際の例を合わせて示すことで、 主張に具体性が生まれている。', answer: '主張の確かさ' },
  { text: 'はじめに課題を示し、 途中で比較し、 最後に意見をまとめる構成になっている。', answer: '段落ごとの役割を 考える' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G8_U01':
      if (n % 4 === 0) return { question: '物語文で 読み取るものは？', answer: '人物の関係や心情', options: d('人物の関係や心情', '筆者の主張', '段落構成', '文法用語'), hint: '表現の工夫にも注目。' };
      if (n % 4 === 1) return { question: '物語文で 場面を 整理すると つかみやすいのは？', answer: '展開', options: d('展開', '要約', '活用', '熟語の意味'), hint: 'できごとの流れ。' };
      if (n % 4 === 2) return { question: `「${storyPassages[n % storyPassages.length].text}」から わかるのは？`, answer: storyPassages[n % storyPassages.length].answer, options: d(storyPassages[n % storyPassages.length].answer, '筆者の主張', '段落の役割', '品詞の種類'), hint: '会話や行動に注目。', audioPrompt: { text: storyPassages[n % storyPassages.length].text, lang: 'ja-JP', autoPlay: true } };
      return { question: '物語文を 深く読む には？', answer: '心情の変化を 追う', options: d('心情の変化を 追う', '題だけ 見る', '一文だけ 読む', '字数だけ 数える'), hint: '前後の変化。' };
    case 'KOKUGO_G8_U02':
      if (n % 4 === 0) return { question: '説明文で 追うべきものは？', answer: '主張と根拠のつながり', options: d('主張と根拠のつながり', '登場人物', '会話の量', '俳句の季語'), hint: '論の進め方。' };
      if (n % 4 === 1) return { question: '説明文で まず つかむと よいものは？', answer: '筆者の主張', options: d('筆者の主張', '登場人物', '場面転換', '気温'), hint: 'いちばん言いたいこと。' };
      if (n % 4 === 2) {
        const passage = explanatoryPassages[n % explanatoryPassages.length];
        return { question: `「${passage.text}」から わかるのは？`, answer: passage.answer, options: d(passage.answer, '登場人物の変化', '心情のゆれ', '古文の表現'), hint: '理由や事例との関係。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文を 読む とき よいのは？', answer: '段落ごとの役割を 考える', options: d('段落ごとの役割を 考える', '会話だけを 見る', '最後の一字だけ 見る', '題だけ 見る'), hint: '論の構成を 追う。' };
    case 'KOKUGO_G8_U03':
      if (n % 4 === 0) return { question: '短歌の 基本の音数は？', answer: '五・七・五・七・七', options: d('五・七・五・七・七', '五・七・五', '七・七・七', '五・五・五'), hint: '短歌の形。' };
      if (n % 4 === 1) return { question: '俳句の 基本の音数は？', answer: '五・七・五', options: d('五・七・五', '五・七・五・七・七', '七・七・七', '五・五・五'), hint: '俳句の形。' };
      if (n % 4 === 2) return { question: `${poetryTypes[n % poetryTypes.length]}を 読むとき 注目するものは？`, answer: '表現の工夫', options: d('表現の工夫', '計算の順序', '地図記号', '画数だけ'), hint: '比ゆや言葉の選び方。' };
      return { question: '詩歌を 読む よさは？', answer: '短い言葉の表現を味わえる', options: d('短い言葉の表現を味わえる', '地図が読める', '計算が速くなる', '図形がかける'), hint: '表現の効果。' };
    case 'KOKUGO_G8_U04':
      if (n % 4 === 0) return { question: '古文を 読むとき 大切なのは？', answer: '現代語とのちがいを つかむこと', options: d('現代語とのちがいを つかむこと', '英語訳だけ', '会話だけ', '地図だけ'), hint: '語句や文の調子。' };
      if (n % 4 === 1) return { question: '古文で 注目するものは？', answer: '語句や表現', options: d('語句や表現', '地図記号', '温度', '計算式'), hint: '現代語との 違い。' };
      if (n % 4 === 2) return { question: '古文を 学ぶ よさは？', answer: '昔の言葉や考え方に ふれられる', options: d('昔の言葉や考え方に ふれられる', '英語が話せる', '図形が書ける', '計算が速くなる'), hint: '古典の世界を知る。' };
      return { question: '古文を 読む 手がかりとして よいのは？', answer: '現代語との共通点や違い', options: d('現代語との共通点や違い', '値段', '天気図', '時刻表'), hint: '意味をつかむため。' };
    case 'KOKUGO_G8_U05':
      if (n % 4 === 0) return { question: '漢文の訓読で 大切なのは？', answer: '返り点などのきまり', options: d('返り点などのきまり', '俳句の季語', '小説の場面分け', '英単語'), hint: '読み下しの基礎。' };
      if (n % 4 === 1) return { question: '漢文を 読むとき まず 見るものは？', answer: '返り点', options: d('返り点', '作者の年れい', '紙の色', '句点の数'), hint: '読み順を たしかめる。' };
      if (n % 4 === 2) return { question: '訓読のきまりを 学ぶ 理由は？', answer: '意味の通る日本語で 読むため', options: d('意味の通る日本語で 読むため', '英語にするため', '音楽にするため', '絵にするため'), hint: '読み下しの目的。' };
      return { question: '漢文の基礎で 大切なのは？', answer: '読み方の約束を知ること', options: d('読み方の約束を知ること', '季語を覚えること', '物語の山場を探すこと', '英単語を覚えること'), hint: '訓読の基本。' };
    case 'KOKUGO_G8_U06':
      if (n % 4 === 0) return { question: '活用がある 品詞は？', answer: '動詞', options: d('動詞', '名詞', '接続詞', '感動詞'), hint: '形が変わる。' };
      if (n % 4 === 1) return { question: '品詞を 学ぶ目的は？', answer: '文のしくみを 正しくとらえるため', options: d('文のしくみを 正しくとらえるため', '画数を増やすため', '文章を短くするため', '声を大きくするため'), hint: '文法の基礎。' };
      if (n % 4 === 2) return { question: '活用とは？', answer: 'ことばの形が変わること', options: d('ことばの形が変わること', '文字を消すこと', '文を短くすること', '漢字をひらがなにすること'), hint: '動詞・形容詞など。' };
      return { question: '文法を 学ぶ よさは？', answer: '文の成り立ちが わかる', options: d('文の成り立ちが わかる', '図形が 書ける', '速く走れる', '色をぬれる'), hint: 'ことばの仕組み。' };
    case 'KOKUGO_G8_U07':
      if (n % 4 === 0) return { question: '漢字の読み書きで 大切なのは？', answer: '文脈に合わせて使うこと', options: d('文脈に合わせて使うこと', '形だけ写すこと', '音だけ覚えること', '一度も使わないこと'), hint: '意味をふまえる。' };
      if (n % 4 === 1) return { question: '漢字を 正しく使う よさは？', answer: '意味が 正確に伝わる', options: d('意味が 正確に伝わる', '音が なくなる', '文が 消える', '会話だけになる'), hint: '表記の正確さ。' };
      if (n % 4 === 2) return { question: '漢字学習で よいのは？', answer: '熟語や文で 確かめる', options: d('熟語や文で 確かめる', '形だけ 見る', '一回だけ 書く', '音だけ 覚える'), hint: '意味と用法を 結ぶ。' };
      return { question: '読み書きが 役立つのは？', answer: '文章理解や表現', options: d('文章理解や表現', '色ぬりだけ', '走るときだけ', '図形だけ'), hint: '国語の基礎。' };
    case 'KOKUGO_G8_U08':
      if (n % 4 === 0) return { question: '要約で 大切なのは？', answer: '全体の流れをくずさず短くする', options: d('全体の流れをくずさず短くする', '例だけ残す', '題だけ書く', '順番を変える'), hint: '要点の整理。' };
      if (n % 4 === 1) return { question: '要約で けずることが 多いのは？', answer: '細かな例', options: d('細かな例', '中心の考え', '重要な根拠', '主題'), hint: '短くまとめるため。' };
      if (n % 4 === 2) return { question: '要約するとき よいのは？', answer: '段落の要点を つなぐ', options: d('段落の要点を つなぐ', '会話だけ集める', '題だけ書く', '順番をばらばらにする'), hint: '全体の流れを保つ。' };
      return { question: '要約の 目的は？', answer: '内容を 短く正確に伝える', options: d('内容を 短く正確に伝える', '文を 長くする', '会話文にする', '題だけにする'), hint: '要点をしぼる。' };
    case 'KOKUGO_G8_U09':
      if (n % 4 === 0) return { question: '意見文で 必要なのは？', answer: '根拠にもとづく主張', options: d('根拠にもとづく主張', '感想だけ', '会話だけ', '題だけ'), hint: '事実や理由をそえる。' };
      if (n % 4 === 1) return { question: '意見文で 説得力を 高めるには？', answer: '具体例や事実を そえる', options: d('具体例や事実を そえる', '理由を ぬく', '会話だけにする', '順番をなくす'), hint: '根拠を明確に。' };
      if (n % 4 === 2) return { question: '意見文の はじめに 書くことが 多いのは？', answer: '自分の考え', options: d('自分の考え', 'まとめだけ', '会話だけ', '反対意見だけ'), hint: '主張を 先に示す。' };
      return { question: '意見文の まとめで よいのは？', answer: '主張を ふり返る', options: d('主張を ふり返る', '新しい話題だけ', '無関係なこと', '会話だけ'), hint: '結論を はっきり。' };
    case 'KOKUGO_G8_U10':
      if (n % 4 === 0) return { question: '発表で 大切なのは？', answer: '資料や構成を工夫すること', options: d('資料や構成を工夫すること', '下だけ見ること', '急に終えること', '同じ話だけすること'), hint: 'わかりやすさ。' };
      if (n % 4 === 1) return { question: '発表で 資料を使う よさは？', answer: '内容が 伝わりやすくなる', options: d('内容が 伝わりやすくなる', '話が なくなる', '声が 小さくなる', '順番が 消える'), hint: '視覚的に伝える。' };
      if (n % 4 === 2) return { question: `発表で「${presentationPoints[n % presentationPoints.length]}」に 気をつけるのは なぜ？`, answer: '聞き手に わかりやすくするため', options: d('聞き手に わかりやすくするため', '早く終えるため', '字を増やすため', '話題を変えるため'), hint: '伝え方の工夫。' };
      return { question: '発表を 成功させるために 必要なのは？', answer: '構成を 考えて準備すること', options: d('構成を 考えて準備すること', '思いつきだけで 話すこと', '資料を 使わないこと', '急に話を変えること'), hint: '準備と構成。' };
    case 'KOKUGO_G8_U11':
      if (n % 4 === 0) return { question: '討論で 目ざすものは？', answer: 'よりよい考えを見いだすこと', options: d('よりよい考えを見いだすこと', '相手を負かすことだけ', '話を止めること', '自分だけ話すこと'), hint: '意見の交流。' };
      if (n % 4 === 1) return { question: '討論で 必要なのは？', answer: '根拠を もって話すこと', options: d('根拠を もって話すこと', '大声で押し切ること', '相手をさえぎること', '話題をそらすこと'), hint: '説得力につながる。' };
      if (n % 4 === 2) return { question: `討論で「${discussionGoals[n % discussionGoals.length]}」を 目ざすのは なぜ？`, answer: '意見を深めるため', options: d('意見を深めるため', '相手を困らせるため', '時間をのばすため', '話題を変えるため'), hint: '話し合いの目的。' };
      return { question: '討論で よい たいどは？', answer: '相手の意見を受け止める', options: d('相手の意見を受け止める', '聞かない', 'すぐ否定する', '自分だけ話す'), hint: '対話の基本。' };
    default: return { question: '国語で つけたい力は？', answer: 'ことばを 根拠とともに使う力', options: d('ことばを 根拠とともに使う力', '色をぬる力', '走る力', '計算だけの力'), hint: '論理的に伝える。' };
  }
};

Object.keys(KOKUGO_G8_UNIT_DATA).forEach((unitId) => {
  const problems = KOKUGO_G8_UNIT_DATA[unitId];
  while (problems.length < 20) problems.push(makeUnitProblem(unitId, problems.length));
});

export const KOKUGO_G8_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G8_1: Object.values(KOKUGO_G8_UNIT_DATA).flat(),
  ...KOKUGO_G8_UNIT_DATA,
};
