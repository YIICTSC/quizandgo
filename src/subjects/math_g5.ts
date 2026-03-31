
import { GeneralProblem, d } from './utils';

// --- 5年生 1学期: 整数・倍数・約数・体積・合同・角度 (50問) ---
const MATH_G5_1: GeneralProblem[] = [
        { question: "「整数」の中で、2で割り切れる数を何という？", answer: "偶数（ぐうすう）", options: d("偶数（ぐうすう）", "奇数（きすう）", "小数", "素数"), hint: "0, 2, 4, 6... だよ。" },
        { question: "「整数」の中で、2で割り切れない数を何という？", answer: "奇数（きすう）", options: d("奇数（きすう）", "偶数（ぐうすう）", "整数", "自然数"), hint: "1, 3, 5, 7... だよ。" },
        { question: "0 は 偶数・奇数のどちらに含まれる？", answer: "偶数", options: d("偶数", "奇数", "どちらでもない", "小数"), hint: "算数では0も偶数としてあつかうよ。" },
        { question: "「倍数（ばいすう）」とは？", answer: "ある数に整数をかけてできる数", options: d("整数をかけた数", "整数をたした数", "整数でわった数", "奇数のこと"), hint: "3の倍数は 3, 6, 9... だね。" },
        { question: "「公倍数（こうばいすう）」とは？", answer: "2つ以上の数に共通な倍数", options: d("共通な倍数", "共通な約数", "たした数", "かけた数"), hint: "3と4の公倍数は、12, 24... とつづくよ。" },
        { question: "3 と 5 の「最小公倍数」は？", answer: "15", options: d("15", "8", "30", "1"), hint: "一番小さい共通の倍数。" },
        { question: "6 と 8 の最小公倍数は？", answer: "24", options: d("24", "48", "14", "16"), hint: "6の倍数：6, 12, 18, 24... 8の倍数：8, 16, 24..." },
        { question: "「約数（やくすう）」とは？", answer: "ある数を割り切ることができる整数", options: d("割り切る数", "かけた数", "引いた数", "0より大きい数"), hint: "12の約数は 1, 2, 3, 4, 6, 12 だよ。" },
        { question: "「公約数（こうやくすう）」とは？", answer: "2つ以上の数に共通な約数", options: d("共通な約数", "共通な倍数", "大きな数", "あまり"), hint: "12と18の公約数は、1, 2, 3, 6 だね。" },
        { question: "12 と 18 の「最大公約数」は？", answer: "6", options: d("6", "3", "2", "36"), hint: "一番大きい共通の約数。" },
        { question: "15 と 25 の最大公約数は？", answer: "5", options: d("5", "3", "15", "75"), hint: "両方を割り切れる一番大きな数。" },
        { question: "1 から 20 までの間に偶数はいくつある？", answer: "10個", options: d("10個", "9個", "11個", "20個"), hint: "半分が偶数だよ。" },
        { question: "13 は偶数・奇数のどっち？", answer: "奇数", options: d("奇数", "偶数", "どちらでもない", "素数"), hint: "2で割ると1あまるね。" },
        { question: "4 の倍数を小さい順に3つ言うと？", answer: "4, 8, 12", options: d("4, 8, 12", "1, 2, 4", "4, 6, 8", "4, 5, 6"), hint: "4×1, 4×2, 4×3。" },
        { question: "10 の約数をすべて挙げると？", answer: "1, 2, 5, 10", options: d("1, 2, 5, 10", "1, 2, 4, 10", "2, 5", "1, 10"), hint: "1と自分自身をわすれないで。" },
        { question: "2 と 3 と 4 の最小公倍数は？", answer: "12", options: d("12", "24", "6", "9"), hint: "3つの数に共通する一番小さい倍数。" },
        { question: "8 と 12 の公約数はいくつある？", answer: "3個", options: d("3個", "2個", "4個", "1個"), hint: "1, 2, 4 の3つ。" },
        { question: "体積のたんい。 1cm × 1cm × 1cm の大きさを？", answer: "1cm³（立方センチメートル）", options: d("1cm³", "1cm²", "1m³", "1mL"), hint: "「立方（りっぽう）」は3乗のこと。" },
        { question: "直方体の体積を求める公式は？", answer: "たて × よこ × 高さ", options: d("たて × よこ × 高さ", "底面積 × 2", "たて ＋ よこ ＋ 高さ", "一辺 × 3"), hint: "3つの方向の長さをかけるよ。" },
        { question: "立方体の体積を求める公式は？", answer: "一辺 × 一辺 × 一辺", options: d("一辺 × 一辺 × 一辺", "たて × よこ × 高さ", "底面積 × 高さ", "辺の長さ × 12"), hint: "全部同じ長さだからね。" },
        { question: "たて4cm, よこ5cm, 高さ2cmの直方体の体積は？", answer: "40cm³", options: d("40cm³", "11cm³", "22cm³", "40cm²"), hint: "4 × 5 × 2 ＝ ?" },
        { question: "一辺が 3cm の立方体の体積は？", answer: "27cm³", options: d("27cm³", "9cm³", "12cm³", "81cm³"), hint: "3 × 3 × 3 ＝ ?" },
        { question: "1m³（立方メートル）は何cm³？", answer: "1000000cm³", options: d("1000000cm³", "100cm³", "10000cm³", "1000cm³"), hint: "100 × 100 × 100 ＝ ?" },
        { question: "1L（リットル）は何cm³？", answer: "1000cm³", options: d("1000cm³", "100cm³", "10000cm³", "1cm³"), hint: "10cm×10cm×10cmの箱と同じ。" },
        { question: "1mL（ミリリットル）は何cm³？", answer: "1cm³", options: d("1cm³", "10cm³", "100cm³", "1000cm³"), hint: "ミリリットルと立方センチメートルは同じ大きさ。" },
        { question: "1m³ は 何L（リットル）？", answer: "1000L", options: d("1000L", "100L", "10000L", "10L"), hint: "1000000 ÷ 1000 ＝ ?" },
        { question: "「合同（ごうどう）」な図形とは？", answer: "形も大きさもぴったり同じ図形", options: d("形も大きさも同じ", "形だけ同じ", "面積だけ同じ", "色が同じ"), hint: "裏返して重なるのも合同だよ。" },
        { question: "合同な図形で、重なり合う頂点や辺、角を何という？", answer: "対応（たいおう）する〜", options: d("対応する", "反対の", "同じ", "共通の"), hint: "「対応する辺」などと言うよ。" },
        { question: "三角形の3つの角の合計（内角の和）は何度？", answer: "180度", options: d("180度", "360度", "90度", "270度"), hint: "一直線になるよ。" },
        { question: "四角形の4つの角の合計は何度？", answer: "360度", options: d("360度", "180度", "720度", "90度"), hint: "三角形2つ分だね。" },
        { question: "五角形の内角の和は何度？", answer: "540度", options: d("540度", "360度", "720度", "180度"), hint: "三角形が3つ作れるよ。" },
        { question: "六角形の内角の和は何度？", answer: "720度", options: d("720度", "540度", "360度", "1080度"), hint: "三角形が4つ作れる。" },
        { question: "小数の掛け算。 「0.3 × 0.2 ＝ 」 答えは？", answer: "0.06", options: d("0.06", "0.6", "6", "0.006"), hint: "3×2は6。小数点は2つ動かす。" },
        { question: "「1.2 × 0.4 ＝ 」 答えは？", answer: "0.48", options: d("0.48", "4.8", "0.048", "48"), hint: "12 × 4 ＝ 48。小数点を2つ移動。" },
        { question: "「2.5 × 4 ＝ 」 答えは？", answer: "10", options: d("10", "1", "100", "0.1"), hint: "25 × 4 は 100。" },
        { question: "「平均」を求める公式は？", answer: "合計 ÷ 個数", options: d("合計 ÷ 個数", "合計 × 個数", "最大 － 最小", "真ん中の数"), hint: "ならした値のことだよ。" },
        { question: "5教科のテストの合計が400点でした。平均点は？", answer: "80点", options: d("80点", "400点", "70点", "85点"), hint: "400 ÷ 5 ＝ ?" },
        { question: "3日間の歩数が、5000歩, 7000歩, 6000歩。平均は？", answer: "6000歩", options: d("6000歩", "18000歩", "5000歩", "7000歩"), hint: "全部たして3で割る。" },
        { question: "「単位量あたりの大きさ」で混み具合を比べる式は？", answer: "人数 ÷ 面積", options: d("人数 ÷ 面積", "面積 ÷ 人数", "人数 × 面積", "人数 ＋ 面積"), hint: "1平方メートルあたりの人数を出すよ。" },
        { question: "12畳に18人いる部屋と、10畳に15人いる部屋。どっちが混んでる？", answer: "同じ", options: d("同じ", "12畳の方", "10畳の方", "比べられない"), hint: "18÷12 ＝ 1.5。 15÷10 ＝ 1.5。" },
        { question: "小数の掛け算で、かける数が1より小さいとき、積はどうなる？", answer: "かけられる数より小さくなる", options: d("小さくなる", "大きくなる", "変わらない", "0になる"), hint: "0.5をかける＝半分にする。" },
        { question: "小数の掛け算で、かける数が1より大きいとき、積は？", answer: "かけられる数より大きくなる", options: d("大きくなる", "小さくなる", "変わらない", "1になる"), hint: "1.2倍などは増えるよね。" },
        { question: "三角形の合同条件、1つ選んで。", answer: "3つの辺の長さがそれぞれ等しい", options: d("3つの辺が等しい", "3つの角が等しい", "面積が等しい", "色の塗り方が同じ"), hint: "形と大きさを決める条件。" },
        { question: "二等辺三角形の底角（下の2つの角）は？", answer: "等しい", options: d("等しい", "違う", "いつも60度", "足して90度"), hint: "左右対称な形だからね。" },
        { question: "正三角形の1つの角は何度？", answer: "60度", options: d("60度", "90度", "45度", "30度"), hint: "180度を3等分して。" },
        { question: "平行四辺形の向かい合う角の大きさは？", answer: "等しい", options: d("等しい", "違う", "いつも90度", "足して180度"), hint: "ペアになっている角は同じ。" },
        { question: "台形の面積を求めるのに、補助線を引いて何に分けるといい？", answer: "2つの三角形", options: d("2つの三角形", "2つの円", "3つの四角形", "曲線"), hint: "三角形の面積公式が使えるようになる。" },
        { question: "小数の筆算。小数点の位置はどうする？", answer: "かけた数と足した数だけ右から数えて打つ", options: d("右から数えて打つ", "一番左に打つ", "打たなくていい", "一の位に打つ"), hint: "小数以下の桁数を合計するんだよ。" },
        { question: "0.01 が 100個集まると？", answer: "1", options: d("1", "0.1", "10", "100"), hint: "1/100 の 100倍。" },
    ];

