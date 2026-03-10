import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Gauge } from "lucide-react"
import React from "react"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Tire Compound Colors ---

export const CompoundColors: Record<string, string> = {
  SOFT: '#EF4444', // Red
  MEDIUM: '#FCD34D', // Yellow
  HARD: '#FFFFFF', // White
  INTERMEDIATE: '#22C55E', // Green
  WET: '#3B82F6', // Blue
  UNKNOWN: '#9CA3AF', // Gray
  TEST: '#A78BFA', // Purple (for test compounds if ever needed)
};

export const getCompoundColor = (compound: string | undefined | null): string => {
  if (!compound) return CompoundColors.UNKNOWN;
  const upperCompound = compound.toUpperCase();
  return CompoundColors[upperCompound] || CompoundColors.UNKNOWN;
};

// Function to format time in seconds to MM:SS.ms
export function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "--:--.---"; // Return placeholder for invalid input
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const formattedMilliseconds = String(milliseconds).padStart(3, '0');

  return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}

// Add other utility functions if needed

