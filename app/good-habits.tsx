import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useGame, type HabitItem } from '@/context/game-context';

const GOOD_HABITS_GRADIENT_COLORS = ['#0f2a1f', '#1c4a33', '#9b7a21'] as const;
const GOOD_HABITS_GRADIENT_START = { x: 0, y: 0 } as const;
const GOOD_HABITS_GRADIENT_END = { x: 1, y: 1 } as const;
const GOOD_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;
const BAD_WEEK_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

type HabitFormType = 'gut' | 'schlecht';

type FrequencyButtonProps = {
  value: number;
  isSelected: boolean;
  onPress: (value: number) => void;
};

type HabitTypeButtonProps = {
  label: HabitFormType;
  isSelected: boolean;
  onPress: (type: HabitFormType) => void;
};

type HabitCardProps = {
  item: HabitItem;
};

// Rendert einen auswählbaren Button für die Wochenfrequenz.
function FrequencyButton({ value, isSelected, onPress }: FrequencyButtonProps) {
  return (
    <Pressable
      style={[styles.optionButton, isSelected ? styles.optionButtonActive : styles.optionButtonInactive]}
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityLabel={`${value} mal pro Woche`}>
      <ThemedText style={[styles.optionText, isSelected ? styles.optionTextActive : styles.optionTextInactive]}>
        {value}
      </ThemedText>
    </Pressable>
  );
}

