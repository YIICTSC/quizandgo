
import { GeneralProblem, d } from './utils';

const MATH_G3_1: GeneralProblem[] = [
        { question: "「12 ÷ 3 ＝ 」 答えは なに？", answer: "4", options: d("4", "3", "5", "6"), hint: "3 × □ ＝ 12 を かんがえよう。" },
        { question: "12この リンゴを 3人に 同じ数ずつ 分けると、1人分は 何こ？", answer: "4個", options: d("4個", "3個", "5個", "15個"), hint: "わり算の もんだいだよ。" },
        { question: "「0 ÷ 5 ＝ 」 答えは なに？", answer: "0", options: d("0", "5", "1", "なし"), hint: "0を 何人で 分けても 0だね。" },
        { question: "ひっ算 「23 × 3」 の 答えは？", answer: "69", options: d("69", "66", "26", "59"), hint: "3×3 と 20×3 を あわせよう。" },
        { question: "「万（まん）」の 10倍の たんいは 何？", answer: "十万（じゅうまん）", options: d("十万", "百万", "千万", "億"), hint: "一つずつ くらいが 上がるよ。" },
        { question: "「2300 ＋ 4500 ＝ 」 答えは？", answer: "6800", options: d("6800", "6500", "2345", "6700"), hint: "大きな 数の たし算。" },
        { question: "時間の たんい。1分は 何秒？", answer: "60秒", options: d("60秒", "100秒", "10秒", "24秒"), hint: "とけいの びょうの はりが 1しゅう する 時間。" },
        { question: "「2分10秒」 は 何秒？", answer: "130秒", options: d("130秒", "120秒", "30秒", "210秒"), hint: "60 × 2 ＋ 10。" },
        { question: "長さの たんい。1km（キロメートル） は 何m？", answer: "1000m", options: d("1000m", "100m", "10m", "10000m"), hint: "「k（キロ）」は 1000倍 という いみ。" },
        { question: "「300m ＋ 800m ＝ 」 答えを km と m で いうと？", answer: "1km 100m", options: d("1km 100m", "1100m", "1km", "2km"), hint: "1000m を こえると km に なるよ。" },
        { question: "円の 中心から、まわりまでの 直線の なまえは？", answer: "半径（はんけい）", options: d("半径", "直径", "円周", "中心線"), hint: "ちょっけい の 半分の ながさだよ。" },
        { question: "円の 「直径（ちょっけい）」は、半径の 何倍？", answer: "2倍", options: d("2倍", "3倍", "1倍", "半分"), hint: "中心を 通る 一番 長い 線。" },
        { question: "10000 を 10こ あつめた 数は？", answer: "十万（100000）", options: d("十万", "一万", "百万", "一億"), hint: "0が 5個 ならぶよ。" },
        { question: "わり算。 わる数よりも、あまりは 必ず どうなる？", answer: "小さくなる", options: d("小さくなる", "大きくなる", "同じになる", "関係ない"), hint: "あまりが わる数 より 大きかったら、まだ 分けられるよね。" },
        { question: "コンパスは 何を かくときに つかう？", answer: "円", options: d("円", "正方形", "三角形", "直線"), hint: "はんけい を きめて くるっと 回すよ。" },
        { question: "「15 ÷ 5 = 」 答えは？", answer: "3", options: d("3", "5", "10", "20"), hint: "5のだんの 九九。" },
        { question: "「18 ÷ 2 = 」 答えは？", answer: "9", options: d("9", "8", "7", "6"), hint: "2 × 9 は？" },
        { question: "「30 ÷ 6 = 」 答えは？", answer: "5", options: d("5", "4", "6", "7"), hint: "6 × □ = 30。" },
        { question: "「28 ÷ 4 = 」 答えは？", answer: "7", options: d("7", "6", "8", "9"), hint: "4のだんの 九九。" },
        { question: "「45 ÷ 9 = 」 答えは？", answer: "5", options: d("5", "6", "4", "9"), hint: "9 × □ = 45。" },
        { question: "32枚の色紙を 4人で 同じ数ずつ 分けると 1人分は何枚？", answer: "8枚", options: d("8枚", "7枚", "9枚", "4枚"), hint: "32 ÷ 4 = ?" },
        { question: "40人の クラスを 5つの グループに 分けると 1チーム何人？", answer: "8人", options: d("8人", "5人", "10人", "7人"), hint: "40 ÷ 5 = ?" },
        { question: "「10 ÷ 1 = 」 答えは？", answer: "10", options: d("10", "1", "0", "11"), hint: "1人で 分けると そのまま。" },
        { question: "「5 ÷ 5 = 」 答えは？", answer: "1", options: d("1", "5", "0", "25"), hint: "自分と同じ数で 割ると？" },
        { question: "一億（いちおく）は 一万（いちまん）の 何倍？", answer: "10000倍", options: d("10000倍", "100倍", "1000倍", "10倍"), hint: "万が 万こで 億。" },
        { question: "「530000」 の 読み方は？", answer: "五十三万", options: d("五十三万", "五万三千", "五百三十", "五億三千"), hint: "4けたずつ 区切る。" },
        { question: "「一千万」 を 数字で 書くと？", answer: "10000000", options: d("10000000", "1000000", "100000", "10000"), hint: "0は 7個。" },
        { question: "「121 × 4 = 」 答えは？", answer: "484", options: d("484", "444", "848", "424"), hint: "ひっ算で 計算。" },
        { question: "「203 × 3 = 」 答えは？", answer: "609", options: d("609", "690", "633", "233"), hint: "0の 位に 注意。" },
        { question: "「312 × 2 = 」 答えは？", answer: "624", options: d("624", "612", "314", "600"), hint: "それぞれの くらいを 2倍に。" },
        { question: "「500 × 4 = 」 答えは？", answer: "2000", options: d("2000", "504", "900", "200"), hint: "5×4の あとに 00。" },
        { question: "「80 × 5 = 」 答えは？", answer: "400", options: d("400", "40", "4000", "85"), hint: "8×5は 40。" },
        { question: "1時間は 何分？", answer: "60分", options: d("60分", "100分", "24分", "12分"), hint: "とけいの 長い はりが 一しゅう。" },
        { question: "「100秒」 を 分と秒で いうと？", answer: "1分40秒", options: d("1分40秒", "1分0秒", "1分60秒", "2分0秒"), hint: "60秒で 1分。" },
        { question: "「80分」 を 時間と分で いうと？", answer: "1時間20分", options: d("1時間20分", "1時間0分", "2時間0分", "1時間40分"), hint: "60分で 1時間。" },
        { question: "「3km」 は 何m？", answer: "3000m", options: d("3000m", "300m", "30m", "30000m"), hint: "1km = 1000m。" },
        { question: "「4500m」 を kmとmで いうと？", answer: "4km 500m", options: d("4km 500m", "45km", "450km", "40km 5m"), hint: "千の 位が km。" },
        { question: "円の 直径が 10cmのとき、半径は 何cm？", answer: "5cm", options: d("5cm", "20cm", "10cm", "2cm"), hint: "直径の 半分。" },
        { question: "円の 半径が 3cmのとき、直径は 何cm？", answer: "6cm", options: d("6cm", "3cm", "9cm", "12cm"), hint: "半径の 2倍。" },
        { question: "コンパスの 針（はり）を さす 場所の なまえは？", answer: "中心", options: d("中心", "端", "半径", "円周"), hint: "ここから きょりが 同じ 点を うつ。" },
        { question: "「48 ÷ 8 = 」 答えは？", answer: "6", options: d("6", "7", "8", "5"), hint: "8×6=48。" },
        { question: "「56 ÷ 7 = 」 答えは？", answer: "8", options: d("8", "7", "9", "6"), hint: "7×8=56。" },
        { question: "「63 ÷ 9 = 」 答えは？", answer: "7", options: d("7", "6", "8", "9"), hint: "9×7=63。" },
        { question: "「72 ÷ 8 = 」 答えは？", answer: "9", options: d("9", "8", "7", "6"), hint: "8×9=72。" },
        { question: "「0 × 123 = 」 答えは？", answer: "0", options: d("0", "123", "1", "なし"), hint: "0に 何を かけても？" },
        { question: "「10000 - 1 = 」 答えは？", answer: "9999", options: d("9999", "999", "1000", "0"), hint: "大きな 数の ひき算。" },
        { question: "「1分30秒 + 40秒 = 」 答えは？", answer: "2分10秒", options: d("2分10秒", "1分70秒", "2分0秒", "1分10秒"), hint: "60秒で くりあがり。" },
        { question: "「3km - 500m = 」 答えは？", answer: "2km 500m", options: d("2km 500m", "2km", "3km 500m", "2500m"), hint: "3000m - 500m。" },
        { question: "「130 × 3 = 」 答えは？", answer: "390", options: d("390", "360", "133", "300"), hint: "あんざんで できるかな？" },
        { question: "「210 ÷ 7 = 」 答えは？", answer: "30", options: d("30", "3", "300", "21"), hint: "21 ÷ 7 を かんがえて。" }
    ];

