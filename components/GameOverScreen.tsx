
import React from 'react';

interface GameOverScreenProps {
  message: string;
  isWin: boolean;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ message, isWin, onRestart }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 text-center">
      <div className="crt-effect">
        <h2 className={`text-4xl font-display mb-4 ${isWin ? 'text-green-400' : 'text-red-500'}`}>
          {isWin ? 'SỐNG SÓT' : 'TRÒ CHƠI KẾT THÚC'}
        </h2>
        <p className="text-lg mb-8 text-gray-300">{message}</p>
        <button
          onClick={onRestart}
          className="bg-gray-700 hover:bg-green-600 border border-green-500/50 text-green-300 font-bold py-3 px-6 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Chơi lại
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