// Rendert einen auswählbaren Button für den Gewohnheitstyp.
function HabitTypeButton({ label, isSelected, onPress }: HabitTypeButtonProps) {
  return (
    <Pressable
      style={[styles.typeButton, isSelected ? styles.typeButtonActive : styles.typeButtonInactive]}
      onPress={() => onPress(label)}
      accessibilityRole="button"
      accessibilityLabel={`Typ ${label}`}>
      <ThemedText style={[styles.typeButtonText, isSelected ? styles.typeTextActive : styles.typeTextInactive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

// Rendert eine einzelne Gewohnheit in der Liste.
function HabitCard({ item }: HabitCardProps) {
  const typeLabel = item.type === 'good' ? 'gut' : 'schlecht';

  return (
    <View style={styles.habitCard}>
      <ThemedText type="defaultSemiBold" lightColor="#FFFFFF" darkColor="#FFFFFF">
        {item.title}
      </ThemedText>
      <ThemedText style={styles.habitMeta} lightColor="#F4F4F4" darkColor="#F4F4F4">
        {`${item.targetPerWeek}x pro Woche · ${typeLabel}`}
      </ThemedText>
      <ThemedText style={styles.habitMeta} lightColor="#EDEDED" darkColor="#EDEDED">
        {`Positiv: ${item.positiveStreak} · Negativ: ${item.negativeStreak}`}
      </ThemedText>
    </View>
  );
}

// Konvertiert die Formularauswahl in den internen Habit-Typ.
function mapFormTypeToHabitType(value: HabitFormType) {
  return value === 'gut' ? 'good' : 'bad';
}

// Liefert die gültigen Wochenwerte abhängig vom gewählten Gewohnheitstyp.
function getWeekOptionsByType(type: HabitFormType) {
  return type === 'schlecht' ? BAD_WEEK_OPTIONS : GOOD_WEEK_OPTIONS;
}

// Liefert den Feldtitel für die Wochenauswahl abhängig vom Typ.
function getWeeklyLabelByType(type: HabitFormType) {
  return type === 'schlecht' ? 'Wie oft pro Woche? (0-7)' : 'Wie oft pro Woche? (1-7)';
}

// Liefert den bereinigten Titel für die Speicherung.
function getTrimmedTitle(value: string): string {
  return value.trim();
}

// Rendert eine Platzhalter-Seite für gute Gewohnheiten und Vorsätze.
export default function GoodHabitsScreen() {
  const router = useRouter();
  const { habits, addHabit } = useGame();
  const [titleInput, setTitleInput] = useState('');
  const [weeklyCount, setWeeklyCount] = useState<number>(3);
  const [habitType, setHabitType] = useState<HabitFormType>('gut');
  const weekOptions = getWeekOptionsByType(habitType);

  // Führt zur vorherigen Seite zurück.
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Speichert eine neue Gewohnheit und setzt das Formular zurück.
  const handleAddHabit = useCallback(() => {
    const trimmedTitle = getTrimmedTitle(titleInput);

    if (!trimmedTitle) {
      return;
    }

    addHabit(trimmedTitle, weeklyCount, mapFormTypeToHabitType(habitType));
    setTitleInput('');
    setWeeklyCount(3);
    setHabitType('gut');
  }, [addHabit, habitType, titleInput, weeklyCount]);

  // Liefert den stabilen Schlüssel für jeden Listen-Eintrag.
  const getHabitKey = useCallback((item: HabitItem) => item.id, []);

  // Rendert einen Listeneintrag für FlatList.
  const renderHabitItem = useCallback(({ item }: { item: HabitItem }) => {
    return <HabitCard item={item} />;
  }, []);

  // Wechselt den Habit-Typ und korrigiert ungültige Wochenwerte.
  const handleChangeHabitType = useCallback((nextType: HabitFormType) => {
    setHabitType(nextType);

    if (nextType === 'gut' && weeklyCount === 0) {
      setWeeklyCount(1);
    }
  }, [weeklyCount]);

  return (
    <LinearGradient
      colors={GOOD_HABITS_GRADIENT_COLORS}
      start={GOOD_HABITS_GRADIENT_START}
      end={GOOD_HABITS_GRADIENT_END}
      style={styles.container}>
      <ScreenHeader
        onPressLeft={handleGoBack}
        leftAccessibilityLabel="Zurück"
        showRightButton={false}
        useLeftBackImage
      />

      <FlatList
        data={habits}
        keyExtractor={getHabitKey}
        renderItem={renderHabitItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.formCard}>
            <ThemedText type="title" lightColor="#FFFFFF" darkColor="#FFFFFF">
              Gute Gewohnheiten
            </ThemedText>

            <ThemedText style={styles.fieldLabel} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Titel / Name
            </ThemedText>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="z. B. 20 Minuten lesen"
              placeholderTextColor="#D5DAD7"
              style={styles.titleInput}
            />

            <ThemedText style={styles.fieldLabel} lightColor="#FFFFFF" darkColor="#FFFFFF">
              {getWeeklyLabelByType(habitType)}
            </ThemedText>
            <View style={styles.optionRow}>
              {weekOptions.map((option) => (
                <FrequencyButton
                  key={option}
                  value={option}
                  isSelected={weeklyCount === option}
                  onPress={setWeeklyCount}
                />
              ))}
            </View>

            <ThemedText style={styles.fieldLabel} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Typ
            </ThemedText>
            <View style={styles.typeRow}>
              <HabitTypeButton
                label="gut"
                isSelected={habitType === 'gut'}
                onPress={handleChangeHabitType}
              />
              <HabitTypeButton
                label="schlecht"
                isSelected={habitType === 'schlecht'}
                onPress={handleChangeHabitType}
              />
            </View>

            <Pressable
              style={styles.addButton}
              onPress={handleAddHabit}
              accessibilityRole="button"
              accessibilityLabel="Gewohnheit hinzufügen">
              <ThemedText style={styles.addButtonText}>Gewohnheit hinzufügen</ThemedText>
            </Pressable>

            <ThemedText style={styles.sectionTitle} lightColor="#FFFFFF" darkColor="#FFFFFF">
              Angelegte Gewohnheiten
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText} lightColor="#EFEFEF" darkColor="#EFEFEF">
              Noch keine Gewohnheiten angelegt.
            </ThemedText>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 116,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  formCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
    marginBottom: 16,
  },
  fieldLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  titleInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  optionButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#19352A',
  },
  optionTextInactive: {
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  typeButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  typeButtonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  typeTextActive: {
    color: '#19352A',
  },
  typeTextInactive: {
    color: '#FFFFFF',
  },
  addButton: {
    marginTop: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#19352A',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  habitCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 10,
  },
  habitMeta: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
