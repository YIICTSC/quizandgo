
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

// --- 中1 1学期: 正負の数・文字式・一次方程式 (50問) ---
const MATH_G7_1: GeneralProblem[] = [
        { question: "「－5 ＋ 3」を計算せよ。", answer: "－2", options: d("－2", "2", "－8", "8"), hint: "0から左に5行って、右に3戻る。" },
        { question: "「(－4) × (－2)」を計算せよ。", answer: "8", options: d("8", "－8", "－6", "6"), hint: "負の数 × 負の数 は 正の数になるよ。" },
        { question: "「10 ÷ (－2)」を計算せよ。", answer: "－5", options: d("－5", "5", "－20", "8"), hint: "異符号の割り算の符号はマイナス。" },
        { question: "絶対値が 3 である数は？", answer: "3 と －3", options: d("3 と －3", "3 のみ", "－3 のみ", "0 と 3"), hint: "0からの距離が3の数を探そう。" },
        { question: "「x × y × 3」を文字式のルールで表すと？", answer: "3xy", options: d("3xy", "xy3", "x3y", "3＋x＋y"), hint: "数字が先、文字はアルファベット順。" },
        { question: "方程式「2x － 5 ＝ 11」を解け。", answer: "x ＝ 8", options: d("x ＝ 8", "x ＝ 3", "x ＝ 6", "x ＝ 13"), hint: "－5を移項して 2x ＝ 16。" },
        { question: "「係数（けいすう）」とは何のこと？", answer: "文字の前についている数字", options: d("文字の前の数字", "文字の種類", "式の答え", "カッコの数"), hint: "3x の 3 の部分だよ。" },
        { question: "「－12」と「－8」、大きいのはどちら？", answer: "－8", options: d("－8", "－12", "同じ", "比べられない"), hint: "数直線で右にあるほうが大きい。" },
        { question: "「(－2)³ 」の値を求めよ。", answer: "－8", options: d("－8", "8", "－6", "6"), hint: "(－2)×(－2)×(－2) を計算。" },
        { question: "累乗において「3²」の読み方は？", answer: "3の2乗", options: d("3の2乗", "3の2倍", "2の3乗", "32"), hint: "同じ数を2回かけること。" },
        { question: "x ＝ －2 のとき、 3x ＋ 10 の値は？", answer: "4", options: d("4", "16", "－16", "7"), hint: "xに －2 を代入して計算しよう。" },
        { question: "式を ＋ で区切ったそれぞれの部分を何という？", answer: "項（こう）", options: d("項", "係数", "変数", "定数"), hint: "3x － 5 なら、 3x と －5 がこれ。" },
        { question: "方程式で、＝をまたいで項を移動させることを？", answer: "移項（いこう）", options: d("移項", "変項", "移動", "交換"), hint: "符号が逆になるのがルール。" },
        { question: "分配法則を用い「3(x ＋ 2)」を展開せよ。", answer: "3x ＋ 6", options: d("3x ＋ 6", "3x ＋ 2", "3x ＋ 5", "x ＋ 6"), hint: "3をカッコの中の両方にかける。" },
        { question: "「x ＋ x」を文字式で表すと？", answer: "2x", options: d("2x", "x²", "xx", "2＋x"), hint: "同じ文字を足すと係数が変わる。" },
        { question: "「x × x」を文字式で表すと？", answer: "x²", options: d("x²", "2x", "xx", "x2"), hint: "同じ文字をかけると指数の形になる。" },
        { question: "「－(－7)」を簡単にせよ。", answer: "7", options: d("7", "－7", "0", "1"), hint: "マイナスのマイナスはプラス。" },
        { question: "「0 － 5」を計算せよ。", answer: "－5", options: d("－5", "5", "0", "なし"), hint: "0から5引くとマイナスになる。" },
        { question: "「(－6) ＋ (－4)」を計算せよ。", answer: "－10", options: d("－10", "10", "－2", "2"), hint: "借金がさらに増えるイメージ。" },
        { question: "「－3 － (－8)」を計算せよ。", answer: "5", options: d("5", "－11", "11", "－5"), hint: "－3 ＋ 8 に書き換えよう。" },
        { question: "「(－3) × 0」を計算せよ。", answer: "0", options: d("0", "－3", "3", "なし"), hint: "どんな数に0をかけても答えは同じ。" },
        { question: "「－12 ÷ (－4)」を計算せよ。", answer: "3", options: d("3", "－3", "－48", "48"), hint: "負 ÷ 負 は 正。" },
        { question: "「－1² 」の値を求めよ。", answer: "－1", options: d("－1", "1", "0", "－2"), hint: "1の2乗にマイナスがついている形。" },
        { question: "「(－1)² 」の値を求めよ。", answer: "1", options: d("1", "－1", "0", "11"), hint: "(－1) × (－1) を計算。" },
        { question: "「4 ＋ (－3) × 2」を計算せよ。", answer: "－2", options: d("－2", "2", "2.5", "14"), hint: "かけ算を先に計算しよう。" },
        { question: "「(4 － 9) × 3」を計算せよ。", answer: "－15", options: d("－15", "15", "3", "－3"), hint: "カッコの中から計算。" },
        { question: "「x ÷ (－4)」を文字式のルールで表すと？", answer: "－x/4", options: d("－x/4", "－4x", "x－4", "x/4"), hint: "割り算は分数の形にする。" },
        { question: "「1 × a」を文字式のルールで表すと？", answer: "a", options: d("a", "1a", "a1", "1"), hint: "1は省略するのがルール。" },
        { question: "「a × a × b」を文字式のルールで表すと？", answer: "a²b", options: d("a²b", "2ab", "ab²", "aabb"), hint: "同じ文字は指数の形にする。" },
        { question: "x ＝ 4 のとき、 －x² の値は？", answer: "－16", options: d("－16", "16", "－8", "8"), hint: "－(4×4) を計算。" },
        { question: "「3x ＋ 2x」を計算せよ。", answer: "5x", options: d("5x", "5x²", "x", "6x"), hint: "係数を足して文字をつける。" },
        { question: "「7y － 10y」を計算せよ。", answer: "－3y", options: d("－3y", "3y", "17y", "－17y"), hint: "7 － 10 ＝ ?" },
        { question: "「4x － (x － 5)」を計算せよ。", answer: "3x ＋ 5", options: d("3x ＋ 5", "3x － 5", "5x ＋ 5", "5x － 5"), hint: "カッコを外すとき符号に注意。" },
        { question: "「(12x － 8) ÷ 4」を計算せよ。", answer: "3x － 2", options: d("3x － 2", "3x － 8", "12x － 2", "3x ＋ 2"), hint: "両方の項を4で割る。" },
        { question: "「3x ＝ 21」 x の値は？", answer: "7", options: d("7", "18", "24", "63"), hint: "21 ÷ 3 を計算。" },
        { question: "「x/2 ＝ 10」 x の値は？", answer: "20", options: d("20", "5", "12", "8"), hint: "10 × 2 を計算。" },
        { question: "「5x ＋ 3 ＝ 2x ＋ 12」 移項して整理すると？", answer: "3x ＝ 9", options: d("3x ＝ 9", "7x ＝ 15", "3x ＝ 15", "7x ＝ 9"), hint: "xを左、数字を右に集める。" },
        { question: "「0.2x ＝ 1」 x の値は？", answer: "5", options: d("5", "0.2", "2", "10"), hint: "両辺を5倍するか、1÷0.2を計算。" },
        { question: "「1/3 x ＝ 4」 x の値は？", answer: "12", options: d("12", "4/3", "3/4", "7"), hint: "両辺を3倍しよう。" },
        { question: "方程式の解が x ＝ 3 であるものはどれ？", answer: "2x ＋ 1 ＝ 7", options: d("2x ＋ 1 ＝ 7", "x － 5 ＝ 2", "3x ＝ 1", "x ＋ 3 ＝ 0"), hint: "xに3を代入して成立するか確認。" },
        { question: "「xの3倍は yより5大きい」を等式にすると？", answer: "3x ＝ y ＋ 5", options: d("3x ＝ y ＋ 5", "3x ＋ 5 ＝ y", "x ＋ 3 ＝ y ＋ 5", "3xy ＝ 5"), hint: "言葉をそのまま式に直してみよう。" },
        { question: "絶対値が最も小さい整数は？", answer: "0", options: d("0", "1", "－1", "なし"), hint: "0から0までの距離は？" },
        { question: "数直線上で －3 から 5 までの距離は？", answer: "8", options: d("8", "2", "－2", "15"), hint: "右の数から左の数を引く。" },
        { question: "「－2 ＋ (－5) － (－4)」を計算せよ。", answer: "－3", options: d("－3", "－11", "7", "3"), hint: "－2 － 5 ＋ 4。" },
        { question: "「24 ÷ (－2)³ 」を計算せよ。", answer: "－3", options: d("－3", "3", "－4", "4"), hint: "累乗を先に計算。" },
        { question: "「3a － 5」の項をすべて答えよ。", answer: "3a と －5", options: d("3a と －5", "3 と －5", "a と 5", "3a"), hint: "マイナス記号は後ろの数に含める。" },
        { question: "「(2/3)x － (1/2)x」を計算せよ。", answer: "1/6 x", options: d("1/6 x", "1/x", "5/6 x", "1/5 x"), hint: "通分して 4/6 － 3/6。" },
        { question: "「4x ＋ 7 ＝ 15」 x の値は？", answer: "2", options: d("2", "8", "22", "5.5"), hint: "4x ＝ 8。" },
        { question: "「3(x － 4) ＝ 6」 x の値は？", answer: "6", options: d("6", "2", "10", "3"), hint: "x － 4 ＝ 2。" },
        { question: "不等式「x ＋ 3 ＞ 10」を解け。", answer: "x ＞ 7", options: d("x ＞ 7", "x ＜ 7", "x ≧ 7", "x ＝ 7"), hint: "不等号の向きに注意。" }
    ];

