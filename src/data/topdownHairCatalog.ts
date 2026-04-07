export type HairDirection = 'DOWN' | 'UP' | 'RIGHT' | 'LEFT';

export type HairDirectionalSet = {
  front: string;
  back: string;
  side_r: string;
  side_l: string;
};

export type TopDownHairStyle = HairDirectionalSet & {
  silhouette: string;
  volume: string;
  motion: string;
  readability: string;
};

export type TopDownHairCatalog = Record<string, TopDownHairStyle>;

export const HAIR_SPRITE_FRAME = {
  size: 48,
  order: ['DOWN(front)', 'UP(back)', 'RIGHT(side_r)', 'LEFT(side_l)'] as const,
  headAnchor: { x: 24, y: 14 },
  notes: '全方向で headAnchor を固定し、足元基準ラインとは別に頭基準ラインを維持する',
} as const;

export const TOPDOWN_HAIR_CATALOG: TopDownHairCatalog = {
  korean_mash_soft: {
    front: 'シースルー気味の重め前髪。中央をやや薄くして瞳の抜け感を確保。',
    back: '丸い後頭部シルエット＋短い襟足。トップに段差を入れて潰れを防止。',
    side_r: '前髪が右へ流れ、耳上はタイト。もみあげは短い束を2本。',
    side_l: '左はやや膨らませて非対称。耳前に薄い後れ毛を1束。',
    silhouette: '横長オーバル。頭頂が少し高い韓国マッシュ。',
    volume: 'トップ中、サイド低、後頭部中。',
    motion: '前髪は小さく、後頭部は1テンポ遅れて揺れる。',
    readability: '中央の透け前髪ラインと丸い後頭部で識別。',
  },
  korean_mash_heavy: {
    front: '厚めバングを目の上ギリギリに配置。束感を3分割して重さを演出。',
    back: '後頭部にしっかり丸み。襟足は短く締める。',
    side_r: 'こめかみから頬へ沿う重めサイド。耳は半分隠す。',
    side_l: '左は耳を見せる設計で非対称化。',
    silhouette: '下重心のマッシュドーム。',
    volume: '前高、後高、横中。',
    motion: '移動停止時に前髪が微振動。',
    readability: '前面の太い3束バング。',
  },
  comma_centerpart_clean: {
    front: '6:4のコンマ前髪。額中央に細い分け目。',
    back: '分け目延長ラインを後頭部まで通し、襟足は短め。',
    side_r: '右カーブを強くし、耳上をタイトに落とす。',
    side_l: '左はボリュームを少し上げてコンマ形状を強調。',
    silhouette: 'S字前髪のセンターパート。',
    volume: '前中、後中、横低。',
    motion: '前髪端が歩行で左右に小さく揺れる。',
    readability: '額中央の分け目線。',
  },
  comma_centerpart_wet: {
    front: '濡れ感のある細束センターパート。前髪先端を尖らせる。',
    back: 'タイトな後頭部。襟足は短いレイヤー。',
    side_r: '耳掛けで刈り上げ境界を見せる。',
    side_l: '左は耳を隠して非対称。',
    silhouette: 'タイトな逆三角フォルム。',
    volume: '全体低〜中。',
    motion: '束先のみが軽く遅れて揺れる。',
    readability: '細い濡れ束のハイライト筋。',
  },
  wolf_short_layer: {
    front: '不揃いバングを眉上に配置。中央短く外側長め。',
    back: '段差の強いレイヤーと跳ねる襟足。',
    side_r: '耳後ろへ流れる中段レイヤー。',
    side_l: '左の襟足だけ長くしアシメ化。',
    silhouette: '上短下長のウルフ輪郭。',
    volume: 'トップ中、襟足中〜高。',
    motion: '襟足が慣性で最も遅れて揺れる。',
    readability: '後ろのギザ襟足。',
  },
  wolf_medium_shaggy: {
    front: 'シースルー前髪＋外ハネサイド。',
    back: '中長レイヤーで逆台形ボリューム。',
    side_r: '頬ラインで一度くびれ、毛先を外へ。',
    side_l: '左側は内巻き束を混ぜて質感差を追加。',
    silhouette: 'くびれ付きミディアムウルフ。',
    volume: '後高、前中、横中。',
    motion: '外ハネ毛先が歩行周期に合わせて弾む。',
    readability: 'くびれ＋跳ねる二段毛先。',
  },
  two_block_basic: {
    front: '上部は重め、サイドは短いツーブロック。',
    back: '後頭部下半分を短く刈り、上部を被せる。',
    side_r: '刈り上げラインを明確化。耳周りをスッキリ。',
    side_l: '左は上部をやや長く垂らして差別化。',
    silhouette: '上ふっくら下タイト。',
    volume: 'トップ中、サイド低。',
    motion: '上部だけが遅れて揺れる。',
    readability: 'サイドの明確な境界線。',
  },
  two_block_fade_high: {
    front: '前髪短めで額を見せる。',
    back: '高めフェードで首元までグラデーション。',
    side_r: '0.5〜2段階のフェード表現。',
    side_l: '左はラインを一本入れて個性追加。',
    silhouette: 'シャープな角張りシルエット。',
    volume: '全体低。',
    motion: '揺れは最小、前髪のみ微小。',
    readability: '高フェードとサイドライン。',
  },
  two_block_fade_low: {
    front: '重心低めの前髪で目上を覆う。',
    back: '低めフェード＋自然な後頭部丸み。',
    side_r: '耳下から短くなる低フェード。',
    side_l: '左はもみあげを少し長めに残す。',
    silhouette: '丸みのあるツーブロック。',
    volume: '前中、後中、横低。',
    motion: '重い前髪が遅れて戻る。',
    readability: '低位置フェードの段差。',
  },
  outer_flip_midi_light: {
    front: '薄め前髪を目上で分割。',
    back: '肩上レイヤーを外ハネに設定。',
    side_r: '毛先を外へ大きく逃がす。',
    side_l: '左は外ハネ角度を弱めて自然差。',
    silhouette: '台形ミディの外ハネ。',
    volume: '横中、後中。',
    motion: '毛先が歩行時にバネ的に揺れる。',
    readability: '横の跳ね角。',
  },
  outer_flip_midi_bold: {
    front: 'センター寄りシースルー。',
    back: '後ろ毛先を二段外ハネ。',
    side_r: '顎位置で強い外ハネ。',
    side_l: '左は耳掛けで非対称。',
    silhouette: 'ワイドな外ハネ台形。',
    volume: '横高、後中。',
    motion: '急停止時に毛先が追従して遅れる。',
    readability: '二段外ハネの影。',
  },
  inner_curl_bob: {
    front: '厚めバングの内巻きボブ。',
    back: '丸いボブラインと短い襟足。',
    side_r: '顎下で内巻き。耳は隠す。',
    side_l: '左は耳を少し出して軽さを追加。',
    silhouette: '円形に近いコンパクトボブ。',
    volume: '均一中。',
    motion: '全体が同位相で小さく揺れる。',
    readability: '顎下の内巻きカーブ。',
  },
  loose_perm_short: {
    front: '不規則なカール前髪を軽く透けさせる。',
    back: '後頭部に柔らかい丸ボリューム。',
    side_r: '耳前にS字カール束。',
    side_l: '左はカールを1束追加して非対称。',
    silhouette: 'ふわっとした雲形。',
    volume: '全体高。',
    motion: 'カール先端が遅れて二段階で揺れる。',
    readability: '点在する丸束のハイライト。',
  },
  loose_perm_medium: {
    front: 'センター寄せのゆる波前髪。',
    back: '肩上までの大きいウェーブ。',
    side_r: '頬横に太いS字束。',
    side_l: '左のみ細束を追加し情報量を増やす。',
    silhouette: '波打つミディアム。',
    volume: '横高、後高。',
    motion: '後ろ髪が大きく慣性で揺れる。',
    readability: '太いS字束2本。',
  },
  twin_tail_high_sharp: {
    front: '前髪は短めシースルー。',
    back: '高い位置で左右ツインテール結束。',
    side_r: '右テールは跳ね上がり気味。',
    side_l: '左テールはやや下げてアシメ。',
    silhouette: '上方向へ広がるY字。',
    volume: 'テール高、頭頂中。',
    motion: 'テールが最も大きく遅れて振れる。',
    readability: '高位置の結び目2点。',
  },
  twin_tail_high_fluffy: {
    front: '厚めバングを軽く割って幼さを調整。',
    back: '結び目をふわっと大きく。',
    side_r: '右テールの毛先を外巻き。',
    side_l: '左テールは内巻きで差別化。',
    silhouette: '丸く広がるダブルテール。',
    volume: '全体高。',
    motion: '結び目周辺がぷるっと揺れる。',
    readability: '丸い結び目＋左右異なる毛先。',
  },
  twin_tail_low_classic: {
    front: '斜めバングで目元を少し隠す。',
    back: '低い位置のツインで落ち着いた印象。',
    side_r: '首元を沿う低テール。',
    side_l: '左はリボン位置を少し前へ。',
    silhouette: '下重心のU字。',
    volume: '後中、前中。',
    motion: '低テールが左右にゆったり揺れる。',
    readability: '首元の二本テール。',
  },
  twin_tail_low_braid_mix: {
    front: '中央薄め前髪。',
    back: '低ツインに細編みを混ぜる。',
    side_r: '右は編み込み比率高め。',
    side_l: '左はストレート束多め。',
    silhouette: '編みと直毛の混合シルエット。',
    volume: '後中。',
    motion: '編み込みは揺れ小、直毛は揺れ中。',
    readability: '編み込みの節目ライン。',
  },
  ponytail_high_sporty: {
    front: 'アップバング寄りで額を見せる。',
    back: '高い位置で太いポニーを結ぶ。',
    side_r: '右に流れるポニー基部を強調。',
    side_l: '左は後れ毛を1束追加。',
    silhouette: '頭頂起点の流線型。',
    volume: 'ポニー高、前低。',
    motion: 'ポニーが大きく弧を描いて揺れる。',
    readability: '高位置結束＋長い一本尾。',
  },
  ponytail_low_elegant: {
    front: 'センター分けの薄い前髪。',
    back: 'うなじ近くで低ポニー。',
    side_r: '耳後ろから滑らかに結束へ。',
    side_l: '左は耳掛けで輪郭を出す。',
    silhouette: '縦長で上品なライン。',
    volume: '後中、前低。',
    motion: '低ポニーがゆっくり慣性で揺れる。',
    readability: '低結束位置。',
  },
  ponytail_side_swept: {
    front: '長い流し前髪を右へ。',
    back: '後ろ中心から右側へ寄せたサイドポニー。',
    side_r: '右側に大きいテール塊。',
    side_l: '左は首筋を見せるタイト処理。',
    silhouette: '片側に偏ったアシンメトリー。',
    volume: '右高、左低。',
    motion: '片側テールが振り子状に揺れる。',
    readability: '片寄りした大テール。',
  },
  braid_single_side: {
    front: '斜めバング＋片側編み込みの根元を見せる。',
    back: '左側に一本編み下ろし。',
    side_r: '右はシンプルでタイト。',
    side_l: '左は編み目をはっきり3節以上描写。',
    silhouette: '片側に情報が寄る形。',
    volume: '左中、右低。',
    motion: '編み込み本体は小さく、毛先のみ揺れる。',
    readability: '等間隔の編み節。',
  },
  braid_double_crown: {
    front: '前髪薄め、頭頂へ向かう二本編み。',
    back: '左右から合流するクラウン編み。',
    side_r: '編み込みの立体段差を強調。',
    side_l: '左は合流位置を少し下げ非対称。',
    silhouette: '頭部を囲むリング型。',
    volume: '頭頂中、襟足低。',
    motion: '全体揺れ小、後れ毛だけ揺れる。',
    readability: '頭頂リング状の編みライン。',
  },
  braid_twin_rope: {
    front: 'センター分け＋ロープ編み開始点を額上に。',
    back: '左右ロープ編みを低位置で垂らす。',
    side_r: '右ロープを太めに設定。',
    side_l: '左ロープを細くして左右差。',
    silhouette: '細長い二本縄。',
    volume: '後中。',
    motion: 'ロープ末端が遅れて揺れる。',
    readability: 'ねじれ模様。',
  },
  asymmetry_long_bang: {
    front: '右目を覆う超長バング、左目は開放。',
    back: '後頭部は中長レイヤーで均す。',
    side_r: '右側へ大きく流れる前髪塊。',
    side_l: '左は短く耳掛け。',
    silhouette: '斜めに切り落としたアシメ。',
    volume: '右高、左低。',
    motion: '長バングが遅れて波打つ。',
    readability: '片目隠しの大きな斜線。',
  },
  asymmetry_short_sidecut: {
    front: '左から右へ流す前髪。',
    back: '右側だけ短いサイドカットを露出。',
    side_r: 'サイド刈り上げを明確化。',
    side_l: '左は丸みあるボリューム。',
    silhouette: '片側刈り上げの偏重形。',
    volume: '左中、右低。',
    motion: '長い側のみ揺れる。',
    readability: '片側の地肌色帯。',
  },
  see_through_bang_short: {
    front: '極薄シースルー前髪で目が見える。',
    back: 'コンパクトな短髪後頭部。',
    side_r: '耳上をスッキリ刈り込む。',
    side_l: '左は少しだけ束を残す。',
    silhouette: '小さく整った短髪。',
    volume: '全体低。',
    motion: '前髪先のみ揺れる。',
    readability: '透ける3本前髪。',
  },
  see_through_bang_midi: {
    front: '薄前髪＋頬に落ちる触角束。',
    back: '肩上ミディで丸い後頭部。',
    side_r: '触角束を長めに設定。',
    side_l: '左触角は短めで差分。',
    silhouette: '軽い前面＋丸い後面。',
    volume: '後中、前低。',
    motion: '触角束と後ろ毛が別位相で揺れる。',
    readability: '前面の2本触角。',
  },
  shaggy_layer_unbalanced: {
    front: 'ギザギザ不揃い前髪を5束で構成。',
    back: '段差多めのシャギー後頭部。',
    side_r: '外ハネ短束を多く配置。',
    side_l: '内巻き束を混ぜて変化。',
    silhouette: 'ノコギリ状の輪郭。',
    volume: '全体中〜高。',
    motion: '各束がランダム位相で揺れる。',
    readability: '不揃い5束バング。',
  },
  hime_cut_modern: {
    front: '姫カット前髪を薄めに現代化。',
    back: 'ロング後ろ髪に軽い段差。',
    side_r: '頬横に真っ直ぐ落ちる姫束。',
    side_l: '左姫束を1ドット短くして差別化。',
    silhouette: '縦長の直線的フォルム。',
    volume: '後高、前中。',
    motion: 'ロング部が遅れて揺れ、姫束は揺れ小。',
    readability: '頬横の直線束。',
  },
  slick_back_modern: {
    front: '前髪をすべて後方へ流したオールバック。',
    back: '後頭部に艶のある面構成。',
    side_r: 'こめかみを露出しタイトに。',
    side_l: '左にだけ短い後れ毛を1本。',
    silhouette: '後ろへ流れる流線型。',
    volume: '前低、後中。',
    motion: '揺れ少、後れ毛のみ揺れる。',
    readability: '額全見せ。',
  },
  short_spiky_active: {
    front: '短い束バングを上向きに跳ねさせる。',
    back: '後頭部に小スパイクを配置。',
    side_r: '耳上の刈り込み＋先端スパイク。',
    side_l: '左はスパイク本数を減らし非対称。',
    silhouette: '放射状の短スパイク。',
    volume: 'トップ中、側低。',
    motion: 'スパイク先端が微振動。',
    readability: '尖り束の輪郭。',
  },
  medium_layer_airy: {
    front: 'センター寄り分け＋エアリー束。',
    back: '中段レイヤーで空気感を強化。',
    side_r: '耳前に細束を3本配置。',
    side_l: '左は2本に抑えて差を付与。',
    silhouette: '軽いひし形。',
    volume: '横中、後中。',
    motion: '細束が先に揺れ、後ろ毛が後追い。',
    readability: '前面の細束密度差。',
  },
  long_straight_clean: {
    front: '薄バング＋長い直毛。',
    back: '腰上まで伸びる直線ロングを簡略化。',
    side_r: '右は耳掛けで輪郭を見せる。',
    side_l: '左は全面を垂らして重み追加。',
    silhouette: '縦長ストレート。',
    volume: '後高、前低。',
    motion: '大きく遅れて揺れる一体運動。',
    readability: '長い垂直ライン。',
  },
};

