import { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { CartesianChart, Bar } from 'victory-native';
import { Host, Row, Column, Text as UIText, RNHostView } from '@expo/ui';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { fetchSectorComparison } from '../../lib/api';
import type { DetailedRaceResult } from '@fastlytics/shared';

const DRIVER_ONE_COLOR = '#dc2626';
const DRIVER_TWO_COLOR = '#2563eb';

type SectorDeltaPoint = {
  section: number;
  positiveAdvantage: number;
  negativeAdvantage: number;
  [key: string]: number;
};

export default function HeadToHeadTab({
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
  const topDrivers = useMemo(() => results.slice(0, 10), [results]);
  const [driverOne, setDriverOne] = useState('');
  const [driverTwo, setDriverTwo] = useState('');
  const activeDriverOne = driverOne || topDrivers[0]?.driverCode || '';
  const activeDriverTwo =
    driverTwo ||
    topDrivers.find((driver) => driver.driverCode !== activeDriverOne)?.driverCode ||
    '';
  const canCompare = !!activeDriverOne && !!activeDriverTwo && activeDriverOne !== activeDriverTwo;

  const {
    data: sectorData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['sectorComparison', year, eventSlug, session, activeDriverOne, activeDriverTwo],
    queryFn: () =>
      fetchSectorComparison(year, eventSlug, session, activeDriverOne, activeDriverTwo),
    enabled: !!year && !!eventSlug && !!session && canCompare,
  });

  const selectedResults = [
    results.find((result) => result.driverCode === activeDriverOne),
    results.find((result) => result.driverCode === activeDriverTwo),
  ].filter((result): result is DetailedRaceResult => Boolean(result));

  const deltaData: SectorDeltaPoint[] = useMemo(
    () =>
      (sectorData?.sections ?? []).map((section, index) => {
        const advantage = section.driver1Advantage ?? 0;
        return {
          section: index + 1,
          positiveAdvantage: advantage > 0 ? advantage : 0,
          negativeAdvantage: advantage < 0 ? advantage : 0,
        };
      }),
    [sectorData]
  );
  const deltaMagnitude = deltaData.length
    ? Math.max(
        ...deltaData.map((point) => Math.max(point.positiveAdvantage, -point.negativeAdvantage)),
        0.05
      )
    : 0.05;

  return (
    <View style={{ gap: 16, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {(['first', 'second'] as const).map((slot, index) => {
          const selected = slot === 'first' ? activeDriverOne : activeDriverTwo;
          const accent = index === 0 ? DRIVER_ONE_COLOR : DRIVER_TWO_COLOR;
          return (
            <View key={slot} style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.gray500,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Driver {index + 1}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {topDrivers.map((driver) => (
                  <Pressable
                    key={driver.driverCode}
                    onPress={() =>
                      slot === 'first'
                        ? setDriverOne(driver.driverCode)
                        : setDriverTwo(driver.driverCode)
                    }
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor:
                        selected === driver.driverCode ? accent : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: selected === driver.driverCode ? '#fff' : colors.secondaryLabel,
                      }}
                    >
                      {driver.driverCode}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {selectedResults.length === 2 && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {selectedResults.map((result, index) => (
            <View
              key={result.driverCode}
              style={{
                flex: 1,
                borderWidth: 2,
                borderRadius: 12,
                padding: 12,
                gap: 4,
                borderColor: index === 0 ? DRIVER_ONE_COLOR : DRIVER_TWO_COLOR,
              }}
            >
              <Host matchContents>
                <Row alignment="center" spacing={8}>
                  <RNHostView>
                    <View style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden' }}>
                      <Image
                        source={{ uri: getDriverImage(result.driverCode, year) }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        contentPosition="top"
                      />
                    </View>
                  </RNHostView>
                  <Column>
                    <UIText textStyle={{ fontWeight: '900', fontSize: 13 }}>
                      {result.driverCode}
                    </UIText>
                    <UIText
                      textStyle={{ fontSize: 9, color: colors.gray500 as string }}
                      numberOfLines={1}
                    >
                      {result.team}
                    </UIText>
                  </Column>
                </Row>
              </Host>
              <Text style={{ fontSize: 10, color: colors.gray500 }}>
                Position: #{result.position ?? '-'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!canCompare ? (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            Select two different drivers to compare their sectors.
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.red} />
        </View>
      ) : isError ? (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            Sector comparison data is not available for this selection.
          </Text>
        </View>
      ) : sectorData?.sections.length ? (
        <>
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
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                Sector advantage
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: DRIVER_ONE_COLOR,
                    }}
                  />
                  <Text style={{ fontSize: 9, color: colors.gray600, fontWeight: '700' }}>
                    {sectorData.driver1Code}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: DRIVER_TWO_COLOR,
                    }}
                  />
                  <Text style={{ fontSize: 9, color: colors.gray600, fontWeight: '700' }}>
                    {sectorData.driver2Code}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ height: 160, padding: 12 }}>
              <CartesianChart
                data={deltaData}
                xKey="section"
                yKeys={['positiveAdvantage', 'negativeAdvantage']}
                domain={{ y: [-deltaMagnitude * 1.15, deltaMagnitude * 1.15] }}
                padding={{ left: 4, right: 4, top: 8, bottom: 4 }}
              >
                {({ points, chartBounds }) => (
                  <>
                    <Bar
                      points={points.positiveAdvantage}
                      chartBounds={chartBounds}
                      color={DRIVER_ONE_COLOR}
                      roundedCorners={{ topLeft: 3, topRight: 3 }}
                      innerPadding={0.35}
                      animate={{ type: 'timing', duration: 300 }}
                    />
                    <Bar
                      points={points.negativeAdvantage}
                      chartBounds={chartBounds}
                      color={DRIVER_TWO_COLOR}
                      roundedCorners={{ bottomLeft: 3, bottomRight: 3 }}
                      innerPadding={0.35}
                      animate={{ type: 'timing', duration: 300 }}
                    />
                  </>
                )}
              </CartesianChart>
            </View>
            <Text
              style={{
                fontSize: 8,
                color: colors.gray600,
                textAlign: 'center',
                paddingBottom: 10,
              }}
            >
              Bars above the line favor {sectorData.driver1Code}, below favor{' '}
              {sectorData.driver2Code}
            </Text>
          </View>

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
                Sector comparison
              </Text>
              <Text style={{ fontSize: 9, color: colors.gray600 }}>
                {sectorData.driver1Code} vs {sectorData.driver2Code}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.05)',
                backgroundColor: colors.zinc900,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.gray500,
                  textTransform: 'uppercase',
                }}
              >
                Section
              </Text>
              <Text
                style={{
                  width: 32,
                  fontSize: 9,
                  fontWeight: '700',
                  color: DRIVER_ONE_COLOR,
                  textAlign: 'center',
                }}
              >
                D1
              </Text>
              <Text
                style={{
                  width: 32,
                  fontSize: 9,
                  fontWeight: '700',
                  color: DRIVER_TWO_COLOR,
                  textAlign: 'center',
                }}
              >
                D2
              </Text>
              <Text
                style={{
                  width: 36,
                  fontSize: 9,
                  fontWeight: '700',
                  color: colors.gray500,
                  textAlign: 'right',
                }}
              >
                Adv
              </Text>
            </View>
            {sectorData.sections.map((section, index) => {
              const advantage = section.driver1Advantage;
              return (
                <View
                  key={section.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderBottomWidth: index < sectorData.sections.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.gray500 }}>
                    {section.name}
                  </Text>
                  <Text
                    style={{
                      width: 32,
                      fontSize: 11,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'center',
                      color: advantage != null && advantage > 0 ? DRIVER_ONE_COLOR : colors.gray500,
                    }}
                  >
                    {section.driver1AvgSpeed != null ? Math.round(section.driver1AvgSpeed) : '-'}
                  </Text>
                  <Text
                    style={{
                      width: 32,
                      fontSize: 11,
                      fontVariant: ['tabular-nums'],
                      textAlign: 'center',
                      color: advantage != null && advantage < 0 ? DRIVER_TWO_COLOR : colors.gray500,
                    }}
                  >
                    {section.driver2AvgSpeed != null ? Math.round(section.driver2AvgSpeed) : '-'}
                  </Text>
                  <Text
                    style={{
                      width: 36,
                      fontSize: 11,
                      fontWeight: '700',
                      textAlign: 'right',
                      color:
                        advantage == null
                          ? colors.gray500
                          : advantage > 0
                            ? DRIVER_ONE_COLOR
                            : advantage < 0
                              ? DRIVER_TWO_COLOR
                              : colors.gray500,
                    }}
                  >
                    {advantage != null ? `${advantage > 0 ? '+' : ''}${advantage.toFixed(2)}` : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      ) : (
        <View
          style={{
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
          }}
        >
          <Text style={{ color: colors.gray500, textAlign: 'center' }}>
            Sector data is not available for this selection.
          </Text>
        </View>
      )}
    </View>
  );
}
