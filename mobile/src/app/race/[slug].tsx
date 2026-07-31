import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Host, Row, Button, Icon, Text as UIText } from '@expo/ui';
import { colors } from '../../theme/colors';
import AdaptiveGlass from '../../components/AdaptiveGlass';
import { request } from '../../lib/api';
import type { AvailableSession, DetailedRaceResult } from '@fastlytics/shared';
import OverviewTab from '../../components/race/OverviewTab';
import StrategyTab from '../../components/race/StrategyTab';
import LapTimesTab from '../../components/race/LapTimesTab';
import HeadToHeadTab from '../../components/race/HeadToHeadTab';
import TelemetryTab from '../../components/race/TelemetryTab';

const parseRaceId = (raceId: string) => {
  const dashIndex = raceId.indexOf('-');
  if (dashIndex === -1)
    return {
      year: new Date().getFullYear(),
      eventSlug: raceId,
      eventName: raceId.replace(/-/g, ' '),
    };
  const year = Number.parseInt(raceId.substring(0, dashIndex), 10);
  const eventSlug = raceId.substring(dashIndex + 1);
  return {
    year,
    eventSlug,
    eventName: eventSlug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()),
  };
};

const CHEVRON_LEFT = Icon.select({
  ios: 'chevron.left',
  android: import('@expo/material-symbols/chevron_left.xml'),
});
const CHEVRON_DOWN = Icon.select({
  ios: 'chevron.down',
  android: import('@expo/material-symbols/keyboard_arrow_down.xml'),
});

const sessionDisplayName = (type: string) =>
  ({
    R: 'Race',
    Q: 'Qualifying',
    SQ: 'Sprint Qualifying',
    FP1: 'Practice 1',
    FP2: 'Practice 2',
    FP3: 'Practice 3',
    Sprint: 'Sprint',
    Summary: 'Testing Summary',
  })[type] || type;
const defaultSession = (sessions: AvailableSession[] | undefined) =>
  sessions?.find((item) => item.type === 'R')?.type ??
  sessions?.find((item) => item.type === 'Q')?.type ??
  sessions?.find((item) => item.type === 'Sprint')?.type ??
  sessions?.[0]?.type ??
  '';

