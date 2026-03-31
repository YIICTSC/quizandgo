
import { GeneralProblem, d } from './utils';

// --- 6年生 1学期: 対称・文字と式・分数の掛け算割り算 (50問) ---
const MATH_G6_1: GeneralProblem[] = [
        { question: "1つの直線を折り目にして重ねた時、ぴったり重なる図形を？", answer: "線対称（せんたいしょう）な図形", options: d("線対称", "点対称", "非対称", "正多角形"), hint: "鏡（かがみ）あわせのような形だよ。" },
        { question: "線対称な図形で、折り目にした直線を何という？", answer: "対称の軸（じく）", options: d("対称の軸", "対称の中心", "対角線", "底辺"), hint: "図形を半分に分ける線だね。" },
        { question: "ある点を中心に180度回すと重なる図形を？", answer: "点対称（てんたいしょう）な図形", options: d("点対称", "線対称", "拡大図", "縮図"), hint: "逆さまにしても同じ形に見えるよ。" },
        { question: "点対称な図形で、回す中心にした点を何という？", answer: "対称の中心", options: d("対称の中心", "対称の軸", "頂点", "重心"), hint: "図形のちょうど真ん中の点だよ。" },
        { question: "正方形は「線対称」な図形と言える？", answer: "言える（軸は4本）", options: d("言える", "言えない", "たまに言える", "三角形による"), hint: "縦、横、斜め、どこで折っても重なるね。" },
        { question: "正方形は「点対称」な図形と言える？", answer: "言える", options: d("言える", "言えない", "逆なら言える", "わからない"), hint: "180度回すとぴったり重なるよ。" },
        { question: "平行四辺形は「線対称」な図形？", answer: "いいえ", options: d("いいえ", "はい", "ひし形ならはい", "長方形ならいいえ"), hint: "意外と折っても重ならないんだ。" },
        { question: "平行四辺形は「点対称」な図形？", answer: "はい", options: d("はい", "いいえ", "たまに", "ひし形だけ"), hint: "中心で回すと重なるよ。" },
        { question: "文字を使った式。 1つx円のノート5冊の代金は？", answer: "x × 5", options: d("x × 5", "x ＋ 5", "5 ÷ x", "x － 5"), hint: "個数をかけるんだね。" },
        { question: "x ＝ 100 のとき、 x × 5 の値は？", answer: "500", options: d("500", "105", "20", "50"), hint: "100をxにあてはめて計算して。" },
        { question: "「x ＋ 20 ＝ 50」 x はいくつ？", answer: "30", options: d("30", "70", "20", "100"), hint: "50 － 20 を計算しよう。" },
        { question: "「(2/3) × (4/5) ＝ 」 答えは？", answer: "8/15", options: d("8/15", "6/8", "10/12", "2/15"), hint: "分子どうし、分母どうしをかけよう。" },
        { question: "「(3/4) × 2 ＝ 」 答えは？（約分して）", answer: "3/2 (1と1/2)", options: d("3/2", "6/4", "3/8", "1/2"), hint: "2 と 4 で約分できるよ。" },
        { question: "分数の掛け算。 整数をかけるときはどこにかける？", answer: "分子（上の数）", options: d("分子", "分母", "両方", "かけない"), hint: "3/4 × 2 ＝ (3×2)/4 だよ。" },
        { question: "「(2/3) ÷ (4/5) ＝ 」 答えは？", answer: "5/6", options: d("5/6", "8/15", "10/12", "6/5"), hint: "後ろをひっくり返してかけよう。" },
        { question: "逆数（ぎゃくすう）とは、かけると何になる数？", answer: "1", options: d("1", "0", "10", "自分自身"), hint: "3/4 の逆数は 4/3 だね。" },
        { question: "「5」の逆数は何？", answer: "1/5", options: d("1/5", "5/1", "0.5", "1"), hint: "5 は 5/1 と考えよう。" },
        { question: "「0.1」の逆数は何？", answer: "10", options: d("10", "1", "0.01", "1/10"), hint: "0.1 は 1/10 だから。" },
        { question: "分数の割り算。 整数でわるときはどこにかける？", answer: "分母（下の数）", options: d("分母", "分子", "両方", "わらない"), hint: "3/4 ÷ 2 ＝ 3/(4×2) ＝ 3/8。" },
        { question: "「(4/5) ÷ 2 ＝ 」 答えは？（約分して）", answer: "2/5", options: d("2/5", "4/10", "8/5", "2/10"), hint: "分子の 4 を 2 でわってもいいよ。" },
        { question: "帯分数の掛け算。最初にすることは？", answer: "仮分数（かぶんすう）になおす", options: d("仮分数になおす", "整数だけかける", "分母をたす", "そのままかける"), hint: "計算しやすくしよう。" },
        { question: "「x × 4 ＝ 12」 x を求める式は？", answer: "12 ÷ 4", options: d("12 ÷ 4", "12 × 4", "12 － 4", "12 ＋ 4"), hint: "逆の計算をするよ。" },
        { question: "円の面積が 314cm² のとき、半径は？（π=3.14）", answer: "10cm", options: d("10cm", "100cm", "5cm", "20cm"), hint: "10 × 10 × 3.14 ＝ 314。" },
        { question: "点対称な図形で、対応する2つの点をつなぐ直線はどこを通る？", answer: "対称の中心", options: d("対称の中心", "対称の軸", "頂点", "通らない"), hint: "中心でちょうど半分に分かれるよ。" },
        { question: "アルファベットの「N」は、線対称・点対称のどっち？", answer: "点対称のみ", options: d("点対称のみ", "線対称のみ", "両方", "どちらでもない"), hint: "180度回すと元通り！折っても重ならないよ。" },
        { question: "アルファベットの「H」は、どっち？", answer: "両方（線対称と点対称）", options: d("両方", "線対称のみ", "点対称のみ", "どちらでもない"), hint: "縦にも横にも折れるし、回しても同じ。" },
        { question: "「(1/2) × (2/3) × (3/4) ＝ 」 答えは？", answer: "1/4", options: d("1/4", "6/24", "1/2", "1/6"), hint: "ななめにどんどん約分しよう。" },
        { question: "「10 ÷ (1/2) ＝ 」 答えは？", answer: "20", options: d("20", "5", "10", "0.5"), hint: "半分(0.5)でわると、数は2倍になるよ。" },
        { question: "「(3/7) ÷ (3/7) ＝ 」 答えは？", answer: "1", options: d("1", "9/49", "0", "7/3"), hint: "同じ数でわると？" },
        { question: "「1 ＋ x ＝ x ＋ 1」 このきまりを何という？", answer: "交換（こうかん）の法則", options: d("交換の法則", "結合の法則", "分配の法則", "魔法の法則"), hint: "入れ替えても答えは同じ。" },
        { question: "「a × (b ＋ c) ＝ a × b ＋ a × c」 を何という？", answer: "分配（ぶんぱい）の法則", options: d("分配の法則", "交換の法則", "結合の法則", "計算の法則"), hint: "配るようにかけるよ。" },
        { question: "分数 × 0 ＝ ？", answer: "0", options: d("0", "1", "元の分数", "なし"), hint: "0をかけたら何でも...。" },
        { question: "分数 ÷ 1 ＝ ？", answer: "元の分数のまま", options: d("元のまま", "1", "0", "逆数"), hint: "1でわっても変わらない。" },
        { question: "ひし形は点対称？", answer: "はい", options: d("はい", "いいえ", "形による", "わからない"), hint: "中心で回すと重なるよ。" },
        { question: "正五角形は点対称？", answer: "いいえ", options: d("いいえ", "はい", "線対称ならはい", "星形ならはい"), hint: "奇数（きすう）の角の正多角形は点対称じゃないんだ。" },
        { question: "正六角形は点対称？", answer: "はい", options: d("はい", "いいえ", "線対称ではない", "丸と同じ"), hint: "偶数（ぐうすう）の角なら点対称だよ。" },
        { question: "「(5/6) × 3 ＝ 」 答えは？", answer: "5/2 (2と1/2)", options: d("5/2", "15/6", "5/18", "1"), hint: "3 と 6 で約分して。" },
        { question: "「(3/10) ÷ 3 ＝ 」 答えは？", answer: "1/10", options: d("1/10", "1/30", "9/10", "1"), hint: "3 でわると分子が 1 になる。" },
        { question: "文字を使った式。 1辺 a cm の正方形の面積 S は？", answer: "S ＝ a × a", options: d("S ＝ a × a", "S ＝ a × 4", "S ＝ a ＋ a", "S ＝ a ÷ 4"), hint: "一辺 × 一辺。" },
        { question: "三角形の底辺 a、高さ h、面積 S。 式は？", answer: "S ＝ a × h ÷ 2", options: d("S ＝ a × h ÷ 2", "S ＝ a × h", "S ＝ a ＋ h", "S ＝ (a＋h)×2"), hint: "半分にするのを忘れずに。" },
        { question: "「x × 0.5 ＝ 10」 x は？", answer: "20", options: d("20", "5", "50", "2"), hint: "10 ÷ 0.5 ＝ ?" },
        { question: "「(4/9) × (3/8) ＝ 」 答えは？", answer: "1/6", options: d("1/6", "12/72", "1/12", "2/3"), hint: "4と8、3と9で約分！" },
        { question: "「(5/12) ÷ (10/3) ＝ 」 答えは？", answer: "1/8", options: d("1/8", "50/36", "1/4", "8"), hint: "5/12 × 3/10 にして計算。" },
        { question: "分数の割り算で、わられる数より商が大きくなるのはどんな時？", answer: "わる数が 1 より小さいとき", options: d("1より小さいとき", "1より大きいとき", "0のとき", "いつでも"), hint: "1/2 などでわると増えるよ。" },
        { question: "「10 ÷ (2/3)」 と 「10 × (2/3)」、大きいのはどっち？", answer: "10 ÷ (2/3)", options: d("10 ÷ (2/3)", "10 × (2/3)", "同じ", "比べられない"), hint: "わると増え、かけると減る（1より小さい数）。" },
        { question: "点対称な図形で、中心を通る直線で分けると、2つの図形は？", answer: "合同（ごうどう）になる", options: d("合同になる", "面積が違う", "形が違う", "重ならない"), hint: "ぴったり重なるよ。" },
        { question: "「x ＋ x ＋ x」 を文字と式で表すと？", answer: "3x", options: d("3x", "x³", "xxx", "x＋3"), hint: "x が 3つ あるね。" },
        { question: "「x × x × x」 を文字と式で表すと？", answer: "x³（xの3乗）", options: d("x³", "3x", "xxx", "3＋x"), hint: "同じ数を3回かけるよ。" },
    ];

