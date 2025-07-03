// app/addSet.tsx
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function AddSet() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>LEGO-Set hinzufügen</Text>

      <View style={styles.options}>
        <Pressable style={styles.option} onPress={() => router.push("/qrScan")}>
          <Text style={styles.optionText}>📷 Per Barcode-Scan</Text>
        </Pressable>
          <Pressable style={styles.option} onPress={() => router.push("./manuelAdd")}>
          <Text style={styles.optionText}>✍️ Manuell eingeben</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  options: {
    gap: 20,
  },
  option: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderRadius: 10,
  },
  optionText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
});
