import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors } from '../../theme/colors';
import { getDriverImage } from '../../lib/images';
import { getCountryCode } from '@fastlytics/shared';
import type { DetailedRaceResult } from '@fastlytics/shared';

const formatRaceTime = (timeStr: string | null | undefined, isWinner = false): string => {
  if (!timeStr) return '-';
  if (isWinner) {
    try {
      const parts = timeStr.split(/[:.]/);
      if (parts.length === 3) {
        const totalMinutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        const ms = parts[2];
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        return `${hours}:${String(mins).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${ms}`;
      }
    } catch {}
    return timeStr;
  }
  if (timeStr.match(/^[A-Za-z]/)) return timeStr;
  const gap = timeStr.startsWith('+') ? timeStr.substring(1) : timeStr;
  try {
    const parts = gap.split(/[:.]/);
    if (parts.length === 3) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      const ms = parts[2];
      const totalSecs = mins * 60 + secs;
      if (totalSecs >= 60) {
        return `+${Math.floor(totalSecs / 60)}:${String(totalSecs % 60).padStart(2, '0')}.${ms}`;
      }
      return `+${totalSecs}.${ms}`;
    }
  } catch {}
  return timeStr;
};

const formatGap = (time: string | null | undefined): string => {
  if (!time || time === 'N/A') return '-';
  if (time.match(/^[A-Za-z]/) || time.includes('Lap')) return time;
  if (time.startsWith('+')) return time;
  return time;
};

function HighlightCard({ label, value, sub, color: accent }: {
  label: string; value: string; sub?: string; color?: any;
}) {
  return (
    <View style={{
      flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
      padding: 12, gap: 4,
    }}>
      <Text style={{ fontSize: 9, fontWeight: '700', color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', color: accent || '#fff' }} numberOfLines={1}>
        {value}
      </Text>
      {sub && <Text style={{ fontSize: 10, color: colors.gray500 }} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

export default function OverviewTab({ results, session }: { results: DetailedRaceResult[]; session: string }) {
  const isRace = session === 'R' || session === 'Sprint';

  const winner = results.find(r => r.position === 1);
  const poleSitter = results.find(r => r.gridPosition === 1);

  const fastestLapHolder = useMemo(() => {
    return results
      .filter(r => r.fastestLapTime && !['DSQ', 'EXC', 'DNF'].includes(r.status))
      .sort((a, b) => {
        const at = parseFloat(a.fastestLapTime?.replace(/[^0-9.]/g, '') || '999');
        const bt = parseFloat(b.fastestLapTime?.replace(/[^0-9.]/g, '') || '999');
        return at - bt;
      })[0] || null;
  }, [results]);

  if (results.length === 0) {
    return (
      <View style={{ padding: 40, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 16 }}>
        <Text style={{ color: colors.gray500, textAlign: 'center' }}>No results available for this session</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 16, paddingTop: 16 }}>
      {/* Highlights */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {isRace && winner && (
          <HighlightCard
            label="Winner"
            value={winner.fullName.split(' ').pop() || winner.fullName}
            sub={winner.team}
            color={'#eab308'}
          />
        )}
        {fastestLapHolder && (
          <HighlightCard
            label="Fastest Lap"
            value={fastestLapHolder.fullName.split(' ').pop() || fastestLapHolder.fullName}
            sub={fastestLapHolder.fastestLapTime || ''}
            color={'#dc2626'}
          />
        )}
        {!isRace && poleSitter && (
          <HighlightCard
            label={session === 'Q' ? 'Pole' : 'Leader'}
            value={poleSitter.fullName.split(' ').pop() || poleSitter.fullName}
            sub={poleSitter.team}
            color={'#3b82f6'}
          />
        )}
      </View>

      {/* Classification */}
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden' }}>
        <View style={{
          flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
          borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
          backgroundColor: colors.zinc900,
        }}>
          <Text style={{ width: 32, fontSize: 10, fontWeight: '700', color: colors.gray500 }}>#</Text>
          <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Driver</Text>
          <Text style={{ width: 50, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>{isRace ? 'Time' : 'Time'}</Text>
          <Text style={{ width: 36, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>Gap</Text>
          {isRace && <Text style={{ width: 28, fontSize: 10, fontWeight: '700', color: colors.gray500, textAlign: 'right' }}>Pts</Text>}
        </View>

        {results.map((r, idx) => {
          const isPodium = r.position <= 3;
          const time = isRace ? formatRaceTime(r.time, r.position === 1) : formatRaceTime(r.fastestLapTime, false);
          return (
            <Pressable
              key={r.driverCode}
              onPress={() => router.push(`/driver/${encodeURIComponent(r.fullName.toLowerCase().replace(/\s+/g, '-'))}`)}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12,
                borderBottomWidth: idx < results.length - 1 ? 1 : 0,
                borderBottomColor: 'rgba(255,255,255,0.05)',
                backgroundColor: isPodium ? 'rgba(37,99,235,0.05)' : 'transparent',
              }}
            >
              <View style={{
                width: 32, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center',
                backgroundColor: r.position === 1 ? '#eab308' : r.position === 2 ? '#6b7280' : r.position === 3 ? '#cd7f32' : 'transparent',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: r.position <= 3 ? '#000' : colors.gray500 }}>
                  {r.position || '-'}
                </Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 4, overflow: 'hidden' }}>
                  <Image source={{ uri: getDriverImage(r.driverCode, 2025) }} style={{ width: '100%', height: '100%' }} contentFit="cover" contentPosition="top" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: 12, textTransform: 'uppercase' }} numberOfLines={1}>
                    {r.fullName.split(' ').pop()}
                  </Text>
                </View>
              </View>
              <Text style={{ width: 60, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {time}
              </Text>
              <Text style={{ width: 36, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', color: colors.gray500 }}>
                {r.position === 1 ? '—' : formatGap(r.time) || '-'}
              </Text>
              {isRace && (
                <Text style={{ width: 28, fontSize: 10, fontVariant: ['tabular-nums'], textAlign: 'right', fontWeight: '700', color: colors.gray500 }}>
                  {r.points || 0}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
