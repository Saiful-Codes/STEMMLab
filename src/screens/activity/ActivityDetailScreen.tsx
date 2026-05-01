import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import { ActivityStackParamList } from '../../navigation/ActivityStack';
import { activities } from '../../data/activities';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../context/LanguageContext';
import { LanguageCode } from '../../i18n/translations';
import { baseFont } from '../../theme/tokens';

type Props = NativeStackScreenProps<ActivityStackParamList, 'ActivityDetail'>;

const IMPLEMENTED_ACTIVITY_IDS = ['sound', 'reaction', 'earthquake'];

const DETAIL_SECTIONS = [
  'introduction',
  'objectives',
  'materials',
  'instructions',
  'interpreting',
] as const;

const SPEECH_LOCALES: Record<LanguageCode, string> = {
  en: 'en-US',
  es: 'es-ES',
  ar: 'ar-SA',
  zh: 'zh-CN',
};

function safeT(
  t: (key: string, params?: Record<string, string | number>) => string,
  key: string
): string {
  const value = t(key);
  return typeof value === 'string' ? value : '';
}

function buildSpokenText(
  activityId: string,
  hasDetail: boolean,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const lines: string[] = [];

  const title = safeT(t, `activity.${activityId}.title`);
  const shortDesc = safeT(t, `activity.${activityId}.shortDescription`);
  if (title) lines.push(title);
  if (shortDesc) lines.push(shortDesc);

  if (hasDetail) {
    const gradeLabel = safeT(t, 'activityDetail.label.gradeLevel');
    const gradeValue = safeT(t, `activityDetail.${activityId}.gradeLevel`);
    if (gradeValue) lines.push(`${gradeLabel}: ${gradeValue}.`);

    const timeLabel = safeT(t, 'activityDetail.label.estimatedTime');
    const timeValue = safeT(t, `activityDetail.${activityId}.estimatedTime`);
    if (timeValue) lines.push(`${timeLabel}: ${timeValue}.`);

    const tagsLabel = safeT(t, 'activityDetail.section.tags');
    const tagsValue = safeT(t, `activityDetail.${activityId}.tags`);
    if (tagsValue) lines.push(`${tagsLabel}: ${tagsValue}.`);

    for (const section of DETAIL_SECTIONS) {
      const heading = safeT(t, `activityDetail.section.${section}`);
      const body = safeT(t, `activityDetail.${activityId}.${section}`);
      if (heading) lines.push(`${heading}.`);
      if (body) lines.push(body.replace(/\n/g, ' '));
    }
  }

  return lines.filter(Boolean).join(' ').trim();
}

type DetailSection = (typeof DETAIL_SECTIONS)[number];

