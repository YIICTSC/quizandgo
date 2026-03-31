
import { GeneralProblem, d } from './utils';

const MATH_G1_1: GeneralProblem[] = [
        { question: "1、2、3、の つぎの かずは なに？", answer: "4", options: d("4", "0", "5", "6"), hint: "ひとつ ずつ ふえていくよ。" },
        { question: "5 と 3、 どっちが おおきい？", answer: "5", options: d("5", "3", "おなじ", "わからない"), hint: "ゆびを つかって かぞえてみよう。" },
        { question: "10 は 7 と なに？", answer: "3", options: d("3", "2", "4", "5"), hint: "10に なる 組み合わせだよ。" },
        { question: "「3 ＋ 2 ＝ 」 こたえは なに？", answer: "5", options: d("5", "4", "6", "1"), hint: "あわせると いくつかな？" },
        { question: "「5 － 1 ＝ 」 こたえは なに？", answer: "4", options: d("4", "5", "6", "3"), hint: "ひとつ ヘルと いくつかな？" },
        { question: "しかくい かたちは どれ？", answer: "ノート", options: d("ノート", "ボール", "えんぴつ", "ドーナツ"), hint: "かどが 4つ あるよ。" },
        { question: "「7 ＋ 3 ＝ 」 こたえは なに？", answer: "10", options: d("10", "9", "8", "7"), hint: "ちょうど 10に なるよ。" },
        { question: "リンゴが 4こ あります。2こ たべると のこりは？", answer: "2こ", options: d("2こ", "6こ", "4こ", "0こ"), hint: "4から 2を ひこう。" },
        { question: "「8 － 3 ＝ 」 こたえは なに？", answer: "5", options: d("5", "4", "6", "3"), hint: "ひきざん だよ。" },
        { question: "0 は なにを あらわす？", answer: "なにも ない", options: d("なにも ない", "1つ ある", "たくさん ある", "まるい もの"), hint: "空っぽ（からっぽ）の ことだよ。" },
        { question: "2 と 2 を あわせると？", answer: "4", options: d("4", "2", "0", "22"), hint: "たしざん だよ。" },
        { question: "9 は 4 と なに？", answer: "5", options: d("5", "6", "3", "4"), hint: "あわせて 9に なる かず。" },
        { question: "「10 － 5 ＝ 」 こたえは？", answer: "5", options: d("5", "0", "10", "6"), hint: "はんぶんこだね。" },
        { question: "5に 1を たすと？", answer: "6", options: d("6", "4", "51", "7"), hint: "ひとつ ふえるよ。" },
        { question: "1、2、3、4、5。 3ばんめの かずは？", answer: "3", options: d("3", "2", "4", "5"), hint: "じゅんばんを かぞえよう。" },
        { question: "まるい かたちは どれ？", answer: "ボール", options: d("ボール", "ノート", "つくえ", "はさみ"), hint: "ころころ ころがるよ。" },
        { question: "5 は 2 と なに？", answer: "3", options: d("3", "2", "1", "4"), hint: "5に なる 組み合わせだよ。" },
        { question: "4 は 1 と なに？", answer: "3", options: d("3", "1", "2", "4"), hint: "4を 分けてみよう。" },
        { question: "「2 ＋ 1 ＝ 」 こたえは？", answer: "3", options: d("3", "2", "1", "4"), hint: "かんたんな たしざん。" },
        { question: "「4 － 2 ＝ 」 こたえは？", answer: "2", options: d("2", "4", "1", "3"), hint: "はんぶんこ だね。" },
        { question: "「0 ＋ 5 ＝ 」 こたえは？", answer: "5", options: d("5", "0", "6", "50"), hint: "0は なにも ないよ。" },
        { question: "「3 － 0 ＝ 」 こたえは？", answer: "3", options: d("3", "0", "2", "30"), hint: "ひいても かわらないよ。" },
        { question: "6 は 3 と なに？", answer: "3", options: d("3", "2", "4", "1"), hint: "おなじ かず だね。" },
        { question: "8 は 4 と なに？", answer: "4", options: d("4", "2", "6", "8"), hint: "4 と 4 を あわせると？" },
        { question: "7 は 2 と なに？", answer: "5", options: d("5", "4", "6", "3"), hint: "ゆびを 使ってみよう。" },
        { question: "「10 － 9 ＝ 」 こたえは？", answer: "1", options: d("1", "0", "9", "2"), hint: "あと 1つで 10になるよ。" },
        { question: "5つの リンゴを 5人で 1つずつ 食べると のこりは？", answer: "0こ", options: d("0こ", "5こ", "1こ", "10こ"), hint: "ぜんぶ なくなったよ。" },
        { question: "3に 2を たすと？", answer: "5", options: d("5", "1", "6", "4"), hint: "あわせるよ。" },
        { question: "9から 1を ひくと？", answer: "8", options: d("8", "10", "7", "9"), hint: "1つ へるよ。" },
        { question: "「1 ＋ 4 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "3", "6"), hint: "5に なるよ。" },
        { question: "「6 － 2 ＝ 」 こたえは？", answer: "4", options: d("4", "6", "8", "2"), hint: "ひきざん だよ。" },
        { question: "10は 1と なに？", answer: "9", options: d("9", "1", "8", "10"), hint: "とっても 大きい かずだね。" },
        { question: "2に なにを たすと 5に なる？", answer: "3", options: d("3", "2", "1", "5"), hint: "のこりは いくつかな。" },
        { question: "4から なにを ひくと 1に なる？", answer: "3", options: d("3", "2", "1", "4"), hint: "ひく かずを かんがえよう。" },
        { question: "「2 ＋ 2 ＝ 」 こたえは？", answer: "4", options: d("4", "2", "0", "22"), hint: "おなじ かずを たすよ。" },
        { question: "「5 － 5 ＝ 」 こたえは？", answer: "0", options: d("0", "5", "10", "1"), hint: "ぜんぶ ひいちゃった。" },
        { question: "「3 ＋ 4 ＝ 」 こたえは？", answer: "7", options: d("7", "6", "8", "1"), hint: "たしざん。" },
        { question: "「10 － 2 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "2"), hint: "10から 2つ とるよ。" },
        { question: "「1 ＋ 1 ＝ 」 こたえは？", answer: "2", options: d("2", "1", "0", "11"), hint: "いちばん かんたんな たしざん。" },
        { question: "「6 － 6 ＝ 」 こたえは？", answer: "0", options: d("0", "6", "1", "12"), hint: "からっぽ。" },
        { question: "10は 5と なに？", answer: "5", options: d("5", "10", "0", "4"), hint: "はんぶんこ。" },
        { question: "3つ かずを かぞえます。 1、2、？", answer: "3", options: d("3", "0", "4", "5"), hint: "じゅんばん。" },
        { question: "「2 ＋ 3 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "6", "1"), hint: "あわせよう。" },
        { question: "「8 － 1 ＝ 」 こたえは？", answer: "7", options: d("7", "8", "9", "6"), hint: "1つ まえの かず。" },
        { question: "4は 2と なに？", answer: "2", options: d("2", "1", "3", "4"), hint: "2 と 2 で？" },
        { question: "5は 0と なに？", answer: "5", options: d("5", "0", "4", "1"), hint: "かわらないよ。" },
        { question: "10は 8と なに？", answer: "2", options: d("2", "1", "3", "8"), hint: "あと すこし。" },
        { question: "「9 ＋ 1 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "11", "0"), hint: "キリが いいね。" },
        { question: "「10 － 10 ＝ 」 こたえは？", answer: "0", options: d("0", "10", "1", "20"), hint: "なにも なくなる。" },
    ];

const MATH_G1_2: GeneralProblem[] = [
        { question: "10 よりも 1 おおきい かずは？", answer: "11", options: d("11", "9", "10", "12"), hint: "10の つぎの かず。" },
        { question: "「10 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "5", "20"), hint: "10と 5で いくつ？" },
        { question: "とけいの ながい はりが 12、みじかい はりが 3 のとき、なんじ？", answer: "3じ", options: d("3じ", "12じ", "6じ", "9じ"), hint: "みじかい はりを みてね。" },
        { question: "「8 ＋ 4 ＝ 」 こたえは？", answer: "12", options: d("12", "10", "11", "13"), hint: "10を つくって 考えよう。" },
        { question: "「13 － 3 ＝ 」 こたえは？", answer: "10", options: d("10", "13", "3", "16"), hint: "3を ひくと？" },
        { question: "10が 2つで いくつ？", answer: "20", options: d("20", "10", "2", "12"), hint: "じゅう、にじゅう…。" },
        { question: "「9 ＋ 6 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "13"), hint: "くりあがり が あるよ。" },
        { question: "「15 － 7 ＝ 」 こたえは？", answer: "8", options: d("8", "9", "7", "6"), hint: "くりさがり が あるよ。" },
        { question: "とけいの ながい はりが 6 のとき、なんという？", answer: "～じはん", options: d("～じはん", "～じ", "30ぷん", "6じ"), hint: "1年生は「半（はん）」という読み方をならうよ。" },
        { question: "「10 ＋ 10 ＝ 」 こたえは？", answer: "20", options: d("20", "10", "0", "100"), hint: "10が 2つ。" },
        { question: "「12 － 4 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "4"), hint: "10から 4を ひいて 2を たそう。" },
        { question: "「7 ＋ 7 ＝ 」 こたえは？", answer: "14", options: d("14", "7", "0", "10"), hint: "おなじ かずを たすよ。" },
        { question: "14 は 10 と なに？", answer: "4", options: d("4", "14", "10", "1"), hint: "くらい を 考えよう。" },
        { question: "とけいの みじかい はりが 10 と 11 の あいだ、ながい はりが 6。なんじ？", answer: "10じ はん", options: d("10じ はん", "11じ はん", "10じ", "11じ"), hint: "10じを すぎた ところ。" },
        { question: "「20 － 1 ＝ 」 こたえは？", answer: "19", options: d("19", "10", "21", "20"), hint: "ひとつ ヘルよ。" },
        { question: "3つ かずを あわせます。「1 ＋ 2 ＋ 3 ＝ 」", answer: "6", options: d("6", "5", "7", "123"), hint: "じゅんに たしていこう。" },
        { question: "「10 － 2 － 3 ＝ 」 こたえは？", answer: "5", options: d("5", "8", "7", "0"), hint: "どんどん ひいていこう。" },
        { question: "10と 2で いくつ？", answer: "12", options: d("12", "10", "2", "20"), hint: "10の つぎは 11、そのつぎ。" },
        { question: "10と 8で いくつ？", answer: "18", options: d("18", "10", "8", "28"), hint: "10と 8を あわせるよ。" },
        { question: "「10 ＋ 1 ＝ 」 こたえは？", answer: "11", options: d("11", "10", "1", "21"), hint: "11。" },
        { question: "「11 － 1 ＝ 」 こたえは？", answer: "10", options: d("10", "1", "11", "12"), hint: "1つ ひくよ。" },
        { question: "15は 10と なに？", answer: "5", options: d("5", "10", "15", "1"), hint: "5。" },
        { question: "「9 ＋ 2 ＝ 」 こたえは？", answer: "11", options: d("11", "10", "9", "12"), hint: "くりあがり。" },
        { question: "「8 ＋ 5 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "11"), hint: "10をつくろう。" },
        { question: "「7 ＋ 6 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "10"), hint: "くりあがり。" },
        { question: "「11 － 2 ＝ 」 こたえは？", answer: "9", options: d("9", "10", "8", "7"), hint: "くりさがり。" },
        { question: "「14 － 5 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "10", "5"), hint: "くりさがり。" },
        { question: "「16 － 8 ＝ 」 こたえは？", answer: "8", options: d("8", "7", "9", "10"), hint: "はんぶんこ。" },
        { question: "10が 1つと 1が 7つ。 いくつ？", answer: "17", options: d("17", "10", "7", "71"), hint: "17。" },
        { question: "「10 ＋ 3 ＝ 」 こたえは？", answer: "13", options: d("13", "10", "3", "30"), hint: "13。" },
        { question: "「19 － 9 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "19", "0"), hint: "9を とるよ。" },
        { question: "とけい。 みじかい はりが 6、 ながい はりが 12。 なんじ？", answer: "6じ", options: d("6じ", "12じ", "12じはん", "6じはん"), hint: "6。" },
        { question: "とけい。 みじかい はりが 1、 ながい はりが 6。 なんじ？", answer: "1じはん", options: d("1じはん", "1じ", "6じ", "2じ"), hint: "1じ 30ぷん。" },
        { question: "「2 ＋ 8 ＝ 」 こたえは？", answer: "10", options: d("10", "9", "8", "11"), hint: "10に なるよ。" },
        { question: "「5 ＋ 7 ＝ 」 こたえは？", answer: "12", options: d("12", "11", "13", "10"), hint: "くりあがり。" },
        { question: "「12 － 9 ＝ 」 こたえは？", answer: "3", options: d("3", "2", "4", "1"), hint: "くりさがり。" },
        { question: "「15 － 6 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "7", "6"), hint: "くりさがり。" },
        { question: "20は 10が いくつ？", answer: "2つ", options: d("2つ", "10つ", "1つ", "20つ"), hint: "じゅう、にじゅう。" },
        { question: "10が 1つと 1が 0。 いくつ？", answer: "10", options: d("10", "1", "0", "100"), hint: "10。" },
        { question: "「8 ＋ 8 ＝ 」 こたえは？", answer: "16", options: d("16", "14", "18", "10"), hint: "くりあがり。" },
        { question: "「17 － 7 ＝ 」 こたえは？", answer: "10", options: d("10", "7", "17", "0"), hint: "7を とるよ。" },
        { question: "「9 ＋ 9 ＝ 」 こたえは？", answer: "18", options: d("18", "17", "19", "10"), hint: "くりあがり。" },
        { question: "「11 － 5 ＝ 」 こたえは？", answer: "6", options: d("6", "5", "7", "4"), hint: "くりさがり。" },
        { question: "「14 － 8 ＝ 」 こたえは？", answer: "6", options: d("6", "7", "5", "8"), hint: "くりさがり。" },
        { question: "「13 － 4 ＝ 」 こたえは？", answer: "9", options: d("9", "8", "10", "7"), hint: "くりさがり。" },
        { question: "10と 10を あわせると？", answer: "20", options: d("20", "10", "100", "0"), hint: "にじゅう。" },
        { question: "「10 ＋ 4 ＋ 1 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "10"), hint: "じゅんに たそう。" },
        { question: "「18 － 8 － 2 ＝ 」 こたえは？", answer: "8", options: d("8", "10", "18", "6"), hint: "じゅんに ひこう。" },
        { question: "「6 ＋ 4 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "14", "16"), hint: "10をつくろう。" },
    ];

const MATH_G1_3: GeneralProblem[] = [
        { question: "10が 10こで いくつ？", answer: "100", options: d("100", "10", "1000", "20"), hint: "とっても おおきな かず。" },
        { question: "「30 ＋ 20 ＝ 」 こたえは？", answer: "50", options: d("50", "32", "10", "100"), hint: "10の かたまりで 考えよう。" },
        { question: "「80 － 30 ＝ 」 こたえは？", answer: "50", options: d("50", "83", "30", "110"), hint: "8から 3を ひくるのと にてるよ。" },
        { question: "「100 － 1 ＝ 」 こたえは？", answer: "99", options: d("99", "100", "90", "0"), hint: "100の ひとつ まえ。" },
        { question: "50円と 10円 3こ。 あわせて いくら？", answer: "80円", options: d("80円", "60円", "40円", "53円"), hint: "50 ＋ 30 は？" },
        { question: "「12 ＋ 2 ＝ 」 こたえは？", answer: "14", options: d("14", "10", "12", "16"), hint: "2つ ふえるよ。" },
        { question: "「18 － 5 ＝ 」 こたえは？", answer: "13", options: d("13", "18", "5", "8"), hint: "8から 5を ひこう。" },
        { question: "ずけい。 さんかくの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "「さん」かく、だよ。" },
        { question: "しかくの かどは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "0つ"), hint: "「しかく」だね。" },
        { question: "「50 ＋ 50 ＝ 」 こたえは？", answer: "100", options: d("100", "50", "0", "10"), hint: "5と 5を あわせると？" },
        { question: "40 は 10が なにこ？", answer: "4こ", options: d("4こ", "40こ", "1こ", "10こ"), hint: "じゅう、にじゅう、さんじゅう…。" },
        { question: "「25 ＋ 4 ＝ 」 こたえは？", answer: "29", options: d("29", "21", "20", "30"), hint: "5 ＋ 4 は？" },
        { question: "「37 － 7 ＝ 」 こたえは？", answer: "30", options: d("30", "37", "7", "44"), hint: "7を ひくと きりがいいね。" },
        { question: "とけいの ながい はりと みじかい はりが 12 の ところで かさなると なんじ？", answer: "12じ", options: d("12じ", "6じ", "0じ", "12じはん"), hint: "お昼のチャイムが鳴る時間だね。" },
        { question: "「6 ＋ 8 ＝ 」 こたえは？", answer: "14", options: d("14", "12", "16", "2"), hint: "くりあがり の れんしゅう。" },
        { question: "「15 － 9 ＝ 」 こたえは？", answer: "6", options: d("6", "5", "4", "7"), hint: "くりさがりの れんしゅう。" },
        { question: "100より 10 ちいさい かずは？", answer: "90", options: d("90", "100", "80", "10"), hint: "じゅう、にじゅう…きゅうじゅう。" },
        { question: "「10 ＋ 70 ＝ 」 こたえは？", answer: "80", options: d("80", "17", "70", "90"), hint: "10と 70。" },
        { question: "「90 － 40 ＝ 」 こたえは？", answer: "50", options: d("50", "94", "40", "130"), hint: "9-4 は 5。" },
        { question: "100は 10が いくつ？", answer: "10こ", options: d("10こ", "1こ", "100こ", "0こ"), hint: "たくさんだね。" },
        { question: "「20 ＋ 80 ＝ 」 こたえは？", answer: "100", options: d("100", "28", "80", "10"), hint: "100になるよ。" },
        { question: "「60 － 60 ＝ 」 こたえは？", answer: "0", options: d("0", "60", "120", "1"), hint: "なにも なくなる。" },
        { question: "10円玉が 10こ。 いくら？", answer: "100円", options: d("100円", "10円", "1000円", "50円"), hint: "100。" },
        { question: "「14 ＋ 5 ＝ 」 こたえは？", answer: "19", options: d("19", "14", "5", "20"), hint: "19。" },
        { question: "「17 － 4 ＝ 」 こたえは？", answer: "13", options: d("13", "17", "4", "11"), hint: "13。" },
        { question: "さんかくの 辺（へん）は いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "「さん」かく。" },
        { question: "しかくの 辺（へん）は いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "1つ"), hint: "「しかく」。" },
        { question: "「40 ＋ 40 ＝ 」 こたえは？", answer: "80", options: d("80", "44", "40", "100"), hint: "80。" },
        { question: "「100 － 50 ＝ 」 こたえは？", answer: "50", options: d("50", "100", "0", "150"), hint: "半分こだね。" },
        { question: "70は 10が いくつ？", answer: "7こ", options: d("7こ", "70こ", "1こ", "10こ"), hint: "ななこ。" },
        { question: "「22 ＋ 3 ＝ 」 こたえは？", answer: "25", options: d("25", "22", "23", "30"), hint: "25。" },
        { question: "「28 － 6 ＝ 」 こたえは？", answer: "22", options: d("22", "28", "6", "20"), hint: "22。" },
        { question: "100円で 80円の 消しゴムを 買いました。 おつりは？", answer: "20円", options: d("20円", "80円", "100円", "0円"), hint: "100 - 80。" },
        { question: "10円が 5こと 50円が 1こ。 あわせて いくら？", answer: "100円", options: d("100円", "50円", "60円", "51円"), hint: "50 + 50。" },
        { question: "「4 ＋ 9 ＝ 」 こたえは？", answer: "13", options: d("13", "12", "14", "15"), hint: "くりあがり。" },
        { question: "「12 － 7 ＝ 」 こたえは？", answer: "5", options: d("5", "4", "6", "3"), hint: "くりさがり。" },
        { question: "「8 ＋ 7 ＝ 」 こたえは？", answer: "15", options: d("15", "14", "16", "13"), hint: "くりあがり。" },
        { question: "「11 － 3 ＝ 」 こたえは？", answer: "8", options: d("8", "9", "7", "10"), hint: "くりさがり。" },
        { question: "「20 ＋ 30 ＋ 40 ＝ 」 こたえは？", answer: "90", options: d("90", "50", "70", "100"), hint: "じゅんに たそう。" },
        { question: "「100 － 20 － 30 ＝ 」 こたえは？", answer: "50", options: d("50", "80", "70", "0"), hint: "じゅんに ひこう。" },
        { question: "90は 10が いくつ？", answer: "9こ", options: d("9こ", "10こ", "1こ", "90こ"), hint: "きゅうこ。" },
        { question: "「5 ＋ 5 ＋ 5 ＝ 」 こたえは？", answer: "15", options: d("15", "10", "20", "555"), hint: "15。" },
        { question: "「10 ＋ 10 ＋ 10 ＝ 」 こたえは？", answer: "30", options: d("30", "10", "20", "100"), hint: "さんじゅう。" },
        { question: "「100 － 10 ＝ 」 こたえは？", answer: "90", options: d("90", "100", "80", "10"), hint: "90。" },
        { question: "「10 ＋ 90 ＝ 」 こたえは？", answer: "100", options: d("100", "90", "110", "10"), hint: "100。" },
        { question: "「55 － 5 ＝ 」 こたえは？", answer: "50", options: d("50", "55", "5", "60"), hint: "50。" },
        { question: "「42 ＋ 7 ＝ 」 こたえは？", answer: "49", options: d("49", "42", "40", "50"), hint: "49。" },
        { question: "「100 － 0 ＝ 」 こたえは？", answer: "100", options: d("100", "0", "99", "10"), hint: "かわらないよ。" },
        { question: "「1 ＋ 99 ＝ 」 こたえは？", answer: "100", options: d("100", "99", "1", "0"), hint: "100。" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g1Term1Units = splitIntoUnits(MATH_G1_1, 6);
const g1Term2Units = splitIntoUnits(MATH_G1_2, 6);
const g1Term3Units = splitIntoUnits(MATH_G1_3, 6);

export const MATH_G1_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G1_U01: [], // かずとすうじ（10までのかず）
    MATH_G1_U02: [], // いくつといくつ
    MATH_G1_U03: [], // かたちあそび
    MATH_G1_U04: [], // なんばんめ
    MATH_G1_U05: [], // あわせていくつ（たしざん）
    MATH_G1_U06: [], // ふえるといくつ（たしざん）
    MATH_G1_U07: [], // のこりはいくつ（ひきざん）
    MATH_G1_U08: [], // ちがいはいくつ（ひきざん）
    MATH_G1_U09: [], // 20までのかず
    MATH_G1_U10: [], // なんじ（とけい）
    MATH_G1_U11: [], // ながさくらべ
    MATH_G1_U12: [], // かさくらべ
    MATH_G1_U13: [], // えぐらふ
    MATH_G1_U14: [], // ひょう
    MATH_G1_U15: [], // さんかくとしかく
    MATH_G1_U16: [], // かたちづくり
    MATH_G1_U17: [], // 3つのかずのけいさん
    MATH_G1_U18: [], // ぶんしょうだい
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G1_U01': {
            const a = (n % 9) + 1;
            return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a}`, `${a + 2}`, `${a - 1}`), hint: "1つ おおきい かずだよ。", visual: { kind: 'dots', counts: [a], labels: ["かず"] } };
        }
        case 'MATH_G1_U02': {
            const a = (n % 9) + 1;
            const b = 10 - a;
            return { question: `10は ${a} と なに？`, answer: `${b}`, options: d(`${b}`, `${b + 1}`, `${a}`, `${Math.max(0, b - 1)}`), hint: "10に なる くみあわせを かんがえよう。", visual: { kind: 'dots', counts: [a, b], labels: ["その1", "その2"] } };
        }
        case 'MATH_G1_U03': {
            const p = n % 3;
            if (p === 0) return { question: "まるい かたちは どれ？", answer: "ボール", options: d("ボール", "ノート", "つくえ", "ほん"), hint: "ころころ ころがるよ。" };
            if (p === 1) return { question: "しかくい かたちは どれ？", answer: "ノート", options: d("ノート", "ボール", "みかん", "ビー玉"), hint: "かどが 4つ あるよ。" };
            return { question: "さんかくに にている ものは？", answer: "さんかく じょうぎ", options: d("さんかく じょうぎ", "ボール", "ノート", "コップ"), hint: "3つの かどが あるよ。" };
        }
        case 'MATH_G1_U04': {
            const pos = (n % 5) + 1;
            return { question: `1、2、3、4、5。 ${pos}ばんめの かずは？`, answer: `${pos}`, options: d(`${pos}`, `${Math.max(1, pos - 1)}`, `${Math.min(5, pos + 1)}`, "5"), hint: "じゅんばんに よんでみよう。", visual: { kind: 'number_sequence', values: [1, 2, 3, 4, 5] } };
        }
        case 'MATH_G1_U05': {
            const a = (n % 6) + 1;
            const b = (n % (10 - a)) + 1;
            const sum = a + b;
            if (n % 2 === 0) return { question: `${a} + ${b} = ?`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${a}`), hint: "あわせて いくつか かぞえよう。" };
            return { question: `${a} と ${b} を あわせると？`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${b}`), hint: "たしざんの もんだい。" };
        }
        case 'MATH_G1_U06': {
            const a = (n % 7) + 2;
            const b = (n % 3) + 1;
            if (n % 2 === 0) return { question: `${a}こ ありました。 ${b}こ ふえると なんこ？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a}こ`, `${b}こ`, `${a + b + 1}こ`), hint: "ふえると たしざんだよ。" };
            return { question: `${a}こ に ${b}こ たすと？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "ふえる は たす。" };
        }
        case 'MATH_G1_U07': {
            const a = (n % 7) + 4;
            const b = (n % 3) + 1;
            if (n % 2 === 0) return { question: `${a}こ あります。 ${b}こ つかうと のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${b}こ`, `${a}こ`), hint: "のこりは ひきざん。" };
            return { question: `${a}こ から ${b}こ へると？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a}こ`, `${b}こ`, `${a + b}こ`), hint: "へる は ひく。" };
        }
        case 'MATH_G1_U08': {
            const small = (n % 6) + 1;
            const diff = (n % 3) + 1;
            const big = small + diff;
            if (n % 2 === 0) return { question: `${big}こと ${small}こ。 ちがいは なんこ？`, answer: `${diff}こ`, options: d(`${diff}こ`, `${big}こ`, `${small}こ`, `${diff + 1}こ`), hint: "おおい ほう から すくない ほうを ひくよ。" };
            return { question: `${small}こ より ${big}こ は なんこ おおい？`, answer: `${diff}こ`, options: d(`${diff}こ`, `${big}こ`, `${small}こ`, `${diff + 1}こ`), hint: "ちがいを しらべる。" };
        }
        case 'MATH_G1_U09': {
            const a = (n % 10) + 10;
            return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a - 1}`, `${a}`, `${a + 2}`), hint: "20までの かずを よんでみよう。", visual: { kind: 'number_sequence', values: [Math.max(1, a - 1), a, a + 1, a + 2] } };
        }
        case 'MATH_G1_U10': {
            const hour = (n % 12) + 1;
            if (n % 2 === 0) {
                return {
                    question: `この とけいは なんじ？`,
                    answer: `${hour}じ`,
                    options: d(`${hour}じ`, `${(hour % 12) + 1}じ`, `${hour}じはん`, "12じ"),
                    hint: "ながい はりが12は ちょうど。",
                    visual: { kind: 'clock', hour, minute: 0 }
                };
            }
            return {
                question: `この とけいは なんじ？`,
                answer: `${hour}じはん`,
                options: d(`${hour}じはん`, `${hour}じ`, `${(hour % 12) + 1}じ`, "12じ"),
                hint: "ながい はりが6は はん。",
                visual: { kind: 'clock', hour, minute: 30 }
            };
        }
        case 'MATH_G1_U11': {
            const a = (n % 8) + 2;
            const b = (n % 5) + 1;
            const answer = a === b ? "おなじ" : `${Math.max(a, b)}cm`;
            return { question: `${a}cm と ${b}cm。 ながいのは どっち？`, answer, options: d(answer, a === b ? `${a + 1}cm` : `${Math.min(a, b)}cm`, a === b ? `${Math.max(1, a - 1)}cm` : "おなじ", "わからない"), hint: "おおきい かずが ながいよ。", visual: { kind: 'bar_chart', values: [a, b], labels: ["A", "B"] } };
        }
        case 'MATH_G1_U12': {
            const a = (n % 5) + 1;
            const b = (n % 4) + 1;
            return { question: `コップAは ${a}はい、コップBは ${a + b}はい。 たくさん はいるのは？`, answer: "コップB", options: d("コップB", "コップA", "おなじ", "どちらでもない"), hint: "かずが おおきい ほうが たくさん。", visual: { kind: 'bar_chart', values: [a, a + b], labels: ["A", "B"] } };
        }
        case 'MATH_G1_U13': {
            const r = (n % 5) + 1;
            const b = (n % 4) + 1;
            const answer = r === b ? "おなじ" : (r > b ? "あか" : "あお");
            const wrongs = ["あか", "あお", "おなじ", "わからない"].filter((label) => label !== answer).slice(0, 3);
            return { question: `えグラフ。 あか ${r}こ、あお ${b}こ。 おおいのは？`, answer, options: d(answer, ...wrongs), hint: "かずを くらべよう。", visual: { kind: 'bar_chart', values: [r, b], labels: ["あか", "あお"] } };
        }
        case 'MATH_G1_U14': {
            const cat = (n % 4) + 1;
            return { question: `ひょう。 ねこ:${cat} いぬ:${cat + 1} うさぎ:${cat - 1}。 いちばん おおいのは？`, answer: "いぬ", options: d("いぬ", "ねこ", "うさぎ", "おなじ"), hint: "ひょうの かずを くらべるよ。", visual: { kind: 'bar_chart', values: [cat, cat + 1, cat - 1], labels: ["ねこ", "いぬ", "うさぎ"] } };
        }
        case 'MATH_G1_U15': {
            if (n % 2 === 0) {
                return { question: "この ずけいの かどは いくつ？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "さんかくは 3つだよ。", visual: { kind: 'polygon', sides: 3 } };
            }
            return { question: "この ずけいの へんは いくつ？", answer: "4つ", options: d("4つ", "3つ", "5つ", "2つ"), hint: "しかくは 4つだよ。", visual: { kind: 'polygon', sides: 4 } };
        }
        case 'MATH_G1_U16': {
            const sticks = (n % 3) + 3;
            const ans = sticks === 3 ? "さんかく" : (sticks === 4 ? "しかく" : "ごかくけい");
            return { question: "この ずけいの なまえは？", answer: ans, options: d(ans, "まる", "わからない", "かたちに ならない"), hint: "へんの かずと おなじだよ。", visual: { kind: 'polygon', sides: sticks } };
        }
        case 'MATH_G1_U17': {
            const a = (n % 4) + 1;
            const b = (n % 3) + 1;
            const c = (n % 2) + 1;
            const sum = a + b + c;
            if (n % 2 === 0) return { question: `${a} + ${b} + ${c} = ?`, answer: `${sum}`, options: d(`${sum}`, `${sum + 1}`, `${sum - 1}`, `${a + b}`), hint: "2つずつ たしていこう。" };
            return { question: `${a}こと ${b}こと ${c}こ。 あわせて いくつ？`, answer: `${sum}`, options: d(`${sum}`, `${a + b}`, `${b + c}`, `${sum + 1}`), hint: "じゅんに たそう。" };
        }
        case 'MATH_G1_U18': {
            const a = (n % 6) + 4;
            const b = (n % 3) + 1;
            if (n % 3 === 0) {
                return { question: `りんごが ${a}こ。 ${b}こ もらいました。 ぜんぶで？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "もらうは たしざん。" };
            }
            if (n % 3 === 1) return { question: `あめが ${a}こ。 ${b}こ たべました。 のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${a}こ`, `${b}こ`), hint: "たべると へるから ひきざん。" };
            return { question: `えんぴつが ${a}ほん。 ${b}ほん ふえると なんぼん？`, answer: `${a + b}ほん`, options: d(`${a + b}ほん`, `${a - b}ほん`, `${a}ほん`, `${b}ほん`), hint: "ぶんしょうを しきにしよう。" };
        }
        default:
            return { question: "1 + 1 = ?", answer: "2", options: d("2", "1", "3", "0"), hint: "たしざんだよ。" };
    }
};

Object.keys(MATH_G1_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G1_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

export const MATH_G1_DATA: Record<string, GeneralProblem[]> = {
    MATH_G1_1,
    MATH_G1_2,
    MATH_G1_3,
    ...MATH_G1_UNIT_DATA,
};


