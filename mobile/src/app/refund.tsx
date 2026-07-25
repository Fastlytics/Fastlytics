import { ScrollView, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function RefundScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Refund Policy</Text>
      <Text style={{ fontSize: 12, color: colors.gray500, lineHeight: 20 }}>
        Fastlytics offers the following refund policy for premium subscriptions:
        {"\n\n"}Monthly Subscriptions: You may cancel at any time. Access continues until the end of the current billing period. No partial refunds are provided for unused portions of the billing period.
        {"\n\n"}Annual Subscriptions: Annual subscriptions may be refunded within 14 days of purchase. After 14 days, we do not provide refunds, but you may cancel to prevent future charges.
        {"\n\n"}How to Request a Refund: Contact us at support@fastlytics.app with your account email and reason for the request. We process refunds within 5-10 business days.
        {"\n\n"}Service Issues: If you experience persistent technical issues that prevent use of the service, please contact support and we will work to resolve the issue or provide a refund.
        {"\n\n"}This refund policy applies to all purchases made directly through Fastlytics. Purchases through app stores are subject to the respective store's refund policy.
      </Text>
    </ScrollView>
  );
}
