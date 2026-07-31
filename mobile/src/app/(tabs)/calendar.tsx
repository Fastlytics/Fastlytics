import { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Host, Column, Row, Text as UIText, List, ListItem, RNHostView } from '@expo/ui';
import SegmentedControl from '@expo/ui/community/segmented-control';
import { colors } from '../../theme/colors';
import AdaptiveGlass from '../../components/AdaptiveGlass';
import { request } from '../../lib/api';
import { getCountryCode } from '@fastlytics/shared';
import type { ScheduleEvent, RaceResult } from '@fastlytics/shared';

const isTestingEvent = (event: ScheduleEvent) =>
  Boolean(
    event.EventFormat?.toLowerCase().includes('test') ||
    event.RoundNumber === 0 ||
    event.EventName?.toLowerCase().includes('testing')
  );

const getEventStartDate = (event: ScheduleEvent): Date => {
  const dates = [
    event.Session1Date,
    event.Session2Date,
    event.Session3Date,
    event.Session4Date,
    event.Session5Date,
    event.EventDate,
  ]
    .filter(Boolean)
    .map((v) => new Date(v!))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return new Date(event.EventDate);
  return dates.sort((a, b) => a.getTime() - b.getTime())[0];
};

function HeroCountdown({ targetDate }: { targetDate: Date }) {
  const calc = useCallback(() => {
    const diff = targetDate.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  }, [targetDate]);

  const [tl, setTl] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTl(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const items = [
    { v: tl.d, l: 'D' },
    { v: tl.h, l: 'H' },
    { v: tl.m, l: 'M' },
    { v: tl.s, l: 'S', hl: true },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      {items.map((item, idx) => (
        <View key={item.l} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '900',
                color: item.hl ? colors.red : '#fff',
                fontVariant: ['tabular-nums'],
              }}
            >
              {pad(item.v)}
            </Text>
            <Text
              style={{ fontSize: 9, color: colors.gray500, letterSpacing: 1, fontWeight: '500' }}
            >
              {item.l}
            </Text>
          </View>
          {idx < 3 && (
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.gray700,
                marginTop: -12,
                marginHorizontal: 4,
              }}
            >
              :
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function NextRaceHero({
  event,
  nextSession,
  selectedYear,
}: {
  event: ScheduleEvent & { countryCode?: string; displayDate: string; isSprint: boolean };
  nextSession: { name: string; date: Date } | null;
  selectedYear: number;
}) {
  const slug = `${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <Pressable onPress={() => router.push(`/race/${slug}`)} style={{ marginBottom: 16 }}>
      <AdaptiveGlass
        style={{ borderWidth: 2, borderColor: colors.red, borderRadius: 12, overflow: 'hidden' }}
      >
        <View style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, backgroundColor: colors.red }} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  letterSpacing: 1,
                  color: colors.red,
                  textTransform: 'uppercase',
                }}
              >
                Next Grand Prix
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase' }}>
              Round {event.RoundNumber}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View
              style={{
                width: 64,
                height: 44,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {event.countryCode && (
                <Image
                  source={`https://flagcdn.com/h80/${event.countryCode}.png`}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  fontStyle: 'italic',
                  color: '#fff',
                }}
              >
                {event.EventName.replace('Grand Prix', 'GP')}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 4,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Text style={{ fontSize: 12, color: colors.gray500, textTransform: 'uppercase' }}>
                  {event.displayDate}
                </Text>
                {event.isSprint && (
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '900',
                      backgroundColor: colors.systemYellow,
                      color: '#000',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    Sprint
                  </Text>
                )}
              </View>
            </View>
          </View>
          {nextSession && (
            <View
              style={{
                backgroundColor: 'rgba(24,24,27,0.5)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 10, color: colors.gray500, textTransform: 'uppercase' }}>
                  Until <Text style={{ color: '#fff', fontWeight: '700' }}>{nextSession.name}</Text>
                </Text>
              </View>
              <HeroCountdown targetDate={nextSession.date} />
            </View>
          )}
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '900',
                textTransform: 'uppercase',
                color: colors.red,
                letterSpacing: 1,
              }}
            >
              View Race Hub →
            </Text>
          </View>
        </View>
      </AdaptiveGlass>
    </Pressable>
  );
}

type ProcessedRace = ScheduleEvent & {
  result?: RaceResult;
  isUpcoming: boolean;
  isTesting: boolean;
  isSprint: boolean;
  countryCode?: string;
  displayDate: string;
  displayLocation: string;
};

function RaceListItem({ event, selectedYear }: { event: ProcessedRace; selectedYear: number }) {
  const completed = !!event.result;
  const slug = `${selectedYear}-${event.EventName.toLowerCase().replace(/\s+/g, '-')}`;
  const roundBg = event.isTesting
    ? 'rgba(37,99,235,0.2)'
    : completed
      ? (colors.zinc900 as string)
      : '#fff';
  const roundText = event.isTesting ? '#93c5fd' : completed ? (colors.gray500 as string) : '#000';

  return (
    <ListItem
      onPress={() => router.push(`/race/${slug}`)}
      leading={
        <Row alignment="center" spacing={10}>
          <Column
            alignment="center"
            style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: roundBg }}
          >
            <UIText textStyle={{ fontSize: 10, fontWeight: '900', color: roundText }}>
              {event.isTesting ? 'T' : String(event.RoundNumber)}
            </UIText>
          </Column>
          <RNHostView>
            <View
              style={{
                width: 40,
                height: 28,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {event.countryCode && (
                <Image
                  source={`https://flagcdn.com/h80/${event.countryCode}.png`}
                  style={{ width: '100%', height: '100%' }}
                />
              )}
            </View>
          </RNHostView>
        </Row>
      }
      supportingText={`${event.displayDate} · ${event.displayLocation}`}
      trailing={
        event.result ? (
          <Column alignment="end">
            <UIText textStyle={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>
              {event.result.driver.split(' ').pop() ?? ''}
            </UIText>
            <UIText textStyle={{ fontSize: 9, color: colors.gray500 as string }}>
              {event.result.team?.split(' ')[0] ?? ''}
            </UIText>
          </Column>
        ) : !event.isTesting ? (
          <UIText
            textStyle={{
              fontSize: 9,
              fontWeight: '900',
              color: event.isUpcoming ? '#60a5fa' : (colors.gray500 as string),
            }}
          >
            {event.isUpcoming ? 'TBD' : '-'}
          </UIText>
        ) : undefined
      }
    >
      {`${event.EventName.replace('Grand Prix', 'GP')}${event.isSprint && !event.isTesting ? ' • Sprint' : ''}`}
    </ListItem>
  );
}

export default function CalendarScreen() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [now] = useState(() => Date.now());

  const { data: scheduleData, isLoading: loadingSchedule } = useQuery<ScheduleEvent[]>({
    queryKey: ['schedule', selectedYear],
    queryFn: () => request<ScheduleEvent[]>(`/api/schedule/${selectedYear}`),
  });

  const hasCompleted = useMemo(
    () =>
      (scheduleData ?? []).some(
        (e) => !isTestingEvent(e) && new Date(e.EventDate).getTime() <= now
      ),
    [scheduleData, now]
  );

  const { data: resultsData } = useQuery<RaceResult[]>({
    queryKey: ['raceResults', selectedYear],
    queryFn: () => request<RaceResult[]>(`/api/results/races?year=${selectedYear}`),
    enabled: !!scheduleData && hasCompleted,
  });

  const { processedRaces, nextRace, nextSession } = useMemo(() => {
    if (!scheduleData) return { processedRaces: [], nextRace: null, nextSession: null };
    const resultsMap = new Map(resultsData?.map((r) => [r.event, r]));
    const _now = new Date();

    let nr:
      (ScheduleEvent & { countryCode?: string; displayDate: string; isSprint: boolean }) | null =
      null;
    let ns: { name: string; date: Date } | null = null;

    const sorted = [...scheduleData].sort(
      (a, b) => getEventStartDate(a).getTime() - getEventStartDate(b).getTime()
    );

    for (const event of sorted) {
      if (isTestingEvent(event)) continue;
      const sessions = [
        { n: event.Session1, d: event.Session1Date },
        { n: event.Session2, d: event.Session2Date },
        { n: event.Session3, d: event.Session3Date },
        { n: event.Session4, d: event.Session4Date },
        { n: event.Session5, d: event.Session5Date },
      ].filter((s) => s.n && s.d) as { n: string; d: string }[];
      sessions.sort((a, b) => new Date(a.d).getTime() - new Date(b.d).getTime());
      const up = sessions.find((s) => new Date(s.d) > _now);
      if (up) {
        const cc = getCountryCode(event.Country || event.Location);
        nr = {
          ...event,
          countryCode: cc !== 'xx' ? cc : undefined,
          displayDate: new Date(event.EventDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false,
        };
        ns = { name: up.n, date: new Date(up.d) };
        break;
      }
    }

    const processed = scheduleData
      .map((event) => {
        const testing = isTestingEvent(event);
        const ed = new Date(event.EventDate);
        const sessions = [
          event.Session1Date,
          event.Session2Date,
          event.Session3Date,
          event.Session4Date,
          event.Session5Date,
        ]
          .filter(Boolean)
          .map((d) => new Date(d!));
        let isUp = sessions.some((d) => d > _now);
        if (testing && selectedYear < _now.getFullYear()) isUp = false;
        const cc = getCountryCode(event.Country || event.Location);
        return {
          ...event,
          result: resultsMap.get(event.EventName),
          isUpcoming: isUp,
          isTesting: testing,
          isSprint: event.EventFormat?.toLowerCase().includes('sprint') || false,
          displayDate: ed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          displayLocation: event.Location || event.Country || 'Venue',
          countryCode: cc !== 'xx' ? cc : undefined,
        };
      })
      .sort((a, b) => {
        if (a.isTesting !== b.isTesting) return a.isTesting ? -1 : 1;
        return a.RoundNumber - b.RoundNumber;
      });

    return { processedRaces: processed, nextRace: nr, nextSession: ns };
  }, [scheduleData, resultsData, selectedYear]);

  const filteredRaces = useMemo(() => {
    const races = nextRace
      ? processedRaces.filter((r) => r.EventName !== nextRace.EventName)
      : processedRaces;
    if (filter === 'upcoming') return races.filter((r) => r.isUpcoming);
    if (filter === 'completed') return races.filter((r) => !r.isUpcoming);
    return races;
  }, [processedRaces, filter, nextRace]);

  const stats = useMemo(() => {
    const completed = processedRaces.filter((r) => !r.isUpcoming).length;
    const upcoming = processedRaces.filter((r) => r.isUpcoming).length;
    return { completed, upcoming, total: processedRaces.length };
  }, [processedRaces]);

  const filters = [
    { key: 'all', label: `All (${stats.total})` },
    { key: 'upcoming', label: `Up (${stats.upcoming})` },
    { key: 'completed', label: `Done (${stats.completed})` },
  ] as const;
  const filterIndex = filters.findIndex((f) => f.key === filter);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      {/* Season Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '900',
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {selectedYear} Season
          </Text>
          <Text style={{ fontSize: 10, color: colors.gray500 }}>
            {stats.completed}/{stats.total} Complete
          </Text>
        </View>
        <SegmentedControl
          values={filters.map((f) => f.label)}
          selectedIndex={filterIndex}
          onChange={(event) =>
            setFilter(filters[event.nativeEvent.selectedSegmentIndex]?.key ?? 'all')
          }
          tintColor={colors.red as string}
          appearance="dark"
          style={{ height: 36 }}
        />
      </View>

      {/* Next Race Hero */}
      {nextRace && filter !== 'completed' && (
        <View style={{ paddingHorizontal: 16 }}>
          <NextRaceHero event={nextRace} nextSession={nextSession} selectedYear={selectedYear} />
        </View>
      )}

      {/* Race list */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {loadingSchedule ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : filteredRaces.length > 0 ? (
          <View
            style={{
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <Host matchContents>
              <List>
                {filteredRaces.map((race) => (
                  <RaceListItem
                    key={`${race.RoundNumber}-${race.EventName}`}
                    event={race}
                    selectedYear={selectedYear}
                  />
                ))}
              </List>
            </Host>
          </View>
        ) : (
          <View
            style={{
              padding: 40,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(24,24,27,0.3)',
            }}
          >
            <Text style={{ fontSize: 14, color: colors.gray500 }}>No races found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
