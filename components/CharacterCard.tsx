import React from 'react';
import type { Character, Inventory, Stats } from '../types';
import StatBar from './StatBar';

interface CharacterCardProps {
  character: Character;
  inventory: Inventory;
  onUseItem: (characterId: string, item: 'food' | 'water' | 'meds') => void;
  onTalk: (characterId: string) => void;
  talkedToToday: string[];
}

const getCharacterStatus = (stats: Stats): { text: string; color: string } => {
    // Priority: Health -> Hunger/Thirst -> Mood/Stress/Morale
    if (stats.health < 30) return { text: 'Bị thương nặng', color: 'text-red-500' };
    if (stats.health < 60) return { text: 'Yếu ớt', color: 'text-yellow-400' };

    if (stats.hunger < 30) return { text: 'Đói lả', color: 'text-red-500' };
    if (stats.thirst < 30) return { text: 'Khát khô', color: 'text-red-500' };

    if (stats.hunger < 60) return { text: 'Đang đói', color: 'text-yellow-400' };
    if (stats.thirst < 60) return { text: 'Đang khát', color: 'text-yellow-400' };

    if (stats.mood < 30) return { text: 'Tuyệt vọng', color: 'text-red-500' };
    if (stats.mood < 50) return { text: 'Bất an', color: 'text-yellow-400' };

    if (stats.stress > 70) return { text: 'Hoảng loạn', color: 'text-red-500' };
    if (stats.stress > 40) return { text: 'Căng thẳng', color: 'text-yellow-400' };

    if (stats.morale < 30) return { text: 'Trầm cảm', color: 'text-red-500' };
    if (stats.morale < 60) return { text: 'Buồn bã', color: 'text-yellow-400' };
    
    return { text: 'Bình thường', color: 'text-green-400' };
};

const ActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  title?: string;
}> = ({ onClick, disabled, children, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="px-2 py-1 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded hover:bg-green-800 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

const CharacterCard: React.FC<CharacterCardProps> = ({ character, inventory, onUseItem, onTalk, talkedToToday }) => {
  const isDead = !character.isAlive;
  const isPlayer = character.id === 'A';
  const hasBeenTalkedTo = talkedToToday.includes(character.id);

  const cardClasses = `bg-black/30 border border-green-700/50 p-3 rounded-lg shadow-lg transition-all duration-300 ${isDead ? 'grayscale opacity-50' : ''}`;
  const status = getCharacterStatus(character.stats);
  
  const sicknessTitle = character.sickness 
    ? `${character.sickness.description}\n\nTác động lâu dài: ${character.sickness.longTermEffects}\n\nCách chữa: ${character.sickness.cure}` 
    : '';

  return (
    <div className={cardClasses}>
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 bg-gray-800 border-2 border-green-600/50 rounded-full mr-4 flex items-center justify-center font-display text-4xl text-green-400">
          {character.id}
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-300 font-display">{character.name}</h3>
          {!isDead && (
            <p className={`text-sm font-bold ${status.color}`}>Trạng thái: {status.text}</p>
          )}
          <p className="text-sm text-green-400/80 mt-1">{character.description}</p>
          {character.sickness && (
            <p className="text-sm font-bold text-yellow-400 mt-1 cursor-help" title={sicknessTitle}>
              Bệnh: {character.sickness.name} ({character.sickness.duration} ngày) ⓘ
            </p>
          )}
          {isDead && <p className="text-lg font-bold text-red-500 transform -rotate-12 mt-2">ĐÃ CHẾT</p>}
        </div>
      </div>
      {!isDead && (
        <>
          <div className="space-y-1">
            <StatBar label="health" value={character.stats.health} />
            <StatBar label="hunger" value={character.stats.hunger} />
            <StatBar label="thirst" value={character.stats.thirst} />
            <StatBar label="morale" value={character.stats.morale} />
            <StatBar label="mood" value={character.stats.mood} />
            <StatBar label="stress" value={character.stats.stress} />
          </div>
          <div className="mt-3 pt-2 border-t border-green-700/30 flex justify-end space-x-2">
            {!isPlayer && (
              <ActionButton 
                onClick={() => onTalk(character.id)} 
                disabled={hasBeenTalkedTo}
                title={hasBeenTalkedTo ? "Bạn đã nói chuyện với người này hôm nay." : "Trò chuyện để giảm căng thẳng"}
              >
                Trò chuyện
              </ActionButton>
            )}
            <ActionButton onClick={() => onUseItem(character.id, 'food')} disabled={inventory.food <= 0}>
              Ăn
            </ActionButton>
            <ActionButton onClick={() => onUseItem(character.id, 'water')} disabled={inventory.water <= 0}>
              Uống
            </ActionButton>
            <ActionButton onClick={() => onUseItem(character.id, 'meds')} disabled={inventory.meds <= 0 || !character.sickness}>
              Dùng thuốc
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CharacterCard;