import { saveSet } from "@/utils/storage";
import Constants from 'expo-constants';
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

const { BRICKSET_API_KEY } = Constants.expoConfig?.extra || {};

export default function ManualAdd() {
  const [name, setName] = useState("");
  const [setNumber, setSetNumber] = useState("");
  const [theme, setTheme] = useState("");
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<number | null>(null);
  const [minifigs, setMinifigs] = useState<number | null>(null);

  async function fetchSetDetails() {
    if (!setNumber) return;

    setLoading(true);
    setName("");
    setTheme("");
    setImageURL(null);
    setPieces(null);
    setMinifigs(null);

    try {
      const params = encodeURIComponent(JSON.stringify({ query: setNumber }));
      const url = `https://brickset.com/api/v3.asmx/getSets?apiKey=${BRICKSET_API_KEY}&userHash=&params=${params}`;

      const response = await fetch(url);
      const json = await response.json();

      const sets = json.sets;
    

      if (!sets || sets.length === 0) {
        Alert.alert("Kein Set gefunden");
        setLoading(false);
        return;
      }

      const setData = sets[0];

      setName(setData.name || "");
      setTheme(setData.theme || "");
      setImageURL(setData.image?.imageURL || null);
      setPieces(setData.pieces || null);
      setMinifigs(setData.minifigs || null);

    } catch (e) {
      Alert.alert("Fehler beim Abrufen der Daten");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !setNumber) {
      Alert.alert("Fehler", "Bitte gültige Setnummer eingeben.");
      return;
    }

    try {
      await saveSet({
        id: setNumber,
        name,
        setNumber,
        theme,
        imageURL: imageURL ?? undefined,
        pieces: pieces ?? undefined,
        minifigs: minifigs ?? undefined,
      });

       await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      

      router.replace("/");
    } catch {
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LEGO-Set manuell hinzufügen</Text>

      <TextInput
        placeholder="Setnummer (z.B. 75318)"
        style={styles.input}
        keyboardType="numeric"
        value={setNumber}
        onChangeText={setSetNumber}
        onEndEditing={fetchSetDetails}
        editable={!loading}
      />

      {loading && <ActivityIndicator size="small" color="#007AFF" />}

      {!loading && name ? (
        <View style={styles.resultContainer}>
          {imageURL ? (
            <Image source={{ uri: imageURL }} style={styles.image} resizeMode="contain" />
          ) : null}

          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{name}</Text>

          <Text style={styles.label}>Thema:</Text>
          <Text style={styles.value}>{theme || "–"}</Text>

          {pieces !== null && (
            <>
              <Text style={styles.label}>Teile:</Text>
              <Text style={styles.value}>{pieces}</Text>
            </>
          )}

          {minifigs !== null && (
            <>
              <Text style={styles.label}>Minifiguren:</Text>
              <Text style={styles.value}>{minifigs}</Text>
            </>
          )}
        </View>
      ) : null}

      <Pressable
        style={[styles.button, (!name || loading) && { backgroundColor: "#ccc" }]}
        onPress={handleSave}
        disabled={!name || loading}
      >
        <Text style={styles.buttonText}>💾 Speichern</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 30, textAlign: "center" },
  input: { borderColor: "#ccc", borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  resultContainer: { marginBottom: 15, alignItems: "center" },
  label: { fontWeight: "600", fontSize: 16, color: "#555", marginTop: 10 },
  value: { fontSize: 18, marginBottom: 8 },
  image: { width: 200, height: 150, marginBottom: 10, borderRadius: 8, backgroundColor: "#eee" },
  button: { backgroundColor: "#28A745", padding: 15, borderRadius: 10, marginTop: 10, width: "100%" },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 18 },
});
