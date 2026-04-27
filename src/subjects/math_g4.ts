
import { GeneralProblem, d, fillGeneratedUnitProblems } from './utils';

const MATH_G4_1: GeneralProblem[] = [
        { question: "「億」の10倍のたんいは何？", answer: "十億", options: d("十億", "百億", "一兆", "千万"), hint: "位（くらい）は十、百、千と上がっていくよ。" },
        { question: "「兆（ちょう）」は、億を何こ集めた数？", answer: "10000こ", options: d("10000こ", "1000こ", "100こ", "10こ"), hint: "万が万こで億、億が万こで兆になる。" },
        { question: "「一兆」の1つ下の位は何？", answer: "千億", options: d("千億", "一億", "百億", "十億"), hint: "大きな数の位を順番に思い出して。" },
        { question: "分度器（ぶんどき）で測る、開きの大きさを何という？", answer: "角（角度）", options: d("角度", "長さ", "重さ", "体積"), hint: "たんいは「度（°）」だよ。" },
        { question: "直角（ちょっかく）は何度？", answer: "90度", options: d("90度", "180度", "360度", "45度"), hint: "ノートの角（かど）の形。" },
        { question: "180度はどのような形？", answer: "直線", options: d("直線", "L字", "十字", "円"), hint: "直角2つ分だね。" },
        { question: "360度はどのような形？", answer: "一回転（円）", options: d("一回転", "半周", "三角形", "四角形"), hint: "ぐるっと一周回るよ。" },
        { question: "「72 ÷ 3」のあんざん. 答えは？", answer: "24", options: d("24", "26", "22", "34"), hint: "60÷3 と 12÷3 に分けてみよう。" },
        { question: "ひっ算「482 ÷ 2」の答えは？", answer: "241", options: d("241", "240", "482", "121"), hint: "百の位から順番に割っていこう。" },
        { question: "わり算のひっ算で、最初にやることは？", answer: "商を立てる", options: d("商を立てる", "かける", "ひく", "おろす"), hint: "「た・か・ひ・お」のリズム。" },
        { question: "「500 × 300 ＝ 」 答えは？", answer: "150000", options: d("150000", "15000", "1500", "150"), hint: "5×3のあとに0を4つつける。" },
        { question: "すいちょく（垂直）とは、2本の直線が何度で交わること？", answer: "90度", options: d("90度", "180度", "0度", "45度"), hint: "直角に交わることだよ。" },
        { question: "へいこう（平行）な2本の直線は、どこまで行っても？", answer: "交わらない", options: d("交わらない", "直角に交わる", "1点で交わる", "重なる"), hint: "レールのようにつながっている線。" },
        { question: "四角形で、向かい合った1組の辺がへいこうな形を何という？", answer: "台形（だいけい）", options: d("台形", "平行四辺形", "ひし形", "正方形"), hint: "滑り台の横の形に似てるかも。" },
        { question: "四角形で、向かい合った2組の辺がどちらもへいこうな形を？", answer: "平行四辺形", options: d("平行四辺形", "台形", "三角形", "長方形"), hint: "「へいこう」な「四」つの「辺」。" },
        { question: "4つの辺の長さがすべて同じ四角形を何という？", answer: "ひし形", options: d("ひし形", "平行四辺形", "台形", "長方形"), hint: "ダイヤのような形だよ。" },
        { question: "「3億 ＋ 8億 ＝ 」 答えは？", answer: "11億", options: d("11億", "5億", "38億", "110億"), hint: "たんいはそのままで計算できる。" },
        { question: "「1兆 － 1億 ＝ 」 答えは？", answer: "9999億", options: d("9999億", "9000億", "999億", "0"), hint: "1兆は10000億だね。" },
        { question: "「650 ÷ 25 ＝ 」 ひっ算の商の最初の位はどこに立つ？", answer: "十の位", options: d("十の位", "一の位", "百の位", "小数第一位"), hint: "65の中に25はいくつあるかな？" },
        { question: "分度器の中心を合わせるのはどこ？", answer: "角の頂点", options: d("角の頂点", "角の辺の端", "どこでもいい", "分度器の端"), hint: "角の「とんがっているところ」だよ。" },
        { question: "150度は 直角（90度）より 大きいかな？ 小さいかな？", answer: "直角より大きい", options: d("直角より大きい", "直角より小さい", "直角と同じ", "180度より大きい"), hint: "90度と 150度を くらべてみて。" },
        { question: "「45度」を2つあわせた角度は？", answer: "90度", options: d("90度", "45度", "180度", "60度"), hint: "直角になるね。" },
        { question: "ひし形の対かく線は、どのようにはたらく？", answer: "すいちょくに交わる", options: d("すいちょくに交わる", "へいこうになる", "交わらない", "長さが倍になる"), hint: "十字に交差するよ。" },
        { question: "平行四辺形の向かい合う角の大きさは？", answer: "等しい", options: d("等しい", "足して180度", "バラバラ", "90度"), hint: "向かい合うペアは同じなんだ。" },
        { question: "「80 ÷ 20 ＝ 」 答えは？", answer: "4", options: d("4", "40", "0.4", "400"), hint: "0を1つずつ消して考えてみて。" },
        { question: "「140 ÷ 30 ＝ 」 答えは？", answer: "4 あまり 20", options: d("4 あまり 20", "4 あまり 2", "40 あまり 2", "5 あまり 10"), hint: "あまりの位に気をつけて。" },
        { question: "「一兆」を数字で書くと、0は何個つく？", answer: "12個", options: d("12個", "8個", "16個", "10個"), hint: "万(4), 億(8), 兆(12)。" },
        { question: "「3000万 × 10 ＝ 」 答えは？", answer: "3億", options: d("3億", "3000万", "300万", "30億"), hint: "たんいが万から億に上がるよ。" },
        { question: "へいこうな2本の直線の間のきょりは？", answer: "どこでも同じ", options: d("どこでも同じ", "だんだん広がる", "だんだんせまくなる", "わからない"), hint: "ずっと同じはばで進むよ。" },
        { question: "「3500000000」の読み方は？", answer: "三十五億", options: d("三十五億", "三億五千万", "三兆五千億", "三十五万"), hint: "右から4つずつ区切ろう。" },
        { question: "分度器で180度より大きい角を測るには？", answer: "180度と残りの角に分けて足す", options: d("分けて足す", "測れない", "分度器を2枚重ねる", "かんできめる"), hint: "工夫して測れるよ。" },
        { question: "三角定規、2枚セットのうち「直角二等辺三角形」の角は？", answer: "90, 45, 45", options: d("90, 45, 45", "90, 60, 30", "60, 60, 60", "90, 90, 0"), hint: "正方形を半分に切った形。" },
        { question: "もう1枚の三角定規の角は？", answer: "90, 60, 30", options: d("90, 60, 30", "90, 45, 45", "60, 60, 60", "120, 30, 30"), hint: "細長い方の定規だよ。" },
        { question: "「160 ÷ 40」の計算、両方を10で割って「16 ÷ 4」にしても答えは同じ？", answer: "同じ", options: d("同じ", "ちがう", "あまりだけ違う", "わからない"), hint: "わり算の性質だね。" },
        { question: "「85 ÷ 21」の見当をつけるとき、何 ÷ 何で考えるといい？", answer: "8 ÷ 2", options: d("8 ÷ 2", "8 ÷ 1", "5 ÷ 2", "10 ÷ 2"), hint: "近い数字で予想を立てよう。" },
        { question: "平行四辺形のとなりあう2つの角を足すと何度になる？", answer: "180度", options: d("180度", "360度", "90度", "270度"), hint: "横同士の角だよ。" },
        { question: "ひし形の4つの辺の長さは？", answer: "すべて等しい", options: d("すべて等しい", "向かい合う辺だけ等しい", "全部バラバラ", "2倍ずつ違う"), hint: "形が整っているね。" },
        { question: "「兆」の1万倍のたんいは何？（発展）", answer: "京（けい）", options: d("京", "垓", "穣", "溝"), hint: "大きな数の世界はまだまだ続く。" },
        { question: "「420 ÷ 70 ＝ 」 答えは？", answer: "6", options: d("6", "60", "0.6", "7"), hint: "42 ÷ 7 は？" },
        { question: "角度. 時計のみじかい針が3時から4時まで動くと何度？", answer: "30度", options: d("30度", "60度", "90度", "15度"), hint: "360度を12時間で割ってみよう。" },
        { question: "「3000億」は 1000億がいくつ？", answer: "3つ", options: d("3つ", "30つ", "300つ", "1つ"), hint: "たんいを見てね。" },
        { question: "ひし形は平行四辺形の一種と言える？", answer: "言える", options: d("言える", "言えない", "逆なら言える", "全く関係ない"), hint: "向かい合う辺がへいこうだもんね。" },
        { question: "正方形はひし形の一種と言える？", answer: "言える", options: d("言える", "言えない", "丸なら言える", "角による"), hint: "4つの辺が同じ長さだからね。" },
        { question: "わり算のひっ算. あまりを出すとき、どこの位をそろえる？", answer: "割られる数の一の位", options: d("一の位", "十の位", "商の位", "どこでもいい"), hint: "ひっ算の線をまっすぐ下ろそう。" },
        { question: "「360 ÷ 12 ＝ 」 あんざんで答えは？", answer: "30", options: d("30", "3", "300", "12"), hint: "36 ÷ 12 ＝ 3。" },
        { question: "長方形も平行四辺形のなかま？", answer: "はい", options: d("はい", "いいえ", "正方形だけ", "台形だけ"), hint: "向かい合う辺がへいこうだよね。" },
        { question: "すいちょくな直線をかくとき、何を使うと正確？", answer: "三角定規", options: d("三角定規", "分度器だけ", "コンパスだけ", "はさみ"), hint: "直角の部分を使うよ。" },
        { question: "大きな数. 千万の10倍は？", answer: "一億", options: d("一億", "百万", "一兆", "二千万"), hint: "位が上がるポイント。" },
        { question: "「角」の2つの辺が、1つの直線になっているとき、角度は何度？", answer: "180度", options: d("180度", "90度", "0度", "360度"), hint: "平らな角、平角というよ。" },
    ];

