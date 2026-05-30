import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { baseFont, Colors } from '../theme/tokens';

type Photo = { uri: string; label?: string };

type Props = {
  images: Photo[];
  /** Optional heading shown above the thumbnails. */
  title?: string;
};

/**
 * Horizontal row of saved-result photo thumbnails. Tapping a thumbnail opens a
 * full-screen modal preview. Renders nothing when there are no images, so it is
 * safe to drop into any screen unconditionally.
 */
export default function SavedPhotos({ images, title = 'Photos' }: Props) {
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);
  const [activeUri, setActiveUri] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {images.map((img, i) => (
          <Pressable
            key={`${img.uri}-${i}`}
            onPress={() => setActiveUri(img.uri)}
            style={styles.item}
          >
            <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
            <Text style={styles.label} numberOfLines={1}>
              {img.label && img.label.trim() ? img.label : `Photo ${i + 1}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={activeUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveUri(null)}
      >
        <View style={styles.modalBackdrop}>
          {activeUri && (
            <Image source={{ uri: activeUri }} style={styles.fullImage} resizeMode="contain" />
          )}
          <Pressable
            onPress={() => setActiveUri(null)}
            style={styles.closeBtn}
            hitSlop={12}
          >
            <Text style={styles.closeBtnText}>Close ✕</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: Colors, fontScale: number) =>
  StyleSheet.create({
    wrap: { marginTop: 12, marginBottom: 4 },
    title: {
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    row: { gap: 12, paddingRight: 4 },
    item: { width: 80 },
    thumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
    },
    label: {
      fontSize: baseFont.micro * fontScale,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullImage: { width: '90%', height: '80%' },
    closeBtn: {
      position: 'absolute',
      top: 48,
      right: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    closeBtnText: {
      color: '#fff',
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
    },
  });
