import React from 'react';
import type { Character } from '../types';

interface ScoutSelectionModalProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
  onClose: () => void;
}

const ScoutSelectionModal: React.FC<ScoutSelectionModalProps> = ({ characters, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gray-900 border-2 border-blue-400 rounded-lg shadow-2xl w-full max-w-md p-6 text-white crt-effect">
        <h2 className="text-2xl font-bold mb-4 text-blue-300 font-display">Chọn người trinh sát</h2>
        <p className="mb-6 text-gray-300 leading-relaxed text-sm">
          Chọn một người để ra ngoài tìm kiếm tài nguyên. Chuyến đi đầy rẫy hiểm nguy, và kết quả phụ thuộc vào người bạn cử đi. Người được chọn sẽ tiêu hao 1 mặt nạ phòng độc và đi hết ngày hôm nay.
        </p>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className="w-full text-left bg-gray-800 hover:bg-blue-600 border border-blue-500/50 text-blue-200 p-3 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 flex items-center justify-between"
            >
              <div>
                <p className="font-bold">{char.name}</p>
                <p className="text-xs text-gray-400">
                  SK: {char.stats.health} | TT: {char.stats.morale} | CT: {char.stats.stress}
                </p>
              </div>
               {char.sickness && <span className="text-xs text-yellow-400 font-bold">Bị bệnh</span>}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 border border-gray-500/50 text-gray-300 font-bold py-2 px-4 rounded-md transition duration-200"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoutSelectionModal;
