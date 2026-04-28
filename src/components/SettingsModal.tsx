import React from 'react';
import { Settings, X, Volume2, Mic, Monitor, Wifi } from 'lucide-react';

export type BgmMode = 'STUDY' | 'MP3' | 'OSCILLATOR';
export type SettingsTab = 'AUDIO' | 'DISPLAY' | 'COMM';

export type AppSettings = {
  bgmMode: BgmMode;
  bgmVolume: number;
  seVolume: number;
  micEnabled: boolean;
  selectedInputDeviceId: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  remoteVoiceVolume: number;
  joinMuted: boolean;
  reduceScreenShake: boolean;
  fontSize: 'normal' | 'large';
  lowDataMode: boolean;
};

type Props = {
  open: boolean;
  tab: SettingsTab;
  settings: AppSettings;
  inputDevices: MediaDeviceInfo[];
  onClose: () => void;
  onChangeTab: (tab: SettingsTab) => void;
  onChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetAudio: () => void;
  onResetAll: () => void;
  isElectron?: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: (enabled: boolean) => void;
  onResetWindowState?: () => void;
  onQuitApp?: () => void;
  showCommunication?: boolean;
};

const tabs: Array<{ key: SettingsTab; label: string; icon: React.ReactNode }> = [
  { key: 'AUDIO', label: '音声', icon: <Volume2 size={14} /> },
  { key: 'DISPLAY', label: '表示', icon: <Monitor size={14} /> },
  { key: 'COMM', label: '通信', icon: <Wifi size={14} /> }
];

const SettingsModal: React.FC<Props> = ({
  open,
  tab,
  settings,
  inputDevices,
  onClose,
  onChangeTab,
  onChange,
  onResetAudio,
  onResetAll,
  isElectron = false,
  isFullScreen = false,
  onToggleFullScreen,
  onResetWindowState,
  onQuitApp,
  showCommunication = true
}) => {
  if (!open) return null;
  const visibleTabs = showCommunication ? tabs : tabs.filter(t => t.key !== 'COMM');

  return (
    <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-cyan-500/50 bg-slate-900 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h2 className="font-black flex items-center gap-2"><Settings size={16} /> セッティング</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700"><X size={16} /></button>
        </div>

        <div className="px-3 pt-3 flex gap-2 flex-wrap">
          {visibleTabs.map(t => (
            <button key={t.key} onClick={() => onChangeTab(t.key)} className={`px-3 py-1 rounded border text-xs font-bold flex items-center gap-1 ${tab === t.key ? 'bg-cyan-700 border-cyan-300' : 'bg-slate-800 border-slate-600'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4 text-sm">
          {tab === 'AUDIO' && (
            <>
              <div className="rounded border border-slate-700 p-3 space-y-2">
                <div className="font-bold">BGMモード</div>
                <div className="flex gap-2 flex-wrap">
                  {(['STUDY','MP3','OSCILLATOR'] as BgmMode[]).map(mode => (
                    <button key={mode} onClick={() => onChange('bgmMode', mode)} className={`px-3 py-1 rounded border ${settings.bgmMode === mode ? 'border-cyan-300 bg-cyan-700' : 'border-slate-600 bg-slate-800'}`}>{mode}</button>
                  ))}
                </div>
              </div>
              <label className="block">BGM音量: {Math.round(settings.bgmVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.bgmVolume * 100)} onChange={e => onChange('bgmVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="block">SE音量: {Math.round(settings.seVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.seVolume * 100)} onChange={e => onChange('seVolume', Number(e.target.value) / 100)} />
              </label>
              <div className="rounded border border-slate-700 p-3 space-y-2">
                <div className="font-bold flex items-center gap-1"><Mic size={14} /> マイク</div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.micEnabled} onChange={e => onChange('micEnabled', e.target.checked)} />マイクON</label>
                <label className="block">入力デバイス
                  <select className="w-full bg-slate-800 rounded border border-slate-600 p-1" value={settings.selectedInputDeviceId} onChange={e => onChange('selectedInputDeviceId', e.target.value)}>
                    <option value="">既定デバイス</option>
                    {inputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'マイク'}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.noiseSuppression} onChange={e => onChange('noiseSuppression', e.target.checked)} />ノイズ抑制</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.echoCancellation} onChange={e => onChange('echoCancellation', e.target.checked)} />エコーキャンセル</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.autoGainControl} onChange={e => onChange('autoGainControl', e.target.checked)} />自動ゲイン調整</label>
              </div>
            </>
          )}

          {tab === 'DISPLAY' && (
            <>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.reduceScreenShake} onChange={e => onChange('reduceScreenShake', e.target.checked)} />画面揺れ軽減</label>
              <label className="block">文字サイズ
                <select className="w-full bg-slate-800 rounded border border-slate-600 p-1" value={settings.fontSize} onChange={e => onChange('fontSize', e.target.value as AppSettings['fontSize'])}>
                  <option value="normal">標準</option><option value="large">大</option>
                </select>
              </label>
              {isElectron && (
                <div className="rounded border border-slate-700 p-3 space-y-2">
                  <div className="font-bold">スクリーン</div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={isFullScreen} onChange={e => onToggleFullScreen?.(e.target.checked)} />
                    フルスクリーン
                  </label>
                  <button onClick={onResetWindowState} className="px-3 py-1 text-xs rounded border border-slate-500 bg-slate-800 hover:bg-slate-700">
                    画面サイズを初期化
                  </button>
                </div>
              )}
            </>
          )}

          {showCommunication && tab === 'COMM' && (
            <>
              <label className="block">相手音量: {Math.round(settings.remoteVoiceVolume * 100)}%
                <input className="w-full" type="range" min={0} max={100} value={Math.round(settings.remoteVoiceVolume * 100)} onChange={e => onChange('remoteVoiceVolume', Number(e.target.value) / 100)} />
              </label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.joinMuted} onChange={e => onChange('joinMuted', e.target.checked)} />部屋参加時ミュート開始</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settings.lowDataMode} onChange={e => onChange('lowDataMode', e.target.checked)} />低データ通信モード</label>
            </>
          )}

        </div>

        <div className="sticky bottom-0 bg-slate-900/95 border-t border-slate-700 p-3 flex justify-between">
          <div className="flex gap-2">
            <button onClick={onResetAudio} className="px-3 py-1 text-xs rounded border border-amber-400/70 bg-amber-600/30">音声を初期化</button>
            <button onClick={onResetAll} className="px-3 py-1 text-xs rounded border border-red-400/70 bg-red-600/30">全設定を初期化</button>
            {isElectron && (
              <button onClick={onQuitApp} className="px-3 py-1 text-xs rounded border border-red-400/70 bg-red-900/50 hover:bg-red-800/70">
                ゲームをとじる
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-1 rounded bg-cyan-600 hover:bg-cyan-500 font-bold">閉じる</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
