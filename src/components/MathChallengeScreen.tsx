
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';

interface MathProblem {
  question: string;
  options: number[];
  answer: number;
}

const MathChallengeScreen: React.FC<MathChallengeScreenProps> = ({ onComplete, mode, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

  useEffect(() => {
    if (debugSkip) {
        onComplete(1); 
        return;
    }

    // チャレンジモード以外の場合のみ専用BGMを流す
    if (!isChallenge) {
        try {
            audioService.playBGM('math');
        } catch (e) {
            console.warn("BGM playback failed", e);
        }
    }

    const safeMode = mode || GameMode.MULTIPLICATION;
    const generatedProblems: MathProblem[] = [];
    // チャレンジモードなら1問、通常なら3問生成
    const count = isChallenge ? 1 : 3;

    for (let i = 0; i < count; i++) {
      let a, b, answer, operator;
      let type = safeMode;
      
      if (safeMode === GameMode.MIXED) {
          const types = [GameMode.ADDITION, GameMode.SUBTRACTION, GameMode.MULTIPLICATION, GameMode.DIVISION];
          type = types[Math.floor(Math.random() * types.length)];
      }

      switch (type) {
          case GameMode.ADD_1DIGIT:
              // 繰り上がりなし: a + b <= 9
              a = Math.floor(Math.random() * 8) + 1; // 1~8
              b = Math.floor(Math.random() * (9 - a)) + 1; // 1~(9-a)
              answer = a + b;
              operator = '+';
              break;
          case GameMode.ADD_1DIGIT_CARRY:
              // くりあがりあり: a + b >= 10
              a = Math.floor(Math.random() * 9) + 1;
              // bは 10-a 以上の数
              b = Math.floor(Math.random() * (9 - (10 - a) + 1)) + (10 - a);
              if (b < 1) b = 1; // セーフティ
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUB_1DIGIT:
              // くりさがりなし: 1ケタ同士で a >= b
              a = Math.floor(Math.random() * 9) + 1; // 1~9
              b = Math.floor(Math.random() * a) + 1; // 1~a
              answer = a - b;
              operator = '-';
              break;
          case GameMode.SUB_1DIGIT_BORROW:
              // くりさがりあり: 11-18 の数から 1-9 を引き、答えが1ケタ
              answer = Math.floor(Math.random() * 9) + 1; // 答えも1ケタ
              b = Math.floor(Math.random() * 9) + 1;
              a = answer + b;
              // 繰り下がりの定義として a が 10以上である必要がある
              if (a < 10) {
                // 再生成の代わりに補正
                a += 10;
                answer = a - b;
              }
              operator = '-';
              break;
          case GameMode.ADDITION:
              a = Math.floor(Math.random() * 40) + 10;
              b = Math.floor(Math.random() * 40) + 10;
              answer = a + b;
              operator = '+';
              break;
          case GameMode.SUBTRACTION:
              a = Math.floor(Math.random() * 50) + 20;
              b = Math.floor(Math.random() * (a - 10)) + 5;
              answer = a - b;
              operator = '-';
              break;
          case GameMode.DIVISION:
              b = Math.floor(Math.random() * 8) + 2;
              answer = Math.floor(Math.random() * 9) + 1;
              a = b * answer;
              operator = '÷';
              break;
          case GameMode.MULTIPLICATION:
          default:
              a = Math.floor(Math.random() * 9) + 1;
              b = Math.floor(Math.random() * 9) + 1;
              answer = a * b;
              operator = '×';
              break;
      }
      
      const options = new Set<number>();
      options.add(answer);
      while (options.size < 4) {
        let wrong = answer + (Math.floor(Math.random() * 10) - 5);
        if (wrong < 0) wrong = Math.floor(Math.random() * 20); 
        if (wrong !== answer) options.add(wrong);
      }
      
      generatedProblems.push({
        question: `${a} ${operator} ${b} = ?`,
        options: Array.from(options).sort(() => Math.random() - 0.5),
        answer: answer
      });
    }
    setProblems(generatedProblems);
  }, [mode, debugSkip, isChallenge]);

  const handleAnswer = (option: number) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
    const isCorrect = option === problems[currentProblemIndex].answer;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      audioService.playSound('correct');
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
    }

    setTimeout(() => {
      if (isChallenge) {
          // チャレンジモードは1問ごとに結果を返す（不正解なら0、正解なら1）
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
      <div className="flex flex-col h-full w-full bg-emerald-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];

  return (
    <div className="flex flex-col h-full w-full bg-emerald-950 text-white relative items-center justify-center p-8 font-mono">
        <div className="absolute inset-0 texture-blackboard opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center">
            <div className="bg-black/40 border-4 border-white p-8 rounded-lg mb-8 shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[160px]">
                <h3 className="text-5xl font-bold text-white tracking-widest font-mono">{currentProblem.question}</h3>
                
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
                            py-4 text-2xl font-bold rounded-lg border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isAnswered && opt === currentProblem.answer ? 'bg-green-600 border-green-800 scale-105' : ''}
                            ${isAnswered && opt === selectedOption && opt !== currentProblem.answer ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-blue-600 border-blue-800 hover:bg-blue-500 cursor-pointer' : 'opacity-80'}
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

export default MathChallengeScreen;
interface MathChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}
