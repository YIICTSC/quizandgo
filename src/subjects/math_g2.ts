
import { GeneralProblem, d } from './utils';

const MATH_G2_1: GeneralProblem[] = [
        { question: "「25 ＋ 38」のひっ算。一のくらいの 計算は？", answer: "5 ＋ 8 ＝ 13", options: d("5 ＋ 8 ＝ 13", "2 ＋ 3 ＝ 5", "5 － 8", "1 ＋ 2 ＋ 3"), hint: "まずは 右のはし（一のくらい）から 計算するよ。" },
        { question: "長さの たんい。10mm（ミリメートル）は 何cm？", answer: "1cm", options: d("1cm", "10cm", "100cm", "0.1cm"), hint: "ものさしの 小さい 1めもりが 1mmだよ。" },
        { question: "1メートル(m)は 何センチメートル(cm)？", answer: "100cm", options: d("100cm", "10cm", "1000cm", "1cm"), hint: "大きな ものさし 1本分くらいだね。" },
        { question: "「82 － 45」のひっ算。十のくらいから 1かりると 一のくらいは いくつになる？", answer: "12", options: d("12", "10", "2", "8"), hint: "10 ＋ 2 だね。ひき算の ときに つかうよ。" },
        { question: "三角形には、かど（角）が いくつある？", answer: "3つ", options: d("3つ", "4つ", "2つ", "0つ"), hint: "まわりの 線の 数と おなじだよ。" },
        { question: "四角形には、辺（へん）が いくつある？", answer: "4本", options: d("4本", "3本", "5本", "1本"), hint: "まわりを かこんでいる まっすぐな 線の 数だよ。" },
        { question: "「5 ＋ 5 ＋ 5 ＋ 5」を かけ算の 式にすると？", answer: "5 × 4", options: d("5 × 4", "4 × 5", "5 ＋ 4", "5 × 5"), hint: "「5」が「4つ」あるね。" },
        { question: "とけいの もんだい。1時間は 何分？", answer: "60分", options: d("60分", "100分", "24分", "10分"), hint: "長い はりが 1しゅう する じかんだよ。" },
        { question: "午前10時の 2時間後は 何時？", answer: "午後12時（正午）", options: d("午後12時", "午前12時", "午後2時", "午前8時"), hint: "10 ＋ 2 ＝ 12。お昼ごはんに なるよ。" },
        { question: "15cmの ものさし。3cm みじかくすると 何cm？", answer: "12cm", options: d("12cm", "18cm", "15cm", "10cm"), hint: "ひき算を しよう。" },
        { question: "「300 ＋ 400 ＝ 」 答えは？", answer: "700", options: d("700", "304", "100", "340"), hint: "100の かたまりが 3＋4 こ。" },
        { question: "水のかさ。1リットル(L)は 何デシリットル(dL)？", answer: "10dL", options: d("10dL", "100dL", "1dL", "1000dL"), hint: "L（リットル）の 下の たんいだよ。" },
        { question: "1dL は 何ミリリットル(mL)？", answer: "100mL", options: d("100mL", "10mL", "1000mL", "1mL"), hint: "ヤクルト1本分くらい。" },
        { question: "まっすぐな 線だけで かこまれた 形を 何という？", answer: "図形（ずけい）", options: d("図形", "きょくせん", "まる", "点"), hint: "三角形や 四角形のことだよ。" },
        { question: "「0 × 8 ＝ 」 答えは？", answer: "0", options: d("0", "8", "80", "1"), hint: "なにもないのを かけても 答えは...？" },
        { question: "5のだんの 九九。 5 × 7 ＝ ？", answer: "35", options: d("35", "30", "40", "25"), hint: "ごしち...？" },
        { question: "「34 ＋ 52 ＝ 」 答えは？", answer: "86", options: d("86", "84", "76", "96"), hint: "ひっ算で かんがえてみよう。" },
        { question: "「67 － 24 ＝ 」 答えは？", answer: "43", options: d("43", "41", "33", "53"), hint: "一のくらいから ひこう。" },
        { question: "「48 ＋ 16 ＝ 」 くりあがりは ある？", answer: "ある", options: d("ある", "ない", "わからない", "半分だけ"), hint: "8 ＋ 6 は 10より 大きいかな？" },
        { question: "「50 － 18 ＝ 」 答えは？", answer: "32", options: d("32", "42", "38", "48"), hint: "十のくらいから 1かりてくるよ。" },
    ];

