import { ScrollView, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function TermsScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Terms of Service</Text>
      <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 20 }}>
        By using Fastlytics, you agree to these terms.
        {"\n\n"}Use of Service: Fastlytics provides Formula 1 analytics data for personal, non-commercial use. You may not scrape, redistribute, or use our data for competing services.
        {"\n\n"}Accounts: You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information when creating an account.
        {"\n\n"}Subscriptions: Premium features may require a paid subscription. Subscription fees are non-refundable except as required by law. We reserve the right to modify pricing with notice.
        {"\n\n"}Data Accuracy: While we strive for accuracy, race data is provided "as-is" and may contain errors. We are not liable for decisions made based on our data.
        {"\n\n"}Limitation of Liability: Fastlytics shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
        {"\n\n"}Termination: We may suspend or terminate accounts that violate these terms. You may delete your account at any time.
      </Text>
    </ScrollView>
  );
}
