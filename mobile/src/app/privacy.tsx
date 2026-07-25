import { ScrollView, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function PrivacyScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Privacy Policy</Text>
      <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 20 }}>
        Fastlytics ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
        {"\n\n"}Information We Collect: We collect information you provide directly, such as your email address when creating an account. We also collect usage data including race selections, team preferences, and general analytics through PostHog to improve our service.
        {"\n\n"}How We Use Your Information: We use your information to provide and improve our analytics service, personalize your experience, send service updates, and respond to support inquiries.
        {"\n\n"}Data Sharing: We do not sell your personal data. We may share anonymized, aggregated data for analytical purposes. We use Supabase for authentication and database hosting, PostHog for product analytics, and Sentry for error tracking.
        {"\n\n"}Data Retention: We retain your account information for as long as your account is active. Usage analytics are retained for 12 months. You may request deletion of your data at any time by contacting us.
        {"\n\n"}Your Rights: You have the right to access, correct, or delete your personal data. You may export your data or close your account from the settings page.
        {"\n\n"}Contact: For privacy-related inquiries, contact us at privacy@fastlytics.app.
      </Text>
    </ScrollView>
  );
}
