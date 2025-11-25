import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface SeasonContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const currentYear = new Date().getFullYear();
const startYear = 2019;
const defaultAvailableYears = Array.from(
  { length: currentYear - startYear + 1 }, 
  (_, i) => currentYear - i
);

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export const SeasonProvider = ({ children }: { children: ReactNode }) => {
  const [selectedYear, setSelectedYear] = useState<number>(defaultAvailableYears[0]);

  const value = useMemo(() => ({
    selectedYear,
    setSelectedYear,
    availableYears: defaultAvailableYears
  }), [selectedYear]);

  return (
    <SeasonContext.Provider value={value}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = (): SeasonContextType => {
  const context = useContext(SeasonContext);
  if (context === undefined) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};