// --- 6年生 2学期: 比・拡大縮小・円の面積・比例反比例 (50問) ---
const MATH_G6_2: GeneralProblem[] = [
        { question: "「比（ひ）」の問題。 2：3 と同じ比はどれ？", answer: "4：6", options: d("4：6", "1：2", "3：2", "5：6"), hint: "両方に同じ数をかけても比は変わらない。" },
        { question: "比を簡単にすること。 15：10 を簡単にすると？", answer: "3：2", options: d("3：2", "5：2", "1.5：1", "30：20"), hint: "最大公約数の 5 で割ろう。" },
        { question: "比の値（あたい）。 2：5 の比の値は？", answer: "2/5 (0.4)", options: d("2/5", "5/2", "7", "10"), hint: "前 ÷ 後 で求められるよ。" },
        { question: "全体 300g を A と B で 1：2 に分ける。 A は何g？", answer: "100g", options: d("100g", "200g", "150g", "50g"), hint: "全体を 1＋2＝3 で割って、1倍する。" },
        { question: "「拡大図（かくだいず）」とはどんな図？", answer: "形はそのままで、大きさを大きくした図", options: d("大きくした図", "形も変えた図", "色を変えた図", "逆さまにした図"), hint: "全ての辺を同じ倍率で伸ばすよ。" },
        { question: "「縮図（しゅくず）」とはどんな図？", answer: "形はそのままで、大きさを小さくした図", options: d("小さくした図", "大きくした図", "形を変えた図", "裏返した図"), hint: "地図などがこれにあたるね。" },
        { question: "拡大図と元の図。対応する「角（かど）」の大きさはどうなる？", answer: "同じ", options: d("同じ", "2倍になる", "半分になる", "バラバラ"), hint: "角度が変わると形が変わっちゃうからね。" },
        { question: "縮尺（しゅくしゃく） 1：1000 の地図。 1cm は 実際には何m？", answer: "10m", options: d("10m", "100m", "1000m", "1m"), hint: "1cm × 1000 ＝ 1000cm。" },
        { question: "円の面積を求める公式は？", answer: "半径 × 半径 × 円周率", options: d("半径 × 半径 × 円周率", "直径 × 円周率", "半径 × 2 × 円周率", "底辺 × 高さ"), hint: "3.14をかけるよ。" },
        { question: "半径 10cm の円の面積は？（π=3.14）", answer: "314cm²", options: d("314cm²", "31.4cm²", "62.8cm²", "100cm²"), hint: "10 × 10 × 3.14 ＝ ?" },
        { question: "直径 20cm の円の面積は？（π=3.14）", answer: "314cm²", options: d("314cm²", "1256cm²", "62.8cm²", "31.4cm²"), hint: "まずは半径（10cm）を出して！" },
        { question: "「比例（ひれい）」の関係。 x が 2倍になると y は？", answer: "2倍になる", options: d("2倍になる", "半分になる", "変わらない", "2増える"), hint: "決まった倍率で増えるよ。" },
        { question: "比例の式。 y ＝ 3 × x。 比例定数はいくつ？", answer: "3", options: d("3", "x", "y", "0"), hint: "かける数のことだよ。" },
        { question: "「反比例（はんぴれい）」の関係。 x が 2倍になると y は？", answer: "半分 (1/2倍) になる", options: d("半分になる", "2倍になる", "変わらない", "0になる"), hint: "x と y をかけると、いつも同じ数になる。" },
        { question: "反比例の式。面積 12cm² の長方形の縦 x と 横 y。式は？", answer: "y ＝ 12 ÷ x", options: d("y ＝ 12 ÷ x", "y ＝ 12 × x", "y ＝ x ＋ 12", "y ＝ x ÷ 12"), hint: "x × y ＝ 12 だね。" },
        { question: "比例のグラフの形は？", answer: "原点を通る直線", options: d("直線", "曲線", "円", "ギザギザ"), hint: "0のときは0からはじまる。" },
        { question: "反比例のグラフの形は？", answer: "なめらかな2つの曲線（双曲線）", options: d("双曲線", "直線", "放物線", "折れ線"), hint: "なめらかな2つのカーブになるよ。" },
        { question: "「比」の文章題。縦と横が 3：4 の長方形。縦が 9cm なら横は？", answer: "12cm", options: d("12cm", "10cm", "15cm", "16cm"), hint: "3 が 3倍で 9。 4 も 3倍しよう。" },
        { question: "1：2 ＝ x：10。 x はいくつ？", answer: "5", options: d("5", "20", "8", "2"), hint: "2 が 5倍で 10。 1 も 5倍。" },
        { question: "「速さ」が一定のとき、時間 x と 距離 y は？", answer: "比例", options: d("比例", "反比例", "どちらでもない", "日による"), hint: "時間が経るほど距離は増えるね。" },
        { question: "「距離」が一定のとき、速さ x と 時間 y は？", answer: "反比例", options: d("反比例", "比例", "どちらでもない", "わからない"), hint: "速く走るほど、時間は短くて済むよ。" },
        { question: "円の「半径」を2倍にすると、面積は何倍になる？", answer: "4倍", options: d("4倍", "2倍", "8倍", "変わらない"), hint: "2 × 2 ＝ 4。" },
        { question: "円の「直径」を3倍にすると、円周は何倍になる？", answer: "3倍", options: d("3倍", "9倍", "6倍", "27倍"), hint: "円周は長さに比例するよ。" },
        { question: "相似（そうじ）な図形。拡大図や縮図の関係を何という？", answer: "相似", options: d("相似", "合同", "平行", "対称"), hint: "形が同じであること。" },
        { question: "「0.8：0.6」 を整数の比に直すと？", answer: "4：3", options: d("4：3", "8：6", "2：3", "4：5"), hint: "まずは10倍して 8：6 にして、2で割る。" },
        { question: "「1/2：1/3」 を整数の比に直すと？", answer: "3：2", options: d("3：2", "2：3", "1：6", "1：1"), hint: "両方に 6 をかけよう。" },
        { question: "比の値が 1 より大きいとき、前（左）の数は後ろ（右）より？", answer: "大きい", options: d("大きい", "小さい", "同じ", "0"), hint: "3：2 の比の値は 1.5 だね。" },
        { question: "200円を 兄と弟で 3：2 に分ける。弟は何円？", answer: "80円", options: d("80円", "120円", "100円", "40円"), hint: "200 ÷ 5 × 2 ＝ ?" },
        { question: "縮尺 1：25000 の地図。 4cm は実際には何km？", answer: "1km", options: d("1km", "10km", "100m", "4km"), hint: "4 × 25000 ＝ 100000cm ＝ 1000m。" },
        { question: "円周率（π）を「3」として計算していいのはどんなとき？", answer: "およその数で見当をつけるとき", options: d("見当をつけるとき", "いつでも", "テストのとき", "だめ"), hint: "正確な計算は 3.14 を使おう。" },
        { question: "比例の表。 x が 0 のとき y は？", answer: "0", options: d("0", "1", "10", "わからない"), hint: "0倍したら0だね。" },
        { question: "反比例の表。 x が 0 のとき y は？", answer: "決まらない（なし）", options: d("なし", "0", "無限", "1"), hint: "0で割ることはできないんだ。" },
        { question: "y が x に比例し、x＝2 のとき y＝8。 比例定数は？", answer: "4", options: d("4", "2", "16", "0.25"), hint: "y ÷ x ＝ ?" },
        { question: "y が x に反比例し、x＝3 のとき y＝4。 比例定数は？", answer: "12", options: d("12", "0.75", "7", "1"), hint: "x × y ＝ ?" },
        { question: "「ケーキが 10個。 x人で 分けると 1人分 y個」。 これは？", answer: "反比例", options: d("反比例", "比例", "どちらでもない", "足し算"), hint: "人数が増えるほど一切れは減るね。" },
        { question: "「1辺 x cm の正方形。 まわりの長さ y cm」。 これは？", answer: "比例", options: d("比例", "反比例", "どちらでもない", "引き算"), hint: "y ＝ 4x だね。" },
        { question: "「水槽に 1分間に 5Lずつ 水を入れる。 x分後の 量 y L」。 これは？", answer: "比例", options: d("比例", "反比例", "どちらでもない", "魔法"), hint: "y ＝ 5x。" },
        { question: "「100ページの 本。 xページ 読んだ残りの yページ」。 これは？", answer: "どちらでもない（一次関数）", options: d("どちらでもない", "比例", "反比例", "掛け算"), hint: "x ＋ y ＝ 100。たし算・ひき算の関係は比例じゃない。" },
        { question: "円の面積。半径が 1cm のとき、面積は約何cm²？", answer: "3.14cm²", options: d("3.14cm²", "1cm²", "6.28cm²", "3cm²"), hint: "1 × 1 × 3.14。" },
        { question: "円の面積。半径が 2cm のとき、面積は約何cm²？", answer: "12.56cm²", options: d("12.56cm²", "6.28cm²", "4cm²", "3.14cm²"), hint: "2 × 2 × 3.14。" },
        { question: "比例の式 y＝ax で、a がマイナスの数になることはある？", answer: "ある（中学で習うよ）", options: d("ある", "ない", "0のときだけ", "1より大きいときだけ"), hint: "中学に入ると「負（ふ）の数」が出てくるよ。" },
        { question: "比例定数 a が 2 のとき、 x が 5 なら y は？", answer: "10", options: d("10", "2.5", "7", "3"), hint: "2 × 5 ＝ ?" },
        { question: "反比例定数 a が 24 のとき、 x が 6 なら y は？", answer: "4", options: d("4", "144", "18", "30"), hint: "24 ÷ 6 ＝ ?" },
        { question: "比を簡単にする。 1.2：2 を整数の比にすると？", answer: "3：5", options: d("3：5", "6：10", "12：20", "1：2"), hint: "12：20 にしてから 4 で割る。" },
        { question: "2：3：4 の比。 全体 90 を分けると、一番大きいのは？", answer: "40", options: d("40", "30", "20", "90"), hint: "90 ÷ (2+3+4) × 4 ＝ ?" },
        { question: "拡大図を描くとき、対応する「辺の長さ」の比は？", answer: "すべて等しい", options: d("すべて等しい", "バラバラ", "足して同じ", "角度と同じ"), hint: "これがズレると形が歪（ゆが）んじゃう。" },
        { question: "「円周」を求める公式は？", answer: "直径 × 円周率", options: d("直径 × 円周率", "半径 × 円周率", "半径 × 半径 × 円周率", "底辺 × 高さ"), hint: "長さのことだよ。" },
        { question: "10km の 道のりを 時速 x km で走ったときにかかる時間 y。 これは？", answer: "反比例", options: d("反比例", "比例", "どちらでもない", "引き算"), hint: "y ＝ 10 ÷ x。" },
    ];

