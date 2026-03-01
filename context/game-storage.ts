import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HabitItem, RunState } from '@/context/game/types';

const GAME_STORAGE_KEY = 'my-habits/game-state';
const GAME_STORAGE_SCHEMA_VERSION = 1;

type StoredRunState = Omit<RunState, 'startedAt'> & {
  startedAt: string | null;
};

export type StoredGameState = {
  schemaVersion: number;
  habits: HabitItem[];
  run: StoredRunState;
};

// Wandelt einen Runtime-Run in ein serialisierbares Speicherformat um.
export function toStoredRun(run: RunState): StoredRunState {
  return {
    ...run,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
  };
}

// Wandelt den gespeicherten Run zurück in ein Runtime-Objekt.
export function fromStoredRun(run: StoredRunState): RunState {
  return {
    ...run,
    startedAt: run.startedAt ? new Date(run.startedAt) : null,
  };
}

// Baut den finalen Payload mit Schema-Version.
export function createStoredGameState(habits: HabitItem[], run: RunState): StoredGameState {
  return {
    schemaVersion: GAME_STORAGE_SCHEMA_VERSION,
    habits,
    run: toStoredRun(run),
  };
}

// Prüft, ob geladene Daten grundsätzlich lesbar und erwartbar sind.
function isStoredGameState(value: unknown): value is StoredGameState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredGameState>;

  if (typeof candidate.schemaVersion !== 'number') {
    return false;
  }

  if (!Array.isArray(candidate.habits)) {
    return false;
  }

  if (!candidate.run || typeof candidate.run !== 'object') {
    return false;
  }

  return true;
}

// Lädt den gespeicherten Game-State aus AsyncStorage.
export async function loadStoredGameState(): Promise<StoredGameState | null> {
  try {
    const rawValue = await AsyncStorage.getItem(GAME_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isStoredGameState(parsedValue)) {
      return null;
    }

    if (parsedValue.schemaVersion !== GAME_STORAGE_SCHEMA_VERSION) {
      return null;
    }

    return parsedValue;
  } catch (error) {
    console.error('Konnte Game-State nicht laden:', error);
    return null;
  }
}

// Speichert den aktuellen Game-State in AsyncStorage.
export async function saveStoredGameState(habits: HabitItem[], run: RunState): Promise<void> {
  try {
    const payload = createStoredGameState(habits, run);
    await AsyncStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Konnte Game-State nicht speichern:', error);
  }
}

// Entfernt den gespeicherten Game-State komplett.
export async function clearStoredGameState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAME_STORAGE_KEY);
  } catch (error) {
    console.error('Konnte Game-State nicht löschen:', error);
  }
}
