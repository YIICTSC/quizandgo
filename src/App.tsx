/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { socket } from './socket';
import Home from './components/Home';
import HostScreen from './components/HostScreen';
import PlayerScreen from './components/PlayerScreen';
import SinglePlayScreen from './components/SinglePlayScreen';
import SingleQuizScreen from './components/SingleQuizScreen';
import SingleBomberScreen from './components/SingleBomberScreen';
import SingleDodgeDebugScreen from './components/SingleDodgeDebugScreen';
import { AVATAR_STORAGE_KEY, AvatarConfig, createRandomAvatar, normalizeAvatar } from './avatar';

const getGameTitle = (gameType: string) => {
  if (gameType === 'golf') return 'ゴルフゲーム';
  if (gameType === 'quiz') return 'クイズモード';
  if (gameType === 'dodge') return 'バトルドッジ';
  if (gameType === 'bomber') return 'クイズボンバー';
  if (gameType === 'team_bomber') return 'チームボンバー';
  if (gameType === 'color_bomber') return 'カラーボンバー';
  return gameType;
};

export default function App() {
  const [role, setRole] = useState<'none' | 'host' | 'player' | 'single_setup' | 'single_play'>('none');
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [hostPlayerName] = useState<string>('ホスト');
  const [hostParticipating, setHostParticipating] = useState(false);
  const [hostView, setHostView] = useState<'host' | 'player'>('host');
  const [selectedGameType, setSelectedGameType] = useState<string>('golf');
  const [singlePlayConfig, setSinglePlayConfig] = useState<{ mode: string; questions?: any[]; timeLimit: number; gameTitle: string; shotsPerQuestion?: number; debugHole?: number; debugFreePlay?: boolean; debugPlayerCount?: number } | null>(null);
  const returnToTitle = () => {
    setRole('none');
    setRoomId('');
    setPlayerName('');
    setHostParticipating(false);
    setHostView('host');
    setSinglePlayConfig(null);
  };

  const getSavedAvatar = () => {
    try {
      const saved = window.localStorage.getItem(AVATAR_STORAGE_KEY);
      return normalizeAvatar(saved ? JSON.parse(saved) : null);
    } catch (e) {
      return createRandomAvatar();
    }
  };

  const handleHostParticipationChange = (enabled: boolean) => {
    setHostParticipating(enabled);
    if (enabled) {
      socket.emit('joinRoom', { roomId, name: hostPlayerName, avatar: getSavedAvatar() });
      setPlayerName(hostPlayerName);
      setHostView('player');
      return;
    }
    socket.emit('leaveRoom', { roomId });
    setHostView('host');
  };

  useEffect(() => {
    const onRoomCreated = (id: string) => {
      setRoomId(id);
    };

    const onRoomStateUpdate = (room: any) => {
      setRoomId(room.id);
    };

    const onError = (msg: string) => {
      alert(msg);
      returnToTitle();
    };

    socket.on('roomCreated', onRoomCreated);
    socket.on('roomStateUpdate', onRoomStateUpdate);
    socket.on('error', onError);

    return () => {
      socket.off('roomCreated', onRoomCreated);
      socket.off('roomStateUpdate', onRoomStateUpdate);
      socket.off('error', onError);
    };
  }, []);

  if (role === 'host') {
    if (hostView === 'player' && hostParticipating) {
      return <PlayerScreen roomId={roomId} playerName={hostPlayerName} onSwitchToHostScreen={() => setHostView('host')} />;
    }
    return (
      <HostScreen
        roomId={roomId}
        onReturnToTitle={returnToTitle}
        gameTitle={getGameTitle(selectedGameType)}
        gameType={selectedGameType}
        hostParticipating={hostParticipating}
        onChangeHostParticipation={handleHostParticipationChange}
        onSwitchToHostPlayerScreen={() => setHostView('player')}
      />
    );
  }

  if (role === 'player') {
    return <PlayerScreen roomId={roomId} playerName={playerName} />;
  }

  if (role === 'single_setup') {
    return (
      <HostScreen
        roomId="single-player"
        onReturnToTitle={returnToTitle}
        mode="single"
        gameTitle={getGameTitle(selectedGameType)}
        gameType={selectedGameType}
        onStartSinglePlayer={(payload) => {
          setSinglePlayConfig(payload);
          setRole('single_play');
        }}
      />
    );
  }

  if (role === 'single_play' && singlePlayConfig) {
    if (selectedGameType === 'quiz') {
      return (
        <SingleQuizScreen
          questions={singlePlayConfig.questions}
          mode={singlePlayConfig.mode}
          timeLimit={singlePlayConfig.timeLimit}
          gameTitle={singlePlayConfig.gameTitle}
          onReturnToTitle={returnToTitle}
        />
      );
    }
    if (selectedGameType === 'bomber') {
      return (
        <SingleBomberScreen
          questions={singlePlayConfig.questions}
          mode={singlePlayConfig.mode}
          timeLimit={singlePlayConfig.timeLimit}
          gameTitle={singlePlayConfig.gameTitle}
          debugPlayerCount={singlePlayConfig.debugPlayerCount}
          onReturnToTitle={returnToTitle}
        />
      );
    }
    if (selectedGameType === 'dodge') {
      return (
        <SingleDodgeDebugScreen
          questions={singlePlayConfig.questions}
          mode={singlePlayConfig.mode}
          timeLimit={singlePlayConfig.timeLimit}
          gameTitle={singlePlayConfig.gameTitle}
          onReturnToTitle={returnToTitle}
        />
      );
    }
    return (
        <SinglePlayScreen
          questions={singlePlayConfig.questions}
          mode={singlePlayConfig.mode}
          timeLimit={singlePlayConfig.timeLimit}
          gameTitle={singlePlayConfig.gameTitle}
          shotsPerQuestion={singlePlayConfig.shotsPerQuestion}
          debugHole={singlePlayConfig.debugHole}
          debugFreePlay={singlePlayConfig.debugFreePlay}
          onReturnToTitle={returnToTitle}
      />
    );
  }

  return (
    <Home 
      onJoin={(id, name, avatar: AvatarConfig) => {
        setPlayerName(name);
        setRole('player');
        socket.emit('joinRoom', { roomId: id, name, avatar });
      }}
      onCreate={(gameType, debugConfig) => {
        setSelectedGameType(gameType);
        setRole('host');
        setHostParticipating(false);
        setHostView('host');
        socket.emit('createRoom', { gameType, debugConfig });
      }}
      onStartSinglePlayer={(gameType) => {
        setSelectedGameType(gameType);
        setRole('single_setup');
      }}
      onStartDebugCourse={(hole) => {
        setSelectedGameType('golf');
        setSinglePlayConfig({
          mode: 'debug_course',
          timeLimit: 9999,
          gameTitle: 'ゴルフゲーム デバッグ',
          shotsPerQuestion: 3,
          debugHole: hole,
          debugFreePlay: true,
        });
        setRole('single_play');
      }}
      onStartDebugBomberMap={(playerCount) => {
        setSelectedGameType('bomber');
        setSinglePlayConfig({
          mode: 'debug_multiplayer_map',
          timeLimit: 9999,
          gameTitle: `クイズボンバー ${playerCount}人マップデバッグ`,
          debugPlayerCount: playerCount,
        });
        setRole('single_play');
      }}
      onStartDebugDodgeMode={() => {
        setSelectedGameType('dodge');
        setSinglePlayConfig({
          mode: 'debug_dodge',
          timeLimit: 9999,
          gameTitle: 'バトルドッジ デバッグ',
        });
        setRole('single_play');
      }}
    />
  );
}