const MATH_G2_2: GeneralProblem[] = [
        { question: "九九。 3 × 6 ＝ ？", answer: "18", options: d("18", "15", "21", "12"), hint: "さぶろく...？" },
        { question: "九九。 4 × 8 ＝ ？", answer: "32", options: d("32", "36", "28", "40"), hint: "しは...？" },
        { question: "九九。 6 × 7 ＝ ？", answer: "42", options: d("42", "36", "48", "49"), hint: "ろくしち...？" },
        { question: "九九。 7 × 9 ＝ ？", answer: "63", options: d("63", "56", "70", "49"), hint: "しちく...？" },
        { question: "九九。 8 × 6 ＝ ？", answer: "48", options: d("48", "42", "54", "64"), hint: "はちろく...？" },
        { question: "九九。 9 × 4 ＝ ？", answer: "36", options: d("36", "32", "45", "40"), hint: "くし...？" },
        { question: "1000 より 1 小さい 数は？", answer: "999", options: d("999", "1001", "900", "990"), hint: "千（せん）の 前の 数。" },
        { question: "100 を 10 こ あつめると？", answer: "1000", options: d("1000", "100", "10000", "200"), hint: "「千（せん）」という たんいに なるよ。" },
        { question: "ながさの 計算。 5cm4mm ＋ 2cm3mm ＝ ？", answer: "7cm7mm", options: d("7cm7mm", "7cm", "7mm", "8cm"), hint: "おなじ たんい どうしで たそう。" },
        { question: "「3時50分」の 10分後は 何時？", answer: "4時", options: d("4時", "3時60分", "3時40分", "5時"), hint: "60分で 1時間 ふえるよ。" },
        { question: "正方形（せいほうけい）の 4つの かどは すべて何？", answer: "直角（ちょっかく）", options: d("直角", "まるい", "とがっている", "ちがう"), hint: "ノートの かどと おなじ かたち。" },
        { question: "正方形の 4つの 辺（へん）の ながさは？", answer: "すべて おなじ", options: d("すべて おなじ", "ぜんぶ バラバラ", "むかいあう 辺だけ おなじ", "わからない"), hint: "ましかくな かたちだよ。" },
        { question: "「800 － 200 ＝ 」 答えは？", answer: "600", options: d("600", "820", "1000", "400"), hint: "8 － 2 は？" },
        { question: "1dLの いれもので 1Lの 水を くむには 何回 ひつよう？", answer: "10回", options: d("10回", "100回", "1回", "5回"), hint: "1L ＝ 10dL だよ。" },
        { question: "九九で、答えが「24」に なるのは？", answer: "3×8, 4×6, 6×4, 8×3", options: d("3×8など", "5×5", "7×3", "2×10"), hint: "たくさん あるよ。さがしてみて。" },
        { question: "「120 ＋ 50 ＝ 」 答えは？", answer: "170", options: d("170", "125", "105", "200"), hint: "10の かたまりで かんがえよう。" },
        { question: "「180 － 90 ＝ 」 答えは？", answer: "90", options: d("90", "100", "80", "189"), hint: "18 － 9 は？" },
        { question: "1000は 10が なにこ？", answer: "100こ", options: d("100こ", "10こ", "1000こ", "1こ"), hint: "とっても たくさん！" },
        { question: "「705」の 読み方は？", answer: "ななひゃくご", options: d("ななひゃくご", "ななじゅうご", "ななひゃくじゅうご", "ななご"), hint: "十のくらいは 「れい」だね。" },
        { question: "九九。 2 × 7 ＝ ？", answer: "14", options: d("14", "16", "12", "18"), hint: "にし...？" },
    ];

