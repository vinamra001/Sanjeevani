import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from "../components/BottomNavBar";
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get("window");

const THEME_COLOR = "#2D7D46";
const THEME_DARK = "#1E5C33";
const THEME_LIGHT = "#4CAF72";
const THEME_SURFACE = "#EAF4EC";
const BACKGROUND = "#F7FAF8";
const TEXT_PRIMARY = "#141F17";
const TEXT_SECONDARY = "#5A6E60";

// ─── Dosha Descriptions (shown after result) ──────────────────────────────────
const DOSHA_INFO = {
  Vata: {
    emoji: "🌬️",
    color: "#7B68EE",
    bg: "#F0EEFF",
    title: "Vata Prakriti",
    traits: "Creative • Energetic • Quick-thinking",
    description:
      "Vata governs movement and communication. You are naturally creative and enthusiastic, but may experience anxiety and irregular digestion when out of balance.",
    tips: [
      "Eat warm, moist, and grounding foods",
      "Follow a regular daily routine",
      "Avoid cold, dry, and raw foods",
      "Practice calming yoga and meditation",
      "Use sesame oil for self-massage",
    ],
  },
  Pitta: {
    emoji: "🔥",
    color: "#FF6B35",
    bg: "#FFF3EE",
    title: "Pitta Prakriti",
    traits: "Intelligent • Focused • Leadership",
    description:
      "Pitta governs transformation and metabolism. You are driven and focused, but may experience anger and inflammation when out of balance.",
    tips: [
      "Eat cooling and refreshing foods",
      "Avoid spicy, oily, and sour foods",
      "Practice cooling pranayama (Sheetali)",
      "Spend time in nature near water",
      "Use coconut oil for self-massage",
    ],
  },
  Kapha: {
    emoji: "🌊",
    color: "#2D7D46",
    bg: "#EAF4EC",
    title: "Kapha Prakriti",
    traits: "Calm • Caring • Stable",
    description:
      "Kapha governs structure and lubrication. You are naturally calm and nurturing, but may experience lethargy and weight gain when out of balance.",
    tips: [
      "Eat light, warm, and spicy foods",
      "Exercise vigorously every day",
      "Avoid heavy, oily, and sweet foods",
      "Wake up early (before 6 AM)",
      "Use dry brushing before shower",
    ],
  },
  "Vata-Pitta": {
    emoji: "🌬️🔥",
    color: "#D95C3C",
    bg: "#FFF3EE",
    title: "Vata-Pitta Prakriti",
    traits: "Creative • Driven • Variable",
    description: "A blend of Vata's creativity and Pitta's intensity. You have a quick mind and good metabolism, but can easily exhaust yourself and burn out if you skip meals or overwork.",
    tips: [
      "Follow a regular routine to calm Vata",
      "Favor cooling and sweet foods for Pitta",
      "Rest adequately and avoid over-scheduling",
      "Practice moderate cooling exercises",
    ],
  },
  "Pitta-Kapha": {
    emoji: "🔥🌊",
    color: "#D95C3C",
    bg: "#FFF3EE",
    title: "Pitta-Kapha Prakriti",
    traits: "Focused • Stable • Enduring",
    description: "Combines Pitta's sharp focus with Kapha's strong stamina. You have excellent health and steady digestion, but might suffer from stagnation or anger if not active.",
    tips: [
      "Avoid excess sweets and oily foods",
      "Stay active with daily exercise",
      "Eat cooling and light foods",
      "Challenge yourself mentally and physically",
    ],
  },
  "Vata-Kapha": {
    emoji: "🌬️🌊",
    color: "#7B68EE",
    bg: "#F0EEFF",
    title: "Vata-Kapha Prakriti",
    traits: "Imaginative • Relaxed • Adaptable",
    description: "A unique mix of Vata's airy nature and Kapha's earthy stability. You are creative but grounded. You may feel cold easily and suffer from irregular digestion.",
    tips: [
      "Eat warm, easily digestible, and spiced foods",
      "Engage in stimulating, warming exercises",
      "Avoid cold drinks and heavy dairy",
      "Keep a predictable daily schedule",
    ],
  },
};

