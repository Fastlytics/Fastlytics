import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { fetchTireStrategy } from '../../lib/api';
import type { DetailedRaceResult, TireStint } from '@fastlytics/shared';

const compoundColors: Record<string, string> = {
  SOFT: '#e11d48',
  MEDIUM: '#eab308',
  HARD: '#f8fafc',
  INTERMEDIATE: '#16a34a',
  WET: '#2563eb',
  TEST: '#a855f7',
  UNKNOWN: '#78716c',
};

const getCompoundColor = (compound: string): string =>
  compoundColors[compound?.toUpperCase()] || compoundColors.UNKNOWN;

function StintBar({ stints }: { stints: TireStint[] }) {
  const totalLaps = Math.max(
    stints.reduce((sum, stint) => sum + (stint.lapCount || 0), 0),
    1
  );

  return (
    <View style={{ height: 24, flexDirection: 'row', borderRadius: 4, overflow: 'hidden', gap: 1 }}>
      {stints.map((stint, index) => (
        <View
          key={`${stint.startLap}-${stint.endLap}-${index}`}
          style={{
            flex: Math.max(stint.lapCount || 1, 1) / totalLaps,
            backgroundColor: getCompoundColor(stint.compound || 'UNKNOWN'),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 7, color: '#000', fontWeight: '900' }}>{stint.lapCount}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StrategyTab({
  year,
  eventSlug,
  session,
  results,
}: {
  year: number;
  eventSlug: string;
  session: string;
  results: DetailedRaceResult[];
}) {
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const {
    data: strategyData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tireStrategy', year, eventSlug, session],
    queryFn: () => fetchTireStrategy(year, eventSlug, session),
    enabled: !!year && !!eventSlug && !!session,
  });

  const strategies = useMemo(() => {
    if (!strategyData?.stints) {
      return [];
    }

    const resultOrder = new Map(results.map((result, index) => [result.driverCode, index]));
    return strategyData.stints
      .filter((strategy) => resultOrder.has(strategy.driver))
      .sort(
        (left, right) =>
          (resultOrder.get(left.driver) ?? Number.MAX_SAFE_INTEGER) -
          (resultOrder.get(right.driver) ?? Number.MAX_SAFE_INTEGER)
      );
  }, [results, strategyData]);

  if (isLoading) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator color={colors.red} />
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={{
          padding: 40,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.1)',
          borderRadius: 12,
          marginTop: 16,
        }}
      >
        <Text style={{ color: colors.gray500, textAlign: 'center' }}>
          Strategy data could not be loaded for this session.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12, paddingTop: 16 }}>
      {strategies.length > 0 && (
        <View
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.gray500,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Tire compounds
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {Object.entries(compoundColors)
              .filter(([compound]) => compound !== 'UNKNOWN')
              .map(([compound, color]) => (
                <View key={compound} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }}
                  />
                  <Text style={{ fontSize: 9, color: colors.gray600, fontWeight: '700' }}>
                    {compound}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {strategies.length > 0 ? (
        <View
          style={{
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.1)',
              backgroundColor: colors.zinc900,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Tire strategy
            </Text>
          </View>
          {strategies.map((strategy) => {
            const isExpanded = expandedDriver === strategy.driver;
            const totalLaps = strategy.stints.reduce(
              (sum, stint) => sum + (stint.lapCount || 0),
              0
            );

            return (
              <Pressable
                key={strategy.driver}
                onPress={() => setExpandedDriver(isExpanded ? null : strategy.driver)}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 4, overflow: 'hidden' }}>
                    <Image
                      source={{ uri: getDriverImage(strategy.driver, year) }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      contentPosition="top"
                    />
                  </View>
                  <Text
                    style={{ flex: 1, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }}
                  >
                    {strategy.driver}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.gray500 }}>
                    {strategy.stints.length} stints · {totalLaps} laps
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.gray600 }}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </View>
                <StintBar stints={strategy.stints} />
                {isExpanded && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {strategy.stints.map((stint, index) => (
                      <View
                        key={`${stint.startLap}-${stint.endLap}-${index}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            backgroundColor: getCompoundColor(stint.compound),
                          }}
                        />
                        <Text style={{ flex: 1, fontSize: 10, color: colors.gray500 }}>
                          Stint {index + 1} · Laps {stint.startLap}-{stint.endLap}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.gray600 }}>
                          {stint.lapCount} laps
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            marginTop: 16,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            No strategy data is available for this session.
          </Text>
        </View>
      )}
    </View>
  );
}
