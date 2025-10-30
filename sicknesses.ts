import type { Sickness } from './types';

export const SICKNESSES: Record<string, Sickness> = {
  // Tier 1
  common_cold: {
    id: 'common_cold',
    name: 'Cảm lạnh',
    description: 'Triệu chứng: Ho và mệt mỏi nhẹ.',
    duration: 3,
    effects: {
      health: -5,
      morale: -5,
    },
    longTermEffects: "Nếu không chữa trị, có thể dẫn đến suy nhược kéo dài hoặc viêm phổi.",
    cure: "Nghỉ ngơi. Thuốc có thể giúp đẩy nhanh quá trình phục hồi.",
    worsensTo: 'pneumonia',
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
    longTermEffects: "Suy kiệt nghiêm trọng, có thể dẫn đến nhiễm trùng máu nếu không được bù nước.",
    cure: "Cần uống nhiều nước và nghỉ ngơi. Thuốc sẽ giúp giảm triệu chứng.",
    worsensTo: 'sepsis',
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
    longTermEffects: "Có thể dẫn đến hành vi khó lường và xung đột bạo lực, hoặc hóa điên.",
    cure: "Cần sự an ủi, giữ tinh thần lạc quan. Không có thuốc chữa trực tiếp.",
    worsensTo: 'madness',
  },
  radiation_sickness: {
    id: 'radiation_sickness',
    name: 'Bệnh phóng xạ',
    description: 'Triệu chứng: Yếu dần, buồn nôn. Rất khó chữa.',
    duration: 4,
    effects: {
      health: -10,
      stress: 10,
    },
    longTermEffects: "Tổn thương vĩnh viễn cho cơ thể, tăng nguy cơ tử vong.",
    cure: "Gần như không thể chữa trong điều kiện hầm. Thuốc chỉ có thể làm chậm quá trình.",
    worsensTo: 'critical_radiation',
  },

  // Tier 2 (Worsened)
  pneumonia: {
    id: 'pneumonia',
    name: 'Viêm phổi',
    description: 'Triệu chứng: Sốt cao, khó thở. Bệnh trở nặng từ cảm lạnh.',
    duration: 4,
    effects: {
      health: -15,
      hunger: -10,
      stress: 10,
    },
    longTermEffects: "Tổn thương phổi vĩnh viễn, có thể gây tử vong.",
    cure: "Bắt buộc phải dùng thuốc và nghỉ ngơi hoàn toàn.",
  },
  sepsis: {
    id: 'sepsis',
    name: 'Nhiễm trùng máu',
    description: 'Triệu chứng: Sốt cao, mê sảng. Biến chứng từ ngộ độc.',
    duration: 3,
    effects: {
      health: -25,
      thirst: -15,
      stress: 20,
    },
    longTermEffects: "Tỉ lệ tử vong cực kỳ cao nếu không có thuốc mạnh.",
    cure: "Cần thuốc ngay lập tức để có cơ hội sống sót.",
  },
  madness: {
    id: 'madness',
    name: 'Điên loạn',
    description: 'Triệu chứng: Mất hoàn toàn lý trí, nói chuyện một mình, hành động không thể lường trước.',
    duration: 99, // Effectively permanent
    effects: {
      stress: 30,
      morale: -30,
    },
    longTermEffects: "Trở thành gánh nặng vĩnh viễn cho gia đình.",
    cure: "Không thể chữa khỏi trong hầm.",
  },
  critical_radiation: {
    id: 'critical_radiation',
    name: 'Nhiễm xạ cấp tính',
    description: 'Triệu chứng: Suy sụp toàn thân, cơ thể bắt đầu phân rã. Giai đoạn cuối.',
    duration: 2,
    effects: {
      health: -30,
      morale: -20,
    },
    longTermEffects: "Cái chết là không thể tránh khỏi.",
    cure: "Không có cách chữa. Chỉ có thể cầu nguyện.",
  },
};