const questions = [
  {
    id: 1,
    q: "Physical Build",
    options: [
      { l: "Thin/Bony — hard to gain weight", v: "Vata" },
      { l: "Medium/Athletic — moderate weight", v: "Pitta" },
      { l: "Solid/Large — easy to gain weight", v: "Kapha" },
    ],
  },
  {
    id: 2,
    q: "Skin Texture",
    options: [
      { l: "Dry/Rough — tends to crack", v: "Vata" },
      { l: "Warm/Reddish — prone to rashes", v: "Pitta" },
      { l: "Oily/Smooth — thick and soft", v: "Kapha" },
    ],
  },
  {
    id: 3,
    q: "Reaction to Stress",
    options: [
      { l: "Anxiety/Worry — overthink things", v: "Vata" },
      { l: "Anger/Irritability — become intense", v: "Pitta" },
      { l: "Withdrawal/Calm — avoid confrontation", v: "Kapha" },
    ],
  },
  {
    id: 4,
    q: "Digestion & Appetite",
    options: [
      { l: "Irregular — variable hunger and gas", v: "Vata" },
      { l: "Strong — get irritable if I skip meals", v: "Pitta" },
      { l: "Slow/Steady — rarely very hungry", v: "Kapha" },
    ],
  },
  {
    id: 5,
    q: "Sleep Pattern",
    options: [
      { l: "Light/Interrupted — wake up easily", v: "Vata" },
      { l: "Moderate/Sound — sleep well usually", v: "Pitta" },
      { l: "Heavy/Deep — hard to wake up", v: "Kapha" },
    ],
  },
  {
    id: 6,
    q: "Mind & Memory",
    options: [
      { l: "Learn fast, forget fast", v: "Vata" },
      { l: "Sharp and precise memory", v: "Pitta" },
      { l: "Slow to learn, but never forget", v: "Kapha" },
    ],
  },
  {
    id: 7,
    q: "Weather Preference",
    options: [
      { l: "Dislike cold and wind", v: "Vata" },
      { l: "Dislike heat and sun", v: "Pitta" },
      { l: "Dislike cold and damp", v: "Kapha" },
    ],
  },
];

