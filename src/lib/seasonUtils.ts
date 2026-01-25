export const seasonStartDates: { [key: number]: Date } = {
  2026: new Date('2026-03-06T00:00:00'),
};

export const getCurrentSeasonYear = (): number => {
  const now = new Date();
  const currentYearNum = now.getFullYear();

  const startDate = seasonStartDates[currentYearNum] || new Date(currentYearNum, 2, 1);

  return now < startDate ? currentYearNum - 1 : currentYearNum;
};
