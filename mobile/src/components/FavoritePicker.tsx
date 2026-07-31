import { Host, Column, Text as UIText, List, ListItem, RNHostView, BottomSheet } from '@expo/ui';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { colors } from '../theme/colors';

export interface FavoritePickerOption {
  key: string;
  label: string;
  imageUri?: string;
}

interface FavoritePickerProps {
  visible: boolean;
  title: string;
  options: FavoritePickerOption[];
  selectedKey: string | null;
  onClose: () => void;
  onSelect: (key: string | null) => void;
}

export default function FavoritePicker({
  visible,
  title,
  options,
  selectedKey,
  onClose,
  onSelect,
}: FavoritePickerProps) {
  return (
    <Host matchContents style={{ position: 'absolute' }}>
      <BottomSheet isPresented={visible} onDismiss={onClose} snapPoints={['half']}>
        <Column style={{ padding: 16 }}>
          <UIText textStyle={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>{title}</UIText>
        </Column>
        <List>
          <ListItem
            onPress={() => {
              onSelect(null);
              onClose();
            }}
            trailing={
              !selectedKey ? (
                <UIText textStyle={{ color: colors.red as string, fontWeight: '900' }}>✓</UIText>
              ) : undefined
            }
          >
            None
          </ListItem>
          {options.map((option) => {
            const selected = option.key === selectedKey;
            return (
              <ListItem
                key={option.key}
                onPress={() => {
                  onSelect(option.key);
                  onClose();
                }}
                leading={
                  option.imageUri ? (
                    <RNHostView>
                      <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden' }}>
                        <Image
                          source={{ uri: option.imageUri }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                          contentPosition="top"
                        />
                      </View>
                    </RNHostView>
                  ) : undefined
                }
                trailing={
                  selected ? (
                    <UIText textStyle={{ color: colors.red as string, fontWeight: '900' }}>
                      ✓
                    </UIText>
                  ) : undefined
                }
              >
                {option.label}
              </ListItem>
            );
          })}
        </List>
      </BottomSheet>
    </Host>
  );
}
