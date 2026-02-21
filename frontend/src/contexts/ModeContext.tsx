import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Mode = 'BUYING' | 'SELLING';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    // Load from localStorage or default to BUYING
    const saved = localStorage.getItem('userMode');
    return (saved === 'BUYING' || saved === 'SELLING') ? saved : 'BUYING';
  });

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('userMode', newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'BUYING' ? 'SELLING' : 'BUYING';
    setMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};
