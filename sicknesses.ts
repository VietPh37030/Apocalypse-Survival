import type { Sickness } from './types';

export const SICKNESSES: Record<string, Sickness> = {
  common_cold: {
    id: 'common_cold',
    name: 'Cảm lạnh',
    description: 'Triệu chứng: Ho và mệt mỏi nhẹ.',
    duration: 3,
    effects: {
      health: -5,
      morale: -5,
    },
  },
  food_poisoning: {
    id: 'food_poisoning',
    name: 'Ngộ độc thực phẩm',
    description: 'Triệu chứng: Đau bụng và mất nước nghiêm trọng.',
    duration: 2,
    effects: {
      health: -15,
      hunger: -10,
      thirst: -20,
    },
  },
  bunker_fever: {
    id: 'bunker_fever',
    name: 'Hội chứng hầm kín',
    description: 'Triệu chứng: Cáu kỉnh, hoang tưởng và mất tinh thần.',
    duration: 5,
    effects: {
      stress: 15,
      morale: -10,
    },
  },
  radiation_sickness: {
    id: 'radiation_sickness',
    name: 'Bệnh phóng xạ',
    description: 'Triệu chứng: Yếu dần, buồn nôn. Rất khó chữa.',
    duration: 7,
    effects: {
      health: -10,
      stress: 10,
    },
  },
};
