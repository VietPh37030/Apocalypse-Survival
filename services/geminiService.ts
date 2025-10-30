import { GoogleGenAI, Type } from "@google/genai";
import type { GameState, GameEvent, Outcome, Choice } from '../types';
import { SICKNESSES } from '../sicknesses';

// Per instructions, API key is handled by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const getGameStateSummary = (state: GameState): string => {
  const charactersSummary = state.characters
    .map(c => 
      `${c.name} (${c.isAlive ? 'sống' : 'chết'}): Health ${c.stats.health}, Hunger ${c.stats.hunger}, Thirst ${c.stats.thirst}, Morale ${c.stats.morale}, Stress ${c.stats.stress}, ${c.sickness ? `Bị bệnh: ${c.sickness.name}` : 'Khỏe mạnh'}`
    )
    .join('\n');
  
  const inventorySummary = `Inventory: Food ${state.inventory.food}, Water ${state.inventory.water}, Meds ${state.inventory.meds}, Radio Parts ${state.inventory.radioPart}, Wrench ${state.inventory.wrench}.`;

  return `Day ${state.day}. \nCharacters:\n${charactersSummary}\n${inventorySummary}`;
};


const eventSchema = {
    type: Type.OBJECT,
    properties: {
        eventTitle: { type: Type.STRING },
        eventDescription: { type: Type.STRING },
        choices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    requiredItem: { 
                        type: Type.STRING,
                        enum: ['food', 'water', 'meds', 'radioPart', 'wrench', 'none'],
                        description: "Set to 'none' if no item is required."
                    },
                },
                required: ['text', 'requiredItem'],
            }
        }
    },
    required: ['eventTitle', 'eventDescription', 'choices'],
};

const outcomeSchema = {
    type: Type.OBJECT,
    properties: {
        outcomeDescription: { type: Type.STRING, description: "Describe what happens after the choice. Be dramatic and descriptive in Vietnamese." },
        statChanges: {
            type: Type.ARRAY,
            description: "List all stat changes for characters.",
            items: {
                type: Type.OBJECT,
                properties: {
                    characterId: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
                    stat: { type: Type.STRING, enum: ['health', 'hunger', 'thirst', 'stress', 'morale']},
                    change: { type: Type.NUMBER, description: "Positive or negative change amount." },
                },
                required: ['characterId', 'stat', 'change'],
            }
        },
        inventoryChanges: {
            type: Type.ARRAY,
            description: "List all inventory changes.",
            items: {
                type: Type.OBJECT,
                properties: {
                    item: { type: Type.STRING, enum: ['food', 'water', 'meds', 'radioPart', 'wrench'] },
                    change: { type: Type.NUMBER, description: "Positive or negative change amount." },
                },
                required: ['item', 'change'],
            }
        },
        sicknessChanges: {
            type: Type.ARRAY,
            description: "List changes to character sickness status.",
            items: {
                type: Type.OBJECT,
                properties: {
                    characterId: { type: Type.STRING, enum: ['A', 'B', 'C', 'D'] },
                    sicknessId: { type: Type.STRING, enum: [...Object.keys(SICKNESSES), 'none'], description: "ID of the sickness to apply, or 'none' to cure." },
                    duration: { type: Type.NUMBER, description: "Optional. Set the duration of the new sickness in days." }
                },
                required: ['characterId', 'sicknessId'],
            }
        },
    },
    required: ['outcomeDescription'],
};


