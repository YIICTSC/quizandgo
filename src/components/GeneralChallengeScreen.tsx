
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, XCircle, Volume2, Mic } from 'lucide-react';
import { audioService } from '../services/audioService';
import { GameMode } from '../types';
import { storageService } from '../services/storageService';
import { SUBJECT_DATA, GeneralProblem } from '../data/subjectData';
import { MAP_SYMBOL_ASSET_MAP } from './mapSymbolImageMap';

interface GeneralChallengeScreenProps {
  onComplete: (correctCount: number) => void;
  mode: GameMode;
  modePool?: string[];
  onModeCorrect?: (mode: string, correctCount: number) => void;
  debugSkip?: boolean;
  isChallenge?: boolean;
  streak?: number;
}

// 内部的に正解を保持するための拡張型
interface ExtendedGeneralProblem extends GeneralProblem {
  actualCorrectAnswer: string;
  sourceMode: string;
}

type BrowserSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  }
}

// 教科に応じた背景色の取得
const getBackgroundClass = (mode: string) => {
    if (mode.startsWith('MATH')) return 'bg-emerald-950';
    if (mode.startsWith('ENGLISH')) return 'bg-indigo-950';
    if (mode.startsWith('SCIENCE') || mode.startsWith('LIFE')) return 'bg-amber-950';
    if (mode.startsWith('SOCIAL') || mode.includes('GEOGRAPHY') || mode.includes('HISTORY') || mode.includes('CIVICS')) return 'bg-orange-950';
    if (mode.startsWith('MAP_') || mode.startsWith('PREF_') || mode.startsWith('PREFECTURES')) return 'bg-rose-950';
    if (mode.startsWith('IT_')) return 'bg-indigo-950'; // ICT系はインディゴ
    return 'bg-slate-900';
};

const isEnglishReviewMode = (mode: string) =>
  /^ENGLISH_G[3-6]_U(11|12|13|14)$/.test(mode) ||
  /^ENGLISH_G7_U(13|14|15|16)$/.test(mode) ||
  /^ENGLISH_G8_U(10|11|12|13)$/.test(mode) ||
  /^ENGLISH_G9_U(11|12|13|14)$/.test(mode);

const isEnglishSpeakingReviewMode = (mode: string) =>
  /^ENGLISH_G[3-6]_U(12|13|14)$/.test(mode) ||
  /^ENGLISH_G7_U(14|15|16)$/.test(mode) ||
  /^ENGLISH_G8_U(11|12|13)$/.test(mode) ||
  /^ENGLISH_G9_U(12|13|14)$/.test(mode);

