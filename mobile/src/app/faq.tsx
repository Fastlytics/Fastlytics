import { useState } from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

const FAQS = [
  { q: 'What is Fastlytics?', a: 'Fastlytics is a Formula 1 analytics platform offering real-time race data, historical statistics, telemetry analysis, and interactive race replays.' },
  { q: 'Is Fastlytics free?', a: 'Basic features including race results, standings, and calendar are free. Premium features like telemetry analysis, session replay, and driver profiles require a subscription.' },
  { q: 'How accurate is the data?', a: 'Data is sourced from official F1 timing data and APIs. While we strive for accuracy, there may be occasional delays or discrepancies in live data.' },
  { q: 'Can I use Fastlytics offline?', a: 'Currently, Fastlytics requires an internet connection to fetch race data. Offline support is planned for a future update.' },
  { q: 'How do I reset my password?', a: 'On the login screen, tap "Forgot Password" and enter your email address. You will receive a password reset link.' },
  { q: 'Can I delete my account?', a: 'Yes. Go to Settings and tap "Delete Account". This will permanently remove your data and subscriptions.' },
];

export default function FAQScreen() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 12, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 8 }}>FAQ</Text>
      {FAQS.map((faq, idx) => (
        <Pressable
          key={idx}
          onPress={() => setOpen(open === idx ? null : idx)}
          style={{
            borderWidth: 2, borderColor: open === idx ? colors.red : 'rgba(255,255,255,0.1)',
            borderRadius: 12, padding: 14, gap: 8,
          }}
        >
          <Text style={{ fontWeight: '700', fontSize: 14 }}>{faq.q}</Text>
          {open === idx && (
            <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 18 }}>{faq.a}</Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}
