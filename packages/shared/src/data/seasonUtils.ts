export const getCurrentSeasonYear = (): number => new Date().getFullYear();

export const resolveSeasonYear = async (
  fetchFn: (year: number) => Promise<unknown[]>
): Promise<number> => {
  const currentYear = getCurrentSeasonYear();
  try {
    const data = await fetchFn(currentYear);
    if (Array.isArray(data) && data.length > 0) return currentYear;
  } catch {
    /* current year data not available yet */
  }
  return currentYear - 1;
};
