import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import darkLogo from '../../assets/brand/logo-dark-high-res.png';
import { colors } from '../theme/colors';

type BrandWordmarkProps = {
  compact?: boolean;
  showTagline?: boolean;
};

export default function BrandWordmark({
  compact = false,
  showTagline = false,
}: BrandWordmarkProps) {
  const logoWidth = compact ? 150 : 210;

  return (
    <View style={{ alignItems: compact ? 'flex-start' : 'center' }}>
      <Image
        source={darkLogo}
        accessibilityLabel="Fastlytics"
        contentFit="contain"
        style={{ width: logoWidth, height: compact ? 28 : 40 }}
      />
      {showTagline && (
        <Text style={{ fontSize: 10, color: colors.gray600, marginTop: 2, letterSpacing: 0.6 }}>
          Formula 1 Analytics
        </Text>
      )}
    </View>
  );
}
