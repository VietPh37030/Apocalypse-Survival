
import React from 'react';
import { MAX_STAT } from '../constants';
import { HungerIcon, ThirstIcon, StressIcon, HealthIcon, MoraleIcon } from './icons';

interface StatBarProps {
  label: 'hunger' | 'thirst' | 'stress' | 'health' | 'morale';
  value: number;
}

const StatBar: React.FC<StatBarProps> = ({ label, value }) => {
  const percentage = (value / MAX_STAT) * 100;
  
  const ICONS = {
    hunger: <HungerIcon />,
    thirst: <ThirstIcon />,
    stress: <StressIcon />,
    health: <HealthIcon />,
    morale: <MoraleIcon />,
  };
  
  const COLORS = {
    hunger: 'bg-yellow-500',
    thirst: 'bg-blue-500',
    stress: 'bg-purple-500',
    health: 'bg-red-500',
    morale: 'bg-green-500',
  };
  
  const getBarColor = () => {
      if (label === 'stress') {
          if (value > 70) return 'bg-red-600';
          if (value > 40) return 'bg-yellow-500';
          return 'bg-green-500';
      }
      if (value < 30) return 'bg-red-600';
      if (value < 60) return 'bg-yellow-500';
      return 'bg-green-500';
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-green-300 font-display">
      <div className="w-5 h-5">{ICONS[label]}</div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5">
        <div className={`${getBarColor()} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="w-8 text-right">{value}</span>
    </div>
  );
};

export default StatBar;
