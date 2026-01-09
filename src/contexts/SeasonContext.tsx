import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';

interface SeasonContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const now = new Date();
const currentYearNum = now.getFullYear();

// Specific start dates for seasons
const seasonStartDates: { [key: number]: Date } = {
  2026: new Date('2026-03-06T00:00:00'), // Australian GP FP1 2026
};

// Default to March 1st if not specified for the current year
const startDate = seasonStartDates[currentYearNum] || new Date(currentYearNum, 2, 1);

// If we are before the start date, the new season hasn't started yet.
const currentYear = now < startDate ? currentYearNum - 1 : currentYearNum;

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
