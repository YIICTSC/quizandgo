
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

// --- 中2 1学期: 式の計算・連立方程式・一次関数 (50問) ---
const MATH_G8_1: GeneralProblem[] = [
        { question: "「2a ＋ 3b － a ＋ 2b」を計算せよ。", answer: "a ＋ 5b", options: d("a ＋ 5b", "3a ＋ 5b", "a ＋ b", "ab"), hint: "同じ文字どうし（同類項）をまとめよう。" },
        { question: "「(2x)² 」の計算結果は？", answer: "4x²", options: d("4x²", "2x²", "4x", "2x"), hint: "2もxも2乗するよ。" },
        { question: "「6ab ÷ 2a」を計算せよ。", answer: "3b", options: d("3b", "3ab", "12ab²", "3"), hint: "aが約分されて消えるよ。" },
        { question: "等式の変形。 「S ＝ ah」 を h について解くと？", answer: "h ＝ S/a", options: d("h ＝ S/a", "h ＝ Sa", "h ＝ S － a", "h ＝ a/S"), hint: "両辺を a で割ろう。" },
        { question: "「連立方程式」の解き方。1つの文字を消去する方法を？", answer: "加減法 または 代入法", options: d("加減法・代入法", "因数分解", "平方根", "公式法"), hint: "足したり引いたり、代わりに入れたり。" },
        { question: "「x ＋ y ＝ 5」と「x － y ＝ 1」。x の値は？", answer: "3", options: d("3", "4", "2", "5"), hint: "2つの式を足すと 2x ＝ 6 になる。" },
        { question: "「1次関数」の基本の式 y ＝ ax ＋ b で、a は何を表す？", answer: "変化の割合（傾き）", options: d("変化の割合", "切片", "変域", "座標"), hint: "グラフの坂道の急さを表すよ。" },
        { question: "y ＝ 2x ＋ 3 のグラフで、「切片（せっぺん）」はどこ？", answer: "3", options: d("3", "2", "x", "y"), hint: "x ＝ 0 のときの y の値。" },
        { question: "y ＝ －3x ＋ 5 のグラフ。xが1増えるとyはどうなる？", answer: "3減る", options: d("3減る", "3増える", "5増える", "変わらない"), hint: "「変化の割合」が負の数なら下がるよ。" },
        { question: "変化の割合 ＝ （ yの増加量 ） ÷ （ ？ ）", answer: "xの増加量", options: d("xの増加量", "時間の変化", "切片", "初期値"), hint: "xがどれだけ増えた分、yがどれだけ増えたか。" },
        { question: "平行な2つの1次関数のグラフ。共通しているのは何？", answer: "傾き (a)", options: d("傾き", "切片", "座標", "長さ"), hint: "角度が同じだからどこまでいっても交わらない。" },
        { question: "y ＝ 2x ＋ 4 のグラフと y軸との交点の座標は？", answer: "(0, 4)", options: d("(0, 4)", "(4, 0)", "(2, 4)", "(0, 2)"), hint: "y軸上では x は必ず 0。" },
        { question: "連立方程式の解は、2つの直線のグラフの何にあたる？", answer: "交点の座標", options: d("交点", "切片", "端点", "中点"), hint: "2つの直線の共通点だね。" },
        { question: "「2x ＋ 3y ＝ 6」を y について解くと？", answer: "y ＝ －2/3 x ＋ 2", options: d("y ＝ －2/3 x ＋ 2", "y ＝ 2x ＋ 6", "y ＝ －2x ＋ 6", "y ＝ 2/3 x ＋ 2"), hint: "2xを移項してから3で割る。" },
        { question: "x ＝ 2, y ＝ 1 が解となる方程式はどれ？", answer: "x ＋ y ＝ 3", options: d("x ＋ y ＝ 3", "x － y ＝ 3", "2x ＝ y", "x ＋ 2y ＝ 5"), hint: "値を代入して成立するか確認。" },
        { question: "「単項式」はどれ？", answer: "5xy", options: d("5xy", "x ＋ y", "a － b", "3x ＋ 2"), hint: "かけ算だけでできている式。" },
        { question: "「3x² － 2x ＋ 1」は何次式？", answer: "2次式", options: d("2次式", "1次式", "3次式", "0次式"), hint: "一番大きい次数を見よう。" },
        { question: "「(2a － 3b) － (a － 5b)」を計算せよ。", answer: "a ＋ 2b", options: d("a ＋ 2b", "a － 8b", "3a ＋ 2b", "a ＋ 8b"), hint: "カッコを外すとき符号に注意。" },
        { question: "「－4(x － 2y)」を展開せよ。", answer: "－4x ＋ 8y", options: d("－4x ＋ 8y", "－4x － 8y", "4x － 8y", "－4x ＋ 2y"), hint: "分配法則を使うよ。" },
        { question: "「12ab² ÷ 3b」を計算せよ。", answer: "4ab", options: d("4ab", "4b", "4a", "36ab³"), hint: "bが1つ消える。" },
        { question: "「8x²y ÷ (－2x)」を計算せよ。", answer: "－4xy", options: d("－4xy", "4xy", "－4x", "－4y"), hint: "符号はマイナス。" },
        { question: "x ＝ 3, y ＝ －2 のとき、 2x ＋ 5y の値は？", answer: "－4", options: d("－4", "16", "4", "－16"), hint: "2(3) ＋ 5(－2) ＝ ?" },
        { question: "等式 2x ＋ y ＝ 10 を x について解くと？", answer: "x ＝ (10 － y) / 2", options: d("x ＝ (10 － y) / 2", "x ＝ 5 － y", "x ＝ 10 － 2y", "x ＝ 5 － 2y"), hint: "yを移項して2で割る。" },
        { question: "連立方程式 2x ＋ y ＝ 7, y ＝ x ＋ 1。代入法で解くと？", answer: "x ＝ 2, y ＝ 3", options: d("x ＝ 2, y ＝ 3", "x ＝ 3, y = 4", "x ＝ 1, y ＝ 2", "x ＝ 0, y ＝ 1"), hint: "2x ＋ (x ＋ 1) ＝ 7。" },
        { question: "1次関数 y ＝ －x ＋ 4 で、x ＝ 2 のとき y は？", answer: "2", options: d("2", "4", "6", "－2"), hint: "－2 ＋ 4 ＝ ?" },
        { question: "1次関数 y ＝ 3x － 1。変化の割合は？", answer: "3", options: d("3", "－1", "x", "y"), hint: "xの係数が変化の割合。" },
        { question: "xが1増えるとyが4増える1次関数の傾きは？", answer: "4", options: d("4", "1", "1/4", "0"), hint: "yの増加量 / xの増加量。" },
        { question: "xが2増えるとyが6減る1次関数の変化の割合は？", answer: "－3", options: d("－3", "3", "－1/3", "－6"), hint: "－6 ÷ 2 ＝ －3。" },
        { question: "y ＝ 2x － 6 のグラフがx軸と交わる点のx座標は？", answer: "3", options: d("3", "6", "0", "－6"), hint: "y ＝ 0 を代入して解く。" },
        { question: "2点 (1, 3), (2, 5) を通る直線の傾きは？", answer: "2", options: d("2", "1", "3", "5"), hint: "(5－3) ÷ (2－1) ＝ 2。" },
        { question: "傾きが 2 で 点 (0, 5) を通る直線の式は？", answer: "y ＝ 2x ＋ 5", options: d("y ＝ 2x ＋ 5", "y ＝ 5x ＋ 2", "y ＝ 2x", "y ＝ x ＋ 5"), hint: "切片が 5 だね。" },
        { question: "「3x － 2y ＝ 12」のグラフの傾きは？", answer: "3/2", options: d("3/2", "3", "－2", "6"), hint: "y ＝ ... の形に直そう。" },
        { question: "「x ＝ 4」のグラフはどのような直線？", answer: "y軸に平行な直線", options: d("y軸に平行", "x軸に平行", "右上がりの直線", "原点を通る"), hint: "どの y に対しても x が 4。" },
        { question: "「y ＝ －2」のグラフはどのような直線？", answer: "x軸に平行な直線", options: d("x軸に平行", "y軸に平行", "右下がりの直線", "斜めの直線"), hint: "常に高さが －2。" },
        { question: "2つの直線 y ＝ 2x ＋ 1 と y ＝ －x ＋ 4 の交点は？", answer: "(1, 3)", options: d("(1, 3)", "(2, 5)", "(0, 1)", "(1, 2)"), hint: "2x ＋ 1 ＝ －x ＋ 4 を解く。" },
        { question: "1次関数 y ＝ ax ＋ b で、b ＝ 0 のとき何という？", answer: "比例", options: d("比例", "反比例", "定数関数", "2次関数"), hint: "原点を通る特別な1次関数。" },
        { question: "変化の割合が常に一定なのはどの関数？", answer: "1次関数", options: d("1次関数", "反比例", "2次関数", "全部"), hint: "グラフが直線になるもの。" },
        { question: "「(2/3)x ＋ (1/2)x」を計算せよ。", answer: "7/6 x", options: d("7/6 x", "3/5 x", "1/6 x", "x"), hint: "通分して 4/6 ＋ 3/6。" },
        { question: "「(ab) ÷ b × a」を計算せよ。", answer: "a²", options: d("a²", "a", "1", "ab"), hint: "bが消えて、aが2つ。" },
        { question: "「2(x ＋ 3y) － 3(2x － y)」を計算せよ。", answer: "－4x ＋ 9y", options: d("－4x ＋ 9y", "4x ＋ 9y", "－4x ＋ 3y", "－4x － 9y"), hint: "分配してまとめよう。" },
        { question: "連立方程式 3x ＋ 2y ＝ 12, x ＝ 2。 yの値は？", answer: "3", options: d("3", "2", "6", "0"), hint: "xに2を代入。" },
        { question: "1次関数 y ＝ 4x － 8。 x軸との交点は？", answer: "(2, 0)", options: d("(2, 0)", "(0, －8)", "(4, 0)", "(1, －4)"), hint: "4x － 8 ＝ 0。" },
        { question: "y ＝ ax ＋ b。 a ＜ 0, b ＞ 0 のグラフは？", answer: "右下がりで、y軸の正の部分を通る", options: d("右下がり・正を通る", "右上がり・正を通る", "右下がり・負を通る", "水平"), hint: "傾きがマイナス、切片がプラス。" },
        { question: "変化の割合が 5、x ＝ 2 のとき y ＝ 7。切片 b は？", answer: "－3", options: d("－3", "3", "17", "－1"), hint: "7 ＝ 5(2) ＋ b。" },
        { question: "「3a²b × 4ab² 」を計算せよ。", answer: "12a³b³", options: d("12a³b³", "7a³b³", "12a²b²", "12ab"), hint: "係数をかけ、指数の和をとる。" },
        { question: "「18x²y ÷ 6xy × 2」を計算せよ。", answer: "6x", options: d("6x", "3x", "6xy", "3"), hint: "左から順番に。" },
        { question: "等式 V ＝ 1/3 Sh を h について解け。", answer: "h ＝ 3V/S", options: d("h ＝ 3V/S", "h ＝ V/3S", "h ＝ 3VS", "h ＝ V－3S"), hint: "まず両辺を3倍しよう。" },
        { question: "二元一次方程式 2x ＋ y ＝ 5 の解はいくつある？", answer: "無限にある", options: d("無限にある", "1つだけ", "2つ", "ない"), hint: "直線上のすべての点が解になるよ。" },
        { question: "比例 y ＝ 3x を y 方向に 2 ずらした直線の式は？", answer: "y ＝ 3x ＋ 2", options: d("y ＝ 3x ＋ 2", "y ＝ 5x", "y ＝ 3x － 2", "y ＝ 2x ＋ 3"), hint: "切片が 2 になる。" },
        { question: "x軸に垂直で、点 (3, 5) を通る直線の式は？", answer: "x ＝ 3", options: d("x ＝ 3", "y ＝ 5", "y ＝ x ＋ 2", "x ＝ 5"), hint: "xの値がずっと変わらない。" }
    ];