// --- 6年生 3学期: 資料の調べ方・並べ方組み合わせ・まとめ (50問) ---
const MATH_G6_3: GeneralProblem[] = [
        { question: "「資料の調べ方」。 柱状のグラフを何という？", answer: "ヒストグラム", options: d("ヒストグラム", "折れ線グラフ", "円グラフ", "散布図"), hint: "データの散らばり（分布）を見るのに便利。" },
        { question: "資料を整理するための、数値をドット（点）で表した図は？", answer: "ドットプロット", options: d("ドットプロット", "棒グラフ", "数直線", "絵グラフ"), hint: "一つ一つのデータをポチポチ打つよ。" },
        { question: "平均値（へいきんち）の求め方は？", answer: "合計 ÷ 個数", options: d("合計 ÷ 個数", "最大 － 最小", "真ん中の値", "一番多い値"), hint: "小学校で何度もやったね。" },
        { question: "データを大きさ順に並べた時、真ん中にくる値を何という？", answer: "中央値（メジアン）", options: d("中央値", "平均値", "さいひん値", "最小値"), hint: "ちょうど真ん中の順位。" },
        { question: "データの中で最も頻繁（ひんぱん）に現れる値を？", answer: "さいひん値（モード）", options: d("さいひん値", "中央値", "平均値", "最大値"), hint: "一番人気のある値のこと。" },
        { question: "「並べ方」。A, B, C の 3人でリレー。走る順番は何通り？", answer: "6通り", options: d("6通り", "3通り", "9通り", "12通り"), hint: "3 × 2 × 1 ＝ ?" },
        { question: "「組み合わせ」。4チームで総当たり戦（リーグ戦）。全部で何試合？", answer: "6試合", options: d("6試合", "12試合", "4試合", "16試合"), hint: "対戦表を描いて数えてみて。" },
        { question: "「組み合わせ」。赤・青・黄・緑の4色から2色選ぶと何通り？", answer: "6通り", options: d("6通り", "4通り", "12通り", "8通り"), hint: "リレーの順番とは違うよ（順序関係なし）。" },
        { question: "5枚のカード 1, 2, 3, 4, 5 から 2枚選んで2桁の数を作る。何通り？", answer: "20通り", options: d("20通り", "10通り", "25通り", "5通り"), hint: "十の位が5通り、一の位は残りの4通り。" },
        { question: "1円、5円、10円が1枚ずつある。合計金額は何通り作れる？", answer: "7通り", options: d("7通り", "3通り", "8通り", "6通り"), hint: "1, 5, 10, 6, 11, 15, 16円。" },
        { question: "メートル法の単位。 1ha（ヘクタール）は何a？", answer: "100a", options: d("100a", "10a", "1000a", "1a"), hint: "100倍の関係だよ。" },
        { question: "「体積」の問題。底面が 10cm²、高さが 6cm の角柱の体積は？", answer: "60cm³", options: d("60cm³", "20cm³", "30cm³", "16cm³"), hint: "底面積 × 高さ。" },
        { question: "底面が 10cm²、高さが 6cm の角すいの体積は？", answer: "20cm³", options: d("20cm³", "60cm³", "30cm³", "10cm³"), hint: "柱の体積の 1/3 になるんだ。", visual: { kind: 'pyramid', baseSides: 4 } },
        { question: "「速さ」の単位変換。 分速 100m は 時速何km？", answer: "時速 6km", options: d("時速 6km", "時速 60km", "時速 1km", "時速 100km"), hint: "100m × 60分 ＝ 6000m。" },
        { question: "データの散らばりを表す。最大値 － 最小値 を何という？", answer: "はんい（レンジ）", options: d("はんい", "階級", "度数", "誤差"), hint: "一番大きいところから一番小さいところまでの幅。" },
        { question: "樹形図（じゅけいず）は何を調べるために書く？", answer: "すべての場合の数", options: d("すべての場合", "平均値", "グラフの傾き", "合計"), hint: "枝分かれさせて数える図だよ。" },
        { question: "「コインを3回投げる」。表と裏の出方は全部で何通り？", answer: "8通り", options: d("8通り", "6通り", "3通り", "4通り"), hint: "2 × 2 × 2 ＝ ?" },
        { question: "サイコロを2回振る。目の出方は全部で何通り？", answer: "36通り", options: d("36通り", "12通り", "6通り", "18通り"), hint: "6 × 6 ＝ ?" },
        { question: "「(1/2 ＋ 1/3) × 6 ＝ 」 答えは？", answer: "5", options: d("5", "1", "6", "11"), hint: "カッコの中を計算してからかける（または分配法則）。" },
        { question: "「1.2 ÷ 0.4 × 2 ＝ 」 答えは？", answer: "6", options: d("6", "1.5", "3", "0.6"), hint: "左から順に計算。" },
        { question: "円の面積が約 12.56cm²。半径は？（π=3.14）", answer: "2cm", options: d("2cm", "4cm", "1cm", "3.14cm"), hint: "2 × 2 × 3.14 ＝ ?" },
        { question: "1m³（立方メートル） は 何リットル？", answer: "1000L", options: d("1000L", "100L", "10000L", "1L"), hint: "一辺 10cm の立方体が 1000個分。" },
        { question: "分速 60m で 1時間歩くと、何km進む？", answer: "3.6km", options: d("3.6km", "60km", "1km", "6km"), hint: "60 × 60 ＝ 3600m。" },
        { question: "比 3：2。 ミルク 200ml に対して、砂糖は何ml必要？", answer: "300ml", options: d("300ml", "400ml", "200ml", "100ml"), hint: "2 が 100倍で 200。 3 も 100倍。" },
        { question: "中学への準備。 「負の数（マイナス）」 0 より小さい数はどれ？", answer: "－5", options: d("－5", "0.1", "1/2", "0"), hint: "氷点下などで使う数字。" },
        { question: "文字 x を使った式。 50 ＋ x ＝ 100。 x は？", answer: "50", options: d("50", "150", "0", "100"), hint: "100 － 50 ＝ ?" },
        { question: "「等速」で走る。時間と距離の関係は？", answer: "比例", options: d("比例", "反比例", "どちらでもない", "わからない"), hint: "グラフにすると直線になる。" },
        { question: "比例定数 a とは、 y ＝ ax の何のこと？", answer: "a のこと", options: d("a のこと", "x のこと", "y のこと", "0 のこと"), hint: "いつも決まった倍率。" },
        { question: "長方形の「面積」を求める公式は？", answer: "たて × よこ", options: d("たて × よこ", "たて ＋ よこ", "一辺 × 4", "対角線 × 2"), hint: "広さの基本。" },
        { question: "「(x ＋ 2) × 3 ＝ 15」。 x はいくつ？", answer: "3", options: d("3", "5", "13", "1"), hint: "x ＋ 2 ＝ 5。" },
        { question: "「4, 8, 12, 16...」 次にくる数は？", answer: "20", options: d("20", "18", "24", "40"), hint: "4 の倍数だね。" },
        { question: "「1, 4, 9, 16...」 次にくる数は？", answer: "25", options: d("25", "20", "30", "36"), hint: "1×1, 2×2, 3×3, 4×4..." },
        { question: "三角形の 3つの角の和は？", answer: "180度", options: d("180度", "360度", "90度", "270度"), hint: "一直線。" },
        { question: "四角形の 4つの角の和は？", answer: "360度", options: d("360度", "180度", "720度", "90度"), hint: "三角形 2つ分。" },
        { question: "正六角形の 1つの角は？", answer: "120度", options: d("120度", "60度", "90度", "180度"), hint: "内角の和 720度 を 6 で割る。" },
        { question: "1リットル は 何立方センチメートル？", answer: "1000cm³", options: d("1000cm³", "100cm³", "10000cm³", "1cm³"), hint: "10×10×10。" },
        { question: "「1/2 ＋ 1/4 ＝ 」 答えは？", answer: "3/4", options: d("3/4", "2/6", "1/2", "1"), hint: "通分（つうぶん）しよう。" },
        { question: "「1 － 2/3 ＝ 」 答えは？", answer: "1/3", options: d("1/3", "2/3", "0", "1"), hint: "1 ＝ 3/3。" },
        { question: "「0.25」 を 分数で表すと？", answer: "1/4", options: d("1/4", "1/2", "1/10", "2/5"), hint: "25/100 を約分して。" },
        { question: "「3/5」 を 小数で表すと？", answer: "0.6", options: d("0.6", "0.3", "1.5", "0.5"), hint: "3 ÷ 5 ＝ ?" },
        { question: "「12 ÷ 0.5 ＝ 」 答えは？", answer: "24", options: d("24", "6", "12.5", "120"), hint: "0.5 は 半分。半分で割ると？" },
        { question: "「4 × 0.25 ＝ 」 答えは？", answer: "1", options: d("1", "0.1", "0.8", "10"), hint: "4 の 4分の1。" },
        { question: "データの整理。 「10点、20点、30点」 の平均は？", answer: "20点", options: d("20点", "60点", "10点", "30点"), hint: "足して 3 で割る。" },
        { question: "「5人」 の 20% は 何人？", answer: "1人", options: d("1人", "2人", "0.2人", "5人"), hint: "5 × 0.2 ＝ ?" },
        { question: "「150円」 の 1割引きは いくら？", answer: "135円", options: d("135円", "15円", "140円", "130円"), hint: "150 × 0.9 ＝ ?" },
        { question: "算数で一番大切だと思うことは？", answer: "きみの 答え", options: d("計算力", "考える力", "粘り強さ", "全部！"), hint: "算数はすべての科学の基礎（きそ）だよ。" },
        { question: "「x ＝ 2, y ＝ 3」 のとき、 「x ＋ 2y」 の値は？", answer: "8", options: d("8", "7", "5", "10"), hint: "2 ＋ 2×3 ＝ ?" },
        { question: "「a ＝ 5」 のとき、 「a² 」 の値は？", answer: "25", options: d("25", "10", "55", "5"), hint: "5 × 5 ＝ ?" },
    ];