export function getHairSprite(hair: HairDirectionalSet, direction: HairDirection): string {
  switch (direction) {
    case 'DOWN':
      return hair.front;
    case 'UP':
      return hair.back;
    case 'RIGHT':
      return hair.side_r;
    case 'LEFT':
      return hair.side_l;
    default:
      return hair.front;
  }
}

export function toDirectionMap(hair: HairDirectionalSet) {
  return {
    DOWN: hair.front,
    UP: hair.back,
    RIGHT: hair.side_r,
    LEFT: hair.side_l,
  } as const;
}

export type HairSpriteFrameRef = {
  sheet: string;
  x: number;
  y: number;
  w: number;
  h: number;
  headAnchor: { x: number; y: number };
};

export type HairSpriteDirectionalSet = {
  front: HairSpriteFrameRef;
  back: HairSpriteFrameRef;
  side_r: HairSpriteFrameRef;
  side_l: HairSpriteFrameRef;
};

export type TopDownHairRuntimeEntry = {
  id: string;
  design: TopDownHairStyle;
  sprite: HairSpriteDirectionalSet;
  animation: {
    frontSwayPx: number;
    backLagPx: number;
    sideSwayPx: number;
  };
};

const DIRECTION_ROW: Record<HairDirection, number> = {
  DOWN: 0,
  UP: 1,
  RIGHT: 2,
  LEFT: 3,
};

