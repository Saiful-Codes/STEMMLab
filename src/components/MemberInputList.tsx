import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { baseFont } from '../theme/tokens';

type Props = {
  members: string[];
  onChange: (members: string[]) => void;
};

export default function MemberInputList({ members, onChange }: Props) {
  const { colors, fontScale } = useTheme();
  const { t } = useTranslation();

  const updateAt = (index: number, value: string) => {
    const next = [...members];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (members.length <= 1) return;
    const next = members.filter((_, i) => i !== index);
    onChange(next);
  };

  const addMember = () => {
    onChange([...members, '']);
  };

  return (
    <View>
      {members.map((member, index) => {
        const canRemove = members.length > 1;
        return (
          <View key={index} style={styles.row}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.borderStrong,
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  fontSize: baseFont.body * fontScale,
                },
              ]}
              placeholder={t('teamSetup.memberPlaceholder', { n: index + 1 })}
              placeholderTextColor={colors.textSubtle}
              value={member}
              onChangeText={(text) => updateAt(index, text)}
              autoCapitalize="words"
            />
            <Pressable
              onPress={() => removeAt(index)}
              disabled={!canRemove}
              style={({ pressed }) => [
                styles.removeBtn,
                {
                  backgroundColor:
                    pressed && canRemove
                      ? colors.dangerSoftPressed
                      : colors.dangerSoft,
                },
                !canRemove && styles.removeBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.removeBtnText,
                  {
                    color: colors.dangerText,
                    fontSize: baseFont.bodySm * fontScale,
                  },
                ]}
              >
                {t('teamSetup.removeMember')}
              </Text>
            </Pressable>
          </View>
        );
      })}

      <Pressable
        onPress={addMember}
        style={({ pressed }) => [
          styles.addBtn,
          {
            borderColor: colors.primary,
            backgroundColor: pressed ? colors.primarySoft : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.addBtnText,
            { color: colors.primary, fontSize: baseFont.bodySm * fontScale },
          ]}
        >
          {t('teamSetup.addMember')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  removeBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeBtnDisabled: { opacity: 0.4 },
  removeBtnText: { fontWeight: '600' },
  addBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnText: { fontWeight: '600' },
});