const MATH_G3_2: GeneralProblem[] = [
        { question: "「24 × 30」 の 答えは？", answer: "720", options: d("720", "72", "240", "600"), hint: "24 × 3 の あとに 0 を つけよう。" },
        { question: "小数（しょうすう）の問題。 0.1 を 10こ あつめると？", answer: "1", options: d("1", "0.10", "10", "0"), hint: "1を 10等分（とうぶん）したのが 0.1だよ。" },
        { question: "「0.3 ＋ 0.5 ＝ 」 答えは？", answer: "0.8", options: d("0.8", "8", "0.08", "3.5"), hint: "小数の たし算。" },
        { question: "「1 － 0.2 ＝ 」 答えは？", answer: "0.8", options: d("0.8", "1.2", "0.2", "0.9"), hint: "10個の中から 2個 取ると？" },
        { question: "重さの たんい. 1kg（キログラム）は 何g？", answer: "1000g", options: d("1000g", "100g", "10g", "10000g"), hint: "キロは 1000倍だよ。" },
        { question: "1t（トン） は 何kg？", answer: "1000kg", options: d("1000kg", "100kg", "10000kg", "1kg"), hint: "ゾウや トラックの 重さを 表す たんい。" },
        { question: "「400g ＋ 700g ＝ 」 答えを kg と g で いうと？", answer: "1kg 100g", options: d("1kg 100g", "1100g", "1kg", "2kg"), hint: "1000g で 1kg に なるよ。" },
        { question: "三角形. 3つの 辺の ながさが すべて 同じなのを 何という？", answer: "正三角形（せいさんかくけい）", options: d("正三角形", "二等辺三角形", "直角三角形", "不等辺三角形"), hint: "「正（せい）」は 整っているという いみ。" },
        { question: "三角形. 2つの 辺の ながさが 同じなのを 何という？", answer: "二等辺三角形（にとうへんさんかくけい）", options: d("二等辺三角形", "正三角形", "直角三角形", "台形"), hint: "「二」つの 「等」しい 「辺」。" },
        { question: "円の中に、一番 長い 直線を 引くと、それは 必ず どこを 通る？", answer: "中心", options: d("中心", "端っこ", "どこでもいい", "通らない"), hint: "その直線を 「直径（ちょっけい）」というよ。" },
        { question: "「360 × 2 ＝ 」 あんざんで 答えは？", answer: "720", options: d("720", "620", "362", "700"), hint: "36 × 2 は？" },
        { question: "分数（ぶんすう）. 1 を 3つに 分けた うちの 1つを 何という？", answer: "3分の1 (1/3)", options: d("3分の1", "1分の3", "2分の1", "4分の1"), hint: "下が 分けた 数、上が もらった 数。" },
        { question: "「1/4 ＋ 2/4 ＝ 」 答えは？", answer: "3/4", options: d("3/4", "3/8", "1/4", "1"), hint: "分母（下）はそのままで、分子（上）を 足そう。" },
        { question: "「1 － 1/3 ＝ 」 答えは？", answer: "2/3", options: d("2/3", "1/3", "0", "1"), hint: "1 は 3/3 と 同じだよ。" },
        { question: "「あまり」の ある わり算. 「17 ÷ 3 ＝ 」 答えは？", answer: "5 あまり 2", options: d("5 あまり 2", "5 あまり 1", "6 あまり 1", "4 あまり 5"), hint: "3 × 5 ＝ 15. のこりは？" },
        { question: "「20 ÷ 4 ＝ 5」 の 計算を たしかめる かけ算の 式は？", answer: "5 × 4 ＝ 20", options: d("5 × 4 ＝ 20", "20 × 4", "20 ＋ 4", "5 － 4"), hint: "ぎゃくから かんがえよう。" },
        { question: "「25 ÷ 4 = 」 答えは？", answer: "6 あまり 1", options: d("6 あまり 1", "6 あまり 2", "5 あまり 1", "7 あまり 1"), hint: "4×6=24。" },
        { question: "「38 ÷ 5 = 」 答えは？", answer: "7 あまり 3", options: d("7 あまり 3", "7 あまり 2", "8 あまり 3", "6 あまり 3"), hint: "5×7=35。" },
        { question: "「44 ÷ 6 = 」 答えは？", answer: "7 あまり 2", options: d("7 あまり 2", "6 あまり 8", "7 あまり 4", "8 あまり 2"), hint: "6×7=42。" },
        { question: "「50 ÷ 7 = 」 答えは？", answer: "7 あまり 1", options: d("7 あまり 1", "8 あまり 1", "6 あまり 8", "7 あまり 0"), hint: "7×7=49。" },
        { question: "「13 × 20 = 」 答えは？", answer: "260", options: d("260", "26", "130", "300"), hint: "13×2の あとに 0。" },
        { question: "「1.2 + 0.9 = 」 答えは？", answer: "2.1", options: d("2.1", "1.1", "2.0", "3.1"), hint: "小数の たし算。" },
        { question: "「3.5 - 0.7 = 」 答えは？", answer: "2.8", options: d("2.8", "3.2", "2.2", "3.0"), hint: "小数の ひき算。" },
        { question: "「0.1」 が 15個 あると？", answer: "1.5", options: d("1.5", "15", "0.15", "1.05"), hint: "10個で 1に なる。" },
        { question: "「2.4」 は 0.1 が 何個分？", answer: "24個", options: d("24個", "2個", "4個", "240個"), hint: "2と 0.4。" },
        { question: "「5000g」 は 何kg？", answer: "5kg", options: d("5kg", "50kg", "500kg", "0.5kg"), hint: "1000g = 1kg。" },
        { question: "「2t 500kg」 は 何kg？", answer: "2500kg", options: d("2500kg", "250kg", "700kg", "2000kg"), hint: "1t = 1000kg。" },
        { question: "「800g + 600g = 」 答えを kg と g で いうと？", answer: "1kg 400g", options: d("1kg 400g", "1400g", "1kg", "2kg"), hint: "1000g を こえると kg。" },
        { question: "「2kg - 300g = 」 答えは？", answer: "1700g", options: d("1700g", "1kg 700g", "2300g", "1300g"), hint: "2000 - 300。" },
        { question: "球（たま）を どこで 切っても、切り口は どんな 形？", answer: "円", options: d("円", "正方形", "長方形", "楕円"), hint: "ボールの かたち。" },
        { question: "球の 真ん中を 通る 一番 長い 直線を 何という？", answer: "直径（ちょっけい）", options: d("直径", "半径", "中心線", "円周"), hint: "球でも 直径 というよ。" },
        { question: "球の 直径は 半径の 何倍？", answer: "2倍", options: d("2倍", "3倍", "4倍", "半分"), hint: "中心を はさむから。" },
        { question: "「21 × 14 = 」 答えは？", answer: "294", options: d("294", "210", "84", "304"), hint: "2けたの かけ算。" },
        { question: "「32 × 12 = 」 答えは？", answer: "384", options: d("384", "320", "64", "400"), hint: "ひっ算で 計算。" },
        { question: "「11 × 11 = 」 答えは？", answer: "121", options: d("121", "22", "111", "122"), hint: "ぞろめの かけ算。" },
        { question: "「40 × 50 = 」 答えは？", answer: "2000", options: d("2000", "200", "90", "20000"), hint: "4×5は 20。" },
        { question: "「あまり」の ある わり算で、あまりは 「わる数」より？", answer: "必ず 小さくなる", options: d("必ず 小さくなる", "大きくなる", "同じになる", "自由"), hint: "割り切れない 残りの こと。" },
        { question: "「26 ÷ 3 = 」 答えは？", answer: "8 あまり 2", options: d("8 あまり 2", "7 あまり 5", "9 あまり 1", "8 あまり 1"), hint: "3×8=24。" },
        { question: "「33 ÷ 4 = 」 答えは？", answer: "8 あまり 1", options: d("8 あまり 1", "7 あまり 5", "8 あまり 2", "9 あまり 1"), hint: "4×8=32。" },
        { question: "「47 ÷ 6 = 」 答えは？", answer: "7 あまり 5", options: d("7 あまり 5", "8 あまり 1", "7 あまり 1", "6 あまり 11"), hint: "6×7=42。" },
        { question: "「58 ÷ 9 = 」 答えは？", answer: "6 あまり 4", options: d("6 あまり 4", "7 あまり 1", "6 あまり 5", "5 あまり 13"), hint: "9×6=54。" },
        { question: "「2/5 + 1/5 = 」 答えは？", answer: "3/5", options: d("3/5", "3/10", "1/5", "1"), hint: "上を たす。" },
        { question: "「4/7 - 2/7 = 」 答えは？", answer: "2/7", options: d("2/7", "2/0", "6/7", "1/7"), hint: "上を ひく。" },
        { question: "「1 - 3/4 = 」 答えは？", answer: "1/4", options: d("1/4", "3/4", "0", "1"), hint: "1は 4/4。" },
        { question: "「10 - 2.5 = 」 答えは？", answer: "7.5", options: d("7.5", "8.5", "7.0", "8.0"), hint: "小数の ひき算。" },
        { question: "「0.5 + 0.5 = 」 答えは？", answer: "1", options: d("1", "0.10", "0.1", "1.1"), hint: "半分と 半分。" },
        { question: "「15 × 3 = 」 答えは？", answer: "45", options: d("45", "30", "18", "60"), hint: "15×2は 30。" },
        { question: "「12 × 5 = 」 答えは？", answer: "60", options: d("60", "50", "17", "70"), hint: "とけいの 数字を おもいだして。" },
        { question: "「25 × 4 = 」 答えは？", answer: "100", options: d("100", "80", "29", "125"), hint: "よく出る 組み合わせ。" },
        { question: "「100 ÷ 4 = 」 答えは？", answer: "25", options: d("25", "20", "50", "30"), hint: "100の 半分、の 半分。" }
    ];

