import React from 'react';
import type { Character, Inventory, ResourceKey } from '../types';
import StatBar from './StatBar';

interface CharacterCardProps {
  character: Character;
  inventory: Inventory;
  onUseItem: (characterId: string, item: 'food' | 'water' | 'meds') => void;
}

const ItemButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-2 py-1 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded hover:bg-green-800 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

const CharacterCard: React.FC<CharacterCardProps> = ({ character, inventory, onUseItem }) => {
  const isDead = !character.isAlive;
  const cardClasses = `bg-black/30 border border-green-700/50 p-3 rounded-lg shadow-lg transition-all duration-300 ${isDead ? 'grayscale opacity-50' : ''}`;

  return (
    <div className={cardClasses}>
      <div className="flex items-center mb-3">
        <div className="w-16 h-16 bg-gray-800 border-2 border-green-600/50 rounded-full mr-4 flex items-center justify-center font-display text-4xl text-green-400">
          {character.id}
        </div>
        <div>
          <h3 className="text-lg font-bold text-green-300 font-display">{character.name}</h3>
          <p className="text-sm text-green-400/80">{character.description}</p>
          {character.isSick && <p className="text-sm font-bold text-yellow-400">Đang bị ốm</p>}
          {isDead && <p className="text-lg font-bold text-red-500 transform -rotate-12">ĐÃ CHẾT</p>}
        </div>
      </div>
      {!isDead && (
        <>
          <div className="space-y-1">
            <StatBar label="health" value={character.stats.health} />
            <StatBar label="hunger" value={character.stats.hunger} />
            <StatBar label="thirst" value={character.stats.thirst} />
            <StatBar label="morale" value={character.stats.morale} />
            <StatBar label="stress" value={character.stats.stress} />
          </div>
          <div className="mt-3 pt-2 border-t border-green-700/30 flex justify-end space-x-2">
            <ItemButton onClick={() => onUseItem(character.id, 'food')} disabled={inventory.food <= 0}>
              Ăn
            </ItemButton>
            <ItemButton onClick={() => onUseItem(character.id, 'water')} disabled={inventory.water <= 0}>
              Uống
            </ItemButton>
            <ItemButton onClick={() => onUseItem(character.id, 'meds')} disabled={inventory.meds <= 0 || !character.isSick}>
              Dùng thuốc
            </ItemButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CharacterCard;
