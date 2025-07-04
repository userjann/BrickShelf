import { saveSet } from "@/utils/storage";
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const { BRICKSET_API_KEY } = Constants.expoConfig?.extra || {};

export default function ManualAdd() {
  const [name, setName] = useState("");
  const [setNumber, setSetNumber] = useState("");
  const [theme, setTheme] = useState("");
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pieces, setPieces] = useState<number | null>(null);
  const [minifigs, setMinifigs] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function fetchSetDetails() {
    if (!setNumber) {
      Alert.alert("Eingabe fehlt", "Bitte geben Sie eine Setnummer ein.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
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
        setLoading(false);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const setData = sets[0];

      setName(setData.name || "");
      setTheme(setData.theme || "");
      setImageURL(setData.image?.imageURL || null);
      setPieces(setData.pieces || null);
      setMinifigs(setData.minifigs || null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (e) {
      console.error("Fehler beim Abrufen der Daten:", e);
      Alert.alert("Fehler", "Es gab ein Problem beim Abrufen der Set-Informationen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name || !setNumber) {
      Alert.alert("Fehler", "Bitte geben Sie eine gültige Setnummer ein und suchen Sie nach dem Set.");
      return;
    }

    setLoading(true);
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
      Alert.alert("Erfolg", `${name} wurde deiner Sammlung hinzugefügt!`);
      router.replace("/");
    } catch {
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Set manuell hinzufügen</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Setnummer eingeben (z.B. 75318)"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="numeric"
            value={setNumber}
            onChangeText={text => {
              setSetNumber(text);
              if (hasSearched) {
                setName("");
                setTheme("");
                setImageURL(null);
                setPieces(null);
                setMinifigs(null);
                setHasSearched(false);
              }
            }}
            onSubmitEditing={fetchSetDetails}
            editable={!loading}
          />
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && { backgroundColor: '#004A8F' },
              loading && { backgroundColor: '#A0A0A0' }
            ]}
            onPress={fetchSetDetails}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="search" size={24} color="#FFF" />
                <Text style={styles.searchButtonText}>Suchen</Text>
              </View>
            )}
          </Pressable>
        </View>

        {loading && !name && hasSearched && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0057A6" />
            <Text style={styles.loadingText}>Set-Informationen werden geladen...</Text>
          </View>
        )}

        {!loading && name && hasSearched ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{name}</Text>

            {imageURL ? (
              <Image source={{ uri: imageURL }} style={styles.resultImage} resizeMode="contain" />
            ) : (
              <View style={styles.resultImagePlaceholder}>
                <MaterialIcons name="image-not-supported" size={60} color="#B0B0B0" />
                <Text style={styles.placeholderText}>Kein Bild verfügbar</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Setnummer:</Text>
              <Text style={styles.infoValue}>{setNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thema:</Text>
              <Text style={styles.infoValue}>{theme || "N/A"}</Text>
            </View>

            {pieces !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teile:</Text>
                <Text style={styles.infoValue}>{pieces}</Text>
              </View>
            )}

            {minifigs !== null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minifiguren:</Text>
                <Text style={styles.infoValue}>{minifigs}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && { backgroundColor: '#008C00' },
                loading && { backgroundColor: '#A0A0A0' }
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Speichert..." : "Set speichern"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !name && hasSearched && (
          <View style={styles.noResultContainer}>
            <MaterialIcons name="sentiment-dissatisfied" size={50} color="#D32F2F" />
            <Text style={styles.noResultText}>
              Kein LEGO Set gefunden für die Nummer: {setNumber}
            </Text>
            <Pressable onPress={() => { setSetNumber(''); setHasSearched(false); }} style={styles.clearButton}>
              <MaterialIcons name="backspace" size={20} color="#0057A6" />
              <Text style={styles.clearButtonText}>Eingabe löschen & neu versuchen</Text>
            </Pressable>
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.initialInstructionContainer}>
            <MaterialIcons name="info-outline" size={50} color="#B0B0B0" />
            <Text style={styles.initialInstructionText}>
              Geben Sie die LEGO-Setnummer ein und tippen Sie auf "Suchen".
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// (Styles bleiben unverändert – deine Definition ist korrekt)


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDFDFD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FDFDFD',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 5,
  },
  backButtonPlaceholder: {
    width: 28, // Damit der Titel mittig bleibt
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10, // Etwas Abstand nach unten vom Header
  },
  input: {
    flex: 1,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchButton: {
    backgroundColor: '#0057A6', // LEGO Blau
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  searchButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    marginBottom: 20,
    marginTop: 10,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E0E0E0', // Grauer Hintergrund für Ladezustand/kein Bild
    marginBottom: 20,
    resizeMode: 'contain',
  },
  resultImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: '#444444',
  },
  infoValue: {
    fontSize: 16,
    color: '#666666',
    flexShrink: 1,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#00A800', // Kräftiges Grün
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 25,
    width: '80%',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  noResultContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: 200,
    marginTop: 20,
  },
  noResultText: {
    textAlign: 'center',
    fontSize: 17,
    color: '#D32F2F', // Dunkelrot für Warnungen
    marginTop: 15,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#EBF6FF', // Helles Blau
    borderRadius: 25,
  },
  clearButtonText: {
    marginLeft: 10,
    color: '#0057A6', // LEGO Blau
    fontSize: 16,
    fontWeight: '600',
  },
  initialInstructionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    minHeight: 150,
    marginTop: 20,
  },
  initialInstructionText: {
    textAlign: 'center',
    fontSize: 17,
    color: '#555',
    marginTop: 15,
    fontWeight: '600',
  }
});