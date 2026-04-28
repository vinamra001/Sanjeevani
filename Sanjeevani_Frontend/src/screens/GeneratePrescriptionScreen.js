import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Refined Green Palette (matches HomeScreen) ───────────────────────────────
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';
// ─────────────────────────────────────────────────────────────────────────────

const GeneratePrescriptionScreen = ({ navigation, route }) => {
  const [notes, setNotes] = useState('');

  const {
    condition = 'General Wellness',
    ayurvedicName = 'Swasthavritta',
    date = new Date().toLocaleDateString()
  } = route.params || {};

  const checklistItems = [
    "Classical Ayurvedic Herbology",
    "Home Remedies & Lifestyle Modifiers",
    "Prakriti-based Diet Plan",
    "Pathya (Beneficial) Foods",
    "Apathya (Foods to Avoid)",
    "Mental Wellness & Sattva Tips"
  ];

  const handleGenerate = () => {
    Alert.alert(
      "Success",
      "Digital Prescription has been generated and saved to your health profile.",
      [{ text: "View Profile", onPress: () => navigation.navigate('Profile') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Prescription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Summary Card ── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.bannerIcon}>📋</Text>
            <Text style={styles.bannerTitle}>Diagnostic Summary</Text>
          </View>
          <View style={styles.dividerLight} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Condition:</Text>
            <Text style={styles.summaryValue}>{condition}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sanskrit ID:</Text>
            <Text style={styles.summaryValue}>{ayurvedicName}</Text>
          </View>
        </View>

        {/* ── Components Section ── */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Prescription Components</Text>
          <Text style={styles.sectionSubtitle}>
            Your final E-PDF will include the following personalized modules:
          </Text>

          <View style={styles.checklistCard}>
            {checklistItems.map((item, index) => (
              <View key={index} style={styles.checkItemRow}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkTick}>✓</Text>
                </View>
                <Text style={styles.checkItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Notes Section ── */}
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Vaidya/User Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add specific observations, e.g., 'Feeling better after 2 days' or 'Note about pulse'."
            placeholderTextColor={TEXT_SECONDARY}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom Action Button ── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generate Health Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,              // was 15
    height: 70,
    backgroundColor: THEME_DARK,       // was flat THEME_COLOR
    elevation: 6,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8,
  },
  backButton: { padding: 5 },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },  // was 28
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  scrollContent: { padding: 20 },      // was 15

  // ── Summary Card
  summaryCard: {
    backgroundColor: THEME_DARK,       // was flat THEME_COLOR
    borderRadius: 20,                  // was 20 — kept
    padding: 20, elevation: 8,
    marginBottom: 22,                  // was 25
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 14,
  },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bannerIcon:   { fontSize: 22, marginRight: 10 },
  bannerTitle:  { fontSize: 17, fontWeight: 'bold', color: '#FFF' },  // was 18
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 14 },
  summaryRow:   { flexDirection: 'row', marginBottom: 10 },
  summaryLabel: { color: '#C8E6C9', fontSize: 13, width: 110 },       // was #E8F5E9 / 14
  summaryValue: { color: '#FFF', fontSize: 13, fontWeight: 'bold', flex: 1 },

  // ── Details Section
  detailsSection: { paddingHorizontal: 4 },
  sectionTitle:   { fontSize: 18, fontWeight: 'bold', color: TEXT_PRIMARY },  // was 20 / #333
  sectionSubtitle:{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 4, marginBottom: 16 },  // was #666 / 18

  checklistCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,                  // was 18
    padding: 15,
    borderWidth: 1, borderColor: '#EBEBEB',  // was #EEE
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
  },
  checkItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: THEME_SURFACE,   // was #E8F5E9
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
    borderWidth: 1, borderColor: THEME_COLOR,
  },
  checkTick:     { color: THEME_COLOR, fontWeight: 'bold', fontSize: 13 },
  checkItemText: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '500' },  // was #444 / 14

  // ── Notes Section
  notesSection: { paddingHorizontal: 4, marginTop: 22 },  // was 25
  notesTitle:   { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 10 },  // was 16 / #333
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 14,                  // was 15
    padding: 15, height: 110,
    textAlignVertical: 'top',
    borderWidth: 1, borderColor: '#EBEBEB',  // was #DDD
    color: TEXT_PRIMARY,               // was #333
    elevation: 2,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5,
  },

  // ── Bottom Button
  bottomContainer: {
    position: 'absolute', bottom: 0,
    width: width, padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#EBEBEB',  // was #EEE
  },
  generateButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 17,               // was 18
    borderRadius: 14,                  // was 15
    alignItems: 'center',
    elevation: 5,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 10,
  },
  generateButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});

export default GeneratePrescriptionScreen;
