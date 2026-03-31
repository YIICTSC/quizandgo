import { GeneralProblem, d } from './utils';

const resolveMapSymbol = (question: string, answer: string): string | undefined => {
    const text = `${question} ${answer}`;
    if (text.includes('市役所')) return 'city_office';
    if (text.includes('町村役場')) return 'town_office';
    if (text.includes('小中学校')) return 'school';
    if (text.includes('郵便局')) return text.includes('○の中にテ') ? 'post_office_round' : 'post_office';
    if (text.includes('寺')) return 'temple';
    if (text.includes('神社')) return 'shrine';
    if (text.includes('交番')) return 'police_box';
    if (text.includes('警察署')) return 'police_station';
    if (text.includes('消防署')) return 'fire_station';
    if (text.includes('消防団の詰所')) return 'fire_brigade';
    if (text.includes('工場')) return 'factory';
    if (text.includes('保健所')) return 'health_center';
    if (text.includes('病院')) return 'hospital';
    if (text.includes('田んぼ')) return 'rice_field';
    if (text.includes('畑') && !text.includes('茶畑') && !text.includes('桑')) return 'farm';
    if (text.includes('果樹園')) return 'orchard';
    if (text.includes('茶畑')) return 'tea_field';
    if (text.includes('広葉樹林')) return 'broadleaf_forest';
    if (text.includes('針葉樹林')) return 'conifer_forest';
    if (text.includes('墓地')) return 'cemetery';
    if (text.includes('城跡')) return 'castle_ruins';
    if (text.includes('自衛隊')) return 'self_defense_force';
    if (text.includes('灯台')) return 'lighthouse';
    if (text.includes('裁判所')) return 'court';
    if (text.includes('荒地')) return 'wasteland';
    if (text.includes('砂浜') || text.includes('砂地')) return 'sandy_area';
    if (text.includes('官公庁')) return 'government_office';
    if (text.includes('発電所・変電所')) return 'power_station';
    if (text.includes('水力発電所')) return 'hydro_power';
    if (text.includes('気象台')) return 'weather_station';
    if (text.includes('温泉')) return 'hot_spring';
    if (text.includes('博物館・美術館')) return 'museum';
    if (text.includes('図書館')) return 'library';
    if (text.includes('記念碑')) return 'monument';
    if (text.includes('電子基準点')) return 'electronic_control_point';
    if (text.includes('三角点')) return 'triangulation_point';
    if (text.includes('水準点')) return 'benchmark';
    if (text.includes('桑畑')) return 'mulberry_field';
    if (text.includes('竹林')) return 'bamboo_grove';
    if (text.includes('煙突')) return 'smokestack';
    if (text.includes('噴火口') || text.includes('噴気口')) return 'crater';
    if (text.includes('採石場')) return 'quarry';
    if (text.includes('油井') || text.includes('ガス井')) return 'oil_gas_well';
    if (text.includes('展望台')) return 'observatory';
    if (text.includes('湿地')) return 'wetland';
    if (text.includes('史跡') || text.includes('名勝') || text.includes('天然記念物')) return 'historic_site';
    return undefined;
};

const withMapSymbolVisuals = (problems: GeneralProblem[]): GeneralProblem[] =>
    problems.map((problem) => {
        const symbol = resolveMapSymbol(problem.question, problem.answer);
        if (symbol) {
            const hasImage = false;
            return {
                ...problem,
                question: hasImage ? 'この地図記号は何？' : problem.question,
                visual: { kind: 'map_symbol', symbol }
            };
        }
        return problem;
    });

