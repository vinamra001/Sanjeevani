import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform
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

const MindfulLivingScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>Mindful Living</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>Sattva & Awareness</Text>
          <Text style={styles.subtitle}>Cultivating mental balance through Ayurveda</Text>
        </View>

        {/* ── Meditation ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>🧘</Text>
            <View>
              <Text style={styles.cardTitle}>Dhyana (Meditation)</Text>
              <Text style={styles.doshaImpact}>Balances: Vata & Pitta</Text>
            </View>
          </View>
          <Text style={styles.cardText}>
            Practice stillness for 15 minutes daily. Focus on your breath to stabilize
            the 'Prana' (life force) and reduce the mental fluctuations of 'Rajas'.
          </Text>
        </View>

        {/* ── Pranayama ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>🌬️</Text>
            <View>
              <Text style={styles.cardTitle}>Pranayama (Breathing)</Text>
              <Text style={styles.doshaImpact}>Balances: All Three Doshas</Text>
            </View>
          </View>
          <Text style={styles.cardText}>
            Try 'Anulom Vilom' (Alternate Nostril Breathing) to clear energy channels
            (Nadis). This practice cools the body and centers the mind.
          </Text>
        </View>

        {/* ── Sleep ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>🌙</Text>
            <View>
              <Text style={styles.cardTitle}>Nidra (Restorative Sleep)</Text>
              <Text style={styles.doshaImpact}>Balances: Vata & Kapha</Text>
            </View>
          </View>
          <Text style={styles.cardText}>
            Ensure 7-8 hours of sleep starting before 10 PM (Kapha time).
            Avoid digital screens 1 hour before bed to prevent Vata aggravation.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 In Ayurveda, 'Sattva' is the quality of clarity and peace. Mindful living
            is the practice of increasing Sattva in daily life through pure diet and calm thoughts.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fullBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.fullBackButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },

  // ── Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 15,
    backgroundColor: THEME_DARK,          // was flat THEME_COLOR
    elevation: 8,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28, shadowRadius: 8,
  },
  backButton:  { padding: 5 },
  backArrow:   { color: '#FFF', fontSize: 26, fontWeight: 'bold' },  // was 30
  headerTitle: { color: '#FFF', fontSize: 19, fontWeight: 'bold' },  // was 20

  scrollContent: { padding: 20 },
  introSection:  { marginBottom: 22 },
  mainTitle:     { fontSize: 24, fontWeight: 'bold', color: THEME_DARK },  // was #1B5E20 / 26
  subtitle:      { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 },    // was #666 / 16

  // ── Cards
  card: {
    backgroundColor: '#FFF',
    padding: 20, borderRadius: 18,        // was 20
    marginBottom: 18,                     // was 20
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
    borderWidth: 1, borderColor: '#EBEBEB',  // was #F0F0F0
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji:       { fontSize: 32, marginRight: 14 },                     // was 35 / 15
  cardTitle:   { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY },  // was #333 / 18
  doshaImpact: { fontSize: 11, color: THEME_LIGHT, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },  // was THEME_COLOR / 12
  cardText:    { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 22 },     // was #555

  // ── Info Box
  infoBox: {
    backgroundColor: THEME_SURFACE,       // was #E8F5E9
    padding: 18, borderRadius: 14,        // was 15
    marginBottom: 28,
    borderLeftWidth: 6, borderLeftColor: THEME_COLOR,
  },
  infoText: { color: THEME_DARK, fontSize: 13, fontWeight: '600', fontStyle: 'italic', lineHeight: 20 },  // was #1B5E20 / 14

  // ── Back Button
  fullBackButton: {
    backgroundColor: THEME_COLOR,
    padding: 17, borderRadius: 14,        // was 18 / 15
    alignItems: 'center', elevation: 5,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22, shadowRadius: 10,
  },
  fullBackButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});

export default MindfulLivingScreen;
