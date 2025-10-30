import React from 'react';
import type { ShelterState, Inventory } from '../types';
import { RadioPartIcon, WrenchIcon, RepairIcon } from './icons'; // Assuming RadioPartIcon can be reused for radio

interface ShelterManagementProps {
  shelterState: ShelterState;
  inventory: Inventory;
  onRepair: (item: 'radio' | 'waterFilter') => void;
  onUseRadio: () => void;
  radioUsedToday: boolean;
}

const DurabilityBar: React.FC<{ value: number }> = ({ value }) => {
  const percentage = Math.max(0, Math.min(100, value));
  const getColor = () => {
    if (percentage < 30) return 'bg-red-600';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-gray-700/50 rounded-full h-2.5">
      <div className={`${getColor()} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
    </div>
  );
};

const ShelterManagement: React.FC<ShelterManagementProps> = ({
  shelterState,
  inventory,
  onRepair,
  onUseRadio,
  radioUsedToday
}) => {
  const { radioDurability, waterFilterDurability } = shelterState;
  const hasWrench = inventory.wrench > 0;

  return (
    <div>
      <h2 className="text-xl font-bold text-green-400 font-display mb-2">QUẢN LÝ HẦM</h2>
      <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg space-y-4">
        {/* Radio */}
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-bold">Radio</span>
            <span className={radioDurability < 30 ? 'text-red-500' : 'text-green-300'}>
              {Math.round(radioDurability)}%
            </span>
          </div>
          <DurabilityBar value={radioDurability} />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => onRepair('radio')}
              disabled={!hasWrench || radioDurability >= 100}
              title={!hasWrench ? "Cần cờ lê" : "Sửa radio"}
              className="px-2 py-1 text-xs font-bold text-yellow-300 bg-yellow-900/50 border border-yellow-600/50 rounded hover:bg-yellow-800 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Sửa <RepairIcon />
            </button>
            <button
              onClick={onUseRadio}
              disabled={radioDurability <= 0 || radioUsedToday}
              title={radioDurability <= 0 ? "Radio bị hỏng!" : radioUsedToday ? "Đã dùng hôm nay" : "Dò sóng radio"}
              className="px-2 py-1 text-xs font-bold text-cyan-300 bg-cyan-900/50 border border-cyan-600/50 rounded hover:bg-cyan-800 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Dò sóng
            </button>
          </div>
        </div>
        
        {/* Water Filter */}
        <div>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-bold">Máy lọc nước</span>
            <span className={waterFilterDurability < 30 ? 'text-red-500' : 'text-green-300'}>
              {Math.round(waterFilterDurability)}%
            </span>
          </div>
          <DurabilityBar value={waterFilterDurability} />
           <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => onRepair('waterFilter')}
              disabled={!hasWrench || waterFilterDurability >= 100}
              title={!hasWrench ? "Cần cờ lê" : "Sửa máy lọc nước"}
              className="px-2 py-1 text-xs font-bold text-yellow-300 bg-yellow-900/50 border border-yellow-600/50 rounded hover:bg-yellow-800 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Sửa <RepairIcon />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShelterManagement;
