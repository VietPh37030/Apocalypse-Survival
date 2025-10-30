import React from 'react';
import type { ShelterState } from '../types';
import { RadiationIcon, AirQualityIcon, ShelterIntegrityIcon } from './icons';

interface EnvironmentStatusProps {
  shelterState: ShelterState;
}

const EnvironmentStatus: React.FC<EnvironmentStatusProps> = ({ shelterState }) => {
  const { radiationLevel, airQuality, integrity } = shelterState;

  const getStatusColor = (type: 'radiation' | 'air' | 'integrity', value: any) => {
    if (type === 'radiation') {
      if (value === 'Nguy hiểm') return 'text-red-500';
      if (value === 'Cao') return 'text-yellow-400';
      return 'text-green-400';
    }
    if (type === 'air') {
      if (value === 'Độc hại') return 'text-red-500';
      if (value === 'Kém') return 'text-yellow-400';
      return 'text-green-400';
    }
    if (type === 'integrity') {
      if (value < 30) return 'text-red-500';
      if (value < 70) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-gray-300';
  };

  return (
    <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg text-xs font-display">
      <h3 className="text-green-400 font-bold mb-2 text-base">TRẠNG THÁI HẦM</h3>
      <div className="space-y-2">
        <div className="flex items-center" title="Mức độ phóng xạ bên ngoài">
          <RadiationIcon />
          <span className="ml-2">Bức xạ:</span>
          <span className={`font-bold ml-auto ${getStatusColor('radiation', radiationLevel)}`}>
            {radiationLevel}
          </span>
        </div>
        <div className="flex items-center" title="Chất lượng không khí trong hầm">
          <AirQualityIcon />
          <span className="ml-2">Không khí:</span>
          <span className={`font-bold ml-auto ${getStatusColor('air', airQuality)}`}>
            {airQuality}
          </span>
        </div>
        <div className="flex items-center" title="Độ bền của cấu trúc hầm">
          <ShelterIntegrityIcon />
          <span className="ml-2">Độ bền:</span>
          <span className={`font-bold ml-auto ${getStatusColor('integrity', integrity)}`}>
            {integrity}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentStatus;
