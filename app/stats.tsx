import { getSavedSets } from "@/utils/storage"; // Importiert die Funktion `getSavedSets`, um lokal gespeicherte LEGO-Sets abzurufen.
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons'; // Importiert Icon-Sets von FontAwesome5 und MaterialIcons für die UI.
import { router } from 'expo-router'; // Importiert den Router von Expo Router für die Navigation.
import { StatusBar } from 'expo-status-bar'; // Importiert `StatusBar` zur Steuerung der Statusleiste.
import { useEffect, useState } from "react"; // Importiert React Hooks für Seiten-Effekte und Zustandsverwaltung.
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native"; // Importiert grundlegende React Native UI-Komponenten und `Dimensions` zur Bildschirmgrößenermittlung.
import { PieChart } from 'react-native-chart-kit'; // Importiert `PieChart` aus der Bibliothek `react-native-chart-kit` für Kreisdiagramme.

// Definition der Schnittstelle für ein LEGO-Set, um die Typsicherheit zu gewährleisten.
interface LegoSet {
  id: string; // Eindeutige ID des Sets.
  name: string; // Name des Sets.
  setNumber: string; // Setnummer (oft identisch mit der ID).
  theme: string; // Thema des Sets (z.B. "City", "Star Wars").
  imageURL?: string; // Optionale URL zum Bild des Sets.
  pieces?: number; // Optionale Anzahl der Teile.
  minifigs?: number; // Optionale Anzahl der Minifiguren.
}

/**
 * Die `Stats`-Komponente zeigt verschiedene Statistiken zur LEGO-Sammlung des Benutzers an,
 * wie die Gesamtzahl der Sets, Teile und Minifiguren sowie die Verteilung nach Themen in einem Kreisdiagramm.
 */
