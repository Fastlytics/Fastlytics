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
  if (simpleName.includes('sauber') || simpleName.includes('kick')) return 'kicksauber';
  if (
    simpleName.includes('racingbulls') ||
    simpleName.includes('alphatauri') ||
    simpleName.includes('vcarb')
  )
    return 'racingbulls';
  return 'gray';
};
