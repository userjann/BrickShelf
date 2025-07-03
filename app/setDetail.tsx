import { deleteSet, getSavedSets, LegoSet } from "@/utils/storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function SetDetail() {
  const { id } = useLocalSearchParams();
  const [set, setSet] = useState<LegoSet | null>(null);

  useEffect(() => {
    async function loadSet() {
      if (!id) return;
      const sets = await getSavedSets();
      const found = sets.find((s) => s.id === id);
      if (!found) {
        Alert.alert("Set nicht gefunden");
        router.replace("/");
        return;
      }
      setSet(found);
    }
    loadSet();
  }, [id]);

  async function handleDelete() {
    if (!set) return;
    Alert.alert("Löschen bestätigen", "Willst du das Set wirklich löschen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteSet(set.id);
          router.replace("/");
        },
      },
    ]);
  }

  if (!set) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Lädt...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{set.name}</Text>
      {set.imageURL && (
        <Image source={{ uri: set.imageURL }} style={styles.image} resizeMode="contain" />
      )}
      <View style={styles.info}>
        <Text style={styles.label}>Setnummer:</Text>
        <Text style={styles.value}>{set.setNumber}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>Thema:</Text>
        <Text style={styles.value}>{set.theme || "Keine Angabe"}</Text>
      </View>
      {set.pieces !== undefined && (
        <View style={styles.info}>
          <Text style={styles.label}>Teile:</Text>
          <Text style={styles.value}>{set.pieces}</Text>
        </View>
      )}
      {set.minifigs !== undefined && (
        <View style={styles.info}>
          <Text style={styles.label}>Minifiguren:</Text>
          <Text style={styles.value}>{set.minifigs}</Text>
        </View>
      )}

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", alignItems: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginVertical: 20, textAlign: "center" },
  image: { width: 300, height: 200, marginBottom: 20 },
  info: { flexDirection: "row", marginBottom: 10 },
  label: { fontWeight: "bold", marginRight: 10 },
  value: { fontSize: 16 },
  deleteButton: {
    marginTop: 30,
    backgroundColor: "#dc3545",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
