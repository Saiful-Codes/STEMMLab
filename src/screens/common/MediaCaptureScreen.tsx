import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { useTheme } from '../../context/ThemeContext';
import { baseFont, Colors } from '../../theme/tokens';
import { capturePhoto, pickPhoto, deletePhoto } from '../../services/mediaService';

type Props = NativeStackScreenProps<ActivityStackParamList, 'MediaCapture'>;

type CapturedImage = { uri: string; label: string };

const PROMPTS: Record<string, string> = {
  parachute: 'Add photos of your parachute design(s)',
  handfan: 'Add photos of your fan and paper setup',
  earthquake: 'Add photos of your structure',
};

const MAX_LABEL_LENGTH = 30;

export default function MediaCaptureScreen({ navigation, route }: Props) {
  const { activityId, result } = route.params;
  const { colors, fontScale } = useTheme();
  const styles = makeStyles(colors, fontScale);

  const [images, setImages] = useState<CapturedImage[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const prompt = PROMPTS[activityId] ?? 'Add photos of your activity';

  const addPhoto = async (source: 'camera' | 'gallery') => {
    if (busy) return;
    setBusy(true);
    setHint(null);
    try {
      const photo = source === 'camera' ? await capturePhoto() : await pickPhoto();
      if (photo) {
        setImages((prev) => [...prev, { uri: photo.uri, label: '' }]);
      } else {
        setHint(
          source === 'camera'
            ? "Couldn't add a photo. If the camera is blocked, you can enable access in Settings."
            : "Couldn't add a photo. If photo access is blocked, you can enable it in Settings."
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const updateLabel = (index: number, label: string) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, label } : img))
    );
  };

  const removePhoto = async (index: number) => {
    const target = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (target) {
      await deletePhoto(target.uri);
    }
  };

  const handleContinue = () => {
    navigation.replace('ResultSummary', { activityId, result, images });
  };

  const handleSkip = () => {
    navigation.replace('ResultSummary', { activityId, result });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>{prompt}</Text>
        <Text style={styles.subPrompt}>
          Photos are optional and stay on this device.
        </Text>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => addPhoto('camera')}
            disabled={busy}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
              busy && styles.btnDisabled,
            ]}
          >
            <Text style={styles.actionBtnText}>Take Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => addPhoto('gallery')}
            disabled={busy}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
              busy && styles.btnDisabled,
            ]}
          >
            <Text style={styles.actionBtnText}>Choose from Gallery</Text>
          </Pressable>
        </View>

        {hint && <Text style={styles.hint}>{hint}</Text>}

        {images.map((img, index) => (
          <View key={img.uri} style={styles.photoRow}>
            <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
            <TextInput
              value={img.label}
              onChangeText={(text) => updateLabel(index, text)}
              placeholder="e.g. Design 1"
              placeholderTextColor={colors.textSubtle}
              maxLength={MAX_LABEL_LENGTH}
              style={styles.labelInput}
            />
            <Pressable
              onPress={() => removePhoto(index)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </Pressable>
          </View>
        ))}

        {images.length > 0 && (
          <Pressable
            onPress={() => addPhoto('camera')}
            disabled={busy}
            style={({ pressed }) => [
              styles.addAnotherBtn,
              { borderColor: colors.primary },
              pressed && { backgroundColor: colors.primarySoft },
              busy && styles.btnDisabled,
            ]}
          >
            <Text style={[styles.addAnotherText, { color: colors.primary }]}>
              + Add Another Photo
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {images.length > 0 && (
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
            ]}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [
            styles.skipBtn,
            { borderColor: colors.borderStrong },
            pressed && { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <Text style={styles.skipBtnText}>
            {images.length > 0 ? 'Skip photos' : 'Skip'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors, fontScale: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 24 },
    prompt: {
      fontSize: baseFont.subheading * fontScale,
      fontWeight: '700',
      color: colors.text,
    },
    subPrompt: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 4,
      marginBottom: 16,
    },
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      color: colors.primaryText,
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
      textAlign: 'center',
    },
    btnDisabled: { opacity: 0.6 },
    hint: {
      fontSize: baseFont.tiny * fontScale,
      color: colors.textMuted,
      marginTop: 12,
      lineHeight: 18,
    },
    photoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
    },
    thumb: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
    },
    labelInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.inputBg,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: baseFont.body * fontScale,
    },
    removeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    removeBtnText: {
      color: colors.textMuted,
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '700',
    },
    addAnotherBtn: {
      marginTop: 16,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    addAnotherText: {
      fontSize: baseFont.bodySm * fontScale,
      fontWeight: '600',
    },
    bottomBar: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    continueBtn: {
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    continueBtnText: {
      color: colors.primaryText,
      fontSize: baseFont.body * fontScale,
      fontWeight: '700',
    },
    skipBtn: {
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
    },
    skipBtnText: {
      color: colors.text,
      fontSize: baseFont.body * fontScale,
      fontWeight: '600',
    },
  });
