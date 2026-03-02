import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Infobox, type InfoboxAction } from '@/components/infobox';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { useGame, type HabitItem } from '@/context/game-context';

const GOOD_HABITS_GRADIENT_COLORS = ['#091d16', '#1a3e2c', '#4a1b20', '#a8862e'] as const;
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
  onDeleteHabit: (habitId: string) => void;
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
function HabitCard({ item, onDeleteHabit }: HabitCardProps) {
  const typeLabel = item.type === 'good' ? 'gut' : 'schlecht';

  // Löscht den aktuellen Habit-Eintrag.
  const handleDeleteHabit = useCallback(() => {
    onDeleteHabit(item.id);
  }, [item.id, onDeleteHabit]);

  return (
    <View style={styles.habitCard}>
      <ThemedText type="defaultSemiBold" lightColor="#FFFFFF" darkColor="#FFFFFF">
        {item.title}
      </ThemedText>
      <ThemedText style={styles.habitMeta} lightColor="#E8CF74" darkColor="#E8CF74">
        {`${item.targetPerWeek}x pro Woche · ${typeLabel}`}
      </ThemedText>
      <ThemedText style={styles.habitMeta} lightColor="#DDE9C9" darkColor="#DDE9C9">
        {`Positiv: ${item.positiveStreak} · Negativ: ${item.negativeStreak}`}
      </ThemedText>

      <Pressable
        style={styles.deleteButton}
        onPress={handleDeleteHabit}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} löschen`}>
        <ThemedText style={styles.deleteButtonText}>Löschen</ThemedText>
      </Pressable>
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
  const { habits, run, maxHP, addHabit, deleteHabit, endRun } = useGame();
  const [titleInput, setTitleInput] = useState('');
  const [weeklyCount, setWeeklyCount] = useState<number>(3);
  const [habitType, setHabitType] = useState<HabitFormType>('gut');
  const [pendingDeleteHabitId, setPendingDeleteHabitId] = useState<string | null>(null);
  const weekOptions = getWeekOptionsByType(habitType);
  const isDeleteInfoboxVisible = pendingDeleteHabitId !== null;

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

  // Schließt die Lösch-Infobox ohne Aktion.
  const handleCloseDeleteInfobox = useCallback(() => {
    setPendingDeleteHabitId(null);
  }, []);

  // Bestätigt das Löschen im aktiven Run und führt die Aktion aus.
  const handleConfirmDeleteInRun = useCallback(() => {
    if (!pendingDeleteHabitId) {
      return;
    }

    endRun();
    deleteHabit(pendingDeleteHabitId);
    setPendingDeleteHabitId(null);
  }, [deleteHabit, endRun, pendingDeleteHabitId]);

  // Liefert die Aktionen für die wiederverwendbare Delete-Infobox.
  const deleteInfoboxActions = useMemo<InfoboxAction[]>(() => {
    return [
      {
        label: 'Abbrechen',
        variant: 'secondary',
        onPress: handleCloseDeleteInfobox,
      },
      {
        label: 'Run beenden',
        onPress: handleConfirmDeleteInRun,
      },
    ];
  }, [handleCloseDeleteInfobox, handleConfirmDeleteInRun]);

  // Löscht ein Habit sicher und beendet bei Bedarf vorher den aktiven Run.
  const handleDeleteHabit = useCallback((habitId: string) => {
    if (!run.isActive) {
      deleteHabit(habitId);
      return;
    }

    setPendingDeleteHabitId(habitId);
  }, [deleteHabit, run.isActive]);

  // Rendert einen Listeneintrag für FlatList.
  const renderHabitItem = useCallback(({ item }: { item: HabitItem }) => {
    return <HabitCard item={item} onDeleteHabit={handleDeleteHabit} />;
  }, [handleDeleteHabit]);

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
        isRunActive={run.isActive}
        playerHP={run.playerHP}
        maxHP={maxHP}
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
              Gewohnheit
            </ThemedText>

            <ThemedText style={styles.fieldLabel} lightColor="#E8CF74" darkColor="#E8CF74">
              Titel / Name
            </ThemedText>
            <TextInput
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="z. B. 20 Minuten lesen"
              placeholderTextColor="#D5DAD7"
              style={styles.titleInput}
            />

            <ThemedText style={styles.fieldLabel} lightColor="#E8CF74" darkColor="#E8CF74">
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

            <ThemedText style={styles.fieldLabel} lightColor="#E8CF74" darkColor="#E8CF74">
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

            <ThemedText style={styles.sectionTitle} lightColor="#E8CF74" darkColor="#E8CF74">
              Angelegte Gewohnheiten
            </ThemedText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText} lightColor="#E8CF74" darkColor="#E8CF74">
              Noch keine Gewohnheiten angelegt.
            </ThemedText>
          </View>
        }
      />

      <Infobox
        visible={isDeleteInfoboxVisible}
        title="Achtung!"
        message="Wenn du diese Gewohnheit löschst, wird der aktive Run beendet. Möchtest du fortfahren?"
        actions={deleteInfoboxActions}
        onRequestClose={handleCloseDeleteInfobox}
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
    backgroundColor: 'rgba(10, 33, 24, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(216, 183, 90, 0.55)',
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
    backgroundColor: 'rgba(13, 45, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(216, 183, 90, 0.6)',
    paddingHorizontal: 12,
    color: '#F6F9EF',
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
    backgroundColor: '#D8B75A',
    borderColor: '#D8B75A',
  },
  optionButtonInactive: {
    backgroundColor: 'rgba(16, 53, 37, 0.75)',
    borderColor: 'rgba(216, 183, 90, 0.5)',
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  optionTextActive: {
    color: '#163025',
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
    backgroundColor: '#D8B75A',
    borderColor: '#D8B75A',
  },
  typeButtonInactive: {
    backgroundColor: 'rgba(61, 22, 28, 0.82)',
    borderColor: 'rgba(216, 183, 90, 0.5)',
  },
  typeButtonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  typeTextActive: {
    color: '#163025',
  },
  typeTextInactive: {
    color: '#FFFFFF',
  },
  addButton: {
    marginTop: 16,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D8B75A',
    borderWidth: 1,
    borderColor: '#F0D98D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#173427',
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
    backgroundColor: 'rgba(12, 40, 29, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(216, 183, 90, 0.5)',
    marginBottom: 10,
  },
  habitMeta: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 27, 32, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(216, 183, 90, 0.72)',
  },
  deleteButtonText: {
    color: '#E8CF74',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
