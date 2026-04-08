import { useCallback, useEffect, useMemo, useState } from 'react';
import ProblemVisual from './ProblemVisual';
import { playCorrectSound, playIncorrectSound, startBGM, stopBGM } from '../lib/sound';
import { shuffleOptionsWithFirstCorrect } from '../lib/answerMatching';

type QuizDrillerQuestion = {
  question: string;
  answer: string;
  options: string[];
  hint?: string;
  visual?: any;
};

type TunnelBlock = {
  id: string;
  label: string;
  depthGain: number;
  oxygenDelta: number;
  risk: 'safe' | 'normal' | 'danger';
};

const BLOCK_POOL: TunnelBlock[] = [
  { id: 'soil', label: 'やわらかい土', depthGain: 4, oxygenDelta: -4, risk: 'safe' },
  { id: 'sand', label: '砂層', depthGain: 5, oxygenDelta: -5, risk: 'safe' },
  { id: 'rock', label: '岩盤', depthGain: 7, oxygenDelta: -9, risk: 'normal' },
  { id: 'crystal', label: '結晶鉱脈', depthGain: 10, oxygenDelta: -12, risk: 'danger' },
  { id: 'air', label: '酸素ポケット', depthGain: 3, oxygenDelta: 12, risk: 'safe' },
  { id: 'fossil', label: '化石ゾーン', depthGain: 6, oxygenDelta: -7, risk: 'normal' },
];

const riskClass: Record<TunnelBlock['risk'], string> = {
  safe: 'border-emerald-400/70 bg-emerald-500/15',
  normal: 'border-amber-400/70 bg-amber-500/15',
  danger: 'border-rose-400/70 bg-rose-500/15',
};

const modeLabelMap: Record<string, string> = {
  mix: 'ミックス',
  add: 'たし算',
  sub: 'ひき算',
  mul: 'かけ算',
  div: 'わり算',
  custom: '単元クイズ',
};

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const buildMathQuestion = (mode: string): QuizDrillerQuestion => {
  const resolvedMode =
    mode === 'mix' ? (['add', 'sub', 'mul', 'div'][Math.floor(Math.random() * 4)] as string) : mode;

  let a = 0;
  let b = 0;
  let answer = 0;
  let text = '';

  switch (resolvedMode) {
    case 'sub':
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * a);
      answer = a - b;
      text = `${a} - ${b} = ?`;
      break;
    case 'mul':
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
      text = `${a} × ${b} = ?`;
      break;
    case 'div':
      b = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 9) + 2;
      a = b * answer;
      text = `${a} ÷ ${b} = ?`;
      break;
    case 'add':
    default:
      a = Math.floor(Math.random() * 30) + 1;
      b = Math.floor(Math.random() * 30) + 1;
      answer = a + b;
      text = `${a} + ${b} = ?`;
      break;
  }

  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 13) - 6;
    if (offset !== 0 && answer + offset >= 0) {
      options.add(answer + offset);
    }
  }

  return {
    question: text,
    answer: String(answer),
    options: shuffle(Array.from(options).map(String)),
  };
};