export const generateIntro = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Viết một đoạn giới thiệu ngắn (2-3 câu) cho một game sinh tồn tên là "Hy Vọng Cuối Cùng". Bối cảnh là hậu tận thế ở Việt Nam sau cuộc chiến tranh hạt nhân giữa Mỹ và Trung Quốc. Một gia đình đang trú ẩn trong hầm. Giọng văn kịch tính, tập trung vào sự ngột ngạt và hy vọng mong manh.`,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating intro:", error);
        return "Thế giới đã sụp đổ sau cuộc chiến giữa các cường quốc. Chỉ còn lại tro tàn và những ký ức vỡ nát. Dưới lòng đất, trong một căn hầm cũ kỹ, gia đình bạn là tia hy vọng cuối cùng.";
    }
};


export const generateNewEvent = async (gameState: GameState): Promise<GameEvent | null> => {
  const prompt = `
    Bạn là người quản trò cho game sinh tồn "Hy Vọng Cuối Cùng". 
    Bối cảnh: Một gia đình 4 người (Ben - Bố, Ann - Mẹ, Nathan - con trai, Chloe - con gái) đang mắc kẹt trong một hầm trú ẩn hạt nhân ở Việt Nam thời hậu tận thế, sau cuộc chiến giữa Mỹ và Trung Quốc.
    Chủ đề chính là sự ngột ngạt, quản lý tài nguyên và mâu thuẫn gia đình.
    **QUAN TRỌNG: Không tạo ra các sự kiện về rừng sâu, không gian mở, hoặc những thứ không thể xảy ra bên trong hoặc ngay bên ngoài một căn hầm kín.**
    Hãy tập trung vào: thiếu thốn tài nguyên, hỏng hóc thiết bị, tiếng động lạ bên ngoài, tín hiệu radio, bệnh tật, xung đột giữa các thành viên, và các lựa chọn đạo đức khó khăn.

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Hãy tạo một sự kiện mới bằng tiếng Việt, ngẫu nhiên và phù hợp với trạng thái hiện tại.
    - Nếu tinh thần thấp, có thể là một cuộc cãi vã.
    - Nếu đồ dùng sắp cạn, một sự kiện về việc tìm kiếm hoặc phân chia.
    - Nếu có người ốm, một sự kiện liên quan đến bệnh tình của họ.
    - Đôi khi, chỉ là một sự kiện yên tĩnh, đầy không khí.
    - Giữ cho nó ngắn gọn và có tác động. Cung cấp 2-3 lựa chọn.
    - Chỉ trả về đối tượng JSON.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eventSchema,
      },
    });

    const jsonText = response.text.trim();
    const eventData = JSON.parse(jsonText);

    // Clean up requiredItem if Gemini returns 'none'
    const cleanedChoices = eventData.choices.map((choice: any) => {
        if (choice.requiredItem === 'none') {
            delete choice.requiredItem;
        }
        return choice;
    });

    return { ...eventData, choices: cleanedChoices };

  } catch (error) {
    console.error("Error generating event:", error);
    return null; // Handle error gracefully
  }
};

export const generateChoiceOutcome = async (gameState: GameState, event: GameEvent, choice: Choice): Promise<Outcome | null> => {
    const prompt = `
    Bạn là người quản trò cho game sinh tồn "Hy Vọng Cuối Cùng" ở Việt Nam.
    Bối cảnh: Một gia đình 4 người (Ben - Bố, Ann - Mẹ, Nathan - con trai, Chloe - con gái) đang mắc kẹt trong hầm sau chiến tranh hạt nhân Mỹ-Trung.
    
    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Sự kiện vừa xảy ra:
    Tiêu đề: ${event.eventTitle}
    Mô tả: ${event.eventDescription}

    Người chơi đã chọn: "${choice.text}"

    Bây giờ, hãy mô tả kết quả của lựa chọn này bằng tiếng Việt.
    - Mô tả một cách hấp dẫn và chi tiết.
    - Kết quả phải logic dựa trên lựa chọn và trạng thái game.
    - Xác định hậu quả: thay đổi chỉ số nhân vật (health, hunger, thirst, stress, morale), kho đồ, và tình trạng bệnh tật.
    - Cân nhắc việc gây ra một loại bệnh cụ thể (IDs: ${Object.keys(SICKNESSES).join(', ')}) hoặc chữa bệnh ('none').
    - Các chỉ số nhân vật nên thay đổi một cách thực tế. Một bữa ăn ngon có thể tăng nhẹ tinh thần nhưng giảm đáng kể cơn đói. Một sự kiện căng thẳng làm tăng stress.
    - Chỉ trả về đối tượng JSON.
  `;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outcomeSchema,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Outcome;
  } catch (error) {
    console.error("Error generating outcome:", error);
    return null;
  }
};
