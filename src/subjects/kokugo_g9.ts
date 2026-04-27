import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

export const KOKUGO_G9_UNIT_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G9_U01: [], KOKUGO_G9_U02: [], KOKUGO_G9_U03: [], KOKUGO_G9_U04: [], KOKUGO_G9_U05: [], KOKUGO_G9_U06: [],
  KOKUGO_G9_U07: [], KOKUGO_G9_U08: [], KOKUGO_G9_U09: [], KOKUGO_G9_U10: [], KOKUGO_G9_U11: [], KOKUGO_G9_U12: [],
};

const classicalThemes = ['時代背景', '人物の生き方', '表現の美しさ', 'ものの見方'];
const speechPurposes = ['自分の考えを伝える', '調べたことを報告する', '聞き手に行動をうながす', '体験を共有する'];
const thesisSteps = ['主張', '根拠', '反論への対応', '結論'];
const storyPassages = [
  { text: '同じ景色の描写でも、 その前後で 受ける印象が 大きくちがう。', answer: '表現と人物像の関係' },
  { text: '直接は 書かれていないが、 登場人物の選択から 生き方が見える。', answer: '人物像' },
  { text: '語り手の見方が変わることで、 読者が受け取る人物像も変化していく。', answer: '表現と人物像の関係' },
  { text: '会話は短いが、 その沈黙に これまでの対立と理解がにじんでいる。', answer: '人物像' },
  { text: 'くり返される風景描写が、 登場人物の孤独と再生の両方を映し出している。', answer: '表現と人物像の関係' },
  { text: '選んだことばは少ないが、 その言い回しから人物の価値観がはっきり見える。', answer: '人物像' },
  { text: '結末の描写を読み返すと、 冒頭の場面が別の意味を持ちはじめる。', answer: '表現と人物像の関係' },
];
const explanatoryPassages = [
  { text: '便利さを求めるだけでなく、 その結果として失われるものにも目を向けるべきだと筆者は述べている。', answer: '主張がどう組み立てられているか' },
  { text: '第一段落で問題を示し、 次の段落で反対意見を取り上げ、 その後で再反論して結論へ進んでいる。', answer: '段落どうしの関係' },
  { text: '統計資料と具体例を合わせて示すことで、 筆者の考えを支える根拠が強くなっている。', answer: '根拠や具体例' },
  { text: '新しい技術を受け入れるときは、 利便性だけでなく社会への影響も同時に考えるべきだと論じている。', answer: '主張がどう組み立てられているか' },
  { text: '問題提起のあとに比較、 さらに反論への応答を置くことで、 論の流れが明確になっている。', answer: '段落どうしの関係' },
  { text: '調査結果、 専門家の意見、 身近な事例の三つを示すことで、 主張の裏づけを強めている。', answer: '根拠や具体例' },
];

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
  switch (unitId) {
    case 'KOKUGO_G9_U01':
      if (n % 4 === 0) return { question: '物語文で 深く読むとき 大切なのは？', answer: '表現と人物像の関係', options: d('表現と人物像の関係', '筆者の主張', '文法の活用', '段落構成'), hint: '描写の意味を考える。' };
      if (n % 4 === 1) return { question: '物語文の描写に 注目すると わかることは？', answer: '人物像や心情', options: d('人物像や心情', '接続語の役割', '要約の書き方', '古語の読み'), hint: 'ことばの選び方に注目。' };
      if (n % 4 === 2) return { question: `「${storyPassages[n % storyPassages.length].text}」から 読み取るのは？`, answer: storyPassages[n % storyPassages.length].answer, options: d(storyPassages[n % storyPassages.length].answer, '筆者の主張', '段落の役割', '漢文の訓読'), hint: 'えがき方の意味を考える。', audioPrompt: { text: storyPassages[n % storyPassages.length].text, lang: 'ja-JP', autoPlay: true } };
      return { question: '人物像を とらえる 手がかりは？', answer: '行動・会話・描写', options: d('行動・会話・描写', '主語・述語だけ', '段落番号', '画数'), hint: '複数の表現を結ぶ。' };
    case 'KOKUGO_G9_U02':
      if (n % 4 === 0) return { question: '説明文で つかむべきものは？', answer: '論の展開', options: d('論の展開', '登場人物', '会話の量', '季節だけ'), hint: '主張がどう進むか。' };
      if (n % 4 === 1) return { question: '論の展開を つかむ ときに 見るものは？', answer: '段落どうしの関係', options: d('段落どうしの関係', '場面転換', '会話文の数', '季語'), hint: '主張と根拠のつながり。' };
      if (n % 4 === 2) {
        const passage = explanatoryPassages[n % explanatoryPassages.length];
        return { question: `「${passage.text}」から つかむと よいのは？`, answer: passage.answer, options: d(passage.answer, '人物像', '心情の変化', '品詞の活用'), hint: '論理の支え。', audioPrompt: { text: passage.text, lang: 'ja-JP', autoPlay: true } };
      }
      return { question: '説明文で 大切なのは？', answer: '主張がどう組み立てられているか', options: d('主張がどう組み立てられているか', '登場人物の数', '時刻表', '値段'), hint: '論理の流れ。' };
    case 'KOKUGO_G9_U03':
      if (n % 4 === 0) return { question: '短歌・俳句を 読むとき ちゅうもくするものは？', answer: '表現と心情', options: d('表現と心情', '計算式', '地図記号', '値段'), hint: 'ことばの選び方。' };
      if (n % 4 === 1) return { question: '詩を 読むとき ちゅうもくするものは？', answer: 'リズムや比ゆ', options: d('リズムや比ゆ', '画数だけ', '地図だけ', '会話だけ'), hint: 'ことばの働き。' };
      if (n % 4 === 2) return { question: '短い詩形の よさは？', answer: '少ない言葉で 深い思いを表せる', options: d('少ない言葉で 深い思いを表せる', '計算が速くなる', '図形が描ける', '地図が読める'), hint: '言葉を選びぬく。' };
      return { question: '詩歌で 比ゆに 注目する 理由は？', answer: '心情や印象を 深くつかむため', options: d('心情や印象を 深くつかむため', '画数を増やすため', '順番を変えるため', '地図を読むため'), hint: '表現の効果。' };
    case 'KOKUGO_G9_U04':
      if (n % 4 === 0) return { question: '古典文学を 読むとき 大切なのは？', answer: '時代背景と表現', options: d('時代背景と表現', '今のニュースだけ', '地図だけ', '数式だけ'), hint: '作品が生まれた背景。' };
      if (n % 4 === 1) return { question: '古典文学で 時代背景を 知る よさは？', answer: '登場人物の考え方が わかる', options: d('登場人物の考え方が わかる', '計算がしやすい', '画数が増える', '地図が読める'), hint: '当時の価値観。' };
      if (n % 4 === 2) return { question: `古典文学で「${classicalThemes[n % classicalThemes.length]}」に 注目するのは なぜ？`, answer: '作品理解を 深めるため', options: d('作品理解を 深めるため', '英語にするため', '図形にするため', '数字を増やすため'), hint: '表現と背景を結ぶ。' };
      return { question: '古典文学を 読む とき よいのは？', answer: '現代と比べながら考える', options: d('現代と比べながら考える', '題だけ見る', '会話だけ探す', '数字だけ探す'), hint: '時代差に気づく。' };
    case 'KOKUGO_G9_U05':
      if (n % 4 === 0) return { question: '漢文の名文を 読むとき 大切なのは？', answer: '訓読と内容理解', options: d('訓読と内容理解', '英作文', '俳句の季語', '地図帳'), hint: '思想や教えも読む。' };
      if (n % 4 === 1) return { question: '漢文の内容理解で 大切なのは？', answer: 'ことばの意味と文脈', options: d('ことばの意味と文脈', '画数だけ', '紙の色', '値段'), hint: '何を述べているか。' };
      if (n % 4 === 2) return { question: '漢文の名文を 学ぶ よさは？', answer: '昔の考え方や教えに ふれられる', options: d('昔の考え方や教えに ふれられる', '地図が読める', '図形が描ける', '計算が速くなる'), hint: '思想や教訓。' };
      return { question: '訓読が 大切な 理由は？', answer: '意味の通る日本語で 読むため', options: d('意味の通る日本語で 読むため', '会話にするため', '英語にするため', '字を減らすため'), hint: '読み下しの基礎。' };
    case 'KOKUGO_G9_U06':
      if (n % 4 === 0) return { question: '文の構造を 調べる 目的は？', answer: '意味のつながりを 正しくとらえるため', options: d('意味のつながりを 正しくとらえるため', '字を増やすため', '文を消すため', '音を消すため'), hint: '主語・述語・修飾関係。' };
      if (n % 4 === 1) return { question: '文法を 学ぶと 役立つことは？', answer: 'より正確に 読み書きできる', options: d('より正確に 読み書きできる', '走るのが速くなる', '色ぬりが上手になる', '地図が読める'), hint: '表現力の基礎。' };
      if (n % 4 === 2) return { question: '文の構造を とらえると わかりやすいのは？', answer: '修飾の関係', options: d('修飾の関係', '地図記号', '季語', '値段'), hint: 'どの語がどこにかかるか。' };
      return { question: '文法を 学ぶ 目的として 合うのは？', answer: '表現を 正確にする', options: d('表現を 正確にする', '文をなくす', '音を小さくする', '地図を描く'), hint: '読む・書くの基礎。' };
    case 'KOKUGO_G9_U07':
      if (n % 4 === 0) return { question: '漢字の読み書きで 大切なのは？', answer: '意味と用法を考えて使うこと', options: d('意味と用法を考えて使うこと', '形だけ写すこと', '音だけ覚えること', '一度も使わないこと'), hint: '文脈に合う字。' };
      if (n % 4 === 1) return { question: '漢字を 正しく使う 効果は？', answer: '意味が 正確に伝わる', options: d('意味が 正確に伝わる', '文が消える', '音がなくなる', '会話だけになる'), hint: '適切な表記。' };
      if (n % 4 === 2) return { question: '漢字学習で よいのは？', answer: '熟語や文章で 用法を確かめる', options: d('熟語や文章で 用法を確かめる', '形だけ 覚える', '一回だけ 書く', '音だけ 覚える'), hint: '意味と使い方を結ぶ。' };
      return { question: '漢字の力が 役立つのは？', answer: '読解と表現の両方', options: d('読解と表現の両方', '色ぬりだけ', '走るときだけ', '地図だけ'), hint: '国語全体の基礎。' };
    case 'KOKUGO_G9_U08':
      if (n % 4 === 0) return { question: '要約で 必要なのは？', answer: '筆者の考えと流れを保つこと', options: d('筆者の考えと流れを保つこと', '例だけ残すこと', '題だけ書くこと', '順番を変えること'), hint: '短くしても筋道を残す。' };
      if (n % 4 === 1) return { question: '要約で けずることが 多いのは？', answer: '細かな具体例', options: d('細かな具体例', '主張', '重要な根拠', '結論'), hint: '情報をしぼる。' };
      if (n % 4 === 2) return { question: '要約するとき よいのは？', answer: '段落の要点を つないでまとめる', options: d('段落の要点を つないでまとめる', '会話だけ集める', '題だけ書く', '順番を入れかえる'), hint: '論の流れを保つ。' };
      return { question: '要約の 目的は？', answer: '内容を 短く正確に伝える', options: d('内容を 短く正確に伝える', '文章を長くする', '会話にする', '題だけにする'), hint: '要点整理。' };
    case 'KOKUGO_G9_U09':
      if (n % 4 === 0) return { question: '論説文を 書くとき 必要なのは？', answer: '主張・根拠・結論', options: d('主張・根拠・結論', '会話だけ', '題名だけ', '感想だけ'), hint: '論理的な文章。' };
      if (n % 4 === 1) return { question: '論説文で 説得力を 高めるには？', answer: '根拠を 明確に示す', options: d('根拠を 明確に示す', '理由をぬく', '順序をなくす', '会話だけにする'), hint: '論理の支え。' };
      if (n % 4 === 2) return { question: `論説文の 構成要素として 合うのは？`, answer: thesisSteps[n % thesisSteps.length], options: d(thesisSteps[n % thesisSteps.length], '会話', '季語', '地図記号'), hint: '論の組み立て。' };
      return { question: '論説文を わかりやすくするには？', answer: '筋道を 立てて書く', options: d('筋道を 立てて書く', '思いつきを並べる', '題だけ書く', '会話だけにする'), hint: '論理展開を意識する。' };
    case 'KOKUGO_G9_U10':
      if (n % 4 === 0) return { question: 'スピーチで 大切なのは？', answer: '目的に合わせて 構成すること', options: d('目的に合わせて 構成すること', '下だけ見ること', '急に終えること', '同じことだけ言うこと'), hint: '聞き手と目的。' };
      if (n % 4 === 1) return { question: 'スピーチの 目的を 考える よさは？', answer: '内容の組み立てが はっきりする', options: d('内容の組み立てが はっきりする', '声がなくなる', '文が消える', '会話だけになる'), hint: '伝える内容を選べる。' };
      if (n % 4 === 2) return { question: `スピーチの 目的として 合うのは？`, answer: speechPurposes[n % speechPurposes.length], options: d(speechPurposes[n % speechPurposes.length], '計算を速くする', '図形を描く', '色をぬる'), hint: '何のために話すか。' };
      return { question: 'スピーチを わかりやすくするには？', answer: '聞き手に合う例を入れる', options: d('聞き手に合う例を入れる', '同じ話をくり返す', '急に終える', '下だけを見る'), hint: '目的と聞き手を意識する。' };
    case 'KOKUGO_G9_U11':
      if (n % 4 === 0) return { question: '討論で 大切なのは？', answer: '根拠を示して意見を交わすこと', options: d('根拠を示して意見を交わすこと', '相手をさえぎること', '聞かないこと', '自分だけ話すこと'), hint: '論理的なやりとり。' };
      if (n % 4 === 1) return { question: '討論で よい たいどは？', answer: '相手の意見を受け止めて考える', options: d('相手の意見を受け止めて考える', 'すぐ否定する', '聞かない', '自分だけ話す'), hint: '対話の基本。' };
      if (n % 4 === 2) return { question: '討論で 目ざすものは？', answer: 'よりよい結論', options: d('よりよい結論', '勝ち負けだけ', '沈黙', '話題をそらすこと'), hint: '意見交流の目的。' };
      return { question: '討論を よくするために 必要なのは？', answer: '論点を そろえること', options: d('論点を そろえること', '関係ない話をすること', '大声で押し切ること', '理由を言わないこと'), hint: '何について話すかを保つ。' };
    case 'KOKUGO_G9_U12':
      if (n % 4 === 0) return { question: '卒業論文・発表で 大切なのは？', answer: '調べたことを 筋道立てて伝えること', options: d('調べたことを 筋道立てて伝えること', '数字だけ並べること', '題だけ書くこと', '会話だけにすること'), hint: '調査・整理・発表。' };
      if (n % 4 === 1) return { question: '卒業論文で 必要なのは？', answer: '調査結果と自分の考えを結ぶこと', options: d('調査結果と自分の考えを結ぶこと', '感想だけ書くこと', '題だけ書くこと', '会話だけにすること'), hint: '資料にもとづく考察。' };
      if (n % 4 === 2) return { question: '発表資料を 用意する よさは？', answer: '調べた内容が 伝わりやすくなる', options: d('調べた内容が 伝わりやすくなる', '話がなくなる', '順番が消える', '声が出なくなる'), hint: '視覚的な補助。' };
      return { question: '卒業論文・発表を まとめる とき よいのは？', answer: '調査・整理・結論を つなげる', options: d('調査・整理・結論を つなげる', '思いつきを並べる', '題だけにする', '会話だけにする'), hint: '筋道を意識する。' };
    default: return { question: '国語で 目ざす力は？', answer: 'ことばで 深く考え、伝える力', options: d('ことばで 深く考え、伝える力', '色をぬる力', '走る力', '計算だけの力'), hint: '総合的な言語活動。' };
  }
};

fillGeneratedUnitProblems(KOKUGO_G9_UNIT_DATA, makeUnitProblem);

export const KOKUGO_G9_DATA: Record<string, GeneralProblem[]> = {
  KOKUGO_G9_1: Object.values(KOKUGO_G9_UNIT_DATA).flat(),
  ...KOKUGO_G9_UNIT_DATA,
};