const MATH_G3_3: GeneralProblem[] = [
        { question: "「48 ÷ 4 ＝ 」 あんざんで 答えは？", answer: "12", options: d("12", "10", "11", "14"), hint: "40÷4 と 8÷4 に 分けよう。" },
        { question: "「630 ÷ 3 ＝ 」 答えは？", answer: "210", options: d("210", "21", "230", "310"), hint: "63 ÷ 3 は？" },
        { question: "一億（いちおく）は、一万（いちまん）を 何こ あつめた 数？", answer: "10000こ", options: d("10000こ", "100こ", "1000こ", "10こ"), hint: "万が 万こで 億に なるよ。" },
        { question: "「1.2 ＋ 0.8 ＝ 」 答えは？", answer: "2", options: d("2", "1.10", "2.0", "1.28"), hint: "くりあがり が あるよ。" },
        { question: "分数. 「4/5」 と 「3/5」、どっちが 大きい？", answer: "4/5", options: d("4/5", "3/5", "同じ", "比べられない"), hint: "分子（上）の 数を くらべよう。" },
        { question: "「1km」 を 「m」 に なおすと？", answer: "1000m", options: d("1000m", "100m", "10000m", "10m"), hint: "何度も 出てきたね。大事な たんい。" },
        { question: "正三角形の 1つの 角の 大きさは 何度？", answer: "60度", options: d("60度", "90度", "45度", "30度"), hint: "全部で 180度. それを 3で 割ると？" },
        { question: "2つの 二等辺三角形を あわせると、どんな 形に なる？", answer: "ひし形 や 長方形 など", options: d("ひし形 など", "正三角形", "円", "台形"), hint: "あわせ方によるね。" },
        { question: "「560000」 の 読み方は？", answer: "五十六万", options: d("五十六万", "五万六千", "五百六十", "五億六千万"), hint: "4けたずつ 区切って 読もう。" },
        { question: "「3 × 400 ＝ 」 答えは？", answer: "1200", options: d("1200", "120", "12000", "700"), hint: "3 × 4 は 12. そのあとに 00。" },
        { question: "計算の きまり. 「( )」 が あるときは どこから 計算する？", answer: "( ) の 中から", options: d("( ) の 中", "左から", "右から", "かけ算から"), hint: "カッコを さきに 計算するのが ルールだよ。" },
        { question: "「100 － (30 ＋ 20) ＝ 」 答えは？", answer: "50", options: d("50", "90", "70", "150"), hint: "カッコの 中は 50。" },
        { question: "そろばん. 「1」の 玉が 4つ、上の 「5」の 玉が 1つ. いくつ？", answer: "9", options: d("9", "5", "4", "1"), hint: "全部 あわせよう。" },
        { question: "ぼうグラフで、一番 長い ぼうは 何を 表している？", answer: "一番 数が 多いもの", options: d("数が多い", "数が少ない", "平均", "合計"), hint: "パッと 見て わかりやすいね。" },
        { question: "「あまり」 が 0 の わり算の ことを 何という？", answer: "わりきれる", options: d("わりきれる", "わりきれない", "わりすぎ", "わりあて"), hint: "ぴったり 分けられた じょうたい。" },
        { question: "「1/3 + 1/3 = 」 答えは？", answer: "2/3", options: d("2/3", "2/6", "1/3", "1"), hint: "分母は そのまま。" },
        { question: "「1 - 2/5 = 」 答えは？", answer: "3/5", options: d("3/5", "2/5", "1/5", "1"), hint: "1 = 5/5。" },
        { question: "「5/8」 と 「7/8」、小さいのは どっち？", answer: "5/8", options: d("5/8", "7/8", "同じ", "比べられない"), hint: "分子を くらべる。" },
        { question: "「2/2」 は 整数で 書くと いくつ？", answer: "1", options: d("1", "2", "0", "22"), hint: "全部 ある じょうたい。" },
        { question: "二等辺三角形の、ながさが 同じ 辺は いくつ？", answer: "2つ", options: d("2つ", "3つ", "1つ", "全部"), hint: "なまえに ヒントが ある。" },
        { question: "正三角形の 辺の 数は いくつ？", answer: "3つ", options: d("3つ", "2つ", "4つ", "0つ"), hint: "三角形だもんね。" },
        { question: "三角形の 3つの 角の 和は 何度？", answer: "180度", options: d("180度", "360度", "90度", "100度"), hint: "きまった 数字だよ。" },
        { question: "「180度 - 60度 - 60度 = 」 答えは？", answer: "60度", options: d("60度", "90度", "30度", "0度"), hint: "正三角形の 角。" },
        { question: "「180度 - 90度 - 45度 = 」 答えは？", answer: "45度", options: d("45度", "90度", "30度", "60度"), hint: "直角（ちょっかく）二等辺三角形。" },
        { question: "そろばんの 「5の玉」 は いくつ分？", answer: "5", options: d("5", "1", "10", "50"), hint: "上に ある 玉。" },
        { question: "そろばんの 「1の玉」 は いくつ分？", answer: "1", options: d("1", "5", "10", "0"), hint: "下に ある 4つの 玉。" },
        { question: "ぼうグラフの 「1めもり」 が 5のとき、3めもり分は？", answer: "15", options: d("15", "3", "5", "10"), hint: "5×3。" },
        { question: "表に まとめるとき、正の字 「正」 は 何を 表す？", answer: "5", options: d("5", "1", "10", "正解"), hint: "かくすう を 数えて。" },
        { question: "「24 × 5 = 」 あんざんで 答えは？", answer: "120", options: d("120", "100", "70", "245"), hint: "24×10 の 半分。" },
        { question: "「16 × 4 = 」 答えは？", answer: "64", options: d("64", "40", "20", "164"), hint: "16×2 の 2倍。" },
        { question: "「99 × 2 = 」 答えは？", answer: "198", options: d("198", "200", "188", "992"), hint: "100×2 より 2 小さい。" },
        { question: "「80 ÷ 4 = 」 答えは？", answer: "20", options: d("20", "2", "200", "84"), hint: "8÷4 は 2。" },
        { question: "「150 ÷ 5 = 」 答えは？", answer: "30", options: d("30", "3", "300", "15"), hint: "15÷5 を かんがえて。" },
        { question: "「400 ÷ 2 = 」 答えは？", answer: "200", options: d("200", "20", "2", "402"), hint: "半分に する。" },
        { question: "「(2 + 3) × 4 = 」 答えは？", answer: "20", options: d("20", "14", "10", "234"), hint: "カッコから 計算。" },
        { question: "「10 - 2 × 3 = 」 答えは？", answer: "4", options: d("4", "24", "8", "6"), hint: "かけ算が さき。" },
        { question: "「30 + 10 ÷ 2 = 」 答えは？", answer: "35", options: d("35", "20", "40", "15"), hint: "わり算が さき。" },
        { question: "一億の 1つ 下の くらいは？", answer: "千万", options: d("千万", "百万", "十万", "一万"), hint: "千、万、億。" },
        { question: "「45000000」 の 読み方は？", answer: "四千五百万", options: d("四千五百万", "四億五千万", "四百五十万", "四千五百"), hint: "0の 数を 数える。" },
        { question: "「0.1 + 0.1 + 0.1 = 」 答えは？", answer: "0.3", options: d("0.3", "3", "0.111", "0.03"), hint: "0.1 が 3つ。" },
        { question: "「1.5 - 0.5 = 」 答えは？", answer: "1", options: d("1", "0.5", "1.0", "1.1"), hint: "半分 ひく。" },
        { question: "1kg は 何g？", answer: "1000g", options: d("1000g", "100g", "10g", "1g"), hint: "大事な たんい。" },
        { question: "「500g」 は 1kgの 何分の一？", answer: "2分の一", options: d("2分の一", "4分の一", "10分の一", "1分の一"), hint: "半分だね。" },
        { question: "「250g」 は 1kgの 何分の一？", answer: "4分の一", options: d("4分の一", "2分の一", "8分の一", "5分の一"), hint: "半分の 半分。" },
        { question: "「1/10」 を 小数で 書くと？", answer: "0.1", options: d("0.1", "1.1", "0.01", "10"), hint: "10等分。" },
        { question: "「0.7」 を 分数で 書くと？", answer: "7/10", options: d("7/10", "1/7", "7/1", "0/7"), hint: "0.1 が 7つ。" },
        { question: "「36 ÷ 3 = 」 あんざんで？", answer: "12", options: d("12", "10", "33", "36"), hint: "30÷3 と 6÷3。" },
        { question: "「84 ÷ 4 = 」 答えは？", answer: "21", options: d("21", "20", "80", "4"), hint: "80÷4 と 4÷4。" },
        { question: "「66 ÷ 6 = 」 答えは？", answer: "11", options: d("11", "6", "60", "10"), hint: "10倍と 1倍。" },
        { question: "「□ ＋ 5 ＝ 12」 □ は いくつ？", answer: "7", options: d("7", "17", "5", "60"), hint: "12 － 5 ＝ ?" },
        { question: "「□ × 4 ＝ 32」 □ は いくつ？", answer: "8", options: d("8", "36", "28", "128"), hint: "32 ÷ 4 ＝ ?" },
    ];

