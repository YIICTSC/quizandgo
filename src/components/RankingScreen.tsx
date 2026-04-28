
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ScrollText, Calendar, Skull, Trophy, Club, Swords, Timer, Zap, Compass, Mountain, Send, Crown, Users, User, ArrowRight, Rocket } from 'lucide-react';
import { RankingEntry, PokerScoreEntry, SurvivorScoreEntry, DungeonScoreEntry, KochoScoreEntry, PaperPlaneScoreEntry, VSRecord, GoHomeScoreEntry } from '../types';
import { storageService } from '../services/storageService';

interface RankingScreenProps {
  onBack: () => void;
}

const RankingScreen: React.FC<RankingScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'ADVENTURE' | 'VS' | 'POKER' | 'SURVIVOR' | 'DUNGEON' | 'DUNGEON_2' | 'KOCHO' | 'PLANE' | 'GO_HOME'>('ADVENTURE');
  const [adventureData, setAdventureData] = useState<RankingEntry[]>([]);
  const [vsData, setVsData] = useState<VSRecord[]>([]);
  const [pokerData, setPokerData] = useState<PokerScoreEntry[]>([]);
  const [survivorData, setSurvivorData] = useState<SurvivorScoreEntry[]>([]);
  const [dungeonData, setDungeonData] = useState<DungeonScoreEntry[]>([]);
  const [dungeon2Data, setDungeon2Data] = useState<DungeonScoreEntry[]>([]);
  const [kochoData, setKochoData] = useState<KochoScoreEntry[]>([]);
  const [planeData, setPlaneData] = useState<PaperPlaneScoreEntry[]>([]);
  const [goHomeData, setGoHomeData] = useState<GoHomeScoreEntry[]>([]);

  useEffect(() => {
      // 全データを取得し、それぞれの指標で上位順にソート
      setAdventureData(storageService.getLocalScores().sort((a, b) => b.score - a.score));
      setVsData(storageService.getVSRecords().sort((a, b) => b.date - a.date)); // VSは日付順
      setPokerData(storageService.getPokerScores().sort((a, b) => b.bestHandScore - a.bestHandScore));
      setSurvivorData(storageService.getSurvivorScores().sort((a, b) => b.score - a.score));
      setDungeonData(storageService.getDungeonScores().sort((a, b) => b.score - a.score));
      setDungeon2Data(storageService.getDungeonScores2().sort((a, b) => b.score - a.score));
      setKochoData(storageService.getKochoScores().sort((a, b) => {
          if (b.stage !== a.stage) return b.stage - a.stage;
          return a.turns - b.turns; // ステージが同じならターン数が少ない方が上位
      }));
      setPlaneData(storageService.getPaperPlaneScores().sort((a, b) => b.score - a.score));
      setGoHomeData(storageService.getGoHomeScores().sort((a, b) => b.score - a.score));
  }, []);

  const formatDate = (ts: number) => {
      return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white relative">
        {/* Header */}
        <div className="z-10 bg-black border-b-2 border-gray-600 p-4 flex flex-col md:flex-row justify-between items-center shrink-0 gap-4">
            <div className="flex items-center">
                <ScrollText size={24} className="text-gray-400 mr-2" />
                <h2 className="text-xl font-bold text-gray-100">記録 (Records)</h2>
            </div>
            
            <div className="flex bg-gray-800 rounded p-1 overflow-x-auto max-w-full custom-scrollbar">
                <button 
                    onClick={() => setActiveTab('ADVENTURE')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'ADVENTURE' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Swords className="mr-1 md:mr-2" size={16}/> Adv
                </button>
                <button 
                    onClick={() => setActiveTab('VS')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'VS' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Users className="mr-1 md:mr-2" size={16}/> VS
                </button>
                <button 
                    onClick={() => setActiveTab('POKER')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'POKER' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Club className="mr-1 md:mr-2" size={16}/> Poker
                </button>
                <button 
                    onClick={() => setActiveTab('SURVIVOR')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'SURVIVOR' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Skull className="mr-1 md:mr-2" size={16}/> Surv
                </button>
                <button 
                    onClick={() => setActiveTab('GO_HOME')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'GO_HOME' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Rocket className="mr-1 md:mr-2" size={16}/> Dash
                </button>
                <button 
                    onClick={() => setActiveTab('DUNGEON')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'DUNGEON' ? 'bg-[#306230] text-[#9bbc0f] shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Compass className="mr-1 md:mr-2" size={16}/> Dung
                </button>
                <button 
                    onClick={() => setActiveTab('DUNGEON_2')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'DUNGEON_2' ? 'bg-[#202020] border border-cyan-500 text-cyan-400 shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Mountain className="mr-1 md:mr-2" size={16}/> Dung2
                </button>
                <button 
                    onClick={() => setActiveTab('KOCHO')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'KOCHO' ? 'bg-indigo-900 text-pink-300 shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Crown className="mr-1 md:mr-2" size={16}/> Kocho
                </button>
                <button 
                    onClick={() => setActiveTab('PLANE')}
                    className={`flex items-center px-3 py-2 rounded text-xs md:text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'PLANE' ? 'bg-sky-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                    <Send className="mr-1 md:mr-2" size={16}/> Plane
                </button>
            </div>

            <button 
                onClick={onBack}
                className="flex items-center bg-gray-700 hover:bg-gray-600 border border-gray-400 px-4 py-2 rounded text-white transition-colors text-sm"
            >
                <ArrowLeft size={16} className="mr-2" /> 戻る
            </button>
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'ADVENTURE' && (
                adventureData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <ScrollText size={48} className="mb-4 opacity-50" />
                        <p>まだ冒険の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {adventureData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className={`flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 shadow-lg transition-colors ${
                                    entry.victory 
                                    ? 'bg-yellow-900/10 border-yellow-500 hover:bg-yellow-900/20' 
                                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                                }`}
                            >
                                {/* Left: Result Icon & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className={`p-2 rounded-full mr-3 ${entry.victory ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-600/20 text-gray-400'}`}>
                                        {entry.victory ? <Trophy size={20} /> : <Skull size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${entry.victory ? 'text-yellow-400' : 'text-gray-400'}`}>
                                            {entry.victory ? 'VICTORY' : 'DEFEATED'}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Character Info */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="text-lg font-bold text-white">
                                        {entry.characterName || '不明な冒険者'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        到達: Act {entry.act} - Floor {entry.floor}
                                    </div>
                                    {entry.challengeMode && <div className="text-[10px] text-red-400 font-bold border border-red-500 px-1 inline-block rounded mt-1">1A1D Mode</div>}
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'VS' && (
                vsData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Users size={48} className="mb-4 opacity-50" />
                        <p>対戦の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {vsData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className={`flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 shadow-lg transition-colors ${
                                    entry.victory 
                                    ? 'bg-indigo-900/20 border-indigo-500 hover:bg-indigo-900/30' 
                                    : 'bg-red-900/20 border-red-500 hover:bg-red-900/30'
                                }`}
                            >
                                {/* Left: Result Icon & Date */}
                                <div className="flex items-center w-full md:w-40 mb-2 md:mb-0 shrink-0">
                                    <div className={`p-2 rounded-full mr-3 ${entry.victory ? 'bg-indigo-500/20 text-indigo-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {entry.victory ? <Trophy size={20} /> : <Skull size={20} />}
                                    </div>
                                    <div>
                                        <div className={`font-bold ${entry.victory ? 'text-indigo-400' : 'text-red-400'}`}>
                                            {entry.victory ? 'WIN' : 'LOSE'}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Battle Matchup */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4 flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-500 font-bold">YOU</div>
                                        <div className="text-sm font-bold text-white">{entry.playerCharName}</div>
                                    </div>
                                    <div className="text-indigo-600 font-black italic">VS</div>
                                    <div className="text-center">
                                        <div className="text-[10px] text-gray-500 font-bold">OPPONENT</div>
                                        <div className="text-sm font-bold text-indigo-400">{entry.opponentName}</div>
                                        <div className="text-[8px] text-gray-600">({entry.opponentCharName})</div>
                                    </div>
                                </div>

                                {/* Right: Stats */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">TURNS</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {entry.turns}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'POKER' && (
                pokerData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Club size={48} className="mb-4 opacity-50" />
                        <p>ポーカーの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {pokerData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-purple-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors"
                            >
                                {/* Left: Ante & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-purple-500/20 text-purple-400">
                                        <Club size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-purple-300">
                                            ANTE {entry.ante} Reached
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Money */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="text-sm text-gray-400">最終所持金</div>
                                    <div className="text-lg font-bold text-yellow-400">
                                        ${entry.money.toLocaleString()}
                                    </div>
                                </div>

                                {/* Right: Best Hand Score */}
                                <div className="w-full md:w-48 text-right">
                                    <div className="text-xs text-gray-500">BEST HAND</div>
                                    <div className="text-xl font-mono font-bold text-white">
                                        {entry.bestHandScore ? entry.bestHandScore.toLocaleString() : '-'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'SURVIVOR' && (
                survivorData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Skull size={48} className="mb-4 opacity-50" />
                        <p>サバイバーの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {survivorData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-red-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors"
                            >
                                {/* Left: Time & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-red-500/20 text-red-400">
                                        <Timer size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-red-300 font-mono text-xl">
                                            {formatTime(entry.timeSurvived)}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Level & Weapons */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-black px-2 py-0.5 rounded border border-gray-600 text-yellow-400 font-bold">LV {entry.levelReached}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 flex flex-wrap gap-1">
                                        {entry.weapons && entry.weapons.length > 0 ? entry.weapons.map(w => (
                                            <span key={w} className="bg-gray-700 px-1 rounded text-[10px]">{w}</span>
                                        )) : 'No Weapons'}
                                    </div>
                                </div>

                                {/* Right: Icon */}
                                <div className="w-full md:w-32 text-right flex justify-end">
                                    <Zap size={24} className="text-gray-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'GO_HOME' && (
                goHomeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Rocket size={48} className="mb-4 opacity-50 text-orange-500" />
                        <p>帰宅ダッシュの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {goHomeData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-orange-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors font-mono"
                            >
                                {/* Left: Distance & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-orange-900/50 border border-orange-500 text-orange-300">
                                        <Rocket size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-orange-300 text-xl">
                                            {entry.distance.toLocaleString()} m
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Level */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-orange-900 border border-orange-500 px-2 py-0.5 rounded text-orange-100 font-bold">RANK {entry.level}</span>
                                    </div>
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-yellow-400">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'DUNGEON' && (
                dungeonData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Compass size={48} className="mb-4 opacity-50" />
                        <p>風来の小学生の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {dungeonData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-[#306230] bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors font-mono"
                            >
                                {/* Left: Floor & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-[#0f380f] border border-[#306230] text-[#9bbc0f]">
                                        <Compass size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#9bbc0f]">
                                            {entry.floor} F
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Level & Reason */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-[#0f380f] border border-[#306230] px-2 py-0.5 rounded text-[#9bbc0f] font-bold">LV {entry.level}</span>
                                    </div>
                                    <div className="text-xs text-gray-300">
                                        {entry.reason}
                                    </div>
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-[#9bbc0f]">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'DUNGEON_2' && (
                dungeon2Data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Mountain size={48} className="mb-4 opacity-50 text-cyan-800" />
                        <p>風来の小学生2の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {dungeon2Data.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-cyan-600 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors font-mono"
                            >
                                {/* Left: Floor & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-cyan-900/50 border border-cyan-500 text-cyan-400">
                                        <Mountain size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-cyan-300">
                                            {entry.floor} F
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Level & Reason */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-cyan-900 border border-cyan-500 px-2 py-0.5 rounded text-cyan-100 font-bold">LV {entry.level}</span>
                                    </div>
                                    <div className="text-xs text-gray-300">
                                        {entry.reason}
                                    </div>
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-cyan-400">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'KOCHO' && (
                kochoData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Crown size={48} className="mb-4 opacity-50 text-indigo-400" />
                        <p>校長対決の記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {kochoData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-indigo-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors font-mono"
                            >
                                {/* Left: Stage & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-indigo-900/50 border border-indigo-500 text-indigo-300">
                                        <Crown size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-indigo-300">
                                            Stage {entry.stage}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Victory */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className={`text-sm font-bold ${entry.victory ? 'text-yellow-400' : 'text-gray-400'}`}>
                                        {entry.victory ? 'GRADUATION (Victory)' : 'EXPELLED (Defeat)'}
                                    </div>
                                </div>

                                {/* Right: Turns */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">TURNS</div>
                                    <div className="text-xl font-mono font-bold text-pink-300">
                                        {entry.turns}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {activeTab === 'PLANE' && (
                planeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Send size={48} className="mb-4 opacity-50 text-sky-400" />
                        <p>紙飛行機バトルの記録はありません。</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-3">
                        {planeData.map((entry, idx) => (
                            <div 
                                key={idx} 
                                className="flex flex-col md:flex-row items-start md:items-center p-4 rounded-lg border-l-4 border-sky-500 bg-gray-800 hover:bg-gray-700 shadow-lg transition-colors font-mono"
                            >
                                {/* Left: Stage & Date */}
                                <div className="flex items-center w-full md:w-48 mb-2 md:mb-0 shrink-0">
                                    <div className="p-2 rounded-full mr-3 bg-sky-900/50 border border-sky-500 text-sky-300">
                                        <Send size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sky-300">
                                            Stage {entry.stage}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-500">
                                            <Calendar size={10} className="mr-1" />
                                            {formatDate(entry.date)}
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Rank */}
                                <div className="flex-grow mb-2 md:mb-0 px-0 md:px-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-sky-900 border border-sky-500 px-2 py-0.5 rounded text-sky-100 font-bold">ASCENSION {entry.rank}</span>
                                    </div>
                                </div>

                                {/* Right: Score */}
                                <div className="w-full md:w-32 text-right">
                                    <div className="text-xs text-gray-500">SCORE</div>
                                    <div className="text-xl font-mono font-bold text-yellow-400">
                                        {entry.score.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

        </div>
        
        {/* Footer */}
        <div className="p-2 text-center text-[10px] text-gray-600 bg-black border-t border-gray-800">
            最新の50件まで表示されます。
        </div>
    </div>
  );
};

export default RankingScreen;
