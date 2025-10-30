import React, { useState, useEffect, useCallback } from 'react';
import type { Character, GameState, Choice, GameEvent, ResourceKey, LogEntry } from './types';
import { INITIAL_GAME_STATE, MAX_STAT, MIN_STAT, VICTORY_CONDITION } from './constants';
import * as geminiService from './services/geminiService';
import CharacterCard from './components/CharacterCard';
import EventModal from './components/EventModal';
import GameOverScreen from './components/GameOverScreen';
import { FoodIcon, WaterIcon, MedsIcon, RadioPartIcon, WrenchIcon } from './components/icons';

const LOG_ENTRIES_PER_PAGE = 10;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const { characters, inventory, day, log, logPage, currentEvent, gameOver, isLoading, gameStarted, intro } = gameState;

  const startGame = async () => {
    setGameState(prev => ({...prev, isLoading: true}));
    const introText = await geminiService.generateIntro();
    const initialLog: LogEntry[] = [
        { day: 1, text: introText, type: 'narration' },
        ...INITIAL_GAME_STATE.log,
    ];
    setGameState(prev => ({
        ...INITIAL_GAME_STATE,
        gameStarted: true, 
        isLoading: false, 
        intro: introText,
        log: initialLog,
    }));
  }

  const applyStatChange = (
    chars: Character[],
    characterId: string,
    stat: keyof Character['stats'],
    change: number
  ): Character[] => {
    return chars.map(c => {
      if (c.id === characterId && c.isAlive) {
        const newValue = Math.max(MIN_STAT, Math.min(MAX_STAT, c.stats[stat] + change));
        return { ...c, stats: { ...c.stats, [stat]: newValue } };
      }
      return c;
    });
  };

  const handleNextDay = useCallback(async () => {
    setGameState(prev => ({ ...prev, isLoading: true, day: prev.day + 1, logPage: 1 }));

    let updatedCharacters = [...characters];
    let newLogEntries: LogEntry[] = [{ day: day + 1, text: `--- Ngày ${day + 1} ---`, type: 'narration' }];

    // Daily stat decay and checks
    updatedCharacters = updatedCharacters.map(c => {
      if (!c.isAlive) return c;

      let newStats = { ...c.stats };
      newStats.hunger = Math.max(MIN_STAT, newStats.hunger - 10);
      newStats.thirst = Math.max(MIN_STAT, newStats.thirst - 15);

      if (newStats.hunger <= MIN_STAT || newStats.thirst <= MIN_STAT) {
        newStats.health = Math.max(MIN_STAT, newStats.health - 20);
        newLogEntries.push({ day: day + 1, text: `${c.name} đang kiệt sức vì đói và khát!`, type: 'status' });
      }
      
      if (c.isSick) {
        newStats.health = Math.max(MIN_STAT, newStats.health - 10);
        newLogEntries.push({ day: day + 1, text: `${c.name} yếu đi vì bệnh tật.`, type: 'status' });
      }

      return { ...c, stats: newStats };
    });
    
    // Check for death
    updatedCharacters = updatedCharacters.map(c => {
      if (c.isAlive && c.stats.health <= MIN_STAT) {
        newLogEntries.push({ day: day + 1, text: `${c.name} đã không qua khỏi...`, type: 'status' });
        return { ...c, isAlive: false };
      }
      return c;
    });

    setGameState(prev => ({
      ...prev,
      characters: updatedCharacters,
      log: [...newLogEntries, ...prev.log]
    }));

    // Check for game over (all dead)
    if (updatedCharacters.every(c => !c.isAlive)) {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        gameOver: { isGameOver: true, isWin: false, message: 'Tất cả mọi người đã chết. Hy vọng đã lụi tàn.' }
      }));
      return;
    }
    
    // Fetch new event
    const event = await geminiService.generateNewEvent({ ...gameState, characters: updatedCharacters, day: day + 1 });
    if (event) {
      const eventLogEntry: LogEntry = { day: day + 1, text: event.eventDescription, type: 'event' };
      setGameState(prev => ({ ...prev, currentEvent: event, isLoading: false, log: [eventLogEntry, ...prev.log] }));
    } else {
      const quietDayEntry: LogEntry = { day: day + 1, text: "Một ngày yên tĩnh trôi qua.", type: 'narration' };
      setGameState(prev => ({ ...prev, isLoading: false, log: [quietDayEntry, ...prev.log] }));
    }
  }, [day, characters, gameState]);

  const handleChoice = async (choice: Choice) => {
    if (!currentEvent) return;
    setGameState(prev => ({ ...prev, isLoading: true }));

    const outcome = await geminiService.generateChoiceOutcome(gameState, currentEvent, choice);
    
    let tempState = { ...gameState };
    const newLogEntries: LogEntry[] = [];

    newLogEntries.push({ day, text: `Lựa chọn: ${choice.text}`, type: 'choice' });

    if (choice.requiredItem && tempState.inventory[choice.requiredItem] > 0) {
        tempState.inventory = {
            ...tempState.inventory,
            [choice.requiredItem]: tempState.inventory[choice.requiredItem] - 1
        };
    }

    if (outcome) {
        newLogEntries.push({ day, text: outcome.outcomeDescription, type: 'outcome' });
        
        let updatedCharacters = [...tempState.characters];
        outcome.statChanges?.forEach(sc => {
            const charName = updatedCharacters.find(c => c.id === sc.characterId)?.name || 'Ai đó';
            const changeDesc = sc.change > 0 ? `tăng ${sc.change}` : `giảm ${Math.abs(sc.change)}`;
            newLogEntries.push({ day, text: `Chỉ số ${sc.stat} của ${charName} ${changeDesc}.`, type: 'status' });
            updatedCharacters = applyStatChange(updatedCharacters, sc.characterId, sc.stat, sc.change);
        });
        outcome.sicknessChanges?.forEach(sc => {
             const charName = updatedCharacters.find(c => c.id === sc.characterId)?.name || 'Ai đó';
             const sicknessDesc = sc.isSick ? 'bị ốm' : 'đã hồi phục';
             newLogEntries.push({ day, text: `${charName} ${sicknessDesc}.`, type: 'status' });
            updatedCharacters = updatedCharacters.map(c => c.id === sc.characterId ? { ...c, isSick: sc.isSick } : c);
        });

        let updatedInventory = { ...tempState.inventory };
        outcome.inventoryChanges?.forEach(ic => {
             const changeDesc = ic.change > 0 ? `nhận được ${ic.change}` : `mất ${Math.abs(ic.change)}`;
             newLogEntries.push({ day, text: `Kho đồ ${changeDesc} ${ic.item}.`, type: 'status' });
            updatedInventory[ic.item] = Math.max(0, updatedInventory[ic.item] + ic.change);
        });
        
        setGameState(prev => ({
            ...prev,
            characters: updatedCharacters,
            inventory: updatedInventory,
            log: [...newLogEntries, ...prev.log],
            logPage: 1,
        }));
        
        if(updatedInventory.radioPart >= VICTORY_CONDITION.radioParts && updatedInventory.wrench >= VICTORY_CONDITION.wrench){
             setGameState(prev => ({
                ...prev,
                isLoading: false,
                currentEvent: null,
                gameOver: { isGameOver: true, isWin: true, message: 'Bạn đã sửa được radio và gọi cứu trợ thành công! Bạn đã sống sót.' }
            }));
            return;
        }

    } else {
        const errorLog: LogEntry = { day, text: "Có lỗi xảy ra, sự kiện không có kết quả.", type: 'status' };
         setGameState(prev => ({ ...prev, log: [errorLog, ...prev.log] }));
    }

    setGameState(prev => ({ ...prev, isLoading: false, currentEvent: null }));
  };
  
  const handleUseItem = (characterId: string, item: 'food' | 'water' | 'meds') => {
      if (inventory[item] <= 0) return;

      let updatedCharacters = [...characters];
      const character = updatedCharacters.find(c => c.id === characterId);
      if (!character || !character.isAlive) return;

      let changeApplied = false;
      if (item === 'food') {
          updatedCharacters = applyStatChange(updatedCharacters, characterId, 'hunger', 40);
          changeApplied = true;
      } else if (item === 'water') {
          updatedCharacters = applyStatChange(updatedCharacters, characterId, 'thirst', 50);
          changeApplied = true;
      } else if (item === 'meds' && character.isSick) {
          updatedCharacters = updatedCharacters.map(c => c.id === characterId ? { ...c, isSick: false, stats: {...c.stats, health: Math.min(MAX_STAT, c.stats.health + 20)} } : c);
          changeApplied = true;
      }
      
      if(changeApplied){
          const itemTranslations: Record<typeof item, string> = { food: 'thức ăn', water: 'nước', meds: 'thuốc' };
          const logEntry: LogEntry = { day, text: `${character.name} đã dùng ${itemTranslations[item]}.`, type: 'status' };
          setGameState(prev => ({
              ...prev,
              characters: updatedCharacters,
              inventory: { ...prev.inventory, [item]: prev.inventory[item] - 1 },
              log: [logEntry, ...prev.log],
              logPage: 1,
          }));
      }
  };
  
  const handleRestart = () => {
      setGameState(JSON.parse(JSON.stringify(INITIAL_GAME_STATE)));
  }
  
  const ICONS: Record<ResourceKey, React.ReactNode> = {
      food: <FoodIcon />, water: <WaterIcon />, meds: <MedsIcon />, radioPart: <RadioPartIcon />, wrench: <WrenchIcon />,
  };
  const resourceTranslations: Record<ResourceKey, string> = {
      food: 'Thực phẩm', water: 'Nước', meds: 'Thuốc', radioPart: 'Linh kiện', wrench: 'Cờ lê',
  };
  
  const totalLogPages = Math.ceil(log.length / LOG_ENTRIES_PER_PAGE);
  const paginatedLog = log.slice((logPage - 1) * LOG_ENTRIES_PER_PAGE, logPage * LOG_ENTRIES_PER_PAGE);

  const getLogEntryStyle = (type: LogEntry['type'], text: string) => {
    switch (type) {
      case 'outcome': return 'text-yellow-300';
      case 'choice': return 'text-green-300 italic pl-4';
      case 'status': return 'text-gray-400 text-xs pl-4';
      case 'event': return 'text-gray-200';
      case 'narration':
        if (text.startsWith('---')) return 'text-center font-display text-green-500 py-2 tracking-widest';
        return 'text-gray-200';
      default: return 'opacity-80';
    }
  };


  if (!gameStarted) {
      return (
          <div className="bg-gray-900 min-h-screen text-green-300 font-mono flex flex-col items-center justify-center p-4 text-center">
              <h1 className="text-5xl font-display text-green-400 mb-4 animate-pulse">HY VỌNG CUỐI CÙNG</h1>
              <p className="text-lg text-green-300/80 mb-8 max-w-lg">Một game sinh tồn dựa trên AI, nơi mọi quyết định của gia đình bạn đều có thể là cuối cùng.</p>
              <button
                  onClick={startGame}
                  disabled={isLoading}
                  className="bg-green-800/50 hover:bg-green-700 border border-green-500/50 text-green-200 font-bold py-4 px-8 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 text-xl font-display disabled:opacity-50"
              >
                  {isLoading ? 'Đang tải...' : 'BẮT ĐẦU'}
              </button>
          </div>
      )
  }

  return (
    <div className="bg-gray-900 min-h-screen text-green-300 font-mono p-4 lg:p-8 relative flex flex-col">
      <div className="crt-effect-soft"></div>
      
      {gameOver.isGameOver && <GameOverScreen message={gameOver.message} isWin={gameOver.isWin} onRestart={handleRestart} />}
      {currentEvent && <EventModal event={currentEvent} onChoice={handleChoice} isLoading={isLoading} inventory={inventory} />}

      <header className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-display text-green-400">HY VỌNG CUỐI CÙNG</h1>
        <p className="text-lg text-green-300/80">Ngày {day}</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-green-400 font-display">GIA ĐÌNH</h2>
          {characters.map(char => (
            <CharacterCard key={char.id} character={char} inventory={inventory} onUseItem={handleUseItem} />
          ))}
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-green-400 font-display mb-2">KHO ĐỒ</h2>
            <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg grid grid-cols-3 gap-2">
              {Object.entries(inventory).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center p-2 bg-gray-800/50 rounded">
                  <div className="text-green-400">{ICONS[key as ResourceKey]}</div>
                  <span className="font-bold text-lg">{value}</span>
                  <span className="text-xs">{resourceTranslations[key as ResourceKey]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-400 font-display mb-2">NHẬT KÝ</h2>
            <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg h-96 overflow-y-auto flex flex-col-reverse">
              <ul className="space-y-2 text-sm">
                {paginatedLog.map((entry, index) => (
                  <li key={index} className={getLogEntryStyle(entry.type, entry.text)}>
                    {entry.text}
                  </li>
                ))}
              </ul>
            </div>
            {totalLogPages > 1 && (
              <div className="flex justify-center items-center mt-2 space-x-2">
                <button disabled={logPage <= 1} onClick={() => setGameState(p => ({...p, logPage: p.logPage - 1}))} className="px-3 py-1 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded disabled:opacity-50">Trước</button>
                <span className="text-xs font-display">Trang {logPage} / {totalLogPages}</span>
                <button disabled={logPage >= totalLogPages} onClick={() => setGameState(p => ({...p, logPage: p.logPage + 1}))} className="px-3 py-1 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded disabled:opacity-50">Sau</button>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="mt-6 py-4 flex justify-center">
        <button
            onClick={handleNextDay}
            disabled={isLoading || !!currentEvent}
            className="bg-green-800/50 hover:bg-green-700 border border-green-500/50 text-green-200 font-bold py-3 px-12 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-display"
        >
          {isLoading ? 'Đang xử lý...' : 'Qua ngày mới'}
        </button>
      </footer>
    </div>
  );
};

export default App;