const GeneralChallengeScreen: React.FC<GeneralChallengeScreenProps> = ({ onComplete, mode, modePool, onModeCorrect, debugSkip, isChallenge, streak = 0 }) => {
  const [problems, setProblems] = useState<ExtendedGeneralProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const visualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [mapSymbolImageFailed, setMapSymbolImageFailed] = useState(false);
  const currentProblem = problems[currentProblemIndex];
  const mapSymbolAsset =
    currentProblem?.visual?.kind === 'map_symbol'
      ? MAP_SYMBOL_ASSET_MAP[currentProblem.visual.symbol]
      : undefined;

  const canonicalizeEnglishNumbers = (value: string) => {
    const smallNumberWords: Record<string, number> = {
      zero: 0,
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
      thirteen: 13,
      fourteen: 14,
      fifteen: 15,
      sixteen: 16,
      seventeen: 17,
      eighteen: 18,
      nineteen: 19,
    };
    const tensNumberWords: Record<string, number> = {
      twenty: 20,
      thirty: 30,
      forty: 40,
      fifty: 50,
      sixty: 60,
      seventy: 70,
      eighty: 80,
      ninety: 90,
    };
    const tokens = String(value || '')
      .replace(/-/g, ' ')
      .match(/\d+|[a-zA-Z]+|[^\s]/g);

    if (!tokens) return String(value || '');

    const normalizedTokens: string[] = [];

    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      const lower = token.toLowerCase();

      if (/^\d+$/.test(token)) {
        normalizedTokens.push(token);
        continue;
      }

      if (!(lower in smallNumberWords) && !(lower in tensNumberWords) && lower !== 'hundred' && lower !== 'thousand') {
        normalizedTokens.push(token);
        continue;
      }

      let total = 0;
      let current = 0;
      let consumed = 0;

      for (let j = i; j < tokens.length; j += 1) {
        const part = tokens[j].toLowerCase();
        if (part in smallNumberWords) {
          current += smallNumberWords[part];
          consumed += 1;
          continue;
        }
        if (part in tensNumberWords) {
          current += tensNumberWords[part];
          consumed += 1;
          continue;
        }
        if (part === 'hundred') {
          current = Math.max(1, current) * 100;
          consumed += 1;
          continue;
        }
        if (part === 'thousand') {
          total += Math.max(1, current) * 1000;
          current = 0;
          consumed += 1;
          continue;
        }
        break;
      }

      if (consumed > 0) {
        normalizedTokens.push(String(total + current));
        i += consumed - 1;
        continue;
      }

      normalizedTokens.push(token);
    }

    return normalizedTokens.join(' ');
  };

  const normalize = (s: string) => {
    if (!s) return "";
    return canonicalizeEnglishNumbers(s)
      .replace(/’/g, "'")
      .replace(/\bI'm\b/gi, 'I am')
      .replace(/\byou're\b/gi, 'you are')
      .replace(/\bhe's\b/gi, 'he is')
      .replace(/\bshe's\b/gi, 'she is')
      .replace(/\bit's\b/gi, 'it is')
      .replace(/\bwe're\b/gi, 'we are')
      .replace(/\bthey're\b/gi, 'they are')
      .replace(/\bI've\b/gi, 'I have')
      .replace(/\bwe've\b/gi, 'we have')
      .replace(/\bthey've\b/gi, 'they have')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bdoesn't\b/gi, 'does not')
      .replace(/\bdidn't\b/gi, 'did not')
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bwouldn't\b/gi, 'would not')
      .replace(/\（.*?\）|\(.*?\)/g, "") // 括弧削除
      .replace(/[\s　]+/g, "")           // 空白削除
      .replace(/[.,!?'"`:-]/g, '')
      .toLowerCase()
      .trim();
  };

  const matchesSpeechPrompt = useCallback((transcript: string, speechPrompt: NonNullable<GeneralProblem['speechPrompt']>) => {
    const normalizedTranscript = normalize(transcript);
    const answers = [
      speechPrompt.expected,
      ...(speechPrompt.alternates || []),
    ];
    const exactMatch = answers.some((answer) => {
      const normalizedAnswer = normalize(answer);
      return normalizedTranscript.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedTranscript);
    });
    if (exactMatch) return true;

    if (speechPrompt.keywords && speechPrompt.keywords.length > 0) {
      const hits = speechPrompt.keywords.filter((keyword) => normalizedTranscript.includes(normalize(keyword))).length;
      const requiredHits = speechPrompt.minKeywordHits || speechPrompt.keywords.length;
      if (hits >= requiredHits) return true;
    }

    return false;
  }, []);

  const speakPrompt = useCallback((text: string, lang = 'ja-JP') => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.82;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, []);

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

    let problemPool: Array<GeneralProblem & { sourceMode: string }> = [];
    if (modePool && modePool.length > 0) {
      problemPool = modePool.flatMap((m) => (SUBJECT_DATA[m] || []).map((p) => ({ ...p, sourceMode: m })));
    } else {
      problemPool = (SUBJECT_DATA[mode] || []).map((p) => ({ ...p, sourceMode: mode }));
    }
    if (problemPool.length === 0) {
      problemPool = SUBJECT_DATA.MAP_SYMBOLS.map((p) => ({ ...p, sourceMode: 'MAP_SYMBOLS' }));
    }
    
    const count = isChallenge ? 1 : (isEnglishReviewMode(mode) ? problemPool.length : 3);
    const shuffled = [...problemPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(p => {
            // 指示通り、options[0]を絶対的な正解として保持する
            const correctAnswer = p.options[0];
            return {
                ...p,
                actualCorrectAnswer: correctAnswer,
                options: [...p.options].sort(() => Math.random() - 0.5)
            };
        });
        
    setProblems(shuffled);
  }, [mode, modePool, debugSkip, isChallenge]);

  const attemptedCount = currentProblemIndex + (isAnswered ? 1 : 0);
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  useEffect(() => {
    if (!currentProblem?.audioPrompt || isAnswered) return;
    if (currentProblem.audioPrompt.autoPlay === false) return;
    const timer = window.setTimeout(() => {
      speakPrompt(currentProblem.audioPrompt!.text, currentProblem.audioPrompt!.lang || 'ja-JP');
    }, 500);
    return () => window.clearTimeout(timer);
  }, [currentProblemIndex, currentProblem?.audioPrompt?.text, currentProblem?.audioPrompt?.lang, currentProblem?.audioPrompt?.autoPlay, isAnswered, speakPrompt]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    setSpeechTranscript('');
    setSpeechError('');
    setIsListening(false);
    setMapSymbolImageFailed(false);
  }, [currentProblemIndex]);

  const submitAnswerResult = useCallback((isCorrect: boolean, selected: string) => {
    if (isAnswered) return;

    setSelectedOption(selected);
    setIsAnswered(true);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback('CORRECT');
      audioService.playSound('correct');
      onModeCorrect?.(problems[currentProblemIndex].sourceMode, 1);
      const currentTotal = storageService.getMathCorrectCount();
      storageService.saveMathCorrectCount(currentTotal + 1);
      
      const currentStreak = storageService.getHintStreaks()[problems[currentProblemIndex].sourceMode] || 0;
      storageService.saveHintStreak(problems[currentProblemIndex].sourceMode, currentStreak + 1);
    } else {
      setFeedback('WRONG');
      audioService.playSound('wrong');
      storageService.saveHintStreak(problems[currentProblemIndex].sourceMode, 0);
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
  }, [correctCount, currentProblemIndex, isAnswered, isChallenge, onComplete, onModeCorrect, problems]);

  const handleAnswer = (option: string) => {
    const isCorrect = normalize(option) === normalize(problems[currentProblemIndex].actualCorrectAnswer);
    submitAnswerResult(isCorrect, option);
  };

  const startSpeechRecognition = useCallback(() => {
    if (!currentProblem?.speechPrompt || isAnswered || isListening) return;
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setSpeechError('このブラウザでは はつわ判定が つかえません');
      return;
    }

    setSpeechError('');
    setSpeechTranscript('');

    const recognition = new RecognitionCtor();
    recognition.lang = currentProblem.speechPrompt.lang || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onresult = (event) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || '').trim();
      setSpeechTranscript(transcript);
      const isCorrect = matchesSpeechPrompt(transcript, currentProblem.speechPrompt!);
      submitAnswerResult(isCorrect, transcript || currentProblem.speechPrompt!.expected);
    };
    recognition.onerror = () => {
      setSpeechError('うまく ききとれませんでした');
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [currentProblem, isAnswered, isListening, submitAnswerResult]);

  useEffect(() => {
    const canvas = visualCanvasRef.current;
    const visual = currentProblem?.visual;
    if (!canvas || !visual) return;
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;

      if (visual.kind === 'map_symbol') {
        const cx = w / 2;
        const cy = h / 2;
        const stroke = '#111827';
        const fill = '#111827';
        const line = (x1: number, y1: number, x2: number, y2: number, width = 5) => {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        };
        const circle = (r: number, width = 5, filled = false) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          if (filled) {
            ctx.fillStyle = fill;
            ctx.fill();
          } else {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        };
        const text = (value: string, size = 52, y = cy + 18) => {
          ctx.fillStyle = fill;
          ctx.font = `bold ${size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, cx, y);
        };

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = stroke;
        ctx.fillStyle = fill;

        switch (visual.symbol) {
          case 'city_office':
            circle(42, 5);
            circle(22, 5);
            break;
          case 'town_office':
            circle(36, 5);
            break;
          case 'school':
            text('文', 64, cy + 8);
            break;
          case 'post_office':
          case 'post_office_round':
            if (visual.symbol === 'post_office_round') {
              circle(40, 5);
            }
            text('〒', 58, cy + 8);
            break;
          case 'temple':
            text('卍', 58, cy + 8);
            break;
          case 'shrine':
            line(cx - 34, cy - 22, cx + 34, cy - 22, 6);
            line(cx - 28, cy - 4, cx + 28, cy - 4, 6);
            line(cx - 18, cy - 22, cx - 18, cy + 34, 6);
            line(cx + 18, cy - 22, cx + 18, cy + 34, 6);
            break;
          case 'police_box':
            line(cx - 24, cy - 24, cx + 24, cy + 24, 6);
            line(cx + 24, cy - 24, cx - 24, cy + 24, 6);
            break;
          case 'police_station':
            circle(38, 5);
            line(cx - 22, cy - 22, cx + 22, cy + 22, 5);
            line(cx + 22, cy - 22, cx - 22, cy + 22, 5);
            break;
          case 'fire_station':
            line(cx, cy - 40, cx, cy + 34, 6);
            line(cx, cy - 8, cx - 28, cy - 34, 6);
            line(cx, cy - 8, cx + 28, cy - 34, 6);
            break;
          case 'factory':
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy, 34, 0, Math.PI * 2);
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              const inner = 34;
              const outer = 48;
              ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
              ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
            }
            ctx.stroke();
            break;
          case 'health_center':
            circle(38, 5);
            line(cx - 18, cy, cx + 18, cy, 6);
            line(cx, cy - 18, cx, cy + 18, 6);
            break;
          case 'hospital':
            ctx.strokeRect(cx - 34, cy - 28, 68, 56);
            line(cx - 16, cy, cx + 16, cy, 6);
            line(cx, cy - 16, cx, cy + 16, 6);
            break;
          case 'rice_field':
            ctx.strokeRect(cx - 34, cy - 34, 68, 68);
            line(cx, cy - 34, cx, cy + 34, 5);
            line(cx - 34, cy, cx + 34, cy, 5);
            break;
          case 'farm':
            line(cx - 34, cy + 26, cx - 8, cy - 12, 5);
            line(cx - 10, cy + 26, cx + 16, cy - 12, 5);
            line(cx + 14, cy + 26, cx + 40, cy - 12, 5);
            break;
          case 'orchard':
            circle(24, 5);
            line(cx, cy - 6, cx, cy - 34, 5);
            line(cx, cy - 34, cx + 16, cy - 44, 5);
            break;
          case 'tea_field':
            circle(6, 1, true);
            ctx.beginPath();
            ctx.arc(cx - 18, cy + 10, 6, 0, Math.PI * 2);
            ctx.arc(cx + 18, cy + 10, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'broadleaf_forest':
            ctx.beginPath();
            ctx.arc(cx, cy - 6, 26, 0, Math.PI * 2);
            ctx.stroke();
            line(cx, cy + 18, cx, cy + 44, 5);
            break;
          case 'conifer_forest':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 42);
            ctx.lineTo(cx - 28, cy + 12);
            ctx.lineTo(cx + 28, cy + 12);
            ctx.closePath();
            ctx.stroke();
            line(cx, cy + 12, cx, cy + 40, 5);
            break;
          case 'cemetery':
            line(cx, cy - 28, cx, cy + 28, 6);
            line(cx - 20, cy - 8, cx + 20, cy - 8, 6);
            circle(4, 1, true);
            break;
          case 'castle_ruins':
            ctx.strokeRect(cx - 34, cy - 8, 68, 28);
            line(cx - 34, cy - 8, cx - 34, cy - 26, 5);
            line(cx - 10, cy - 8, cx - 10, cy - 26, 5);
            line(cx + 14, cy - 8, cx + 14, cy - 26, 5);
            line(cx + 34, cy - 8, cx + 34, cy - 26, 5);
            break;
          case 'fire_brigade':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
              const x = cx + Math.cos(a) * 34;
              const y = cy + Math.sin(a) * 34;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            circle(4, 1, true);
            break;
          case 'self_defense_force':
            line(cx, cy - 34, cx, cy + 22, 6);
            ctx.beginPath();
            ctx.moveTo(cx, cy - 34);
            ctx.lineTo(cx + 28, cy - 20);
            ctx.lineTo(cx, cy - 6);
            ctx.closePath();
            ctx.fill();
            break;
          case 'lighthouse':
            ctx.strokeRect(cx - 14, cy - 30, 28, 54);
            line(cx - 24, cy + 24, cx + 24, cy + 24, 5);
            line(cx + 14, cy - 18, cx + 34, cy - 30, 4);
            line(cx + 16, cy - 6, cx + 42, cy - 6, 4);
            break;
          case 'court':
            ctx.strokeRect(cx - 34, cy - 34, 68, 68);
            line(cx - 20, cy - 20, cx + 20, cy + 20, 5);
            line(cx + 20, cy - 20, cx - 20, cy + 20, 5);
            break;
          case 'wasteland':
            line(cx - 28, cy + 26, cx - 12, cy - 22, 5);
            line(cx - 4, cy + 26, cx + 12, cy - 22, 5);
            line(cx + 20, cy + 26, cx + 36, cy - 22, 5);
            line(cx - 20, cy + 6, cx + 28, cy + 6, 5);
            break;
          case 'sandy_area':
            for (const [dx, dy] of [[-26, -14], [0, -22], [24, -8], [-14, 14], [14, 20], [34, 18]]) {
              ctx.beginPath();
              ctx.arc(cx + dx, cy + dy, 4, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case 'government_office':
            ctx.strokeRect(cx - 38, cy - 38, 76, 76);
            ctx.strokeRect(cx - 24, cy - 24, 48, 48);
            break;
          case 'power_station':
            circle(40, 5);
            line(cx, cy - 28, cx, cy + 28, 6);
            break;
          case 'weather_station':
            circle(40, 5);
            line(cx - 20, cy - 18, cx + 20, cy - 18, 4);
            line(cx - 24, cy, cx + 24, cy, 4);
            line(cx - 20, cy + 18, cx + 20, cy + 18, 4);
            break;
          case 'hot_spring':
            text('♨', 58, cy + 8);
            break;
          case 'museum':
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
              const x = cx + Math.cos(a) * 36;
              const y = cy + Math.sin(a) * 36;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.strokeRect(cx - 16, cy - 14, 32, 28);
            break;
          case 'library':
            circle(40, 5);
            ctx.strokeRect(cx - 18, cy - 22, 36, 44);
            line(cx, cy - 22, cx, cy + 22, 3);
            break;
          case 'monument':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 38);
            ctx.lineTo(cx - 20, cy + 30);
            ctx.lineTo(cx + 20, cy + 30);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'electronic_control_point':
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i / 6) * Math.PI * 2;
              const x = cx + Math.cos(a) * 34;
              const y = cy + Math.sin(a) * 34;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            circle(4, 1, true);
            break;
          case 'triangulation_point':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 34);
            ctx.lineTo(cx - 30, cy + 24);
            ctx.lineTo(cx + 30, cy + 24);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'benchmark':
            ctx.strokeRect(cx - 18, cy - 18, 36, 36);
            break;
          case 'mulberry_field':
            circle(36, 5);
            line(cx - 18, cy - 18, cx + 18, cy + 18, 5);
            line(cx + 18, cy - 18, cx - 18, cy + 18, 5);
            line(cx - 6, cy - 28, cx + 26, cy + 4, 5);
            break;
          case 'bamboo_grove':
            line(cx - 20, cy - 30, cx - 20, cy + 30, 5);
            line(cx, cy - 30, cx, cy + 30, 5);
            line(cx + 20, cy - 30, cx + 20, cy + 30, 5);
            line(cx - 28, cy - 10, cx - 12, cy - 22, 4);
            line(cx + 8, cy + 4, cx + 28, cy - 10, 4);
            break;
          case 'smokestack':
            line(cx, cy - 34, cx, cy + 28, 8);
            line(cx - 18, cy + 28, cx + 18, cy + 28, 5);
            break;
          case 'crater':
            for (let i = 0; i < 8; i++) {
              const a = (i / 8) * Math.PI * 2;
              line(cx, cy, cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, 3);
            }
            break;
          case 'quarry':
            circle(36, 3);
            ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            break;
          case 'oil_gas_well':
            line(cx - 22, cy + 26, cx, cy - 34, 5);
            line(cx + 22, cy + 26, cx, cy - 34, 5);
            line(cx - 30, cy + 6, cx + 30, cy + 6, 5);
            break;
          case 'observatory':
            circle(28, 5);
            line(cx - 14, cy + 20, cx + 20, cy - 14, 5);
            break;
          case 'wetland':
            line(cx - 42, cy + 16, cx + 42, cy + 16, 4);
            line(cx - 38, cy + 30, cx + 38, cy + 30, 4);
            circle(4, 1, true);
            ctx.beginPath();
            ctx.arc(cx - 20, cy, 4, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 8, 4, 0, Math.PI * 2);
            ctx.arc(cx + 26, cy + 2, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
          case 'historic_site':
            ctx.beginPath();
            ctx.moveTo(cx, cy - 30);
            ctx.bezierCurveTo(cx + 18, cy - 44, cx + 34, cy - 12, cx, cy + 18);
            ctx.bezierCurveTo(cx - 34, cy - 12, cx - 18, cy - 44, cx, cy - 30);
            ctx.stroke();
            line(cx, cy + 18, cx, cy + 34, 4);
            break;
          case 'hydro_power':
            ctx.strokeRect(cx - 28, cy - 24, 56, 48);
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy + 30);
            ctx.quadraticCurveTo(cx - 6, cy + 12, cx + 2, cy + 30);
            ctx.quadraticCurveTo(cx + 10, cy + 48, cx + 18, cy + 30);
            ctx.stroke();
            break;
          default:
            text('?', 62, cy + 10);
            break;
        }
      }

      if (visual.kind === 'clock') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.38;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = cx + Math.cos(a) * (r * 0.82);
          const y1 = cy + Math.sin(a) * (r * 0.82);
          const x2 = cx + Math.cos(a) * (r * 0.95);
          const y2 = cy + Math.sin(a) * (r * 0.95);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        const minuteAngle = (visual.minute / 60) * Math.PI * 2 - Math.PI / 2;
        const hourValue = (visual.hour % 12) + visual.minute / 60;
        const hourAngle = (hourValue / 12) * Math.PI * 2 - Math.PI / 2;

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(hourAngle) * (r * 0.52), cy + Math.sin(hourAngle) * (r * 0.52));
        ctx.stroke();

        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(minuteAngle) * (r * 0.78), cy + Math.sin(minuteAngle) * (r * 0.78));
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visual.kind === 'polygon') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.35;
        const sides = Math.max(3, visual.sides);
        const points: Array<{ x: number; y: number }> = [];
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          points.push({ x, y });
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        if (visual.showDiagonals && sides >= 4) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          for (let i = 0; i < sides - 2; i++) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[i + 2].x, points[i + 2].y);
            ctx.stroke();
          }
        }

        if (visual.labels) {
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          points.forEach((pt, i) => {
            const label = visual.labels?.[i];
            if (!label) return;
            const dx = pt.x - cx;
            const dy = pt.y - cy;
            const len = Math.hypot(dx, dy) || 1;
            ctx.fillText(label, pt.x + (dx / len) * 16, pt.y + (dy / len) * 16);
          });
        }
      }

      if (visual.kind === 'angle') {
        if (visual.parallelLines) {
          const left = w * 0.18;
          const right = w * 0.82;
          const yTop = h * 0.32;
          const yBottom = h * 0.68;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(left, yTop);
          ctx.lineTo(right, yTop);
          ctx.moveTo(left, yBottom);
          ctx.lineTo(right, yBottom);
          ctx.stroke();

          const tx1 = w * 0.36;
          const ty1 = h * 0.12;
          const tx2 = w * 0.64;
          const ty2 = h * 0.88;
          ctx.strokeStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();

          const rad = (visual.degrees * Math.PI) / 180;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.44, yTop, 26, 0, rad, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(w * 0.56, yBottom, 26, Math.PI, Math.PI + rad, false);
          ctx.stroke();

          if (visual.labels) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            visual.labels[0] && ctx.fillText(visual.labels[0], w * 0.47, yTop + 34);
            visual.labels[1] && ctx.fillText(visual.labels[1], w * 0.53, yBottom - 18);
          }
        } else {
          const cx = w * 0.5;
          const cy = h * 0.75;
          const len = Math.min(w, h) * 0.36;
          const base = 0;
          const other = -(visual.degrees * Math.PI / 180);

          const x1 = cx + Math.cos(base) * len;
          const y1 = cy + Math.sin(base) * len;
          const x2 = cx + Math.cos(other) * len;
          const y2 = cy + Math.sin(other) * len;

          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(x1, y1);
          ctx.moveTo(cx, cy);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          const arcR = len * 0.35;
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, arcR, other, base, false);
          ctx.stroke();

          if (visual.rightAngleMark || visual.degrees === 90) {
            const mark = 18;
            ctx.beginPath();
            ctx.moveTo(cx + mark, cy);
            ctx.lineTo(cx + mark, cy - mark);
            ctx.lineTo(cx, cy - mark);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'circle') {
        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.33;

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        if (visual.showDiameter) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx - r, cy);
          ctx.lineTo(cx + r, cy);
          ctx.stroke();
        }
        if (visual.showRadius) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + r, cy);
          ctx.stroke();
        }
        if (visual.showChord) {
          const angleA = -Math.PI * 0.82;
          const angleB = -Math.PI * 0.18;
          const ax = cx + Math.cos(angleA) * r;
          const ay = cy + Math.sin(angleA) * r;
          const bx = cx + Math.cos(angleB) * r;
          const by = cy + Math.sin(angleB) * r;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        if (visual.centralAngle) {
          const start = -Math.PI / 2;
          const end = start + (visual.centralAngle * Math.PI) / 180;
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(start) * r, cy + Math.sin(start) * r);
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(end) * r, cy + Math.sin(end) * r);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.28, start, end, false);
          ctx.stroke();
        }
        if (visual.inscribedAngle) {
          const vertexAngle = Math.PI * 0.7;
          const vx = cx + Math.cos(vertexAngle) * r;
          const vy = cy + Math.sin(vertexAngle) * r;
          const start = -Math.PI / 2;
          const end = start + ((visual.inscribedAngle * 2 * Math.PI) / 180);
          const ax = cx + Math.cos(start) * r;
          const ay = cy + Math.sin(start) * r;
          const bx = cx + Math.cos(end) * r;
          const by = cy + Math.sin(end) * r;
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(vx, vy);
          ctx.lineTo(ax, ay);
          ctx.moveTo(vx, vy);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
        if (visual.labels) {
          const labelPoints = [
            { x: cx, y: cy - r - 12 },
            { x: cx + r + 14, y: cy + 4 },
            { x: cx, y: cy + r + 18 },
            { x: cx - r - 14, y: cy + 4 },
          ];
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          visual.labels.forEach((label, i) => {
            const pt = labelPoints[i];
            if (!label || !pt) return;
            ctx.fillText(label, pt.x, pt.y);
          });
        }
      }

      if (visual.kind === 'cube') {
        const size = Math.min(w, h) * 0.34;
        const ox = w * 0.36;
        const oy = h * 0.58;
        const dx = size * 0.35;
        const dy = size * 0.28;

        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 3;

        // front face
        ctx.strokeRect(ox, oy - size, size, size);
        // back face
        ctx.strokeRect(ox + dx, oy - size - dy, size, size);
        // connectors
        ctx.beginPath();
        ctx.moveTo(ox, oy - size);
        ctx.lineTo(ox + dx, oy - size - dy);
        ctx.moveTo(ox + size, oy - size);
        ctx.lineTo(ox + size + dx, oy - size - dy);
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + dx, oy - dy);
        ctx.moveTo(ox + size, oy);
        ctx.lineTo(ox + size + dx, oy - dy);
        ctx.stroke();

        if (visual.showHiddenEdges) {
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ox + dx, oy - dy);
          ctx.lineTo(ox + dx, oy - size - dy);
          ctx.moveTo(ox + dx, oy - dy);
          ctx.lineTo(ox + size + dx, oy - dy);
          ctx.stroke();
          ctx.restore();
        }

        if (visual.labels) {
          const labelPts = [
            { x: ox - 10, y: oy + 12 },
            { x: ox + size + 12, y: oy + 12 },
            { x: ox + size + dx + 12, y: oy - dy + 4 },
            { x: ox + dx - 10, y: oy - dy + 4 },
          ];
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          visual.labels.forEach((label, i) => {
            const pt = labelPts[i];
            if (!label || !pt) return;
            ctx.fillText(label, pt.x, pt.y);
          });
        }
      }

      if (visual.kind === 'prism') {
        const sides = Math.max(3, visual.baseSides);
        const r = Math.min(w, h) * (sides >= 6 ? 0.15 : sides === 5 ? 0.165 : 0.18);
        const frontCx = w * (sides >= 5 ? 0.35 : 0.38);
        const frontCy = h * 0.58;
        const dx = w * (sides >= 5 ? 0.26 : 0.22);
        const dy = -h * (sides >= 5 ? 0.12 : 0.16);
        const front: Array<{ x: number; y: number }> = [];
        const back: Array<{ x: number; y: number }> = [];

        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
          const x = frontCx + Math.cos(a) * r;
          const y = frontCy + Math.sin(a) * r;
          front.push({ x, y });
          back.push({ x: x + dx, y: y + dy });
        }

        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        front.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        back.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        front.forEach((pt, i) => {
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(back[i].x, back[i].y);
          ctx.stroke();
        });
      }

      if (visual.kind === 'cylinder') {
        const cx = w * 0.5;
        const topY = h * 0.28;
        const bottomY = h * 0.72;
        const rx = w * 0.2;
        const ry = h * 0.08;

        if (visual.showNet) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.28, h * 0.5, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeRect(w * 0.4, h * 0.36, w * 0.28, h * 0.28);
          ctx.beginPath();
          ctx.arc(w * 0.8, h * 0.5, 26, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - rx, topY);
          ctx.lineTo(cx - rx, bottomY);
          ctx.moveTo(cx + rx, topY);
          ctx.lineTo(cx + rx, bottomY);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, bottomY, rx, ry, 0, 0, Math.PI);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.ellipse(cx, bottomY, rx, ry, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (visual.showHeight) {
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx, bottomY);
            ctx.stroke();
          }
          if (visual.showRadius) {
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx + rx, topY);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'pyramid') {
        const sides = Math.max(3, visual.baseSides);
        const cx = w * 0.5;
        const cy = h * 0.7;
        const r = Math.min(w, h) * (sides >= 5 ? 0.16 : 0.18);
        const apex = { x: w * 0.5, y: h * 0.18 };
        const base: Array<{ x: number; y: number }> = [];
        for (let i = 0; i < sides; i++) {
          const a = (i / sides) * Math.PI * 2 - Math.PI / 2 + Math.PI / sides;
          base.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.55 });
        }

        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        base.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.stroke();

        base.forEach((pt) => {
          ctx.beginPath();
          ctx.moveTo(apex.x, apex.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        });
      }

      if (visual.kind === 'cone') {
        const cx = w * 0.5;
        const topY = h * 0.18;
        const baseY = h * 0.72;
        const rx = w * 0.22;
        const ry = h * 0.08;

        if (visual.showNet) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(w * 0.28, h * 0.52, 28, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(w * 0.62, h * 0.3);
          ctx.arc(w * 0.62, h * 0.52, 70, -Math.PI / 3, Math.PI / 3, false);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, topY);
          ctx.lineTo(cx - rx, baseY);
          ctx.moveTo(cx, topY);
          ctx.lineTo(cx + rx, baseY);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(cx, baseY, rx, ry, 0, 0, Math.PI);
          ctx.stroke();
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.ellipse(cx, baseY, rx, ry, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (visual.showHeight) {
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, topY);
            ctx.lineTo(cx, baseY);
            ctx.stroke();
          }
          if (visual.showRadius) {
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, baseY);
            ctx.lineTo(cx + rx, baseY);
            ctx.stroke();
          }
        }
      }

      if (visual.kind === 'parabola') {
        const originX = w * 0.5;
        const originY = h * 0.78;
        const scaleX = w * 0.09;
        const scaleY = h * 0.06;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.12, originY);
        ctx.lineTo(w * 0.88, originY);
        ctx.moveTo(originX, h * 0.16);
        ctx.lineTo(originX, h * 0.88);
        ctx.stroke();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('x', w * 0.88, originY - 8);
        ctx.fillText('y', originX + 14, h * 0.18);
        ctx.fillText('O', originX - 12, originY + 14);

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        let started = false;
        for (let px = -3; px <= 3; px += 0.05) {
          const py = visual.a * px * px;
          const sx = originX + px * scaleX;
          const sy = originY - py * scaleY;
          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();

        if (visual.markX !== undefined) {
          const px = visual.markX;
          const py = visual.a * px * px;
          const sx = originX + px * scaleX;
          const sy = originY - py * scaleY;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sx, originY);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`x=${px}`, sx, originY + 18);
        }
      }

      if (visual.kind === 'bar_chart') {
        const values = visual.values.slice(0, 5);
        if (values.length === 0) return;
        const maxV = Math.max(...values, 1);
        const baseY = h * 0.82;
        const left = w * 0.12;
        const chartW = w * 0.76;
        const barW = chartW / values.length * 0.65;
        const gap = chartW / values.length * 0.35;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(left, baseY);
        ctx.lineTo(left + chartW, baseY);
        ctx.stroke();

        values.forEach((v, i) => {
          const bh = (v / maxV) * (h * 0.55);
          const x = left + i * (barW + gap) + gap * 0.5;
          const y = baseY - bh;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(x, y, barW, bh);
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x + barW / 2, y - 4);
          if (visual.labels && visual.labels[i]) {
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(visual.labels[i], x + barW / 2, baseY + 14);
          }
        });
      }

      if (visual.kind === 'dots') {
        const rows = visual.counts.length;
        const rowGap = h / (rows + 1);
        visual.counts.forEach((count, ri) => {
          const y = rowGap * (ri + 1);
          const maxPerRow = 10;
          const spacing = 18;
          const rowWidth = Math.min(count, maxPerRow) * spacing;
          let sx = (w - rowWidth) / 2;
          for (let i = 0; i < count; i++) {
            const col = i % maxPerRow;
            const row = Math.floor(i / maxPerRow);
            const x = sx + col * spacing;
            const yy = y + row * 16;
            ctx.fillStyle = ri % 2 === 0 ? '#22d3ee' : '#60a5fa';
            ctx.beginPath();
            ctx.arc(x, yy, 5, 0, Math.PI * 2);
            ctx.fill();
          }
          if (visual.labels && visual.labels[ri]) {
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(visual.labels[ri], 8, y + 4);
          }
        });
      }

      if (visual.kind === 'number_sequence') {
        const vals = visual.values;
        const n = vals.length;
        const pad = 12;
        const bw = (w - pad * 2) / Math.max(1, n);
        vals.forEach((v, i) => {
          const x = pad + i * bw + 2;
          const y = h * 0.35;
          const ww = bw - 4;
          const hh = 52;
          ctx.fillStyle = '#0b1220';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.fillRect(x, y, ww, hh);
          ctx.strokeRect(x, y, ww, hh);
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x + ww / 2, y + 33);
        });
      }

      if (visual.kind === 'fraction') {
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        if (visual.whole !== undefined) {
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText(String(visual.whole), cx - 55, cy + 6);
        }
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(String(visual.numerator), cx + (visual.whole !== undefined ? 20 : 0), cy - 18);
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        const fx = cx + (visual.whole !== undefined ? 20 : 0);
        ctx.beginPath();
        ctx.moveTo(fx - 24, cy);
        ctx.lineTo(fx + 24, cy);
        ctx.stroke();
        ctx.fillText(String(visual.denominator), fx, cy + 30);
      }

      if (visual.kind === 'fraction_operation') {
        const drawFrac = (x: number, y: number, n: number, d: number) => {
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(String(n), x, y - 16);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 22, y);
          ctx.lineTo(x + 22, y);
          ctx.stroke();
          ctx.fillText(String(d), x, y + 26);
        };
        const cy = h / 2;
        drawFrac(w * 0.28, cy, visual.left.n, visual.left.d);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(visual.op, w * 0.50, cy + 8);
        drawFrac(w * 0.72, cy, visual.right.n, visual.right.d);
      }
    } catch (e) {
      console.warn('visual render failed', e);
    }
  }, [
    currentProblem?.visual?.kind,
    currentProblem?.visual?.kind === 'clock' ? currentProblem.visual.hour : undefined,
    currentProblem?.visual?.kind === 'clock' ? currentProblem.visual.minute : undefined,
    currentProblem?.visual?.kind === 'polygon' ? currentProblem.visual.sides : undefined,
    currentProblem?.visual?.kind === 'angle' ? currentProblem.visual.degrees : undefined,
    currentProblem?.visual?.kind === 'circle' ? currentProblem.visual.showRadius : undefined,
    currentProblem?.visual?.kind === 'circle' ? currentProblem.visual.showDiameter : undefined,
    currentProblem?.visual?.kind === 'bar_chart' ? currentProblem.visual.values.join(',') : undefined,
    currentProblem?.visual?.kind === 'bar_chart' ? (currentProblem.visual.labels || []).join(',') : undefined,
    currentProblem?.visual?.kind === 'dots' ? currentProblem.visual.counts.join(',') : undefined,
    currentProblem?.visual?.kind === 'dots' ? (currentProblem.visual.labels || []).join(',') : undefined,
    currentProblem?.visual?.kind === 'number_sequence' ? currentProblem.visual.values.join(',') : undefined,
    currentProblem?.visual?.kind === 'fraction' ? `${currentProblem.visual.whole || 0},${currentProblem.visual.numerator},${currentProblem.visual.denominator}` : undefined,
    currentProblem?.visual?.kind === 'fraction_operation' ? `${currentProblem.visual.left.n}/${currentProblem.visual.left.d}${currentProblem.visual.op}${currentProblem.visual.right.n}/${currentProblem.visual.right.d}` : undefined,
    currentProblem?.visual?.kind === 'map_symbol' ? currentProblem.visual.symbol : undefined,
    mapSymbolImageFailed,
  ]);

  if (debugSkip) return <div className="w-full h-full bg-black"></div>;

  const bgClass = getBackgroundClass(mode);

  if (problems.length === 0) return (
      <div className={`flex flex-col h-full w-full ${bgClass} text-white items-center justify-center p-8 font-mono`}>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-300"></div>
      </div>
  );

  return (
    <div className={`flex flex-col h-full w-full ${bgClass} text-white relative items-center justify-center p-2 sm:p-3 md:p-8 font-mono overflow-y-auto overflow-x-hidden`}>
        <div className="absolute inset-0 texture-dark-matter opacity-20 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-md text-center flex flex-col py-2 md:py-0 min-w-0">
            {isEnglishSpeakingReviewMode(mode) && !isChallenge && (
                <div className="mb-4 flex justify-center gap-3 text-xs md:text-sm text-cyan-100">
                    <span>Score: {correctCount}</span>
                    <span>Attempted: {attemptedCount}</span>
                    <span>Accuracy: {accuracy}%</span>
                </div>
            )}

            <div className="w-full bg-black/40 border-4 border-white p-3 sm:p-4 md:p-6 rounded-2xl mb-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[210px] md:min-h-[260px] min-w-0">
                {currentProblem.hint && (storageService.getHintStreaks()[currentProblem.sourceMode] || 0) < 3 && (
                    <div className="bg-white/10 p-2 rounded-lg border border-white/20 mb-4 w-full animate-in fade-in slide-in-from-top-2">
                        <div className="text-[10px] text-yellow-300 font-bold mb-0.5 uppercase tracking-tighter text-left">Hint</div>
                        <div className="text-[11px] md:text-xs text-gray-100 leading-relaxed text-left">{currentProblem.hint}</div>
                    </div>
                )}
                
                <h3 className="text-[clamp(1.25rem,4vw,1.875rem)] font-bold text-white leading-tight mb-4 break-words w-full min-w-0">
                    {currentProblem.question}
                </h3>

                {currentProblem.audioPrompt && (
                    <button
                        type="button"
                        onClick={() => speakPrompt(currentProblem.audioPrompt!.text, currentProblem.audioPrompt!.lang || 'ja-JP')}
                        className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/50 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 hover:bg-cyan-500/25"
                    >
                        <Volume2 size={18} />
                        おとを きく
                    </button>
                )}

                {currentProblem.speechPrompt && (
                    <div className="mb-4 flex w-full flex-col items-center gap-2">
                        <button
                            type="button"
                            onClick={startSpeechRecognition}
                            disabled={isAnswered || isListening}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${isListening ? 'border-emerald-300/60 bg-emerald-500/20 text-emerald-100' : 'border-pink-300/50 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25'} disabled:opacity-60`}
                        >
                            <Mic size={18} />
                            {isListening ? 'ききとり中...' : (currentProblem.speechPrompt.buttonLabel || 'はなして こたえる')}
                        </button>
                        {speechTranscript && (
                            <div className="text-xs text-emerald-200">ききとり: {speechTranscript}</div>
                        )}
                        {speechError && (
                            <div className="text-xs text-amber-300">{speechError}</div>
                        )}
                        {currentProblem.speechPrompt.freeResponse && currentProblem.speechPrompt.examples && currentProblem.speechPrompt.examples.length > 0 && (
                            <div className="w-full rounded-lg border border-pink-300/20 bg-pink-500/10 px-3 py-2 text-left text-[11px] text-pink-100">
                                例: {currentProblem.speechPrompt.examples.join(' / ')}
                            </div>
                        )}
                    </div>
                )}

                {currentProblem.visual && currentProblem.visual.kind !== 'map_symbol' && (
                    <div className="w-full mb-4 flex justify-center">
                        <canvas
                            ref={visualCanvasRef}
                            width={260}
                            height={180}
                            className="w-full max-w-[260px] h-auto aspect-[13/9] rounded-lg border border-white/30 bg-slate-900"
                        />
                    </div>
                )}
                {currentProblem.visual?.kind === 'map_symbol' && (
                    <div className="w-full mb-4 flex justify-center">
                        <div className="flex w-full max-w-[240px] flex-col items-center gap-2">
                            <div className="flex w-full min-h-[165px] items-center justify-center rounded-lg border border-white/30 bg-white p-3">
                                {mapSymbolAsset && !mapSymbolImageFailed ? (
                                    <img
                                        src={mapSymbolAsset.src}
                                        alt={mapSymbolAsset.title}
                                        className="block h-auto max-h-[140px] w-full object-contain"
                                        onError={() => setMapSymbolImageFailed(true)}
                                    />
                                ) : (
                                    <canvas
                                        ref={visualCanvasRef}
                                        width={260}
                                        height={180}
                                        className="w-full max-w-[220px] h-auto aspect-[13/9] rounded bg-white"
                                    />
                                )}
                            </div>

                        </div>
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

            {!currentProblem.speechPrompt?.freeResponse && (
            <div className="w-full grid grid-cols-2 gap-2 md:gap-3 min-w-0">
                {currentProblem.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleAnswer(opt)}
                        disabled={isAnswered}
                        className={`
                            py-2.5 md:py-3 px-2 md:px-3 font-bold rounded-xl border-b-4 transition-all active:border-b-0 active:translate-y-1 text-[clamp(0.8rem,2.8vw,1rem)]
                            ${isAnswered && normalize(opt) === normalize(currentProblem.actualCorrectAnswer) ? 'bg-green-600 border-green-800 scale-102' : ''}
                            ${isAnswered && opt === selectedOption && normalize(opt) !== normalize(currentProblem.actualCorrectAnswer) ? 'bg-red-600 border-red-800' : ''}
                            ${!isAnswered ? 'bg-white/10 border-white/30 hover:bg-white/20 cursor-pointer' : 'opacity-80'}
                            break-words shadow-lg min-w-0
                        `}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            )}
        </div>
    </div>
  );
};

export default GeneralChallengeScreen;
