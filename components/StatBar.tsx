import React from 'react';
import { MAX_STAT } from '../constants';
import { HungerIcon, ThirstIcon, StressIcon, HealthIcon, MoraleIcon, MoodIcon } from './icons';

interface StatBarProps {
  label: 'hunger' | 'thirst' | 'stress' | 'health' | 'morale' | 'mood';
  value: number;
}

const STAT_DESCRIPTIONS = {
    health: 'Sức khỏe: Phản ánh thể trạng chung. Nếu về 0, nhân vật sẽ chết.',
    hunger: 'Cơn đói: Cần được ăn uống. Đói sẽ làm giảm sức khỏe.',
    thirst: 'Cơn khát: Cần được uống nước. Khát sẽ làm giảm sức khỏe nhanh hơn đói.',
    stress: 'Căng thẳng: Mức độ lo lắng. Căng thẳng cao ảnh hưởng tiêu cực đến tinh thần.',
    morale: 'Tinh thần: Sự lạc quan và hy vọng. Tinh thần thấp dẫn đến những hành động tuyệt vọng.',
    mood: 'Tâm trạng: Phản ánh cảm xúc và trạng thái tinh thần chung. Tâm trạng tồi tệ có thể dẫn đến hành động tiêu cực.',
};


const StatBar: React.FC<StatBarProps> = ({ label, value }) => {
  const percentage = (value / MAX_STAT) * 100;
  
  const ICONS = {
    hunger: <HungerIcon />,
    thirst: <ThirstIcon />,
    stress: <StressIcon />,
    health: <HealthIcon />,
    morale: <MoraleIcon />,
    mood: <MoodIcon />,
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
    <div className="group relative flex items-center space-x-2 text-sm text-green-300 font-display">
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 bg-gray-900 border border-green-600 text-green-300 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        <p className="font-bold capitalize">{label}: {value}/{MAX_STAT}</p>
        <p>{STAT_DESCRIPTIONS[label]}</p>
      </div>
      
      <div className="w-5 h-5">{ICONS[label]}</div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5">
        <div className={`${getBarColor()} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="w-8 text-right">{value}</span>
    </div>
  );
};

export default StatBar;