// --- 5年生 2学期: 小数の割り算・分数・割合・図形 (50問) ---
const MATH_G5_2: GeneralProblem[] = [
        { question: "「小数の割り算」。 「6 ÷ 0.5 ＝ 」 答えは？", answer: "12", options: d("12", "3", "0.3", "6.5"), hint: "0.5(半分)でわると、数は2倍になるよ。" },
        { question: "「4.8 ÷ 1.2 ＝ 」 答えは？", answer: "4", options: d("4", "40", "0.4", "6"), hint: "両方を10倍して 48÷12 として考えよう。" },
        { question: "小数の割り算で、わる数が1より小さいとき、商はどうなる？", answer: "わられる数より大きくなる", options: d("大きくなる", "小さくなる", "変わらない", "0になる"), hint: "0.1でわると10倍になるイメージ。" },
        { question: "小数の割り算で、わる数が1より大きいとき、商は？", answer: "わられる数より小さくなる", options: d("小さくなる", "大きくなる", "変わらない", "1になる"), hint: "ふつうの割り算と同じ感覚。" },
        { question: "「3 ÷ 2 ＝ 」 答えを小数で言うと？", answer: "1.5", options: d("1.5", "1.2", "0.6", "1"), hint: "3の半分。" },
        { question: "割り進む筆算。 5 ÷ 4 ＝ ？", answer: "1.25", options: d("1.25", "1.2", "1.1", "0.8"), hint: "あまりに0をつけてつづけて割るよ。" },
        { question: "分数。 分母のちがう分数を足すとき、最初にするのは？", answer: "通分（つうぶん）", options: d("通分", "約分", "掛け算", "無視"), hint: "分母を同じ数にそろえること。" },
        { question: "「1/2 ＋ 1/3 ＝ 」 答えは？", answer: "5/6", options: d("5/6", "2/5", "1/6", "1/5"), hint: "3/6 ＋ 2/6 ＝ ?" },
        { question: "「3/4 － 1/6 ＝ 」 答えは？", answer: "7/12", options: d("7/12", "2/2", "1/2", "5/12"), hint: "分母を 12 にそろえて通分！" },
        { question: "分数をできるだけ簡単な形にすることを何という？", answer: "約分（やくぶん）", options: d("約分", "通分", "成分", "半分"), hint: "「10/20 ＝ 1/2」のようにすること。" },
        { question: "「15/20」 を約分すると？", answer: "3/4", options: d("3/4", "5/6", "1/2", "15/2"), hint: "両方を 5 で割ってみて。" },
        { question: "「割合（わりあい）」を求める公式は？", answer: "比べられる量 ÷ もとにする量", options: d("比べられる量 ÷ もとにする量", "もとにする量 ÷ 比べられる量", "合計 × 100", "差 ÷ 合計"), hint: "「く・わ・も（くもわ）」で覚えよう。" },
        { question: "割合を100倍して「％」で表したものを何という？", answer: "百分率（ひゃくぶんりつ）", options: d("百分率", "歩合", "千分率", "十進法"), hint: "パーセントのことだね。" },
        { question: "「10%」を小数に直すと？", answer: "0.1", options: d("0.1", "0.01", "1", "10"), hint: "100で割る。" },
        { question: "「0.25」を百分率に直すと？", answer: "25%", options: d("25%", "2.5%", "0.25%", "250%"), hint: "100をかける。" },
        { question: "「歩合（ぶあい）」の単位、1/10を表すのは？", answer: "割（わり）", options: d("割", "分", "厘", "パーセント"), hint: "「3割引き」などの割。" },
        { question: "「歩合」の単位、1/100を表すのは？", answer: "分（ぶ）", options: d("分", "割", "厘", "毛"), hint: "割の次。" },
        { question: "0.25 を「歩合」で言うと？", answer: "2割5分", options: d("2割5分", "25割", "2分5厘", "0.25割"), hint: "割・分・厘の順だよ。" },
        { question: "1000円の30％はいくら？", answer: "300円", options: d("300円", "700円", "30円", "3円"), hint: "1000 × 0.3 ＝ ?" },
        { question: "定価2000円の2割引きはいくら？", answer: "1600円", options: d("1600円", "400円", "1800円", "2200円"), hint: "2000 × 0.8 ＝ ?" },
        { question: "三角形の面積を求める公式は？", answer: "底辺 × 高さ ÷ 2", options: d("底辺 × 高さ ÷ 2", "底辺 × 高さ", "たて × よこ", "辺の合計"), hint: "平行四辺形の半分。" },
        { question: "平行四辺形の面積を求める公式は？", answer: "底辺 × 高さ", options: d("底辺 × 高さ", "底辺 × 高さ ÷ 2", "一辺 × 4", "対角線 × 2"), hint: "長方形に変形できるよ。" },
        { question: "台形の面積を求める公式は？", answer: "(上底 ＋ 下底) × 高さ ÷ 2", options: d("(上底＋下底)×高さ÷2", "底辺×高さ÷2", "上底×下底×高さ", "辺の合計"), hint: "かっこを忘れずに。" },
        { question: "ひし形の面積を求める公式は？", answer: "対角線 × 対角線 ÷ 2", options: d("対角線 × 対角線 ÷ 2", "底辺 × 高さ", "一辺 × 一辺", "辺の合計"), hint: "まわりの長方形の半分。" },
        { question: "底辺6cm, 高さ4cmの三角形の面積は？", answer: "12cm²", options: d("12cm²", "24cm²", "10cm²", "48cm²"), hint: "6 × 4 ÷ 2 ＝ ?" },
        { question: "底辺10cm, 高さ5cmの平行四辺形の面積は？", answer: "50cm²", options: d("50cm²", "25cm²", "30cm²", "15cm²"), hint: "10 × 5 ＝ ?" },
        { question: "円周（えんしゅう）の長さを求める公式は？", answer: "直径 × 円周率", options: d("直径 × 円周率", "半径 × 円周率", "直径 ＋ 円周率", "面積 ÷ 2"), hint: "円周率はだいたい 3.14 だよ。" },
        { question: "円周率（π）の値、小学校で習うおよその数は？", answer: "3.14", options: d("3.14", "3", "3.1", "22/7"), hint: "サ・イ・シ。" },
        { question: "直径10cmの円の円周は？", answer: "31.4cm", options: d("31.4cm", "314cm", "15.7cm", "62.8cm"), hint: "10 × 3.14 ＝ ?" },
        { question: "半径5cmの円の円周は？", answer: "31.4cm", options: d("31.4cm", "15.7cm", "50cm", "3.14cm"), hint: "直径（10cm）になおしてから計算。" },
        { question: "正多角形。すべての辺の長さと角の大きさが等しいものを？", answer: "正多角形", options: d("正多角形", "長方形", "台形", "平行四辺形"), hint: "正五角形や正六角形など。" },
        { question: "正六角形の1つの中心角（ピザの1片のような角）は何度？", answer: "60度", options: d("60度", "90度", "45度", "120度"), hint: "360 ÷ 6 ＝ ?" },
        { question: "正八角形の中心角は何度？", answer: "45度", options: d("45度", "60度", "30度", "90度"), hint: "360 ÷ 8 ＝ ?" },
        { question: "「3 ÷ 7」 答えを分数で表すと？", answer: "3/7", options: d("3/7", "7/3", "3.7", "10"), hint: "「わられる数」が分子（上）。" },
        { question: "「5/3」 を帯分数になおすと？", answer: "1と2/3", options: d("1と2/3", "2と1/3", "1と5/3", "3/5"), hint: "5 ÷ 3 ＝ 1 あまり 2。" },
        { question: "分母が「10」の分数は、小数で表すと？", answer: "0.1の倍数", options: d("0.1の倍数", "10の倍数", "整数", "不可能"), hint: "1/10 ＝ 0.1 だね。" },
        { question: "「3/10」 を小数に直すと？", answer: "0.3", options: d("0.3", "3", "0.03", "1.3"), hint: "10個に分けた3つ。" },
        { question: "割合が「1」のとき、百分率では何％？", answer: "100％", options: d("100％", "1％", "10％", "0％"), hint: "全部、という意味。" },
        { question: "「4割」 は 何％？", answer: "40%", options: d("40%", "4%", "0.4%", "400%"), hint: "1割 ＝ 10%。" },
        { question: "「5分（ぶ）」 は 何％？", answer: "5%", options: d("5%", "0.5%", "50%", "0.05%"), hint: "1分 ＝ 1%。" },
        { question: "80人の 25% は何人？", answer: "20人", options: d("20人", "40人", "10人", "5人"), hint: "80 × 0.25 ＝ ?" },
        { question: "15人は 60人の 何％？", answer: "25%", options: d("25%", "15%", "40%", "50%"), hint: "15 ÷ 60 ＝ ?" },
        { question: "「1/3」 と 「2/6」、どっちが大きい？", answer: "同じ", options: d("同じ", "1/3", "2/6", "比べられない"), hint: "約分してみて。" },
        { question: "分数の足し算。 「1/4 ＋ 1/8 ＝ 」", answer: "3/8", options: d("3/8", "2/12", "1/2", "1/12"), hint: "通分すると 2/8 ＋ 1/8。" },
        { question: "分数の引き算。 「5/6 － 1/3 ＝ 」", answer: "3/6 (1/2)", options: d("1/2", "4/3", "1/3", "1/6"), hint: "通分すると 5/6 － 2/6。" },
        { question: "小数の筆算。 「3.6 ÷ 0.9 ＝ 」", answer: "4", options: d("4", "40", "0.4", "0.25"), hint: "36 ÷ 9 ＝ ?" },
        { question: "小数の筆算。 「1.2 ÷ 0.5 ＝ 」", answer: "2.4", options: d("2.4", "2", "0.6", "1.7"), hint: "12 ÷ 5 ＝ ?" },
        { question: "面積 1a（アール） は 何m²？", answer: "100m²", options: d("100m²", "10m²", "1000m²", "1m²"), hint: "10m × 10m の広さ。" },
        { question: "面積 1ha（ヘクタール） は 何m²？", answer: "10000m²", options: d("10000m²", "100m²", "1000m²", "100000m²"), hint: "100m × 100m の広さ。" },
    ];

