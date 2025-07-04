// Importe der benötigten Bibliotheken und Komponenten
import { getSavedSets, LegoSet } from '@/utils/storage'; // Custom-Utilities für Datenhaltung: Funktion zum Laden gespeicherter Sets und der Typ für ein Lego-Set.
import { FontAwesome5 } from '@expo/vector-icons'; // Icon-Set von FontAwesome für visuelle Elemente.
import { useCameraPermissions } from 'expo-camera'; // Hook von Expo, um den Kamera-Zugriff abzufragen und anzufordern.
import { router } from 'expo-router'; // Navigations-API von Expo Router für das Screen-Management.
import { StatusBar } from 'expo-status-bar'; // Komponente zur Steuerung der oberen Statusleiste des Geräts.
import { useEffect, useState } from 'react'; // React Hooks für Lifecycle-Management und Zustandsverwaltung.
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'; // Grundlegende UI-Komponenten von React Native.

/**
 * Dies ist die Hauptkomponente der App, die die Liste der gesammelten LEGO-Sets anzeigt.
 * Sie kümmert sich auch um Kamera-Berechtigungen und Navigationsoptionen.
 */
export default function Index() {
  // Initialisiert den Kamera-Berechtigungsstatus und eine Funktion zum Anfordern der Berechtigung.
  // `permission` enthält Details wie `granted` (boolean) und `expires`.
  const [permission, requestPermission] = useCameraPermissions();
  // Eine einfache Flagge, die `true` ist, wenn die Kamera-Berechtigung erteilt wurde.
  const isPermissionGranted = Boolean(permission?.granted);

  // Zustandsvariable zur Speicherung der tatsächlich gescannten und in der Sammlung befindlichen LEGO-Sets.
  // Wird mit einem leeren Array initialisiert.
  const [scannedSets, setScannedSets] = useState<LegoSet[]>([]);

  // useEffect-Hook: Wird einmalig beim Mounten der Komponente ausgeführt, um gespeicherte Sets zu laden.
  useEffect(() => {
    /**
     * Asynchrone Funktion zum Abrufen der Sets aus dem lokalen Speicher.
     */
    async function loadSets() {
      const saved = await getSavedSets(); // Ruft die gespeicherten Sets ab.
      setScannedSets(saved); // Aktualisiert den Zustand der Komponente mit den geladenen Sets.
    }
    loadSets(); // Führt die Ladefunktion aus.
  }, []); // Das leere Abhängigkeitsarray sorgt dafür, dass der Effekt nur einmal läuft (ähnlich componentDidMount).

  /**
   * Renderfunktion für jedes einzelne Element in der FlatList.
   * Zeigt Details eines LEGO-Sets an und ermöglicht das Navigieren zur Detailansicht.
   * @param {Object} props - Die Props, die von FlatList übergeben werden.
   * @param {LegoSet} props.item - Das aktuelle LegoSet-Objekt, das gerendert werden soll.
   */
  const renderSetItem = ({ item }: { item: LegoSet }) => (
    // Pressable reagiert auf Berührungen und ändert den Stil beim Drücken.
    <Pressable
      style={({ pressed }) => [
        styles.setItem, // Grundlegender Stil für ein Listenelement.
        pressed && { backgroundColor: '#EBF6FF' }, // Hintergrundfarbe ändert sich leicht, wenn gedrückt.
      ]}
      // Beim Drücken wird zur Detailseite des jeweiligen Sets navigiert.
      // Die Set-ID wird als URL-Parameter übergeben, um das richtige Set zu laden.
      onPress={() => router.push(`/setDetail?id=${item.id}`)}
    >
      <View style={styles.setItemContent}>
        <Text style={styles.setTitle}>{item.name}</Text> {/* Zeigt den Namen des LEGO-Sets an. */}
        <Text style={styles.setInfo}>
          {item.setNumber} – {item.theme} {/* Zeigt die Set-Nummer und das Thema an. */}
        </Text>
      </View>
    </Pressable>
  );

  return (
    // SafeAreaView stellt sicher, dass Inhalte nicht durch Geräte-Notches oder Statusleisten verdeckt werden.
    <SafeAreaView style={styles.container}>
      {/* Setzt den Stil der oberen Statusleiste des Geräts auf "dark" für bessere Lesbarkeit. */}
      <StatusBar style="dark" />
      
      {/* Header-Bereich der Anwendung mit dem Titel der Sammlung. */}
      <View style={styles.header}>
        <Text style={styles.mainText}>Deine LEGO Sammlung</Text> {/* Haupttitel des Screens. */}
      </View>

      {/* FlatList: Optimierte Liste zur Darstellung großer Datenmengen. */}
      <FlatList
        data={scannedSets} // Die Datenquelle für die Liste (alle gescannten Sets).
        keyExtractor={item => item.id} // Eine Funktion, die einen eindeutigen Schlüssel für jedes Element liefert (wichtig für die Performance).
        renderItem={renderSetItem} // Die Funktion, die jedes einzelne Element rendert.
        // Komponente, die angezeigt wird, wenn die `data`-Liste leer ist.
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="box-open" size={60} color="#B0B0B0" /> {/* Icon einer leeren Kiste. */}
            <Text style={styles.emptyText}>Noch keine Sets in deiner Sammlung.</Text> {/* Hinweis auf leere Sammlung. */}
            <Text style={styles.emptyTextSub}>Scanne dein erstes Set!</Text> {/* Aufruf zum Handeln. */}
          </View>
        }
        // Zusätzliche Stile für den Content-Container der FlatList.
        contentContainerStyle={[
          scannedSets.length === 0 ? styles.emptyListContent : {}, // Zentriert den "leere Liste"-Text, wenn keine Sets vorhanden sind.
          { paddingBottom: 100 } // Fügt einen festen unteren Abstand hinzu (Platz für FABs).
        ]}
        // Grundlegende Stile für die FlatList selbst.
        style={{ width: '100%', flex: 1, marginTop: 20 }}
      />

      {/* Button zum Anfordern der Kamera-Berechtigung, nur sichtbar, wenn diese noch nicht erteilt wurde. */}
      {!isPermissionGranted && (
        <Pressable
          style={({ pressed }) => [
            styles.permissionButton,
            pressed && { backgroundColor: '#008C00' }, // Grün beim Drücken.
          ]}
          onPress={requestPermission} // Fordert die Kamera-Berechtigung an.
        >
          <Text style={styles.permissionButtonText}>Kamera erlauben</Text>
        </Pressable>
      )}

      {/* Floating Action Button (FAB) zum Hinzufügen eines neuen Sets. */}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && { backgroundColor: '#004A8C' }, // Dunklerer Blauton beim Drücken.
          !isPermissionGranted && { backgroundColor: '#A0A0A0' }, // Grau und deaktiviert, wenn keine Kamera-Berechtigung.
        ]}
        // Navigiert zum 'addSet'-Screen. `replace` entfernt den aktuellen Screen aus dem Navigations-Stack.
        onPress={() => router.replace('./addSet')}
        // Deaktiviert den Button, wenn keine Kamera-Berechtigung vorliegt.
        disabled={!isPermissionGranted}
      >
        {/* Plus-Symbol als Text für den Button. */}
        <Text style={styles.addButtonText}>＋</Text>
      </Pressable>

      {/* Floating Action Button (FAB) für den Zugriff auf Statistiken. */}
      <Pressable
        style={({ pressed }) => [
          styles.statsButton,
          pressed && { backgroundColor: '#CC6600' }, // Dunklerer Orangeton beim Drücken.
        ]}
        onPress={() => router.push('/stats')} // Navigiert zum 'stats'-Screen.
      >
        <FontAwesome5 name="chart-bar" size={28} color="#FFF" /> {/* Icon für Statistiken. */}
      </Pressable>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  // Stil für den Hauptcontainer der gesamten Ansicht.
  container: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein.
    backgroundColor: '#FDFDFD', // Sehr heller, fast weißer Hintergrund.
    alignItems: 'center', // Zentriert die Kindelemente horizontal.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    paddingTop: 15, // Oberer Innenabstand.
  },
  // Stil für den Header-Bereich oben auf dem Screen.
  header: {
    width: '100%', // Nimmt die volle Breite ein.
    alignItems: 'center', // Zentriert den Inhalt des Headers (den Text).
    marginBottom: 10, // Abstand zum nachfolgenden Inhalt.
  },
  // Stil für den Haupttitel der Sammlung.
  mainText: {
    fontSize: 32, // Große Schriftgröße.
    fontWeight: '800', // Sehr fette Schrift.
    color: '#222222', // Dunkelgraue Textfarbe.
  },
  // Stil für den Container, der angezeigt wird, wenn die Sammlung leer ist.
  emptyContainer: {
    flex: 1, // Nimmt den verbleibenden Platz ein.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    padding: 20, // Innenabstand.
  },
  // Stil für den Haupttext, der angezeigt wird, wenn die Liste leer ist.
  emptyText: {
    fontSize: 18, // Schriftgröße.
    color: '#888', // Mittelgraue Textfarbe.
    marginTop: 20, // Abstand zum Icon darüber.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil für den Untertext, der die Benutzer zum Scannen auffordert.
  emptyTextSub: {
    fontSize: 16, // Etwas kleinere Schriftgröße.
    color: '#A0A0A0', // Hellgraue Textfarbe.
    marginTop: 5, // Kleiner Abstand zum Haupttext.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil, der auf den contentContainerStyle der FlatList angewendet wird, wenn die Liste leer ist, um den Text zu zentrieren.
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Stil für ein einzelnes Element in der Liste der Sets.
  setItem: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    padding: 16, // Innenabstand.
    marginVertical: 7, // Vertikaler Abstand zwischen den Listenelementen.
    borderRadius: 10, // Abgerundete Ecken.
    elevation: 4, // Schatteneffekt für Android.
    shadowColor: '#000', // Schattenfarbe für iOS.
    shadowOpacity: 0.1, // Deckkraft des Schattens.
    shadowOffset: { width: 0, height: 2 }, // Versatz des Schattens.
    shadowRadius: 4, // Radius des Schattens.
    width: '100%', // Nimmt die volle Breite des übergeordneten Containers ein.
  },
  // Stil für den Inhalt innerhalb eines Set-Listenelements (Platzhalter).
  setItemContent: {
    // Hier können zusätzliche Stile für den Inhalt (Name, Info) des Listenelements definiert werden.
  },
  // Stil für den Titel (Namen) eines LEGO-Sets in der Liste.
  setTitle: {
    fontSize: 19, // Schriftgröße.
    fontWeight: '700', // Fette Schrift.
    color: '#333333', // Dunkelgraue Textfarbe.
  },
  // Stil für die zusätzlichen Informationen (Set-Nummer, Thema) eines Sets.
  setInfo: {
    fontSize: 14, // Kleinere Schriftgröße.
    color: '#666666', // Mittelgraue Textfarbe.
    marginTop: 4, // Abstand zum Titel.
  },
  // Stil für den "Hinzufügen"-Button (Floating Action Button).
  addButton: {
    position: 'absolute', // Absolut positioniert.
    bottom: 30, // 30dp vom unteren Rand des Bildschirms.
    alignSelf: 'center', // Zentriert sich horizontal im übergeordneten Container.
    backgroundColor: '#0057A6', // Blauer Hintergrund.
    width: 64, // Feste Breite.
    height: 64, // Feste Höhe.
    borderRadius: 32, // Macht den Button kreisförmig.
    justifyContent: 'center', // Zentriert den Inhalt (das Plus-Symbol) vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    elevation: 6, // Stärkerer Schatteneffekt für Android.
    shadowColor: '#000', // Schattenfarbe für iOS.
    shadowOpacity: 0.35, // Höhere Deckkraft des Schattens.
    shadowOffset: { width: 0, height: 3 }, // Versatz des Schattens.
    shadowRadius: 5, // Radius des Schattens.
  },
  // Stil für den Text im "Hinzufügen"-Button (das Plus-Symbol).
  addButtonText: { 
    fontSize: 40, // Sehr große Schriftgröße für das Plus.
    color: '#fff', // Weiße Textfarbe.
    lineHeight: 40, // Angepasste Zeilenhöhe, um das Plus vertikal mittig zu positionieren.
  },
  // Stil für den "Kamera erlauben"-Button.
  permissionButton: {
    position: 'absolute', // Absolut positioniert.
    bottom: 30, // 30dp vom unteren Rand.
    left: 20, // 20dp vom linken Rand.
    backgroundColor: '#00A800', // Grüner Hintergrund.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    paddingVertical: 12, // Vertikaler Innenabstand.
    borderRadius: 25, // Stark abgerundete Ecken.
    elevation: 4, // Schatteneffekt für Android.
    shadowColor: '#000', // Schattenfarbe für iOS.
    shadowOpacity: 0.2, // Deckkraft des Schattens.
    shadowOffset: { width: 0, height: 1 }, // Versatz des Schattens.
    shadowRadius: 2, // Radius des Schattens.
  },
  // Stil für den Text im "Kamera erlauben"-Button.
  permissionButtonText: {
    color: '#fff', // Weiße Textfarbe.
    fontWeight: '700', // Fette Schrift.
    fontSize: 14, // Schriftgröße.
  },
  // Stil für den "Statistiken"-Button (Floating Action Button).
  statsButton: {
    position: 'absolute', // Absolut positioniert.
    bottom: 30, // 30dp vom unteren Rand.
    right: 20, // 20dp vom rechten Rand.
    backgroundColor: '#FF8800', // Oranger Hintergrund.
    width: 64, // Feste Breite.
    height: 64, // Feste Höhe.
    borderRadius: 32, // Macht den Button kreisförmig.
    justifyContent: 'center', // Zentriert den Inhalt vertikal.
    alignItems: 'center', // Zentriert den Inhalt horizontal.
    elevation: 6, // Stärkerer Schatteneffekt für Android.
    shadowColor: '#000', // Schattenfarbe für iOS.
    shadowOpacity: 0.35, // Höhere Deckkraft des Schattens.
    shadowOffset: { width: 0, height: 3 }, // Versatz des Schattens.
    shadowRadius: 5, // Radius des Schattens.
  },
});