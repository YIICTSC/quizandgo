
import React from 'react';
import { GameScreen } from '../types';
import PokerGameScreen from './PokerGameScreen';
import SchoolyardSurvivorScreen from './SchoolyardSurvivorScreen';
import SchoolDungeonRPG from './SchoolDungeonRPG';
import SchoolDungeonRPG2 from './SchoolDungeonRPG2';
import KochoShowdown from './KochoShowdown';
import PaperPlaneBattle from './PaperPlaneBattle';
import GoHomeDash from './GoHomeDash';

interface MiniGameRouterProps {
    screen: GameScreen;
    onBack: () => void;
}

/**
 * 個別のミニゲームコンポーネントとGameScreenの対応表
 * 今後ミニゲームが増えた場合は、ここに追加するだけでApp.tsxを触らずに済みます
 */
const MINI_GAME_MAP: Partial<Record<GameScreen, React.ComponentType<{ onBack: () => void }>>> = {
    [GameScreen.MINI_GAME_POKER]: PokerGameScreen,
    [GameScreen.MINI_GAME_SURVIVOR]: SchoolyardSurvivorScreen,
    [GameScreen.MINI_GAME_DUNGEON]: SchoolDungeonRPG,
    [GameScreen.MINI_GAME_DUNGEON_2]: SchoolDungeonRPG2,
    [GameScreen.MINI_GAME_KOCHO]: KochoShowdown,
    [GameScreen.MINI_GAME_PAPER_PLANE]: PaperPlaneBattle,
    [GameScreen.MINI_GAME_GO_HOME]: GoHomeDash,
};

const MiniGameRouter: React.FC<MiniGameRouterProps> = ({ screen, onBack }) => {
    const Component = MINI_GAME_MAP[screen];

    if (!Component) {
        console.error(`No component registered for mini-game screen: ${screen}`);
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-4 text-center">
                <p className="text-red-500 font-bold mb-4 text-xl">Mini-Game Component Not Found</p>
                <button onClick={onBack} className="bg-gray-800 px-6 py-2 rounded">Back</button>
            </div>
        );
    }

    return <Component onBack={onBack} />;
};

export default MiniGameRouter;
