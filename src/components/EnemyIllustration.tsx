import React, { useEffect, useState } from 'react';
import PixelSprite from './PixelSprite';
import { getEnemyIllustrationPaths } from '../utils/enemyIllustration';

interface EnemyIllustrationProps {
  name: string;
  seed: string;
  aliases?: string[];
  className?: string;
  size?: number;
}

const EnemyIllustration: React.FC<EnemyIllustrationProps> = ({ name, seed, aliases = [], className = '', size = 16 }) => {
  const imagePaths = getEnemyIllustrationPaths(name, aliases);
  const [pathIndex, setPathIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    setPathIndex(0);
    setImageStatus('loading');
  }, [name, aliases.join('|')]);

  return (
    <div className={`relative ${className}`}>
      {imageStatus === 'error' && (
        <PixelSprite seed={seed} name={name} className="w-full h-full" size={size} />
      )}
      <img
        src={imagePaths[pathIndex]}
        alt={name}
        className={`absolute inset-0 w-full h-full object-contain ${imageStatus === 'error' ? 'opacity-0 pointer-events-none' : ''}`}
        onLoad={() => setImageStatus('loading')}
        onError={() => {
          if (pathIndex + 1 < imagePaths.length) {
            setPathIndex(pathIndex + 1);
            setImageStatus('loading');
            return;
          }
          setImageStatus('error');
        }}
        draggable={false}
      />
    </div>
  );
};

export default EnemyIllustration;