export default function SingleQuizDrillerScreen({
  questions,
  mode,
  timeLimit,
  gameTitle,
  onReturnToTitle,
}: {
  questions?: QuizDrillerQuestion[];
  mode: string;
  timeLimit: number;
  gameTitle: string;
  onReturnToTitle: () => void;
}) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [depth, setDepth] = useState(0);
  const [oxygen, setOxygen] = useState(100);
  const [combo, setCombo] = useState(0);
  const [digCount, setDigCount] = useState(0);
  const [question, setQuestion] = useState<QuizDrillerQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<boolean | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [needQuizCheckpoint, setNeedQuizCheckpoint] = useState(true);
  const [laneChoices, setLaneChoices] = useState<TunnelBlock[]>(() => shuffle(BLOCK_POOL).slice(0, 3));

  const gameEnded = timeRemaining <= 0 || oxygen <= 0;

  const score = useMemo(
    () => Math.max(0, Math.floor(depth * 15 + oxygen * 4 + combo * 25)),
    [depth, oxygen, combo]
  );

  const pickQuestion = useCallback(() => {
    if (mode === 'custom' && questions?.length) {
      const source = questions[Math.floor(Math.random() * questions.length)];
      const { correctAnswer, shuffledOptions } = shuffleOptionsWithFirstCorrect(source.options, source.answer);
      return {
        ...source,
        answer: correctAnswer,
        options: shuffledOptions,
      };
    }
    return buildMathQuestion(mode);
  }, [mode, questions]);

  const prepareQuizCheckpoint = useCallback(() => {
    setQuestion(pickQuestion());
    setAnswerResult(null);
    setSelectedIndex(null);
    setNeedQuizCheckpoint(true);
  }, [pickQuestion]);

  useEffect(() => {
    startBGM('play');
    prepareQuizCheckpoint();

    const timer = window.setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          stopBGM();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
      stopBGM();
    };
  }, [prepareQuizCheckpoint]);

  const applyDigResult = (block: TunnelBlock) => {
    if (gameEnded || needQuizCheckpoint) return;

    const comboBonus = Math.min(5, Math.floor(combo / 2));
    const gainedDepth = block.depthGain + comboBonus;
    const nextDigCount = digCount + 1;

    setDepth((current) => current + gainedDepth);
    setOxygen((current) => Math.max(0, Math.min(100, current + block.oxygenDelta)));
    setCombo((current) => {
      if (block.id === 'air') return 0;
      if (block.risk === 'danger') return current + 2;
      return current + 1;
    });
    setDigCount(nextDigCount);
    setLaneChoices(shuffle(BLOCK_POOL).slice(0, 3));

    if (nextDigCount % 3 === 0) {
      prepareQuizCheckpoint();
    }
  };

  const submitAnswer = (option: string, index: number) => {
    if (!question || answerResult !== null || gameEnded) return;

    setSelectedIndex(index);
    const correct = option === question.answer;
    setAnswerResult(correct);

    if (correct) {
      playCorrectSound();
      setNeedQuizCheckpoint(false);
      setCombo((current) => current + 1);
      setOxygen((current) => Math.min(100, current + 8));
      window.setTimeout(() => {
        setQuestion(null);
        setAnswerResult(null);
      }, 500);
    } else {
      playIncorrectSound();
      setCombo(0);
      setOxygen((current) => Math.max(0, current - 12));
      window.setTimeout(() => {
        prepareQuizCheckpoint();
      }, 900);
    }
  };

  const gradeText = modeLabelMap[mode] || 'ドリルクイズ';

  return (
    <div className="min-h-screen bg-slate-900 p-4 text-white md:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="rounded-3xl border border-cyan-400/40 bg-slate-800/90 p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-cyan-200 md:text-3xl">{gameTitle}</h1>
              <p className="text-sm text-slate-300">掘って進み、チェックポイントのクイズに正解して深層を目指そう！</p>
            </div>
            <button
              onClick={onReturnToTitle}
              className="rounded-xl border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-bold text-white hover:bg-slate-600"
            >
              タイトルへ戻る
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatusCard label="残り時間" value={`${Math.floor(timeRemaining / 60)}:${String(timeRemaining % 60).padStart(2, '0')}`} />
            <StatusCard label="深度" value={`${depth}m`} />
            <StatusCard label="酸素" value={`${oxygen}%`} valueClass={oxygen <= 25 ? 'text-rose-300' : 'text-cyan-100'} />
            <StatusCard label="コンボ" value={`${combo}`} />
            <StatusCard label="スコア" value={`${score}`} />
          </div>
        </header>

        <main className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-700 bg-slate-800/80 p-5">
            <h2 className="mb-3 text-lg font-bold text-white">採掘ルート選択</h2>
            <p className="mb-4 text-sm text-slate-300">
              3つのルートから進む道を選択。危険な層ほど深く掘れますが、酸素消費が激しくなります。
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              {laneChoices.map((block) => (
                <button
                  key={`${block.id}-${block.label}`}
                  disabled={needQuizCheckpoint || gameEnded}
                  onClick={() => applyDigResult(block)}
                  className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${riskClass[block.risk]} hover:scale-[1.02]`}
                >
                  <div className="text-sm font-bold text-white">{block.label}</div>
                  <div className="mt-2 text-xs text-slate-200">深度 +{block.depthGain}m</div>
                  <div className="text-xs text-slate-200">酸素 {block.oxygenDelta > 0 ? '+' : ''}{block.oxygenDelta}%</div>
                  <div className="mt-2 text-[11px] text-slate-300">危険度: {block.risk === 'safe' ? '低' : block.risk === 'normal' ? '中' : '高'}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-200">
              {gameEnded
                ? 'ゲーム終了！最終スコアを確認して、もう一度挑戦しよう。'
                : needQuizCheckpoint
                ? 'クイズチェックポイント中：正解すると採掘再開！'
                : `採掘中（${digCount}回）: 次のチェックポイントまで ${3 - (digCount % 3 || 3)} 掘削`}
            </div>
          </section>

          <section className="rounded-3xl border border-indigo-400/30 bg-indigo-500/10 p-5">
            <h2 className="mb-1 text-lg font-bold text-indigo-100">チェックポイントクイズ</h2>
            <p className="mb-4 text-xs text-indigo-200/80">出題タイプ: {gradeText}</p>

            {question ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-300/30 bg-slate-900/50 p-4">
                  <p className="text-base font-bold text-white">{question.question}</p>
                  {question.hint ? (
                    <p className="mt-2 text-xs text-indigo-100/80">ヒント: {question.hint}</p>
                  ) : null}
                  {question.visual ? (
                    <div className="mt-3">
                      <ProblemVisual visual={question.visual} />
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  {question.options.map((option, index) => {
                    const isCorrectOption = option === question.answer;
                    const selected = index === selectedIndex;
                    const revealCorrect = answerResult !== null && isCorrectOption;
                    const revealWrong = answerResult === false && selected;

                    return (
                      <button
                        key={`${option}-${index}`}
                        onClick={() => submitAnswer(option, index)}
                        disabled={answerResult !== null || gameEnded}
                        className={`rounded-xl border px-4 py-3 text-left font-bold transition ${
                          revealCorrect
                            ? 'border-emerald-300 bg-emerald-500/30 text-emerald-100'
                            : revealWrong
                            ? 'border-rose-300 bg-rose-500/30 text-rose-100'
                            : 'border-indigo-300/30 bg-slate-800 text-white hover:bg-indigo-500/20'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/15 p-4 text-sm text-emerald-100">
                クイズ突破！掘削ルートを選んで深層へ進もう。
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatusCard({ label, value, valueClass = 'text-cyan-100' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/60 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}