// --- 中1 2学期: 比例・反比例・平面図形 (50問) ---
const MATH_G7_2: GeneralProblem[] = [
        { question: "「比例（ひれい）」の基本の式は？", answer: "y ＝ ax", options: d("y ＝ ax", "y ＝ a/x", "y ＝ x ＋ a", "y ＝ ax²"), hint: "xが2倍になるとyも2倍になる関係。" },
        { question: "「反比例（はんぴれい）」の基本の式は？", answer: "y ＝ a/x", options: d("y ＝ a/x", "y ＝ ax", "xy ＝ a", "y ＝ x/a"), hint: "xが2倍になるとyは 1/2 倍になる。" },
        { question: "比例定数（ひれいていすう） a を求める式は？", answer: "a ＝ y/x", options: d("a ＝ y/x", "a ＝ x/y", "a ＝ xy", "a ＝ x ＋ y"), hint: "y ＝ ax を変形させよう。" },
        { question: "反比例で、x ＝ 2 のとき y ＝ 6。 比例定数 a は？", answer: "12", options: d("12", "3", "8", "4"), hint: "x × y ＝ a の形になるよ。" },
        { question: "「垂直二等分線」上の点は、線分の両端から？", answer: "等しい距離にある", options: d("等しい距離にある", "直角の位置にある", "遠くにある", "ランダム"), hint: "コンパスでかいた2つの円の交点。" },
        { question: "角の二等分線上の点は、角をなす2つの辺から？", answer: "等しい距離にある", options: d("等しい距離にある", "垂直である", "45度である", "離れている"), hint: "角を半分に分ける線の性質。" },
        { question: "円の「接線（せっせん）」は、接点を通る半径とどう交わる？", answer: "垂直に交わる", options: d("垂直に交わる", "平行になる", "45度で交わる", "交わらない"), hint: "接点での角度は常に90度。" },
        { question: "おうぎ形の面積の公式は？", answer: "π r² × (a/360)", options: d("π r² × (a/360)", "2π r × (a/360)", "π r²", "直径 × π"), hint: "円の面積の一部分として計算。" },
        { question: "半径6cm、中心角60度のおうぎ形の「弧の長さ」は？", answer: "2π cm", options: d("2π cm", "12π cm", "π cm", "6π cm"), hint: "円周 12π × (60/360)。" },
        { question: "座標平面で、(0, 0) の点を何という？", answer: "原点（げんてん）", options: d("原点", "始点", "中点", "端点"), hint: "x軸とy軸が交わるところ。" },
        { question: "座標 (3, －2) はどこにある？", answer: "第4象限（右下）", options: d("右下", "左上", "右上", "左下"), hint: "xがプラス、yがマイナスの領域。" },
        { question: "比例 y ＝ 2x のグラフが通る点は？", answer: "(1, 2)", options: d("(1, 2)", "(2, 1)", "(0, 2)", "(1, 0)"), hint: "x ＝ 1 を代入してみて。" },
        { question: "反比例 y ＝ 12/x のグラフが通らない点は？", answer: "(0, 0)", options: d("(0, 0)", "(1, 12)", "(3, 4)", "(－2, －6)"), hint: "分母が0になることはないよ。" },
        { question: "図形の移動。形を変えず、向きも変えず、ずらすだけの移動は？", answer: "平行移動", options: d("平行移動", "回転移動", "対称移動", "拡大移動"), hint: "スライドさせるイメージ。" },
        { question: "図形の移動。ある点を中心に回す移動は？", answer: "回転移動", options: d("回転移動", "平行移動", "対称移動", "反転移動"), hint: "コンパスのように回すよ。" },
        { question: "図形の移動。一本の直線を折り目にして裏返す移動は？", answer: "対称移動", options: d("対称移動", "平行移動", "回転移動", "投影"), hint: "鏡に映したような形。" },
        { question: "おうぎ形の弧の長さ l、半径 r、中心角 a。 公式は？", answer: "l ＝ 2πr × (a/360)", options: d("l ＝ 2πr × (a/360)", "l ＝ πr² × (a/360)", "l ＝ πr", "l ＝ 2r ＋ a"), hint: "円周の一部分だよ。" },
        { question: "半径10cmの円の面積は？（πを使う）", answer: "100π cm²", options: d("100π", "20π", "10π", "314"), hint: "半径 × 半径 × π。" },
        { question: "直径10cmの円の周りの長さは？", answer: "10π cm", options: d("10π", "5π", "20π", "100π"), hint: "直径 × π。" },
        { question: "比例のグラフが (2, 6) を通る。式は？", answer: "y ＝ 3x", options: d("y ＝ 3x", "y ＝ x ＋ 4", "y ＝ 12/x", "y ＝ 6x"), hint: "6 ÷ 2 ＝ 3。" },
        { question: "反比例のグラフが (2, 4) を通る。式は？", answer: "y ＝ 8/x", options: d("y ＝ 8/x", "y ＝ 2x", "y ＝ x ＋ 2", "y ＝ 4/x"), hint: "2 × 4 ＝ 8。" },
        { question: "比例 y ＝ －2x のグラフの傾きは？", answer: "右下がり", options: d("右下がり", "右上がり", "水平", "垂直"), hint: "比例定数がマイナスなら？" },
        { question: "反比例のグラフの形を何という？", answer: "双曲線（そうきょくせん）", options: d("双曲線", "直線", "放物線", "折れ線"), hint: "2本の滑らかなカーブ。" },
        { question: "点 A(－4, 5) の y軸対称な点の座標は？", answer: "(4, 5)", options: d("(4, 5)", "(－4, －5)", "(4, －5)", "(5, －4)"), hint: "左右（xの符号）が入れ替わる。" },
        { question: "点 B(2, 3) の原点対称な点の座標は？", answer: "(－2, －3)", options: d("(－2, －3)", "(2, －3)", "(－2, 3)", "(3, 2)"), hint: "xもyも符号が逆になる。" },
        { question: "100kmの道を時速 x kmで進むときにかかる時間 y。式は？", answer: "y ＝ 100/x", options: d("y ＝ 100/x", "y ＝ 100x", "y ＝ x/100", "y ＝ 100 ＋ x"), hint: "道のり ÷ 速さ ＝ 時間。" },
        { question: "三角形の底辺を固定し、高さを x 倍にすると面積 y はどうなる？", answer: "比例する", options: d("比例する", "反比例する", "変わらない", "2乗に比例"), hint: "高さが2倍になれば面積も2倍。" },
        { question: "円の中にひける一番長い直線を何という？", answer: "直径", options: d("直径", "半径", "弦", "接線"), hint: "中心を通る線だよ。" },
        { question: "コンパスで円の一部分をかいたものを何という？", answer: "弧（こ）", options: d("弧", "弦", "半径", "接線"), hint: "弓のような形。" },
        { question: "円周上の2点をつなぐ直線を何という？", answer: "弦（げん）", options: d("弦", "弧", "直径", "接線"), hint: "弓の糸の部分だね。" },
        { question: "おうぎ形の2本の半径がつくる角を何という？", answer: "中心角", options: d("中心角", "頂角", "底角", "対角"), hint: "円の中心にある角。" },
        { question: "おうぎ形の面積 S、半径 r、弧の長さ l を使った公式は？（発展）", answer: "S ＝ 1/2 lr", options: d("S ＝ 1/2 lr", "S ＝ lr", "S ＝ l ＋ r", "S ＝ πrl"), hint: "三角形の面積公式に似ているよ。" },
        { question: "比例 y ＝ 3x で x の変域が 1 ≦ x ≦ 4 のとき、y の変域は？", answer: "3 ≦ y ≦ 12", options: d("3 ≦ y ≦ 12", "1 ≦ y ≦ 4", "0 ≦ y ≦ 12", "3 ≦ y ≦ 4"), hint: "最小値と最大値を代入。" },
        { question: "反比例 y ＝ 12/x で x＝2 のとき y＝6。 x＝4 のとき y は？", answer: "3", options: d("3", "6", "12", "1.5"), hint: "12 ÷ 4 ＝ ?" },
        { question: "比例定数 a が 0 より小さい比例のグラフが通る象限は？", answer: "第2、第4象限", options: d("第2、第4象限", "第1、第3象限", "全部", "x軸の上だけ"), hint: "左上から右下へ通るよ。" },
        { question: "「垂直二等分線」をかくとき、円の半径はどうする？", answer: "線分の半分より長くする", options: d("半分より長く", "半分より短く", "線分と同じ", "なんでもいい"), hint: "交わらないと線が引けないからね。" },
        { question: "角の二等分線。頂点を中心に円をかいた後、次はどこから円をかく？", answer: "円と2つの辺の交点から", options: d("交点から", "また頂点から", "適当な場所から", "分度器で測る"), hint: "2つの交点から等距離の点を探す。" },
        { question: "x ＝ －3 のとき、 y ＝ 9 である比例の式は？", answer: "y ＝ －3x", options: d("y ＝ －3x", "y ＝ 3x", "y ＝ －27/x", "y ＝ x ＋ 12"), hint: "9 ÷ (－3) ＝ －3。" },
        { question: "変数 x のとりうる値の範囲を何という？", answer: "変域（へんいき）", options: d("変域", "領域", "区域", "全域"), hint: "「x ≧ 0」などのこと。" },
        { question: "比例定数 a ＝ 0 のとき、 y ＝ ax は比例と言える？", answer: "いいえ", options: d("いいえ", "はい", "たまに", "わからない"), hint: "a は 0 ではない定数である必要があるよ。" },
        { question: "反比例のグラフ。xの値が大きくなるとyの値は0に？", answer: "近づくが、決して重ならない", options: d("近づくが重ならない", "0になる", "離れていく", "マイナスになる"), hint: "軸に限りなく近づく線（漸近線）。" },
        { question: "面積が 18π cm²、半径が 6cm のおうぎ形の中心角は？", answer: "180度", options: d("180度", "90度", "60度", "120度"), hint: "円の面積 36π の半分だね。" },
        { question: "弧の長さが 4π cm、直径が 12cm のおうぎ形の中心角は？", answer: "120度", options: d("120度", "60度", "90度", "180度"), hint: "円周 12π の 1/3。" },
        { question: "三角形の各頂点を通る円を何という？", answer: "外接円（がいせつえん）", options: d("外接円", "内接円", "同心円", "楕円"), hint: "外側で接する円。" },
        { question: "外接円の中心を求めるには、何の線をひく？", answer: "各辺の垂直二等分線", options: d("垂直二等分線", "角の二等分線", "中線", "垂線"), hint: "3つの頂点から等距離の点を探す。" },
        { question: "座標 (－5, 0) はどこの上にある？", answer: "x軸の上", options: d("x軸の上", "y軸の上", "原点", "第2象限"), hint: "yが0なら動かない。" },
        { question: "比例のグラフが (0, 0) 以外を通ることはある？", answer: "いいえ", options: d("いいえ", "はい", "切片があれば", "わからない"), hint: "y＝ax は必ず原点を通る。" },
        { question: "比例定数が分数のとき（y ＝ 1/2 xなど）、グラフはどうなる？", answer: "傾きがゆるやかな直線", options: d("ゆるやかな直線", "急な直線", "曲線", "階段状"), hint: "xが2進んでyが1上がる。" },
        { question: "平面上の点の位置を確定させるのに必要な数字はいくつ？", answer: "2つ", options: d("2つ", "1つ", "3つ", "なし"), hint: "x座標とy座標だね。" },
    ];

