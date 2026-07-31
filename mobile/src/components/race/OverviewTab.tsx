import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Host, Column, Row, Text as UIText, List, ListItem, RNHostView } from '@expo/ui';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { getDriverSlug } from '@fastlytics/shared';
import type { DetailedRaceResult } from '@fastlytics/shared';

const formatRaceTime = (time: string | null | undefined, isWinner = false): string => {
  if (!time) return '-';
  if (!isWinner || time.match(/^[A-Za-z]/)) return time;

  const parts = time.split(/[:.]/);
  if (parts.length !== 3) return time;

  const totalMinutes = Number.parseInt(parts[0], 10);
  const seconds = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(totalMinutes) || !Number.isFinite(seconds)) return time;

  const hours = Math.floor(totalMinutes / 60);
  return `${hours}:${String(totalMinutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${parts[2]}`;
};

const formatGap = (time: string | null | undefined) => (!time || time === 'N/A' ? '-' : time);

function HighlightCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: 12,
        gap: 4,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: colors.gray500,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '900',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          color: color || '#fff',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 10, color: colors.gray500 }} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export default function OverviewTab({
  results,
  session,
  year,
}: {
  results: DetailedRaceResult[];
  session: string;
  year: number;
}) {
  const isRace = session === 'R' || session === 'Sprint';
  const winner = results.find((result) => result.position === 1);
  const poleSitter = results.find((result) => result.gridPosition === 1);
  const fastestLapHolder =
    [...results]
      .filter((result) => result.fastestLapTime && !['DSQ', 'EXC', 'DNF'].includes(result.status))
      .sort(
        (left, right) =>
          parseFloat(left.fastestLapTime?.replace(/[^0-9.]/g, '') || '999') -
          parseFloat(right.fastestLapTime?.replace(/[^0-9.]/g, '') || '999')
      )[0] ?? null;

  if (!results.length)
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
          No results available for this session
        </Text>
      </View>
    );

  return (
    <View style={{ gap: 16, paddingTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isRace && winner ? (
          <HighlightCard
            label="Winner"
            value={winner.fullName.split(' ').pop() || winner.fullName}
            sub={winner.team}
            color="#eab308"
          />
        ) : null}
        {fastestLapHolder ? (
          <HighlightCard
            label="Fastest Lap"
            value={fastestLapHolder.fullName.split(' ').pop() || fastestLapHolder.fullName}
            sub={fastestLapHolder.fastestLapTime || ''}
            color="#dc2626"
          />
        ) : null}
        {!isRace && poleSitter ? (
          <HighlightCard
            label={session === 'Q' ? 'Pole' : 'Leader'}
            value={poleSitter.fullName.split(' ').pop() || poleSitter.fullName}
            sub={poleSitter.team}
            color="#3b82f6"
          />
        ) : null}
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
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            backgroundColor: colors.zinc900,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: '700',
              color: colors.gray600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {isRace ? 'Time · Gap · Pts' : 'Time · Gap'}
          </Text>
        </View>
        <Host matchContents>
          <List>
            {results.map((result) => {
              const isPodium = result.position !== null && result.position <= 3;
              const positionColor =
                result.position === 1
                  ? '#eab308'
                  : result.position === 2
                    ? '#6b7280'
                    : result.position === 3
                      ? '#cd7f32'
                      : 'transparent';
              return (
                <ListItem
                  key={result.driverCode}
                  onPress={() =>
                    router.push(`/driver/${getDriverSlug(result.driverCode, result.fullName)}`)
                  }
                  leading={
                    <Row alignment="center" spacing={8}>
                      <Column
                        alignment="center"
                        style={{
                          width: 32,
                          height: 22,
                          borderRadius: 4,
                          backgroundColor: positionColor,
                        }}
                      >
                        <UIText
                          textStyle={{
                            fontSize: 11,
                            fontWeight: '900',
                            color: isPodium ? '#000' : (colors.gray500 as string),
                          }}
                        >
                          {String(result.position ?? '-')}
                        </UIText>
                      </Column>
                      <RNHostView>
                        <View
                          style={{ width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}
                        >
                          <Image
                            source={{ uri: getDriverImage(result.driverCode, year) }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            contentPosition="top"
                          />
                        </View>
                      </RNHostView>
                    </Row>
                  }
                  trailing={
                    <Row alignment="center" spacing={10}>
                      <UIText textStyle={{ fontSize: 10, color: colors.gray500 as string }}>
                        {isRace
                          ? formatRaceTime(result.time, result.position === 1)
                          : formatRaceTime(result.fastestLapTime)}
                      </UIText>
                      <UIText textStyle={{ fontSize: 10, color: colors.gray500 as string }}>
                        {result.position === 1 ? '—' : formatGap(result.time)}
                      </UIText>
                      {isRace ? (
                        <UIText
                          textStyle={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: colors.gray500 as string,
                          }}
                        >
                          {String(result.points || 0)}
                        </UIText>
                      ) : undefined}
                    </Row>
                  }
                >
                  {result.fullName.split(' ').pop() ?? result.fullName}
                </ListItem>
              );
            })}
          </List>
        </Host>
      </View>
    </View>
  );
}