export default function Stats() {
  // Zustandsvariablen zur Speicherung der geladenen Sets und berechneten Statistiken.
  const [sets, setSets] = useState<LegoSet[]>([]); // Array der geladenen LEGO-Sets.
  const [totalSets, setTotalSets] = useState(0); // Gesamtzahl der Sets in der Sammlung.
  const [totalPieces, setTotalPieces] = useState(0); // Gesamtanzahl der Teile über alle Sets hinweg.
  const [totalMinifigs, setTotalMinifigs] = useState(0); // Gesamtanzahl der Minifiguren über alle Sets hinweg.
  const [themeDistribution, setThemeDistribution] = useState<{[theme: string]: number}>({}); // Objekt zur Speicherung der Anzahl der Sets pro Thema.

  /**
   * `useEffect`-Hook zum Laden der Sets und Berechnen der Statistiken,
   * sobald die Komponente gemountet wird. Das leere Abhängigkeits-Array `[]` sorgt dafür,
   * dass dieser Effekt nur einmal beim Initial-Rendering ausgeführt wird.
   */
  useEffect(() => {
    /**
     * Asynchrone Funktion zum Laden der gespeicherten Sets und zur Berechnung der Statistiken.
     */
    async function loadSets() {
      const savedSets = await getSavedSets(); // Alle gespeicherten Sets abrufen.
      setSets(savedSets); // Die abgerufenen Sets im Zustand speichern.

      setTotalSets(savedSets.length); // Gesamtzahl der Sets ist die Länge des Arrays.

      // Summiert die Anzahl der Teile aller Sets. Wenn ein Set keine `pieces`-Angabe hat, wird 0 verwendet.
      const piecesSum = savedSets.reduce((sum, s) => sum + (s.pieces || 0), 0);
      // Summiert die Anzahl der Minifiguren aller Sets. Wenn ein Set keine `minifigs`-Angabe hat, wird 0 verwendet.
      const minifigsSum = savedSets.reduce((sum, s) => sum + (s.minifigs || 0), 0);
      setTotalPieces(piecesSum); // Gesamtzahl der Teile speichern.
      setTotalMinifigs(minifigsSum); // Gesamtzahl der Minifiguren speichern.

      // Objekt zum Zählen der Sets pro Thema initialisieren.
      const themeCount: {[key: string]: number} = {};
      savedSets.forEach(s => {
        // Sicherstellen, dass ein Thema immer existiert; falls es in den Daten fehlt, "Unbekannt" verwenden.
        const theme = s.theme || "Unbekannt";
        themeCount[theme] = (themeCount[theme] || 0) + 1; // Zähler für das jeweilige Thema erhöhen.
      });
      setThemeDistribution(themeCount); // Die Themenverteilung im Zustand speichern.
    }

    loadSets(); // Die Ladefunktion aufrufen.
  }, []); // Leeres Abhängigkeits-Array, damit der Effekt nur einmal beim Laden der Komponente läuft.

  // Eine Liste von LEGO-ähnlichen Farben, die für das Kreisdiagramm verwendet werden.
  const legoChartColors = [
    '#DD1C1A', '#005C9D', '#FFD700', '#009E00', '#FF8800', '#60B731',
    '#8A2BE2', '#00CED1', '#9966FF', '#FF6384', '#A0522D', '#4682B4',
    '#DEB887', '#5F9EA0', '#D2691E', '#FF7F50', '#6495ED', '#DC143C',
  ];

  // Bereitet die Daten für das `PieChart` vor. Jedes Thema wird in ein Objekt mit `name`, `population` (Anzahl der Sets) und `color` umgewandelt.
  const pieData = Object.entries(themeDistribution).map(([theme, count], index) => ({
    name: theme, // Name des Themas.
    population: count, // Anzahl der Sets für dieses Thema.
    color: legoChartColors[index % legoChartColors.length], // Weist zyklisch eine Farbe aus der Liste zu.
    legendFontColor: '#7F7F7F', // Farbe des Textes in der Legende des Charts.
    legendFontSize: 15, // Schriftgröße des Textes in der Legende.
  }));

  // Konfigurationseinstellungen für `react-native-chart-kit`.
  const chartConfig = {
    backgroundColor: '#ffffff', // Hintergrundfarbe des Charts (innerhalb des Charts).
    backgroundGradientFrom: '#ffffff', // Startfarbe des Hintergrundverlaufs.
    backgroundGradientTo: '#ffffff', // Endfarbe des Hintergrundverlaufs.
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Funktion zur Farbberechnung für Elemente (z.B. Labels).
    decimalPlaces: 0, // Keine Dezimalstellen für die Werte im Chart.
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Explizite Farbe für die Labeltexte im Chart.
  };

  /**
   * Funktion zum Rendern der Legende für das Kreisdiagramm.
   * Erzeugt für jedes Thema einen Eintrag mit Farbfeld, Namen und prozentualem Anteil.
   */
  function renderLegend() {
    return pieData.map(item => (
      <View key={item.name} style={styles.legendItem}>
        <View style={[styles.legendColorBox, { backgroundColor: item.color }]} /> {/* Farbfeld der Legende. */}
        <Text style={styles.legendText}>
          {item.name} ({((item.population / totalSets) * 100).toFixed(1)}%) {/* Thema, Anzahl und Prozent. */}
        </Text>
      </View>
    ));
  }

  /**
   * Funktion zum Rendern der detaillierten Themenstatistiken als Liste.
   * Sortiert die Themen nach der Anzahl der Sets (absteigend).
   */
  function renderThemeStats() {
    return Object.entries(themeDistribution)
      .sort(([, countA], [, countB]) => countB - countA) // Sortiert absteigend nach der Anzahl der Sets.
      .map(([theme, count]) => {
        const percent = totalSets > 0 ? ((count / totalSets) * 100).toFixed(1) : "0"; // Berechnet den prozentualen Anteil.
        // Die Farbe muss konsistent über den Index bezogen werden, um mit dem Kreisdiagramm übereinzustimmen.
        const colorIndex = Object.keys(themeDistribution).indexOf(theme);
        return (
          <View key={theme} style={styles.themeRow}>
            {/* Kleiner Farbindikator passend zur Chart-Farbe. */}
            <View style={[styles.themeColorIndicator, { backgroundColor: legoChartColors[colorIndex % legoChartColors.length] }]} />
            <Text style={styles.themeName}>{theme}</Text> {/* Name des Themas. */}
            <Text style={styles.themeCount}>{count} Sets ({percent}%)</Text> {/* Anzahl der Sets und Prozent. */}
          </View>
        );
      });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" /> {/* Setzt den Stil der Statusleiste auf dunkel. */}
      {/* Header Bereich der Seite */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#222222" /> {/* Zurück-Button. */}
        </Pressable>
        <Text style={styles.mainTitle}>Deine Statistik</Text> {/* Haupttitel. */}
        <View style={styles.backButtonPlaceholder} /> {/* Platzhalter für die Zentrierung des Titels. */}
      </View>

      {/* Haupt-Inhaltsbereich, der scrollbar ist */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Sammlungs-Übersicht</Text> {/* Titel für den Übersichts-Abschnitt. */}
        <View style={styles.statsGrid}>
          {/* Karte für die Gesamtzahl der Sets */}
          <View style={styles.statCard}>
            <FontAwesome5 name="cubes" size={30} color="#0057A6" /> {/* Icon für Sets. */}
            <Text style={styles.statLabel}>Gesamte Sets</Text>
            <Text style={styles.statValue}>{totalSets}</Text>
          </View>

          {/* Karte für die Gesamtzahl der Teile */}
          <View style={styles.statCard}>
            <FontAwesome5 name="puzzle-piece" size={30} color="#DD1C1A" /> {/* Icon für Teile. */}
            <Text style={styles.statLabel}>Gesamte Teile</Text>
            <Text style={styles.statValue}>{totalPieces}</Text>
          </View>

          {/* Karte für die Gesamtzahl der Minifiguren */}
          <View style={styles.statCard}>
            <FontAwesome5 name="user-ninja" size={30} color="#009E00" /> {/* Icon für Minifiguren. */}
            <Text style={styles.statLabel}>Gesamte Minifiguren</Text>
            <Text style={styles.statValue}>{totalMinifigs}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Verteilung nach Themen</Text> {/* Titel für Themenverteilung. */}

        {/* Bedingtes Rendern: Wenn keine Sets vorhanden sind, wird ein Platzhalter angezeigt. */}
        {totalSets === 0 ? (
          <View style={styles.emptyChartContainer}>
            <FontAwesome5 name="chart-pie" size={60} color="#B0B0B0" /> {/* Platzhalter-Icon. */}
            <Text style={styles.emptyChartText}>Füge Sets hinzu, um Statistiken zu sehen!</Text> {/* Aufforderungstext. */}
          </View>
        ) : (
          // Wenn Sets vorhanden sind, werden das Kreisdiagramm und die detaillierten Statistiken angezeigt.
          <>
            <View style={styles.chartAndLegendContainer}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieData} // Die für das Diagramm vorbereiteten Daten.
                  width={Dimensions.get('window').width - 40 - 20} // Berechnet die Breite basierend auf der Bildschirmbreite und den Paddings/Margins.
                  height={200} // Feste Höhe des Kreisdiagramms.
                  chartConfig={chartConfig} // Die Chart-Konfiguration.
                  accessor={"population"} // Der Schlüssel im Datenobjekt, der den Wert für die Sektorgröße angibt.
                  backgroundColor={"transparent"} // Hintergrund des Charts selbst.
                  paddingLeft={"15"} // Innenabstand links für die Beschriftung.
                  center={[0, 0]} // Zentrierung des Diagramms im Container.
                />
              </View>
              <View style={styles.legendContainer}>
                {renderLegend()} {/* Rendert die Legende zum Kreisdiagramm. */}
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 20 }]}>Detaillierte Themenübersicht</Text> {/* Untertitel. */}
            <View style={styles.themeListContainer}>
              {renderThemeStats()} {/* Rendert die Liste der Themenstatistiken. */}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  // Hauptcontainer-Stil, der den gesamten Bildschirm und die Hintergrundfarbe sicherstellt.
  safeArea: {
    flex: 1, // Nimmt den gesamten verfügbaren Platz ein.
    backgroundColor: '#FDFDFD', // Helle Hintergrundfarbe.
  },
  // Stil der Kopfzeile.
  header: {
    flexDirection: 'row', // Ordnet die Kinder horizontal an.
    alignItems: 'center', // Vertikale Ausrichtung der Elemente in der Mitte.
    justifyContent: 'space-between', // Verteilt den Raum gleichmäßig zwischen den Elementen.
    paddingHorizontal: 20, // Horizontaler Innenabstand.
    paddingVertical: 15, // Vertikaler Innenabstand.
    backgroundColor: '#FDFDFD', // Hintergrundfarbe der Kopfzeile.
    borderBottomWidth: 1, // Unterer Rand zur Trennung.
    borderBottomColor: '#EEEEEE', // Farbe des unteren Rands.
  },
  // Stil für den Berührungsbereich des Zurück-Buttons.
  backButton: {
    padding: 5, // Fügt Polsterung um das Symbol herum hinzu, um das Tippen zu erleichtern.
  },
  // Platzhalteransicht, um sicherzustellen, dass der Haupttitel zentriert bleibt.
  backButtonPlaceholder: {
    width: 28, // Gleiche Breite wie der Zurück-Button für die Zentrierung des Titels.
  },
  // Stil für den Haupttiteltext in der Kopfzeile.
  mainTitle: {
    fontSize: 28, // Große Schriftgröße.
    fontWeight: '800', // Extra fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
  },
  // Stil für den scrollbaren Inhaltscontainer.
  container: {
    padding: 20, // Innenabstand ringsum.
    paddingBottom: 40, // Zusätzlicher Innenabstand unten für besseres Scrollen.
  },
  // Stil für die Titel der Abschnitte (z.B. "Sammlungs-Übersicht").
  sectionTitle: {
    fontSize: 24, // Schriftgröße.
    fontWeight: '700', // Fette Schriftstärke.
    color: '#333333', // Dunkelgraue Textfarbe.
    marginBottom: 20, // Abstand nach unten.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil für Untertitel der Abschnitte (z.B. "Detaillierte Themenübersicht").
  sectionSubtitle: {
    fontSize: 18, // Schriftgröße.
    fontWeight: '600', // Halbfette Schriftstärke.
    color: '#444444', // Mittelgraue Textfarbe.
    marginBottom: 15, // Abstand nach unten.
  },
  // Stil für das Raster der Statistik-Karten.
  statsGrid: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    flexWrap: 'wrap', // Erlaubt den Umbruch in die nächste Zeile, wenn der Platz nicht ausreicht.
    justifyContent: 'space-around', // Verteilt den Raum gleichmäßig zwischen den Elementen.
    marginBottom: 30, // Abstand nach unten.
  },
  // Stil für eine einzelne Statistik-Karte.
  statCard: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 15, // Innerer Innenabstand.
    alignItems: 'center', // Inhalt horizontal zentrieren.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
    width: '48%', // Nimmt fast die Hälfte der Breite ein, um zwei Karten pro Reihe zu ermöglichen.
    marginBottom: 15, // Abstand nach unten zu anderen Karten.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    minHeight: 120, // Minimale Höhe, um alle Karten gleich groß zu halten.
  },
  // Stil für die Beschriftung einer Statistik-Karte.
  statLabel: {
    fontSize: 14, // Schriftgröße.
    color: '#666666', // Graue Textfarbe.
    marginTop: 10, // Abstand nach oben.
    textAlign: 'center', // Text zentrieren.
  },
  // Stil für den Wert einer Statistik-Karte (z.B. die Anzahl).
  statValue: {
    fontSize: 28, // Große Schriftgröße.
    fontWeight: '800', // Extra fette Schriftstärke.
    color: '#222222', // Dunkle Textfarbe.
    marginTop: 5, // Abstand nach oben.
  },
  // Container für das Kreisdiagramm und die Legende nebeneinander.
  chartAndLegendContainer: {
    flexDirection: 'row', // Elemente horizontal anordnen.
    justifyContent: 'space-between', // Platz zwischen den Elementen verteilen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    marginBottom: 21, // Abstand nach unten.
    flexWrap: 'wrap', // Erlaubt den Umbruch auf kleineren Bildschirmen.
  },
  // Container für das Kreisdiagramm.
  pieChartContainer: {
    height: 200, // Feste Höhe.
    width: '55%', // Nimmt 55% der verfügbaren Breite ein.
    marginRight: 10, // Abstand zum Legenden-Container.
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    padding: 11, // Innenabstand für das Diagramm selbst.
  },
  // Container für die Legende des Kreisdiagramms.
  legendContainer: {
    flex: 1, // Nimmt den restlichen Platz in der Reihe ein.
    marginLeft: 10, // Abstand zum Kreisdiagramm-Container.
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 15, // Innerer Innenabstand.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
    minHeight: 200, // Minimale Höhe, passend zum Kreisdiagramm.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
  },
  // Stil für einen einzelnen Eintrag in der Legende.
  legendItem: {
    flexDirection: "row", // Elemente horizontal anordnen.
    alignItems: "center", // Elemente vertikal zentrieren.
    marginBottom: 8, // Abstand nach unten zu anderen Legendeneinträgen.
  },
  // Stil für das Farbfeld in der Legende.
  legendColorBox: {
    width: 18, // Breite.
    height: 18, // Höhe.
    marginRight: 10, // Abstand zum Text.
    borderRadius: 4, // Abgerundete Ecken.
  },
  // Stil für den Text in der Legende.
  legendText: {
    fontSize: 14, // Schriftgröße.
    color: '#333333', // Dunkelgraue Textfarbe.
    flexShrink: 1, // Ermöglicht das Schrumpfen des Textes bei langen Namen.
  },
  // Container für die detaillierte Liste der Themenstatistiken.
  themeListContainer: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 15, // Innerer Innenabstand.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
  },
  // Stil für eine einzelne Zeile in der Themenliste.
  themeRow: {
    flexDirection: "row", // Elemente horizontal anordnen.
    justifyContent: "space-between", // Platz zwischen den Elementen verteilen.
    alignItems: 'center', // Elemente vertikal zentrieren.
    marginBottom: 10, // Abstand nach unten.
    paddingVertical: 5, // Vertikaler Innenabstand.
    borderBottomWidth: 1, // Unterer Rand zur Trennung der Zeilen.
    borderBottomColor: '#F0F0F0', // Farbe des unteren Rands.
  },
  // Stil für den Farbindikator in der Themenliste.
  themeColorIndicator: {
    width: 12, // Breite.
    height: 12, // Höhe.
    borderRadius: 6, // Rund (Kreis).
    marginRight: 10, // Abstand zum Themennamen.
  },
  // Stil für den Namen des Themas in der Liste.
  themeName: {
    fontWeight: "600", // Halbfette Schriftstärke.
    fontSize: 15, // Schriftgröße.
    color: "#333333", // Dunkelgraue Textfarbe.
    flex: 1, // Nimmt den Großteil des verfügbaren Platzes ein.
  },
  // Stil für die Anzahl der Sets und den Prozentsatz in der Themenliste.
  themeCount: {
    fontSize: 15, // Schriftgröße.
    color: "#555555", // Mittelgraue Textfarbe.
  },
  // Container, der angezeigt wird, wenn keine Sets für Statistiken vorhanden sind.
  emptyChartContainer: {
    backgroundColor: '#FFFFFF', // Weißer Hintergrund.
    borderRadius: 12, // Abgerundete Ecken.
    padding: 30, // Innerer Innenabstand.
    alignItems: 'center', // Inhalt horizontal zentrieren.
    justifyContent: 'center', // Inhalt vertikal zentrieren.
    minHeight: 250, // Minimale Höhe.
    elevation: 4, // Schatten für Android.
    shadowColor: '#000', // Schatten für iOS.
    shadowOpacity: 0.1, // Schatten-Deckkraft.
    shadowOffset: { width: 0, height: 2 }, // Schattenversatz.
    shadowRadius: 4, // Schattenunschärferadius.
  },
  // Stil für den Text im leeren Chart-Container.
  emptyChartText: {
    fontSize: 18, // Schriftgröße.
    color: '#888', // Graue Textfarbe.
    marginTop: 20, // Abstand nach oben.
    textAlign: 'center', // Text zentrieren.
  },
});