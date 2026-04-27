import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  members: string[];
  onChange: (members: string[]) => void;
};

export default function MemberInputList({ members, onChange }: Props) {
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
      {members.map((member, index) => (
        <View key={index} style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder={`Member ${index + 1}`}
            value={member}
            onChangeText={(text) => updateAt(index, text)}
            autoCapitalize="words"
          />
          <Pressable
            onPress={() => removeAt(index)}
            disabled={members.length <= 1}
            style={({ pressed }) => [
              styles.removeBtn,
              members.length <= 1 && styles.removeBtnDisabled,
              pressed && members.length > 1 && styles.removeBtnPressed,
            ]}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <Pressable
        onPress={addMember}
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
      >
        <Text style={styles.addBtnText}>+ Add Member</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  removeBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  removeBtnPressed: { backgroundColor: '#fecaca' },
  removeBtnDisabled: { opacity: 0.4 },
  removeBtnText: { color: '#b91c1c', fontWeight: '600' },
  addBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addBtnPressed: { backgroundColor: '#eff6ff' },
  addBtnText: { color: '#2563eb', fontWeight: '600' },
});
