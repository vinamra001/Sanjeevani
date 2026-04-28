import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';

const API_BASE_URL = 'http://192.168.0.106:8000/api/v1';

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';
// ─────────────────────────────────────────────────────────────────────────────

const DiseaseDetailsScreen = ({ route, navigation }) => {
  const { diseaseId, diseaseName } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/diseases/${diseaseId}/`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [diseaseId]);

  if (loading) return (
    <ActivityIndicator size="large" color={THEME_COLOR} style={{ flex: 1, backgroundColor: BACKGROUND }} />
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{data?.name}</Text>
        <Text style={styles.sanskrit}>{data?.sanskrit_name}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.text}>{data?.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Dietary Recommendations</Text>
          <Text style={styles.text}>{data?.diet_plan}</Text>
        </View>

        <TouchableOpacity
          style={styles.remedyButton}
          onPress={() => navigation.navigate('AyurvedicRemedies', {
            remedies: data.remedies,
            diseaseName: data.name
          })}
        >
          <Text style={styles.remedyButtonText}>🌿 View Herbal Remedies</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },   // was #FFF
  content:   { padding: 25 },
  title:     { fontSize: 26, fontWeight: 'bold', color: THEME_DARK },   // was #2E7D32 / 28
  sanskrit:  { fontSize: 16, color: TEXT_SECONDARY, fontStyle: 'italic', marginBottom: 20 },  // was #666 / 18
  section:   { marginBottom: 22 },
  label:     { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 5 },  // was #333 / 18
  text:      { fontSize: 15, color: TEXT_SECONDARY, lineHeight: 24 },   // was #555 / 16
  remedyButton: {
    backgroundColor: THEME_DARK,         // was #2E7D32
    padding: 18, borderRadius: 14,       // was 12
    alignItems: 'center', marginTop: 10,
    elevation: 5,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22, shadowRadius: 10,
  },
  remedyButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});

export default DiseaseDetailsScreen;
