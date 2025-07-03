import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'legoSets';

export type LegoSet = {
  id: string;          // z.B. setNumber
  name: string;
  theme: string;
  setNumber: string;
  imageURL?: string;
  pieces?: number;      // neue Felder optional machen
  minifigs?: number;
};


export async function saveSet(newSet: LegoSet) {
  const existing = await getSavedSets();
  const exists = existing.some(set => set.id === newSet.id);
  if (!exists) {
    const updated = [...existing, newSet];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function getSavedSets(): Promise<LegoSet[]> {
  const json = await AsyncStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

export async function deleteSet(setId: string) {
  const current = await getSavedSets();
  const updated = current.filter(set => set.id !== setId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearAllSets() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function clearStorage() {
  try {
    await AsyncStorage.clear();
    console.log("Storage komplett gelöscht");
  } catch (e) {
    console.error("Fehler beim Löschen des Storage:", e);
  }
}