// --- 中2 2学期: 図形の調べ方・合同・三角形と四角形 (50問) ---
const MATH_G8_2: GeneralProblem[] = [
        { question: "三角形の内角の和は何度？", answer: "180度", options: d("180度", "360度", "540度", "90度"), hint: "基本中の基本だね。" },
        { question: "n角形の内角の和を求める公式は？", answer: "180 × (n － 2)", options: d("180 × (n － 2)", "180 × n", "360 × n", "180 × (n ＋ 2)"), hint: "三角形がいくつ作れるか。" },
        { question: "五角形の内角の和は何度？", answer: "540度", options: d("540度", "360度", "720度", "180度"), hint: "180 × 3 ＝ ?" },
        { question: "六角形の内角の和は何度？", answer: "720度", options: d("720度", "540度", "1080度", "360度"), hint: "180 × 4 ＝ ?" },
        { question: "多角形の「外角の和」は、角の数に関わらず常に何度？", answer: "360度", options: d("360度", "180度", "540度", "0度"), hint: "一周ぐるっと回るからね。" },
        { question: "正六角形の1つの内角は何度？", answer: "120度", options: d("120度", "60度", "90度", "108度"), hint: "720 ÷ 6 ＝ ?" },
        { question: "正五角形の1つの内角は何度？", answer: "108度", options: d("108度", "72度", "120度", "90度"), hint: "540 ÷ 5 ＝ ?" },
        { question: "対頂角（たいちょうかく）の大きさはどうなっている？", answer: "等しい", options: d("等しい", "足して180度", "足して90度", "違う"), hint: "交差した向かい合わせの角。" },
        { question: "2つの直線が平行なとき、同位角はどうなる？", answer: "等しい", options: d("等しい", "違う", "足して180度", "90度"), hint: "同じ位置にある角。" },
        { question: "2つの直線が平行なとき、錯角（さっかく）はどうなる？", answer: "等しい", options: d("等しい", "違う", "0度", "180度"), hint: "Zの形をした角だよ。" },
        { question: "三角形の1つの外角は、それと隣り合わない2つの（ ？ ）の和に等しい。", answer: "内角", options: d("内角", "外角", "対頂角", "同位角"), hint: "スリッパの法則ともいうよ。" },
        { question: "「合同（ごうどう）」とは？", answer: "形も大きさもぴったり重なること", options: d("形と大きさが同じ", "形だけ同じ", "面積だけ同じ", "左右対称"), hint: "三本線の記号 ≡ を使うよ。" },
        { question: "三角形の合同条件、1つ選んで。", answer: "3組の辺がそれぞれ等しい", options: d("3組の辺が等しい", "3つの角が等しい", "2つの角が等しい", "面積が等しい"), hint: "SSS条件ともいう。" },
        { question: "三角形の合同条件、もう1つは？", answer: "2組の辺とその間の角がそれぞれ等しい", options: d("2辺とその間の角", "2辺と1つの角", "3つの角", "1辺とその両端の角以外"), hint: "SAS条件。" },
        { question: "三角形の合同条件、最後の1つは？", answer: "1組の辺とその両端の角がそれぞれ等しい", options: d("1辺とその両端の角", "3つの角", "斜辺と1つの鋭角", "2つの辺"), hint: "ASA条件。" },
        { question: "「定義（ていぎ）」とは？", answer: "言葉の意味をはっきり決めたもの", options: d("言葉の意味", "証明されたこと", "計算結果", "予想"), hint: "図形の名前の由来のようなもの。" },
        { question: "「定理（ていり）」とは？", answer: "正しいことが証明された事柄", options: d("証明された事柄", "意味の決まり", "問題文", "仮説"), hint: "証明の武器として使えるよ。" },
        { question: "二等辺三角形の定義は？", answer: "2つの辺が等しい三角形", options: d("2辺が等しい", "2角が等しい", "3辺が等しい", "直角がある"), hint: "「二」つの「等」しい「辺」。" },
        { question: "二等辺三角形の「底角（ていかく）」はどうなっている？", answer: "等しい", options: d("等しい", "足して90度", "180度", "バラバラ"), hint: "二等辺三角形の性質（定理）。" },
        { question: "正三角形の定義は？", answer: "3つの辺がすべて等しい三角形", options: d("3辺が等しい", "3角が等しい", "2辺が等しい", "直角がある"), hint: "最も整った三角形。" },
        { question: "直角三角形の合同条件。斜辺と（ ？ ）がそれぞれ等しい。", answer: "1つの鋭角", options: d("1つの鋭角", "他の2辺", "1つの鈍角", "直角以外の和"), hint: "角度か辺のどちらかが必要。" },
        { question: "直角三角形の合同条件。斜辺と（ ？ ）がそれぞれ等しい。", answer: "他の1辺", options: d("他の1辺", "1つの鋭角", "面積", "高さ"), hint: "辺が等しい場合。" },
        { question: "平行四辺形の定義は？", answer: "2組の向かい合う辺がそれぞれ平行な四角形", options: d("2組の辺が平行", "4つの辺が等しい", "2組の辺が等しい", "対角線が直交する"), hint: "平行であることが重要。" },
        { question: "平行四辺形の性質。向かい合う辺（対辺）の長さは？", answer: "等しい", options: d("等しい", "違う", "2倍", "足して10cm"), hint: "向かい合うペアは同じ長さ。" },
        { question: "平行四辺形の性質。向かい合う角（対角）の大きさは？", answer: "等しい", options: d("等しい", "足して180度", "バラバラ", "90度"), hint: "角度もペアで同じ。" },
        { question: "平行四辺形の性質。対角線はどう交わる？", answer: "それぞれの中点で交わる", options: d("中点で交わる", "垂直に交わる", "交わらない", "長さが同じ"), hint: "お互いを半分に分けるよ。" },
        { question: "4つの角がすべて等しい四角形を何という？", answer: "長方形", options: d("長方形", "ひし形", "台形", "平行四辺形"), hint: "全部90度だね。" },
        { question: "4つの辺がすべて等しい四角形を何という？", answer: "ひし形", options: d("ひし形", "長方形", "正方形", "台形"), hint: "ダイヤの形。" },
        { question: "4つの辺が等しく、4つの角も等しい四角形は？", answer: "正方形", options: d("正方形", "長方形", "ひし形", "平行四辺形"), hint: "最強の四角形。" },
        { question: "長方形の対角線の性質は？", answer: "長さが等しい", options: d("長さが等しい", "垂直に交わる", "長さが違う", "外を通る"), hint: "さらに、中点で交わるよ。" },
        { question: "ひし形の対角線の性質は？", answer: "垂直に交わる", options: d("垂直に交わる", "長さが等しい", "45度で交わる", "交わらない"), hint: "十字にクロスするよ。" },
        { question: "「逆（ぎゃく）」とは何？", answer: "「AならばB」に対して「BならばA」とすること", options: d("BならばA", "Aではない", "Bではない", "マイナスにする"), hint: "仮定と結論を入れ替える。" },
        { question: "「2つの角が等しい三角形は二等辺三角形である」は正しい？", answer: "正しい（二等辺三角形になるための条件）", options: d("正しい", "間違い", "正三角形だけ", "わからない"), hint: "逆も真（しん）なり。" },
        { question: "三角形の「外角」の和は？", answer: "360度", options: d("360度", "180度", "540度", "0度"), hint: "多角形なら全部これ。" },
        { question: "十角形の内角の和は？", answer: "1440度", options: d("1440度", "1800度", "360度", "1620度"), hint: "180 × (10－2) ＝ ?" },
        { question: "「仮定（かてい）」とは？", answer: "問題文で「〜ならば」と示されている事柄", options: d("〜ならば", "〜である(結論)", "計算式", "図の名前"), hint: "前提条件のこと。" },
        { question: "「結論（けつろん）」とは？", answer: "証明したい最後の事柄", options: d("証明したいこと", "前提条件", "途中の式", "図の定義"), hint: "「〜となる」の部分。" },
        { question: "合同な図形で、対応する「線分」の長さは？", answer: "等しい", options: d("等しい", "違う", "2倍", "比例する"), hint: "ぴったり重なるからね。" },
        { question: "合同な図形で、対応する「角」の大きさは？", answer: "等しい", options: d("等しい", "合計180度", "足して90度", "違う"), hint: "形が同じだから角度も同じ。" },
        { question: "「1組の向かい合う辺が平行で長さが等しい」四角形は？", answer: "平行四辺形", options: d("平行四辺形", "台形", "ひし形", "長方形"), hint: "平行四辺形になるための条件の1つ。" },
        { question: "「対角線が垂直に交わり、長さが等しい」四角形は？", answer: "正方形", options: d("正方形", "ひし形", "長方形", "平行四辺形"), hint: "ひし形と長方形の性質を両方持っている。" },
        { question: "三角形の面積を変えずに形を変えることを何という？", answer: "等積変形（とうせきへんけい）", options: d("等積変形", "合同変形", "相似変形", "回転移動"), hint: "底辺を固定して、頂点を平行な線上で動かす。" },
        { question: "n角形の頂点の数は？", answer: "n 個", options: d("n", "n－2", "2n", "n＋1"), hint: "五角形なら5個。" },
        { question: "正n角形の1つの外角の大きさは？", answer: "360 ÷ n", options: d("360 ÷ n", "180 ÷ n", "360", "180 × (n－2) / n"), hint: "外角の和はいつも360度だからね。" },
        { question: "三角形 ABC ≡ 三角形 DEF のとき、辺 AB に対応するのは？", answer: "辺 DE", options: d("辺 DE", "辺 EF", "辺 DF", "辺 BC"), hint: "名前の順番を合わせよう。" },
        { question: "対頂角が等しいことを証明するのに使うのは？", answer: "一直線の180度", options: d("一直線の180度", "平行線の錯角", "合同条件", "計算機"), hint: "180 － (共通の角) で考える。" },
        { question: "二等辺三角形の頂角の二等分線は、底辺をどうする？", answer: "垂直に二等分する", options: d("垂直に二等分", "平行に分ける", "3等分する", "何もしない"), hint: "左右対称の折り目になるよ。" },
        { question: "四角形の対角線の数が2本のとき、五角形は何本？", answer: "5本", options: d("5本", "3本", "10本", "4本"), hint: "星形を描いて数えてみて。" },
        { question: "「証明（しょうめい）」で、根拠（こんきょ）として使っていいのは？", answer: "定義、定理、仮定", options: d("定義・定理・仮定", "自分の予想", "見た目の感じ", "友達の意見"), hint: "客観的な事実だけを使おう。" },
        { question: "「すべての正方形はひし形である」は正しい？", answer: "正しい", options: d("正しい", "間違い", "逆なら正しい", "わからない"), hint: "正方形はひし形の定義（4辺が等しい）を満たしている。" }
    ];

