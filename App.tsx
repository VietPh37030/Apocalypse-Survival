import React, { useState, useMemo, useEffect } from 'react';
import type { Character, GameState, Choice, GameEvent, ResourceKey, LogEntry, Notification } from './types';
import { INITIAL_GAME_STATE, MAX_STAT, MIN_STAT, VICTORY_CONDITION } from './constants';
import * as geminiService from './services/geminiService';
import { SICKNESSES } from './sicknesses';
import CharacterCard from './components/CharacterCard';
import EventModal from './components/EventModal';
import GameOverScreen from './components/GameOverScreen';
import LoadingOverlay from './components/LoadingOverlay';
import DialogueModal from './components/DialogueModal';
import ScoutSelectionModal from './components/ScoutSelectionModal';
import { FoodIcon, WaterIcon, MedsIcon, RadioPartIcon, WrenchIcon, GasMaskIcon } from './components/icons';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const { characters, inventory, day, log, currentEvent, gameOver, isLoading, gameStarted, currentDialogue, canScavenge, talkedToToday } = gameState;
  const [selectedLogDay, setSelectedLogDay] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isScoutModalOpen, setScoutModalOpen] = useState(false);

  const addNotification = (text: string, type: 'gain' | 'loss') => {
    const newNotification: Notification = { id: Date.now(), text, type };
    setNotifications(prev => [...prev, newNotification]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 2000); // Notification lasts for 2 seconds
  };
  
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
        log: initialLog,
    }));
    setSelectedLogDay(1);
  }

  const applyStatChange = (
    chars: Character[],
    characterId: string,
    stat: keyof Character['stats'],
    change: number
  ): Character[] => {
    return chars.map(c => {
      if (c.id === characterId && c.isAlive) {
        let newValue = c.stats[stat] + change;
        newValue = Math.max(MIN_STAT, Math.min(MAX_STAT, newValue));
        return { ...c, stats: { ...c.stats, [stat]: newValue } };
      }
      return c;
    });
  };

  const processOutcome = (outcome: any, currentState: GameState) => {
    let updatedCharacters = [...currentState.characters];
    let updatedInventory = { ...currentState.inventory };
    const outcomeLogEntries: LogEntry[] = [];
  
    outcome.statChanges?.forEach((sc: any) => {
      updatedCharacters = applyStatChange(updatedCharacters, sc.characterId, sc.stat, sc.change);
    });
  
    outcome.sicknessChanges?.forEach((sc: any) => {
      updatedCharacters = updatedCharacters.map(c => {
        if (c.id === sc.characterId) {
          if (sc.sicknessId === 'none') {
            if (c.sickness) {
              outcomeLogEntries.push({ day: currentState.day, text: `${c.name} đã khỏi bệnh ${c.sickness.name}.`, type: 'status' });
            }
            return { ...c, sickness: null };
          } else {
            const newSicknessTemplate = SICKNESSES[sc.sicknessId];
            if (newSicknessTemplate) {
              const newSickness = { ...newSicknessTemplate, duration: sc.duration || newSicknessTemplate.duration };
              outcomeLogEntries.push({ day: currentState.day, text: `${c.name} đã mắc phải: ${newSickness.name}.`, type: 'status' });
              return { ...c, sickness: newSickness };
            }
          }
        }
        return c;
      });
    });
  
    outcome.inventoryChanges?.forEach((ic: any) => {
      if (ic.change > 0) {
        addNotification(`+${ic.change} ${resourceTranslations[ic.item]}`, 'gain');
      } else {
        addNotification(`${ic.change} ${resourceTranslations[ic.item]}`, 'loss');
      }
      updatedInventory[ic.item] = Math.max(0, updatedInventory[ic.item] + ic.change);
    });
  
    return { updatedCharacters, updatedInventory, outcomeLogEntries };
  };

  const handleNextDay = async (scoutingCharacterId: string | null = null) => {
    const previousState = { ...gameState, scoutingCharacterId }; // Capture state before advancing day
    const nextDayNumber = previousState.day + 1;

    setGameState(prev => ({ ...prev, isLoading: true, currentEvent: null, day: nextDayNumber, canScavenge: true, talkedToToday: [], scoutingCharacterId: null }));
    setSelectedLogDay(nextDayNumber);

    let updatedCharacters = [...previousState.characters];
    let newLogEntries: LogEntry[] = [{ day: nextDayNumber, text: `--- Ngày ${nextDayNumber} ---`, type: 'narration' }];
    let updatedInventory = { ...previousState.inventory };

    // 1. Resolve scouting mission from previous day
    if (scoutingCharacterId) {
        const scout = updatedCharacters.find(c => c.id === scoutingCharacterId);
        if (scout) {
            const scoutOutcome = await geminiService.generateScoutOutcome(previousState, scout);
            if (scoutOutcome) {
                const scoutLog: LogEntry = { day: nextDayNumber, text: `[Trinh sát] ${scoutOutcome.outcomeDescription}`, type: 'scavenge' };
                newLogEntries.push(scoutLog);
                const { updatedCharacters: charsAfterScout, updatedInventory: invAfterScout, outcomeLogEntries } = processOutcome(scoutOutcome, { ...previousState, characters: updatedCharacters, inventory: updatedInventory, day: nextDayNumber });
                updatedCharacters = charsAfterScout;
                updatedInventory = invAfterScout;
                newLogEntries.push(...outcomeLogEntries);
            }
        }
    }

    // 2. Daily stat decay and sickness checks
    updatedCharacters = updatedCharacters.map(c => {
        if (!c.isAlive) return c;

        let newStats = { ...c.stats };
        let currentSickness = c.sickness ? { ...c.sickness } : null;

        // Standard decay
        newStats.hunger = Math.max(MIN_STAT, newStats.hunger - 10);
        newStats.thirst = Math.max(MIN_STAT, newStats.thirst - 15);

        if (newStats.hunger <= MIN_STAT || newStats.thirst <= MIN_STAT) {
            newStats.health = Math.max(MIN_STAT, newStats.health - 20);
        }
      
        // Sickness effects
        if (currentSickness) {
            Object.entries(currentSickness.effects).forEach(([stat, change]) => {
                newStats[stat as keyof typeof newStats] = Math.max(MIN_STAT, Math.min(MAX_STAT, newStats[stat as keyof typeof newStats] + change));
            });

            currentSickness.duration -= 1;
            if (currentSickness.duration <= 0) {
                 if (currentSickness.worsensTo) {
                    const worseSickness = SICKNESSES[currentSickness.worsensTo];
                    if (worseSickness) {
                        newLogEntries.push({ day: nextDayNumber, text: `Bệnh tình của ${c.name} đã trở nên tồi tệ hơn! Bây giờ họ bị ${worseSickness.name}.`, type: 'status' });
                        currentSickness = { ...worseSickness };
                    } else {
                        newLogEntries.push({ day: nextDayNumber, text: `${c.name} đã tự hồi phục khỏi ${currentSickness.name}!`, type: 'status' });
                        currentSickness = null;
                    }
                } else {
                     newLogEntries.push({ day: nextDayNumber, text: `${c.name} đã tự hồi phục khỏi ${currentSickness.name}!`, type: 'status' });
                    currentSickness = null;
                }
            }
        }

        return { ...c, stats: newStats, sickness: currentSickness };
    });
    
    // 3. Check for death
    updatedCharacters = updatedCharacters.map(c => {
      if (c.isAlive && c.stats.health <= MIN_STAT) {
        newLogEntries.push({ day: nextDayNumber, text: `${c.name} đã không qua khỏi...`, type: 'status' });
        return { ...c, isAlive: false };
      }
      return c;
    });

    const stateForAI = { ...gameState, characters: updatedCharacters, inventory: updatedInventory, day: nextDayNumber, log: [...newLogEntries, ...log] };

    const dialogue = await geminiService.generateFamilyDialogue(stateForAI);
    
    setGameState(prev => ({
      ...prev,
      characters: updatedCharacters,
      inventory: updatedInventory,
      log: [...newLogEntries, ...prev.log],
      currentDialogue: dialogue,
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
    
    // 4. Fetch new event
    const event = await geminiService.generateNewEvent(stateForAI);
    if (event) {
      const eventLogEntry: LogEntry = { day: nextDayNumber, text: event.eventDescription, type: 'event' };
      setGameState(prev => ({ ...prev, currentEvent: event, isLoading: false, log: [eventLogEntry, ...prev.log] }));
    } else {
      const quietDayEntry: LogEntry = { day: nextDayNumber, text: "Một ngày yên tĩnh trôi qua.", type: 'narration' };
      setGameState(prev => ({ ...prev, isLoading: false, log: [quietDayEntry, ...prev.log] }));
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!currentEvent) return;
    setGameState(prev => ({ ...prev, isLoading: true, currentEvent: null }));

    let tempState = { ...gameState };

    if (choice.requiredItem && tempState.inventory[choice.requiredItem] > 0) {
        addNotification(`-1 ${resourceTranslations[choice.requiredItem]}`, 'loss');
        tempState.inventory = { ...tempState.inventory, [choice.requiredItem]: tempState.inventory[choice.requiredItem] - 1 };
    }

    const outcome = await geminiService.generateChoiceOutcome(tempState, currentEvent, choice);

    if (outcome) {
        const { updatedCharacters, updatedInventory, outcomeLogEntries } = processOutcome(outcome, tempState);
        
        const comprehensiveLogEntry: LogEntry = {
            day,
            text: `[Sự kiện: ${currentEvent.eventTitle}] Lựa chọn "${choice.text}" dẫn đến: ${outcome.outcomeDescription}`,
            type: 'outcome'
        };

        setGameState(prev => ({
            ...prev,
            characters: updatedCharacters,
            inventory: updatedInventory,
            log: [comprehensiveLogEntry, ...outcomeLogEntries, ...prev.log],
        }));
        
        if(updatedInventory.radioPart >= VICTORY_CONDITION.radioParts && updatedInventory.wrench >= VICTORY_CONDITION.wrench){
             setGameState(prev => ({
                ...prev, isLoading: false, currentEvent: null,
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
  
  const handleScavenge = async () => {
    setGameState(prev => ({ ...prev, isLoading: true, canScavenge: false }));
    const outcome = await geminiService.generateScavengeOutcome(gameState);

    if (outcome) {
        const scavengeLog: LogEntry = { day, text: `[Lục lọi] ${outcome.outcomeDescription}`, type: 'scavenge' };
        const { updatedCharacters, updatedInventory, outcomeLogEntries } = processOutcome(outcome, gameState);

        setGameState(prev => ({
            ...prev,
            characters: updatedCharacters,
            inventory: updatedInventory,
            log: [scavengeLog, ...outcomeLogEntries, ...prev.log]
        }));
    }
    setGameState(prev => ({ ...prev, isLoading: false }));
  };

  const handleStartScouting = (characterId: string) => {
    setScoutModalOpen(false);
    const scoutName = characters.find(c => c.id === characterId)?.name || 'Ai đó';
    const logEntry: LogEntry = { day, text: `${scoutName} đeo mặt nạ phòng độc và bước ra thế giới bên ngoài. Họ sẽ trở về vào ngày mai.`, type: 'status' };
    
    setGameState(prev => ({
        ...prev,
        inventory: { ...prev.inventory, gasMask: prev.inventory.gasMask - 1 },
        log: [logEntry, ...prev.log],
    }));
    addNotification(`-1 ${resourceTranslations.gasMask}`, 'loss');

    // Passing the scout's ID to handleNextDay to be processed
    handleNextDay(characterId);
  };


  const handleUseItem = (characterId: string, item: 'food' | 'water' | 'meds') => {
      if (inventory[item] <= 0) return;

      let updatedCharacters = [...characters];
      const character = updatedCharacters.find(c => c.id === characterId);
      if (!character || !character.isAlive) return;

      let changeApplied = false;
      let logEntryText = '';
      const player = characters.find(c => c.id === 'A')?.name || 'Ben';


      if (item === 'food') {
          updatedCharacters = applyStatChange(updatedCharacters, characterId, 'hunger', 40);
          logEntryText = `${player} đưa thức ăn cho ${character.name}.`;
          changeApplied = true;
      } else if (item === 'water') {
          updatedCharacters = applyStatChange(updatedCharacters, characterId, 'thirst', 50);
           logEntryText = `${player} đưa nước cho ${character.name}.`;
          changeApplied = true;
      } else if (item === 'meds' && character.sickness) {
          logEntryText = `${player} đưa thuốc cho ${character.name}, và họ đã khỏi bệnh ${character.sickness.name}.`;
          updatedCharacters = updatedCharacters.map(c => c.id === characterId ? { ...c, sickness: null, stats: {...c.stats, health: Math.min(MAX_STAT, c.stats.health + 20)} } : c);
          changeApplied = true;
      }
      
      if(changeApplied){
          addNotification(`-1 ${resourceTranslations[item]}`, 'loss');
          const logEntry: LogEntry = { day, text: logEntryText, type: 'status' };
          setGameState(prev => ({
              ...prev,
              characters: updatedCharacters,
              inventory: { ...prev.inventory, [item]: prev.inventory[item] - 1 },
              log: [logEntry, ...prev.log],
          }));
      }
  };
  
  const handleTalkToCharacter = async (characterId: string) => {
    const targetCharacter = characters.find(c => c.id === characterId);
    if (!targetCharacter || talkedToToday.includes(characterId)) return;

    setGameState(prev => ({ ...prev, isLoading: true }));
    const dialogue = await geminiService.generateCharacterDialogue(gameState, targetCharacter);
    
    // Conversations reduce stress and improve morale
    let updatedCharacters = applyStatChange(characters, characterId, 'stress', -10);
    updatedCharacters = applyStatChange(updatedCharacters, characterId, 'morale', 5);

    const newLogEntry: LogEntry = {
        day,
        text: `Bạn đã dành thời gian trò chuyện với ${targetCharacter.name}. Điều đó dường như giúp họ bình tĩnh hơn.`,
        type: 'status'
    };

    setGameState(prev => ({
        ...prev,
        isLoading: false,
        currentDialogue: dialogue,
        characters: updatedCharacters,
        talkedToToday: [...prev.talkedToToday, characterId],
        log: [newLogEntry, ...prev.log]
    }));
  };

  const handleRestart = () => {
      setGameState(JSON.parse(JSON.stringify(INITIAL_GAME_STATE)));
      startGame();
  }
  
  const ICONS: Record<ResourceKey, React.ReactNode> = {
      food: <FoodIcon />, water: <WaterIcon />, meds: <MedsIcon />, radioPart: <RadioPartIcon />, wrench: <WrenchIcon />, gasMask: <GasMaskIcon />,
  };
  const resourceTranslations: Record<ResourceKey, string> = {
      food: 'Thực phẩm', water: 'Nước', meds: 'Thuốc', radioPart: 'Linh kiện', wrench: 'Cờ lê', gasMask: 'Mặt nạ',
  };
  
  const logsByDay = useMemo(() => {
    return log.reduce((acc, entry) => {
        (acc[entry.day] = acc[entry.day] || []).push(entry);
        return acc;
    }, {} as Record<number, LogEntry[]>);
  }, [log]);

  const getLogEntryStyle = (type: LogEntry['type'], text: string) => {
    switch (type) {
      case 'outcome': return 'text-yellow-300 bg-yellow-900/20 p-2 rounded';
      case 'scavenge': return 'text-teal-300 bg-teal-900/20 p-2 rounded';
      case 'choice': return 'text-green-300 italic pl-4';
      case 'status': return 'text-gray-400 text-xs pl-4';
      case 'event': return 'text-gray-200 font-semibold';
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
       <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center space-y-2 w-full px-4">
            {notifications.map(n => (
                <div
                    key={n.id}
                    className={`notification-float font-display text-2xl px-4 py-2 rounded-lg shadow-2xl border-2 w-auto max-w-md text-center ${n.type === 'gain' ? 'bg-green-500/90 border-green-300 text-white' : 'bg-red-500/90 border-red-300 text-white'}`}
                >
                    {n.text}
                </div>
            ))}
        </div>
      <div className="crt-effect-soft"></div>
      
      {isLoading && <LoadingOverlay />}
      {gameOver.isGameOver && <GameOverScreen message={gameOver.message} isWin={gameOver.isWin} onRestart={handleRestart} />}
      {currentEvent && <EventModal event={currentEvent} onChoice={handleChoice} isLoading={isLoading} inventory={inventory} />}
      {currentDialogue && <DialogueModal dialogue={currentDialogue} onClose={() => setGameState(p => ({...p, currentDialogue: null}))} />}
      {isScoutModalOpen && <ScoutSelectionModal characters={characters.filter(c => c.isAlive)} onSelect={handleStartScouting} onClose={() => setScoutModalOpen(false)} />}

      <header className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-display text-green-400">HY VỌNG CUỐI CÙNG</h1>
        <p className="text-lg text-green-300/80">Ngày {day}</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-green-400 font-display">GIA ĐÌNH</h2>
          {characters.map(char => (
            <CharacterCard key={char.id} character={char} inventory={inventory} onUseItem={handleUseItem} onTalk={handleTalkToCharacter} talkedToToday={talkedToToday} />
          ))}
        </section>

        <aside className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-green-400 font-display mb-2">KHO ĐỒ</h2>
            <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg grid grid-cols-3 gap-2">
              {Object.entries(inventory).map(([key, value]) => (
                <div key={key} className="flex flex-col items-center p-2 bg-gray-800/50 rounded" title={resourceTranslations[key as ResourceKey]}>
                  <div className="text-green-400">{ICONS[key as ResourceKey]}</div>
                  <span className="font-bold text-lg">{value}</span>
                  <span className="text-xs">{resourceTranslations[key as ResourceKey]}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-green-400 font-display">NHẬT KÝ</h2>
                <div className="flex items-center space-x-2">
                    <button disabled={selectedLogDay <= 1} onClick={() => setSelectedLogDay(p => p - 1)} className="px-2 py-0.5 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded disabled:opacity-50">{'<'}</button>
                    <span className="text-sm font-display">Ngày {selectedLogDay}</span>
                    <button disabled={selectedLogDay >= day} onClick={() => setSelectedLogDay(p => p + 1)} className="px-2 py-0.5 text-xs font-bold text-green-300 bg-green-900/50 border border-green-600/50 rounded disabled:opacity-50">{'>'}</button>
                </div>
            </div>
            <div className="bg-black/30 border border-green-700/50 p-3 rounded-lg h-96 overflow-y-auto flex flex-col-reverse">
              <ul className="space-y-3 text-sm">
                {(logsByDay[selectedLogDay] || []).map((entry, index) => (
                  <li key={index} className={getLogEntryStyle(entry.type, entry.text)}>
                    {entry.text}
                  </li>
                )).reverse()}
              </ul>
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-6 py-4 flex justify-center items-center space-x-4">
        <button
            onClick={() => setScoutModalOpen(true)}
            disabled={isLoading || !!currentEvent || day <= 10 || inventory.gasMask <= 0}
            title={day <= 10 ? "Chỉ có thể trinh sát sau ngày 10." : inventory.gasMask <= 0 ? "Cần mặt nạ phòng độc." : "Gửi người ra ngoài tìm kiếm"}
            className="bg-blue-800/50 hover:bg-blue-700 border border-blue-500/50 text-blue-200 font-bold py-3 px-12 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-display"
        >
          Trinh sát
        </button>
        <button
            onClick={handleScavenge}
            disabled={isLoading || !!currentEvent || !canScavenge}
            className="bg-yellow-800/50 hover:bg-yellow-700 border border-yellow-500/50 text-yellow-200 font-bold py-3 px-12 rounded-md transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-display"
        >
          Lục lọi
        </button>
        <button
            onClick={() => handleNextDay()}
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
