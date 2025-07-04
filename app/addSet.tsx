// app/addSet.tsx
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function AddSet() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Header mit Zurück-Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/")} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        <Text style={styles.mainTitle}>LEGO-Set hinzufügen</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.introText}>Wie möchtest du dein Set hinzufügen?</Text>

        <View style={styles.options}>
          {/* Barcode-Scan Option */}
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              { backgroundColor: pressed ? '#004A8C' : '#0057A6' },
            ]}
            onPress={() => router.push("/qrScan")}
          >
            <MaterialIcons name="qr-code-scanner" size={50} color="#fff" />
            <Text style={styles.optionText}>Per Barcode-Scan</Text>
            <Text style={styles.optionSubText}>Schnell und einfach</Text>
          </Pressable>

          {/* Manuell eingeben Option */}
          <Pressable
            style={({ pressed }) => [
              styles.optionCard,
              { backgroundColor: pressed ? '#CC6600' : '#FF8800' },
            ]}
            onPress={() => router.push("./manuelAdd")}
          >
            <FontAwesome5 name="keyboard" size={50} color="#fff" />
            <Text style={styles.optionText}>Manuell eingeben</Text>
            <Text style={styles.optionSubText}>Für Sets ohne Barcode oder spezielle Anpassungen</Text>
          </Pressable>
        </View>
      </View>
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
    width: 28,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  introText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444444',
    marginBottom: 40,
    textAlign: 'center',
  },
  options: {
    width: '100%',
    maxWidth: 350,
    gap: 20,
  },
  optionCard: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  optionText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: '700',
    marginTop: 15,
    textAlign: "center",
  },
  optionSubText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
    opacity: 0.8,
  },
});