export const MAP_PREF_DATA: Record<string, GeneralProblem[]> = {
    // --- 地図記号特訓 (50問) ---
    MAP_SYMBOLS: withMapSymbolVisuals([
        { question: "地図記号「◎」は何を表している？", answer: "市役所", options: d("市役所", "警察署", "消防署", "町村役場"), hint: "二重の丸は、その地域の中心的な役所だよ。" },
        { question: "地図記号「文」は何を表している？", answer: "小中学校", options: d("小中学校", "図書館", "博物館", "交番"), hint: "「文（ぶん）」は勉強するところを意味するよ。" },
        { question: "地図記号「〒」は何を表している？", answer: "郵便局", options: d("郵便局", "銀行", "寺", "神社"), hint: "カタカナの「テ」のような形だね。" },
        { question: "地図記号「卍」は何を表している？", answer: "寺", options: d("寺", "神社", "墓地", "教会"), hint: "お坊さんがいるところ。マンジの形。" },
        { question: "地図記号「鳥居（とりい）の形」は何を表している？", answer: "神社", options: d("神社", "寺", "山", "工場"), hint: "神様を祀（まつ）っているところ。" },
        { question: "地図記号「×」は何を表している？", answer: "交番", options: d("交番", "警察署", "消防署", "銀行"), hint: "お巡りさんの持っている警棒（けいぼう）が交差した形。" },
        { question: "地図記号「(x)」（丸の中に×）は何を表している？", answer: "警察署", options: d("警察署", "交番", "消防署", "自衛隊"), hint: "交番の記号をさらに大きく囲っているよ。" },
        { question: "地図記号「Y」（さすまたの形）は何を表している？", answer: "消防署", options: d("消防署", "病院", "工場", "果樹園"), hint: "昔の火消し道具「さすまた」の形だよ。" },
        { question: "地図記号「歯車（はぐるま）」は何を表している？", answer: "工場", options: d("工場", "発電所", "市役所", "公園"), hint: "機械を動かす歯車の形だね。" },
        { question: "地図記号「(＋)」（丸の中に十字）は何を表している？", answer: "保健所", options: d("保健所", "病院", "薬局", "学校"), hint: "地域の健康を守るところ。" },
        { question: "地図記号「田」は何を表している？", answer: "田んぼ", options: d("田んぼ", "畑", "茶畑", "果樹園"), hint: "お米を作っている場所だよ。" },
        { question: "地図記号「V」が並んだ形は何を表している？", answer: "畑", options: d("畑", "田んぼ", "森", "荒地"), hint: "植物の芽が出ているイメージ。" },
        { question: "地図記号「リンゴのような形」は何を表している？", answer: "果樹園", options: d("果樹園", "花畑", "八百屋", "森"), hint: "果物がなっている木をイメージしているよ。" },
        { question: "地図記号「∴」（点が3つ）は何を表している？", answer: "茶畑", options: d("茶畑", "荒地", "墓地", "針葉樹林"), hint: "お茶の葉っぱをイメージした点だよ。" },
        { question: "地図記号「傘（かさ）のような形」は何を表している？", answer: "広葉樹林", options: d("広葉樹林", "針葉樹林", "竹林", "畑"), hint: "横に広がる葉っぱの木だよ。サクラやクヌギなど。" },
        { question: "地図記号「マツのようなトゲトゲの形」は何を表している？", answer: "針葉樹林", options: d("針葉樹林", "広葉樹林", "荒地", "墓地"), hint: "スギやマツのように細長い葉の木だよ。" },
        { question: "地図記号「⊥」（逆さまのTに点）は何を表している？", answer: "墓地", options: d("墓地", "お寺", "神社", "病院"), hint: "お墓が並んでいるところ。" },
        { question: "地図記号「城壁（じょうへき）のような形」は何を表している？", answer: "城跡", options: d("城跡", "工場", "市役所", "記念碑"), hint: "昔のお城があった場所。" },
        { question: "地図記号「六角形の中に点」は何を表している？", answer: "消防団の詰所", options: d("消防団の詰所", "消防署", "警察署", "交番"), hint: "地域の消防団がいる場所。" },
        { question: "地図記号「旗（はた）」は何を表している？", answer: "自衛隊", options: d("自衛隊", "学校", "官公庁", "警察"), hint: "自衛隊の基地などがあるよ。" },
        { question: "地図記号「二本の線で囲まれた丸」は何？", answer: "町村役場", options: d("町村役場", "市役所", "警察署", "消防署"), hint: "市役所（◎）よりシンプルな丸。"},
        { question: "地図記号「丸の中に灯台の光」は何？", answer: "灯台", options: d("灯台", "発電所", "煙突", "気象台"), hint: "海を照らす光をイメージしてね。"},
        { question: "地図記号「○の中に×」は何？", answer: "裁判所", options: d("裁判所", "警察署", "税務署", "銀行"), hint: "昔、立て札を立てた形からきているよ。"},
        { question: "地図記号「建物の形に＋」は何？", answer: "病院", options: d("病院", "保健所", "学校", "教会"), hint: "大きな病院を表す新しい記号だよ。"},
        { question: "地図記号「○の中にテ」は何？", answer: "郵便局", options: d("郵便局", "電報局", "銀行", "市役所"), hint: "「〒」をさらに丸で囲った形。"},
        { question: "地図記号「クワのような形」は何？", answer: "荒地", options: d("荒地", "畑", "田んぼ", "砂浜"), hint: "何も作っていない、荒れた土地。"},
        { question: "地図記号「点々が並んでいる」のは？", answer: "砂浜・砂地", options: d("砂浜・砂地", "荒地", "畑", "雪原"), hint: "砂の粒をイメージしているよ。"},
        { question: "地図記号「二重の四角」は何？", answer: "官公庁", options: d("官公庁", "市役所", "裁判所", "図書館"), hint: "国の重要な役所のこと。"},
        { question: "地図記号「○の中に縦線」は何？", answer: "発電所・変電所", options: d("発電所・変電所", "工場", "灯台", "煙突"), hint: "電気が流れるイメージ。"},
        { question: "地図記号「三本線の入った丸」は何？", answer: "気象台", options: d("気象台", "発電所", "灯台", "市役所"), hint: "天気予報の元になる場所。"},
        { question: "地図記号「♨」（ゆげ）は何？", answer: "温泉", options: d("温泉", "工場", "火山", "銭湯"), hint: "あたたかいお湯が湧いているよ。"},
        { question: "地図記号「五角形のなかに家」は何？", answer: "博物館・美術館", options: d("博物館・美術館", "図書館", "学校", "役所"), hint: "貴重な品物や絵が飾ってあるよ。"},
        { question: "地図記号「丸のなかに本の形」は何？", answer: "図書館", options: d("図書館", "学校", "本屋", "博物館"), hint: "本がたくさんあって借りられるよ。"},
        { question: "地図記号「石碑（せきひ）の形」は何？", answer: "記念碑", options: d("記念碑", "墓地", "神社", "史跡"), hint: "有名な出来事を記録した石の塔。"},
        { question: "地図記号「菱形（ひしがた）に点」は何？", answer: "電子基準点", options: d("電子基準点", "三角点", "水準点", "警察"), hint: "GPSを使って地球の動きを測る場所。"},
        { question: "地図記号「△」は何？", answer: "三角点", options: d("三角点", "水準点", "山", "灯台"), hint: "山の高さなどを測る基準になる場所。"},
        { question: "地図記号「□」は何？（小さいしかく）", answer: "水準点", options: d("水準点", "三角点", "家", "工場"), hint: "道の高さなどを測る基準。"},
        { question: "地図記号「丸の中にハサミのような形」は？", answer: "桑（くわ）畑", options: d("桑畑", "茶畑", "果樹園", "畑"), hint: "昔、カイコを育てるために作られたよ。"},
        { question: "地図記号「笹（ささ）のような形」は？", answer: "竹林（ちくりん）", options: d("竹林", "笹原", "森", "林"), hint: "タケノコが生えてくる場所だよ。"},
        { question: "地図記号「丸の中に星」は何？", answer: "自衛隊", options: d("自衛隊", "警察署", "消防署", "官公庁"), hint: "※現在の地形図では「旗」が一般的だよ。"},
        { question: "地図記号「工」のような形は何？", answer: "煙突", options: d("煙突", "工場", "寺", "史跡"), hint: "煙が出る高い塔。"},
        { question: "地図記号「米印のような点」は何？", answer: "噴火口・噴気口", options: d("噴火口・噴気口", "火山", "温泉", "記念碑"), hint: "火山の火口などを表すよ。"},
        { question: "地図記号「点線の丸」は何？", answer: "採石場", options: d("採石場", "工場", "荒地", "砂地"), hint: "石を掘り出している場所。"},
        { question: "地図記号「矢印のような三本線」は？", answer: "油井・ガス井", options: d("油井・ガス井", "灯台", "発電所", "煙突"), hint: "石油やガスを掘っている場所。"},
        { question: "地図の「等高線」とは何？", answer: "同じ高さの地点を結んだ線", options: d("同じ高さの地点を結んだ線", "気温が同じ線", "人口が同じ線", "県境の線"), hint: "山の形や急さがわかるよ。"},
        { question: "等高線の間隔（かんかく）が狭いのは？", answer: "急な斜面", options: d("急な斜面", "ゆるやかな斜面", "平地", "崖"), hint: "線がぎっしり並んでいるよ。"},
        { question: "地図記号「丸の中に双眼鏡の形」は？", answer: "展望台", options: d("展望台", "灯台", "史跡", "博物館"), hint: "高いところで景色が見られるよ。"},
        { question: "地図記号「点々に囲まれたエリア」は？", answer: "湿地", options: d("湿地", "砂浜", "畑", "荒地"), hint: "水がたまりやすい、じめじめした場所。"},
        { question: "地図記号「双葉の形」は何を表す？", answer: "史跡・名勝・天然記念物", options: d("史跡・名勝", "公園", "森林", "畑"), hint: "歴史的に価値のある場所だよ。"},
        { question: "地図記号「建物に波のような線」は？", answer: "水力発電所", options: d("水力発電所", "工場", "灯台", "浄水場"), hint: "水の力で電気を作る場所。"}
    ]),

    // --- 都道府県特訓 (50問) ---
    PREFECTURES: [
        { question: "日本で一番面積が広い都道府県は？", answer: "北海道", options: d("北海道", "岩手県", "長野県", "東京都"), hint: "地図で見ると圧倒的に大きいね。" },
        { question: "日本で一番人口が多い都道府県は？", answer: "東京都", options: d("東京都", "神奈川県", "大阪府", "愛知県"), hint: "日本の首都で、ビルがいっぱいです。" },
        { question: "「リンゴ」の生産量が日本一なのは？", answer: "青森県", options: d("青森県", "長野県", "岩手県", "山形県"), hint: "東北地方の最北端にある県。" },
        { question: "「みかん」の生産量が日本一なのは？", answer: "和歌山県", options: d("和歌山県", "愛媛県", "静岡県", "熊本県"), hint: "近畿地方の南部にあります。" },
        { question: "「お茶」の生産で有名な、富士山がある県は？", answer: "静岡県", options: d("静岡県", "鹿児島県", "京都府", "福岡県"), hint: "新幹線の窓からよく見えるよ。" },
        { question: "「さくらんぼ」の生産量が日本一なのは？", answer: "山形県", options: d("山形県", "福島県", "青森県", "山梨県"), hint: "「佐藤錦」が有名。" },
        { question: "「うどん県」としても有名な、日本で一番面積が小さい県は？", answer: "香川県", options: d("香川県", "徳島県", "大阪府", "東京都"), hint: "四国地方にあります。" },
        { question: "日本最大の湖「琵琶湖」がある県は？", answer: "滋賀県", options: d("滋賀県", "京都府", "岐阜県", "三重県"), hint: "近畿地方の水がめと呼ばれているよ。" },
        { question: "「首里城」や綺麗な海がある、日本最南端の県は？", answer: "沖縄県", options: d("沖縄県", "鹿児島県", "宮崎県", "長崎県"), hint: "暖かい島々からなる県。" },
        { question: "自動車工業が盛んで、トヨタ自動車の本社がある県は？", answer: "愛知県", options: d("愛知県", "静岡県", "神奈川県", "三重県"), hint: "名古屋市が県庁所在地。" },
        { question: "「金沢」の兼六園や、金箔（きんぱく）で有名な県は？", answer: "石川県", options: d("石川県", "富山県", "福井県", "新潟県"), hint: "北陸地方にあります。" },
        { question: "「落花生（ピーナッツ）」の生産が盛んで、成田空港がある県は？", answer: "千葉県", options: d("千葉県", "茨城県", "埼玉県", "神奈川県"), hint: "ディズニーランドもあるよ。" },
        { question: "「きりたんぽ」や「なまはげ」で有名な東北地方の県は？", answer: "秋田県", options: d("秋田県", "岩手県", "青森県", "宮城県"), hint: "お米もおいしいよ。" },
        { question: "「出雲大社」があり、宍道湖のしじみが有名な県は？", answer: "島根県", options: d("島根県", "鳥取県", "岡山県", "広島県"), hint: "神々が集まる場所と言われている。" },
        { question: "「砂丘」があることで有名な県は？", answer: "鳥取県", options: d("鳥取県", "島根県", "香川県", "徳島県"), hint: "日本で一番人口が少ない県でもあるよ。" },
        { question: "「博多ラーメン」や「明太子」が有名な九州の県は？", answer: "福岡県", options: d("福岡県", "佐賀県", "大分県", "熊本県"), hint: "九州で一番大きな都市がある。" },
        { question: "「平和記念公園」や「厳島神社」がある県は？", answer: "広島県", options: d("広島県", "岡山県", "山口県", "愛媛県"), hint: "中国地方の中心的な県。" },
        { question: "「宇都宮」の餃子が有名な、いちごの生産日本一の県は？", answer: "栃木県", options: d("栃木県", "群馬県", "茨城県", "埼玉県"), hint: "「とちおとめ」が有名だね。" },
        { question: "「阿蘇山」という巨大な火山がある県は？", answer: "熊本県", options: d("熊本県", "大分県", "鹿児島県", "長崎県"), hint: "くまモンでもおなじみ。" },
        { question: "日本で唯一「道」がつく自治体は？", answer: "北海道", options: d("北海道", "東京都", "大阪府", "京都府"), hint: "北の大きな大地。" },
        { question: "「梨（なし）」の生産量で常に上位な、鳥取県のお隣の県は？", answer: "岡山県", options: d("岡山県", "鳥取県", "茨城県", "福島県"), hint: "※千葉や鳥取も有名だけど、桃も有名だよ。"},
        { question: "「信濃川」が流れ、お米の生産量が日本一なのは？", answer: "新潟県", options: d("新潟県", "秋田県", "北海道", "長野県"), hint: "コシヒカリが有名。"},
        { question: "「伊勢神宮」があるのは何県？", answer: "三重県", options: d("三重県", "愛知県", "滋賀県", "奈良県"), hint: "紀伊半島の東側に位置する。"},
        { question: "「鳴門の渦潮」が見られるのは何県？", answer: "徳島県", options: d("徳島県", "香川県", "愛媛県", "兵庫県"), hint: "四国と淡路島の間にあるよ。"},
        { question: "「甲子園球場」があるのは何県？", answer: "兵庫県", options: d("兵庫県", "大阪府", "京都府", "奈良県"), hint: "大阪だと思われがちだけど実は..."},
        { question: "「桃太郎」の伝説で有名な県は？", answer: "岡山県", options: d("岡山県", "香川県", "愛媛県", "広島県"), hint: "きびだんご、マスカットが有名。"},
        { question: "「カツオのたたき」が有名な、坂本龍馬の故郷は？", answer: "高知県", options: d("高知県", "徳島県", "愛媛県", "香川県"), hint: "四国の南側に面している県。"},
        { question: "「東大寺の大仏」があるのは何県？", answer: "奈良県", options: d("奈良県", "京都府", "大阪府", "滋賀県"), hint: "鹿（シカ）がたくさんいる公園も有名。"},
        { question: "「関ヶ原」の戦いの舞台となったのは何県？", answer: "岐阜県", options: d("岐阜県", "滋賀県", "愛知県", "三重県"), hint: "海に面していない県（内陸県）だよ。"},
        { question: "「日光東照宮」があるのは何県？", answer: "栃木県", options: d("栃木県", "茨城県", "群馬県", "福島県"), hint: "三猿（見ざる、言わざる、聞かざる）が有名。"},
        { question: "「ハウステンボス」がある九州の県は？", answer: "長崎県", options: d("長崎県", "福岡県", "佐賀県", "宮崎県"), hint: "オランダの街並みを再現しているよ。"},
        { question: "「博多織」や「辛子明太子」で有名なのは？", answer: "福岡県", options: d("福岡県", "長崎県", "熊本県", "山口県"), hint: "九州最大の都市。"},
        { question: "「讃岐うどん」といえば？", answer: "香川県", options: d("香川県", "徳島県", "愛媛県", "高知県"), hint: "こしのある麺が人気。"},
        { question: "「草津温泉」があるのは何県？", answer: "群馬県", options: d("群馬県", "栃木県", "長野県", "新潟県"), hint: "湯もみショーが有名。"},
        { question: "「黒豚」や「桜島」があるのは？", answer: "鹿児島県", options: d("鹿児島県", "宮崎県", "熊本県", "沖縄県"), hint: "九州の最南端（島をのぞく）。"},
        { question: "「地獄めぐり」で有名な別府温泉があるのは？", answer: "大分県", options: d("大分県", "福岡県", "熊本県", "宮崎県"), hint: "おんせん県を名乗っているよ。"},
        { question: "「松島」という日本三景の一つがある県は？", answer: "宮城県", options: d("宮城県", "福島県", "岩手県", "山形県"), hint: "仙台市が県庁所在地。"},
        { question: "「日本三名園」の偕楽園がある県は？", answer: "茨城県", options: d("茨城県", "栃木県", "群馬県", "埼玉県"), hint: "納豆の生産も盛んだよ。"},
        { question: "「秩父（ちちぶ）山地」や、鉄道博物館があるのは？", answer: "埼玉県", options: d("埼玉県", "千葉県", "群馬県", "東京都"), hint: "海に面していない内陸県。"},
        { question: "「善光寺」があり、精密機械工業も盛んな県は？", answer: "長野県", options: d("長野県", "山梨県", "岐阜県", "新潟県"), hint: "レタスの生産も日本一。"},
        { question: "「富士山」の北側があり、ぶどうや桃が有名なのは？", answer: "山梨県", options: d("山梨県", "静岡県", "神奈川県", "長野県"), hint: "海がない県だよ。"},
        { question: "「兼六園」があり、輪島塗が有名なのは？", answer: "石川県", options: d("石川県", "富山県", "福井県", "新潟県"), hint: "能登半島があるよ。"},
        { question: "「黒部ダム」がある、ホタルイカで有名な県は？", answer: "富山県", options: d("富山県", "石川県", "福井県", "長野県"), hint: "北陸地方にあるよ。"},
        { question: "「東尋坊」という崖や、恐竜博物館があるのは？", answer: "福井県", options: d("福井県", "石川県", "滋賀県", "京都府"), hint: "越前ガニがおいしい。"},
        { question: "「宮崎牛」や、マンゴーの生産が有名なのは？", answer: "宮崎県", options: d("宮崎県", "鹿児島県", "熊本県", "大分県"), hint: "高千穂峡（たかちほきょう）も有名。"},
        { question: "「白川郷」の合掌造り集落があるのは何県？", answer: "岐阜県", options: d("岐阜県", "富山県", "長野県", "滋賀県"), hint: "飛騨（ひだ）牛が有名。"},
        { question: "「瀬戸大橋」が結んでいるのは、岡山県と何県？", answer: "香川県", options: d("香川県", "徳島県", "愛媛県", "兵庫県"), hint: "四国への入り口。"},
        { question: "「明石海峡大橋」が結んでいるのは、徳島県と何県？", answer: "兵庫県", options: d("兵庫県", "大阪府", "岡山県", "和歌山県"), hint: "淡路島を通るよ。"},
        { question: "日本で一番人口が少ない県は？", answer: "鳥取県", options: d("鳥取県", "島根県", "高知県", "徳島県"), hint: "砂丘が有名。"},
        { question: "日本で一番高い山「富士山」がまたがっているのは、静岡県とどこ？", answer: "山梨県", options: d("山梨県", "長野県", "神奈川県", "愛知県"), hint: "海がない県だよ。"}
    ],

    // --- 県庁所在地特訓 (50問) ---
    PREF_CAPITALS: [
        { question: "香川県の県庁所在地は？", answer: "高松市", options: d("高松市", "香川市", "丸亀市", "徳島市"), hint: "「香川市」ではないよ。" },
        { question: "愛媛県の県庁所在地は？", answer: "松山市", options: d("松山市", "愛媛市", "今治市", "高知市"), hint: "夏目漱石の「坊っちゃん」の舞台。" },
        { question: "石川県の県庁所在地は？", answer: "金沢市", options: d("金沢市", "石川市", "小松市", "能登市"), hint: "加賀百万石の城下町。" },
        { question: "栃木県の県庁所在地は？", answer: "宇都宮市", options: d("宇都宮市", "栃木市", "日光市", "小山市"), hint: "餃子の街として有名！" },
        { question: "茨城県の県庁所在地は？", answer: "水戸市", options: d("水戸市", "茨城市", "つくば市", "日立市"), hint: "納豆や水戸黄門で有名。" },
        { question: "群馬県の県庁所在地は？", answer: "前橋市", options: d("前橋市", "高崎市", "群馬市", "伊勢崎市"), hint: "「高崎」と迷いやすいけど..." },
        { question: "三重県の県庁所在地は？", answer: "津市", options: d("津市", "四日市市", "伊勢市", "三重市"), hint: "日本で一番短い名前の市だよ。" },
        { question: "滋賀県の県庁所在地は？", answer: "大津市", options: d("大津市", "滋賀市", "彦根市", "草津市"), hint: "琵琶湖の南側にあります。" },
        { question: "島根県の県庁所在地は？", answer: "松江市", options: d("松江市", "出雲市", "島根市", "鳥取市"), hint: "宍道湖（しんじこ）のほとり。" },
        { question: "神奈川県の県庁所在地は？", answer: "横浜市", options: d("横浜市", "川崎市", "鎌倉市", "神奈川市"), hint: "中華街や港が有名。" },
        { question: "兵庫県の県庁所在地は？", answer: "神戸市", options: d("神戸市", "姫路市", "西宮市", "兵庫市"), hint: "おしゃれな港町。" },
        { question: "岩手県の県庁所在地は？", answer: "盛岡市", options: d("盛岡市", "岩手市", "花巻市", "一関市"), hint: "わんこそばがおいしい。" },
        { question: "宮城県の県庁所在地は？", answer: "仙台市", options: d("仙台市", "宮城市", "石巻市", "名取市"), hint: "「杜の都」と呼ばれます。" },
        { question: "福島県の県庁所在地は？", answer: "福島市", options: d("福島市", "郡山市", "いわき市", "会津若松市"), hint: "県名と同じだよ。" },
        { question: "山梨県の県庁所在地は？", answer: "甲府市", options: d("甲府市", "山梨市", "大月市", "笛吹市"), hint: "武田信玄の本拠地。" },
        { question: "沖縄県の県庁所在地は？", answer: "那覇市", options: d("那覇市", "沖縄市", "名護市", "石垣市"), hint: "国際通りがあるにぎやかな街。" },
        { question: "北海道の道庁所在地は？", answer: "札幌市", options: d("札幌市", "函館市", "旭川市", "小樽市"), hint: "雪まつりが有名。" },
        { question: "山形県の県庁所在地は？", answer: "山形市", options: d("山形市", "米沢市", "酒田市", "鶴岡市"), hint: "県名と同じ。" },
        { question: "長野県の県庁所在地は？", answer: "長野市", options: d("長野市", "松本市", "上田市", "軽井沢町"), hint: "善光寺（ぜんこうじ）があるよ。" },
        { question: "愛知県の県庁所在地は？", answer: "名古屋市", options: d("名古屋市", "豊田市", "一宮市", "岡崎市"), hint: "金のシャチホコのお城があるよ。" },
        { question: "青森県の県庁所在地は？", answer: "青森市", options: d("青森市", "八戸市", "弘前市", "むつ市"), hint: "県名と同じ。"},
        { question: "秋田県の県庁所在地は？", answer: "秋田市", options: d("秋田市", "能代市", "横手市", "大館市"), hint: "県名と同じ。"},
        { question: "富山県の県庁所在地は？", answer: "富山市", options: d("富山市", "高岡市", "魚津市", "氷見市"), hint: "県名と同じ。"},
        { question: "福井県の県庁所在地は？", answer: "福井市", options: d("福井市", "敦賀市", "鯖江市", "越前市"), hint: "県名と同じ。"},
        { question: "和歌山県の県庁所在地は？", answer: "和歌山市", options: d("和歌山市", "田辺市", "新宮市", "橋本市"), hint: "県名と同じ。"},
        { question: "鳥取県の県庁所在地は？", answer: "鳥取市", options: d("鳥取市", "米子市", "倉吉市", "境港市"), hint: "県名と同じ。"},
        { question: "岡山県の県庁所在地は？", answer: "岡山市", options: d("岡山市", "倉敷市", "津山市", "玉野市"), hint: "県名と同じ。"},
        { question: "山口県の県庁所在地は？", answer: "山口市", options: d("山口市", "下関市", "宇部市", "岩国市"), hint: "県名と同じ。"},
        { question: "佐賀県の県庁所在地は？", answer: "佐賀市", options: d("佐賀市", "唐津市", "鳥栖市", "伊万里市"), hint: "県名と同じ。"},
        { question: "長崎県の県庁所在地は？", answer: "長崎市", options: d("長崎市", "佐世保市", "大村市", "島原市"), hint: "県名と同じ。"},
        { question: "熊本県の県庁所在地は？", answer: "熊本市", options: d("熊本市", "八代市", "天草市", "阿蘇市"), hint: "県名と同じ。"},
        { question: "大分県の県庁所在地は？", answer: "大分市", options: d("大分市", "別府市", "中津市", "日田市"), hint: "県名と同じ。"},
        { question: "宮崎県の県庁所在地は？", answer: "宮崎市", options: d("宮崎市", "延岡市", "都城市", "日南市"), hint: "県名と同じ。"},
        { question: "鹿児島県の県庁所在地は？", answer: "鹿児島市", options: d("鹿児島市", "霧島市", "鹿屋市", "枕崎市"), hint: "県名と同じ。"},
        { question: "徳島県の県庁所在地は？", answer: "徳島市", options: d("徳島市", "鳴門市", "阿南市", "三好市"), hint: "県名と同じ。"},
        { question: "高知県の県庁所在地は？", answer: "高知市", options: d("高知市", "南国市", "四万十市", "室戸市"), hint: "県名と同じ。"},
        { question: "広島県の県庁所在地は？", answer: "広島市", options: d("広島市", "福山市", "呉市", "尾道市"), hint: "県名と同じ。"},
        { question: "奈良県の県庁所在地は？", answer: "奈良市", options: d("奈良市", "橿原市", "生駒市", "天理市"), hint: "県名と同じ。"},
        { question: "大阪府の府庁所在地は？", answer: "大阪市", options: d("大阪市", "堺市", "東大阪市", "枚方市"), hint: "府名と同じ。"},
        { question: "京都府の府庁所在地は？", answer: "京都市", options: d("京都市", "宇治市", "亀岡市", "舞鶴市"), hint: "府名と同じ。"},
        { question: "岐阜県の県庁所在地は？", answer: "岐阜市", options: d("岐阜市", "大垣市", "高山市", "多治見市"), hint: "県名と同じ。"},
        { question: "静岡県の県庁所在地は？", answer: "静岡市", options: d("静岡市", "浜松市", "沼津市", "富士市"), hint: "県名と同じ。"},
        { question: "新潟県の県庁所在地は？", answer: "新潟市", options: d("新潟市", "長岡市", "上越市", "三条市"), hint: "県名と同じ。"},
        { question: "埼玉県の県庁所在地は？", answer: "さいたま市", options: d("さいたま市", "大宮市", "浦和市", "川越市"), hint: "ひらがなのなまえ。"},
        { question: "千葉県の県庁所在地は？", answer: "千葉市", options: d("千葉市", "船橋市", "松戸市", "柏市"), hint: "県名と同じ。"},
        { question: "東京都の都庁所在地は？", answer: "新宿区", options: d("新宿区", "渋谷区", "千代田区", "東京市"), hint: "※23区のなかのひとつ。"},
        { question: "「県名」と「市名」がちがう県を選んで！", answer: "香川県", options: d("香川県", "秋田県", "長崎県", "広島県"), hint: "香川は高松市だよ。"},
        { question: "「県名」と「市名」が同じ県を選んで！", answer: "長崎県", options: d("長崎県", "滋賀県", "三重県", "愛媛県"), hint: "滋賀は大津、三重は津、愛媛は松山だよ。"}
    ]
};