const MATH_G2_3: GeneralProblem[] = [
        { question: "「1000 － 400 ＝ 」 答えは？", answer: "600", options: d("600", "1400", "400", "0"), hint: "100が 10こ から 4こ ひく。" },
        { question: "5000 と 300 と 20 と 7 で？", answer: "5327", options: d("5327", "5000327", "532", "50327"), hint: "くらいの じゅんばんに ならべよう。" },
        { question: "「150 ＋ 70 ＝ 」 答えは？", answer: "220", options: d("220", "210", "120", "1570"), hint: "15 ＋ 7 は？" },
        { question: "「210 － 50 ＝ 」 答えは？", answer: "160", options: d("160", "150", "260", "110"), hint: "ひき算だよ。" },
        { question: "午前と 午後を あわせると、1日は 何時間？", answer: "24時間", options: d("24時間", "12時間", "60時間", "10時間"), hint: "1日の ながさだよ。" },
        { question: "1L 5dL を すべて dL で いうと？", answer: "15dL", options: d("15dL", "6dL", "105dL", "1.5dL"), hint: "1L ＝ 10dL を つかおう。" },
        { question: "「2000 ＋ 8000 ＝ 」 答えは？", answer: "10000", options: d("10000", "1000", "8200", "100000"), hint: "一万（いちまん）に なるよ。" },
        { question: "九九の ひょうで、答えが 「81」 なのは？", answer: "9 × 9", options: d("9 × 9", "8 × 1", "7 × 7", "9 × 8"), hint: "九九の さいごの ほうだね。" },
        { question: "長方形（ちょうほうけい）の むかいあう 辺の ながさは？", answer: "おなじ", options: d("おなじ", "ちがう", "3ばい", "半分"), hint: "上の 辺と 下の 辺を くらべてみて。" },
        { question: "10cmの テープが 9本 あります。ぜんぶで 何cm？", answer: "90cm", options: d("90cm", "19cm", "109cm", "1m"), hint: "10 × 9 ＝ ?" },
        { question: "3時から 5時までは 何時間？", answer: "2時間", options: d("2時間", "2時", "5時間", "3時間"), hint: "5 － 3 ＝ ?" },
        { question: "「3200」は、100を 何こ あつめた 数？", answer: "32こ", options: d("32こ", "3こ", "2こ", "320こ"), hint: "100が 10こで 1000だね。" },
        { question: "一万（いちまん）より 1 小さい 数は？", answer: "9999", options: d("9999", "10001", "9000", "9990"), hint: "ぜんぶ 9 に なるよ。" },
        { question: "「8500」は、8000 と なに？", answer: "500", options: d("500", "50", "5", "85"), hint: "あわせると 8500に なる 数。" },
        { question: "「1/2」 の 読み方は？", answer: "にぶんのいち", options: d("にぶんのいち", "いちぶんのに", "半分", "にのいち"), hint: "「2つに 分けた 1つ」だよ。" },
        { question: "「1/4」 は 1を 何等分（なんとうぶん）した もの？", answer: "4等分", options: d("4等分", "1等分", "2等分", "40等分"), hint: "下の 数を みてね。" },
        { question: "「1/2」 と 「1/4」、大きいのは どっち？", answer: "1/2", options: d("1/2", "1/4", "おなじ", "わからない"), hint: "半分に わけるのと、4つに わけるの、どっちが 1きれ 大きい？" },
        { question: "直角三角形（ちょっかくさんかくけい）には、直角が いくつある？", answer: "1つ", options: d("1つ", "2つ", "3つ", "ない"), hint: "「直角」が あるから その なまえだよ。" },
        { question: "長方形（ちょうほうけい）には、直角が いくつある？", answer: "4つ", options: d("4つ", "2つ", "0つ", "3つ"), hint: "ぜんぶの かどが 直角だよ。" },
        { question: "10円玉が 100こ あると、ぜんぶで いくら？", answer: "1000円", options: d("1000円", "100円", "10000円", "10円"), hint: "10 × 100 ＝ ?" },
    ];

