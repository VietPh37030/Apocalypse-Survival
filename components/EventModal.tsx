import React from 'react';
import type { GameEvent, Choice, Inventory, ResourceKey } from '../types';

interface EventModalProps {
  event: GameEvent;
  onChoice: (choice: Choice) => void;
  isLoading: boolean;
  inventory: Inventory;
}

const EventModal: React.FC<EventModalProps> = ({ event, onChoice, isLoading, inventory }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border-2 border-amber-400 rounded-lg shadow-2xl w-full max-w-lg p-6 text-white crt-effect animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4 text-amber-300 font-display">{event.eventTitle}</h2>
        <p className="mb-6 text-gray-300 leading-relaxed">{event.eventDescription}</p>
        <div className="space-y-3">
          {event.choices.map((choice, index) => {
            const requiredItem = choice.requiredItem;
            const hasItem = requiredItem ? inventory[requiredItem] > 0 : true;
            const isDisabled = isLoading || !hasItem;
            
            return (
              <button
                key={index}
                onClick={() => onChoice(choice)}
                disabled={isDisabled}
                className="w-full text-left bg-gray-800 hover:bg-amber-600 border border-amber-500/50 text-amber-300 font-bold py-3 px-4 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {`> ${choice.text}`}
                {!hasItem && <span className="text-xs text-red-400/80 ml-2">(Cần có: {requiredItem})</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
