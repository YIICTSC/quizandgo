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

export default function App() {
  const [role, setRole] = useState<'none' | 'host' | 'player' | 'single_setup' | 'single_play'>('none');
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedGameType, setSelectedGameType] = useState<string>('golf');
  const [singlePlayConfig, setSinglePlayConfig] = useState<{ mode: string; questions?: any[]; timeLimit: number; gameTitle: string } | null>(null);
  const returnToTitle = () => {
    setRole('none');
    setRoomId('');
    setPlayerName('');
    setSinglePlayConfig(null);
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
    return <HostScreen roomId={roomId} onReturnToTitle={returnToTitle} />;
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
        gameTitle={selectedGameType === 'golf' ? 'ゴルフゲーム' : selectedGameType}
        onStartSinglePlayer={(payload) => {
          setSinglePlayConfig(payload);
          setRole('single_play');
        }}
      />
    );
  }

  if (role === 'single_play' && singlePlayConfig) {
    return (
      <SinglePlayScreen
        questions={singlePlayConfig.questions}
        mode={singlePlayConfig.mode}
        timeLimit={singlePlayConfig.timeLimit}
        gameTitle={singlePlayConfig.gameTitle}
        onReturnToTitle={returnToTitle}
      />
    );
  }

  return (
    <Home 
      onJoin={(id, name) => {
        setPlayerName(name);
        setRole('player');
        socket.emit('joinRoom', { roomId: id, name });
      }}
      onCreate={(gameType) => {
        setSelectedGameType(gameType);
        setRole('host');
        socket.emit('createRoom');
      }}
      onStartSinglePlayer={(gameType) => {
        setSelectedGameType(gameType);
        setRole('single_setup');
      }}
    />
  );
}