const splitIntoUnits = (problems: GeneralProblem[], unitCount: number): GeneralProblem[][] => {
    const chunkSize = Math.ceil(problems.length / unitCount);
    return Array.from({ length: unitCount }, (_, i) => problems.slice(i * chunkSize, (i + 1) * chunkSize));
};

const g2Term1Units = splitIntoUnits(MATH_G2_1, 4);
const g2Term2Units = splitIntoUnits(MATH_G2_2, 4);
const g2Term3Units = splitIntoUnits(MATH_G2_3, 4);

const createKukuDanProblems = (dan: number): GeneralProblem[] =>
    Array.from({ length: 20 }, (_, index) => {
        const multiplier = (index % 9) + 1;
        const answer = dan * multiplier;
        const promptType = index % 4;

        if (promptType === 0) {
            return {
                question: `${dan} × ${multiplier} = ?`,
                answer: `${answer}`,
                options: d(`${answer}`, `${answer + dan}`, `${Math.max(0, answer - dan)}`, `${dan + multiplier}`),
                hint: `${dan}のだんを となえよう。`,
            };
        }

        if (promptType === 1) {
            return {
                question: `${answer} に なる ${dan}のだん は？`,
                answer: `${dan} × ${multiplier}`,
                options: d(`${dan} × ${multiplier}`, `${dan} × ${Math.max(1, multiplier - 1)}`, `${dan} × ${Math.min(9, multiplier + 1)}`, `${multiplier} + ${dan}`),
                hint: `答えから しきを えらぼう。`,
            };
        }

        if (promptType === 2) {
            return {
                question: `${dan} × □ = ${answer}。□ は？`,
                answer: `${multiplier}`,
                options: d(`${multiplier}`, `${dan}`, `${Math.min(9, multiplier + 1)}`, `${Math.max(1, multiplier - 1)}`),
                hint: `${dan}のだんで さがそう。`,
            };
        }

        return {
            question: `${dan}が ${multiplier}こ あると ぜんぶで いくつ？`,
            answer: `${answer}`,
            options: d(`${answer}`, `${answer + 1}`, `${Math.max(0, answer - 1)}`, `${dan + multiplier}`),
            hint: `同じ数の くりかえしは かけ算。`,
        };
    });

export const MATH_G2_UNIT_DATA: Record<string, GeneralProblem[]> = {
    MATH_G2_U01: [], // 表 と グラフ
    MATH_G2_U02: [], // たし算（2けた＋2けた）
    MATH_G2_U03: [], // ひき算（2けた−2けた）
    MATH_G2_U04: [], // 長さ（ものさし）
    MATH_G2_U05: [], // 100までの 数
    MATH_G2_U06: [], // かさ（リットル・デシリットル）
    MATH_G2_U07: [], // 時こく と 時かん
    MATH_G2_U08: [], // 3けたの 数
    MATH_G2_U09: [], // かけ算（かけ算のいみ）
    MATH_G2_U10: [], // かけ算（九九）
    MATH_G2_U11: [], // はこの 形
    MATH_G2_U12: [], // ぶんしょうだい
    MATH_G2_U13: createKukuDanProblems(1), // かけ算 1のだん
    MATH_G2_U14: createKukuDanProblems(2), // かけ算 2のだん
    MATH_G2_U15: createKukuDanProblems(3), // かけ算 3のだん
    MATH_G2_U16: createKukuDanProblems(4), // かけ算 4のだん
    MATH_G2_U17: createKukuDanProblems(5), // かけ算 5のだん
    MATH_G2_U18: createKukuDanProblems(6), // かけ算 6のだん
    MATH_G2_U19: createKukuDanProblems(7), // かけ算 7のだん
    MATH_G2_U20: createKukuDanProblems(8), // かけ算 8のだん
    MATH_G2_U21: createKukuDanProblems(9), // かけ算 9のだん
};

