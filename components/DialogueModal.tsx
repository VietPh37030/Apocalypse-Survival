import React, { useMemo } from 'react';

interface DialogueModalProps {
  dialogue: string;
  onClose: () => void;
}

const DialogueModal: React.FC<DialogueModalProps> = ({ dialogue, onClose }) => {

  const formattedDialogue = useMemo(() => {
    return dialogue.split('\n').map((line, index) => {
      const parts = line.split(':');
      if (parts.length > 1) {
        return (
          <p key={index}>
            <span className="font-bold text-cyan-300">{parts[0]}:</span>
            <span className="italic">"{parts.slice(1).join(':')}"</span>
          </p>
        );
      }
      return <p key={index} className="italic">"{line}"</p>;
    });
  }, [dialogue]);


  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center p-4 z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-gray-900/80 backdrop-blur-sm border-t-2 border-cyan-400 w-full max-w-4xl p-6 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 text-cyan-200 leading-relaxed text-lg space-y-2">
            {formattedDialogue}
        </div>
        <div className="flex justify-end">
            <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-cyan-600 border border-cyan-500/50 text-cyan-300 font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
            Tiếp tục...
            </button>
        </div>
      </div>
    </div>
  );
};

export default DialogueModal;