// --- 5年生 3学期: 角柱・円柱・速さ・分数の掛け算割り算・グラフ・比例 (50問) ---
const MATH_G5_3: GeneralProblem[] = [
        { question: "「角柱（かくちゅう）」の体積を求める公式は？", answer: "底面積 × 高さ", options: d("底面積 × 高さ", "底面のまわり × 高さ", "たて×よこ×高さ", "底面積 ÷ 高さ"), hint: "積み重ねるイメージだよ。" },
        { question: "「円柱（えんちゅう）」の底面の形は？", answer: "円", options: d("円", "正方形", "三角形", "ドーナツ形"), hint: "缶詰（かんづめ）のような形。" },
        { question: "三角柱の底面が 10cm²、高さが 5cm。体積は？", answer: "50cm³", options: d("50cm³", "15cm³", "25cm³", "30cm³"), hint: "10 × 5 ＝ ?" },
        { question: "円柱の体積公式も「底面積 × 高さ」でいい？", answer: "いい", options: d("いい", "だめ", "半分にする", "円周率を足す"), hint: "柱（はしら）の形はみんなこれ！" },
        { question: "速度の問題。 「速さ」を求める公式は？", answer: "道のり ÷ 時間", options: d("道のり ÷ 時間", "道のり × 時間", "時間 ÷ 道のり", "歩数 × 歩幅"), hint: "「はじき（みはじ）」で覚えよう。" },
        { question: "120kmの距離を2時間で走る車の時速は？", answer: "時速60km", options: d("時速60km", "時速120km", "時速240km", "時速30km"), hint: "120 ÷ 2 ＝ ?" },
        { question: "時速60kmで3時間走ると、道のりは何km？", answer: "180km", options: d("180km", "20km", "63km", "120km"), hint: "60 × 3 ＝ ?" },
        { question: "時速40kmで 80km進むのにかかる時間は？", answer: "2時間", options: d("2時間", "0.5時間", "120時間", "4時間"), hint: "80 ÷ 40 ＝ ?" },
        { question: "「時速」を「分速」に直すには？", answer: "60 で割る", options: d("60 で割る", "60 をかける", "100 で割る", "3600 をかける"), hint: "1時間は60分だからね。" },
        { question: "「秒速」を「時速」に直すには？", answer: "3600 をかける", options: d("3600 をかける", "60 をかける", "60 で割る", "3.6 で割る"), hint: "60分×60秒 ＝ 3600秒。" },
        { question: "分数の掛け算。 「(2/3) × 4 ＝ 」 答えは？", answer: "8/3 (2と2/3)", options: d("8/3", "2/12", "6/3", "1/6"), hint: "分子（上）にだけかけよう。" },
        { question: "分数の割り算。 「(4/5) ÷ 2 ＝ 」 答えは？", answer: "2/5 (4/10)", options: d("2/5", "4/10", "8/5", "2/10"), hint: "分子を割るか、分母にかける。" },
        { question: "「2/7 × 3/5 ＝ 」 答えは？", answer: "6/35", options: d("6/35", "5/12", "10/21", "6/12"), hint: "上どうし、下どうしをかけるよ。" },
        { question: "「(1/2) ÷ (1/3) ＝ 」 答えは？", answer: "3/2 (1.5)", options: d("3/2", "1/6", "2/3", "3"), hint: "ひっくり返してかけよう。" },
        { question: "「帯グラフ」と「円グラフ」の共通点は？", answer: "全体に対する割合を表している", options: d("割合を表す", "時間の変化を表す", "数そのものを表す", "形が四角い"), hint: "％の合計は100になるよ。" },
        { question: "変わり方の問題。 比例（ひれい）とは？", answer: "一方が2倍3倍になると、他方も2倍3倍になる関係", options: d("2倍3倍になる", "2倍になると半分になる", "足し算になる", "関係ない"), hint: "直線のグラフになるよ。" },
        { question: "比例のグラフ、必ず通る点は？", answer: "0（原点）", options: d("0", "1", "10", "最大値"), hint: "何もしていないときは0だね。" },
        { question: "底面が半径2cmの円、高さが5cmの 円柱の体積は？（π=3.14）", answer: "62.8cm³", options: d("62.8cm³", "20cm³", "31.4cm³", "12.56cm³"), hint: "2×2×3.14×5 ＝ ?" },
        { question: "15分間を「時間」で表すと？", answer: "0.25時間 (1/4時間)", options: d("0.25時間", "15時間", "0.15時間", "1.5時間"), hint: "15 ÷ 60 ＝ ?" },
        { question: "秒速 10m は 時速何km？", answer: "時速36km", options: d("時速36km", "時速10km", "時速60km", "時速360km"), hint: "10 × 3600 ＝ 36000m。" },
        { question: "多角形の内角の和。五角形は何度？（発展）", answer: "540度", options: d("540度", "360度", "180度", "720度"), hint: "三角形3つ分だよ。" },
        { question: "「人口密度」とは、面積 1k㎡ あたりに何人いるか？", answer: "そう", options: d("そう", "ちがう", "100人あたり", "1人あたり"), hint: "混み具合を表す単位量。" },
        { question: "分母が違う分数の引き算。 「1/2 － 1/4 ＝ 」", answer: "1/4", options: d("1/4", "0", "1/2", "1/6"), hint: "2/4 － 1/4 ＝ ?" },
        { question: "「3/4 × 4 ＝ 」 答えは？", answer: "3", options: d("3", "12/16", "3/16", "1"), hint: "分母と同じ数をかけると？" },
        { question: "「5 ÷ 1/2 ＝ 」 答えは？", answer: "10", options: d("10", "2.5", "5", "0.5"), hint: "半分で割ると、数は2倍になる。" },
        { question: "「□ ＋ 5 ＝ 12」 □ はいくつ？", answer: "7", options: d("7", "17", "5", "60"), hint: "12 － 5 ＝ ?" },
        { question: "「□ × 4 ＝ 32」 □ はいくつ？", answer: "8", options: d("8", "36", "28", "128"), hint: "32 ÷ 4 ＝ ?" },
        { question: "時速 5km で 15km 歩くのにかかる時間は？", answer: "3時間", options: d("3時間", "5時間", "10時間", "1時間"), hint: "15 ÷ 5 ＝ ?" },
        { question: "分速 80m で 10分歩くと、道のりは？", answer: "800m", options: d("800m", "8m", "80m", "8000m"), hint: "80 × 10 ＝ ?" },
        { question: "円周率 3.14。 「10 × 3.14」 は？", answer: "31.4", options: d("31.4", "314", "3.14", "31.04"), hint: "小数点を1つ右に。" },
        { question: "「100 × 3.14」 は？", answer: "314", options: d("314", "31.4", "3140", "3.14"), hint: "小数点を2つ右に。" },
        { question: "平均。 「10, 20, 30」 の平均は？", answer: "20", options: d("20", "60", "10", "30"), hint: "足して3で割る。" },
        { question: "「40, 0, 80」 の平均は？", answer: "40", options: d("40", "120", "60", "20"), hint: "0も1つとして数えるよ。" },
        { question: "角柱の「側面」の形はすべて何？", answer: "長方形（または正方形）", options: d("長方形", "三角形", "台形", "円"), hint: "まっすぐ立っているからね。" },
        { question: "六角柱の頂点の数は？", answer: "12こ", options: d("12こ", "6こ", "18こ", "8こ"), hint: "上と下に6個ずつ。" },
        { question: "五角柱の辺の数は？", answer: "15本", options: d("15本", "10本", "5本", "20本"), hint: "上、下、まわりに5本ずつ。" },
        { question: "円柱を展開図にすると、側面は何になる？", answer: "長方形", options: d("長方形", "円", "三角形", "扇形"), hint: "くるっと巻いてある部分だよ。" },
        { question: "円柱の展開図の、長方形の横の長さは、底面の何の長さと同じ？", answer: "円周の長さ", options: d("円周の長さ", "半径の長さ", "直径の長さ", "高さ"), hint: "ぴったり一周分だね。" },
        { question: "速さ。道のりが一定のとき、時間が2倍かかると、速さはどうなる？", answer: "半分になる", options: d("半分になる", "2倍になる", "変わらない", "4倍になる"), hint: "ゆっくり進んでいるということ。" },
        { question: "速さ。時間が一定のとき、速さを2倍にすると、道のりは？", answer: "2倍になる", options: d("2倍になる", "半分になる", "変わらない", "4倍になる"), hint: "たくさん進めるね。" },
        { question: "「800mL」 は 何L？", answer: "0.8L", options: d("0.8L", "8L", "80L", "0.08L"), hint: "1000mL ＝ 1L。" },
        { question: "「2.5m³」 は 何L？", answer: "2500L", options: d("2500L", "250L", "25L", "2.5L"), hint: "1m³ ＝ 1000L。" },
        { question: "割合（わりあい）。 「0.2」 を百分率で？", answer: "20%", options: d("20%", "2%", "0.2%", "200%"), hint: "100をかける。" },
        { question: "「75%」 を小数で？", answer: "0.75", options: d("0.75", "7.5", "0.075", "75"), hint: "100で割る。" },
        { question: "「1割」 を小数で？", answer: "0.1", options: d("0.1", "1", "0.01", "10"), hint: "10分の1。" },
        { question: "「5分（ぶ）」 を小数で？", answer: "0.05", options: d("0.05", "0.5", "5", "0.005"), hint: "100分の1。" },
        { question: "「40 ÷ 0.8」 の答えは？", answer: "50", options: d("50", "32", "4", "400"), hint: "400 ÷ 8 ＝ ?" },
        { question: "「0.6 × 0.7」 の答えは？", answer: "0.42", options: d("0.42", "4.2", "42", "0.042"), hint: "6 × 7 ＝ 42。" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g5Term1Units = splitIntoUnits(MATH_G5_1, 5);
const g5Term2Units = splitIntoUnits(MATH_G5_2, 5);
const g5Term3Units = splitIntoUnits(MATH_G5_3, 5);

export const MATH_G5_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G5_U01: [], // 整数 と 小数
    MATH_G5_U02: [], // 体積
    MATH_G5_U03: [], // 小数の かけ算
    MATH_G5_U04: [], // 小数の わり算
    MATH_G5_U05: [], // 合同な 図形
    MATH_G5_U06: [], // 分数 と 小数・整数
    MATH_G5_U07: [], // 分数の たし算 と ひき算
    MATH_G5_U08: [], // 平均
    MATH_G5_U09: [], // 単位量あたりの 大きさ
    MATH_G5_U10: [], // 速さ
    MATH_G5_U11: [], // 比例
    MATH_G5_U12: [], // 円 と 正多角形
    MATH_G5_U13: [], // 角柱 と 円柱
    MATH_G5_U14: [], // 割合
    MATH_G5_U15: [], // 帯グラフ と 円グラフ
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G5_U01': {
            const a = (n % 900) + 100;
            if (n % 2 === 0) {
                return { question: `${a} を 10でわると？`, answer: `${a / 10}`, options: d(`${a / 10}`, `${a * 10}`, `${a}`, `${a / 100}`), hint: "小数点を左へ1つ。" };
            }
            return { question: `${a / 10} を 10倍すると？`, answer: `${a}`, options: d(`${a}`, `${a / 10}`, `${a * 10}`, `${a / 100}`), hint: "10倍は 小数点を右へ1つ。" };
        }
        case 'MATH_G5_U02': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 3;
            const c = (n % 4) + 2;
            if (n % 2 === 0) {
                return { question: `たて${a}cm よこ${b}cm 高さ${c}cm の体積は？`, answer: `${a * b * c}cm3`, options: d(`${a * b * c}cm3`, `${a + b + c}cm3`, `${a * b}cm2`, `${a * b * c * 2}cm3`), hint: "たて×よこ×高さ。" };
            }
            return { question: `底面積が ${a * b}cm2、高さが ${c}cm の体積は？`, answer: `${a * b * c}cm3`, options: d(`${a * b * c}cm3`, `${a * b + c}cm3`, `${a * b}cm3`, `${c}cm3`), hint: "底面積×高さ。" };
        }
        case 'MATH_G5_U03': {
            const a = (n % 9) + 1;
            const b = (n % 8) + 1;
            const product = (a * b) / 100;
            if (n % 2 === 0) {
                return { question: `0.${a} × 0.${b} = ?`, answer: `${product}`, options: d(`${product}`, `0.${a * b}`, `${a * b}`, `0.00${a * b}`), hint: "小数第1位×小数第1位。" };
            }
            return { question: `0.${a} を ${b}倍すると？`, answer: `${(a * b) / 10}`, options: d(`${(a * b) / 10}`, `${product}`, `${a * b}`, `0.${a + b}`), hint: "小数×整数 でも考えられる。" };
        }
        case 'MATH_G5_U04': {
            const b = (n % 8) + 2;
            const q = (n % 6) + 1;
            const a = b * q;
            if (n % 2 === 0) {
                return { question: `${a}.${a % 10} ÷ ${b} = ?`, answer: `${q}.${Math.floor((a % 10) / b)}`, options: d(`${q}.${Math.floor((a % 10) / b)}`, `${q}`, `${a / b}`, `${q + 1}`), hint: "整数部分と小数部分を順に考える。" };
            }
            return { question: `${a}.${a % 10} を ${b} でわると、商は ${q} より 大きい？小さい？`, answer: "大きい", options: d("大きい", "小さい", "同じ", "わからない"), hint: "小数部分があるので ${q} より少し大きい。" };
        }
        case 'MATH_G5_U05': {
            return n % 2 === 0
                ? { question: "このような図形で合同とは？", answer: "形と大きさが同じ", options: d("形と大きさが同じ", "形だけ同じ", "面積だけ同じ", "色だけ同じ"), hint: "重ねてぴったり重なる。", visual: { kind: 'polygon', sides: 4 } }
                : { question: "三角形の合同条件の1つは？", answer: "3辺がそれぞれ等しい", options: d("3辺がそれぞれ等しい", "3角が等しい", "面積が等しい", "周が等しい"), hint: "辺と角の条件を使う。", visual: { kind: 'polygon', sides: 3 } };
        }
        case 'MATH_G5_U06': {
            const num = (n % 9) + 1;
            const p = n % 4;
            if (p === 0) {
                return { question: `${num}/10 を小数で書くと？`, answer: `0.${num}`, options: d(`0.${num}`, `${num}.0`, `${num}/100`, `1.${num}`), hint: "10分のいくつかを考える。", visual: { kind: 'fraction', numerator: num, denominator: 10 } };
            }
            if (p === 1) {
                return { question: `0.${num} を分数で書くと？`, answer: `${num}/10`, options: d(`${num}/10`, `${num}/100`, `${10}/${num}`, `${num}`), hint: "小数第一位は10分のいくつ。", visual: { kind: 'fraction', numerator: num, denominator: 10 } };
            }
            if (p === 2) {
                return { question: `${num}/10 は 1より 小さい？大きい？`, answer: "小さい", options: d("小さい", "大きい", "同じ", "わからない"), hint: "10分の1から9/10までは1より小さい。", visual: { kind: 'fraction', numerator: num, denominator: 10 } };
            }
            return { question: `${num}/10 と 0.${num} は 同じ？`, answer: "同じ", options: d("同じ", "ちがう", "くらべられない", "わからない"), hint: "分数と小数の対応。", visual: { kind: 'fraction', numerator: num, denominator: 10 } };
        }
        case 'MATH_G5_U07': {
            const denominator = (n % 8) + 2;
            const a = (n % (denominator - 1)) + 1;
            const b = Math.min(denominator - 1, a + 1);
            const p = n % 4;
            if (p === 0) {
                return {
                    question: `${a}/${denominator} + ${b}/${denominator} = ?`,
                    answer: `${a + b}/${denominator}`,
                    options: d(`${a + b}/${denominator}`, `${a + b}/${denominator * 2}`, `${a}/${denominator}`, `${b}/${denominator}`),
                    hint: "分母が同じなら分子を足す。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: denominator }, right: { n: b, d: denominator }, op: '+' }
                };
            }
            if (p === 1) {
                const big = Math.max(a, b);
                const small = Math.min(a, b);
                return {
                    question: `${big}/${denominator} - ${small}/${denominator} = ?`,
                    answer: `${big - small}/${denominator}`,
                    options: d(`${big - small}/${denominator}`, `${big + small}/${denominator}`, `${small}/${denominator}`, `${big}/${denominator}`),
                    hint: "分母が同じなら分子を引く。",
                    visual: { kind: 'fraction_operation', left: { n: big, d: denominator }, right: { n: small, d: denominator }, op: '-' }
                };
            }
            if (p === 2) {
                return {
                    question: `${a}/${denominator} と ${b}/${denominator}。 大きいのは？`,
                    answer: `${b}/${denominator}`,
                    options: d(`${b}/${denominator}`, `${a}/${denominator}`, "同じ", "くらべられない"),
                    hint: "分母が同じなら分子が大きいほう。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: denominator }, right: { n: b, d: denominator }, op: '>' }
                };
            }
            return {
                question: `${a}/${denominator} と ${a}/${denominator} は 同じ？`,
                answer: "同じ",
                options: d("同じ", "ちがう", `${a}/${denominator}`, `${b}/${denominator}`),
                hint: "同じ分数どうし。",
                visual: { kind: 'fraction_operation', left: { n: a, d: denominator }, right: { n: a, d: denominator }, op: '>' }
            };
        }
        case 'MATH_G5_U08': {
            const a = (n % 30) + 60;
            const b = (n % 20) + 70;
            const c = (n % 10) + 80;
            const avg = Math.floor((a + b + c) / 3);
            if (n % 2 === 0) {
                return { question: `${a}, ${b}, ${c} の平均は？`, answer: `${avg}`, options: d(`${avg}`, `${a + b + c}`, `${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`), hint: "合計÷個数。" };
            }
            return { question: `3この数の平均が ${avg}。 合計は？`, answer: `${avg * 3}`, options: d(`${avg * 3}`, `${avg}`, `${avg + 3}`, `${a + b + c}`), hint: "平均×個数。" };
        }
        case 'MATH_G5_U09': {
            const people = (n % 8 + 2) * 3;
            const area = (n % 4) + 2;
            if (n % 2 === 0) {
                return { question: `${area}m2 に ${people}人。1m2あたりは？`, answer: `${people / area}人`, options: d(`${people / area}人`, `${people * area}人`, `${people - area}人`, `${area / people}人`), hint: "人数÷面積。" };
            }
            return { question: `1m2あたり ${people / area}人 の部屋が ${area}m2。 全部で何人？`, answer: `${people}人`, options: d(`${people}人`, `${people / area}人`, `${area}人`, `${people + area}人`), hint: "単位量あたりの大きさ×広さ。" };
        }
        case 'MATH_G5_U10': {
            const speed = (n % 6 + 3) * 10;
            const h = (n % 4) + 1;
            if (n % 2 === 0) {
                return { question: `時速${speed}km で ${h}時間。道のりは？`, answer: `${speed * h}km`, options: d(`${speed * h}km`, `${speed / h}km`, `${speed + h}km`, `${h}km`), hint: "速さ×時間。" };
            }
            return { question: `${speed * h}km を ${h}時間で 進むと 時速は？`, answer: `${speed}km`, options: d(`${speed}km`, `${h}km`, `${speed * h}km`, `${speed / h}km`), hint: "道のり÷時間。" };
        }
        case 'MATH_G5_U11': {
            const x = (n % 6) + 1;
            if (n % 2 === 0) {
                return { question: `比例で y=3x。 x=${x} のとき y=?`, answer: `${3 * x}`, options: d(`${3 * x}`, `${x + 3}`, `${x}`, `${x * x}`), hint: "一定の割合で増える。" };
            }
            return { question: `比例で y=3x。 y=${3 * x} のとき x=?`, answer: `${x}`, options: d(`${x}`, `${3 * x}`, `${x + 3}`, `${x * x}`), hint: "比例定数 3 で わる。" };
        }
        case 'MATH_G5_U12': {
            const nSides = (n % 5) + 3;
            return { question: `この正${nSides}角形の中心角は？`, answer: `${360 / nSides}度`, options: d(`${360 / nSides}度`, `${180 / nSides}度`, `${nSides * 10}度`, "90度"), hint: "360÷辺の数。", visual: { kind: 'polygon', sides: nSides } };
        }
        case 'MATH_G5_U13': {
            const p = n % 6;
            if (p === 0) {
                return { question: "この立体（円柱）の底面の形は？", answer: "円", options: d("円", "三角形", "長方形", "正方形"), hint: "上下の面を考える。", visual: { kind: 'cylinder', showRadius: true, showHeight: true } };
            }
            if (p === 1) {
                const baseSides = (n % 2 === 0) ? 5 : 6;
                return { question: "角柱の体積公式は？", answer: "底面積×高さ", options: d("底面積×高さ", "底面周×高さ", "たて×よこ", "半径×高さ"), hint: "柱の体積は同じ形。", visual: { kind: 'prism', baseSides } };
            }
            if (p === 2) {
                return { question: "円柱の体積公式として正しいのは？", answer: "底面積×高さ", options: d("底面積×高さ", "円周×高さ", "半径×高さ", "直径×高さ"), hint: "角柱と同じ。", visual: { kind: 'cylinder', showRadius: true, showHeight: true } };
            }
            if (p === 3) {
                return { question: "円柱の展開図で、側面は何の形？", answer: "長方形", options: d("長方形", "三角形", "円", "台形"), hint: "まきついた面をひらく。", visual: { kind: 'cylinder', showNet: true } };
            }
            if (p === 4) {
                return { question: "三角柱の頂点の数は？", answer: "6こ", options: d("6こ", "3こ", "8こ", "9こ"), hint: "上に3こ、下に3こ。", visual: { kind: 'prism', baseSides: 3 } };
            }
            return { question: "三角柱の辺の数は？", answer: "9本", options: d("9本", "6本", "12本", "15本"), hint: "上3本、下3本、横3本。", visual: { kind: 'prism', baseSides: 3 } };
        }
        case 'MATH_G5_U14': {
            const base = (n % 9 + 1) * 100;
            const pct = ((n % 5) + 1) * 10;
            if (n % 2 === 0) {
                return { question: `${base}円 の ${pct}% は？`, answer: `${(base * pct) / 100}円`, options: d(`${(base * pct) / 100}円`, `${base - (base * pct) / 100}円`, `${pct}円`, `${base * pct}円`), hint: "もとにする量×割合。" };
            }
            return { question: `${base}円 の ${pct}%引き の ねだんは？`, answer: `${base - (base * pct) / 100}円`, options: d(`${base - (base * pct) / 100}円`, `${(base * pct) / 100}円`, `${base}円`, `${base + (base * pct) / 100}円`), hint: "割引は 元のねだん から ひく。" };
        }
        case 'MATH_G5_U15': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 1;
            const c = (n % 4) + 1;
            const total = a + b + c;
            const p = n % 4;
            if (p === 0) {
                return { question: `A,B,C の合計は？`, answer: `${total}`, options: d(`${total}`, `${a * b * c}`, `${a + b}`, `${a + c}`), hint: "まず全体を出す。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["A", "B", "C"] } };
            }
            if (p === 1) {
                const max = Math.max(a, b, c);
                const winners = ([["A", a], ["B", b], ["C", c]] as [string, number][]).filter(([, v]) => v === max).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "同じ";
                const wrongs = ["A", "B", "C", "同じ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `いちばん大きい割合の項目は？`, answer, options: d(answer, ...wrongs), hint: "最大値の項目。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["A", "B", "C"] } };
            }
            if (p === 2) {
                return { question: `A の割合は 全体の 何分のいくつ？`, answer: `${a}/${total}`, options: d(`${a}/${total}`, `${total}/${a}`, `${a + total}/${total}`, `${a}/${b + c}`), hint: "項目÷全体。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["A", "B", "C"] } };
            }
            return { question: `A と B の差は？`, answer: `${Math.abs(a - b)}`, options: d(`${Math.abs(a - b)}`, `${a + b}`, `${Math.max(a, b)}`, `${Math.min(a, b)}`), hint: "2つの差をみる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["A", "B"] } };
        }
        default:
            return { question: "5 + 5 = ?", answer: "10", options: d("10", "9", "11", "8"), hint: "たし算。" };
    }
};

Object.keys(MATH_G5_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G5_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

export const MATH_G5_DATA: Record<string, GeneralProblem[]> = {
    MATH_G5_1,
    MATH_G5_2,
    MATH_G5_3,
    ...MATH_G5_UNIT_DATA,
};

