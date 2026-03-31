
import { GeneralProblem, d } from './utils';

export const MATH_G9_DATA: Record<string, GeneralProblem[]> = {
    // --- 1学期: 式の展開・因数分解、平方根、二次方程式 (50問) ---
    MATH_G9_1: [
        { question: "(x + 2)(x + 3) を展開せよ。", answer: "x² + 5x + 6", options: d("x² + 5x + 6", "x² + 6x + 5", "x² + 5", "2x + 5"), hint: "(x+a)(x+b) = x²+(a+b)x+ab" },
        { question: "(x - 4)² を展開せよ。", answer: "x² - 8x + 16", options: d("x² - 8x + 16", "x² - 16", "x² + 16", "x² - 4x + 8"), hint: "(a-b)² = a²-2ab+b²" },
        { question: "(x + 5)(x - 5) を展開せよ。", answer: "x² - 25", options: d("x² - 25", "x² + 25", "x² - 10x", "2x"), hint: "(a+b)(a-b) = a²-b²" },
        { question: "(2x + 1)(x + 4) を展開せよ。", answer: "2x² + 9x + 4", options: d("2x² + 9x + 4", "2x² + 8x + 4", "2x² + 5x + 4", "2x² + 9x + 1"), hint: "順番にかけていこう。" },
        { question: "x² + 7x + 10 を因数分解せよ。", answer: "(x + 2)(x + 5)", options: d("(x + 2)(x + 5)", "(x + 10)(x + 1)", "(x - 2)(x - 5)", "(x - 10)(x - 1)"), hint: "足して7、かけて10になる組み合わせ。" },
        { question: "x² - 9 を因数分解せよ。", answer: "(x + 3)(x - 3)", options: d("(x + 3)(x - 3)", "(x - 3)²", "(x + 9)(x - 1)", "(x - 9)(x + 1)"), hint: "2乗の差の形。" },
        { question: "x² - 6x + 9 を因数分解せよ。", answer: "(x - 3)²", options: d("(x - 3)²", "(x + 3)²", "(x + 3)(x - 3)", "(x - 9)(x + 1)"), hint: "整式の2乗になる形。" },
        { question: "3x² + 6x を因数分解せよ。", answer: "3x(x + 2)", options: d("3x(x + 2)", "x(3x + 6)", "3(x² + 2x)", "3x(x + 6)"), hint: "共通因数 3x をくくり出す。" },
        { question: "「9」の平方根は？", answer: "3 と -3", options: d("3 と -3", "3 のみ", "81", "±9"), hint: "2乗して9になる数は2つある。" },
        { question: "√16 の値は？", answer: "4", options: d("4", "-4", "±4", "8"), hint: "ルート記号が表すのは正の数。" },
        { question: "√2 × √3 を計算せよ。", answer: "√6", options: d("√6", "√5", "6", "5"), hint: "√a × √b = √ab" },
        { question: "√12 を a√b の形に直せ。", answer: "2√3", options: d("2√3", "3√2", "4√3", "2√6"), hint: "12 = 4 × 3 = 2² × 3。" },
        { question: "3/√2 の分母を有理化せよ。", answer: "3√2 / 2", options: d("3√2 / 2", "3√2", "√2 / 3", "1.5"), hint: "分母と分子に √2 をかける。" },
        { question: "2√5 + 4√5 を計算せよ。", answer: "6√5", options: d("6√5", "8√5", "6√10", "40"), hint: "同じルートの項は係数を足す。" },
        { question: "√18 - √2 を計算せよ。", answer: "2√2", options: d("2√2", "√16", "4", "3√2"), hint: "√18 = 3√2。" },
        { question: "x² = 25 の解は？", answer: "x = ±5", options: d("x = ±5", "x = 5", "x = -5", "x = 25"), hint: "2次方程式の解は基本2つ。" },
        { question: "(x - 2)² = 9 を解け。", answer: "x = 5, -1", options: d("x = 5, -1", "x = 3, -3", "x = 11, 7", "x = 5, 2"), hint: "x - 2 = ±3 と考える。" },
        { question: "x² + 5x + 6 = 0 を解け。", answer: "x = -2, -3", options: d("x = -2, -3", "x = 2, 3", "x = -1, -6", "x = 1, 6"), hint: "因数分解して (x+2)(x+3)=0。" },
        { question: "x² - 4x = 0 を解け。", answer: "x = 0, 4", options: d("x = 0, 4", "x = 4", "x = ±2", "x = 0, -4"), hint: "x(x-4)=0。" },
        { question: "二次方程式 ax² + bx + c = 0 の解の公式、分母は？", answer: "2a", options: d("2a", "a", "4a", "-b"), hint: "x = (-b ± √D) / 2a。" },
        { question: "(x + y)(x - y + 2) を展開せよ。", answer: "x² - y² + 2x + 2y", options: d("x² - y² + 2x + 2y", "x² - y² + 2", "x² + y² + 2x", "x² - y² + 2x - 2y"), hint: "地道に分配法則。" },
        { question: "(a + b + 1)² を展開せよ。", answer: "a² + b² + 1 + 2ab + 2a + 2b", options: d("a² + b² + 1 + 2ab + 2a + 2b", "a² + b² + 1", "a² + b² + 2ab", "a² + b² + 1 + ab + a + b"), hint: "(x+y+z)² = x²+y²+z²+2xy+2yz+2zx" },
        { question: "2x² - 8 を因数分解せよ。", answer: "2(x + 2)(x - 2)", options: d("2(x + 2)(x - 2)", "2(x - 2)²", "(2x + 4)(x - 2)", "2(x² - 4)"), hint: "まず共通因数 2 でくくる。" },
        { question: "x² + 10x + 25 を因数分解せよ。", answer: "(x + 5)²", options: d("(x + 5)²", "(x - 5)²", "(x + 5)(x - 5)", "(x + 25)(x + 1)"), hint: "25 = 5²。" },
        { question: "xy + x + y + 1 を因数分解せよ。", answer: "(x + 1)(y + 1)", options: d("(x + 1)(y + 1)", "(x + y)(1 + 1)", "x(y + 1)", "xy(1 + 1)"), hint: "x(y+1) + (y+1) と考える。" },
        { question: "√50 を簡略化せよ。", answer: "5√2", options: d("5√2", "2√5", "10√5", "5√10"), hint: "50 = 25 × 2。" },
        { question: "√3 × √12 を計算せよ。", answer: "6", options: d("6", "√36", "12", "√15"), hint: "√36 = 6。" },
        { question: "√2(√8 + √2) を計算せよ。", answer: "6", options: d("6", "√16 + 2", "4 + 2", "8"), hint: "分配法則を使う。" },
        { question: "(√3 + 1)(√3 - 1) を計算せよ。", answer: "2", options: d("2", "3", "√3", "4"), hint: "(a+b)(a-b) = a²-b²。" },
        { question: "(√5 + 2)² を展開せよ。", answer: "9 + 4√5", options: d("9 + 4√5", "7 + 4√5", "9 + 2√5", "5 + 4"), hint: "5 + 4 + 2×2×√5。" },
        { question: "√2 ≒ 1.414 とするとき、√8 の値は？", answer: "2.828", options: d("2.828", "1.414", "4.242", "0.707"), hint: "2√2 として計算。" },
        { question: "√3 ≒ 1.732 とするとき、3/√3 の値は？", answer: "1.732", options: d("1.732", "1", "3", "5.196"), hint: "有理化すると √3 になる。" },
        { question: "x² - 7 = 0 を解け。", answer: "x = ±√7", options: d("x = ±√7", "x = 7", "x = 49", "解なし"), hint: "x² = 7。" },
        { question: "2x² - 12 = 0 を解け。", answer: "x = ±√6", options: d("x = ±√6", "x = ±6", "x = 6", "x = ±√12"), hint: "x² = 6。" },
        { question: "x² - 8x + 12 = 0 を解け。", answer: "x = 2, 6", options: d("x = 2, 6", "x = -2, -6", "x = 3, 4", "x = -3, -4"), hint: "(x-2)(x-6)=0。" },
        { question: "x² + 4x - 5 = 0 を解け。", answer: "x = 1, -5", options: d("x = 1, -5", "x = -1, 5", "x = 1, 5", "x = -1, -5"), hint: "(x-1)(x+5)=0。" },
        { question: "x² - x - 20 = 0 を解け。", answer: "x = 5, -4", options: d("x = 5, -4", "x = -5, 4", "x = 2, -10", "x = 4, 5"), hint: "(x-5)(x+4)=0。" },
        { question: "二次方程式 x² + 3x + 1 = 0 を解の公式で解いた時のルートの中身は？", answer: "5", options: d("5", "13", "9", "4"), hint: "b² - 4ac = 3² - 4(1)(1)。" },
        { question: "x² - 6x + 9 = 0 の解の種類は？", answer: "重解（1つの解）", options: d("重解", "2つの異なる解", "解なし", "無限の解"), hint: "(x-3)²=0。" },
        { question: "√0.01 の値は？", answer: "0.1", options: d("0.1", "0.01", "1", "0.001"), hint: "0.1 × 0.1 ＝ ?" },
        { question: "2√3 と 3√2、大きいのはどちら？", answer: "3√2", options: d("3√2", "2√3", "同じ", "比べられない"), hint: "ルートの中に入れて比較（√12 vs √18）。" },
        { question: "x² + ax + 16 が (x+4)² になるとき、aの値は？", answer: "8", options: d("8", "4", "16", "2"), hint: "2 × 4 ＝ ?" },
        { question: "連続する2つの整数の積が30のとき、小さい方の数は？（正の数）", answer: "5", options: d("5", "6", "4", "7"), hint: "x(x+1)=30。" },
        { question: "√18 + √32 を計算せよ。", answer: "7√2", options: d("7√2", "√50", "10", "5√2"), hint: "3√2 + 4√2。" },
        { question: "√27 ÷ √3 を計算せよ。", answer: "3", options: d("3", "√9", "9", "√24"), hint: "√ (27/3)。" },
        { question: "二次方程式 (x - 5)(x + 2) = 0 の解は？", answer: "x = 5, -2", options: d("x = 5, -2", "x = -5, 2", "x = 5, 2", "x = -5, -2"), hint: "カッコ内を0にするx。" },
        { question: "π r² は何の面積？", answer: "円の面積", options: d("円の面積", "円周の長さ", "球の体積", "正方形の面積"), hint: "r は半径。" },
        { question: "x² - 10x + 24 を因数分解せよ。", answer: "(x - 4)(x - 6)", options: d("(x - 4)(x - 6)", "(x + 4)(x + 6)", "(x - 2)(x - 12)", "(x - 3)(x - 8)"), hint: "かけて24、足して-10。" },
        { question: "√3 × √5 × √15 を計算せよ。", answer: "15", options: d("15", "√15", "√225", "225"), hint: "√15 × √15。" },
        { question: "平方根 √10 はどの整数の間にある？", answer: "3 と 4", options: d("3 と 4", "2 と 3", "4 と 5", "9 と 16"), hint: "3²=9, 4²=16。" }
    ],

    // --- 2学期: 関数 y=ax²、図形の相似、円周角の定理 (50問) ---
    MATH_G9_2: [
        { question: "「y は x の 2乗に比例する」関数の基本式は？", answer: "y ＝ ax²", options: d("y ＝ ax²", "y ＝ ax", "y ＝ a/x", "y ＝ x ＋ a"), hint: "放物線（ほうぶつせん）のグラフになるよ。" },
        { question: "y ＝ x² のグラフで、x ＝ －3 のとき y の値は？", answer: "9", options: d("9", "－9", "6", "－6"), hint: "(－3) × (－3) ＝ ?" },
        { question: "y ＝ 2x² のグラフ。a ＞ 0 のとき、グラフはどっちに開く？", answer: "上（＋の方向）", options: d("上", "下", "右", "左"), hint: "谷のような形になるね。" },
        { question: "y ＝ ax² において、a の絶対値が大きくなるほどグラフの開き方は？", answer: "しぼむ（狭くなる）", options: d("狭くなる", "広くなる", "変わらない", "直線になる"), hint: "急激に値が増えるから、尖った形になる。" },
        { question: "関数 y ＝ x² において、x が 1 から 3 まで増加するときの変化の割合は？", answer: "4", options: d("4", "8", "2", "1"), hint: "(9－1) ÷ (3－1) ＝ 8÷2。" },
        { question: "y = -x² のグラフにおいて、xがどんな値でもyはどうなる？", answer: "0以下", options: d("0以下", "0以上", "正の数", "負の数のみ"), hint: "原点が頂点で、下に開く。" },
        { question: "「相似（そうじ）」な図形とは？", answer: "形は同じで、大きさが違う図形", options: d("形が同じ", "面積が同じ", "すべてが同じ", "角度が違う"), hint: "拡大（かくだい）や縮小（しゅくしょう）の関係。" },
        { question: "相似比が 1：2 のとき、面積の比はどうなる？", answer: "1：4", options: d("1：4", "1：2", "1：8", "2：1"), hint: "相似比の2乗の比になるよ。" },
        { question: "相似比が 1：2 のとき、体積の比はどうなる？", answer: "1：8", options: d("1：8", "1：4", "1：2", "2：1"), hint: "相似比の3乗の比になる。" },
        { question: "三角形の相似条件で「2組の（ ？）がそれぞれ等しい」。", answer: "角", options: d("角", "辺", "面積", "高さ"), hint: "角度が2つ決まれば形は決まる。" },
        { question: "円周角の大きさは、同じ弧に対する中心角の？", answer: "半分 (1/2)", options: d("半分", "2倍", "同じ", "90度"), hint: "円周上の角は中心角より小さい。" },
        { question: "同じ弧に対する円周角の大きさはすべて？", answer: "等しい", options: d("等しい", "場所で違う", "中心に近いほど大きい", "0度"), hint: "円周角の定理の基本だよ。" },
        { question: "半円の弧に対する円周角は何度？", answer: "90度", options: d("90度", "180度", "45度", "360度"), hint: "中心角が180度だから、その半分。" },
        { question: "相似の記号はどれ？", answer: "∽", options: d("∽", "≡", "＝", "≒"), hint: "Similar（似ている）の S を横にした形。" },
        { question: "y ＝ －x² のグラフの頂点は？", answer: "(0, 0)", options: d("(0, 0)", "(1, 1)", "(0, －1)", "ない"), hint: "原点が一番高い山になる。" },
        { question: "y = 3x² で、xの変域が -1 ≦ x ≦ 2 のとき、yの最小値は？", answer: "0", options: d("0", "3", "12", "-3"), hint: "x=0 を通るか確認。" },
        { question: "y = 3x² で、xの変域が -1 ≦ x ≦ 2 のとき、yの最大値は？", answer: "12", options: d("12", "3", "0", "6"), hint: "x=2 のとき最大。" },
        { question: "相似比が 3:5 のとき、面積比は？", answer: "9:25", options: d("9:25", "3:5", "6:10", "27:125"), hint: "3² : 5²。" },
        { question: "相似比が 2:3 のとき、体積比は？", answer: "8:27", options: d("8:27", "4:9", "2:3", "16:81"), hint: "2³ : 3³。" },
        { question: "1つの弧に対する円周角は、中心角の何倍？", answer: "0.5倍", options: d("0.5倍", "2倍", "1倍", "4倍"), hint: "半分ということ。" },
        { question: "円周角の定理。直径に対する円周角は常に？", answer: "直角", options: d("直角", "鋭角", "鈍角", "平角"), hint: "90度になる。" },
        { question: "y = ax² のグラフが (2, 8) を通るとき、aの値は？", answer: "2", options: d("2", "4", "1", "8"), hint: "8 = a × 2²。" },
        { question: "y = 1/2 x² のグラフにおいて、xが -4 から -2 まで増加するときの変化の割合は？", answer: "-3", options: d("-3", "3", "-6", "2"), hint: "(2-8) / (-2 - (-4)) = -6 / 2。" },
        { question: "2つの円は常に相似である。正しい？", answer: "正しい", options: d("正しい", "間違い", "半径による", "中心による"), hint: "円は拡大縮小の関係。" },
        { question: "2つの直角二等辺三角形は常に相似である。正しい？", answer: "正しい", options: d("正しい", "間違い", "辺の長さによる", "角度による"), hint: "角度が 90, 45, 45 で一定。" },
        { question: "三角形の相似条件。「3組の（ ？）の比がすべて等しい」。", answer: "辺", options: d("辺", "角", "高さ", "面積"), hint: "長さではなく比。" },
        { question: "相似比が 1:k のとき、面積比は 1:k²。体積比は？", answer: "1:k³", options: d("1:k³", "1:k", "1:2k", "1:k²"), hint: "次元（じげん）を考えよう。" },
        { question: "y = 2x² と y = -2x² のグラフは、何について対称？", answer: "x軸", options: d("x軸", "y軸", "原点", "直線 y=x"), hint: "上下にひっくり返した形。" },
        { question: "放物線の軸（じく）を何という？", answer: "対称軸", options: d("対称軸", "原点", "接線", "割線"), hint: "y = ax² なら y軸。" },
        { question: "円周角 30度 のとき、その弧に対する中心角は？", answer: "60度", options: d("60度", "15度", "30度", "90度"), hint: "2倍になる。" },
        { question: "中心角 100度 のとき、その弧に対する円周角は？", answer: "50度", options: d("50度", "200度", "100度", "25度"), hint: "半分になる。" },
        { question: "三角形の2辺の中点をつなぐ線分は、残りの1辺と平行で、長さがその半分になる定理は？", answer: "中点連結定理", options: d("中点連結定理", "ピタゴラスの定理", "相似の定理", "三平方の定理"), hint: "中学2年〜3年で習う重要定理。" },
        { question: "相似比 1:1 の相似な図形のことを特に何という？", answer: "合同", options: d("合同", "正多角形", "対称", "平行"), hint: "形も大きさも同じ。" },
        { question: "y = ax² で a < 0 のとき、yの最大値は？", answer: "0", options: d("0", "なし", "a", "x"), hint: "原点が一番高い。" },
        { question: "y = ax² で a > 0 のとき、yの最小値は？", answer: "0", options: d("0", "なし", "a", "x"), hint: "原点が一番低い。" },
        { question: "相似な三角形で、対応する辺の長さが 3cm と 6cm。相似比は？", answer: "1:2", options: d("1:2", "3:6", "1:4", "2:1"), hint: "簡単な整数の比に直して。" },
        { question: "相似比 2:3 の図形で、小さい方の面積が 20。大きい方は？", answer: "45", options: d("45", "30", "40", "60"), hint: "面積比は 4:9。 20:x = 4:9。" },
        { question: "相似比 1:2 の立方体。小さい方の体積が 10。大きい方は？", answer: "80", options: d("80", "20", "40", "100"), hint: "体積比は 1:8。" },
        { question: "円周角の定理。同じ弧に対する円周角は、どこにあっても？", answer: "同じ大きさ", options: d("同じ大きさ", "中心に近いと大きい", "場所で変わる", "90度"), hint: "定規で測らなくてもわかる定理。" },
        { question: "y = 2x² で、xが 1 から 4 まで変化した。yの増加量は？", answer: "30", options: d("30", "32", "2", "16"), hint: "2(16) - 2(1) = 32 - 2。" },
        { question: "y = ax² で x=2, y=2。aは？", answer: "0.5", options: d("0.5", "2", "1", "4"), hint: "2 = a × 4。" },
        { question: "y = x² のグラフは、何を「頂点」とする？", answer: "原点", options: d("原点", "(1,1)", "(0,1)", "無限遠"), hint: "一番尖った（曲がった）部分。" },
        { question: "三角形の相似条件。3組の（ ？）が等しい。", answer: "辺の比", options: d("辺の比", "角", "高さ", "面積"), hint: "長さではなく比率。" },
        { question: "相似比 1:3 の三角形。小さい方の高さが 2 なら、大きい方は？", answer: "6", options: d("6", "18", "2", "3"), hint: "高さ（長さ）は相似比そのまま。" },
        { question: "y = 5x²。x=0 のとき y=？", answer: "0", options: d("0", "5", "1", "なし"), hint: "必ず (0,0) を通る。" },
        { question: "相似な四角形。対応する角の大きさは？", answer: "すべて等しい", options: d("等しい", "相似比と同じ", "2倍になる", "足して180度"), hint: "相似なら角は不変。" },
        { question: "円周角が 90度 なら、その弧は円全体のどれくらい？", answer: "半分", options: d("半分", "4分の1", "全部", "3分の1"), hint: "中心角が180度になるから。" },
        { question: "相似な2つの円錐。高さの比が 1:2 なら、底面の半径の比は？", answer: "1:2", options: d("1:2", "1:4", "2:1", "1:1"), hint: "相似ならすべての長さの比が等しい。" },
        { question: "y = ax² のグラフの形を日本語で？", answer: "放物線", options: d("放物線", "双曲線", "直線", "楕円"), hint: "物を投げた時の軌道。" },
        { question: "相似の証明で、最初によく書く言葉は？", answer: "△ABCと△DEFにおいて", options: d("〜において", "〜なので", "よって", "Q.E.D."), hint: "対象とする図形を宣言するよ。" }
    ],

    // --- 3学期: 三平方の定理、標本調査 (50問) ---
    MATH_G9_3: [
        { question: "直角三角形の斜辺をc、他の2辺をa, bとする。三平方の定理の式は？", answer: "a² + b² = c²", options: d("a² + b² = c²", "a + b = c", "ab = c²", "a² + b² = c"), hint: "ピタゴラスの定理ともいうよ。" },
        { question: "3辺の長さが 3, 4, 5 の三角形。これは直角三角形？", answer: "はい", options: d("はい", "いいえ", "正三角形", "二等辺三角形"), hint: "3² + 4² = 5² (9 + 16 = 25) が成立する。" },
        { question: "3辺が 5, 12, 13 の三角形。これは直角三角形？", answer: "はい", options: d("はい", "いいえ", "鈍角三角形", "鋭角三角形"), hint: "5² + 12² = 13² (25 + 144 = 169)。" },
        { question: "一辺 1 の正方形の対角線の長さは？", answer: "√2", options: d("√2", "2", "1", "√3"), hint: "1² + 1² = c²。" },
        { question: "「1 : 1 : √2」 は何度、何度、何度の直角三角形の比？", answer: "45, 45, 90", options: d("45, 45, 90", "30, 60, 90", "60, 60, 60", "90, 30, 30"), hint: "直角二等辺三角形の比だね。" },
        { question: "「1 : √3 : 2」 は何度の直角三角形の比？", answer: "30, 60, 90", options: d("30, 60, 90", "45, 45, 90", "60, 60, 60", "90, 45, 45"), hint: "正三角形を半分に切った形。" },
        { question: "「標本調査（ひょうほんちょうさ）」とはどのような調査？", answer: "全体の一部を取り出して調べること", options: d("一部を調べる", "全部調べる", "適当に決める", "アンケートをとるだけ"), hint: "全数調査（ぜんすうちょうさ）が難しいときに行う。" },
        { question: "調査の対象となる集団全体を何という？", answer: "母集団（ぼしゅうだん）", options: d("母集団", "標本", "サンプル", "全数"), hint: "「母」なる全体の集まり。" },
        { question: "母集団から取り出された、一部の資料を何という？", answer: "標本（サンプル）", options: d("標本", "母集団", "データ", "個体"), hint: "標本から全体を推測（すいそく）するよ。" },
        { question: "標本を取り出す際、偏りがないようにすることを？", answer: "無作為（むさくい）に抽出する", options: d("無作為に抽出", "適当に選ぶ", "好きなのを1つ選ぶ", "全部数える"), hint: "ランダムに、という意味。" },
        { question: "一辺が a の正方形。対角線の長さの公式は？", answer: "√2 a", options: d("√2 a", "2a", "a²", "√a"), hint: "1:1:√2 を a倍しただけ。" },
        { question: "一辺が a の正三角形。高さの公式は？", answer: "√3/2 a", options: d("√3/2 a", "√3 a", "1/2 a", "a²"), hint: "30, 60, 90度の比を考えて。" },
        { question: "座標平面上の2点 (0,0) と (3,4) の距離は？", answer: "5", options: d("5", "7", "√7", "25"), hint: "√(3² + 4²)。" },
        { question: "一辺 2 の正四面体の高さは？（発展）", answer: "2√6 / 3", options: d("2√6 / 3", "√3", "√6", "1"), hint: "三平方の定理を2回使うよ。" },
        { question: "箱の中に100個の石。20個取り出し印をつけて戻した。次に20個取ったら印が4個。全体に印は何個あると推測できる？", answer: "約 100個", options: d("約 100個", "約 400個", "約 20個", "約 4個"), hint: "標本内の割合 (4/20 = 1/5) から逆算。" },
        { question: "直角三角形の斜辺はどれ？", answer: "一番長い辺", options: d("一番長い辺", "一番短い辺", "真ん中の辺", "直角をはさむ辺"), hint: "90度の角の向かい側。" },
        { question: "直角三角形の2辺が 1cm と 2cm。斜辺が √5cm。正しい？", answer: "正しい (1²+2²=5)", options: d("正しい", "間違い", "√3になるはず", "わからない"), hint: "1 + 4 = 5。" },
        { question: "「全数調査」が行われる代表的な例は？", answer: "国勢調査", options: d("国勢調査", "テレビの視聴率", "川の汚れ", "電球の寿命"), hint: "日本に住む人全員を調べるよ。" },
        { question: "視聴率の調査は、全数調査？ 標本調査？", answer: "標本調査", options: d("標本調査", "全数調査", "どちらでもない", "適当"), hint: "一部の家庭のデータを集計している。" },
        { question: "標本調査の精度（正確さ）を上げるには、どうすればいい？", answer: "標本の数（サンプルサイズ）を増やす", options: d("標本の数を増やす", "標本を減らす", "1つだけ調べる", "名前を変える"), hint: "数が多いほど全体の平均に近づく。" },
        { question: "直角三角形の3辺が 1, 1, x。xが斜辺なら x=？", answer: "√2", options: d("√2", "2", "1", "√1"), hint: "1+1=x²。" },
        { question: "3辺が 8, 15, 17 の三角形。直角三角形？", answer: "はい", options: d("はい", "いいえ", "鈍角", "鋭角"), hint: "64+225=289。" },
        { question: "対角線の長さが 10cm の正方形の一辺は？", answer: "5√2 cm", options: d("5√2 cm", "5cm", "10√2 cm", "√10 cm"), hint: "x√2 = 10 を解く。" },
        { question: "円柱の体積を求めるには、何と何が必要？", answer: "底面の半径 と 高さ", options: d("半径と高さ", "直径と円周", "母線と角度", "面積と周囲"), hint: "V = πr²h。" },
        { question: "標本調査で「偏りがある」とはどういうこと？", answer: "選び方がランダムでないこと", options: d("選び方がランダムでない", "色が違う", "重さが違う", "数が多い"), hint: "特定のグループばかり選ぶと正確でない。" },
        { question: "日本の国会で使われる、人口に基づいた1票の格差の問題。何調査が元？", answer: "国勢調査（全数調査）", options: d("国勢調査", "世論調査", "家計調査", "通行量調査"), hint: "正確な人数が必要だから全数調査だよ。" },
        { question: "三平方の定理の逆。a²+b²=c² が成り立てば、その三角形は？", answer: "cを斜辺とする直角三角形", options: d("直角三角形", "正三角形", "二等辺三角形", "鋭角三角形"), hint: "直角があることが確定する。" },
        { question: "円の半径 r、面積 S。 S ＝ ( ？ )", answer: "π r²", options: d("π r²", "2π r", "4π r²", "1/2 r²"), hint: "半径 × 半径 × 円周率。" },
        { question: "一辺 a の立方体の対角線（中を抜ける線）の長さは？", answer: "√3 a", options: d("√3 a", "√2 a", "2a", "a³"), hint: "a² + a² + a² = d²。" },
        { question: "高さが 12cm、底面の半径が 5cm の円錐の「母線」の長さは？", answer: "13cm", options: d("13cm", "17cm", "√119cm", "7cm"), hint: "5, 12, 13 の比を使おう。" },
        { question: "三平方の定理を使って、二点の座標から距離を出せる？", answer: "出せる", options: d("出せる", "出せない", "角度が必要", "グラフが必要"), hint: "横の差と縦の差を 2辺にする。" },
        { question: "標本調査。池の魚の数を推定する「（ ？）法」。", answer: "標識再捕法", options: d("標識再捕法", "全数調査法", "目視調査法", "聞き取り法"), hint: "印をつけて放し、再び捕まえる。" },
        { question: "標本の平均値と母集団の平均値は、必ず一致する？", answer: "一致するとは限らない（近い値になる）", options: d("一致するとは限らない", "必ず一致する", "全く違う", "計算できない"), hint: "誤差（ごさ）が必ず生じる。" },
        { question: "三平方の定理の「三平方」とはどういう意味？", answer: "3つの辺をそれぞれ平方（2乗）すること", options: d("3つの辺を2乗", "3つの角を足す", "3つの辺をかける", "3回計算する"), hint: "平方 ＝ 2乗。" },
        { question: "半径 10cm の球の表面積は？", answer: "400π cm²", options: d("400π", "100π", "4/3 π", "31.4"), hint: "4 × π × 10²。" },
        { question: "半径 3cm の球の体積は？", answer: "36π cm³", options: d("36π", "12π", "108π", "9π"), hint: "4/3 × π × 3³。" },
        { question: "二次方程式 x² + 10x + 25 = 0 の解は？", answer: "x = -5", options: d("x = -5", "x = 5", "x = ±5", "解なし"), hint: "(x + 5)² = 0。" },
        { question: "円周角の定理。中心角が 180度（直径）なら円周角は？", answer: "90度", options: d("90度", "180度", "45度", "360度"), hint: "直角。" },
        { question: "y = ax² のグラフで、aの値がマイナスのとき。山は？", answer: "上に凸（山なり）", options: d("上に凸", "下に凸", "直線", "右上がり"), hint: "マイナスなら下を向く。" },
        { question: "相似比 2:1 の立体の体積比は？", answer: "8:1", options: d("8:1", "4:1", "2:1", "16:1"), hint: "2³ : 1³。" },
        { question: "直角三角形で 30度の角の向かいの辺と斜辺の比は？", answer: "1 : 2", options: d("1 : 2", "1 : √3", "√3 : 2", "1 : 1"), hint: "1:√3:2。" },
        { question: "直角二等辺三角形の斜辺でない1辺が 5cm。斜辺は？", answer: "5√2 cm", options: d("5√2 cm", "5cm", "10cm", "√50 cm"), hint: "1:1:√2。" },
        { question: "x² - 2x + 1 を因数分解せよ。", answer: "(x - 1)²", options: d("(x - 1)²", "(x + 1)²", "(x - 1)(x + 1)", "x(x - 2)"), hint: "足して-2、かけて1。" },
        { question: "√27 + √12 を計算せよ。", answer: "5√3", options: d("5√3", "3√3 + 2√3", "√39", "6√3"), hint: "3√3 + 2√3。" },
        { question: "x² + 5x = 0 の解は？", answer: "x = 0, -5", options: d("x = 0, -5", "x = 0, 5", "x = -5", "x = ±5"), hint: "x(x + 5) = 0。" },
        { question: "標本調査。サンプルが偏っているとどうなる？", answer: "全体の推定が正しくなくなる", options: d("正しくなくなる", "計算が楽になる", "誤差がなくなる", "答えが2つになる"), hint: "「正確さ」が失われるよ。" },
        { question: "3年間学んだ中学数学、これにて全課程修了！", answer: "おめでとう！", options: d("おめでとう！", "まだまだ！", "これからだ", "合格！"), hint: "数学の冒険は高校へと続く！" },
        { question: "a² + b² = c²。 c が 10, a が 6。 b は？", answer: "8", options: d("8", "4", "√16", "64"), hint: "36 + b² = 100。" },
        { question: "標本調査において、「無作為」の反対の言葉は？", answer: "作為的（さくいてき）", options: d("作為的", "意図的", "個人的", "計画的"), hint: "自分の好みのものだけ選ぶこと。" },
        { question: "2x² = 32 を解け。", answer: "x = ±4", options: d("x = ±4", "x = 4", "x = 16", "x = ±16"), hint: "x² = 16。" }
    ]
};

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g9Term1Units = splitIntoUnits(MATH_G9_DATA.MATH_G9_1 ?? [], 4);
const g9Term2Units = splitIntoUnits(MATH_G9_DATA.MATH_G9_2 ?? [], 2);
const g9Term3Units = splitIntoUnits(MATH_G9_DATA.MATH_G9_3 ?? [], 3);

