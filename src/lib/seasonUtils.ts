/**
 * Returns the current calendar year.
 * Used as a synchronous default for image lookups / UI hints.
 */
export const getCurrentSeasonYear = (): number => new Date().getFullYear();

/**
 * Determines the displayable season year based on actual data availability.
 * Tries fetching driver standings for the current calendar year;
 * if the response is empty, falls back to the previous year.
 *
 * @param fetchFn - async function that returns standings for a given year
 */
export const resolveSeasonYear = async (
  fetchFn: (year: number) => Promise<unknown[]>
): Promise<number> => {
  const currentYear = getCurrentSeasonYear();
  try {
    const data = await fetchFn(currentYear);
    if (Array.isArray(data) && data.length > 0) return currentYear;
  } catch {
    // current year data not available yet
  }
  return currentYear - 1;
};
