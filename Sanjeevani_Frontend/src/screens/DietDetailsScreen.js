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

const DietDetailsScreen = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Nutrition Science</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.introSection}>
          <Text style={styles.mainTitle}>Balanced Ayurvedic Diet</Text>
          <Text style={styles.subtitle}>The Science of Six Tastes (Rasas)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is a Balanced Diet?</Text>
          <Text style={styles.description}>
            In Ayurveda, balance isn't just about macronutrients or calories. It's about
            including all **six tastes** in your meals to ensure your body, mind,
            and soul are satisfied. Each taste has a specific effect on your Doshas.
          </Text>
        </View>

        <View style={styles.tasteSection}>
          <Text style={styles.sectionTitle}>The Six Tastes (Rasas)</Text>

          <TasteItem emoji="🍯" title="Sweet (Madhura)"     desc="Grains, Fruits, Milk. Increases Kapha, Decreases Vata/Pitta. Elements: Earth & Water." />
          <TasteItem emoji="🍋" title="Sour (Amla)"         desc="Citrus, Fermented foods. Increases Pitta, Decreases Vata. Elements: Earth & Fire." />
          <TasteItem emoji="🧂" title="Salty (Lavana)"      desc="Sea Salt, Kelp. Increases Pitta, Decreases Vata. Elements: Water & Fire." />
          <TasteItem emoji="🌶️" title="Pungent (Katu)"      desc="Ginger, Peppers, Garlic. Increases Pitta/Vata, Decreases Kapha. Elements: Fire & Air." />
          <TasteItem emoji="🥬" title="Bitter (Tikta)"      desc="Leafy Greens, Turmeric. Increases Vata, Decreases Pitta/Kapha. Elements: Air & Space." />
          <TasteItem emoji="🍐" title="Astringent (Kashaya)" desc="Beans, Broccoli, Pomegranate. Increases Vata, Decreases Pitta/Kapha. Elements: Air & Earth." />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: Start your meal with Sweet tastes (digests slowest) and end with Astringent tastes (cleanses the palate and reduces cravings).
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fullBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.fullBackButtonText}>Return to Diet Plan</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const TasteItem = ({ emoji, title, desc }) => (
  <View style={styles.tasteItem}>
    <View style={styles.tasteHeader}>
      <Text style={styles.tasteEmoji}>{emoji}</Text>
      <Text style={styles.tasteTitle}>{title}</Text>
    </View>
    <Text style={styles.tasteDesc}>{desc}</Text>
  </View>
);

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

  // ── Card
  card: {
    backgroundColor: '#FFF',
    padding: 20, borderRadius: 18,        // was 20
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8,
    marginBottom: 22,
    borderWidth: 1, borderColor: '#EBEBEB',  // was #F0F0F0
  },
  cardTitle:   { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 10 },  // was #333 / 18
  description: { lineHeight: 22, color: TEXT_SECONDARY, fontSize: 14 },  // was #555 / 15

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME_DARK, marginBottom: 14 },  // was THEME_COLOR / 20

  // ── Taste Items
  tasteItem: {
    backgroundColor: '#FFF',
    padding: 16, borderRadius: 16,        // was 18
    marginBottom: 10,                     // was 12
    borderWidth: 1, borderColor: THEME_SURFACE,  // was #E8F5E9
    elevation: 2,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  tasteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  tasteEmoji:  { fontSize: 20, marginRight: 10 },
  tasteTitle:  { fontSize: 15, fontWeight: 'bold', color: THEME_DARK },  // was #1B5E20 / 16
  tasteDesc:   { fontSize: 13, color: TEXT_SECONDARY, lineHeight: 20 },  // was #666 / 14

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

export default DietDetailsScreen;
