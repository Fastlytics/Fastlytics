import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { request } from '../../lib/api';
import type { AvailableSession, DetailedRaceResult, EventSessionSchedule } from '@fastlytics/shared';
import OverviewTab from '../../components/race/OverviewTab';
import StrategyTab from '../../components/race/StrategyTab';
import LapTimesTab from '../../components/race/LapTimesTab';
import HeadToHeadTab from '../../components/race/HeadToHeadTab';
import TelemetryTab from '../../components/race/TelemetryTab';

const parseRaceId = (raceId: string) => {
  const dashIdx = raceId.indexOf('-');
  if (dashIdx === -1) return { year: new Date().getFullYear(), eventSlug: raceId, eventName: raceId.replace(/-/g, ' ') };
  const year = parseInt(raceId.substring(0, dashIdx), 10);
  const eventSlug = raceId.substring(dashIdx + 1);
  const eventName = eventSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { year, eventSlug, eventName };
};

const sessionDisplayName = (type: string): string => {
  const names: Record<string, string> = {
    R: 'Race', Q: 'Qualifying', SQ: 'Sprint Qualifying',
    FP1: 'Practice 1', FP2: 'Practice 2', FP3: 'Practice 3',
    Sprint: 'Sprint', Summary: 'Testing Summary',
  };
  return names[type] || type;
};

function SessionSelector({ visible, onClose, sessions, selected, onSelect }: {
  visible: boolean; onClose: () => void; sessions: AvailableSession[];
  selected: string; onSelect: (s: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable style={{ backgroundColor: '#000', borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.2)', paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.zinc800, borderRadius: 2 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Select Session</Text>
            <Pressable onPress={onClose}><Text style={{ color: colors.gray500, fontSize: 14 }}>Close</Text></Pressable>
          </View>
          <View style={{ padding: 12, maxHeight: 320 }}>
            {sessions.map((s) => (
              <Pressable
                key={s.type}
                onPress={() => { onSelect(s.type); onClose(); }}
                style={{
                  padding: 16, borderWidth: 2, borderRadius: 12, marginBottom: 8,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: selected === s.type ? colors.red : '#000',
                  borderColor: selected === s.type ? colors.red : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontWeight: '900', textTransform: 'uppercase', color: selected === s.type ? '#fff' : colors.secondaryLabel }}>
                  {s.name}
                </Text>
                {selected === s.type && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'laps', label: 'Laps' },
  { id: 'h2h', label: 'H2H' },
  { id: 'data', label: 'Data' },
] as const;

export default function RaceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { year, eventSlug, eventName } = useMemo(() => parseRaceId(slug!), [slug]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const { data: sessions, isLoading: loadingSessions } = useQuery<AvailableSession[]>({
    queryKey: ['availableSessions', year, eventName],
    queryFn: () => request<AvailableSession[]>(`/api/sessions?year=${year}&event=${eventName}`),
    enabled: !!year && !!eventName,
  });

  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSession) {
      if (sessions.some(s => s.type === 'R')) setSelectedSession('R');
      else if (sessions.some(s => s.type === 'Q')) setSelectedSession('Q');
      else if (sessions.some(s => s.type === 'Sprint')) setSelectedSession('Sprint');
      else setSelectedSession(sessions[0].type);
    }
  }, [sessions, selectedSession]);

  const { data: raceResults, isLoading: loadingResults } = useQuery<DetailedRaceResult[]>({
    queryKey: ['raceResult', year, eventSlug, selectedSession],
    queryFn: () => request<DetailedRaceResult[]>(`/api/results/race/${year}/${eventSlug}?session=${selectedSession}`),
    enabled: !!year && !!eventSlug && !!selectedSession && selectedSession !== 'Summary',
  });

  const displayResults = useMemo(() => {
    if (!raceResults) return [];
    const isRace = selectedSession === 'R' || selectedSession === 'Sprint';
    if (isRace) return [...raceResults].sort((a, b) => (a.position || 999) - (b.position || 999));
    return [...raceResults].sort((a, b) => {
      const at = parseFloat(a.driverFastestLapTime?.replace(/[^0-9.]/g, '') || '999');
      const bt = parseFloat(b.driverFastestLapTime?.replace(/[^0-9.]/g, '') || '999');
      return at - bt;
    });
  }, [raceResults, selectedSession]);

  const isRaceOrSprint = selectedSession === 'R' || selectedSession === 'Sprint';

  const filteredTabs = TABS.filter(t => {
    if (t.id === 'strategy') return isRaceOrSprint;
    return true;
  });

  if (loadingSessions) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
            <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }} numberOfLines={1}>
              {eventName.replace('Grand Prix', 'GP')}
            </Text>
            <Pressable onPress={() => setShowSessionPicker(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 11, color: colors.gray500 }}>{sessionDisplayName(selectedSession)}</Text>
              <Text style={{ fontSize: 10, color: colors.gray600 }}>▼</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        {filteredTabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={{
              paddingVertical: 12, paddingHorizontal: 14,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab.id ? colors.red : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
              color: activeTab === tab.id ? '#fff' : colors.gray500,
            }}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loadingResults ? (
          <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator color={colors.red} /></View>
        ) : activeTab === 'overview' ? (
          <OverviewTab results={displayResults} session={selectedSession} />
        ) : activeTab === 'strategy' ? (
          <StrategyTab year={year} eventSlug={eventSlug} session={selectedSession} results={displayResults} />
        ) : activeTab === 'laps' ? (
          <LapTimesTab year={year} eventSlug={eventSlug} session={selectedSession} results={displayResults} />
        ) : activeTab === 'h2h' ? (
          <HeadToHeadTab year={year} eventSlug={eventSlug} session={selectedSession} results={displayResults} />
        ) : activeTab === 'data' ? (
          <TelemetryTab year={year} eventSlug={eventSlug} session={selectedSession} results={displayResults} />
        ) : null}
      </ScrollView>

      <SessionSelector
        visible={showSessionPicker}
        onClose={() => setShowSessionPicker(false)}
        sessions={sessions ?? []}
        selected={selectedSession}
        onSelect={setSelectedSession}
      />
    </View>
  );
}