// --- 中1 3学期: 空間図形・データの活用 (50問) ---
const MATH_G7_3: GeneralProblem[] = [
        { question: "すべての面が合同な正多角形で、頂点に集まる面の数も等しい立体を？", answer: "正多面体", options: d("正多面体", "半多面体", "角柱", "球"), hint: "世界に5種類しかない特別な形。" },
        { question: "正多面体は全部で何種類？", answer: "5種類", options: d("5種類", "4種類", "6種類", "無限"), hint: "4, 6, 8, 12, 20面体があるよ。" },
        { question: "「角柱」の体積を求める公式は？", answer: "底面積 × 高さ", options: d("底面積 × 高さ", "底面積 × 高さ ÷ 3", "底面積 ＋ 高さ", "辺の合計"), hint: "積み重ねるイメージだね。", visual: { kind: 'prism', baseSides: 6 } },
        { question: "「角錐（かくすい）」の体積を求める公式は？", answer: "底面積 × 高さ ÷ 3", options: d("底面積 × 高さ ÷ 3", "底面積 × 高さ", "底面積 × 高さ × 2", "半径³"), hint: "尖（とが）っている形は 1/3 になる。", visual: { kind: 'pyramid', baseSides: 4 } },
        { question: "球（きゅう）の体積を求める公式は？", answer: "4/3 π r³", options: d("4/3 π r³", "4 π r²", "π r²", "2 π r"), hint: "「身の上に心配（4/3π）あーる（r）参（3乗）じょう」。" },
        { question: "球の表面積を求める公式は？", answer: "4 π r²", options: d("4 π r²", "4/3 π r³", "2 π r", "π r²"), hint: "「心配（4π）あーる（r）二（2乗）じょう」。" },
        { question: "見取り図に対して、真上や真横から見た図をまとめたものを？", answer: "投影図（とうえいず）", options: d("投影図", "展開図", "設計図", "鳥瞰図"), hint: "立面図と平面図で表すよ。" },
        { question: "平面図形を、1つの直線を軸として1回転させてできる立体を？", answer: "回転体", options: d("回転体", "多面体", "正多面体", "錐体"), hint: "円柱や円錐がこれにあたる。" },
        { question: "長方形を1回転させると何ができる？", answer: "円柱", options: d("円柱", "円錐", "球", "角柱"), hint: "トイレットペーパーの芯のような形。", visual: { kind: 'cylinder', showRadius: true, showHeight: true } },
        { question: "直角三角形を、直角をはさむ1辺を軸に回転させると？", answer: "円錐", options: d("円錐", "円柱", "球", "三角柱"), hint: "アイスのコーンのような形。", visual: { kind: 'cone', showRadius: true, showHeight: true } },
        { question: "半円を、その直径を軸に回転させると？", answer: "球", options: d("球", "円柱", "円錐", "ドーナツ"), hint: "どこから見ても丸い形。" },
        { question: "資料の整理。データの合計を個数で割った値を？", answer: "平均値", options: d("平均値", "中央値", "最頻値", "範囲"), hint: "一番よく使われる代表値。" },
        { question: "データを大きさ順に並べたとき、ちょうど中央にくる値を？", answer: "中央値（メジアン）", options: d("中央値", "平均値", "最頻値", "偏差"), hint: "真ん中の順位の値。" },
        { question: "データの中で、最も頻繁に現れる値を？", answer: "最頻値（モード）", options: d("最頻値", "平均値", "中央値", "階級値"), hint: "一番人気のある値。" },
        { question: "資料を整理するために分けた区間のことを何という？", answer: "階級（かいきゅう）", options: d("階級", "度数", "範囲", "標本"), hint: "「0点以上10点未満」など。" },
        { question: "各階級に入るデータの個数を何という？", answer: "度数（どすう）", options: d("度数", "階級値", "累積度数", "相対度数"), hint: "何人（何個）いるかという数。" },
        { question: "（ある階級の度数） ÷ （度数の合計） で求められる割合は？", answer: "相対度数（そうたいどすう）", options: d("相対度数", "累積度数", "階級値", "平均値"), hint: "全体に対する割合。合計は1になる。" },
        { question: "度数分布表をグラフにした、柱状の図を何という？", answer: "ヒストグラム", options: d("ヒストグラム", "折れ線グラフ", "円グラフ", "散布図"), hint: "データの散らばりが見やすいよ。" },
        { question: "ヒストグラムの各柱の真ん中を結んだ折れ線を？", answer: "度数分布多角形", options: d("度数分布多角形", "回帰線", "平均線", "等高線"), hint: "分布の形がより滑らかに見える。" },
        { question: "正八面体の1つの面の形は？", answer: "正三角形", options: d("正三角形", "正方形", "正五角形", "円"), hint: "ピラミッドを2つ合わせたような形。" },
        { question: "正十二面体の1つの面の形は？", answer: "正五角形", options: d("正五角形", "正三角形", "正方形", "正六角形"), hint: "サッカーボールのパーツに似ているね。" },
        { question: "円錐の展開図。側面はどのような形になる？", answer: "おうぎ形", options: d("おうぎ形", "長方形", "円", "三角形"), hint: "くるっと巻くと尖るよ。", visual: { kind: 'cone', showNet: true } },
        { question: "円錐の展開図で、側面の弧の長さは底面の何と同じ？", answer: "底面の円周", options: d("底面の円周", "直径", "半径", "高さ"), hint: "ぴったり重なるからね。" },
        { question: "立体の表面全体の面積を何という？", answer: "表面積（ひょうめんせき）", options: d("表面積", "底面積", "側面積", "容積"), hint: "底面積 ＋ 側面積。" },
        { question: "三角柱の辺の数は？", answer: "9本", options: d("9本", "6本", "5本", "12本"), hint: "上3本、下3本、横3本。" },
        { question: "四角錐の頂点の数は？", answer: "5個", options: d("5個", "4個", "8個", "1個"), hint: "底面に4つ、てっぺんに1つ。", visual: { kind: 'pyramid', baseSides: 4 } },
        { question: "円柱を真横から見ると、どんな形に見える？", answer: "長方形", options: d("長方形", "円", "正方形", "三角形"), hint: "投影図（立面図）の話だよ。", visual: { kind: 'cylinder', showRadius: true, showHeight: true } },
        { question: "円錐を真上から見ると、何が見える？", answer: "円と中心の点", options: d("円と点", "ただの円", "三角形", "点だけ"), hint: "てっぺんが中心に見える。", visual: { kind: 'cone', showRadius: true, showHeight: true } },
        { question: "「近似値（きんじち）」から「真の値」を引いた差を？", answer: "誤差（ごさ）", options: d("誤差", "範囲", "公差", "偏差"), hint: "測定ミスや四捨五入で生じるズレ。" },
        { question: "有効数字が2けたのとき、1234 はどう表す？（発展）", answer: "1.2 × 10³", options: d("1.2 × 10³", "1200", "12", "1.23"), hint: "重要な桁だけを残す書き方。" },
        { question: "相対度数の合計は、計算が合っていれば必ずいくつになる？", answer: "1", options: d("1", "100", "0", "度数の合計"), hint: "割合の合計だからね。" },
        { question: "資料の中で、最大の値から最小の値を引いたものは？", answer: "範囲", options: d("範囲", "階級", "中央値", "最頻値"), hint: "データの幅（レンジ）。" },
        { question: "10人のテスト結果が全員50点だった。平均値は？", answer: "50点", options: d("50点", "500点", "5点", "0点"), hint: "計算するまでもないね。" },
        { question: "5人の身長が 140, 145, 150, 155, 180。中央値は？", answer: "150", options: d("150", "145", "155", "154"), hint: "3番目の人の値。" },
        { question: "データ数が偶数（10個など）のとき、中央値はどう出す？", answer: "真ん中2つの平均をとる", options: d("2つの平均", "大きい方", "小さい方", "出せない"), hint: "5番目と6番目の間を計算。" },
        { question: "円柱の側面積 ＝ （ ？ ） × 高さ", answer: "底面の円周", options: d("底面の円周", "底面積", "半径", "直径"), hint: "展開図の長方形の横の長さ。" },
        { question: "正四面体の頂点の数は？", answer: "4個", options: d("4個", "6個", "8個", "12個"), hint: "面、辺、頂点。すべて4, 6, 4。" },
        { question: "立方体（正六面体）の辺の数は？", answer: "12本", options: d("12本", "6本", "8本", "24本"), hint: "ティッシュ箱の角の数。" },
        { question: "錐体の体積は、同じ底面と高さを持つ柱体の何倍？", answer: "1/3 倍", options: d("1/3 倍", "3倍", "1/2 倍", "同じ"), hint: "「÷3」を忘れないで。" },
        { question: "半径3cmの球の表面積は？", answer: "36π cm²", options: d("36π", "12π", "108π", "9π"), hint: "4 × π × 3² ＝ ?" },
        { question: "半径3cmの球の体積は？", answer: "36π cm³", options: d("36π", "12π", "108π", "27π"), hint: "4/3 × π × 3³ ＝ ?" },
        { question: "「30点以上40点未満」の階級値は？", answer: "35点", options: d("35点", "30点", "40点", "10点"), hint: "階級の真ん中の値。" },
        { question: "相対度数を 100倍すると何になる？", answer: "％（パーセント）", options: d("％", "度数", "階級", "累計"), hint: "割合の表し方を変えただけ。" },
        { question: "母集団から標本を取り出すとき、偏りがないようにすることを？", answer: "無作為（むさくい）に抽出する", options: d("無作為に抽出", "適当に選ぶ", "好きなのを選ぶ", "全部調べる"), hint: "「ランダムに」という意味だよ。" },
        { question: "標本調査で、取り出す一部の資料を何という？", answer: "標本（サンプル）", options: d("標本", "母集団", "全数", "個体"), hint: "全体を代表する一部。" },
        { question: "立方体の対角線の数は？", answer: "4本", options: d("4本", "8本", "12本", "1本"), hint: "中を突き抜ける一番長い線。" },
        { question: "円柱の展開図。側面（長方形）の縦の長さは何？", answer: "円柱の高さ", options: d("高さ", "直径", "半径", "円周"), hint: "そのままの高さだね。" },
        { question: "多角柱の辺の数。底面が n 角形なら？", answer: "3n 本", options: d("3n", "2n", "n+2", "4n"), hint: "上n、下n、横n。" },
        { question: "正六角柱の面の数は？", answer: "8個", options: d("8個", "6個", "12個", "18個"), hint: "側面6枚 ＋ 底面2枚。" },
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

const g7Term1Units = splitIntoUnitsByCounts(MATH_G7_1, [1, 1, 1, 1]);
const g7Term2Units = splitIntoUnitsByCounts(MATH_G7_2, [1, 1, 1, 1]);
const g7Term3Units = splitIntoUnitsByCounts(MATH_G7_3, [1, 1, 1]);

export const MATH_G7_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G7_U01: [], // 正の数 と 負の数
    MATH_G7_U02: [], // 正負の数の 加法 と 減法
    MATH_G7_U03: [], // 正負の数の 乗法 と 除法
    MATH_G7_U04: [], // 文字式
    MATH_G7_U05: [], // 文字式の 計算
    MATH_G7_U06: [], // 一次方程式
    MATH_G7_U07: [], // 一次方程式の 利用
    MATH_G7_U08: [], // 比例 と 反比例
    MATH_G7_U09: [], // 平面図形
    MATH_G7_U10: [], // 空間図形
    MATH_G7_U11: [], // 資料の 整理 と 活用
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G7_U01': {
            const a = (n % 9) + 1;
            if (n % 2 === 0) {
                return { question: `正の数と負の数。 ${a} の反対の数は？`, answer: `${-a}`, options: d(`${-a}`, `${a}`, "0", `${a + 1}`), hint: "符号を反転。" };
            }
            return { question: `数直線で 0 から ${a} はなれた負の数は？`, answer: `${-a}`, options: d(`${-a}`, `${a}`, "0", `${-(a + 1)}`), hint: "負の向きに ${a} 進む。" };
        }
        case 'MATH_G7_U02': {
            const a = (n % 7) + 2;
            const b = (n % 6) + 1;
            if (n % 2 === 0) {
                return { question: `${a} + (${ -b }) = ?`, answer: `${a - b}`, options: d(`${a - b}`, `${a + b}`, `${b - a}`, `${a}`), hint: "符号に注意して加減。" };
            }
            return { question: `${a} - ${b} = ?`, answer: `${a - b}`, options: d(`${a - b}`, `${a + b}`, `${b - a}`, `${-a - b}`), hint: "減法を加法に直してもよい。" };
        }
        case 'MATH_G7_U03': {
            const a = (n % 8) + 2;
            const b = (n % 7) + 2;
            if (n % 2 === 0) {
                return { question: `(${ -a }) × (${ b }) = ?`, answer: `${-(a * b)}`, options: d(`${-(a * b)}`, `${a * b}`, `${-a + b}`, `${a - b}`), hint: "異符号の積は負。" };
            }
            return { question: `(${-(a * b)}) ÷ (${b}) = ?`, answer: `${-a}`, options: d(`${-a}`, `${a}`, `${-b}`, `${a * b}`), hint: "積と商の関係で考える。" };
        }
        case 'MATH_G7_U04': {
            const x = (n % 9) + 2;
            if (n % 2 === 0) {
                return { question: `文字式。 x=${x} のとき 2x+3 の値は？`, answer: `${2 * x + 3}`, options: d(`${2 * x + 3}`, `${x + 3}`, `${2 * x}`, `${x * x}`), hint: "代入して計算。" };
            }
            return { question: `文字式。 x を使って「${x}円のノートを2冊と3円」を表す式は？`, answer: `2x+3`, options: d(`2x+3`, `${x}+3`, `2+3x`, `x²+3`), hint: "個数はかけ算で表す。" };
        }
        case 'MATH_G7_U05': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 1;
            if (n % 2 === 0) {
                return { question: `${a}x + ${b}x = ?`, answer: `${a + b}x`, options: d(`${a + b}x`, `${a * b}x`, `${a + b}`, `${a - b}x`), hint: "同類項をまとめる。" };
            }
            return { question: `${a + b}x を 2つの同類項の和で表すと？`, answer: `${a}x + ${b}x`, options: d(`${a}x + ${b}x`, `${a * b}x`, `${a + b}`, `${a} + ${b}x`), hint: "係数を分けて考える。" };
        }
        case 'MATH_G7_U06': {
            const x = (n % 7) + 2;
            const a = (n % 4) + 2;
            const b = a * x + 3;
            if (n % 2 === 0) {
                return { question: `${a}x + 3 = ${b}。xは？`, answer: `${x}`, options: d(`${x}`, `${x + 1}`, `${x - 1}`, `${a}`), hint: "移項して解く。" };
            }
            return { question: `${a}x = ${a * x}。xは？`, answer: `${x}`, options: d(`${x}`, `${a}`, `${a * x}`, `${x + 1}`), hint: "両辺を ${a} で割る。" };
        }
        case 'MATH_G7_U07': {
            const p = (n % 5) + 2;
            const q = (n % 6) + 4;
            const total = p * q;
            if (n % 2 === 0) {
                return { question: `一次方程式の利用。1個${p}円の品をx個買って${total}円。xは？`, answer: `${q}`, options: d(`${q}`, `${p}`, `${total}`, `${q + 1}`), hint: "px=total の形。" };
            }
            return { question: `x個で${total}円。1個${p}円のとき x を表す式は？`, answer: `${total}/${p}`, options: d(`${total}/${p}`, `${p}/${total}`, `${p}x=${total}`, `${total}-${p}`), hint: "合計 ÷ 単価。" };
        }
        case 'MATH_G7_U08': {
            const x = (n % 6) + 1;
            if (n % 2 === 0) {
                return { question: `比例 y=5x。x=${x} のとき y=?`, answer: `${5 * x}`, options: d(`${5 * x}`, `${x + 5}`, `${x * x}`, `${x}`), hint: "y=ax。" };
            }
            return { question: `反比例 y=20/x。x=${x} のとき y=?`, answer: `${20 / x}`, options: d(`${20 / x}`, `${5 * x}`, `${x + 20}`, `${x}`), hint: "xとyの積が一定。" };
        }
        case 'MATH_G7_U09': {
            return n % 3 === 0
                ? { question: "この三角形の内角の和は？", answer: "180度", options: d("180度", "360度", "90度", "270度"), hint: "基本。", visual: { kind: 'polygon', sides: 3, labels: ['A', 'B', 'C'] } }
                : n % 3 === 1
                ? { question: "平行線と同位角の関係は？", answer: "等しい", options: d("等しい", "和が180度", "直角", "不定"), hint: "平行線の角の性質。", visual: { kind: 'angle', degrees: 60, parallelLines: true, labels: ['a', 'a'] } }
                : { question: "平行線と錯角の関係は？", answer: "等しい", options: d("等しい", "和が180度", "直角", "不定"), hint: "Zの形の角。", visual: { kind: 'angle', degrees: 60, parallelLines: true, labels: ['x', 'x'] } };
        }
        case 'MATH_G7_U10': {
            const p = n % 6;
            if (p === 0) {
                return { question: "この立体の頂点の数は？", answer: "8個", options: d("8個", "6個", "12個", "4個"), hint: "基本の立体。", visual: { kind: 'cube', showHiddenEdges: true, labels: ['A', 'B', 'C', 'D'] } };
            }
            if (p === 1) {
                return { question: "この立体の辺の数は？", answer: "12本", options: d("12本", "8本", "6本", "16本"), hint: "骨組みを数える。", visual: { kind: 'cube', showHiddenEdges: true, labels: ['A', 'B', 'C', 'D'] } };
            }
            if (p === 2) {
                return { question: "この立体の面の数は？", answer: "6個", options: d("6個", "8個", "12個", "4個"), hint: "上下左右前後。", visual: { kind: 'cube', showHiddenEdges: true, labels: ['A', 'B', 'C', 'D'] } };
            }
            if (p === 3) {
                return { question: "角柱の体積公式は？", answer: "底面積×高さ", options: d("底面積×高さ", "底面周×高さ", "たて×よこ", "辺の和"), hint: "柱の体積。", visual: { kind: 'cube' } };
            }
            if (p === 4) {
                return { question: "円柱の体積公式は？", answer: "底面積×高さ", options: d("底面積×高さ", "円周×高さ", "半径×高さ", "直径×高さ"), hint: "円柱も柱。", visual: { kind: 'circle' } };
            }
            return { question: "円柱の展開図で、側面は何の形？", answer: "長方形", options: d("長方形", "円", "三角形", "台形"), hint: "まいた面を広げる。", visual: { kind: 'circle' } };
        }
        case 'MATH_G7_U11': {
            const a = (n % 30) + 40;
            const b = (n % 20) + 50;
            const c = (n % 10) + 60;
            const avg = Math.floor((a + b + c) / 3);
            const p = n % 4;
            if (p === 0) {
                return { question: `資料の整理。${a}, ${b}, ${c} の平均は？`, answer: `${avg}`, options: d(`${avg}`, `${a + b + c}`, `${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`), hint: "合計÷個数。" };
            }
            if (p === 1) {
                return { question: `資料の整理。中央値（小さい順の真ん中）は？`, answer: `${[a, b, c].sort((x, y) => x - y)[1]}`, options: d(`${[a, b, c].sort((x, y) => x - y)[1]}`, `${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`, `${avg}`), hint: "並べ替えて中央を見る。" };
            }
            if (p === 2) {
                return { question: `資料の整理。範囲（最大-最小）は？`, answer: `${Math.max(a, b, c) - Math.min(a, b, c)}`, options: d(`${Math.max(a, b, c) - Math.min(a, b, c)}`, `${a + b + c}`, `${avg}`, `${Math.max(a, b, c)}`), hint: "散らばりの大きさ。" };
            }
            return { question: `資料の整理。最大値は？`, answer: `${Math.max(a, b, c)}`, options: d(`${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`, `${avg}`, `${a + b + c}`), hint: "最も大きいデータ。" };
        }
        default:
            return { question: "1 + 1 = ?", answer: "2", options: d("2", "1", "3", "0"), hint: "基本。" };
    }
};

fillGeneratedUnitProblems(MATH_G7_UNIT_DATA, makeUnitProblem);

export const MATH_G7_DATA: Record<string, GeneralProblem[]> = {
    MATH_G7_1,
    MATH_G7_2,
    MATH_G7_3,
    ...MATH_G7_UNIT_DATA,
};