const makeUnitProblem = (unitId: string, n: number): GeneralProblem => {
    switch (unitId) {
        case 'MATH_G2_U01': {
            const a = (n % 6) + 2;
            const b = (n % 5) + 1;
            const c = (n % 4) + 1;
            const p = n % 4;
            if (p === 0) {
                const answer = a === b ? "おなじ" : (a > b ? "あか" : "あお");
                const wrongs = ["あか", "あお", "おなじ", "わからない"].filter((label) => label !== answer).slice(0, 3);
                return { question: `ぼうグラフで いちばん おおいのは？`, answer, options: d(answer, ...wrongs), hint: "たかい ぼうを みよう。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
            }
            if (p === 1) {
                return { question: `あか と あおを あわせると いくつ？`, answer: `${a + b}`, options: d(`${a + b}`, `${a - b}`, `${a + b + 1}`, `${a}`), hint: "たしざんで もとめる。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
            }
            if (p === 2) {
                const min = Math.min(a, b, c);
                const winners = ([["あか", a], ["あお", b], ["みどり", c]] as [string, number][]).filter(([, v]) => v === min).map(([label]) => label);
                const answer = winners.length === 1 ? winners[0] : "おなじ";
                const wrongs = ["あか", "あお", "みどり", "おなじ"].filter((label) => label !== answer).slice(0, 3);
                return { question: `みどりは ${c}こ。 いちばん すくない いろは？`, answer, options: d(answer, ...wrongs), hint: "ひくい ぼうを さがそう。", visual: { kind: 'bar_chart', values: [a, b, c], labels: ["あか", "あお", "みどり"] } };
            }
            return { question: `あおは あかより いくつ ちがう？`, answer: `${Math.abs(a - b)}`, options: d(`${Math.abs(a - b)}`, `${a + b}`, `${Math.max(a, b)}`, `${Math.min(a, b)}`), hint: "おおいほう と すくないほう の さ。", visual: { kind: 'bar_chart', values: [a, b], labels: ["あか", "あお"] } };
        }
        case 'MATH_G2_U02': {
            const a = 20 + (n % 60);
            const b = 10 + (n % 30);
            const s = a + b;
            if (n % 3 === 0) return { question: `${a} + ${b} = ?`, answer: `${s}`, options: d(`${s}`, `${s + 1}`, `${s - 1}`, `${a}`), hint: "2けたどうしの たし算だよ。" };
            if (n % 3 === 1) return { question: `${a} に ${b} を たすと？`, answer: `${s}`, options: d(`${s}`, `${s + 10}`, `${s - 10}`, `${b}`), hint: "くりあがりにも 気をつけよう。" };
            return { question: `こたえが ${s} に なる しきは？`, answer: `${a} + ${b}`, options: d(`${a} + ${b}`, `${a} + ${b + 1}`, `${a - 1} + ${b}`, `${a} - ${b}`), hint: "しきを えらぼう。" };
        }
        case 'MATH_G2_U03': {
            const b = 10 + (n % 30);
            const a = b + 20 + (n % 20);
            const dff = a - b;
            if (n % 3 === 0) return { question: `${a} - ${b} = ?`, answer: `${dff}`, options: d(`${dff}`, `${dff + 1}`, `${dff - 1}`, `${a}`), hint: "2けたどうしの ひき算だよ。" };
            if (n % 3 === 1) return { question: `${a} から ${b} を ひくと？`, answer: `${dff}`, options: d(`${dff}`, `${a + b}`, `${b}`, `${dff + 10}`), hint: "くりさがりにも 気をつけよう。" };
            return { question: `こたえが ${dff} に なる しきは？`, answer: `${a} - ${b}`, options: d(`${a} - ${b}`, `${a} + ${b}`, `${b} - ${a}`, `${a} - ${b + 1}`), hint: "しきを えらぼう。" };
        }
        case 'MATH_G2_U04': {
            const a = (n % 9) + 1;
            const b = (n % 8) + 2;
            const answer = a === b ? "おなじ" : `${Math.max(a, b)}cm`;
            return { question: `${a}cm と ${b}cm。 ながいのは？`, answer, options: d(answer, a === b ? `${a + 1}cm` : `${Math.min(a, b)}cm`, a === b ? `${Math.max(1, a - 1)}cm` : "おなじ", "わからない"), hint: "ものさしで くらべる イメージ。" };
        }
        case 'MATH_G2_U05': {
            const a = 10 + (n % 90);
            if (n % 2 === 0) return { question: `${a}の つぎの かずは？`, answer: `${a + 1}`, options: d(`${a + 1}`, `${a}`, `${a - 1}`, `${a + 2}`), hint: "100までの かずを ならべよう。" };
            return { question: `${a}の まえの かずは？`, answer: `${a - 1}`, options: d(`${a - 1}`, `${a}`, `${a + 1}`, `${a - 2}`), hint: "ひとつ まえを かんがえよう。" };
        }
        case 'MATH_G2_U06': {
            const dl = (n % 9) + 1;
            if (n % 2 === 0) return { question: `${dl}dL は なんmL？`, answer: `${dl * 100}mL`, options: d(`${dl * 100}mL`, `${dl * 10}mL`, `${dl}mL`, `${dl * 1000}mL`), hint: "1dL = 100mL。" };
            return { question: `${dl * 100}mL は なんdL？`, answer: `${dl}dL`, options: d(`${dl}dL`, `${dl * 10}dL`, `1dL`, `${dl + 1}dL`), hint: "100mLで 1dL。" };
        }
        case 'MATH_G2_U07': {
            const h = (n % 10) + 1;
            const add = (n % 4) + 1;
            const ans = ((h + add - 1) % 12) + 1;
            const wrong1 = (ans % 12) + 1;
            return {
                question: `この とけいの ${add}じかんご は？`,
                answer: `${ans}じ`,
                options: d(`${ans}じ`, `${wrong1}じ`, `${h}じ`, `${add}じ`),
                hint: "じかんを たそう。",
                visual: { kind: 'clock', hour: h, minute: 0 }
            };
        }
        case 'MATH_G2_U08': {
            const h = (n % 9) + 1;
            const t = n % 10;
            const o = (n * 3) % 10;
            const value = `${h}${t}${o}`;
            if (n % 2 === 0) return { question: `${h}ひゃく ${t}じゅう ${o} を 数字で かくと？`, answer: value, options: d(value, `${h}${o}${t}`, `${t}${h}${o}`, `${h}${t}`), hint: "100の くらいから ならべよう。" };
            return { question: `${value} を ことばで いうと？`, answer: `${h}ひゃく ${t}じゅう ${o}`, options: d(`${h}ひゃく ${t}じゅう ${o}`, `${h}ひゃく ${o}じゅう ${t}`, `${t}ひゃく ${h}じゅう ${o}`, `${h}じゅう ${t}`), hint: "百、十、一のくらい。" };
        }
        case 'MATH_G2_U09': {
            const a = (n % 4) + 2;
            const b = (n % 5) + 2;
            if (n % 2 === 0) return { question: `${a} が ${b}こ。 かけ算の 式は？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${a} + ${b}`, `${b} - ${a}`, `${b} × ${a} + 1`), hint: "おなじ数の くりかえしは かけ算。" };
            const repeatedAdd = Array.from({ length: b }, () => `${a}`).join(' + ');
            return { question: `${repeatedAdd} を かけ算の 式にすると？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${b} × ${a}`, `${a} + ${b}`, `${a} × ${b - 1}`), hint: "たしざんを かけざんに。" };
        }
        case 'MATH_G2_U10': {
            const a = (n % 8) + 2;
            const b = (n % 8) + 2;
            const p = a * b;
            if (n % 3 === 0) return { question: `九九。 ${a} × ${b} = ?`, answer: `${p}`, options: d(`${p}`, `${p + 1}`, `${p - 1}`, `${a + b}`), hint: "九九を おもいだそう。" };
            if (n % 3 === 1) return { question: `${p} に なる かけ算は？`, answer: `${a} × ${b}`, options: d(`${a} × ${b}`, `${a} + ${b}`, `${p} × 1`, `${a} × ${b + 1}`), hint: "しきを えらぼう。" };
            return { question: `${a} × □ = ${p}。 □ は？`, answer: `${b}`, options: d(`${b}`, `${a}`, `${p}`, `${b + 1}`), hint: "九九を つかって さがそう。" };
        }
        case 'MATH_G2_U11': {
            const p = n % 6;
            if (p === 0) {
                return { question: "この はこの 形で、たいらな 面は いくつ？", answer: "6つ", options: d("6つ", "4つ", "8つ", "12つ"), hint: "サイコロを おもいだそう。", visual: { kind: 'cube' } };
            }
            if (p === 1) {
                return { question: "この はこの 形で、かど（頂点）は いくつ？", answer: "8つ", options: d("8つ", "6つ", "4つ", "12つ"), hint: "かどの 数を かぞえよう。", visual: { kind: 'cube' } };
            }
            if (p === 2) {
                return { question: "この はこの 形で、へんは なん本？", answer: "12本", options: d("12本", "8本", "6本", "10本"), hint: "ほねぐみ を かぞえよう。", visual: { kind: 'cube' } };
            }
            if (p === 3) {
                return { question: "1つの かどに あつまる へんは 何本？", answer: "3本", options: d("3本", "2本", "4本", "6本"), hint: "たて・よこ・高さ。", visual: { kind: 'cube' } };
            }
            if (p === 4) {
                return { question: "この はこの 形を ひらくと 面は いくつ？", answer: "6つ", options: d("6つ", "5つ", "7つ", "8つ"), hint: "組み立てても 面の数は同じ。", visual: { kind: 'cube' } };
            }
            return { question: "サイコロの 形と おなじ 立体は？", answer: "立方体", options: d("立方体", "球", "円柱", "三角柱"), hint: "ぜんぶ 正方形の面。", visual: { kind: 'cube' } };
        }
        case 'MATH_G2_U12': {
            const a = 20 + (n % 30);
            const b = (n % 9) + 1;
            if (n % 3 === 0) return { question: `えんぴつが ${a}本。 ${b}本 もらうと なん本？`, answer: `${a + b}本`, options: d(`${a + b}本`, `${a - b}本`, `${a}本`, `${b}本`), hint: "もらうは たし算。" };
            if (n % 3 === 1) return { question: `クッキーが ${a}こ。 ${b}こ たべると のこりは？`, answer: `${a - b}こ`, options: d(`${a - b}こ`, `${a + b}こ`, `${a}こ`, `${b}こ`), hint: "たべると ひき算。" };
            return { question: `はこに ${a}こ あります。 ${b}こ ふやすと ぜんぶで？`, answer: `${a + b}こ`, options: d(`${a + b}こ`, `${a - b}こ`, `${b}こ`, `${a}こ`), hint: "ぶんしょうを しきにしよう。" };
        }
        default:
            return { question: "2 + 2 = ?", answer: "4", options: d("4", "3", "5", "2"), hint: "たし算だよ。" };
    }
};

Object.keys(MATH_G2_UNIT_DATA).forEach((unitId) => {
    const problems = MATH_G2_UNIT_DATA[unitId];
    while (problems.length < 20) {
        problems.push(makeUnitProblem(unitId, problems.length));
    }
});

export const MATH_G2_DATA: Record<string, GeneralProblem[]> = {
    MATH_G2_1,
    MATH_G2_2,
    MATH_G2_3,
    ...MATH_G2_UNIT_DATA,
};