function SessionSelector({
  visible,
  onClose,
  sessions,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  sessions: AvailableSession[];
  selected: string;
  onSelect: (session: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={(event) => event.stopPropagation()}>
          <AdaptiveGlass
            style={{
              borderTopWidth: 2,
              borderColor: 'rgba(255,255,255,0.2)',
              paddingBottom: 40,
              overflow: 'hidden',
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{ width: 40, height: 4, backgroundColor: colors.zinc800, borderRadius: 2 }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.1)',
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
                Select Session
              </Text>
              <Pressable onPress={onClose}>
                <Text style={{ color: colors.gray500, fontSize: 14 }}>Close</Text>
              </Pressable>
            </View>
            <View style={{ padding: 12, maxHeight: 320 }}>
              {sessions.map((item) => (
                <Pressable
                  key={item.type}
                  onPress={() => {
                    onSelect(item.type);
                    onClose();
                  }}
                  style={{
                    padding: 16,
                    borderWidth: 2,
                    borderRadius: 12,
                    marginBottom: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: selected === item.type ? colors.red : 'transparent',
                    borderColor: selected === item.type ? colors.red : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text
                    style={{
                      fontWeight: '900',
                      textTransform: 'uppercase',
                      color: selected === item.type ? '#fff' : colors.secondaryLabel,
                    }}
                  >
                    {item.name}
                  </Text>
                  {selected === item.type && (
                    <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          </AdaptiveGlass>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const OVERVIEW_ICON = Icon.select({
  ios: 'gauge',
  android: import('@expo/material-symbols/dashboard.xml'),
});
const STRATEGY_ICON = Icon.select({
  ios: 'flag.checkered',
  android: import('@expo/material-symbols/strategy.xml'),
});
const LAPS_ICON = Icon.select({ ios: 'timer', android: import('@expo/material-symbols/laps.xml') });
const H2H_ICON = Icon.select({
  ios: 'arrow.left.arrow.right',
  android: import('@expo/material-symbols/compare_arrows.xml'),
});
const TELEMETRY_ICON = Icon.select({
  ios: 'waveform.path.ecg',
  android: import('@expo/material-symbols/monitoring.xml'),
});

const tabs = [
  { id: 'overview', label: 'Overview', icon: OVERVIEW_ICON },
  { id: 'strategy', label: 'Strategy', icon: STRATEGY_ICON },
  { id: 'laps', label: 'Laps', icon: LAPS_ICON },
  { id: 'h2h', label: 'H2H', icon: H2H_ICON },
  { id: 'telemetry', label: 'Telemetry', icon: TELEMETRY_ICON },
] as const;

export default function RaceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { year, eventSlug, eventName } = useMemo(() => parseRaceId(slug!), [slug]);
  const [selectedSession, setSelectedSession] = useState('');
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('overview');
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const { data: sessions, isLoading: loadingSessions } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => request<AvailableSession[]>(`/api/sessions?year=${year}&event=${eventName}`),
    enabled: !!year && !!eventName,
  });
  const activeSession = selectedSession || defaultSession(sessions);
  const { data: raceResults, isLoading: loadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['raceResult', year, eventSlug, activeSession],
    queryFn: () =>
      request<DetailedRaceResult[]>(
        `/api/results/race/${year}/${eventSlug}?session=${activeSession}`
      ),
    enabled: !!year && !!eventSlug && !!activeSession && activeSession !== 'Summary',
  });

  const displayResults = useMemo(() => {
    if (!raceResults) return [];
    if (activeSession === 'R' || activeSession === 'Sprint')
      return [...raceResults].sort(
        (left, right) => (left.position || 999) - (right.position || 999)
      );
    return [...raceResults].sort(
      (left, right) =>
        parseFloat(left.driverFastestLapTime?.replace(/[^0-9.]/g, '') || '999') -
        parseFloat(right.driverFastestLapTime?.replace(/[^0-9.]/g, '') || '999')
    );
  }, [activeSession, raceResults]);

  const visibleTabs = tabs.filter(
    (tab) => tab.id !== 'strategy' || activeSession === 'R' || activeSession === 'Sprint'
  );
  if (loadingSessions)
    return (
      <View
        style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <AdaptiveGlass style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Host matchContents>
            <Button variant="text" onPress={() => router.back()}>
              <Icon name={CHEVRON_LEFT} size={20} color="#fff" />
            </Button>
          </Host>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '900',
                textTransform: 'uppercase',
                fontStyle: 'italic',
              }}
              numberOfLines={1}
            >
              {eventName.replace('Grand Prix', 'GP')}
            </Text>
            <Host matchContents>
              <Button variant="text" onPress={() => setShowSessionPicker(true)}>
                <Row alignment="center" spacing={4}>
                  <UIText textStyle={{ fontSize: 11, color: colors.gray500 as string }}>
                    {sessionDisplayName(activeSession)}
                  </UIText>
                  <Icon name={CHEVRON_DOWN} size={10} color={colors.gray600} />
                </Row>
              </Button>
            </Host>
          </View>
        </View>
      </AdaptiveGlass>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {loadingResults ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator color={colors.red} />
          </View>
        ) : activeTab === 'overview' ? (
          <OverviewTab results={displayResults} session={activeSession} year={year} />
        ) : activeTab === 'strategy' ? (
          <StrategyTab
            year={year}
            eventSlug={eventSlug}
            session={activeSession}
            results={displayResults}
          />
        ) : activeTab === 'laps' ? (
          <LapTimesTab
            year={year}
            eventSlug={eventSlug}
            session={activeSession}
            results={displayResults}
          />
        ) : activeTab === 'h2h' ? (
          <HeadToHeadTab
            year={year}
            eventSlug={eventSlug}
            session={activeSession}
            results={displayResults}
          />
        ) : (
          <TelemetryTab
            year={year}
            eventSlug={eventSlug}
            session={activeSession}
            results={displayResults}
          />
        )}
      </ScrollView>
      <AdaptiveGlass style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <View
          style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 28 }}
        >
          {visibleTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6 }}
              >
                <Host matchContents>
                  <Icon name={tab.icon} size={20} color={active ? colors.red : colors.gray500} />
                </Host>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 9,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 0.2,
                    color: active ? '#fff' : colors.gray500,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AdaptiveGlass>
      <SessionSelector
        visible={showSessionPicker}
        onClose={() => setShowSessionPicker(false)}
        sessions={sessions ?? []}
        selected={activeSession}
        onSelect={(session) => {
          setSelectedSession(session);
          if (activeTab === 'strategy' && session !== 'R' && session !== 'Sprint')
            setActiveTab('overview');
        }}
      />
    </View>
  );
}