const MATH_G4_2: GeneralProblem[] = [
        { question: "小数. 0.1 をさらに 10等分した数は？", answer: "0.01", options: d("0.01", "0.001", "0.11", "0.2"), hint: "1の 1/100 の大きさ。" },
        { question: "「3.24」の「2」の位（くらい）の名前は？", answer: "1/10の位（小数第一位）", options: d("1/10の位", "1/100の位", "一の位", "十の位"), hint: "小数点のすぐ右だよ。" },
        { question: "「0.56 ＋ 0.23 ＝ 」 答えは？", answer: "0.79", options: d("0.79", "0.33", "7.9", "0.079"), hint: "位をそろえて足そう。" },
        { question: "「1 － 0.05 ＝ 」 答えは？", answer: "0.95", options: d("0.95", "0.05", "1.05", "0.5"), hint: "1.00 から 0.05 をひく。" },
        { question: "計算のじゅんじょ. ＋ と × が混ざっているときはどこから？", answer: "×（かけ算）から", options: d("× から", "＋ から", "左から", "右から"), hint: "かけ算とわり算は強い力を持っているよ。" },
        { question: "「20 ＋ 10 × 2 ＝ 」 答えは？", answer: "40", options: d("40", "60", "20", "30"), hint: "まずは 10×2 を計算して。" },
        { question: "「( )」のついた計算. 100 － (40 － 10) ＝ ？", answer: "70", options: d("70", "50", "90", "130"), hint: "カッコの中を一番先に！" },
        { question: "めんせきのたんい. 1cm × 1cm の広さを？", answer: "1cm²（平方センチメートル）", options: d("1cm²", "1cm³", "1m²", "1cm"), hint: "「平方（へいほう）」は2乗のこと。" },
        { question: "長方形のめんせきを求める公式は？", answer: "たて × よこ", options: d("たて × よこ", "たて ＋ よこ", "(たて＋よこ)×2", "一辺 × 一辺"), hint: "広さを計算する基本の式。" },
        { question: "正方形のめんせきを求める公式は？", answer: "一辺 × 一辺", options: d("一辺 × 一辺", "たて × よこ", "対かく線 × 対かく線", "周りの長さ"), hint: "縦も横も同じ長さだからね。" },
        { question: "1m²（平方メートル）は、何cm²？", answer: "10000cm²", options: d("10000cm²", "100cm²", "1000cm²", "10cm²"), hint: "100cm × 100cm ＝ ?" },
        { question: "広いめんせき. 100m × 100m の正方形の広さを何という？", answer: "1ヘクタール（ha）", options: d("1ha", "1a", "1km²", "1m²"), hint: "農業などでよく使われるたんい。" },
        { question: "1アール（a）は、何m²？", answer: "100m²", options: d("100m²", "10m²", "1000m²", "1ha"), hint: "10m × 10m の広さ。" },
        { question: "「がい数（がいすう）」とはどのような数？", answer: "だいたいの数", options: d("だいたいの数", "正確な数", "分数", "負の数"), hint: "およその数とも言うよ。" },
        { question: "ししゃごにゅうで、145 を十の位までで表すと？", answer: "150", options: d("150", "140", "100", "200"), hint: "5は切り上げるよ。" },
        { question: "計算のきまり. a × b は b × a と同じ？", answer: "同じ（入れ替えてもよい）", options: d("同じ", "違う", "答えによる", "わり算だけ同じ"), hint: "交換の法則というよ。" },
        { question: "「0.001」は 0.01 をいくつに分けたもの？", answer: "10こ", options: d("10こ", "100こ", "2こ", "1こ"), hint: "どんどん小さくなっていくね。" },
        { question: "「4.5 ＋ 3 ＝ 」 答えは？", answer: "7.5", options: d("7.5", "4.8", "7.8", "45.3"), hint: "3 は 3.0 のことだよ。" },
        { question: "「5.2 － 2.2 ＝ 」 答えは？", answer: "3", options: d("3", "3.2", "2.8", "3.4"), hint: "小数部分が 0 になるね。" },
        { question: "「12 × 5 ＋ 12 × 3」 と同じ計算はどれ？", answer: "12 × (5 ＋ 3)", options: d("12 × (5 ＋ 3)", "12 × 15", "12 ＋ 8", "12 × 53"), hint: "工夫して計算（分配法則）。" },
        { question: "「25 × 4 × 7 ＝ 」 工夫して計算すると？", answer: "700", options: d("700", "100", "28", "2547"), hint: "25×4 を先にやると楽だよ。" },
        { question: "めんせき 1k㎡ は 何m²？", answer: "1000000m²", options: d("1000000m²", "1000m²", "10000m²", "100000m²"), hint: "1000m × 1000m ＝ ?" },
        { question: "たて 5cm、よこ 8cm の長方形のめんせきは？", answer: "40cm²", options: d("40cm²", "13cm²", "26cm²", "40cm"), hint: "5 × 8 ＝ ?" },
        { question: "一辺が 6m の正方形のめんせきは？", answer: "36m²", options: d("36m²", "12m²", "24m²", "66m²"), hint: "6 × 6 ＝ ?" },
        { question: "「8500」をししゃごにゅうして、千の位までのがい数にすると？", answer: "9000", options: d("9000", "8000", "8500", "10000"), hint: "百の位の「5」を見て。" },
        { question: "「未満（みまん）」とはその数を？", answer: "ふくまない（それより小さい）", options: d("ふくまない", "ふくむ", "大きくする", "2倍にする"), hint: "「10未満」に10は入らないよ。" },
        { question: "「以上（いじょう）」とはその数を？", answer: "ふくむ（それより大きい）", options: d("ふくむ", "ふくまない", "小さくする", "半分にする"), hint: "「10以上」に10は入るよ。" },
        { question: "「0.08」は 0.01 がいくつ分？", answer: "8つ", options: d("8つ", "80つ", "0.8つ", "1つ"), hint: "位を考えて。" },
        { question: "「1」は 0.01 がいくつ集まった数？", answer: "100こ", options: d("100こ", "10こ", "1000こ", "0こ"), hint: "100倍だね。" },
        { question: "「10 － 3.2 ＝ 」 答えは？", answer: "6.8", options: d("6.8", "7.8", "7.2", "6.2"), hint: "10.0 － 3.2 で計算。" },
        { question: "「0.1」の 1/10 は？", answer: "0.01", options: d("0.01", "1", "0.001", "0.2"), hint: "小数点が左に1つ動く。" },
        { question: "「80 × 5 ÷ 4 ＝ 」 答えは？", answer: "100", options: d("100", "400", "20", "80"), hint: "左から順番に。" },
        { question: "「30 ÷ (2 ＋ 3) ＝ 」 答えは？", answer: "6", options: d("6", "18", "15", "5"), hint: "カッコの中は 5 だよ。" },
        { question: "正方形のまわりの長さが 24cm. めんせきは？", answer: "36cm²", options: d("36cm²", "24cm²", "144cm²", "6cm²"), hint: "一辺は 24÷4 ＝ 6cm。" },
        { question: "たて 4cm、めんせき 20cm² の長方形. よこは何cm？", answer: "5cm", options: d("5cm", "16cm", "24cm", "80cm"), hint: "20 ÷ 4 ＝ ?" },
        { question: "「2451」を、上から2けたのがい数にすると？", answer: "2500", options: d("2500", "2400", "2000", "3000"), hint: "3けた目をししゃごにゅうして。" },
        { question: "「1.23」の読み方は？", answer: "一点二三", options: d("一点二三", "一点二十三", "十二点三", "百二十三"), hint: "小数のあとは数字をそのまま読むよ。" },
        { question: "「0.9」と「0.11」、大きいのはどっち？", answer: "0.9", options: d("0.9", "0.11", "同じ", "わからない"), hint: "位をそろえて（0.90と0.11）比べて。" },
        { question: "「2.5km」は何m？", answer: "2500m", options: d("2500m", "250m", "25m", "2.5m"), hint: "1km ＝ 1000m。" },
        { question: "「100a」は 何ha？", answer: "1ha", options: d("1ha", "10ha", "100ha", "0.1ha"), hint: "100m×100m ＝ 1ha。" },
        { question: "「400 － 100 × 3 ＝ 」 答えは？", answer: "100", options: d("100", "900", "300", "0"), hint: "かけ算が先だよ。" },
        { question: "「(12 ＋ 8) × 5 ＝ 」 答えは？", answer: "100", options: d("100", "52", "60", "205"), hint: "カッコの中を先に。" },
        { question: "「15.6」の 10倍は？", answer: "156", options: d("156", "1.56", "1560", "15.60"), hint: "小数点が右に1つ動く。" },
        { question: "「15.6」の 1/10 は？", answer: "1.56", options: d("1.56", "156", "0.156", "15.6"), hint: "小数点が左に1つ動く。" },
        { question: "がい数の計算. 298 ＋ 402 を「だいたい」で計算すると？", answer: "約 700", options: d("約 700", "約 600", "約 800", "約 100"), hint: "300 ＋ 400 ＝ ?" },
        { question: "「切り捨て（きりすて）」で、199 を百の位までで表すと？", answer: "100", options: d("100", "200", "0", "190"), hint: "はしたを全部なくすよ。" },
        { question: "「切り上げ（きりあげ）」で、101 を百の位までで表すと？", answer: "200", options: d("200", "100", "110", "1000"), hint: "少しでもあれば上に上げるよ。" },
        { question: "L字型の図面のめんせき. どうやって求める？", answer: "2つの長方形に分けて足す", options: d("分けて足す", "大きな長方形から引く", "両方のやり方がある", "求められない"), hint: "工夫して長方形を作ろう。" },
        { question: "めんせき 1a の正方形. 一辺は何m？", answer: "10m", options: d("10m", "100m", "1m", "1000m"), hint: "10 × 10 ＝ 100 (a)。" },
    ];

