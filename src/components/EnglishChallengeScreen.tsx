
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';
import { ENGLISH_DATA, EnglishProblem } from '../data/englishData';

interface EnglishChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

interface ExtendedEnglishProblem extends EnglishProblem {
  actualCorrectAnswer: string;
}

const EnglishChallengeScreen: React.FC<EnglishChallengeScreenProps> = ({ onComplete, mode, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<ExtendedEnglishProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  
  // Voice feature control
  const [voiceEnabled, setVoiceEnabled] = useState(() => storageService.getEnglishVoiceEnabled());

  const normalize = (s: string) => {
    if (!s) return "";
    return s
      .replace(/\（.*?\）|\(.*?\)/g, "") // 括弧削除
      .replace(/[\s　]+/g, "")           // 空白削除
      .toLowerCase()                     // 英語は小文字に統一
      .trim();
  };

  const speakWord = useCallback((word: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleVoice = () => {
    const newVal = !voiceEnabled;
    setVoiceEnabled(newVal);
    storageService.saveEnglishVoiceEnabled(newVal);
    if (!newVal) {
      window.speechSynthesis.cancel();
    }
    audioService.playSound('select');
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

    let problemPool: EnglishProblem[];
    if (mode === GameMode.ENGLISH_MIXED) {
        problemPool = Object.values(ENGLISH_DATA).flat();
    } else {
        const key = mode as keyof typeof ENGLISH_DATA;
        problemPool = ENGLISH_DATA[key] || ENGLISH_DATA.ENGLISH_ES;
    }
    
    const count = isChallenge ? 1 : 3;
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => {
            // インデックス0を正解として保持
            const correctAnswer = p.options[0];
            return {
                ...p,
                actualCorrectAnswer: correctAnswer,
                options: [...p.options].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, debugSkip, isChallenge]);

  useEffect(() => {
    if (problems.length > 0 && !isAnswered && voiceEnabled) {
      const timer = setTimeout(() => {
        speakWord(problems[currentProblemIndex].question);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentProblemIndex, problems, speakWord, isAnswered, voiceEnabled]);

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);
    
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
    }, 1200);
  };

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;
  if (problems.length === 0) return (
      <div className="flex flex-col h-full w-full bg-indigo-950 text-white items-center justify-center p-8 font-mono">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  const currentProblem = problems[currentProblemIndex];
  const isConv = currentProblem.isDialogue;

  return (
    <div className="flex flex-col h-full w-full bg-indigo-950 text-white relative items-center justify-center p-4 md:p-8 font-mono">
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
        
        {/* Header with Voice Toggle */}
        <div className="absolute top-4 right-4 z-50">
            <button 
              onClick={toggleVoice}
              className={`p-2 rounded-full border transition-all ${voiceEnabled ? 'bg-cyan-600 border-cyan-300 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
              title={voiceEnabled ? '音声読み上げをオフにする' : '音声読み上げをオンにする'}
            >
              {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>

        <div className="z-10 w-full max-w-md text-center flex flex-col">
            <div className="bg-black/40 border-4 border-white p-4 md:p-6 rounded-2xl mb-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[200px] md:min-h-[300px]">
                {currentProblem.hint && (storageService.getHintStreaks()[mode] || 0) < 3 && (
                    <div className="bg-indigo-800/60 p-2 rounded-lg border border-indigo-400/30 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[9px] text-cyan-300 font-bold mb-0.5 uppercase tracking-tighter text-left">Hint</div>
                        <div className="text-[11px] md:text-xs text-gray-100 leading-relaxed text-left">{currentProblem.hint}</div>
                    </div>
                )}
                
                <div className="text-[10px] text-gray-400 mb-3 uppercase tracking-widest">
                  {isConv ? "Listen and Reply" : "Translation"}
                </div>

                {isConv ? (
                  <div 
                    className="relative bg-white text-black p-4 md:p-5 rounded-3xl rounded-bl-none border-4 border-cyan-400 max-w-[95%] group cursor-pointer transition-transform active:scale-95 shadow-xl"
                    onClick={() => speakWord(currentProblem.question)}
                  >
                     <div className="text-base md:text-xl font-bold font-sans italic text-left pr-6 leading-tight">
                        "{currentProblem.question}"
                     </div>
                     <Volume2 size={18} className="absolute top-2 right-2 text-cyan-600 opacity-50 group-hover:opacity-100" />
                     <div className="absolute -bottom-4 left-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-white"></div>
                  </div>
                ) : (
                  <div 
                    className="group cursor-pointer relative flex flex-col items-center"
                    onClick={() => speakWord(currentProblem.question)}
                  >
                    <h3 className="text-4xl md:text-6xl font-bold text-white tracking-widest font-sans italic transition-transform group-active:scale-95 break-words max-w-full">
                      {currentProblem.question}
                    </h3>
                    <Volume2 size={24} className="text-cyan-400 mt-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
                
                {feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 animate-in zoom-in duration-200">
                        {feedback === 'CORRECT' ? (
                            <CheckCircle size={100} className="text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                        ) : (
                            <XCircle size={100} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                        )}
                    </div>
                )}
            </div>

            <div className={`grid ${isConv ? 'grid-cols-1' : 'grid-cols-2'} gap-2 md:gap-4`}>
                {currentProblem.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-2.5 px-4 font-bold rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${isConv ? 'text-left text-[13px] md:text-base' : 'text-center text-base md:text-lg'}
                            ${isAnswered && normalize(opt) === normalize(currentProblem.actualCorrectAnswer) ? 'bg-green-600 border-green-800 scale-102' : ''}
                            ${isAnswered && opt === selectedOption && normalize(opt) !== normalize(currentProblem.actualCorrectAnswer) ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-indigo-700 border-indigo-900 hover:bg-indigo-600 cursor-pointer' : 'opacity-80'}
                            break-words leading-tight shadow-lg
                        `}
                    >
                        {isConv && <span className="text-cyan-300 mr-2">▶</span>}
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default EnglishChallengeScreen;
