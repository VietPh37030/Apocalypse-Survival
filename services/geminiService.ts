import { GoogleGenAI, Type } from "@google/genai";
import type { GameState, GameEvent, Outcome, Choice, Character } from '../types';
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
  
  const inventorySummary = `Inventory: Food ${state.inventory.food}, Water ${state.inventory.water}, Meds ${state.inventory.meds}, Radio Parts ${state.inventory.radioPart}, Wrench ${state.inventory.wrench}, Gas Masks ${state.inventory.gasMask}.`;

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
                        enum: ['food', 'water', 'meds', 'radioPart', 'wrench', 'gasMask', 'none'],
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
                    item: { type: Type.STRING, enum: ['food', 'water', 'meds', 'radioPart', 'wrench', 'gasMask'] },
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
    Hãy tập trung vào: 
    - Các vấn đề nội bộ: thiếu thốn tài nguyên, hỏng hóc thiết bị, bệnh tật, xung đột giữa các thành viên, các lựa chọn đạo đức khó khăn.
    - Sự kiện môi trường: bức xạ tăng đột ngột, hầm bị rung chuyển, không khí bị nhiễm độc, có tiếng động lạ bên ngoài.
    - Sự kiện xã hội: có người lạ gõ cửa muốn trao đổi đồ, tín hiệu radio yếu ớt.

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Hãy tạo một sự kiện mới bằng tiếng Việt, ngẫu nhiên và phù hợp với trạng thái hiện tại.
    - Nếu tinh thần thấp, có thể là một cuộc cãi vã.
    - Nếu đồ dùng sắp cạn, một sự kiện về việc tìm kiếm hoặc phân chia.
    - Nếu có người ốm, một sự kiện liên quan đến bệnh tình của họ.
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

export const generateFamilyDialogue = async (gameState: GameState): Promise<string | null> => {
  const prompt = `
    Bạn là người viết kịch bản cho game sinh tồn "Hy Vọng Cuối Cùng".
    Bối cảnh: Gia đình 4 người (Ben, Ann, Nathan, Chloe) trong hầm trú ẩn ở Việt Nam.
    Dựa vào trạng thái game sau, hãy viết một đoạn hội thoại ngắn (1-2 câu trao đổi) giữa các thành viên gia đình.
    - Đoạn hội thoại phải phản ánh tình trạng hiện tại của họ (đói, bệnh, căng thẳng, v.v.).
    - Giữ giọng văn tự nhiên, chân thực, và ngột ngạt. Phong cách giống game visual novel Nhật Bản.
    - Chỉ trả về một chuỗi string chứa đoạn hội thoại. Ví dụ: "Ann: 'Ben, anh có nghe thấy không? Tiếng cào cấu ngoài cửa.'".
    - Nếu không có gì đặc biệt để nói, có thể trả về một câu mô tả không khí. Ví dụ: "Cả căn hầm chìm trong im lặng, chỉ có tiếng thở đều đặn."

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Hãy tạo một đoạn hội thoại.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating family dialogue:", error);
    return "Căn hầm chìm trong im lặng nặng nề.";
  }
};

export const generateScavengeOutcome = async (gameState: GameState): Promise<Outcome | null> => {
    const prompt = `
    Bạn là người quản trò cho game sinh tồn "Hy Vọng Cuối Cùng" ở Việt Nam.
    Bối cảnh: Một gia đình 4 người đang mắc kẹt trong hầm. Hôm nay, họ quyết định lục lọi một khu vực chưa được khám phá trong hầm trú ẩn.

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Hãy mô tả kết quả của cuộc tìm kiếm này.
    - Mô tả hành động lục lọi và kết quả một cách hấp dẫn.
    - Kết quả có thể là: tìm thấy vật phẩm hữu ích (food, water, meds, radioPart, wrench, gasMask), không tìm thấy gì, hoặc gặp phải một rủi ro (làm bị thương một người, gây ra bệnh tật, làm hỏng thứ gì đó).
    - Kết quả phải logic. Nếu họ đã có nhiều đồ, khả năng tìm thấy thêm sẽ thấp hơn. Nếu có người đang ốm yếu, họ có thể gặp tai nạn.
    - Xác định hậu quả: thay đổi chỉ số, kho đồ, và bệnh tật.
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
    console.error("Error generating scavenge outcome:", error);
    return {
        outcomeDescription: "Cuộc tìm kiếm không mang lại kết quả gì, chỉ có bụi và sự thất vọng.",
    };
  }
};


