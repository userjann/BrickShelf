// app/setDetail.tsx
import { deleteSet, getSavedSets, LegoSet } from "@/utils/storage";
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'; // FontAwesome5 hinzugefügt
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SetDetail() {
  const { id } = useLocalSearchParams();
  const [set, setSet] = useState<LegoSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSet() {
      setLoading(true);
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const sets = await getSavedSets();
        const found = sets.find((s) => s.id === id);

        if (!found) {
          Alert.alert("Fehler", "Set nicht gefunden. Es wurde möglicherweise bereits gelöscht oder existiert nicht.");
          router.replace("/");
          return;
        }
        setSet(found);
      } catch (error) {
        console.error("Fehler beim Laden des Sets:", error);
        Alert.alert("Fehler", "Set konnte nicht geladen werden.");
        router.replace("/");
      } finally {
        setLoading(false);
      }
    }
    loadSet();
  }, [id]);

  async function handleDelete() {
    if (!set) return;

    Alert.alert("Set löschen", `Willst du "${set.name}" wirklich aus deiner Sammlung entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSet(set.id);
            router.replace("/");
          } catch (error) {
            console.error("Fehler beim Löschen des Sets:", error);
            Alert.alert("Fehler", "Set konnte nicht gelöscht werden.");
          }
        },
      },
    ]);
  }

  // Ladezustand anzeigen
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057A6" />
        <Text style={styles.loadingText}>Set-Details werden geladen...</Text>
      </SafeAreaView>
    );
  }

  // Falls Set nach dem Laden nicht gefunden wurde (z.B. ID war da, aber Set nicht in Storage)
  if (!set) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push("/")} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color="#222222" />
          </Pressable>
          <Text style={styles.mainTitle}>Set-Details</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
        <View style={styles.noSetFoundContainer}>
          <MaterialIcons name="error-outline" size={60} color="#D32F2F" />
          <Text style={styles.noSetFoundText}>Das angefragte Set wurde nicht gefunden.</Text>
          <Pressable onPress={() => router.replace('/')} style={styles.homeButton}>
            <Text style={styles.homeButtonText}>Zurück zur Sammlung</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bereich */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/")} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>Set-Details</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailCard}>
          <Text style={styles.title}>{set.name}</Text>

          {set.imageURL ? (
            <Image source={{ uri: set.imageURL }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={60} color="#B0B0B0" />
              <Text style={styles.imagePlaceholderText}>Kein Bild verfügbar</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Setnummer:</Text>
            <Text style={styles.value}>{set.setNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thema:</Text>
            <Text style={styles.value}>{set.theme || "Keine Angabe"}</Text>
          </View>

          {set.pieces !== undefined && (
            <View style={styles.infoRow}>
              <View style={styles.iconLabelContainer}>
                <FontAwesome5 name="cube" size={18} color="#444444" style={styles.icon} />
                <Text style={styles.label}>Teile:</Text>
              </View>
              <Text style={styles.value}>{set.pieces}</Text>
            </View>
          )}
          {set.minifigs !== undefined && (
            <View style={styles.infoRow}>
              <View style={styles.iconLabelContainer}>
                <FontAwesome5 name="users" size={18} color="#444444" style={styles.icon} />
                <Text style={styles.label}>Minifiguren:</Text>
              </View>
              <Text style={styles.value}>{set.minifigs}</Text>
            </View>
          )}

          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color="#fff" />
            <Text style={styles.deleteButtonText}>Set löschen</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    width: 28, // Gleiche Breite wie Icon für Zentrierung
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#555',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    width: '100%',
    maxWidth: 400, // Maximale Breite für größere Bildschirme
    marginTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: '#222222',
    marginBottom: 20,
    textAlign: "center",
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
    resizeMode: 'contain',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  // Neuer Container für Icon und Label
  iconLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8, // Abstand zwischen Icon und Text
  },
  label: {
    fontWeight: "700",
    fontSize: 17,
    color: '#444444',
  },
  value: {
    fontSize: 17,
    color: '#666666',
    flexShrink: 1, // Textumbruch erlauben
    textAlign: 'right',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#D32F2F", // Ein klares Rot für destruktive Aktionen
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginTop: 30,
    width: '80%',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginLeft: 10, // Abstand zwischen Icon und Text
  },
  noSetFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FDFDFD', // Gleicher Hintergrund wie safeArea
  },
  noSetFoundText: {
    fontSize: 18,
    color: '#D32F2F',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#0057A6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});