const splitIntoUnitsByCounts = (problems: GeneralProblem[], counts: number[]): GeneralProblem[][] => {
    const totalWeight = counts.reduce((s, c) => s + c, 0);
    const totalProblems = problems.length;
    const sizes = counts.map((c) => Math.floor((totalProblems * c) / totalWeight));
    let rest = totalProblems - sizes.reduce((s, n) => s + n, 0);
    let i = 0;
    while (rest > 0) {
        sizes[i % sizes.length] += 1;
        rest -= 1;
        i += 1;
    }

    const out: GeneralProblem[][] = [];
    let start = 0;
    sizes.forEach((size) => {
        out.push(problems.slice(start, start + size));
        start += size;
    });
    return out;
};

const g6Term1Units = splitIntoUnitsByCounts(MATH_G6_1, [1, 1, 1, 1]);
const g6Term2Units = splitIntoUnitsByCounts(MATH_G6_2, [1, 1, 1, 1]);
const g6Term3Units = splitIntoUnitsByCounts(MATH_G6_3, [1, 1, 1, 1, 1]);

export const MATH_G6_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G6_U01: [], // 対称な 図形
    MATH_G6_U02: [], // 文字 と 式
    MATH_G6_U03: [], // 分数の かけ算
    MATH_G6_U04: [], // 分数の わり算
    MATH_G6_U05: [], // 比 と その 利用
    MATH_G6_U06: [], // 比例 と 反比例
    MATH_G6_U07: [], // 拡大図 と 縮図
    MATH_G6_U08: [], // 円の 面積
    MATH_G6_U09: [], // 角柱 と 円柱の 体積
    MATH_G6_U10: [], // およその 面積 と 体積
    MATH_G6_U11: [], // 場合の 数
    MATH_G6_U12: [], // 資料の 調べ方
    MATH_G6_U13: [], // 算数の まとめ
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G6_U01':
            return n % 2 === 0
                ? { question: "このような図形で、折り目になる線は？", answer: "対称の軸", options: d("対称の軸", "対称の中心", "対角線", "底辺"), hint: "鏡写しになる線。", visual: { kind: 'polygon', sides: 4 } }
                : { question: "点対称の図形は何度回すと重なる？", answer: "180度", options: d("180度", "90度", "360度", "45度"), hint: "半回転で重なる。", visual: { kind: 'polygon', sides: 4 } };
        case 'MATH_G6_U02': {
            const x = (n % 8) + 2;
            const y = x + (n % 5) + 1;
            if (n % 2 === 0) {
                return { question: `□ + ${x} = ${x + y}。□ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "逆算しよう。" };
            }
            return { question: `${x} × □ = ${x * y}。□ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "かけ算の 逆算をする。" };
        }
        case 'MATH_G6_U03': {
            const a = (n % 6) + 1;
            const b = (n % 7) + 2;
            const c = (n % 5) + 1;
            const dnm = (n % 8) + 3;
            const p = n % 4;
            if (p === 0) {
                return {
                    question: `${a}/${b} × ${c}/${dnm} = ?`,
                    answer: `${a * c}/${b * dnm}`,
                    options: d(`${a * c}/${b * dnm}`, `${a + c}/${b + dnm}`, `${a * dnm}/${b * c}`, `${a}/${b}`),
                    hint: "分子どうし、分母どうし。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: b }, right: { n: c, d: dnm }, op: '×' }
                };
            }
            if (p === 1) {
                return {
                    question: `${a}/${b} の 分子は？`,
                    answer: `${a}`,
                    options: d(`${a}`, `${b}`, `${a + b}`, `${a * b}`),
                    hint: "上が分子、下が分母。",
                    visual: { kind: 'fraction', numerator: a, denominator: b }
                };
            }
            if (p === 2) {
                return {
                    question: `${a}/${b} の 分母は？`,
                    answer: `${b}`,
                    options: d(`${b}`, `${a}`, `${a + b}`, `${b - 1}`),
                    hint: "下が分母。",
                    visual: { kind: 'fraction', numerator: a, denominator: b }
                };
            }
            return {
                question: `${a}/${b} × 1 = ?`,
                answer: `${a}/${b}`,
                options: d(`${a}/${b}`, `${a}/${b + 1}`, `${a + 1}/${b}`, `1/${b}`),
                hint: "1をかけても変わらない。",
                visual: { kind: 'fraction_operation', left: { n: a, d: b }, right: { n: 1, d: 1 }, op: '×' }
            };
        }
        case 'MATH_G6_U04': {
            const a = (n % 6) + 2;
            const b = (n % 7) + 3;
            const c = (n % 5) + 1;
            const dnm = (n % 4) + 2;
            const p = n % 4;
            if (p === 0) {
                return {
                    question: `${a}/${b} ÷ ${c}/${dnm} = ?`,
                    answer: `${a * dnm}/${b * c}`,
                    options: d(`${a * dnm}/${b * c}`, `${a * c}/${b * dnm}`, `${a + dnm}/${b + c}`, `${a}/${b}`),
                    hint: "後ろをひっくり返してかける。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: b }, right: { n: c, d: dnm }, op: '÷' }
                };
            }
            if (p === 1) {
                return {
                    question: `${c}/${dnm} を ひっくり返すと？`,
                    answer: `${dnm}/${c}`,
                    options: d(`${dnm}/${c}`, `${c}/${dnm}`, `${c + dnm}/${dnm}`, `${dnm - c}/${c}`),
                    hint: "逆数にする。",
                    visual: { kind: 'fraction', numerator: c, denominator: dnm }
                };
            }
            if (p === 2) {
                return {
                    question: `${a}/${b} ÷ 1 = ?`,
                    answer: `${a}/${b}`,
                    options: d(`${a}/${b}`, `${b}/${a}`, `1/${b}`, `${a * b}/1`),
                    hint: "1で割っても変わらない。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: b }, right: { n: 1, d: 1 }, op: '÷' }
                };
            }
            return {
                question: `分数のわり算で 先にすることは？`,
                answer: "わる数をひっくり返す",
                options: d("わる数をひっくり返す", "たす", "分母をたす", "分子をひく"),
                hint: "逆数にしてかけ算。",
                visual: { kind: 'fraction_operation', left: { n: a, d: b }, right: { n: c, d: dnm }, op: '÷' }
            };
        }
        case 'MATH_G6_U05': {
            const left = (n % 5) + 1;
            const right = (n % 4) + 2;
            const mul = (n % 4) + 2;
            if (n % 2 === 0) {
                return { question: `${left}:${right} と同じ比は？`, answer: `${left * mul}:${right * mul}`, options: d(`${left * mul}:${right * mul}`, `${left + mul}:${right + mul}`, `${left}:${right * mul}`, `${left * mul}:${right}`), hint: "両方に同じ数をかける。" };
            }
            return { question: `${left * mul}:${right * mul} を いちばん かんたんな比にすると？`, answer: `${left}:${right}`, options: d(`${left}:${right}`, `${left * mul}:${right * mul}`, `${left + right}:${right}`, `${left}:${right + mul}`), hint: "両方を 同じ数で わる。" };
        }
        case 'MATH_G6_U06': {
            const x = (n % 6) + 1;
            if (n % 2 === 0) {
                return { question: `比例で y=4x。x=${x} のとき y=?`, answer: `${4 * x}`, options: d(`${4 * x}`, `${x + 4}`, `${x * x}`, `${x}`), hint: "比例は y=ax。" };
            }
            return { question: `反比例で x×y=12。x=${x} のとき y=?`, answer: `${12 / x}`, options: d(`${12 / x}`, `${4 * x}`, `${x + 12}`, `${x}`), hint: "反比例は x×y が いつも同じ。" };
        }
        case 'MATH_G6_U07': {
            const scale = (n % 4) + 2;
            const len = (n % 6) + 3;
            if (n % 2 === 0) {
                return { question: `拡大率${scale}倍。元の長さ${len}cm の対応辺は？`, answer: `${len * scale}cm`, options: d(`${len * scale}cm`, `${len / scale}cm`, `${len + scale}cm`, `${scale}cm`), hint: "長さは倍率でかける。", visual: { kind: 'polygon', sides: 3 } };
            }
            return { question: `縮尺 1:${scale}。実際の長さが ${len * scale}cm のとき、図の長さは？`, answer: `${len}cm`, options: d(`${len}cm`, `${len * scale}cm`, `${scale}cm`, `${len + scale}cm`), hint: "縮図は 実際の長さを わる。", visual: { kind: 'polygon', sides: 3 } };
        }
        case 'MATH_G6_U08': {
            const r = (n % 9) + 1;
            if (n % 2 === 0) {
                return { question: `この円の半径が${r}cm。面積（π=3.14）は？`, answer: `${(r * r * 3.14).toFixed(2)}cm2`, options: d(`${(r * r * 3.14).toFixed(2)}cm2`, `${(2 * r * 3.14).toFixed(2)}cm2`, `${(r * 3.14).toFixed(2)}cm2`, `${(r * r).toFixed(2)}cm2`), hint: "半径×半径×3.14。", visual: { kind: 'circle', showRadius: true } };
            }
            return { question: `この円の直径が${r * 2}cm。面積（π=3.14）は？`, answer: `${(r * r * 3.14).toFixed(2)}cm2`, options: d(`${(r * r * 3.14).toFixed(2)}cm2`, `${(r * 2 * 3.14).toFixed(2)}cm2`, `${(r * 2 * r * 2 * 3.14).toFixed(2)}cm2`, `${(r * r).toFixed(2)}cm2`), hint: "まず 半径に なおす。", visual: { kind: 'circle', showRadius: true } };
        }
        case 'MATH_G6_U09': {
            const base = (n % 8) + 5;
            const h = (n % 6) + 2;
            if (n % 2 === 0) {
                return { question: `底面積${base}cm2、高さ${h}cm の角柱/円柱の体積は？`, answer: `${base * h}cm3`, options: d(`${base * h}cm3`, `${base + h}cm3`, `${base * 2 + h}cm3`, `${h}cm3`), hint: "底面積×高さ。", visual: { kind: 'prism', baseSides: (n % 4) + 3 } };
            }
            return { question: `体積が ${base * h}cm3、高さが ${h}cm の角柱/円柱。底面積は？`, answer: `${base}cm2`, options: d(`${base}cm2`, `${base * h}cm2`, `${h}cm2`, `${base + h}cm2`), hint: "体積÷高さ。", visual: { kind: 'cylinder', showRadius: true, showHeight: true } };
        }
        case 'MATH_G6_U10': {
            const x = 100 + n * 13;
            const rounded = Math.round(x / 10) * 10;
            if (n % 2 === 0) {
                return { question: `${x} を十の位までのおよその数にすると？`, answer: `${rounded}`, options: d(`${rounded}`, `${Math.floor(x / 10) * 10}`, `${Math.ceil(x / 10) * 10}`, `${x}`), hint: "一の位で四捨五入。" };
            }
            return { question: `${x} は およそ ${rounded} と いえる？`, answer: "はい", options: d("はい", "いいえ", "同じ", "わからない"), hint: "十の位までの がい数に した数を 見よう。" };
        }
        case 'MATH_G6_U11': {
            const nItems = (n % 4) + 3;
            let ways = 1;
            for (let k = 2; k <= nItems; k++) ways *= k;
            if (n % 2 === 0) {
                return { question: `${nItems}人 を1列に並べると何通り？`, answer: `${ways}通り`, options: d(`${ways}通り`, `${nItems * nItems}通り`, `${nItems + 1}通り`, `${ways / 2}通り`), hint: "順列の基本 n×(n-1)×..." };
            }
            return { question: `赤と青の2しゅるいのき を ${nItems}回 えらぶ。全部で何通り？`, answer: `${2 ** nItems}通り`, options: d(`${2 ** nItems}通り`, `${ways}通り`, `${nItems * 2}通り`, `${nItems}通り`), hint: "毎回 2通り ずつ。" };
        }
        case 'MATH_G6_U12': {
            const a = (n % 5) * 10 + 50;
            const b = (n % 4) * 10 + 40;
            const c = (n % 3) * 10 + 30;
            const avg = Math.floor((a + b + c) / 3);
            const p = n % 4;
            if (p === 0) {
                return { question: `${a}, ${b}, ${c} の平均は？`, answer: `${avg}`, options: d(`${avg}`, `${a + b + c}`, `${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`), hint: "合計÷個数。" };
            }
            if (p === 1) {
                return { question: `${a}, ${b}, ${c} の最大値は？`, answer: `${Math.max(a, b, c)}`, options: d(`${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`, `${avg}`, `${a + b + c}`), hint: "いちばん大きい値。" };
            }
            if (p === 2) {
                return { question: `${a}, ${b}, ${c} の最小値は？`, answer: `${Math.min(a, b, c)}`, options: d(`${Math.min(a, b, c)}`, `${Math.max(a, b, c)}`, `${avg}`, `${a + b + c}`), hint: "いちばん小さい値。" };
            }
            return { question: `${a}, ${b}, ${c} の範囲（最大-最小）は？`, answer: `${Math.max(a, b, c) - Math.min(a, b, c)}`, options: d(`${Math.max(a, b, c) - Math.min(a, b, c)}`, `${a + b + c}`, `${avg}`, `${Math.max(a, b, c)}`), hint: "ばらつきをみる指標。" };
        }
        case 'MATH_G6_U13': {
            const a = (n % 8) + 2;
            const b = (n % 5) + 3;
            const c = (n % 4) + 2;
            return { question: `まとめ：${a} + ${b} × ${c} = ?`, answer: `${a + b * c}`, options: d(`${a + b * c}`, `${(a + b) * c}`, `${a * b + c}`, `${a + b + c}`), hint: "計算順序の確認。" };
        }
        default:
            return { question: "6 + 4 = ?", answer: "10", options: d("10", "9", "11", "8"), hint: "たし算。" };
    }
};

Object.keys(MATH_G6_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G6_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

export const MATH_G6_DATA: Record<string, GeneralProblem[]> = {
    MATH_G6_1,
    MATH_G6_2,
    MATH_G6_3,
    ...MATH_G6_UNIT_DATA,
};

