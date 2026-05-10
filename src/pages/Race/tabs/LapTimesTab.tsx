import React from 'react';
import { GatedRoute } from '@/components/common/GatedRoute';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RacingChart } from '@/components/charts/RacingChart';
import { PaceAnalysisChart } from '@/components/charts/PaceAnalysisChart';
import { GapToLeaderChart } from '@/components/charts/GapToLeaderChart';
import { DetailedRaceResult } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';

interface LapTimesTabProps {
  year: number;
  eventName: string;
  analysisSession: string;
  sessionResults?: DetailedRaceResult[];
  favoriteDriver?: string | null;
  lapAnalysisMode: 'history' | 'pace' | 'gap';
  setLapAnalysisMode: (mode: 'history' | 'pace' | 'gap') => void;
}

export const LapTimesTab: React.FC<LapTimesTabProps> = ({
  year,
  eventName,
  analysisSession,
  sessionResults,
  favoriteDriver,
  lapAnalysisMode,
  setLapAnalysisMode,
}) => {
  const { trackInteraction } = useAnalytics();

  const getRivalDriverCode = () => {
    let rivalDriverCode: string | null = null;
    if (favoriteDriver && sessionResults) {
      const favResult = sessionResults.find(
        (r) =>
          r.driverCode === favoriteDriver ||
          r.fullName.toLowerCase().includes(favoriteDriver.toLowerCase())
      );
      if (favResult && favResult.position) {
        const rivalPos = favResult.position === 1 ? 2 : favResult.position - 1;
        const rivalResult = sessionResults.find((r) => r.position === rivalPos);
        if (rivalResult) rivalDriverCode = rivalResult.driverCode;
      }
    }
    return rivalDriverCode;
  };

  const rivalDriverCode = getRivalDriverCode();

  return (
    <GatedRoute
      featureName="Lap Times Analysis"
      description="Detailed lap-by-lap timing data with pace distribution analysis and comparison charts"
    >
      <section
        id="laptimes"
        className="animate-in fade-in duration-500 rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-white/80">
              Lap Times
            </p>
            <p className="mt-0.5 text-[18px] font-bold uppercase italic text-white">
              Lap Time Comparison
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="history"
          value={lapAnalysisMode}
          onValueChange={(v) => {
            setLapAnalysisMode(v as 'history' | 'pace' | 'gap');
            trackInteraction('desktop_analysis_tab_changed', { tab: v });
          }}
          className="w-full"
        >
          <TabsList className="h-auto w-full gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] p-1 sm:w-auto">
            <TabsTrigger
              value="history"
              className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
            >
              Lap History
            </TabsTrigger>
            <TabsTrigger
              value="pace"
              className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
            >
              Pace Distribution
            </TabsTrigger>
            <TabsTrigger
              value="gap"
              className="flex-1 rounded-md text-[12px] font-semibold uppercase tracking-wider text-white transition-all hover:text-white data-[state=active]:bg-white/[0.08] data-[state=active]:text-white sm:flex-none"
            >
              Gap to Leader
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="history"
            className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <RacingChart
              year={year}
              event={eventName}
              session={analysisSession}
              title="Lap Time Comparison"
              autoLoad={true}
              favoriteDriver={favoriteDriver || undefined}
              rivalDriver={rivalDriverCode || undefined}
            />
          </TabsContent>

          <TabsContent
            value="pace"
            className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <PaceAnalysisChart
              year={year}
              event={eventName}
              session={analysisSession}
              initialDrivers={
                favoriteDriver
                  ? ([favoriteDriver, rivalDriverCode].filter(Boolean) as string[])
                  : []
              }
            />
          </TabsContent>

          <TabsContent
            value="gap"
            className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <GapToLeaderChart
              year={year}
              event={eventName}
              session={analysisSession}
              autoLoad={true}
              favoriteDriver={favoriteDriver || undefined}
              rivalDriver={rivalDriverCode || undefined}
            />
          </TabsContent>
        </Tabs>
      </section>
    </GatedRoute>
  );
};
