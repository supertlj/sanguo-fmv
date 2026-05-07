'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Option {
  text?: string;
  item?: string;
  leads_to: number | string;
  x?: number;      
  y?: number;      
  width?: number;  
  height?: number; 
  points?: [number, number][]; // Points for polygonal hotspot [[x,y], [x,y]...]
  effect?: 'glow' | 'zoom' | 'none';
  color?: string;
  scale?: number;
}

interface Item {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

interface InteractionConfig {
  duration?: number;       // For QTEs
  layout?: 'full_screen' | 'standard' | 'hotspots';
  filter_collected?: boolean;
  all_collected_leads_to?: number | string;
  hint_text?: string;
  qte_text?: string;
}

interface Scene {
  scene_id: number | string;
  video_file: string;
  start_time: string;
  end_time: string;
  simple_description: string;
  detailed_description: string;
  is_interactive?: boolean;
  interaction_type?: 'qte' | 'choice' | 'hotspots' | 'none';
  interaction_config?: InteractionConfig;
  options?: Option[];
  leads_to?: number | string;
  return_to_id?: number | string;
}

interface GameState {
  currentSceneId: number | string;
  inventory: string[];
  affection: Record<string, number>;
  history: (number | string)[];
  unlockedScenes: (number | string)[]; // Using array for easy JSON serialization
}

interface SaveSlot {
  id: string;
  timestamp: number;
  sceneId: number | string;
  sceneDescription: string;
  data: GameState;
}

interface GameContextType {
  state: GameState;
  scenes: Scene[];
  items: Item[];
  currentScene: Scene | null;
  setCurrentScene: (id: number | string) => void;
  jumpToScene: (id: number | string) => void;
  addToInventory: (itemId: string) => void;
  removeFromInventory: (itemId: string) => void;
  getItemById: (itemId: string) => Item | undefined;
  updateAffection: (character: string, delta: number) => void;
  saveGame: (slotId: string) => void;
  loadGame: (slotId: string) => void;
  saveSlots: SaveSlot[];
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>({
    currentSceneId: 1,
    inventory: [],
    affection: {},
    history: [],
    unlockedScenes: [1],
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load scenes and save slots on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [scenesRes, itemsRes] = await Promise.all([
          fetch('/data/sanguo_interaction.json'),
          fetch('/data/sanguo_items.json')
        ]);
        
        const [scenesData, itemsData] = await Promise.all([
          scenesRes.json(),
          itemsRes.json()
        ]);

        setScenes(scenesData);
        setItems(itemsData);
        
        const saved = localStorage.getItem('fmv_save_slots');
        if (saved) {
          const slots = JSON.parse(saved) as SaveSlot[];
          setSaveSlots(slots);
          
          // Auto-load logic: if there is an 'auto' slot, restore it
          const autoSlot = slots.find(s => s.id === 'auto');
          if (autoSlot) {
            setState(autoSlot.data);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to init game:', error);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const currentScene = scenes.find(s => s.scene_id === state.currentSceneId) || null;

  const setCurrentScene = (id: number | string) => {
    setState(prev => {
      const nextUnlocked = prev.unlockedScenes.includes(id) 
        ? prev.unlockedScenes 
        : [...prev.unlockedScenes, id];
        
      const nextState = {
        ...prev,
        currentSceneId: id,
        history: [...prev.history, prev.currentSceneId],
        unlockedScenes: nextUnlocked,
      };

      // Auto-save every time scene changes
      setTimeout(() => autoSave(nextState), 100);
      
      return nextState;
    });
  };

  const jumpToScene = (id: number | string) => {
    setState(prev => ({
      ...prev,
      currentSceneId: id,
    }));
  };

  const saveGame = (slotId: string) => {
    const newSlot: SaveSlot = {
      id: slotId,
      timestamp: Date.now(),
      sceneId: state.currentSceneId,
      sceneDescription: currentScene?.simple_description || '未知场景',
      data: { ...state }
    };

    setSaveSlots(prev => {
      const filtered = prev.filter(s => s.id !== slotId);
      const next = [...filtered, newSlot].sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem('fmv_save_slots', JSON.stringify(next));
      return next;
    });
  };

  const autoSave = (stateToSave: GameState) => {
    const sceneDesc = scenes.find(s => s.scene_id === stateToSave.currentSceneId)?.simple_description || '自动存档';
    const autoSlot: SaveSlot = {
      id: 'auto',
      timestamp: Date.now(),
      sceneId: stateToSave.currentSceneId,
      sceneDescription: `[自动] ${sceneDesc}`,
      data: stateToSave
    };

    setSaveSlots(prev => {
      const filtered = prev.filter(s => s.id !== 'auto');
      const next = [autoSlot, ...filtered];
      localStorage.setItem('fmv_save_slots', JSON.stringify(next));
      return next;
    });
  };

  const loadGame = (slotId: string) => {
    const slot = saveSlots.find(s => s.id === slotId);
    if (slot) {
      setState(slot.data);
    }
  };

  const addToInventory = (item: string) => {
    setState(prev => {
      const next = {
        ...prev,
        inventory: [...prev.inventory, item],
      };
      setTimeout(() => autoSave(next), 100);
      return next;
    });
  };

  const removeFromInventory = (item: string) => {
    setState(prev => {
      const next = {
        ...prev,
        inventory: prev.inventory.filter(i => i !== item),
      };
      setTimeout(() => autoSave(next), 100);
      return next;
    });
  };

  const getItemById = (itemId: string) => items.find(i => i.id === itemId);

  const updateAffection = (character: string, delta: number) => {
    setState(prev => ({
      ...prev,
      affection: {
        ...prev.affection,
        [character]: (prev.affection[character] || 0) + delta,
      },
    }));
  };

  return (
    <GameContext.Provider value={{ 
      state, 
      scenes, 
      items,
      currentScene, 
      setCurrentScene, 
      jumpToScene, 
      addToInventory, 
      removeFromInventory,
      getItemById,
      updateAffection, 
      saveGame,
      loadGame,
      saveSlots,
      isLoading 
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
