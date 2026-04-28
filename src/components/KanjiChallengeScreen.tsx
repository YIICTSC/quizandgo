import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';
import { KANJI_DATA, KanjiProblem } from '../data/kanjiData';

interface KanjiChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

interface ExtendedKanjiProblem extends KanjiProblem {
  actualCorrectAnswer: string;
}

const KanjiChallengeScreen: React.FC<KanjiChallengeScreenProps> = ({ onComplete, mode, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<ExtendedKanjiProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  // 表記のゆらぎ（スペース、括弧内の補足、全角半角など）を排除して比較する関数
  const normalize = (s: string) => {
    if (!s) return "";
    return s
      .replace(/\（.*?\）|\(.*?\)/g, "") // （）や()の中身を削除
      .replace(/[\s　]+/g, "")           // 全角・半角スペースを削除
      .trim();
  };

  useEffect(() => {
    if (debugSkip) {
        onComplete(1); 
        return;
    }

    if (!isChallenge) {
        try {
            audioService.playBGM('math');
        } catch (e) {
            console.warn("BGM playback failed", e);
        }
    }

    let problemPool: KanjiProblem[];
    if (mode === GameMode.KANJI_MIXED) {
        problemPool = Object.values(KANJI_DATA).flat();
    } else {
        const gradeKey = mode as keyof typeof KANJI_DATA;
        problemPool = KANJI_DATA[gradeKey] || KANJI_DATA.KANJI_1;
    }
    
    const count = isChallenge ? 1 : 3;
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => {
            // 指示通り、options[0]を絶対的な正解として保持する
            const correctAnswer = p.options[0];
            return {
                ...p,
                actualCorrectAnswer: correctAnswer,
                // 表示用にはシャッフルした選択肢を渡す
                options: [...p.options].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    // 選択された文字列と、保持していた正解文字列を正規化して比較
    const isCorrect = normalize(option) === normalize(problems[currentProblemIndex].actualCorrectAnswer);
    
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      audioService.playSound('correct');
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
      
      const currentStreak = storageService.getHintStreaks()[mode] || 0;
      storageService.saveHintStreak(mode, currentStreak + 1);
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
      storageService.saveHintStreak(mode, 0);
    }

    setTimeout(() => {
      if (isChallenge) {
          onComplete(isCorrect ? 1 : 0);
      } else if (currentProblemIndex < problems.length - 1) {
        setCurrentProblemIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setFeedback(null);
      } else {
        onComplete(isCorrect ? correctCount + 1 : correctCount);
      }
    }, 1000);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-cyan-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex flex-col h-full w-full bg-cyan-950 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center">
            <div className="bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[260px]">
                {currentProblem.hint && (storageService.getHintStreaks()[mode] || 0) < 3 && (
                    <div className="bg-blue-900/40 p-2 rounded border border-blue-500/30 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-blue-300 font-bold mb-1">ヒント</div>
                        <div className="text-xs text-gray-200 leading-relaxed">{currentProblem.hint}</div>
                    </div>
                )}
                <div className="text-xs text-gray-400 mb-2">この漢字の読み方は？</div>
                <h3 className="text-7xl font-bold text-white tracking-widest font-serif">{currentProblem.question}</h3>
                
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in zoom-in duration-200">
                        {feedback === 'CORRECT' ? (
                            <CheckCircle size={120} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                        ) : (
                            <XCircle size={120} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                {currentProblem.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-4 text-xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && normalize(opt) === normalize(problems[currentProblemIndex].actualCorrectAnswer) ? 'bg-green-600 border-green-800 scale-105' : ''}
                            ${isAnswered && opt === selectedOption && normalize(opt) !== normalize(currentProblem.actualCorrectAnswer) ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-cyan-700 border-cyan-900 hover:bg-cyan-600 cursor-pointer' : 'opacity-80'}
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default KanjiChallengeScreen;