export const TOPDOWN_HAIR_IDS = Object.freeze(Object.keys(TOPDOWN_HAIR_CATALOG));

export const TOPDOWN_HAIR_SHEET = {
  sheet: 'avatar_hair_topdown_v1',
  frame: HAIR_SPRITE_FRAME.size,
  rows: 4,
  cols: TOPDOWN_HAIR_IDS.length,
} as const;

export function buildHairSpriteFrames(hairId: string): HairSpriteDirectionalSet {
  const col = TOPDOWN_HAIR_IDS.indexOf(hairId);
  if (col < 0) {
    throw new Error(`Unknown hairId: ${hairId}`);
  }

  const w = HAIR_SPRITE_FRAME.size;
  const h = HAIR_SPRITE_FRAME.size;
  const anchor = HAIR_SPRITE_FRAME.headAnchor;

  const frameFor = (direction: HairDirection): HairSpriteFrameRef => ({
    sheet: TOPDOWN_HAIR_SHEET.sheet,
    x: col * w,
    y: DIRECTION_ROW[direction] * h,
    w,
    h,
    headAnchor: { ...anchor },
  });

  return {
    front: frameFor('DOWN'),
    back: frameFor('UP'),
    side_r: frameFor('RIGHT'),
    side_l: frameFor('LEFT'),
  };
}

export const TOPDOWN_HAIR_RUNTIME: Record<string, TopDownHairRuntimeEntry> = Object.fromEntries(
  TOPDOWN_HAIR_IDS.map((id) => [
    id,
    {
      id,
      design: TOPDOWN_HAIR_CATALOG[id],
      sprite: buildHairSpriteFrames(id),
      animation: {
        frontSwayPx: 1,
        backLagPx: 2,
        sideSwayPx: 1,
      },
    },
  ]),
);

export function getHairSpriteFrame(hairId: string, direction: HairDirection): HairSpriteFrameRef {
  const runtime = TOPDOWN_HAIR_RUNTIME[hairId];
  if (!runtime) {
    throw new Error(`Unknown hairId: ${hairId}`);
  }

  switch (direction) {
    case 'DOWN':
      return runtime.sprite.front;
    case 'UP':
      return runtime.sprite.back;
    case 'RIGHT':
      return runtime.sprite.side_r;
    case 'LEFT':
      return runtime.sprite.side_l;
    default:
      return runtime.sprite.front;
  }
}

/**
 * Canvas / React 向け実装例
 */
export function getHairSpriteByDirection(hairId: string, direction: HairDirection) {
  return getHairSpriteFrame(hairId, direction);
}
