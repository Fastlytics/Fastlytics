// knip-ignore
import React from 'react';
import { ArrowUp01Icon, ArrowDown01Icon, MinusSignCircleIcon } from 'hugeicons-react';
import { ScheduleEvent } from '@/lib/api';

export const isTestingEvent = (event: ScheduleEvent): boolean =>
  Boolean(event.EventFormat?.toLowerCase().includes('test') || event.RoundNumber === 0);

export const getTeamColorClass = (teamName: string | undefined): string => {
  if (!teamName) return 'gray';
  const simpleName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (simpleName.includes('mclaren')) return 'mclaren';
  if (simpleName.includes('mercedes')) return 'mercedes';
  if (simpleName.includes('redbull')) return 'redbull';
  if (simpleName.includes('ferrari')) return 'ferrari';
  if (simpleName.includes('alpine')) return 'alpine';
  if (simpleName.includes('astonmartin')) return 'astonmartin';
  if (simpleName.includes('williams')) return 'williams';
  if (simpleName.includes('haas')) return 'haas';
  if (simpleName.includes('audi')) return 'audi';
  if (simpleName.includes('cadillac')) return 'cadillac';
  if (simpleName.includes('sauber')) return 'kicksauber';
  if (simpleName.includes('racingbulls') || simpleName.includes('alphatauri')) return 'racingbulls';
  return 'gray';
};

export const getChangeIndicator = (change: number | undefined, size: 'sm' | 'md' = 'md') => {
  if (change === undefined) return null;
  const iconClass = size === 'sm' ? 'size-3' : 'size-4';
  if (change > 0)
    return { color: 'text-emerald-400', icon: <ArrowUp01Icon className={iconClass} /> };
  if (change < 0) return { color: 'text-red-400', icon: <ArrowDown01Icon className={iconClass} /> };
  return { color: 'text-white/30', icon: <MinusSignCircleIcon className={iconClass} /> };
};

export const rookiesByYear: { [year: string]: string[] } = {
  '2026': ['LIN'],
  '2025': ['ANT', 'BOR', 'DOO', 'BEA', 'HAD', 'LAW', 'COL'],
  '2024': ['BEA', 'COL'],
  '2023': ['PIA', 'SAR', 'DEV'],
  '2022': ['ZHO'],
  '2021': ['MSC', 'MAZ', 'TSU'],
  '2020': ['LAT'],
  '2019': ['NOR', 'RUS', 'ALB'],
};

export const isRookie = (driverCode: string, year: number): boolean => {
  const yearStr = year.toString();
  return rookiesByYear[yearStr]?.includes(driverCode) || false;
};

export const driverNumbers: { [year: string]: { [driverCode: string]: number } } = {
  '2025': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    LAW: 40,
    ANT: 87,
    BOR: 84,
    BEA: 28,
    DOO: 61,
    HAD: 50,
    COL: 43,
  },
  '2024': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    RIC: 3,
    SAR: 2,
    BEA: 50,
    COL: 43,
  },
  '2023': {
    VER: 1,
    HAM: 44,
    NOR: 4,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PIA: 81,
    ALO: 14,
    STR: 18,
    OCO: 31,
    GAS: 10,
    HUL: 27,
    MAG: 20,
    ALB: 23,
    TSU: 22,
    ZHO: 24,
    BOT: 77,
    RIC: 3,
    SAR: 2,
    DEV: 21,
  },
  '2022': {
    VER: 1,
    HAM: 44,
    LEC: 16,
    SAI: 55,
    RUS: 63,
    PER: 11,
    NOR: 4,
    RIC: 3,
    ALO: 14,
    OCO: 31,
    GAS: 10,
    TSU: 22,
    VET: 5,
    STR: 18,
    ZHO: 24,
    BOT: 77,
    ALB: 23,
    LAT: 6,
    MSC: 47,
    MAG: 20,
  },
  '2021': {
    VER: 33,
    HAM: 44,
    BOT: 77,
    NOR: 4,
    PER: 11,
    LEC: 16,
    RIC: 3,
    SAI: 55,
    TSU: 22,
    STR: 18,
    RAI: 7,
    ALO: 14,
    GAS: 10,
    OCO: 31,
    VET: 5,
    GIO: 99,
    RUS: 63,
    MSC: 47,
    MAZ: 9,
    LAT: 6,
  },
  '2020': {
    HAM: 44,
    BOT: 77,
    VER: 33,
    PER: 11,
    RIC: 3,
    SAI: 55,
    ALB: 23,
    LEC: 16,
    NOR: 4,
    GAS: 10,
    STR: 18,
    OCO: 31,
    VET: 5,
    KVY: 26,
    HUL: 27,
    RAI: 7,
    GIO: 99,
    MAG: 20,
    LAT: 6,
    GRO: 8,
    RUS: 63,
  },
  '2019': {
    HAM: 44,
    BOT: 77,
    VER: 33,
    LEC: 16,
    VET: 5,
    SAI: 55,
    GAS: 10,
    ALB: 23,
    RIC: 3,
    PER: 11,
    NOR: 4,
    RAI: 7,
    KVY: 26,
    HUL: 27,
    STR: 18,
    MAG: 20,
    KUB: 88,
    GRO: 8,
    GIO: 99,
    RUS: 63,
  },
};

export const getDriverNumber = (driverCode: string, year: number): number | null => {
  const yearStr = year.toString();
  return driverNumbers[yearStr]?.[driverCode] || null;
};
