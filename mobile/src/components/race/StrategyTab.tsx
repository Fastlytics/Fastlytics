import { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { request } from '../../lib/api';
import type { DetailedRaceResult, TireStrategyResponse, DriverStrategy, TireStint } from '@fastlytics/shared';

const compoundColors: Record<string, string> = {
  SOFT: '#e11d48', MEDIUM: '#eab308', HARD: '#f8fafc',
  INTERMEDIATE: '#16a34a', WET: '#2563eb', TEST: '#a855f7',
  UNKNOWN: '#78716c',
};

const getCompoundColor = (compound: string): string =>
  compoundColors[compound?.toUpperCase()] || compoundColors.UNKNOWN;

function StintBar({ stints }: { stints: TireStint[] }) {
  const maxLap = Math.max(...stints.map(s => s.endLap || 0), 1);
  return (
    <View style={{ height: 24, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {stints.map((stint, idx) => {
        const width = maxLap > 0 ? ((stint.lapCount || 1) / maxLap) * 100 : 10;
        return (
          <View
            key={idx}
            style={{
              flex: width,
              backgroundColor: getCompoundColor(stint.compound || 'UNKNOWN'),
              justifyContent: 'center', alignItems: 'center',
              borderTopLeftRadius: idx === 0 ? 4 : 0,
              borderBottomLeftRadius: idx === 0 ? 4 : 0,
              borderTopRightRadius: idx === stints.length - 1 ? 4 : 0,
              borderBottomRightRadius: idx === stints.length - 1 ? 4 : 0,
            }}
          >
            <Text style={{ fontSize: 7, color: '#000', fontWeight: '900' }}>{stint.lapCount}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function StrategyTab({ year, eventSlug, session, results }: {
  year: number; eventSlug: string; session: string; results: DetailedRaceResult[];
}) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const { data: strategyData } = useQuery<TireStrategyResponse>({
    queryKey: ['tireStrategy', year, eventSlug, session],
    queryFn: () => request<TireStrategyResponse>(`/api/strategy/${year}/${eventSlug}?session=${session}`),
    enabled: !!year && !!eventSlug && !!session,
  });

  const topDrivers = useMemo(() => {
    if (!strategyData?.stints) return [];
    return strategyData.stints
      .filter(ds => results.find(r => r.driverCode === ds.driver))
      .slice(0, 20);
  }, [strategyData, results]);

  return (
    <View style={{ gap: 12, paddingTop: 16 }}>
      {/* Compound Legend */}
      {topDrivers.length > 0 && (
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Tire Compounds
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(compoundColors).map(([compound, color]) => (
              <View key={compound} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
                <Text style={{ fontSize: 9, color: colors.gray600, fontWeight: '700' }}>{compound}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stints */}
      {topDrivers.length > 0 ? (
        <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
          <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', backgroundColor: colors.zinc900 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tire Strategy
            </Text>
          </View>
          {topDrivers.map((ds) => {
            const code = ds.driver;
            const isExpanded = expandedDriver === code;
            const totalLaps = ds.stints.reduce((sum, s) => sum + (s.lapCount || 0), 0);
            return (
              <Pressable
                key={code}
                onPress={() => setExpandedDriver(isExpanded ? null : code)}
                style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 4, overflow: 'hidden' }}>
                    <Image source={{ uri: getDriverImage(code, year) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
                  </View>
                  <Text style={{ flex: 1, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}>{code}</Text>
                  <Text style={{ fontSize: 10, color: colors.gray500 }}>
                    {ds.stints.length} stints · {totalLaps} laps
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.gray600 }}>{isExpanded ? '▲' : '▼'}</Text>
                </View>
                <StintBar stints={ds.stints} />
                {isExpanded && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {ds.stints.map((stint, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 8,
                          paddingVertical: 4, paddingHorizontal: 8,
                          backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6,
                        }}
                      >
                        <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: getCompoundColor(stint.compound) }} />
                        <Text style={{ flex: 1, fontSize: 10, color: colors.gray500 }}>
                          Stint {idx + 1} · Laps {stint.startLap}-{stint.endLap}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.gray600 }}>{stint.lapCount} laps</Text>
                        {stint.bestLapTime != null && (
                          <Text style={{ fontSize: 9, color: '#eab308' }}>
                            {Math.floor(stint.bestLapTime / 60)}:{String(Math.round(stint.bestLapTime % 60)).padStart(2, '0')}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 16 }}>
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>No strategy data available for this session</Text>
        </View>
      )}
    </View>
  );
}