export default function ActivityDetailScreen({ navigation, route }: Props) {
  const { activityId } = route.params;
  const { colors, fontScale } = useTheme();
  const { t, language } = useTranslation();
  const activity = activities.find((a) => a.id === activityId);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const tags = useMemo(() => {
    if (!activity?.hasDetail) return [] as string[];
    return t(`activityDetail.${activity.id}.tags`)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [activity, t]);

  const stopSpeaking = useCallback(async () => {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
      }
    } catch (error) {
      console.log('TTS error:', error);
    }
    setIsSpeaking(false);
  }, []);

  const handleToggleSpeak = useCallback(async () => {
    if (!activity) return;

    if (isSpeaking) {
      await stopSpeaking();
      return;
    }

    const text = buildSpokenText(activity.id, !!activity.hasDetail, t);
    if (!text) return;

    const locale = SPEECH_LOCALES[language] ?? 'en-US';

    try {
      const alreadySpeaking = await Speech.isSpeakingAsync();
      if (alreadySpeaking) {
        await Speech.stop();
      }
    } catch (error) {
      console.log('TTS error:', error);
    }

    setIsSpeaking(true);
    Speech.speak(text, {
      language: locale,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: (error) => {
        console.log('TTS error:', error);
        setIsSpeaking(false);
      },
    });
  }, [activity, isSpeaking, language, stopSpeaking, t]);

  // Stop speech when navigating away from this screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      Speech.stop();
      setIsSpeaking(false);
    });
    return unsubscribe;
  }, [navigation]);

  // Stop speech on unmount.
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  if (!activity) {
    return (
      <View
        style={[styles.notFoundContainer, { backgroundColor: colors.background }]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: baseFont.heading * fontScale },
          ]}
        >
          {t('activityDetail.notFound')}
        </Text>
      </View>
    );
  }

  const isImplemented = IMPLEMENTED_ACTIVITY_IDS.includes(activity.id);
  const hasDetail = !!activity.hasDetail;

  const gradeLevel = hasDetail ? t(`activityDetail.${activity.id}.gradeLevel`) : '';
  const estimatedTime = hasDetail
    ? t(`activityDetail.${activity.id}.estimatedTime`)
    : '';

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.category,
            { color: colors.primary, fontSize: baseFont.tiny * fontScale },
          ]}
        >
          {t(`category.${activity.category}`)}
        </Text>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: baseFont.heading * fontScale },
          ]}
        >
          {t(`activity.${activity.id}.title`)}
        </Text>
        <Text
          style={[
            styles.domain,
            { color: colors.textMuted, fontSize: baseFont.bodySm * fontScale },
          ]}
        >
          {t(`activity.${activity.id}.domain`)}
        </Text>
        <Text
          style={[
            styles.shortDescription,
            { color: colors.text, fontSize: baseFont.body * fontScale },
          ]}
        >
          {t(`activity.${activity.id}.shortDescription`)}
        </Text>

        <Pressable
          onPress={handleToggleSpeak}
          accessibilityRole="button"
          accessibilityState={{ selected: isSpeaking }}
          style={({ pressed }) => [
            styles.ttsBtn,
            {
              borderColor: colors.primary,
              backgroundColor: isSpeaking
                ? colors.primarySoft
                : pressed
                  ? colors.primarySoft
                  : 'transparent',
            },
          ]}
        >
          <Text
            style={[
              styles.ttsBtnText,
              {
                color: colors.primary,
                fontSize: baseFont.bodySm * fontScale,
              },
            ]}
          >
            {isSpeaking
              ? t('activityDetail.tts.stop')
              : t('activityDetail.tts.read')}
          </Text>
        </Pressable>

        {hasDetail && (
          <>
            <View style={styles.metaRow}>
              <MetaCard
                label={t('activityDetail.label.gradeLevel')}
                value={gradeLevel}
                colors={colors}
                fontScale={fontScale}
              />
              <MetaCard
                label={t('activityDetail.label.estimatedTime')}
                value={estimatedTime}
                colors={colors}
                fontScale={fontScale}
              />
            </View>

            {tags.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.sectionHeading,
                    {
                      color: colors.text,
                      fontSize: baseFont.subheading * fontScale,
                    },
                  ]}
                >
                  {t('activityDetail.section.tags')}
                </Text>
                <View style={styles.tagsRow}>
                  {tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: colors.primarySoft,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          {
                            color: colors.primary,
                            fontSize: baseFont.tiny * fontScale,
                          },
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {DETAIL_SECTIONS.map((section) => (
              <DetailSectionBlock
                key={section}
                section={section}
                activityId={activity.id}
                colors={colors}
                fontScale={fontScale}
                t={t}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        {isImplemented ? (
          <Pressable
            onPress={() => {
              void stopSpeaking();
              navigation.navigate('ActivityRun', { activityId: activity.id });
            }}
            style={({ pressed }) => [
              styles.startBtn,
              {
                backgroundColor: pressed
                  ? colors.primaryPressed
                  : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.startBtnText,
                {
                  color: colors.primaryText,
                  fontSize: baseFont.body * fontScale,
                },
              ]}
            >
              {t('activityDetail.startBtn')}
            </Text>
          </Pressable>
        ) : (
          <Text
            style={[
              styles.notice,
              {
                color: colors.warning,
                fontSize: baseFont.bodySm * fontScale,
              },
            ]}
          >
            {t('activityDetail.notice')}
          </Text>
        )}
      </View>
    </View>
  );
}

type MetaCardProps = {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fontScale: number;
};

function MetaCard({ label, value, colors, fontScale }: MetaCardProps) {
  return (
    <View
      style={[
        styles.metaCard,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}
    >
      <Text
        style={[
          styles.metaLabel,
          { color: colors.textMuted, fontSize: baseFont.tiny * fontScale },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metaValue,
          { color: colors.text, fontSize: baseFont.body * fontScale },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

type DetailSectionBlockProps = {
  section: DetailSection;
  activityId: string;
  colors: ReturnType<typeof useTheme>['colors'];
  fontScale: number;
  t: (key: string, params?: Record<string, string | number>) => string;
};

function DetailSectionBlock({
  section,
  activityId,
  colors,
  fontScale,
  t,
}: DetailSectionBlockProps) {
  const heading = t(`activityDetail.section.${section}`);
  const body = t(`activityDetail.${activityId}.${section}`);
  const lines = body.split('\n');

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionHeading,
          { color: colors.text, fontSize: baseFont.subheading * fontScale },
        ]}
      >
        {heading}
      </Text>
      {lines.map((line, idx) => (
        <Text
          key={idx}
          style={[
            styles.sectionBody,
            { color: colors.text, fontSize: baseFont.body * fontScale },
          ]}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFoundContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  scrollContent: { padding: 24, paddingBottom: 32 },
  category: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  title: { fontWeight: '700', marginBottom: 4 },
  domain: { marginBottom: 12 },
  shortDescription: { lineHeight: 22, marginBottom: 16 },
  ttsBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 24,
  },
  ttsBtnText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metaCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metaLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: { fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionHeading: { fontWeight: '700', marginBottom: 10 },
  sectionBody: { lineHeight: 22, marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  startBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  startBtnText: { fontWeight: '700' },
  notice: { textAlign: 'center' },
});