// --- 中2 3学期: 確率・データの活用 (50問) ---
const MATH_G8_3: GeneralProblem[] = [
        { question: "「確率（かくりつ）」の値の範囲は？", answer: "0 から 1 まで", options: d("0 から 1 まで", "0 から 100 まで", "1 から 10 まで", "マイナスもある"), hint: "絶対に起こらない(0)から必ず起こる(1)まで。" },
        { question: "必ず起こる事象の確率は？", answer: "1", options: d("1", "100", "0", "0.5"), hint: "100%は 1 だよ。" },
        { question: "決して起こらない事象の確率は？", answer: "0", options: d("0", "1", "－1", "なし"), hint: "可能性ゼロ。" },
        { question: "コインを1回投げたとき、表が出る確率は？", answer: "1/2", options: d("1/2", "1/4", "1", "0"), hint: "表か裏かの2通り。" },
        { question: "サイコロを1回振って、3の目が出る確率は？", answer: "1/6", options: d("1/6", "1/3", "1/2", "3/6"), hint: "全部で6通り、当たりは1通り。" },
        { question: "サイコロで「偶数」の目が出る確率は？", answer: "1/2 (3/6)", options: d("1/2", "1/6", "1/3", "2/3"), hint: "2, 4, 6 の 3通り。" },
        { question: "「同様に確からしい」とはどのような意味？", answer: "どの場合が起こることも同じ程度期待できること", options: d("期待が同じ", "必ず起こる", "偏りがある", "難しい"), hint: "公平なサイコロなどの状態。" },
        { question: "2つのサイコロを同時に振るとき、目の出方は全部で何通り？", answer: "36通り", options: d("36通り", "12通り", "6通り", "18通り"), hint: "6 × 6 ＝ ?" },
        { question: "2つのサイコロの「目の和が 12」になる確率は？", answer: "1/36", options: d("1/36", "1/6", "1/12", "2/36"), hint: "(6, 6) の 1通りしかないよ。" },
        { question: "2つのサイコロの「目の和が 2」になる確率は？", answer: "1/36", options: d("1/36", "1/12", "2/36", "0"), hint: "(1, 1) の 1通り。" },
        { question: "「Aが起こらない確率」を求める計算式は？", answer: "1 － (Aが起こる確率)", options: d("1 － P(A)", "P(A) ＋ 1", "1 ÷ P(A)", "P(A) × 0"), hint: "余事象（よじしょう）の考え方。" },
        { question: "トランプ52枚（ジョーカーなし）から1枚引いて「エース」の確率は？", answer: "1/13 (4/52)", options: d("1/13", "1/52", "4/13", "1/4"), hint: "全部で52枚、エースは4枚。" },
        { question: "樹形図（じゅけいず）は何を調べるために書く？", answer: "すべての場合の数", options: d("すべての場合", "平均値", "図形の面積", "グラフ"), hint: "枝分かれさせて数える図。" },
        { question: "箱に赤玉3個、白玉2個。1個引いて「赤」である確率は？", answer: "3/5", options: d("3/5", "2/5", "1/3", "1/2"), hint: "全部で5個、当たりは3個。" },
        { question: "サイコロで「7の目」が出る確率は？", answer: "0", options: d("0", "1/7", "1", "なし"), hint: "サイコロには1から6しかないよ。" },
        { question: "コインを2回投げて、2回とも表になる確率は？", answer: "1/4", options: d("1/4", "1/2", "1/3", "3/4"), hint: "(表,表), (表,裏), (裏,表), (裏,裏) の 4通り。" },
        { question: "「少なくとも1回は〜する」確率。どう計算すると楽？", answer: "1 － (1回も〜しない確率)", options: d("1 － 全くない", "全部足す", "平均をとる", "2倍する"), hint: "反対の場合を引こう。" },
        { question: "データの活用。箱ひげ図で、真ん中の線は何を表す？", answer: "中央値（第2四分位数）", options: d("中央値", "平均値", "最大値", "最小値"), hint: "データを半分に分ける点。" },
        { question: "箱ひげ図の両端のヒゲの先は何を表す？", answer: "最大値 と 最小値", options: d("最大と最小", "第1と第3四分位数", "平均", "誤差"), hint: "データの全体の幅がわかる。" },
        { question: "データを4等分したときの区切りを何という？", answer: "四分位数（しぶんいすう）", options: d("四分位数", "平均数", "中央数", "度数"), hint: "第1、第2、第3があるよ。" },
        { question: "四分位範囲（しぶんいはんい）の求め方は？", answer: "第3四分位数 － 第1四分位数", options: d("Q3 － Q1", "最大 － 最小", "平均 － 最小", "Q2 － Q1"), hint: "箱の長さのことだよ。" },
        { question: "2つのサイコロで、出た目の「積が奇数」になる確率は？", answer: "1/4 (9/36)", options: d("1/4", "1/2", "3/4", "1/6"), hint: "両方が奇数でないといけない。(3×3=9通り)" },
        { question: "3枚のコインを同時に投げるとき、すべて裏になる確率は？", answer: "1/8", options: d("1/8", "1/4", "1/6", "1/3"), hint: "2 × 2 × 2 ＝ 8通り。" },
        { question: "「3人でジャンケンを1回する」。出し方は全部で何通り？", answer: "27通り", options: d("27通り", "9通り", "3通り", "81通り"), hint: "3 × 3 × 3 ＝ ?" },
        { question: "「2人でジャンケンを1回する」。あいこになる確率は？", answer: "1/3", options: d("1/3", "1/9", "3/9", "1/2"), hint: "グー同士、パー同士、チョキ同士の3通り/9通り。" },
        { question: "確率の計算。「Aが起こり、かつBが起こる」ときは？", answer: "それぞれの確率をかける（独立な場合）", options: d("かける", "たす", "ひく", "わる"), hint: "積（せき）の法則というよ。" },
        { question: "確率の計算。「AまたはBが起こる」ときは？", answer: "それぞれの確率をたす（重なりがない場合）", options: d("たす", "かける", "ひく", "わる"), hint: "和（わ）の法則。" },
        { question: "サイコロで「1以外」が出る確率は？", answer: "5/6", options: d("5/6", "1/6", "1", "4/6"), hint: "1 － 1/6 ＝ ?" },
        { question: "4人でリレーの走る順番を決める。全部で何通り？", answer: "24通り", options: d("24通り", "12通り", "4通り", "16通り"), hint: "4 × 3 × 2 × 1 ＝ ?" },
        { question: "A, B, C の3人から2人の委員を選ぶ。組み合わせは何通り？", answer: "3通り", options: d("3通り", "6通り", "9通り", "2通り"), hint: "(A,B), (B,C), (C,A)。" },
        { question: "四分位範囲が大きいほど、データの散らばりは？", answer: "大きい", options: d("大きい", "小さい", "変わらない", "0に近い"), hint: "箱が長いほど、真ん中の50%が広がっている。" },
        { question: "箱ひげ図。「箱」の中には全データの約何％が入っている？", answer: "約 50%", options: d("50%", "25%", "75%", "100%"), hint: "第1から第3四分位数までだからね。" },
        { question: "「ヒストグラム」と「箱ひげ図」、両方からわかる値は？", answer: "最大値、最小値など", options: d("最大・最小値", "平均値", "個別の点数", "合計"), hint: "どちらも分布（ぶんぷ）をみるための図。" },
        { question: "あることがらが起こる期待の度合いを数値で表したものを？", answer: "確率", options: d("確率", "統計", "平均", "比率"), hint: "「プロバビリティ」だよ。" },
        { question: "1から10までのカード。1枚引いて「3の倍数」である確率は？", answer: "3/10", options: d("3/10", "1/10", "3/1", "1/3"), hint: "3, 6, 9 の3通り。" },
        { question: "サイコロを何千回も振ると、1の目が出る割合はどうなる？", answer: "1/6 に近づいていく", options: d("1/6に近づく", "1に近づく", "バラバラになる", "0になる"), hint: "回数が多いほど理論上の値に近づくよ。" },
        { question: "2つのサイコロで「出た目の和が 7」になる組み合わせは何通り？", answer: "6通り", options: d("6通り", "5通り", "7通り", "36通り"), hint: "(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)。" },
        { question: "和が 7 になる確率は？", answer: "1/6 (6/36)", options: d("1/6", "7/36", "1/7", "1/12"), hint: "一番出やすい和なんだよ。" },
        { question: "3枚の硬貨。少なくとも1枚が表になる確率は？", answer: "7/8", options: d("7/8", "1/8", "1/2", "3/8"), hint: "1 － (全部裏の確率 1/8)。" },
        { question: "くじが10本あり、当たりが2本。1本引いて当たる確率は？", answer: "1/5 (2/10)", options: d("1/5", "1/10", "1/2", "2/8"), hint: "1/5 は 20%。" },
        { question: "「同様に確からしい」と言えない例はどれ？", answer: "画鋲を投げて針が上を向くか横を向くか", options: d("画鋲の向き", "正しいサイコロ", "公平なコイン", "トランプ"), hint: "形が歪（いびつ）だと確率は偏（かたよ）るよね。" },
        { question: "データの整理。最小値から最大値までの幅を何という？", answer: "範囲（レンジ）", options: d("範囲", "階級", "中点", "偏差"), hint: "データの「広がり」を表す。" },
        { question: "第2四分位数は何と同じ値？", answer: "中央値（メジアン）", options: d("中央値", "平均値", "最頻値", "最大値"), hint: "Q2 ＝ Median。" },
        { question: "箱ひげ図で「＋」の記号が書かれている場合、何を表す？（発展）", answer: "平均値", options: d("平均値", "合計", "外れ値", "目標値"), hint: "中央値と平均値の違いを見るのに便利。" },
        { question: "トランプから1枚引いて「絵札（J,Q,K）」である確率は？", answer: "3/13 (12/52)", options: d("3/13", "1/13", "12/13", "1/4"), hint: "1つのマークに3枚ずつあるよ。" },
        { question: "2つのサイコロの「目が同じ（ゾロ目）」になる確率は？", answer: "1/6 (6/36)", options: d("1/6", "1/36", "1/12", "1/2"), hint: "(1,1)から(6,6)までの6通り。" },
        { question: "ジャンケン。4人でして「全員同じ手」になる確率は？（発展）", answer: "3/81 (1/27)", options: d("1/27", "1/81", "1/3", "4/81"), hint: "出し方は 3⁴＝81通り。当たりは3通り。" },
        { question: "確率の問題を解くとき、ミスを防ぐために大切なのは？", answer: "もれなく、重なりなく数え上げる（書き出す）", options: d("もれなく重なりなく", "勘で当てる", "難しい公式を暗記する", "適当に割る"), hint: "「数え上げ」が確率の基本だよ。" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g8Term1Units = splitIntoUnits(MATH_G8_1, 4);
const g8Term2Units = splitIntoUnits(MATH_G8_2, 3);
const g8Term3Units = splitIntoUnits(MATH_G8_3, 2);

export const MATH_G8_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G8_U01: [], // 式の計算
    MATH_G8_U02: [], // 連立方程式
    MATH_G8_U03: [], // 連立方程式の 利用
    MATH_G8_U04: [], // 一次関数
    MATH_G8_U05: [], // 図形の 性質
    MATH_G8_U06: [], // 図形の 合同
    MATH_G8_U07: [], // 三角形 と 四角形
    MATH_G8_U08: [], // 確率
    MATH_G8_U09: [], // データの 分析
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G8_U01': {
            const a = (n % 5) + 2;
            const b = (n % 4) + 1;
            if (n % 2 === 0) {
                return { question: `${a}x + ${b}x = ?`, answer: `${a + b}x`, options: d(`${a + b}x`, `${a * b}x`, `${a + b}`, `${a - b}x`), hint: "同類項をまとめる。" };
            }
            return { question: `${a + b}x - ${b}x = ?`, answer: `${a}x`, options: d(`${a}x`, `${b}x`, `${a + b}x`, `${a - b}x`), hint: "同類項を整理する。" };
        }
        case 'MATH_G8_U02': {
            const x = (n % 6) + 1;
            const y = (n % 5) + 2;
            if (n % 2 === 0) {
                return { question: `連立方程式。x+y=${x + y}, x-y=${x - y} のとき x は？`, answer: `${x}`, options: d(`${x}`, `${y}`, `${x + y}`, `${x - y}`), hint: "2式を足すと2x。" };
            }
            return { question: `連立方程式。x+y=${x + y}, x-y=${x - y} のとき y は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${x - y}`), hint: "2式を引くと2y。" };
        }
        case 'MATH_G8_U03': {
            const p = (n % 4) + 3;
            const q = (n % 5) + 2;
            const total = p * q;
            if (n % 2 === 0) {
                return { question: `連立利用。1個${p}円の商品をx個で${total}円。xは？`, answer: `${q}`, options: d(`${q}`, `${p}`, `${total}`, `${q + 1}`), hint: "px=total。" };
            }
            return { question: `商品を${q}個買って${total}円。1個あたりの値段は？`, answer: `${p}`, options: d(`${p}`, `${q}`, `${total}`, `${p + 1}`), hint: "合計 ÷ 個数。" };
        }
        case 'MATH_G8_U04': {
            const a = (n % 5) + 1;
            const b = (n % 7) - 3;
            const x = (n % 4) + 1;
            if (n % 2 === 0) {
                return { question: `一次関数 y=${a}x${b >= 0 ? `+${b}` : b}。x=${x} のとき y=?`, answer: `${a * x + b}`, options: d(`${a * x + b}`, `${a + x + b}`, `${a * x}`, `${x + b}`), hint: "代入計算。" };
            }
            return { question: `一次関数 y=${a}x${b >= 0 ? `+${b}` : b} の切片は？`, answer: `${b}`, options: d(`${b}`, `${a}`, `${a * x + b}`, `${x}`), hint: "x=0 のときの y の値。" };
        }
        case 'MATH_G8_U05':
            return n % 2 === 0
                ? { question: "平行線の同位角は？", answer: "等しい", options: d("等しい", "和が180度", "90度", "不定"), hint: "平行線の角の性質。", visual: { kind: 'angle', degrees: 45, parallelLines: true, labels: ['a', 'a'] } }
                : { question: "対頂角は？", answer: "等しい", options: d("等しい", "和が180度", "90度", "不定"), hint: "向かい合う角。", visual: { kind: 'angle', degrees: 120, labels: ['x', 'x'] } };
        case 'MATH_G8_U06':
            return n % 2 === 0
                ? { question: "合同な図形とは？", answer: "形と大きさが同じ", options: d("形と大きさが同じ", "形だけ同じ", "面積だけ同じ", "向きだけ同じ"), hint: "重ねて一致。", visual: { kind: 'polygon', sides: 4, labels: ['A', 'B', 'C', 'D'], showDiagonals: true } }
                : { question: "三角形の合同条件の1つは？", answer: "3組の辺がそれぞれ等しい", options: d("3組の辺が等しい", "3組の角が等しい", "面積が等しい", "周が等しい"), hint: "SSS条件。", visual: { kind: 'polygon', sides: 3, labels: ['A', 'B', 'C'] } };
        case 'MATH_G8_U07':
            return n % 3 === 0
                ? { question: "n角形の内角和の公式は？", answer: "180(n-2)", options: d("180(n-2)", "180n", "360n", "90n"), hint: "三角形分割。", visual: { kind: 'polygon', sides: 5, labels: ['A', 'B', 'C', 'D', 'E'], showDiagonals: true } }
                : n % 3 === 1
                ? { question: "四角形の内角和は？", answer: "360度", options: d("360度", "180度", "540度", "720度"), hint: "三角形2つ分。", visual: { kind: 'polygon', sides: 4, labels: ['A', 'B', 'C', 'D'], showDiagonals: true } }
                : { question: "正六角形の1つの内角は？", answer: "120度", options: d("120度", "60度", "90度", "108度"), hint: "720÷6。", visual: { kind: 'polygon', sides: 6, labels: ['A', 'B', 'C', 'D', 'E', 'F'] } };
        case 'MATH_G8_U08': {
            const faces = (n % 6) + 1;
            if (n % 2 === 0) {
                return { question: `サイコロ1回。${faces}の目が出る確率は？`, answer: `1/6`, options: d(`1/6`, `1/3`, `1/2`, `1/12`), hint: "同様に確からしい6通り。" };
            }
            return { question: `サイコロ1回。${faces}以外の目が出る確率は？`, answer: `5/6`, options: d(`5/6`, `1/6`, `1/2`, `1`), hint: "余事象で考える。" };
        }
        case 'MATH_G8_U09': {
            const a = (n % 20) + 60;
            const b = (n % 15) + 70;
            const c = (n % 10) + 80;
            const avg = Math.floor((a + b + c) / 3);
            const sorted = [a, b, c].sort((x, y) => x - y);
            const p = n % 4;
            if (p === 0) {
                return { question: `データ分析。${a}, ${b}, ${c} の平均は？`, answer: `${avg}`, options: d(`${avg}`, `${a + b + c}`, `${Math.max(a, b, c)}`, `${Math.min(a, b, c)}`), hint: "合計÷個数。" };
            }
            if (p === 1) {
                return { question: `データ分析。中央値は？`, answer: `${sorted[1]}`, options: d(`${sorted[1]}`, `${sorted[0]}`, `${sorted[2]}`, `${avg}`), hint: "小さい順で真ん中。" };
            }
            if (p === 2) {
                return { question: `データ分析。範囲（最大-最小）は？`, answer: `${sorted[2] - sorted[0]}`, options: d(`${sorted[2] - sorted[0]}`, `${avg}`, `${a + b + c}`, `${sorted[2]}`), hint: "散らばりを見る。" };
            }
            return { question: `データ分析。最小値は？`, answer: `${sorted[0]}`, options: d(`${sorted[0]}`, `${sorted[2]}`, `${sorted[1]}`, `${avg}`), hint: "最も小さい値。" };
        }
        default:
            return { question: "2 + 3 = ?", answer: "5", options: d("5", "4", "6", "7"), hint: "基本。" };
    }
};

fillGeneratedUnitProblems(MATH_G8_UNIT_DATA, makeUnitProblem);

export const MATH_G8_DATA: Record<string, GeneralProblem[]> = {
    MATH_G8_1,
    MATH_G8_2,
    MATH_G8_3,
    ...MATH_G8_UNIT_DATA,
};

