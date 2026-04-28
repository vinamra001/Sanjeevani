import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { translations } from '../utils/translations';

const { width } = Dimensions.get('window');
const API_BASE_URL   = 'http://192.168.0.106:8000/api/v1';
const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

// ─────────────────────────────────────────────────────────────────────────────
// 7 REAL AYURVEDIC DIAGNOSTIC QUESTIONS
// Each option has a dosha weight so we can compute today's imbalance
// Vata=0, Pitta=1, Kapha=2  (which dosha this answer points toward)
// ─────────────────────────────────────────────────────────────────────────────
const PULSE_QUESTIONS = [
  {
    key: 'tongue',
    icon: '👅',
    category: 'Tongue Observation',
    question: 'Look at your tongue right now. What do you see?',
    options: [
      { text: 'Dry, cracked or thin with a grayish coat', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Red or yellow with a thick coat at the back', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Pale, swollen with white or thick mucus coat', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Pink, moist, thin coat — looks normal', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'energy',
    icon: '⚡',
    category: 'Morning Energy',
    question: 'How did you feel the moment you woke up today?',
    options: [
      { text: 'Anxious, restless or mind already racing', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Alert immediately but irritable or hot', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Heavy, groggy, needed multiple alarms', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Rested and calm — woke up naturally', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'digestion',
    icon: '🔥',
    category: 'Digestive Fire (Agni)',
    question: 'How is your appetite and digestion feeling today?',
    options: [
      { text: 'Irregular — sometimes hungry, sometimes not at all', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Sharp hunger — irritable if I skip a meal', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Low appetite, feel heavy even without eating much', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Steady appetite, digesting well', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'skin',
    icon: '🌿',
    category: 'Skin & Body Feel',
    question: 'How does your skin and body feel right now?',
    options: [
      { text: 'Dry skin, cold hands/feet, joints feel stiff', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Warm, slightly oily, maybe a breakout coming', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Puffy, heavy, skin looks dull or congested', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Skin feels clear and temperature is neutral', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'mind',
    icon: '🧠',
    category: 'Mental State',
    question: 'What is your mind doing most today?',
    options: [
      { text: 'Overthinking, scattered, hard to focus on one thing', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Sharp and critical — judging myself or others', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Foggy, slow, just want to sit and not think', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Clear, present, thoughts are flowing well', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'sleep',
    icon: '🌙',
    category: 'Last Night\'s Sleep',
    question: 'How did you sleep last night?',
    options: [
      { text: 'Light sleep, woke up multiple times, vivid dreams', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Intense dreams, woke up hot or sweating', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Slept too long but still feel tired and heavy', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Sound sleep, woke up refreshed at a natural time', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
  {
    key: 'stool',
    icon: '🌊',
    category: 'Elimination (Mala)',
    question: 'How was your bowel movement today? (Key Ayurvedic indicator)',
    options: [
      { text: 'Dry, hard, difficult, or irregular / constipated', dosha: 'Vata', points: { V: 2, P: 0, K: 0 } },
      { text: 'Loose, yellowish, burning, or more than once', dosha: 'Pitta', points: { V: 0, P: 2, K: 0 } },
      { text: 'Slow, heavy, pale, mucusy, once in 2 days', dosha: 'Kapha', points: { V: 0, P: 0, K: 2 } },
      { text: 'Well-formed, easy, once in the morning — perfect', dosha: 'Balanced', points: { V: 0, P: 0, K: 0 } },
    ],
  },
];

// ─── Offline tips per imbalance ───────────────────────────────────────────────
const DOSHA_FIXES = {
  Vata: {
    color: '#7B5EA7', bg: '#EDE7F6', border: '#B39DDB',
    emoji: '💨',
    fixes: [
      { icon: '🛢️', title: 'Abhyanga Now', desc: 'Warm sesame oil on your feet and scalp for 5 mins. Grounds Vata immediately.' },
      { icon: '🫖', title: 'Warm Ginger Tea', desc: '1 inch fresh ginger + hot water. Kindles Agni and settles the nervous system.' },
      { icon: '🌅', title: 'Eat Before 8 AM', desc: 'Vata worsens when you skip breakfast. Warm porridge or khichdi.' },
      { icon: '📵', title: 'No Screens Until 9 AM', desc: 'Morning screen time aggravates Vata anxiety and scattered mind.' },
    ],
  },
  Pitta: {
    color: '#E65100', bg: '#FFF3E0', border: '#FFCC80',
    emoji: '🔥',
    fixes: [
      { icon: '🥥', title: 'Coconut Water Now', desc: 'Instantly cools Pitta fire. Best drunk at room temperature, not cold.' },
      { icon: '🌹', title: 'Rose Water Mist', desc: 'Splash rose water on your face or wrists. Pitta responds to cooling rituals.' },
      { icon: '🚫', title: 'Skip Spicy Food Today', desc: 'Even one spicy meal fans Pitta flame for 24 hours. Go sweet and bitter.' },
      { icon: '🌙', title: 'Moonlight Walk at 7 PM', desc: 'The moon cools Pitta the way the sun inflames it. 15 minutes outside.' },
    ],
  },
  Kapha: {
    color: '#0D47A1', bg: '#E3F2FD', border: '#90CAF9',
    emoji: '🌍',
    fixes: [
      { icon: '🏃', title: 'Move Right Now', desc: 'Kapha medicine is movement. 10 jumping jacks right now — not after breakfast.' },
      { icon: '🌶️', title: 'Hot Ginger-Pepper Tea', desc: 'Boil ginger + black pepper + tulsi. Lights a fire under stagnant Kapha.' },
      { icon: '🍽️', title: 'Skip Breakfast If Not Hungry', desc: 'Kapha does not need extra food. Light or no breakfast actually helps.' },
      { icon: '🧠', title: 'Learn Something New', desc: 'Kapha brain needs stimulation. Read, solve, create — for 20 mins.' },
    ],
  },
  Balanced: {
    color: '#2D7D46', bg: '#EAF4EC', border: '#A5D6A7',
    emoji: '✨',
    fixes: [
      { icon: '🌅', title: 'Maintain Your Routine', desc: 'Tridoshic balance is rare — protect it with a consistent daily schedule.' },
      { icon: '🧘', title: 'Pranayama Today', desc: 'Anulom-Vilom for 10 minutes seals in the balance you already have.' },
      { icon: '🌿', title: 'Seasonal Foods Only', desc: 'Eat what grows locally in this season. Nature knows what you need.' },
      { icon: '🌙', title: 'Sleep by 10 PM', desc: 'Catching the Kapha sleep window preserves the balance you have today.' },
    ],
  },
};

// ── Compute today's dominant imbalance from answers ────────────────────────────
const computeImbalance = (answers) => {
  const scores = { V: 0, P: 0, K: 0 };
  Object.values(answers).forEach(opt => {
    if (opt?.points) {
      scores.V += opt.points.V;
      scores.P += opt.points.P;
      scores.K += opt.points.K;
    }
  });
  const max = Math.max(scores.V, scores.P, scores.K);
  if (max === 0) return { imbalance: 'Balanced', scores };
  if (scores.V === max) return { imbalance: 'Vata', scores };
  if (scores.P === max) return { imbalance: 'Pitta', scores };
  return { imbalance: 'Kapha', scores };
};

// ── Compute AMA score 0-100 (lower is better — less toxin) ────────────────────
const computeAmaScore = (answers) => {
  const balanced = Object.values(answers).filter(o => o?.dosha === 'Balanced').length;
  return Math.round((balanced / 7) * 100);
};

// ─────────────────────────────────────────────────────────────────────────────
const DailyPulseCheckScreen = ({ navigation, route }) => {
  const { userName = '' } = route.params || {};
  const [dosha, setDosha]   = useState(route.params?.dosha || 'General');
  const [lang,  setLang]    = useState(route.params?.lang  || 'en');
  const t = translations[lang] || translations['en'];

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet(['userPrakriti', 'userDosha', 'userLang']).then(pairs => {
        const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
        if (map.userDosha || map.userPrakriti) setDosha(map.userDosha || map.userPrakriti);
        if (map.userLang) setLang(map.userLang);
      });
    }, [])
  );

  const [answers,     setAnswers]     = useState({});
  const [tip,         setTip]         = useState('');
  const [loadingTip,  setLoadingTip]  = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [result,      setResult]      = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('lastPulseDate').then(d => {
      if (d === new Date().toDateString()) setAlreadyDone(true);
    });
  }, []);

  const handleSelect = (questionKey, option) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < PULSE_QUESTIONS.length) return;
    setIsSubmitting(true);
    const { imbalance, scores } = computeImbalance(answers);
    const amaScore = computeAmaScore(answers);
    setResult({ imbalance, scores, amaScore });
    await fetchTip(answers, imbalance, amaScore);
    setIsSubmitting(false);
  };

  const fetchTip = async (ans, imbalance, amaScore) => {
    setLoadingTip(true);
    const summaryText = Object.entries(ans)
      .map(([k, v]) => `${k}: ${v?.text || ''}`)
      .join('; ');
    try {
      const response = await axios.post(`${API_BASE_URL}/daily-pulse/`, {
        username:  userName,
        dosha,
        feeling:   ans.energy?.text  || '',
        digestion: ans.digestion?.text || '',
        sleep:     ans.sleep?.text   || '',
        imbalance,
        ama_score: amaScore,
        full_answers: summaryText,
        lang,
      }, { timeout: 10000 });
      const fetchedTip = response.data.tip || DOSHA_FIXES[imbalance]?.fixes[0]?.desc || '';
      setTip(fetchedTip);
      await AsyncStorage.setItem('lastPulseDate', new Date().toDateString());
      await AsyncStorage.setItem('lastPulseTip', fetchedTip);
      await AsyncStorage.setItem('lastPulseImbalance', imbalance);
      await AsyncStorage.setItem('lastPulseAma', String(amaScore));
    } catch {
      const fix = DOSHA_FIXES[imbalance]?.fixes[0];
      const offlineTip = fix ? `${fix.icon} ${fix.title}: ${fix.desc}` : 'Drink warm water and rest today.';
      setTip(offlineTip);
      await AsyncStorage.setItem('lastPulseDate', new Date().toDateString());
      await AsyncStorage.setItem('lastPulseTip', offlineTip);
      await AsyncStorage.setItem('lastPulseImbalance', imbalance);
      await AsyncStorage.setItem('lastPulseAma', String(amaScore));
    } finally {
      setLoadingTip(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ALREADY DONE SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (alreadyDone) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Pulse</Text>
          <View style={{ width: 40 }} />
        </View>
        <AlreadyDoneScreen navigation={navigation} />
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RESULT SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  if (result) {
    const fix = DOSHA_FIXES[result.imbalance] || DOSHA_FIXES.Balanced;
    const vitality = result.amaScore; // higher = cleaner

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Today's Report</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>

          {/* ── VITALITY SCORE ── */}
          <View style={styles.vitalityCard}>
            <Text style={styles.vitalityLabel}>Today's Vitality Score</Text>
            <View style={styles.vitalityRing}>
              <Text style={[styles.vitalityNum, {
                color: vitality >= 70 ? THEME_COLOR : vitality >= 40 ? '#F57C00' : '#C62828'
              }]}>{vitality}</Text>
              <Text style={styles.vitalityOf}>/100</Text>
            </View>
            <Text style={styles.vitalityDesc}>
              {vitality >= 70
                ? '✨ Excellent! Your Agni is burning clean today.'
                : vitality >= 40
                ? '⚡ Moderate Ama — one or two doshas need attention.'
                : '🌿 High Ama — your body is asking for rest and cleansing.'}
            </Text>
          </View>

          {/* ── DOSHA METER ── */}
          <View style={styles.meterCard}>
            <Text style={styles.meterTitle}>Today's Dosha Meter</Text>
            {[
              { label: 'Vata', key: 'V', color: '#7B5EA7', emoji: '💨' },
              { label: 'Pitta', key: 'P', color: '#E65100', emoji: '🔥' },
              { label: 'Kapha', key: 'K', color: '#0D47A1', emoji: '🌊' },
            ].map(d => {
              const score = result.scores[d.key];
              const pct   = Math.min((score / 14) * 100, 100);
              return (
                <View key={d.key} style={styles.meterRow}>
                  <Text style={styles.meterEmoji}>{d.emoji}</Text>
                  <Text style={styles.meterLabel}>{d.label}</Text>
                  <View style={styles.meterBarBg}>
                    <View style={[styles.meterBarFill, { width: `${pct}%`, backgroundColor: d.color }]} />
                  </View>
                  <Text style={[styles.meterScore, { color: d.color }]}>
                    {score > 0 ? `${Math.round(pct)}%` : '✓'}
                  </Text>
                </View>
              );
            })}
            <View style={[styles.imbalanceChip, { backgroundColor: fix.bg, borderColor: fix.border }]}>
              <Text style={[styles.imbalanceChipText, { color: fix.color }]}>
                {fix.emoji} Today's Dominant Imbalance: {result.imbalance}
              </Text>
            </View>
          </View>

          {/* ── AI TIP ── */}
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>🤖 AI Ayurvedic Tip For You Today</Text>
            {loadingTip
              ? <ActivityIndicator color={THEME_LIGHT} size="large" style={{ marginVertical: 20 }} />
              : <Text style={styles.tipText}>{tip}</Text>
            }
          </View>

          {/* ── ACTION PLAN ── */}
          <Text style={styles.fixTitle}>Your {result.imbalance} Correction Plan</Text>
          {fix.fixes.map((f, i) => (
            <View key={i} style={[styles.fixCard, { borderLeftColor: fix.color }]}>
              <Text style={styles.fixIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fixName, { color: fix.color }]}>{f.title}</Text>
                <Text style={styles.fixDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}

          {/* ── ANSWER SUMMARY ── */}
          <Text style={styles.summaryTitle}>Your 7-Point Pulse Analysis</Text>
          <View style={styles.summaryCard}>
            {PULSE_QUESTIONS.map((q, i) => {
              const ans = answers[q.key];
              return (
                <View key={i} style={styles.summaryRow}>
                  <View style={styles.summaryLeft}>
                    <Text style={styles.summaryIcon}>{q.icon}</Text>
                    <Text style={styles.summaryCategory}>{q.category}</Text>
                  </View>
                  <View style={styles.summaryRight}>
                    <Text style={styles.summaryAnswer}>{ans?.text || '—'}</Text>
                    {ans?.dosha && ans.dosha !== 'Balanced' && (
                      <Text style={styles.summaryDosha}>↑ {ans.dosha}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done for Today 🌿</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // QUESTION SCREEN
  // ──────────────────────────────────────────────────────────────────────────
  const answered = Object.keys(answers).length;
  const allAnswered = answered === PULSE_QUESTIONS.length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>Daily Pulse</Text>
          <Text style={styles.headerProgress}>{answered} of {PULSE_QUESTIONS.length} answered</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(answered / PULSE_QUESTIONS.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.introBox}>
          <Text style={styles.instructions}>
            Answer based on how you feel right now to get your daily Ayurvedic tip.
          </Text>
        </View>

        {PULSE_QUESTIONS.map((q, index) => (
          <View key={q.key} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.qNumber}>
                <Text style={styles.qNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
            </View>

            <View style={styles.categoryPill}>
              <Text style={styles.categoryIcon}>{q.icon}</Text>
              <Text style={styles.categoryText}>{q.category}</Text>
            </View>

            <View style={styles.optionsList}>
              {q.options.map((opt, i) => {
                const isSelected = answers[q.key]?.text === opt.text;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.optionItem, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(q.key, opt)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                      {opt.text}
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
            <Text style={styles.submitBtnText}>Check Daily Pulse ✨</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Already Done Sub-screen ───────────────────────────────────────────────────
const AlreadyDoneScreen = ({ navigation }) => {
  const [lastTip,       setLastTip]       = useState('');
  const [lastImbalance, setLastImbalance] = useState('');
  const [lastAma,       setLastAma]       = useState(null);

  useEffect(() => {
    AsyncStorage.multiGet(['lastPulseTip', 'lastPulseImbalance', 'lastPulseAma']).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]));
      if (map.lastPulseTip)       setLastTip(map.lastPulseTip);
      if (map.lastPulseImbalance) setLastImbalance(map.lastPulseImbalance);
      if (map.lastPulseAma)       setLastAma(Number(map.lastPulseAma));
    });
  }, []);

  const fix = DOSHA_FIXES[lastImbalance] || null;

  return (
    <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 10 }}>✅</Text>
      <Text style={styles.alreadyTitle}>Pulse checked today!</Text>
      <Text style={styles.alreadySub}>Come back tomorrow for your next reading.</Text>

      {lastAma !== null && (
        <View style={styles.vitalityCard}>
          <Text style={styles.vitalityLabel}>Today's Vitality Score</Text>
          <View style={styles.vitalityRing}>
            <Text style={[styles.vitalityNum, {
              color: lastAma >= 70 ? THEME_COLOR : lastAma >= 40 ? '#F57C00' : '#C62828'
            }]}>{lastAma}</Text>
            <Text style={styles.vitalityOf}>/100</Text>
          </View>
          {fix && (
            <View style={[styles.imbalanceChip, { backgroundColor: fix.bg, borderColor: fix.border }]}>
              <Text style={[styles.imbalanceChipText, { color: fix.color }]}>
                {fix.emoji} Today's Imbalance: {lastImbalance}
              </Text>
            </View>
          )}
        </View>
      )}

      {lastTip ? (
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>Today's Ayurvedic Tip</Text>
          <Text style={styles.tipText}>{lastTip}</Text>
        </View>
      ) : null}

      {fix && (
        <>
          <Text style={styles.fixTitle}>Your {lastImbalance} Correction Plan</Text>
          {fix.fixes.map((f, i) => (
            <View key={i} style={[styles.fixCard, { borderLeftColor: fix.color }]}>
              <Text style={styles.fixIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fixName, { color: fix.color }]}>{f.title}</Text>
                <Text style={styles.fixDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.doneBtnText}>← Back to Home</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  scrollContent: { padding: 20 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: BACKGROUND
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFF",
    justifyContent: "center", alignItems: "center", elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5
  },
  backArrow: { color: TEXT_PRIMARY, fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: "bold", color: TEXT_PRIMARY },
  headerProgress: { fontSize: 12, color: THEME_LIGHT, fontWeight: "600", marginTop: 2 },

  progressTrack: { height: 4, backgroundColor: THEME_SURFACE, marginHorizontal: 20, borderRadius: 10, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: THEME_COLOR, borderRadius: 10 },

  introBox: { backgroundColor: THEME_SURFACE, padding: 15, borderRadius: 14, marginBottom: 22, borderWidth: 1, borderColor: '#C8E6C9' },
  instructions: { fontSize: 13, color: TEXT_SECONDARY, textAlign: "center", lineHeight: 20, fontStyle: "italic" },

  questionCard: {
    backgroundColor: "#FFF", borderRadius: 20, padding: 18, marginBottom: 16,
    elevation: 4, shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.08, shadowRadius: 12
  },
  questionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  qNumber: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: THEME_COLOR,
    justifyContent: "center", alignItems: "center", marginRight: 12
  },
  qNumberText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  questionText: { fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, flex: 1 },

  categoryPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME_SURFACE, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 16,
    borderWidth: 1, borderColor: '#C8E6C9',
  },
  categoryIcon: { fontSize: 14, marginRight: 6 },
  categoryText: { fontSize: 10, fontWeight: '700', color: THEME_DARK, textTransform: 'uppercase', letterSpacing: 0.5 },

  optionsList: { gap: 10 },
  optionItem: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#EBEBEB", backgroundColor: BACKGROUND
  },
  optionSelected: { borderColor: THEME_COLOR, backgroundColor: THEME_SURFACE },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#CCC",
    marginRight: 12, justifyContent: "center", alignItems: "center"
  },
  radioOuterActive: { borderColor: THEME_COLOR },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: THEME_COLOR },
  optionLabel: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: "500", flex: 1 },
  optionLabelActive: { color: THEME_DARK, fontWeight: "700" },

  submitBtn: {
    backgroundColor: THEME_COLOR, paddingVertical: 17, borderRadius: 16, marginTop: 12,
    alignItems: "center", elevation: 6, shadowColor: THEME_DARK, shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }
  },
  btnDisabled: { backgroundColor: "#B0C4B8", elevation: 0, shadowOpacity: 0 },
  submitBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold", letterSpacing: 0.4 },

  // ── Result screen ────────────────────────────────────────────────────────
  resultScroll: { padding: 20, paddingTop: 16 },

  // Vitality score ring
  vitalityCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 22, marginBottom: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 4, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  vitalityLabel: { fontSize: 11, fontWeight: '800', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 },
  vitalityRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 8, borderColor: THEME_SURFACE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  vitalityNum:  { fontSize: 34, fontWeight: 'bold' },
  vitalityOf:   { fontSize: 13, color: TEXT_SECONDARY },
  vitalityDesc: { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 19 },

  imbalanceChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    marginTop: 14, borderWidth: 1, alignSelf: 'center',
  },
  imbalanceChipText: { fontSize: 13, fontWeight: '700' },

  // Dosha meter
  meterCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: '#EBEBEB', elevation: 3,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  meterTitle: { fontSize: 13, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  meterRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  meterEmoji: { fontSize: 18, marginRight: 10, width: 24, textAlign: 'center' },
  meterLabel: { fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY, width: 40 },
  meterBarBg: { flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  meterBarFill:{ height: '100%', borderRadius: 4 },
  meterScore: { fontSize: 11, fontWeight: '700', width: 34, textAlign: 'right' },

  // AI tip card
  tipCard: {
    backgroundColor: THEME_DARK, borderRadius: 20, padding: 20, marginBottom: 16,
    elevation: 5, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.22, shadowRadius: 12,
  },
  tipLabel: { color: '#C8E6C9', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: '800' },
  tipText:  { color: '#FFF', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  // Fix cards
  fixTitle: { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 12, marginTop: 6 },
  fixCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  fixIcon: { fontSize: 22, marginRight: 14, marginTop: 2 },
  fixName: { fontSize: 13, fontWeight: '800', marginBottom: 5 },
  fixDesc: { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },

  // Answer summary
  summaryTitle: { fontSize: 15, fontWeight: 'bold', color: TEXT_PRIMARY, marginBottom: 12, marginTop: 6 },
  summaryCard: {
    backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EBEBEB', marginBottom: 20,
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  summaryLeft: { width: 100, paddingRight: 10 },
  summaryIcon: { fontSize: 20, marginBottom: 4 },
  summaryCategory: { fontSize: 10, fontWeight: '700', color: THEME_COLOR, textTransform: 'uppercase' },
  summaryRight:  { flex: 1 },
  summaryAnswer: { fontSize: 12, color: TEXT_PRIMARY, lineHeight: 18 },
  summaryDosha:  { fontSize: 10, color: '#E65100', fontWeight: '700', marginTop: 3 },

  doneBtn: {
    backgroundColor: THEME_COLOR, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    elevation: 4, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10,
  },
  doneBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },

  // Already done
  alreadyTitle: { fontSize: 20, fontWeight: 'bold', color: THEME_DARK, textAlign: 'center', marginBottom: 6 },
  alreadySub:   { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', marginBottom: 20 },
});

export default DailyPulseCheckScreen;