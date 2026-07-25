import { ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function ContactScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }} contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ fontSize: 14, color: colors.red, fontWeight: '700' }}>← Back</Text>
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}>Contact</Text>
      <View style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 11, color: colors.gray500 }}>
          Have questions, feedback, or need support? Reach out to us through any of the following channels:
        </Text>
        <ContactItem label="Email" value="support@fastlytics.app" />
        <ContactItem label="Twitter" value="@fastlytics" />
        <ContactItem label="GitHub" value="github.com/fastlytics" />
      </View>
    </ScrollView>
  );
}

function ContactItem({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.gray500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.red, marginTop: 2 }}>{value}</Text>
    </View>
  );
}
