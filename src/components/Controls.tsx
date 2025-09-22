// src/components/Controls.tsx

import React from 'react';
import type { AnimationState } from '../types';

interface Props {
  animationState: AnimationState;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onSeek: (time: number) => void;
}

const Controls: React.FC<Props> = ({
  animationState,
  onPlay,
  onPause,
  onRestart,
  onSeek,
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = clickX / rect.width;
    const newTime = progress * animationState.duration;
    onSeek(newTime);
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={animationState.isPlaying ? onPause : onPlay}
            disabled={animationState.duration === 0}
            className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                     disabled:cursor-not-allowed text-white flex items-center justify-center
                     transition-colors duration-200 text-lg"
          >
            {animationState.isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button
            onClick={onRestart}
            disabled={animationState.duration === 0}
            className="w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                     disabled:cursor-not-allowed text-white flex items-center justify-center
                     transition-colors duration-200 text-lg"
          >
            ⏮️
          </button>
        </div>

        {/* Progress Section */}
        <div className="flex-1 space-y-2">
          {/* Time Display */}
          <div className="flex items-center justify-center gap-1 font-mono text-sm text-gray-600">
            <span>{formatTime(animationState.currentTime)}</span>
            <span className="text-gray-400">/</span>
            <span>{formatTime(animationState.duration)}</span>
          </div>

          {/* Progress Bar */}
          <div
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${animationState.progress * 100}%` }}
            />
            <div
              className="absolute top-1/2 w-4 h-4 bg-blue-500 border-2 border-white rounded-full 
                       transform -translate-y-1/2 shadow-sm transition-all duration-100
                       group-hover:scale-110"
              style={{ left: `${animationState.progress * 100}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            />
          </div>

          {/* Status */}
          <div className="text-center">
            {animationState.isPlaying && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Playing
              </span>
            )}
            {!animationState.isPlaying && animationState.currentTime > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                Paused
              </span>
            )}
            {animationState.currentTime === 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                Ready
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;