const DoshaQuizScreen = ({ navigation }) => {
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [result, setResult] = useState(null); // show result card

  useEffect(() => {
    const checkGuestStatus = async () => {
      const guestFlag = await AsyncStorage.getItem("isGuest");
      if (guestFlag === "true") setIsGuestMode(true);
    };
    checkGuestStatus();
  }, []);

  const handleSelect = (questionId, doshaValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: doshaValue }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // prevent race condition

    if (Object.keys(answers).length < questions.length) {
      Alert.alert(
        "Step Missing",
        "Please answer all questions to get an accurate Prakriti analysis.",
      );
      return;
    }

    // ── Validate answers ──
    const validDoshas = ["Vata", "Pitta", "Kapha"];
    const invalidAnswers = Object.values(answers).filter(
      (v) => !validDoshas.includes(v),
    );
    if (invalidAnswers.length > 0) {
      Alert.alert(
        "Invalid Answers",
        "Some answers are not valid. Please reselect.",
      );
      return; // do not proceed
    }

    setIsSubmitting(true);

    // Fetch username safely
    const username = (await AsyncStorage.getItem("userName")) || "Guest";

    await calculateResults(username);
  };

  const calculateResults = async (username) => {
    const counts = { Vata: 0, Pitta: 0, Kapha: 0 };
    Object.values(answers).forEach((val) => counts[val]++);

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const totalQuestions = questions.length;
    let finalResult = sorted[0][0];

    // If secondary dosha is >= 40% of the total answers, make it a dual dosha
    if (sorted[1][1] / totalQuestions >= 0.4) {
      // Create an array to sort the primary and secondary doshas 
      // alphabetically or following the standard VPK order to universally map it.
      const dualDoshas = [sorted[0][0], sorted[1][0]];
      
      if (dualDoshas.includes("Vata") && dualDoshas.includes("Pitta")) {
        finalResult = "Vata-Pitta";
      } else if (dualDoshas.includes("Pitta") && dualDoshas.includes("Kapha")) {
        finalResult = "Pitta-Kapha";
      } else if (dualDoshas.includes("Vata") && dualDoshas.includes("Kapha")) {
        finalResult = "Vata-Kapha";
      }
    }

    try {
      // Save offline
      await AsyncStorage.setItem("userPrakriti", finalResult);
      await AsyncStorage.setItem(`prakriti_${username}`, finalResult);

      // Backend sync
      if (!isGuestMode) {
        try {
          await axios.post(
            `${API_BASE_URL}/update-prakriti/`,
            { username, prakriti: finalResult },
            { timeout: 4000 },
          );
        } catch {}
      }

      setResult(finalResult);
    } catch (e) {
      Alert.alert("Error", "Could not save result. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;
  const info = result ? DOSHA_INFO[result] : null;

  // ── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (result && info) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Result Card */}
          <View
            style={[
              resultStyles.card,
              { backgroundColor: info.bg, borderColor: info.color + "40" },
            ]}
          >
            <Text style={resultStyles.emoji}>{info.emoji}</Text>
            <Text style={[resultStyles.title, { color: info.color }]}>
              {info.title}
            </Text>
            <Text style={resultStyles.traits}>{info.traits}</Text>
            <Text style={resultStyles.description}>{info.description}</Text>
          </View>

          {/* Scores */}
          <View style={resultStyles.scoresCard}>
            <Text style={resultStyles.scoresTitle}>Your Dosha Balance</Text>
            {["Vata", "Pitta", "Kapha"].map((d) => {
              const count = Object.values(answers).filter(
                (v) => v === d,
              ).length;
              const percent = Math.round((count / questions.length) * 100);
              const dInfo = DOSHA_INFO[d];
              return (
                <View key={d} style={resultStyles.scoreRow}>
                  <Text style={resultStyles.scoreLabel}>
                    {dInfo.emoji} {d}
                  </Text>
                  <View style={resultStyles.scoreBarBg}>
                    <View
                      style={[
                        resultStyles.scoreBarFill,
                        { width: `${percent}%`, backgroundColor: dInfo.color },
                      ]}
                    />
                  </View>
                  <Text style={resultStyles.scorePercent}>{percent}%</Text>
                </View>
              );
            })}
          </View>

          {/* Tips */}
          <View style={resultStyles.tipsCard}>
            <Text style={resultStyles.tipsTitle}>
              🌿 Lifestyle Tips for {result}
            </Text>
            {info.tips.map((tip, i) => (
              <View key={i} style={resultStyles.tipRow}>
                <Text style={[resultStyles.tipDot, { color: info.color }]}>
                  ●
                </Text>
                <Text style={resultStyles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Saved badge */}
          <View style={resultStyles.savedBadge}>
            <Text style={resultStyles.savedText}>
              ✅ Saved offline & synced to your profile
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[resultStyles.continueBtn, { backgroundColor: info.color }]}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={resultStyles.continueBtnText}>Continue to Home ➔</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
        <BottomNavBar
          navigation={navigation}
          activeScreen={isGuestMode ? "Family" : ""}
        />
      </SafeAreaView>
    );
  }

  // ── QUIZ SCREEN ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backCircle}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>
            {isGuestMode ? "Family Prakriti" : "Body Analysis"}
          </Text>
          <Text style={styles.headerProgress}>
            {answered} of {questions.length} answered
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(answered / questions.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBox}>
          <Text style={styles.instructions}>
            {isGuestMode
              ? "Observe your family member's natural tendencies to reveal their Ayurvedic profile."
              : "Answer based on your long-term tendencies, not just how you feel today."}
          </Text>
        </View>

        {questions.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.qNumber}>
                <Text style={styles.qNumberText}>{q.id}</Text>
              </View>
              <Text style={styles.questionText}>{q.q}</Text>
            </View>
            <View style={styles.optionsList}>
              {q.options.map((opt, index) => {
                const isSelected = answers[q.id] === opt.v;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => handleSelect(q.id, opt.v)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        isSelected && styles.radioOuterActive,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelActive,
                      ]}
                    >
                      {opt.l}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, !allAnswered && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !allAnswered}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitBtnText}>Reveal My Prakriti ✨</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar
        navigation={navigation}
        activeScreen={isGuestMode ? "Family" : ""}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  scrollContent: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: BACKGROUND,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  backArrow: { color: TEXT_PRIMARY, fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: TEXT_PRIMARY },
  headerProgress: {
    fontSize: 12,
    color: THEME_LIGHT,
    fontWeight: "600",
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: THEME_SURFACE,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  progressFill: { height: 4, backgroundColor: THEME_COLOR, borderRadius: 10 },
  introBox: {
    backgroundColor: THEME_SURFACE,
    padding: 15,
    borderRadius: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  instructions: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
    fontStyle: "italic",
  },
  questionCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  qNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: THEME_COLOR,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  qNumberText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  questionText: { fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY },
  optionsList: { gap: 10 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EBEBEB",
    backgroundColor: BACKGROUND,
  },
  optionSelected: { borderColor: THEME_COLOR, backgroundColor: THEME_SURFACE },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterActive: { borderColor: THEME_COLOR },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME_COLOR,
  },
  optionLabel: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontWeight: "500",
    flex: 1,
  },
  optionLabelActive: { color: THEME_DARK, fontWeight: "700" },
  submitBtn: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 17,
    borderRadius: 16,
    marginTop: 12,
    alignItems: "center",
    elevation: 6,
    shadowColor: THEME_DARK,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  btnDisabled: { backgroundColor: "#B0C4B8", elevation: 0, shadowOpacity: 0 },
  submitBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.4,
  },
});

const resultStyles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
  },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 6 },
  traits: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginBottom: 14,
    fontStyle: "italic",
  },
  description: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    textAlign: "center",
    lineHeight: 22,
  },

  scoresCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  scoresTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 16,
  },
  scoreRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  scoreLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_PRIMARY,
    width: 70,
  },
  scoreBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    marginHorizontal: 10,
    overflow: "hidden",
  },
  scoreBarFill: { height: 8, borderRadius: 10 },
  scorePercent: {
    fontSize: 12,
    fontWeight: "bold",
    color: TEXT_SECONDARY,
    width: 36,
    textAlign: "right",
  },

  tipsCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },
  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  tipDot: { fontSize: 8, marginTop: 6, marginRight: 10 },
  tipText: { fontSize: 13, color: TEXT_SECONDARY, flex: 1, lineHeight: 20 },

  savedBadge: {
    backgroundColor: THEME_SURFACE,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  savedText: { fontSize: 13, color: THEME_DARK, fontWeight: "600" },

  continueBtn: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    elevation: 6,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});

export default DoshaQuizScreen;
