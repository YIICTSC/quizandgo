import { ProblemVisual as ProblemVisualType } from '../subjects/utils';
import { MAP_SYMBOL_IMAGE_MAP } from './mapSymbolImageMap';

const cx = 140;
const cy = 100;

const polygonPoints = (sides: number, radius = 62) =>
  Array.from({ length: Math.max(3, sides) }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(3, sides);
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

const joinPoints = (points: { x: number; y: number }[]) => points.map((point) => `${point.x},${point.y}`).join(' ');
const placeText = (x: number, y: number, value: string, fill = '#0f172a') => (
  <text x={x} y={y} textAnchor="middle" fill={fill} fontSize="14" fontWeight="bold">
    {value}
  </text>
);

const FractionText = ({ n, d }: { n: number; d: number }) => (
  <span className="inline-flex flex-col items-center leading-none">
    <span>{n}</span>
    <span className="w-8 border-t border-current my-1" />
    <span>{d}</span>
  </span>
);

export default function ProblemVisual({ visual }: { visual: ProblemVisualType }) {
  if (visual.kind === 'map_symbol') {
    const imageSrc = MAP_SYMBOL_IMAGE_MAP[visual.symbol];
    return (
      <div className="mb-4 flex flex-col items-center">
        {imageSrc ? (
          <img src={imageSrc} alt={visual.symbol} className="w-24 h-24 object-contain bg-white rounded-lg p-2" />
        ) : (
          <div className="text-sm text-slate-300">地図記号: {visual.symbol}</div>
        )}
        <div className="text-xs text-slate-400 mt-2">記号: {visual.symbol}</div>
      </div>
    );
  }

  if (visual.kind === 'fraction') {
    return (
      <div className="mb-4 flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-3xl font-bold text-white">
        {visual.whole ? <span className="mr-3">{visual.whole}</span> : null}
        <FractionText n={visual.numerator} d={visual.denominator} />
      </div>
    );
  }

  if (visual.kind === 'fraction_operation') {
    return (
      <div className="mb-4 flex items-center justify-center gap-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-3xl font-bold text-white">
        <FractionText n={visual.left.n} d={visual.left.d} />
        <span>{visual.op}</span>
        <FractionText n={visual.right.n} d={visual.right.d} />
      </div>
    );
  }

  if (visual.kind === 'number_sequence') {
    return (
      <div className="mb-4 flex justify-center gap-3 flex-wrap rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        {visual.values.map((value, index) => (
          <div key={`${value}-${index}`} className="min-w-14 rounded-lg bg-slate-700 px-4 py-3 text-center text-2xl font-bold text-white">
            {value}
          </div>
        ))}
      </div>
    );
  }

  if (visual.kind === 'dots') {
    return (
      <div className="mb-4 flex justify-center gap-4 flex-wrap rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        {visual.counts.map((count, index) => (
          <div key={`${count}-${index}`} className="min-w-24">
            {visual.labels?.[index] ? <div className="mb-2 text-center text-sm text-slate-300">{visual.labels[index]}</div> : null}
            <div className="flex flex-wrap justify-center gap-1">
              {Array.from({ length: count }).map((_, dotIndex) => (
                <span key={dotIndex} className="h-3 w-3 rounded-full bg-green-400" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual.kind === 'bar_chart') {
    const maxValue = Math.max(...visual.values, 1);
    return (
      <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
        <div className="flex items-end justify-center gap-4 h-40">
          {visual.values.map((value, index) => (
            <div key={`${value}-${index}`} className="flex flex-col items-center gap-2">
              <div className="text-xs text-slate-300">{value}</div>
              <div
                className="w-12 rounded-t-lg bg-sky-400"
                style={{ height: `${Math.max(24, (value / maxValue) * 120)}px` }}
              />
              <div className="text-xs text-slate-400">{visual.labels?.[index] || `#${index + 1}`}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderSvg = () => {
    if (visual.kind === 'clock') {
      const minuteAngle = (visual.minute / 60) * Math.PI * 2 - Math.PI / 2;
      const hourAngle = (((visual.hour % 12) + visual.minute / 60) / 12) * Math.PI * 2 - Math.PI / 2;
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          <circle cx={cx} cy={cy} r="70" fill="#f8fafc" stroke="#0f172a" strokeWidth="4" />
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={cx + 56 * Math.cos(angle)}
                y1={cy + 56 * Math.sin(angle)}
                x2={cx + 66 * Math.cos(angle)}
                y2={cy + 66 * Math.sin(angle)}
                stroke="#0f172a"
                strokeWidth="3"
              />
            );
          })}
          <line x1={cx} y1={cy} x2={cx + 44 * Math.cos(hourAngle)} y2={cy + 44 * Math.sin(hourAngle)} stroke="#0f172a" strokeWidth="5" />
          <line x1={cx} y1={cy} x2={cx + 58 * Math.cos(minuteAngle)} y2={cy + 58 * Math.sin(minuteAngle)} stroke="#ef4444" strokeWidth="4" />
          <circle cx={cx} cy={cy} r="5" fill="#0f172a" />
        </svg>
      );
    }

    if (visual.kind === 'polygon') {
      const points = polygonPoints(visual.sides);
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          <polygon points={joinPoints(points)} fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
          {visual.showDiagonals ? points.slice(0, -2).map((point, index) => (
            <line key={index} x1={point.x} y1={point.y} x2={points[index + 2].x} y2={points[index + 2].y} stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="2" />
          )) : null}
          {visual.labels?.map((label, index) => points[index] ? (
            <text key={label + index} x={points[index].x} y={points[index].y - 10} textAnchor="middle" fill="#0f172a" fontSize="14" fontWeight="bold">
              {label}
            </text>
          ) : null)}
        </svg>
      );
    }

    if (visual.kind === 'angle') {
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          {visual.parallelLines ? (
            <>
              <line x1="50" y1="55" x2="230" y2="55" stroke="#94a3b8" strokeWidth="4" />
              <line x1="50" y1="145" x2="230" y2="145" stroke="#94a3b8" strokeWidth="4" />
            </>
          ) : null}
          <line x1="70" y1="150" x2="140" y2="100" stroke="#f8fafc" strokeWidth="5" />
          <line x1="140" y1="100" x2="220" y2="120" stroke="#f8fafc" strokeWidth="5" />
          <path d="M120 112 A24 24 0 0 1 162 109" fill="none" stroke="#38bdf8" strokeWidth="4" />
          {visual.rightAngleMark ? <path d="M128 106 L128 118 L140 118" fill="none" stroke="#38bdf8" strokeWidth="3" /> : null}
          <text x="150" y="92" fill="#e2e8f0" fontSize="16" fontWeight="bold">{visual.degrees}°</text>
          {visual.labels?.[0] ? placeText(102, 129, visual.labels[0], '#e2e8f0') : null}
          {visual.labels?.[1] ? placeText(189, 114, visual.labels[1], '#e2e8f0') : null}
        </svg>
      );
    }

    if (visual.kind === 'circle') {
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          <circle cx={cx} cy={cy} r="64" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
          {visual.showRadius ? <line x1={cx} y1={cy} x2={cx + 64} y2={cy} stroke="#38bdf8" strokeWidth="4" /> : null}
          {visual.showDiameter ? <line x1={cx - 64} y1={cy} x2={cx + 64} y2={cy} stroke="#38bdf8" strokeWidth="4" /> : null}
          {visual.showChord ? <line x1={cx - 45} y1={cy + 30} x2={cx + 45} y2={cy + 30} stroke="#f97316" strokeWidth="4" /> : null}
          {visual.centralAngle ? <text x="132" y="92" fill="#0f172a" fontSize="14">{visual.centralAngle}°</text> : null}
          {visual.inscribedAngle ? <text x="182" y="132" fill="#0f172a" fontSize="14">{visual.inscribedAngle}°</text> : null}
          {visual.labels?.[0] ? placeText(cx - 50, cy + 48, visual.labels[0]) : null}
          {visual.labels?.[1] ? placeText(cx + 50, cy + 48, visual.labels[1]) : null}
          {visual.labels?.[2] ? placeText(cx, cy - 70, visual.labels[2]) : null}
        </svg>
      );
    }

    if (visual.kind === 'cube' || visual.kind === 'prism' || visual.kind === 'cylinder' || visual.kind === 'pyramid' || visual.kind === 'cone') {
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          {visual.kind === 'cube' || visual.kind === 'prism' ? (
            <>
              <rect x="70" y="70" width="90" height="70" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
              <polygon
                points={visual.kind === 'cube' ? '110,45 200,45 200,115 110,115' : joinPoints(polygonPoints(visual.baseSides, 40).map((point) => ({ x: point.x + 35, y: point.y - 12 })))}
                fill="#cbd5e1"
                stroke="#0f172a"
                strokeWidth="4"
              />
              <line x1="70" y1="70" x2="110" y2="45" stroke="#0f172a" strokeWidth="4" />
              <line x1="160" y1="70" x2="200" y2="45" stroke="#0f172a" strokeWidth="4" />
              <line x1="160" y1="140" x2="200" y2="115" stroke="#0f172a" strokeWidth="4" />
              {visual.kind === 'cube' && visual.showHiddenEdges ? <line x1="110" y1="115" x2="110" y2="45" stroke="#64748b" strokeDasharray="5 4" strokeWidth="2" /> : null}
              {visual.labels?.[0] ? placeText(87, 64, visual.labels[0]) : null}
              {visual.labels?.[1] ? placeText(144, 64, visual.labels[1]) : null}
              {visual.labels?.[2] ? placeText(90, 156, visual.labels[2]) : null}
              {visual.labels?.[3] ? placeText(146, 156, visual.labels[3]) : null}
            </>
          ) : null}
          {visual.kind === 'cylinder' ? (
            <>
              {visual.showNet ? (
                <>
                  <rect x="60" y="65" width="120" height="70" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
                  <circle cx="120" cy="45" r="24" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
                  <circle cx="120" cy="155" r="24" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
                  <text x="120" y="185" textAnchor="middle" fill="#e2e8f0" fontSize="12">展開図</text>
                </>
              ) : (
                <>
                  <ellipse cx="140" cy="55" rx="48" ry="18" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
                  <path d="M92 55 V135" stroke="#0f172a" strokeWidth="4" fill="none" />
                  <path d="M188 55 V135" stroke="#0f172a" strokeWidth="4" fill="none" />
                  <ellipse cx="140" cy="135" rx="48" ry="18" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
                  {visual.showRadius ? <line x1="140" y1="55" x2="188" y2="55" stroke="#38bdf8" strokeWidth="4" /> : null}
                  {visual.showHeight ? <line x1="204" y1="55" x2="204" y2="135" stroke="#f97316" strokeWidth="4" /> : null}
                </>
              )}
            </>
          ) : null}
          {visual.kind === 'pyramid' ? (
            <>
              <polygon points={visual.baseSides === 4 ? '140,40 80,145 200,145' : '140,40 95,145 185,145'} fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
              <line x1="140" y1="40" x2="140" y2="145" stroke="#94a3b8" strokeDasharray="5 4" strokeWidth="2" />
            </>
          ) : null}
          {visual.kind === 'cone' ? (
            <>
              {visual.showNet ? (
                <>
                  <path d="M140 40 A80 80 0 0 1 215 120 L140 120 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
                  <circle cx="140" cy="152" r="22" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
                  <text x="140" y="184" textAnchor="middle" fill="#e2e8f0" fontSize="12">展開図</text>
                </>
              ) : (
                <>
                  <path d="M140 35 L90 145 L190 145 Z" fill="#e2e8f0" stroke="#0f172a" strokeWidth="4" />
                  <ellipse cx="140" cy="145" rx="50" ry="16" fill="#cbd5e1" stroke="#0f172a" strokeWidth="4" />
                  {visual.showRadius ? <line x1="140" y1="145" x2="190" y2="145" stroke="#38bdf8" strokeWidth="4" /> : null}
                  {visual.showHeight ? <line x1="140" y1="35" x2="140" y2="145" stroke="#f97316" strokeWidth="4" /> : null}
                </>
              )}
            </>
          ) : null}
        </svg>
      );
    }

    if (visual.kind === 'parabola') {
      const points = Array.from({ length: 41 }, (_, index) => {
        const x = -4 + index * 0.2;
        const y = visual.a * x * x;
        return `${140 + x * 24},${150 - y * 12}`;
      }).join(' ');
      return (
        <svg viewBox="0 0 280 200" className="w-full h-48">
          <line x1="20" y1="150" x2="260" y2="150" stroke="#94a3b8" strokeWidth="2" />
          <line x1="140" y1="20" x2="140" y2="180" stroke="#94a3b8" strokeWidth="2" />
          <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="4" />
          {typeof visual.markX === 'number' ? <circle cx={140 + visual.markX * 24} cy={150 - visual.a * visual.markX * visual.markX * 12} r="5" fill="#f97316" /> : null}
        </svg>
      );
    }

    return null;
  };

  const svg = renderSvg();
  if (!svg) return null;

  return <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800/70 p-4">{svg}</div>;
}
