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
    longTermEffects: "Nếu không chữa trị, có thể dẫn đến suy nhược kéo dài.",
    cure: "Nghỉ ngơi. Thuốc có thể giúp đẩy nhanh quá trình phục hồi.",
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
    longTermEffects: "Suy kiệt nghiêm trọng nếu không được bù nước kịp thời.",
    cure: "Cần uống nhiều nước và nghỉ ngơi. Thuốc sẽ giúp giảm triệu chứng.",
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
    longTermEffects: "Có thể dẫn đến hành vi khó lường và xung đột bạo lực.",
    cure: "Cần sự an ủi, giữ tinh thần lạc quan. Không có thuốc chữa trực tiếp.",
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
    longTermEffects: "Tổn thương vĩnh viễn cho cơ thể, tăng nguy cơ tử vong.",
    cure: "Gần như không thể chữa trong điều kiện hầm. Thuốc chỉ có thể làm chậm quá trình.",
  },
};