const MATH_G4_3: GeneralProblem[] = [
        { question: "「2.4 ÷ 4 ＝ 」 答えは？", answer: "0.6", options: d("0.6", "6", "0.06", "24"), hint: "24 ÷ 4 は 6. 位を考えよう。" },
        { question: "「6.3 ÷ 3 ＝ 」 答えは？", answer: "2.1", options: d("2.1", "21", "0.21", "6.3"), hint: "小数のわり算のひっ算。" },
        { question: "「真分数（しんぶんすう）」とは？", answer: "分子が分母より小さい分数", options: d("分子が小さい", "分子が大きい", "整数と同じ", "分母が1"), hint: "1より小さい分数のことだよ。" },
        { question: "「仮分数（かぶんすう）」とは？", answer: "分子が分母と同じか、大きい分数", options: d("分子が同じか大きい", "分子が小さい", "分母が1", "マイナス"), hint: "1以上の大きさを表すよ。" },
        { question: "「帯分数（たいぶんすう）」とは？", answer: "整数と真分数が合わさった分数", options: d("整数と分数", "分子が1", "分母が10", "小数と同じ"), hint: "1と2/3 のような形。" },
        { question: "「3/5 ＋ 4/5 ＝ 」 答えを帯分数で言うと？", answer: "1と2/5", options: d("1と2/5", "7/5", "1と3/5", "7/10"), hint: "7/5 を帯分数になおそう。" },
        { question: "「2と1/3」 を 仮分数になおすと？", answer: "7/3", options: d("7/3", "3/3", "6/3", "2/3"), hint: "2 は 6/3 だね。" },
        { question: "「10/4」 を 帯分数になおすと？", answer: "2と2/4", options: d("2と2/4", "1と2/4", "2と1/4", "10"), hint: "10 ÷ 4 は 2 あまり 2. ※約分は中学生から本格化。" },
        { question: "箱のような形（直方体）で、面（めん）はいくつある？", answer: "6つ", options: d("6つ", "4つ", "8つ", "12つ"), hint: "サイコロを思い出してみて。" },
        { question: "サイコロのような形（立方体）で、辺の数は？", answer: "12本", options: d("12本", "6本", "8本", "4本"), hint: "骨組み（ほねぐみ）の数。" },
        { question: "直方体で、頂点（ちょうてん）の数は？", answer: "8こ", options: d("8こ", "6こ", "12こ", "4こ"), hint: "かどっこの数だよ。" },
        { question: "グラフの問題. 時間の経過（けいか）とともに変わる様子を表すのは？", answer: "折れ線（おれせん）グラフ", options: d("折れ線グラフ", "棒グラフ", "円グラフ", "帯グラフ"), hint: "点の変化を線で結ぶよ。" },
        { question: "折れ線グラフのかたむきが急なところは？", answer: "変化がはげしいところ", options: d("変化がはげしい", "変化がない", "平均", "合計"), hint: "坂道が急なイメージ。" },
        { question: "「変わり方」の問題. 1辺が□cmの正方形のまわりの長さ△cm. 式は？", answer: "△ ＝ □ × 4", options: d("△ ＝ □ × 4", "△ ＝ □ ＋ 4", "△ ＝ □ × □", "△ ＝ □ ÷ 4"), hint: "同じ辺が4つあるね。" },
        { question: "見取り図（みとりず）とはどんな図？", answer: "立体をななめから見た全体図", options: d("ななめから見た図", "真上から見た図", "てんかい図", "断面図"), hint: "奥行きがあるように描くよ。" },
        { question: "てんかい図を組み立てると何になる？", answer: "立体", options: d("立体", "平面", "直線", "点"), hint: "切り開いた図を戻すよ。" },
        { question: "立方体のてんかい図、面は何個ある？", answer: "6個", options: d("6個", "4個", "12個", "8個"), hint: "組み立てる前も後も同じだよ。" },
        { question: "直方体の向かい合う面どうしの関係は？", answer: "へいこう", options: d("へいこう", "すいちょく", "ななめ", "交わる"), hint: "どこまでいってもぶつからない。" },
        { question: "直方体のとなりあう面どうしの関係は？", answer: "すいちょく", options: d("すいちょく", "へいこう", "重なる", "バラバラ"), hint: "カドでピシッと交わる。" },
        { question: "「0.3 × 4 ＝ 」 答えは？", answer: "1.2", options: d("1.2", "0.12", "12", "0.7"), hint: "3×4 は 12. 小数点を動かそう。" },
        { question: "「1.5 × 6 ＝ 」 答えは？", answer: "9", options: d("9", "0.9", "90", "7.5"), hint: "15×6 は 90。" },
        { question: "「8.4 ÷ 2 ＝ 」 答えは？", answer: "4.2", options: d("4.2", "42", "0.42", "4"), hint: "半分にするだけ。" },
        { question: "「1 ÷ 4 ＝ 」 答えを小数で言うと？", answer: "0.25", options: d("0.25", "0.4", "4", "2.5"), hint: "1.00 ÷ 4 を計算してみて。" },
        { question: "分母が同じ分数の引き算. 「1 － 1/4 ＝ 」", answer: "3/4", options: d("3/4", "1/4", "4/4", "0"), hint: "1 は 4/4 だよ。" },
        { question: "「2と4/7 － 1と1/7 ＝ 」 答えは？", answer: "1と3/7", options: d("1と3/7", "1と5/7", "3/7", "1"), hint: "整数は整数、分数は分数でひこう。" },
        { question: "折れ線グラフで、横のじくが表すのは何が多い？", answer: "時間（月、時など）", options: d("時間", "数", "名前", "場所"), hint: "右にいくほど時間が進むよ。" },
        { question: "グラフで「はぶいた」ことを表す、波のような線は？", answer: "波線（なみせん）", options: d("波線", "直線", "点線", "二重線"), hint: "途中をカットするときに使う。" },
        { question: "直方体の辺は、1つの頂点から何本出ている？", answer: "3本", options: d("3本", "4本", "2本", "1本"), hint: "たて、よこ、高さだね。" },
        { question: "立方体のすべての面はどのような形？", answer: "すべて同じ正方形", options: d("正方形", "長方形", "円", "三角形"), hint: "どこから見ても同じ。" },
        { question: "「(1/3) ＋ (1/3) ＋ (1/3) ＝ 」 答えは？", answer: "1 (3/3)", options: d("1", "3", "1/3", "1/9"), hint: "全部あわせると元通り。" },
        { question: "小数のわり算「わり進む」. 「7 ÷ 5 ＝ 」 答えは？", answer: "1.4", options: d("1.4", "1.2", "0.75", "1"), hint: "7.0 ÷ 5 を計算。" },
        { question: "「0.01」が 1000個あると？", answer: "10", options: d("10", "1", "100", "0.1"), hint: "100個で1になるからね。" },
        { question: "平面上の位置を「(横, 縦)」で表すとき、(3, 2)は？", answer: "横に3、縦に2進んだ点", options: d("横3縦2", "横2縦3", "全部で5", "中心"), hint: "じゅんばんが大事だよ。" },
        { question: "空間の位置を「(横, 縦, 高さ)」で表すと、数字は何個必要？", answer: "3個", options: d("3個", "2個", "1個", "4個"), hint: "3つの方向があるからね。" },
        { question: "直方体のてんかい図で、となりあわない面を何という？", answer: "向かい合う面", options: d("向かい合う面", "隣の面", "重なる面", "底面"), hint: "組み立てるとへいこうになる面。" },
        { question: "分母が「100」の分数は、小数でいうと？", answer: "0.01の倍数", options: d("0.01の倍数", "0.1の倍数", "100の倍数", "整数"), hint: "1/100 ＝ 0.01。" },
        { question: "「5/5」 は 整数でいくつ？", answer: "1", options: d("1", "5", "0", "55"), hint: "分母と分子が同じなら？" },
        { question: "「1と1/2」 と 「3/2」、どっちが大きい？", answer: "同じ", options: d("同じ", "1と1/2", "3/2", "わからない"), hint: "帯分数と仮分数を直して比べて。" },
        { question: "「2.34」 は 0.01 が何個集まった数？", answer: "234個", options: d("234個", "23個", "2個", "2340個"), hint: "小数点をなくして考えて。" },
        { question: "わり算「15 ÷ 6」 を小数で答えると？", answer: "2.5", options: d("2.5", "2", "2.1", "3"), hint: "15.0 ÷ 6 を計算。" },
        { question: "「0.6 × 5 ＝ 」 答えは？", answer: "3", options: d("3", "0.3", "30", "3.6"), hint: "6 × 5 ＝ 30。" },
        { question: "「4/9 ＋ 2/9 ＝ 」 答えは？", answer: "6/9", options: d("6/9", "6/18", "2/9", "1"), hint: "分母はそのまま。" },
        { question: "帯分数の引き算. 「3と1/4 － 2/4 ＝ 」", answer: "2と3/4", options: d("2と3/4", "3と1/4", "2と1/4", "1"), hint: "1（4/4）を借りてこよう。" },
        { question: "「1.25」 を 分数に直すと？", answer: "1と1/4", options: d("1と1/4", "1と25/10", "125", "1/4"), hint: "0.25 は 1/4 だよ。" },
        { question: "直方体の見取り図で、見えない辺はどう描く？", answer: "点線で描く", options: d("点線", "描かない", "実線", "赤色"), hint: "透けて見えるように描く工夫。" },
        { question: "立方体を真上から見ると、どんな形？", answer: "正方形", options: d("正方形", "長方形", "円", "点"), hint: "どの面も正方形だからね。" },
        { question: "「8.1 ÷ 9 ＝ 」 答えは？", answer: "0.9", options: d("0.9", "9", "0.09", "1.1"), hint: "81 ÷ 9 ＝ 9。" },
        { question: "「0.05 × 2 ＝ 」 答えは？", answer: "0.1", options: d("0.1", "0.01", "1", "0.52"), hint: "5 × 2 ＝ 10。" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g4Term1Units = splitIntoUnits(MATH_G4_1, 5);
const g4Term2Units = splitIntoUnits(MATH_G4_2, 5);
const g4Term3Units = splitIntoUnits(MATH_G4_3, 5);

export const MATH_G4_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G4_U01: [], // 大きい 数（1おくまでの数）
    MATH_G4_U02: [], // わり算（2けたでわる計算）
    MATH_G4_U03: [], // 折れ線グラフ
    MATH_G4_U04: [], // 角
    MATH_G4_U05: [], // そろばん
    MATH_G4_U06: [], // 小数
    MATH_G4_U07: [], // 小数の たし算 と ひき算
    MATH_G4_U08: [], // 面せき
    MATH_G4_U09: [], // がい数
    MATH_G4_U10: [], // 式 と 計算の じゅんじょ
    MATH_G4_U11: [], // 分数
    MATH_G4_U12: [], // 分数の たし算 と ひき算
    MATH_G4_U13: [], // 直方体 と 立方体
    MATH_G4_U14: [], // 変わり方
    MATH_G4_U15: [], // 調べたことを 表 や グラフ にまとめる
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G4_U01': {
            const oku = (n % 9) + 1;
            const man = (n % 8) + 1;
            if (n % 2 === 0) {
                return { question: `${oku}億${man}万 は 何万？`, answer: `${oku * 10000 + man}万`, options: d(`${oku * 10000 + man}万`, `${oku * 1000 + man}万`, `${oku * 10000}万`, `${man}万`), hint: "1億 = 10000万。" };
            }
            return { question: `${oku * 10000 + man}万 は 何億何万？`, answer: `${oku}億${man}万`, options: d(`${oku}億${man}万`, `${oku}億`, `${man}万`, `${oku + 1}億${man}万`), hint: "10000万 を 1億 として まとめる。" };
        }
        case 'MATH_G4_U02': {
            const divisor = (n % 80) + 20;
            const q = (n % 7) + 2;
            const nmr = divisor * q;
            if (n % 2 === 0) {
                return { question: `${nmr} ÷ ${divisor} = ?`, answer: `${q}`, options: d(`${q}`, `${q + 1}`, `${q - 1}`, `${divisor}`), hint: "2けたでわる計算。" };
            }
            return { question: `□ × ${divisor} = ${nmr}。 □ は？`, answer: `${q}`, options: d(`${q}`, `${q + 1}`, `${Math.max(1, q - 1)}`, `${divisor}`), hint: "わり算を かけ算で たしかめる。" };
        }
        case 'MATH_G4_U03': {
            const a = (n % 7) + 2;
            const b = (n % 6) + 1;
            const c = (n % 8) + 1;
            const p = n % 4;
            if (p === 0) {
                const answer = a === b ? "同じ" : (a < b ? "ふえた" : "へった");
                const wrongs = ["ふえた", "へった", "同じ", "わからない"].filter((label) => label !== answer).slice(0, 3);
                return { question: `1日目→2日目で ふえた？へった？`, answer, options: d(answer, ...wrongs), hint: "前の日と比べる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["1日目", "2日目"] } };
            }
            if (p === 1) {
                const max = Math.max(a, b, c);
                const winners = ([["1日目", a], ["2日目", b], ["3日目", c]] as [string, number][]).filter(([, v]) => v === max).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "同じ";
                const wrongs = ["1日目", "2日目", "3日目", "同じ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `3日間で いちばん 多い日は？`, answer, options: d(answer, ...wrongs), hint: "いちばん高いぼう。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["1日目", "2日目", "3日目"] } };
            }
            if (p === 2) {
                return { question: `1日目 と 2日目 の ちがいは？`, answer: `${Math.abs(a - b)}人`, options: d(`${Math.abs(a - b)}人`, `${a + b}人`, `${Math.max(a, b)}人`, `${Math.min(a, b)}人`), hint: "2本の高さの差。", visual: { kind: 'bar_chart', values: [a, b], labels: ["1日目", "2日目"] } };
            }
            return { question: `3日間の 合計は？`, answer: `${a + b + c}人`, options: d(`${a + b + c}人`, `${a + b}人`, `${b + c}人`, `${a + c}人`), hint: "3本ともたす。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["1日目", "2日目", "3日目"] } };
        }
        case 'MATH_G4_U04': {
            const a = (n % 9 + 1) * 10;
            return {
                question: `この角は 直角(90度)より 大きい？小さい？`,
                answer: a > 90 ? "大きい" : (a < 90 ? "小さい" : "同じ"),
                options: d(a > 90 ? "大きい" : (a < 90 ? "小さい" : "同じ"), "大きい", "小さい", "同じ"),
                hint: "90度と比べよう。",
                visual: { kind: 'angle', degrees: a }
            };
        }
        case 'MATH_G4_U05': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 2;
            return { question: `そろばんのように くらをそろえて計算。 ${a * 100} + ${b * 10} = ?`, answer: `${a * 100 + b * 10}`, options: d(`${a * 100 + b * 10}`, `${a * 10 + b * 100}`, `${a + b}`, `${a * 100 + b}`), hint: "百のくら、十のくらを分ける。" };
        }
        case 'MATH_G4_U06': {
            const a = (n % 9) + 1;
            if (n % 2 === 0) {
                return { question: `0.${a} は 1/10 が いくつ分？`, answer: `${a}つ`, options: d(`${a}つ`, `${a * 10}つ`, "1つ", `${a + 1}つ`), hint: "小数第一位を見よう。" };
            }
            return { question: `1/10 が ${a}つ ある数を 小数で書くと？`, answer: `0.${a}`, options: d(`0.${a}`, `${a}.0`, `0.0${a}`, `${a}/10`), hint: "10分のいくつかを 小数で 表す。" };
        }
        case 'MATH_G4_U07': {
            const a = (n % 8) + 1;
            const b = (n % 8) + 1;
            const sum = (a + a / 10 + b + b / 10).toFixed(1);
            const diffBig = (Math.max(a, b) + Math.max(a, b) / 10 - (Math.min(a, b) + Math.min(a, b) / 10)).toFixed(1);
            if (n % 2 === 0) {
                return { question: `${a}.${a} + ${b}.${b} = ?`, answer: sum, options: d(sum, `${a + b}`, `${a}.${b}`, `${b}.${a}`), hint: "同じ位どうしを足す。" };
            }
            return { question: `${Math.max(a, b)}.${Math.max(a, b)} - ${Math.min(a, b)}.${Math.min(a, b)} = ?`, answer: diffBig, options: d(diffBig, `${Math.max(a, b) - Math.min(a, b)}`, `${sum}`, `${(Math.max(a, b) - Math.min(a, b)).toFixed(1)}`), hint: "同じ位どうしをひく。" };
        }
        case 'MATH_G4_U08': {
            const h = (n % 8) + 2;
            const w = (n % 7) + 3;
            if (n % 2 === 0) {
                return { question: `たて${h}cm よこ${w}cm の長方形の面せきは？`, answer: `${h * w}cm2`, options: d(`${h * w}cm2`, `${h + w}cm2`, `${h * 2 + w * 2}cm`, `${h * w * 2}cm2`), hint: "面せき = たて×よこ。" };
            }
            return { question: `面せきが ${h * w}cm2、たてが ${h}cm の長方形。 よこは？`, answer: `${w}cm`, options: d(`${w}cm`, `${h}cm`, `${h * w}cm`, `${h + w}cm`), hint: "面せき ÷ たて = よこ。" };
        }
        case 'MATH_G4_U09': {
            const value = 1000 + n * 37;
            const rounded = Math.round(value / 100) * 100;
            if (n % 2 === 0) {
                return { question: `${value} を百の位までの がい数にすると？`, answer: `${rounded}`, options: d(`${rounded}`, `${Math.floor(value / 100) * 100}`, `${Math.ceil(value / 100) * 100}`, `${value}`), hint: "十の位を見て四捨五入。" };
            }
            return { question: `${value} の 十の位を四捨五入すると？`, answer: `${rounded}`, options: d(`${rounded}`, `${Math.floor(value / 100) * 100}`, `${Math.ceil(value / 100) * 100}`, `${value}`), hint: "百の位までの がい数と 同じ意味。" };
        }
        case 'MATH_G4_U10': {
            const a = (n % 8) + 2;
            const b = (n % 7) + 2;
            const c = (n % 6) + 2;
            if (n % 2 === 0) {
                return { question: `${a} + ${b} × ${c} = ?`, answer: `${a + b * c}`, options: d(`${a + b * c}`, `${(a + b) * c}`, `${a * b + c}`, `${a + b + c}`), hint: "かけ算を先に計算。" };
            }
            return { question: `(${a} + ${b}) × ${c} = ?`, answer: `${(a + b) * c}`, options: d(`${(a + b) * c}`, `${a + b * c}`, `${a * b + c}`, `${a + b + c}`), hint: "かっこの中を 先に計算。" };
        }
        case 'MATH_G4_U11': {
            const denominator = (n % 7) + 3;
            const num = (n % (denominator - 1)) + 1;
            const improper = denominator + (n % 3);
            const p = n % 4;
            if (p === 0) {
                return { question: `${num}/${denominator} は 真分数？仮分数？`, answer: "真分数", options: d("真分数", "仮分数", "帯分数", "整数"), hint: "分子が分母より小さい。", visual: { kind: 'fraction', numerator: num, denominator } };
            }
            if (p === 1) {
                return { question: `${improper}/${denominator} は 真分数？仮分数？`, answer: "仮分数", options: d("仮分数", "真分数", "帯分数", "整数"), hint: "分子が分母以上。", visual: { kind: 'fraction', numerator: improper, denominator } };
            }
            if (p === 2) {
                return { question: `${num}/${denominator} と ${num}/${denominator} は 同じ？`, answer: "同じ", options: d("同じ", "ちがう", "くらべられない", "わからない"), hint: "まったく同じ分数。", visual: { kind: 'fraction_operation', left: { n: num, d: denominator }, right: { n: num, d: denominator }, op: '>' } };
            }
            return { question: `${num}/${denominator} は 1より 小さい？大きい？`, answer: "小さい", options: d("小さい", "大きい", "同じ", "わからない"), hint: "真分数は1より小さい。", visual: { kind: 'fraction', numerator: num, denominator } };
        }
        case 'MATH_G4_U12': {
            const denominator = (n % 7) + 3;
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
                    options: d(`${big - small}/${denominator}`, `${big + small}/${denominator}`, `${big - small}/${denominator * 2}`, `${small}/${denominator}`),
                    hint: "分母が同じなら分子を引く。",
                    visual: { kind: 'fraction_operation', left: { n: big, d: denominator }, right: { n: small, d: denominator }, op: '-' }
                };
            }
            if (p === 2) {
                return {
                    question: `${a}/${denominator} と ${b}/${denominator}。 大きいのは？`,
                    answer: `${b}/${denominator}`,
                    options: d(`${b}/${denominator}`, `${a}/${denominator}`, "同じ", "くらべられない"),
                    hint: "分母が同じなら分子を比べる。",
                    visual: { kind: 'fraction_operation', left: { n: a, d: denominator }, right: { n: b, d: denominator }, op: '>' }
                };
            }
            return {
                question: `${a}/${denominator} と ${b}/${denominator}。 小さいのは？`,
                answer: `${a}/${denominator}`,
                options: d(`${a}/${denominator}`, `${b}/${denominator}`, "同じ", "くらべられない"),
                hint: "分母が同じなら分子が小さいほう。",
                visual: { kind: 'fraction_operation', left: { n: a, d: denominator }, right: { n: b, d: denominator }, op: '<' }
            };
        }
        case 'MATH_G4_U13': {
            const p = n % 6;
            if (p === 0) {
                return { question: "この立体の面の数は？", answer: "6つ", options: d("6つ", "8つ", "12つ", "4つ"), hint: "サイコロと同じ。", visual: { kind: 'cube' } };
            }
            if (p === 1) {
                return { question: "この立体の辺の数は？", answer: "12本", options: d("12本", "6本", "8本", "4本"), hint: "骨組みを数える。", visual: { kind: 'cube' } };
            }
            if (p === 2) {
                return { question: "この立体の頂点の数は？", answer: "8こ", options: d("8こ", "6こ", "12こ", "4こ"), hint: "かどの数。", visual: { kind: 'cube' } };
            }
            if (p === 3) {
                return { question: "1つの頂点から出る辺の数は？", answer: "3本", options: d("3本", "2本", "4本", "6本"), hint: "たて・よこ・高さ。", visual: { kind: 'cube' } };
            }
            if (p === 4) {
                return { question: "直方体の向かい合う面どうしの関係は？", answer: "へいこう", options: d("へいこう", "すいちょく", "交わる", "重なる"), hint: "どこまでのばしても交わらない。", visual: { kind: 'cube' } };
            }
            return { question: "直方体のとなりあう面どうしの関係は？", answer: "すいちょく", options: d("すいちょく", "へいこう", "重なる", "同じ面"), hint: "かどで直角に交わる。", visual: { kind: 'cube' } };
        }
        case 'MATH_G4_U14': {
            const x = (n % 6) + 1;
            return { question: `正方形の1辺が ${x}cm のとき、まわりの長さは？`, answer: `${x * 4}cm`, options: d(`${x * 4}cm`, `${x * x}cm2`, `${x + 4}cm`, `${x * 2}cm`), hint: "同じ長さが4本。" };
        }
        case 'MATH_G4_U15': {
            const a = (n % 8) + 2;
            const b = (n % 5) + 1;
            return { question: `調べ学習。Aは${a}人、Bは${b}人。 表やグラフで伝えるならまず何をそろえる？`, answer: "項目と人数", options: d("項目と人数", "色だけ", "線の太さだけ", "順番は不要"), hint: "比べるために同じ項目をそろえる。" };
        }
        default:
            return { question: "4 + 5 = ?", answer: "9", options: d("9", "8", "10", "7"), hint: "たし算。" };
    }
};

fillGeneratedUnitProblems(MATH_G4_UNIT_DATA, makeUnitProblem);

export const MATH_G4_DATA: Record<string, GeneralProblem[]> = {
    MATH_G4_1,
    MATH_G4_2,
    MATH_G4_3,
    ...MATH_G4_UNIT_DATA,
};

