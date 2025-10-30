import type { GameState, Character } from './types';

export const MAX_STAT = 100;
export const MIN_STAT = 0;

export const INITIAL_CHARACTERS: Character[] = [
  {
    id: 'A',
    name: 'Ben (Father)',
    description: 'A skilled engineer, the family\'s pillar of strength.',
    stats: { health: 100, hunger: 80, thirst: 80, stress: 20, morale: 70 },
    isAlive: true,
    sickness: null,
  },
  {
    id: 'B',
    name: 'Ann (Mother)',
    description: 'A nurse, the heart of the family, always caring for others.',
    stats: { health: 100, hunger: 80, thirst: 80, stress: 30, morale: 80 },
    isAlive: true,
    sickness: null,
  },
  {
    id: 'C',
    name: 'Nathan (Son)',
    description: 'A curious teenager, eager to explore the world outside.',
    stats: { health: 100, hunger: 80, thirst: 80, stress: 10, morale: 60 },
    isAlive: true,
    sickness: null,
  },
  {
    id: 'D',
    name: 'Chloe (Daughter)',
    description: 'A young girl, easily affected by the oppressive atmosphere.',
    stats: { health: 90, hunger: 70, thirst: 70, stress: 40, morale: 75 },
    isAlive: true,
    sickness: null,
  },
];


export const INITIAL_GAME_STATE: GameState = {
  characters: JSON.parse(JSON.stringify(INITIAL_CHARACTERS)), // Deep copy
  inventory: {
    food: 8,
    water: 8,
    meds: 3,
    radioPart: 0,
    wrench: 0,
  },
  day: 1,
  log: [{ day: 1, text: 'Trò chơi bắt đầu. Cả gia đình đang ở trong một căn hầm trú ẩn an toàn, ít nhất là cho bây giờ.', type: 'narration' }],
  logPage: 1,
  currentEvent: null,
  gameOver: {
    isGameOver: false,
    isWin: false,
    message: '',
  },
  isLoading: false,
  gameStarted: false,
  intro: '',
};

export const VICTORY_CONDITION = {
    radioParts: 3,
    wrench: 1,
};
