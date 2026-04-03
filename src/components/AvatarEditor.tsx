import AvatarPreview from './AvatarPreview';
import {
  AVATAR_ACCESSORIES,
  AVATAR_ACCENT_COLORS,
  AVATAR_BODY_COLORS,
  AVATAR_EYES,
  AVATAR_HAIRS,
  AVATAR_LABELS,
  AVATAR_MOUTHS,
  AVATAR_SKIN_COLORS,
  AVATAR_SPECIES,
  AvatarConfig,
  createRandomAvatar,
} from '../avatar';

export default function AvatarEditor({
  avatar,
  onChange,
  compact = false,
}: {
  avatar: AvatarConfig;
  onChange: (avatar: AvatarConfig) => void;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-slate-600 bg-slate-700/50 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-white">あなたのアバター</div>
          <div className="text-[11px] text-slate-400">待ち時間に自由に作成できます</div>
        </div>
        <button
          onClick={() => onChange(createRandomAvatar())}
          className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-100 hover:bg-cyan-500/20"
        >
          ランダム
        </button>
      </div>
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-[96px_1fr]' : 'sm:grid-cols-[108px_1fr]'}`}>
        <div className="flex items-center justify-center">
          <AvatarPreview avatar={avatar} size={compact ? 84 : 96} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-300">
            本体色
            <select value={avatar.bodyColor} onChange={(e) => onChange({ ...avatar, bodyColor: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_BODY_COLORS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            差し色
            <select value={avatar.accentColor} onChange={(e) => onChange({ ...avatar, accentColor: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_ACCENT_COLORS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            肌の色
            <select value={avatar.skinColor} onChange={(e) => onChange({ ...avatar, skinColor: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_SKIN_COLORS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            どうぶつ
            <select value={avatar.speciesType} onChange={(e) => onChange({ ...avatar, speciesType: e.target.value as AvatarConfig['speciesType'] })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_SPECIES.map((value) => <option key={value} value={value}>{AVATAR_LABELS.speciesType[value]}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            目
            <select value={avatar.eyeType} onChange={(e) => onChange({ ...avatar, eyeType: e.target.value as AvatarConfig['eyeType'] })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_EYES.map((value) => <option key={value} value={value}>{AVATAR_LABELS.eyeType[value]}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            口
            <select value={avatar.mouthType} onChange={(e) => onChange({ ...avatar, mouthType: e.target.value as AvatarConfig['mouthType'] })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_MOUTHS.map((value) => <option key={value} value={value}>{AVATAR_LABELS.mouthType[value]}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            髪
            <select value={avatar.hairType} onChange={(e) => onChange({ ...avatar, hairType: e.target.value as AvatarConfig['hairType'] })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_HAIRS.map((value) => <option key={value} value={value}>{AVATAR_LABELS.hairType[value]}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-300">
            アクセサリ
            <select value={avatar.accessoryType} onChange={(e) => onChange({ ...avatar, accessoryType: e.target.value as AvatarConfig['accessoryType'] })} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white">
              {AVATAR_ACCESSORIES.map((value) => <option key={value} value={value}>{AVATAR_LABELS.accessoryType[value]}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

