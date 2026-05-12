import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { useSeason } from '@/contexts/SeasonContext';
import { fetchDriverStandings, DriverStanding } from '@/lib/api';
import { getDriverImage } from '@/utils/imageMapping';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CARD_CONTAINER, CARD_GAP } from '@/lib/card-styles';
import { SEO } from '@/components/layout/SEO';

/**
 * Drivers — simple directory page listing every driver on the selected
 * season's grid. Uses the same data as the driver standings so we avoid
 * an extra endpoint.
 */
const Drivers = () => {
  const { selectedYear } = useSeason();
  const { data: drivers = [], isLoading } = useQuery<DriverStanding[]>({
    queryKey: ['driverStandings', selectedYear],
    queryFn: () => fetchDriverStandings(selectedYear),
  });

  return (
    <>
      <SEO title="Drivers" description={`All F1 drivers for the ${selectedYear} season.`} />

      <div className="mb-8">
        <h1 className="text-[20px] font-semibold tracking-tight text-white">Drivers</h1>
        <p className="mt-0.5 text-[12px] text-white/80">
          Explore every driver on the {selectedYear} grid
        </p>
      </div>

      {isLoading ? (
        <div
          className={`grid ${CARD_GAP} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={`h-28 animate-pulse ${CARD_CONTAINER}`} />
          ))}
        </div>
      ) : (
        <div
          className={`grid ${CARD_GAP} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {drivers.map((driver, i) => (
            <m.div
              key={driver.code}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <Link
                to={`/drivers/${driver.code.toLowerCase()}`}
                className={`${CARD_CONTAINER} flex items-center gap-3 p-4 transition-colors hover:border-white/[0.08]`}
              >
                <Avatar className="size-12 shrink-0 border border-white/[0.06]">
                  <AvatarImage
                    src={getDriverImage(driver.code, selectedYear)}
                    className="object-cover object-top"
                  />
                  <AvatarFallback className="bg-white/[0.04] text-[11px] font-medium text-white/80">
                    {driver.code}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-white">{driver.name}</div>
                  <div className="truncate text-[12px] text-white/80">{driver.team}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] tabular-nums text-white">
                    P{driver.rank}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-white/80">
                    {driver.points} pts
                  </div>
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      )}
    </>
  );
};

export default Drivers;
