import { getSavedSets } from "@/utils/storage"; // deine Funktion, um Sets aus Storage zu laden
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PieChart } from 'react-native-svg-charts';

interface LegoSet {
  id: string;
  name: string;
  setNumber: string;
  theme: string;
  imageURL?: string;
  pieces?: number;
  minifigs?: number;
}

export default function Stats() {
  const [sets, setSets] = useState<LegoSet[]>([]);
  const [totalSets, setTotalSets] = useState(0);
  const [totalPieces, setTotalPieces] = useState(0);
  const [totalMinifigs, setTotalMinifigs] = useState(0);
  const [themeDistribution, setThemeDistribution] = useState<{[theme: string]: number}>({});

  useEffect(() => {
    async function loadSets() {
      const savedSets = await getSavedSets(); // sollte ein Array von Sets zurückgeben
      setSets(savedSets);

      // Gesamtanzahl Sets
      setTotalSets(savedSets.length);

      // Teile und Figuren summieren
      const piecesSum = savedSets.reduce((sum, s) => sum + (s.pieces || 0), 0);
      const minifigsSum = savedSets.reduce((sum, s) => sum + (s.minifigs || 0), 0);
      setTotalPieces(piecesSum);
      setTotalMinifigs(minifigsSum);

      // Themen zählen
      const themeCount: {[key: string]: number} = {};
      savedSets.forEach(s => {
        const theme = s.theme || "Unbekannt";
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
      setThemeDistribution(themeCount);
    }

    loadSets();
  }, []);

  // Farben für das PieChart (kannst du anpassen)
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8A2BE2', '#00CED1'];

  // PieChart-Daten aus themeDistribution aufbauen
  const pieData = Object.entries(themeDistribution).map(([theme, count], index) => ({
    key: theme,
    value: count,
    svg: { fill: colors[index % colors.length] },
    arc: { outerRadius: '100%', cornerRadius: 5 },
    label: `${theme} (${((count / totalSets) * 100).toFixed(1)}%)`,
  }));

  // Textuelle Anzeige der Themenstatistiken (unten)
  function renderThemeStats() {
    return Object.entries(themeDistribution).map(([theme, count]) => {
      const percent = totalSets > 0 ? ((count / totalSets) * 100).toFixed(1) : "0";
      return (
        <View key={theme} style={styles.themeRow}>
          <Text style={styles.themeName}>{theme}</Text>
          <Text>{count} Sets ({percent}%)</Text>
        </View>
      );
    });
  }

  // Kleine Legende zum PieChart
  function renderLegend() {
    return pieData.map(item => (
      <View key={item.key} style={styles.legendItem}>
        <View style={[styles.legendColorBox, { backgroundColor: item.svg.fill }]} />
        <Text>{item.label}</Text>
      </View>
    ));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Statistik deiner LEGO-Sammlung</Text>

      <View style={styles.statRow}>
        <Text style={styles.label}>Gesamte Sets:</Text>
        <Text style={styles.value}>{totalSets}</Text>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.label}>Gesamte Minifiguren:</Text>
        <Text style={styles.value}>{totalMinifigs}</Text>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.label}>Gesamte Teile:</Text>
        <Text style={styles.value}>{totalPieces}</Text>
      </View>

      <Text style={[styles.title, { marginTop: 30 }]}>Verteilung nach Themen</Text>

      {/* Kreisdiagramm */}
      <View style={{ height: 200, marginBottom: 10 }}>
        <PieChart
          style={{ flex: 1 }}
          data={pieData}
          innerRadius={20}
          outerRadius={'95%'}
        />
      </View>

      {/* Legende unter dem Diagramm */}
      <View style={styles.legendContainer}>
        {renderLegend()}
      </View>

      {/* Optional: zusätzlich die Textliste */}
      {renderThemeStats()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    fontSize: 16,
    color: "#444",
  },
  value: {
    fontSize: 16,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  themeName: {
    fontWeight: "500",
  },
  legendContainer: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4,
  },
});