export const generateCharacterDialogue = async (gameState: GameState, targetCharacter: Character): Promise<string | null> => {
  const prompt = `
    Bạn là người viết kịch bản cho game "Hy Vọng Cuối Cùng".
    Bối cảnh: Gia đình 4 người (Ben, Ann, Nathan, Chloe) trong hầm trú ẩn ở Việt Nam. Người chơi đang điều khiển Ben (người bố).
    Ben quyết định bắt chuyện với ${targetCharacter.name}.
    Dựa vào trạng thái game và tính cách nhân vật, hãy viết một đoạn hội thoại ngắn giữa Ben và ${targetCharacter.name}.
    - Phong cách: Visual novel Nhật Bản, sâu sắc, ngắn gọn.
    - Định dạng: "[Tên người nói]: [Lời thoại]". Mỗi người nói một câu.
    Ví dụ: 
    Ben: "Em thấy sao rồi, Ann?"
    Ann: "Em không sao... chỉ là hơi lo cho bọn trẻ."

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Thông tin về ${targetCharacter.name}:
    - Mô tả: ${targetCharacter.description}
    - Tình trạng: ${targetCharacter.isAlive ? 'sống' : 'chết'}, Health ${targetCharacter.stats.health}, Hunger ${targetCharacter.stats.hunger}, Stress ${targetCharacter.stats.stress}, Morale ${targetCharacter.stats.morale}

    Hãy tạo ra một đoạn hội thoại phù hợp.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating character dialogue:", error);
    return `${targetCharacter.name} không muốn nói chuyện lúc này.`;
  }
};

export const generateScoutOutcome = async (gameState: GameState, scout: Character): Promise<Outcome | null> => {
    const prompt = `
    Bạn là người quản trò cho game sinh tồn "Hy Vọng Cuối Cùng" ở Việt Nam.
    Người chơi (Ben) đã cử ${scout.name} ra ngoài trinh sát vùng đất hoang tàn bên ngoài hầm, được trang bị một chiếc mặt nạ phòng độc.

    Trạng thái game hiện tại:
    ${getGameStateSummary(gameState)}

    Thông tin về người đi trinh sát (${scout.name}):
    Health: ${scout.stats.health}, Morale: ${scout.stats.morale}, Stress: ${scout.stats.stress}
    ${scout.sickness ? `Currently sick with ${scout.sickness.name}`: ''}

    Hãy mô tả kết quả của chuyến đi này.
    - Mô tả chi tiết hành trình và những gì họ tìm thấy hoặc trải qua.
    - Kết quả phải logic dựa trên chỉ số của người đi. Người yếu ớt (health thấp) có khả năng gặp nguy hiểm cao hơn. Người có tinh thần (morale) cao có thể tìm được thứ gì đó tạo hy vọng.
    - Các kết quả có thể bao gồm:
        - Tìm thấy nhiều vật phẩm giá trị (food, water, meds, radioPart, gasMask).
        - Gặp một sự kiện đặc biệt (tìm thấy một ghi chú, thấy dấu hiệu của người khác).
        - Bị thương hoặc mắc bệnh (đặc biệt là radiation_sickness).
        - Không tìm thấy gì và chỉ thêm mệt mỏi, căng thẳng.
    - Cung cấp mô tả hấp dẫn và các thay đổi cụ thể về chỉ số, vật phẩm, bệnh tật cho ${scout.name} hoặc cho cả gia đình.
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
    console.error("Error generating scout outcome:", error);
    return {
        outcomeDescription: `${scout.name} trở về tay không. Bên ngoài chỉ có sự im lặng chết chóc và những cơn gió bụi. Chuyến đi chỉ làm họ thêm kiệt sức.`,
        statChanges: [{ characterId: scout.id, stat: 'stress', change: 10}, { characterId: scout.id, stat: 'hunger', change: -15}]
    };
  }
};