const splitIntoUnitsByCounts = (problems: GeneralProblem[], counts: number[]): GeneralProblem[][] => {
    const totalWeight = counts.reduce((sum, c) => sum + c, 0);
    const totalProblems = problems.length;
    const targetSizes = counts.map((count) => Math.floor((totalProblems * count) / totalWeight));
    let rest = totalProblems - targetSizes.reduce((sum, n) => sum + n, 0);
    let idx = 0;
    while (rest > 0) {
        targetSizes[idx % targetSizes.length] += 1;
        rest -= 1;
        idx += 1;
    }

    const units: GeneralProblem[][] = [];
    let start = 0;
    targetSizes.forEach((size) => {
        units.push(problems.slice(start, start + size));
        start += size;
    });
    return units;
};

const g3Term1Units = splitIntoUnitsByCounts(MATH_G3_1, [1, 1, 1, 1, 1]);
const g3Term2Units = splitIntoUnitsByCounts(MATH_G3_2, [1, 1, 1, 1, 1]);
const g3Term3Units = splitIntoUnitsByCounts(MATH_G3_3, [1, 1, 1, 1]);

export const MATH_G3_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G3_U01: [], // 表 と グラフ
    MATH_G3_U02: [], // 大きい 数（1000より大きい数）
    MATH_G3_U03: [], // たし算（3けた・4けた）
    MATH_G3_U04: [], // ひき算（3けた・4けた）
    MATH_G3_U05: [], // 時こく と 時かん
    MATH_G3_U06: [], // 長さ（km と m）
    MATH_G3_U07: [], // かけ算（2けた×1けた など）
    MATH_G3_U08: [], // 円 と きゅう
    MATH_G3_U09: [], // わり算（わり算のいみ）
    MATH_G3_U10: [], // わり算（あまりのある計算）
    MATH_G3_U11: [], // 重さ（g と kg）
    MATH_G3_U12: [], // 小数
    MATH_G3_U13: [], // 分数
    MATH_G3_U14: [], // □をつかった 式
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G3_U01': {
            const a = (n % 9) + 1;
            const b = (n % 6) + 1;
            const c = (n % 7) + 1;
            const p = n % 4;
            if (p === 0) {
                const max = Math.max(a, b, c);
                const winners = ([["ねこ", a], ["いぬ", b], ["うさぎ", c]] as [string, number][]).filter(([, v]) => v === max).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "おなじ";
                const wrongs = ["ねこ", "いぬ", "うさぎ", "おなじ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `ぼうグラフ。 いちばん おおいの どうぶつは？`, answer, options: d(answer, ...wrongs), hint: "いちばん高いぼう。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["ねこ", "いぬ", "うさぎ"] } };
            }
            if (p === 1) {
                return { question: `ねこ と いぬ の 合計は？`, answer: `${a + b}ひき`, options: d(`${a + b}ひき`, `${a + b + 1}ひき`, `${a - b}ひき`, `${a}ひき`), hint: "2つのぼうを たす。", visual: { kind: 'bar_chart', values: [a, b], labels: ["ねこ", "いぬ"] } };
            }
            if (p === 2) {
                return { question: `ねこは いぬより 何ひき多い？`, answer: `${Math.abs(a - b)}ひき`, options: d(`${Math.abs(a - b)}ひき`, `${a + b}ひき`, `${Math.max(a, b)}ひき`, `${Math.min(a, b)}ひき`), hint: "2本の差をみる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["ねこ", "いぬ"] } };
            }
            return { question: `3しゅるい ぜんぶで 何ひき？`, answer: `${a + b + c}ひき`, options: d(`${a + b + c}ひき`, `${a + b}ひき`, `${b + c}ひき`, `${a + c}ひき`), hint: "3本ともたす。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["ねこ", "いぬ", "うさぎ"] } };
        }
        case 'MATH_G3_U02': {
            const value = 1000 + n * 37;
            if (n % 2 === 0) {
                return { question: `${value} は 1000より おおきい？`, answer: "はい", options: d("はい", "いいえ", "おなじ", "わからない"), hint: "1000を こえているか 見よう。" };
            }
            return { question: `1000 と ${value}。 大きいのは？`, answer: `${value}`, options: d(`${value}`, "1000", "同じ", "わからない"), hint: "1000を こえているか 比べよう。" };
        }
        case 'MATH_G3_U03': {
            const a = 200 + (n % 700);
            const b = 100 + (n % 500);
            const s = a + b;
            if (n % 2 === 0) {
                return { question: `${a} + ${b} = ?`, answer: `${s}`, options: d(`${s}`, `${s + 10}`, `${s - 10}`, `${a}`), hint: "3けた・4けたの たし算。" };
            }
            return { question: `${s} に なる 式は どれ？`, answer: `${a} + ${b}`, options: d(`${a} + ${b}`, `${a} + ${b + 10}`, `${a - 10} + ${b}`, `${s} + ${b}`), hint: "和が ${s} に なる式を えらぼう。" };
        }
        case 'MATH_G3_U04': {
            const b = 100 + (n % 500);
            const a = b + 200 + (n % 400);
            const dff = a - b;
            if (n % 2 === 0) {
                return { question: `${a} - ${b} = ?`, answer: `${dff}`, options: d(`${dff}`, `${dff + 10}`, `${dff - 10}`, `${a}`), hint: "3けた・4けたの ひき算。" };
            }
            return { question: `${dff} に なる 式は どれ？`, answer: `${a} - ${b}`, options: d(`${a} - ${b}`, `${a} - ${b - 10}`, `${a + 10} - ${b}`, `${dff} - ${b}`), hint: "差が ${dff} に なる式を えらぼう。" };
        }
        case 'MATH_G3_U05': {
            const h = (n % 10) + 1;
            const m = (n % 6) * 10;
            const ansH = h + Math.floor((m + 20) / 60);
            const ansM = (m + 20) % 60;
            return {
                question: `この とけいの 20分後は？`,
                answer: `${ansH}時${ansM}分`,
                options: d(`${ansH}時${ansM}分`, `${h}時${m}分`, `${h}時${(m + 40) % 60}分`, `${h + 1}時${m}分`),
                hint: "60分で 1時間 くりあがる。",
                visual: { kind: 'clock', hour: h, minute: m }
            };
        }
        case 'MATH_G3_U06': {
            const km = (n % 5) + 1;
            const m = (n % 9) * 100;
            if (n % 2 === 0) {
                return { question: `${km}km${m}m は 何m？`, answer: `${km * 1000 + m}m`, options: d(`${km * 1000 + m}m`, `${km * 100 + m}m`, `${km * 1000}m`, `${m}m`), hint: "1km=1000m。" };
            }
            return { question: `${km * 1000 + m}m は 何km何m？`, answer: `${km}km${m}m`, options: d(`${km}km${m}m`, `${km}km`, `${m}m`, `${km + 1}km${m}m`), hint: "1000m ごとに km に なおす。" };
        }
        case 'MATH_G3_U07': {
            const a = (n % 8) + 12;
            const b = (n % 7) + 2;
            const p = a * b;
            if (n % 2 === 0) {
                return { question: `${a} × ${b} = ?`, answer: `${p}`, options: d(`${p}`, `${p + b}`, `${p - b}`, `${a + b}`), hint: "2けた×1けた の かけ算。" };
            }
            return { question: `${a} × □ = ${p}。 □ は？`, answer: `${b}`, options: d(`${b}`, `${a}`, `${b + 1}`, `${Math.max(1, b - 1)}`), hint: "かけ算を ぎゃくに見よう。" };
        }
        case 'MATH_G3_U08': {
            if (n % 2 === 0) {
                const r = (n % 9) + 1;
                return { question: `この 円の 半径が ${r}cm。 直径は？`, answer: `${r * 2}cm`, options: d(`${r * 2}cm`, `${r}cm`, `${r * 3}cm`, `${Math.max(1, r - 1)}cm`), hint: "直径は 半径の2倍。", visual: { kind: 'circle', showRadius: true } };
            }
            return { question: "きゅうを どこで 切っても、切り口は 何の形？", answer: "円", options: d("円", "正方形", "長方形", "三角形"), hint: "ボールを 思い出して。", visual: { kind: 'circle' } };
        }
        case 'MATH_G3_U09': {
            const divisor = (n % 8) + 2;
            const q = (n % 6) + 3;
            const nmr = divisor * q;
            if (n % 2 === 0) {
                return { question: `${nmr} ÷ ${divisor} = ?`, answer: `${q}`, options: d(`${q}`, `${divisor}`, `${q + 1}`, `${q - 1}`), hint: "かけ算で たしかめよう。" };
            }
            return { question: `□ × ${divisor} = ${nmr}。 □ は？`, answer: `${q}`, options: d(`${q}`, `${divisor}`, `${q + 1}`, `${Math.max(1, q - 1)}`), hint: "わり算を かけ算に なおそう。" };
        }
        case 'MATH_G3_U10': {
            const divisor = (n % 7) + 3;
            const q = (n % 5) + 2;
            const r = (n % (divisor - 1)) + 1;
            const nmr = divisor * q + r;
            return { question: `${nmr} ÷ ${divisor} = ?`, answer: `${q} あまり ${r}`, options: d(`${q} あまり ${r}`, `${q + 1} あまり ${r}`, `${q} あまり ${Math.max(0, r - 1)}`, `${q - 1} あまり ${r}`), hint: "あまりは わる数より 小さい。" };
        }
        case 'MATH_G3_U11': {
            const kg = (n % 4) + 1;
            const g = (n % 9) * 100;
            if (n % 2 === 0) {
                return { question: `${kg}kg${g}g は 何g？`, answer: `${kg * 1000 + g}g`, options: d(`${kg * 1000 + g}g`, `${kg * 100 + g}g`, `${kg * 1000}g`, `${g}g`), hint: "1kg=1000g。" };
            }
            return { question: `${kg * 1000 + g}g は 何kg何g？`, answer: `${kg}kg${g}g`, options: d(`${kg}kg${g}g`, `${kg}kg`, `${g}g`, `${kg + 1}kg${g}g`), hint: "1000g ごとに kg に なおす。" };
        }
        case 'MATH_G3_U12': {
            const a = (n % 9) + 1;
            const b = (n % 9) + 1;
            const sum = (a + b) / 10;
            if (n % 2 === 0) {
                return { question: `0.${a} + 0.${b} = ?`, answer: `${sum}`, options: d(`${sum}`, `0.${a}`, `0.${b}`, `${a + b}`), hint: "小数第1位どうしを たそう。" };
            }
            return { question: `0.1 が ${a}こ と 0.1 が ${b}こ。 あわせて いくつ？`, answer: `${sum}`, options: d(`${sum}`, `${a + b}`, `0.${a}`, `1.${Math.max(0, a + b - 10)}`), hint: "0.1 を 何こ 集めたかで 考える。" };
        }
        case 'MATH_G3_U13': {
            const den = (n % 6) + 3;
            const num1 = (n % (den - 1)) + 1;
            const num2 = Math.min(den - 1, num1 + 1);
            const p = n % 4;
            if (p === 0) {
                return {
                    question: `${num1}/${den} と ${num2}/${den}。 大きいのは？`,
                    answer: `${num2}/${den}`,
                    options: d(`${num2}/${den}`, `${num1}/${den}`, "おなじ", "くらべられない"),
                    hint: "分母が 同じなら 分子で くらべる。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '>' }
                };
            }
            if (p === 1) {
                return {
                    question: `${num1}/${den} と ${num2}/${den}。 小さいのは？`,
                    answer: `${num1}/${den}`,
                    options: d(`${num1}/${den}`, `${num2}/${den}`, "おなじ", "くらべられない"),
                    hint: "分母が 同じなら 分子が 小さいほうが 小さい。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '<' }
                };
            }
            if (p === 2) {
                return {
                    question: `${num1}/${den} と ${num1}/${den}。 同じものは？`,
                    answer: "おなじ",
                    options: d("おなじ", `${num1}/${den}`, `${num2}/${den}`, "ちがう"),
                    hint: "まったく 同じ分数なら おなじ。",
                    visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num1, d: den }, op: '>' }
                };
            }
            return {
                question: `${num1}/${den} と ${num2}/${den}。 分子が 大きいのは？`,
                answer: `${num2}/${den}`,
                options: d(`${num2}/${den}`, `${num1}/${den}`, "おなじ", "わからない"),
                hint: "分母が 同じなら 分子に 注目。",
                visual: { kind: 'fraction_operation', left: { n: num1, d: den }, right: { n: num2, d: den }, op: '>' }
            };
        }
        case 'MATH_G3_U14': {
            const x = (n % 8) + 2;
            const y = x + (n % 5) + 1;
            if (n % 2 === 0) {
                return { question: `□ + ${x} = ${x + y}。 □ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "逆の計算を しよう。" };
            }
            return { question: `${x} + □ = ${x + y}。 □ は？`, answer: `${y}`, options: d(`${y}`, `${x}`, `${x + y}`, `${y + 1}`), hint: "たされる数が どこにあるかを 見よう。" };
        }
        default:
            return { question: "3 + 4 = ?", answer: "7", options: d("7", "6", "8", "5"), hint: "たし算。" };
    }
};

Object.keys(MATH_G3_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G3_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

export const MATH_G3_DATA: Record<string, GeneralProblem[]> = {
    MATH_G3_1,
    MATH_G3_2,
    MATH_G3_3,
    ...MATH_G3_UNIT_DATA,
};

