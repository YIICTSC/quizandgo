import React from 'react';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { LanguageMode } from '../types';
import { getTypingLessonDefinition, TYPING_LESSON_DEFINITIONS, TypingLessonId } from '../data/typingLessonConfig';
import { storageService } from '../services/storageService';
import { trans } from '../utils/textUtils';

interface TypingModeSelectionScreenProps {
    selectedLessonId?: string;
    onSelect: (lessonId: TypingLessonId) => void;
    onBack: () => void;
    languageMode: LanguageMode;
}

const LESSON_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y'];

const tierColorMap: Record<string, string> = {
    BEGINNER: 'border-emerald-500 bg-emerald-950/50 text-emerald-200',
    BASIC: 'border-sky-500 bg-sky-950/50 text-sky-200',
    INTERMEDIATE: 'border-amber-500 bg-amber-950/50 text-amber-200',
    ADVANCED: 'border-fuchsia-500 bg-fuchsia-950/50 text-fuchsia-200',
    EXPERT: 'border-rose-500 bg-rose-950/50 text-rose-200',
};

const TypingModeSelectionScreen: React.FC<TypingModeSelectionScreenProps> = ({
    selectedLessonId,
    onSelect,
    onBack,
    languageMode
}) => {
    const [hoveredLessonId, setHoveredLessonId] = React.useState<string | undefined>(undefined);
    const current = getTypingLessonDefinition(hoveredLessonId ?? selectedLessonId);
    const weakKeys = React.useMemo(() => {
        const all = storageService.getTypingWeakKeys();
        return Object.entries(all[current.id] || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [current.id]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === '0') {
                e.preventDefault();
                onBack();
                return;
            }
            const index = LESSON_SHORTCUT_KEYS.indexOf(e.key.toLowerCase());
            if (index === -1) return;
            const lesson = TYPING_LESSON_DEFINITIONS[index];
            if (!lesson) return;
            e.preventDefault();
            onSelect(lesson.id);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSelect, onBack]);

    return (
        <div className="flex h-full w-full flex-col bg-slate-950 text-white">
            <div className="border-b border-slate-700 bg-black/60 px-4 py-3">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 rounded border border-slate-600 bg-slate-900/80 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800"
                    >
                        <ArrowLeft size={16} />
                        {trans('もどる', languageMode)}
                    </button>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-xl font-black text-amber-300">
                            <Keyboard size={20} />
                            {trans('タイピング内容選択', languageMode)}
                        </div>
                        <div className="text-xs text-slate-400">{trans('学習したい内容を選ぶと、この内容で冒険が進みます。', languageMode)}</div>
                    </div>
                    <div className="w-[92px]" />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="mx-auto grid h-full w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {TYPING_LESSON_DEFINITIONS.map((lesson) => {
                            const isSelected = lesson.id === current.id;
                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => onSelect(lesson.id)}
                                    onMouseEnter={() => setHoveredLessonId(lesson.id)}
                                    onFocus={() => setHoveredLessonId(lesson.id)}
                                    className={`rounded-2xl border-2 p-4 text-left transition-all ${isSelected ? 'border-yellow-300 bg-yellow-900/20 shadow-[0_0_24px_rgba(253,224,71,0.18)]' : 'border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800'}`}
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <div className="text-lg font-black text-white">{trans(lesson.title, languageMode)}</div>
                                        <div className="flex items-center gap-2">
                                            {LESSON_SHORTCUT_KEYS[TYPING_LESSON_DEFINITIONS.findIndex(item => item.id === lesson.id)] && (
                                                <div className="rounded-full border border-cyan-300 bg-cyan-950/95 px-2 py-0.5 text-[10px] font-black text-cyan-200">
                                                    {LESSON_SHORTCUT_KEYS[TYPING_LESSON_DEFINITIONS.findIndex(item => item.id === lesson.id)]}
                                                </div>
                                            )}
                                            <div className={`rounded border px-2 py-0.5 text-[10px] font-black ${tierColorMap[lesson.category]}`}>{lesson.category}</div>
                                        </div>
                                    </div>
                                    <div className="mb-3 text-sm text-slate-300">{trans(lesson.description, languageMode)}</div>
                                    <div className="flex flex-wrap gap-1">
                                        {lesson.stages.map((stage) => (
                                            <span key={stage} className="rounded border border-slate-600 bg-slate-950/70 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                                                {trans(stage, languageMode)}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                        <div className="mb-2 text-xs font-black tracking-[0.2em] text-slate-400">SELECTED LESSON</div>
                        <div className="mb-3 text-2xl font-black text-amber-300">{trans(current.title, languageMode)}</div>
                        <div className="mb-4 text-sm leading-relaxed text-slate-300">{trans(current.description, languageMode)}</div>
                        <div className="mb-3 text-xs font-black tracking-[0.2em] text-slate-400">LEVEL DESIGN</div>
                        <div className="space-y-2">
                            {current.stages.map((stage, index) => (
                                <div key={stage} className="flex items-center gap-3 rounded border border-slate-700 bg-slate-950/70 px-3 py-2">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-yellow-500 bg-yellow-900/30 text-xs font-black text-yellow-300">
                                        {index + 1}
                                    </div>
                                    <div className="text-sm font-bold text-slate-200">{trans(stage, languageMode)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mb-3 mt-5 text-xs font-black tracking-[0.2em] text-slate-400">RECENT FOCUS</div>
                        <div className="flex flex-wrap gap-2">
                            {weakKeys.length > 0 ? weakKeys.map(([char, count]) => (
                                <div key={char} className="rounded border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-xs font-bold text-amber-200">
                                    {char} x{count}
                                </div>
                            )) : (
                                <div className="rounded border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-500">
                                    {trans('まだ重点練習はありません', languageMode)}
                                </div>
                            )}
                        </div>
                        <div className="mt-5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-100">
                            {trans('初心者はホームポジション・アルファベットから、慣れたらローマ字・短文・総合へ進めます。進行に応じて1文字から長文まで段階的に広がります。', languageMode)}
                        </div>
                        <div className="mt-3 text-xs font-bold text-cyan-300">1-9, QWERTY: 選択 / 0 or Esc: もどる</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypingModeSelectionScreen;
