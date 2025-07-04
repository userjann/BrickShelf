// app/addSet.tsx
// Importieren der notwendigen Komponenten und Icons
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'; // Icons von Expo
import { router } from "expo-router"; // Für die Navigation zwischen Screens
import { StatusBar } from 'expo-status-bar'; // Zum Steuern der Statusleiste
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native"; // Grundlegende React Native UI-Komponenten

// Definition der Hauptkomponente AddSet
export default function AddSet() {
  return (
    // SafeAreaView sorgt dafür, dass der Inhalt nicht von der Notch oder der Statusleiste verdeckt wird
    <SafeAreaView style={styles.safeArea}>
      {/* Setzt den Stil der Statusleiste auf "dark" für bessere Lesbarkeit */}
      <StatusBar style="dark" />

      {/* Header-Bereich mit Zurück-Button und Titel */}
      <View style={styles.header}>
        {/* Pressable-Komponente für den Zurück-Button */}
        <Pressable onPress={() => router.push("/")} style={styles.backButton}>
          {/* MaterialIcons Pfeil-zurück-Icon */}
          <MaterialIcons name="arrow-back" size={28} color="#222222" />
        </Pressable>
        {/* Haupttitel des Screens */}
        <Text style={styles.mainTitle}>LEGO-Set hinzufügen</Text>
        {/* Platzhalter-View, um den Titel zu zentrieren (gleiche Breite wie der Zurück-Button) */}
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Hauptinhaltsbereich des Screens */}
      <View style={styles.contentContainer}>
        {/* Einführungstext, der den Benutzer zur Auswahl auffordert */}
        <Text style={styles.introText}>Wie möchtest du dein Set hinzufügen?</Text>

        {/* Container für die beiden Optionskarten */}
        <View style={styles.options}>
          {/* Option zum Hinzufügen per Barcode-Scan */}
          <Pressable
            // Dynamische Stiländerung beim Drücken für visuelles Feedback
            style={({ pressed }) => [
              styles.optionCard,
              { backgroundColor: pressed ? '#004A8C' : '#0057A6' }, // Hintergrundfarbe ändert sich beim Drücken
            ]}
            // Navigiert zum QR-Scan-Screen beim Drücken
            onPress={() => router.push("/qrScan")}
          >
            {/* Icon für den Barcode-Scanner */}
            <MaterialIcons name="qr-code-scanner" size={50} color="#fff" />
            {/* Titel der Option */}
            <Text style={styles.optionText}>Per Barcode-Scan</Text>
            {/* Untertitel/Beschreibung der Option */}
            <Text style={styles.optionSubText}>Schnell und einfach</Text>
          </Pressable>

          {/* Option zum manuellen Eingeben des Sets */}
          <Pressable
            // Dynamische Stiländerung beim Drücken für visuelles Feedback
            style={({ pressed }) => [
              styles.optionCard,
              { backgroundColor: pressed ? '#CC6600' : '#FF8800' }, // Hintergrundfarbe ändert sich beim Drücken
            ]}
            // Navigiert zum Screen für die manuelle Eingabe beim Drücken
            onPress={() => router.push("./manuelAdd")}
          >
            {/* Icon für die Tastatureingabe */}
            <FontAwesome5 name="keyboard" size={50} color="#fff" />
            {/* Titel der Option */}
            <Text style={styles.optionText}>Manuell eingeben</Text>
            {/* Untertitel/Beschreibung der Option */}
            <Text style={styles.optionSubText}>Für Sets ohne Barcode oder spezielle Anpassungen</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// StyleSheet für die Komponentenstile
const styles = StyleSheet.create({
  // Stil für den SafeAreaView-Container
  safeArea: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein
    backgroundColor: '#FDFDFD', // Hintergrundfarbe
  },
  // Stil für den Header-Bereich
  header: {
    flexDirection: 'row', // Elemente nebeneinander anordnen
    alignItems: 'center', // Elemente vertikal zentrieren
    justifyContent: 'space-between', // Elemente mit gleichem Abstand dazwischen verteilen
    paddingHorizontal: 20, // Horizontaler Innenabstand
    paddingVertical: 15, // Vertikaler Innenabstand
    backgroundColor: '#FDFDFD', // Hintergrundfarbe
    borderBottomWidth: 1, // Unterer Rand
    borderBottomColor: '#EEEEEE', // Farbe des unteren Rands
  },
  // Stil für den Zurück-Button
  backButton: {
    padding: 5, // Innenabstand
  },
  // Stil für den Platzhalter des Zurück-Buttons
  backButtonPlaceholder: {
    width: 28, // Feste Breite, um den Titel zu zentrieren
  },
  // Stil für den Haupttitel
  mainTitle: {
    fontSize: 28, // Schriftgröße
    fontWeight: '800', // Schriftstärke (extra fett)
    color: '#222222', // Textfarbe
  },
  // Stil für den Hauptinhaltscontainer
  contentContainer: {
    flex: 1, // Nimmt den restlichen Platz ein
    justifyContent: 'center', // Inhalt vertikal zentrieren
    alignItems: 'center', // Inhalt horizontal zentrieren
    padding: 20, // Innenabstand
  },
  // Stil für den Einführungstext
  introText: {
    fontSize: 20, // Schriftgröße
    fontWeight: '600', // Schriftstärke (halbfett)
    color: '#444444', // Textfarbe
    marginBottom: 40, // Unterer Außenabstand
    textAlign: 'center', // Text zentrieren
  },
  // Stil für den Container der Optionskarten
  options: {
    width: '100%', // Nimmt die volle Breite ein
    maxWidth: 350, // Maximale Breite
    gap: 20, // Abstand zwischen den Karten
  },
  // Stil für die einzelnen Optionskarten
  optionCard: {
    padding: 25, // Innenabstand
    borderRadius: 15, // Abgerundete Ecken
    alignItems: 'center', // Inhalt horizontal zentrieren
    justifyContent: 'center', // Inhalt vertikal zentrieren
    elevation: 6, // Android-Schatteneffekt
    shadowColor: '#000', // Schattenfarbe
    shadowOpacity: 0.2, // Deckkraft des Schattens
    shadowOffset: { width: 0, height: 3 }, // Versatz des Schattens (X, Y)
    shadowRadius: 5, // Radius des Schattens
  },
  // Stil für den Haupttext der Optionskarten
  optionText: {
    color: "#fff", // Textfarbe
    fontSize: 22, // Schriftgröße
    fontWeight: '700', // Schriftstärke (fett)
    marginTop: 15, // Oberer Außenabstand
    textAlign: "center", // Text zentrieren
  },
  // Stil für den Untertext der Optionskarten
  optionSubText: {
    color: "#fff", // Textfarbe
    fontSize: 14, // Schriftgröße
    marginTop: 5, // Oberer Außenabstand
    textAlign: "center", // Text zentrieren
    opacity: 0.8, // Deckkraft
  },
});