export const MATH_G9_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G9_U01: [], // 式の 展開 と 因数分解
    MATH_G9_U02: [], // 平方根
    MATH_G9_U03: [], // 二次方程式
    MATH_G9_U04: [], // 二次方程式の 利用
    MATH_G9_U05: [], // 関数 y=ax^2
    MATH_G9_U06: [], // 相似な 図形
    MATH_G9_U07: [], // 三平方の 定理
    MATH_G9_U08: [], // 円の 性質
    MATH_G9_U09: [], // 標本調査
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G9_U01': {
            const a = (n % 6) + 1;
            const b = (n % 5) + 2;
            if (n % 2 === 0) {
                return { question: `(x+${a})(x+${b}) を展開せよ。`, answer: `x² + ${(a + b)}x + ${a * b}`, options: d(`x² + ${(a + b)}x + ${a * b}`, `x² + ${(a - b)}x + ${a * b}`, `x² + ${a + b}`, `x² + ${(a + b)}x - ${a * b}`), hint: "分配法則で展開。" };
            }
            return { question: `x² + ${(a + b)}x + ${a * b} を因数分解せよ。`, answer: `(x+${a})(x+${b})`, options: d(`(x+${a})(x+${b})`, `(x-${a})(x-${b})`, `(x+${a * b})(x+1)`, `(x+${a + b})(x+1)`), hint: "足して ${a + b}、かけて ${a * b}。" };
        }
        case 'MATH_G9_U02': {
            const k = (n % 8) + 2;
            if (n % 2 === 0) {
                return { question: `√${k * k * 2} を簡単にせよ。`, answer: `${k}√2`, options: d(`${k}√2`, `${k * 2}`, `√${k * 2}`, `${k}√${k}`), hint: "平方数を外に出す。" };
            }
            return { question: `${k}√2 を 1つの根号で表すと？`, answer: `√${k * k * 2}`, options: d(`√${k * k * 2}`, `√${k * 2}`, `${k * 2}`, `√${k * k}`), hint: "係数を2乗して中に入れる。" };
        }
        case 'MATH_G9_U03': {
            const p = (n % 6) + 2;
            const q = (n % 5) + 1;
            if (n % 2 === 0) {
                return { question: `x² - ${(p + q)}x + ${p * q} = 0 の解は？`, answer: `x=${p}, ${q}`, options: d(`x=${p}, ${q}`, `x=-${p}, -${q}`, `x=${p + q}`, `x=${p * q}`), hint: "因数分解で解く。" };
            }
            return { question: `x=${p}, ${q} を解にもつ二次方程式は？`, answer: `x² - ${(p + q)}x + ${p * q} = 0`, options: d(`x² - ${(p + q)}x + ${p * q} = 0`, `x² + ${(p + q)}x + ${p * q} = 0`, `x² - ${p * q}x + ${p + q} = 0`, `x² - ${(p + q)}x - ${p * q} = 0`), hint: "(x-p)(x-q)=0 の形。" };
        }
        case 'MATH_G9_U04': {
            const x = (n % 8) + 3;
            if (n % 2 === 0) {
                return { question: `連続する2整数の積が ${x * (x + 1)}。小さい方は？`, answer: `${x}`, options: d(`${x}`, `${x + 1}`, `${x - 1}`, `${x + 2}`), hint: "x(x+1) の形。" };
            }
            return { question: `連続する2整数の積が ${x * (x + 1)}。大きい方は？`, answer: `${x + 1}`, options: d(`${x + 1}`, `${x}`, `${x + 2}`, `${x - 1}`), hint: "小さい方が ${x} なら次は ${x + 1}。" };
        }
        case 'MATH_G9_U05': {
            const a = (n % 5) + 1;
            const x = (n % 4) + 1;
            if (n % 2 === 0) {
                return { question: `y=${a}x² で x=${x} のとき y は？`, answer: `${a * x * x}`, options: d(`${a * x * x}`, `${a * x}`, `${x * x}`, `${a + x}`), hint: "xを代入。", visual: { kind: 'parabola', a, markX: x } };
            }
            return { question: `y=${a}x² のグラフで x が 1 から 2 へ増えるとき、y の増加量は？`, answer: `${a * 4 - a}`, options: d(`${a * 4 - a}`, `${a * 4}`, `${a}`, `${a * 2}`), hint: "y(2)-y(1) を求める。", visual: { kind: 'parabola', a, markX: 2 } };
        }
        case 'MATH_G9_U06': {
            const p = (n % 4) + 1;
            const q = p + 1;
            if (n % 2 === 0) {
                return { question: `相似比 ${p}:${q} のとき面積比は？`, answer: `${p * p}:${q * q}`, options: d(`${p * p}:${q * q}`, `${p}:${q}`, `${p * 2}:${q * 2}`, `${p * p * p}:${q * q * q}`), hint: "面積比は相似比の2乗。", visual: { kind: 'polygon', sides: 3, labels: ['A', 'B', 'C'] } };
            }
            return { question: `相似比 ${p}:${q} のとき体積比は？`, answer: `${p * p * p}:${q * q * q}`, options: d(`${p * p * p}:${q * q * q}`, `${p * p}:${q * q}`, `${p}:${q}`, `${p + q}:${q}`), hint: "体積比は相似比の3乗。", visual: { kind: 'polygon', sides: 3, labels: ['P', 'Q', 'R'] } };
        }
        case 'MATH_G9_U07': {
            const a = (n % 5) + 3;
            const b = (n % 4) + 4;
            const c2 = a * a + b * b;
            if (n % 2 === 0) {
                return { question: `直角三角形の2辺が ${a}, ${b}。斜辺の2乗は？`, answer: `${c2}`, options: d(`${c2}`, `${a + b}`, `${a * b}`, `${c2 + 1}`), hint: "a²+b²。", visual: { kind: 'angle', degrees: 90, rightAngleMark: true, labels: ['a', 'b'] } };
            }
            return { question: `直角三角形の斜辺の2乗が ${c2}、1辺が ${a}。もう1辺の2乗は？`, answer: `${b * b}`, options: d(`${b * b}`, `${c2}`, `${a * a}`, `${a + b}`), hint: "c²-a² を求める。", visual: { kind: 'angle', degrees: 90, rightAngleMark: true, labels: ['a', 'c'] } };
        }
        case 'MATH_G9_U08': {
            const angle = ((n % 8) + 1) * 15;
            if (n % 2 === 0) {
                return { question: `同じ弧に対する中心角が ${angle * 2}度。円周角は？`, answer: `${angle}度`, options: d(`${angle}度`, `${angle * 2}度`, `${Math.floor(angle / 2)}度`, `90度`), hint: "円周角は中心角の半分。", visual: { kind: 'circle', showChord: true, centralAngle: angle * 2, inscribedAngle: angle, labels: ['A', 'B', 'P'] } };
            }
            return { question: `同じ弧に対する円周角が ${angle}度。中心角は？`, answer: `${angle * 2}度`, options: d(`${angle * 2}度`, `${angle}度`, `${Math.floor(angle / 2)}度`, `180度`), hint: "中心角は円周角の2倍。", visual: { kind: 'circle', showChord: true, centralAngle: angle * 2, inscribedAngle: angle, labels: ['A', 'B', 'P'] } };
        }
        case 'MATH_G9_U09': {
            const sample = (n % 5) + 10;
            const hit = (n % 4) + 2;
            const p = n % 4;
            if (p === 0) {
                return { question: `標本 ${sample}個中 ${hit}個が該当。割合は？`, answer: `${hit}/${sample}`, options: d(`${hit}/${sample}`, `${sample}/${hit}`, `${hit + sample}`, `${sample - hit}`), hint: "該当数/標本数。" };
            }
            if (p === 1) {
                return { question: `標本 ${sample}個中 ${hit}個が該当。百分率は？`, answer: `${Math.round((hit / sample) * 100)}%`, options: d(`${Math.round((hit / sample) * 100)}%`, `${hit * sample}%`, `${sample - hit}%`, `${hit}%`), hint: "割合×100。" };
            }
            if (p === 2) {
                const miss = sample - hit;
                return { question: `標本 ${sample}個中 ${hit}個が該当。該当しない個数は？`, answer: `${miss}個`, options: d(`${miss}個`, `${sample + hit}個`, `${hit}個`, `${sample}個`), hint: "全体-該当数。" };
            }
            return { question: `標本調査で 母集団を推定するとき大切なのは？`, answer: "かたよりのない標本", options: d("かたよりのない標本", "できるだけ少ない標本", "同じ人だけの標本", "結果が高い標本"), hint: "代表性が重要。" };
        }
        default:
            return { question: "2 + 3 = ?", answer: "5", options: d("5", "4", "6", "7"), hint: "基本。" };
    }
};

Object.keys(MATH_G9_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G9_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

Object.assign(MATH_G9_DATA, MATH_G9_UNIT_DATA);

