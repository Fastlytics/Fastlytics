import { ScrollView, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function AboutScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>About</Text>
      <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 20 }}>
        Fastlytics is a comprehensive Formula 1 analytics platform providing real-time race data, historical statistics, and deep performance insights.
        {"\n\n"}Features include live race timing, driver and constructor standings, telemetry analysis, tire strategy visualization, sector comparisons, championship progression charts, and an interactive session replay system.
        {"\n\n"}Built with React, TypeScript, TanStack Query, Recharts, and Supabase. Data sourced from the Formula 1 official API and historical databases.
        {"\n\n"}Fastlytics Mobile brings the full F1 analytics experience to your pocket, optimized for native iOS and Android devices.
      </Text>
    </ScrollView>
  );
}
