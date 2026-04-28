/**
 * WearableIntegrationScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT IS WEARABLE INTEGRATION?
 * ─────────────────────────────────────────────────────────────────────────────
 * Wearable Integration connects your phone's health data (steps, heart rate,
 * sleep, calories) with Sanjeevani's Ayurvedic engine. Since real Google Fit /
 * Apple HealthKit APIs require paid developer accounts and device sensors, this
 * screen uses a SIMULATED health data engine that:
 *
 *   1. Shows realistic health metrics (steps, heart rate, sleep, calories)
 *   2. Reads your Dosha from AsyncStorage
 *   3. Analyzes each metric through an Ayurvedic lens
 *   4. Gives personalized Ayurvedic tips based on your metrics + dosha
 *   5. Saves all data to AsyncStorage (works fully OFFLINE)
 *   6. Shows a dosha-impact score for each metric
 *
 * HOW IT WORKS (for real integration, replace simulateHealthData with):
 *   - Android: react-native-health-connect (Google Fit successor)
 *   - iOS:     react-native-health (Apple HealthKit)
 *
 * SCREENS FLOW:
 *   HomeScreen → WearableIntegrationScreen
 *   WearableIntegrationScreen → DailyPulseCheck (with wearable context)
 *   WearableIntegrationScreen → HealthScoreRing (with wearable boost)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Dimensions, Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

// ─────────────────────────────────────────────────────────────────────────────
// AYURVEDIC INTERPRETATION ENGINE
// Each dosha reacts differently to the same health metrics
// ─────────────────────────────────────────────────────────────────────────────
const DOSHA_HEALTH_TIPS = {
  Vata: {
    steps: {
      low:  { tip: 'Low activity aggravates Vata. Walk barefoot on grass for 20 min to ground your energy.', impact: 'high' },
      ok:   { tip: 'Good movement! Add warm sesame oil massage post-walk to prevent Vata joint dryness.', impact: 'medium' },
      high: { tip: 'Vata can exhaust easily. Replace intense steps with gentle yoga or tai chi today.', impact: 'low' },
    },
    heart_rate: {
      low:  { tip: 'Low heart rate is fine for Vata. Stay warm and avoid cold environments.', impact: 'low' },
      ok:   { tip: 'Balanced heart rhythm. Practice Nadi Shodhana to maintain Vata-Prana balance.', impact: 'low' },
      high: { tip: 'Elevated heart rate signals Vata stress. Practice 4-7-8 breathing immediately.', impact: 'high' },
    },
    sleep: {
      low:  { tip: 'Sleep deprivation severely aggravates Vata. Drink warm milk with nutmeg at 9 PM tonight.', impact: 'high' },
      ok:   { tip: 'Decent sleep! Maintain a fixed bedtime — Vata thrives on routine above everything.', impact: 'low' },
      high: { tip: 'Great sleep! This is the best Vata medicine. Keep your bedroom warm and dark.', impact: 'low' },
    },
    calories: {
      low:  { tip: 'Under-eating depletes Vata Ojas. Eat warm ghee, nuts, and root vegetables today.', impact: 'high' },
      ok:   { tip: 'Good caloric balance. Favour warm, oily, sweet foods to nourish Vata tissues.', impact: 'low' },
      high: { tip: 'High calorie burn needs replenishment. Have warm golden milk with ashwagandha tonight.', impact: 'medium' },
    },
  },
  Pitta: {
    steps: {
      low:  { tip: 'Pitta needs movement to burn its fire. A brisk 30-min walk in cool morning air is perfect.', impact: 'medium' },
      ok:   { tip: 'Good activity level. Exercise in the early morning or evening — never in peak afternoon heat.', impact: 'low' },
      high: { tip: 'Over-exercising overheats Pitta! Swim or do moon salutation instead of intense cardio.', impact: 'high' },
    },
    heart_rate: {
      low:  { tip: 'Good resting rate. Pitta heart health improves with regular coconut water hydration.', impact: 'low' },
      ok:   { tip: 'Balanced. Continue avoiding spicy food and alcohol which spike Pitta heart rate.', impact: 'low' },
      high: { tip: 'High heart rate = aggravated Pitta fire. Apply sandalwood paste on your forehead now.', impact: 'high' },
    },
    sleep: {
      low:  { tip: 'Sleep loss ignites Pitta anger and acidity. Drink rose water before bed and sleep before 10 PM.', impact: 'high' },
      ok:   { tip: 'Adequate sleep keeps Pitta in check. Avoid screen light 1 hour before bed.', impact: 'low' },
      high: { tip: 'Excellent! Deep sleep cools Pitta. Your liver is regenerating well between 10 PM-2 AM.', impact: 'low' },
    },
    calories: {
      low:  { tip: 'Pitta must eat regularly or it turns irritable! Have bitter melon or coriander rice now.', impact: 'high' },
      ok:   { tip: 'Well balanced. Keep favouring sweet, bitter, astringent tastes for Pitta pacification.', impact: 'low' },
      high: { tip: 'High burn rate — replenish with cooling foods like cucumber, mint, and coconut.', impact: 'medium' },
    },
  },
  Kapha: {
    steps: {
      low:  { tip: 'Kapha urgently needs movement! Low steps create heaviness and lethargy. Walk NOW — 20 minutes minimum.', impact: 'high' },
      ok:   { tip: 'Keep moving! Kapha benefits from daily 45-min brisk walks. Gradually increase pace.', impact: 'medium' },
      high: { tip: 'Excellent! High activity is Kapha medicine. Add vigorous pranayama (Kapalabhati) tomorrow.', impact: 'low' },
    },
    heart_rate: {
      low:  { tip: 'Very low heart rate is common in Kapha. Combat with stimulating ginger and pepper tea.', impact: 'medium' },
      ok:   { tip: 'Healthy rate. Keep stimulating Kapha with interval training twice a week.', impact: 'low' },
      high: { tip: 'Unusual for Kapha — check for anxiety. Triphala and light diet will help.', impact: 'medium' },
    },
    sleep: {
      low:  { tip: 'Even sleep loss pushes Kapha to nap during the day — resist this. Set a strict wake time.', impact: 'medium' },
      ok:   { tip: 'Good. But Kapha should never sleep more than 7 hours or after sunrise — it causes lethargy.', impact: 'low' },
      high: { tip: 'Too much sleep thickens Kapha! Wake before 6 AM, do dry powder massage, drink hot ginger tea.', impact: 'high' },
    },
    calories: {
      low:  { tip: 'Under-eating with low activity is fine for Kapha. Stick to light, spiced, warm meals.', impact: 'low' },
      ok:   { tip: 'Balanced. Favour pungent, bitter, astringent tastes. Avoid sweet and oily snacks.', impact: 'low' },
      high: { tip: 'High calorie intake without movement creates Ama in Kapha. Fast one meal or do a juice day.', impact: 'high' },
    },
  },
};

// Fallback for dual doshas or General
const getFallbackTips = (dosha) => {
  const base = dosha?.includes('Vata') ? DOSHA_HEALTH_TIPS.Vata
    : dosha?.includes('Pitta') ? DOSHA_HEALTH_TIPS.Pitta
    : DOSHA_HEALTH_TIPS.Kapha;
  return base;
};

const getTips = (dosha) => DOSHA_HEALTH_TIPS[dosha] || getFallbackTips(dosha) || DOSHA_HEALTH_TIPS.Vata;

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATED HEALTH DATA GENERATOR
// In production: replace with real HealthKit / Health Connect API calls
// ─────────────────────────────────────────────────────────────────────────────
const simulateHealthData = (dosha) => {
  // Dosha-biased simulation: each dosha has typical activity patterns
  const profiles = {
    Vata:   { steps: [3000, 9000],  hr: [60, 90],  sleep: [4.5, 7.5], cal: [1200, 2200] },
    Pitta:  { steps: [6000, 14000], hr: [65, 95],  sleep: [5.5, 7.5], cal: [1800, 2800] },
    Kapha:  { steps: [1500, 7000],  hr: [55, 75],  sleep: [7.0, 10.0], cal: [1400, 2400] },
    General:{ steps: [3000, 10000], hr: [60, 85],  sleep: [5.0, 8.0], cal: [1400, 2200] },
  };

  const p = profiles[dosha] || profiles.General;
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const flt = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

  return {
    steps:      rnd(...p.steps),
    heart_rate: rnd(...p.hr),
    sleep:      flt(...p.sleep),
    calories:   rnd(...p.cal),
    timestamp:  new Date().toISOString(),
    source:     'Sanjeevani Simulated Sensor',
  };
};

// Categorize metric into low / ok / high
const categorize = (metric, value) => {
  const thresholds = {
    steps:      { low: 4000, high: 10000 },
    heart_rate: { low: 60,   high: 85    },
    sleep:      { low: 6.0,  high: 9.0   },
    calories:   { low: 1400, high: 2500  },
  };
  const t = thresholds[metric];
  if (value < t.low)  return 'low';
  if (value > t.high) return 'high';
  return 'ok';
};

const METRIC_CONFIG = [
  {
    key: 'steps',
    label: 'Daily Steps',
    icon: '👟',
    unit: 'steps',
    goal: 8000,
    color: '#4CAF50',
    bg: '#E8F5E9',
    format: (v) => v.toLocaleString(),
    goalLabel: '8,000 goal',
  },
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    icon: '❤️',
    unit: 'bpm',
    goal: 72,
    color: '#E53935',
    bg: '#FFEBEE',
    format: (v) => v,
    goalLabel: '60–85 normal',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    icon: '🌙',
    unit: 'hrs',
    goal: 7,
    color: '#5C6BC0',
    bg: '#EDE7F6',
    format: (v) => v,
    goalLabel: '7 hrs goal',
  },
  {
    key: 'calories',
    label: 'Calories Burned',
    icon: '🔥',
    unit: 'kcal',
    goal: 2000,
    color: '#FF7043',
    bg: '#FBE9E7',
    format: (v) => v.toLocaleString(),
    goalLabel: '2,000 goal',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
const AnimatedBar = ({ value, goal, color }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const pct = Math.min((value / goal) * 100, 100);

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);

  const barWidth = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={barStyles.track}>
      <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
    </View>
  );
};

const barStyles = StyleSheet.create({
  track: { height: 7, backgroundColor: '#EBEBEB', borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  fill:  { height: 7, borderRadius: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────
const MetricCard = ({ config, value, dosha, onPress }) => {
  const cat   = categorize(config.key, value);
  const tips  = getTips(dosha);
  const tipObj= tips?.[config.key]?.[cat] || { tip: 'Track this metric daily for better Ayurvedic insights.', impact: 'low' };

  const impactColors = { low: '#4CAF50', medium: '#FF9800', high: '#E53935' };
  const impactLabels = { low: 'Balanced', medium: 'Moderate Impact', high: 'Needs Attention' };
  const catEmoji     = { low: '⬇️', ok: '✅', high: '⬆️' };

  return (
    <TouchableOpacity style={[cardS.card, { borderLeftColor: config.color }]} activeOpacity={0.88} onPress={onPress}>
      {/* Top row */}
      <View style={cardS.topRow}>
        <View style={[cardS.iconWrap, { backgroundColor: config.bg }]}>
          <Text style={cardS.icon}>{config.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={cardS.label}>{config.label}</Text>
          <View style={cardS.valueRow}>
            <Text style={[cardS.value, { color: config.color }]}>{config.format(value)}</Text>
            <Text style={cardS.unit}> {config.unit}</Text>
          </View>
        </View>
        <View style={[cardS.impactBadge, { backgroundColor: impactColors[tipObj.impact] + '22' }]}>
          <Text style={[cardS.impactText, { color: impactColors[tipObj.impact] }]}>
            {catEmoji[cat]} {impactLabels[tipObj.impact]}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <AnimatedBar value={value} goal={config.goal} color={config.color} />
      <Text style={cardS.goalLabel}>{config.goalLabel}</Text>

      {/* Ayurvedic tip */}
      <View style={[cardS.tipBox, { borderLeftColor: config.color }]}>
        <Text style={cardS.tipLabel}>🌿 Ayurvedic Insight</Text>
        <Text style={cardS.tipText}>{tipObj.tip}</Text>
      </View>
    </TouchableOpacity>
  );
};

const cardS = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 4, shadowColor: '#1E5C33', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10,
  },
  topRow:    { flexDirection: 'row', alignItems: 'center' },
  iconWrap:  { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  icon:      { fontSize: 24 },
  label:     { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 2 },
  valueRow:  { flexDirection: 'row', alignItems: 'flex-end' },
  value:     { fontSize: 24, fontWeight: 'bold' },
  unit:      { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 3 },
  impactBadge:{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  impactText: { fontSize: 10, fontWeight: '700' },
  goalLabel: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 4 },
  tipBox: {
    marginTop: 12, backgroundColor: '#F7FAF8', borderRadius: 10,
    padding: 12, borderLeftWidth: 3,
  },
  tipLabel:  { fontSize: 10, fontWeight: '700', color: THEME_COLOR, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  tipText:   { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },
});

// ─────────────────────────────────────────────────────────────────────────────
// DOSHA IMPACT SUMMARY RING (mini score at top)
// ─────────────────────────────────────────────────────────────────────────────
const WellnessRing = ({ score, dosha }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1000, useNativeDriver: false }).start();
  }, [score]);

  const color = score >= 70 ? '#4CAF50' : score >= 45 ? '#FF9800' : '#E53935';
  const label = score >= 70 ? 'Excellent' : score >= 45 ? 'Good' : 'Needs Care';

  return (
    <View style={ringS.wrap}>
      <View style={[ringS.ring, { borderColor: color }]}>
        <Text style={[ringS.score, { color }]}>{score}</Text>
        <Text style={ringS.outOf}>/ 100</Text>
        <Text style={[ringS.label, { color }]}>{label}</Text>
      </View>
      <Text style={ringS.dosha}>🌿 {dosha} Balance</Text>
    </View>
  );
};

const ringS = StyleSheet.create({
  wrap:  { alignItems: 'center', marginVertical: 8 },
  ring:  {
    width: 110, height: 110, borderRadius: 55, borderWidth: 7,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
  },
  score: { fontSize: 30, fontWeight: 'bold' },
  outOf: { fontSize: 11, color: TEXT_SECONDARY, marginTop: -2 },
  label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  dosha: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 10, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const WearableIntegrationScreen = ({ navigation, route }) => {
  const { dosha: routeDosha, userName = '' } = route.params || {};

  const [dosha,    setDosha]    = useState(routeDosha || 'Vata');
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [score,    setScore]    = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [connected, setConnected] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Load saved dosha
    const savedDosha = await AsyncStorage.getItem('userDosha');
    const d = routeDosha || savedDosha || 'Vata';
    setDosha(d);

    // Load previously saved wearable data
    const saved = await AsyncStorage.getItem('wearableData');
    const savedSync = await AsyncStorage.getItem('wearableLastSync');
    const savedConnected = await AsyncStorage.getItem('wearableConnected');

    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      setScore(computeWellnessScore(parsed, d));
      setConnected(savedConnected === 'true');
      if (savedSync) setLastSync(savedSync);
      setLoading(false);
      fadeIn();
    } else {
      setLoading(false);
    }
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  // ── Compute overall wellness score from health data ──────────────────────
  const computeWellnessScore = (d, currentDosha) => {
    if (!d) return 50;
    let score = 50;

    const stepsCat = categorize('steps', d.steps);
    const hrCat    = categorize('heart_rate', d.heart_rate);
    const sleepCat = categorize('sleep', d.sleep);
    const calCat   = categorize('calories', d.calories);

    const doshaBonus = {
      Vata:  { steps: { low: -10, ok: +15, high: -5  }, sleep: { low: -15, ok: +15, high: +5  } },
      Pitta: { steps: { low: -5,  ok: +15, high: -10 }, heart_rate: { low: +5, ok: +10, high: -15 } },
      Kapha: { steps: { low: -15, ok: +10, high: +15 }, sleep: { low: -5, ok: +5, high: -10 } },
    };

    const db = doshaBonus[currentDosha] || doshaBonus.Vata;
    score += (db.steps?.[stepsCat]         || 0);
    score += (db.heart_rate?.[hrCat]       || (hrCat === 'ok' ? +8 : hrCat === 'low' ? 0 : -8));
    score += (db.sleep?.[sleepCat]         || (sleepCat === 'ok' ? +8 : sleepCat === 'low' ? -10 : 0));
    score += calCat === 'ok' ? +5 : 0;

    return Math.max(10, Math.min(100, score));
  };

  // ── Simulate connecting to health device ──────────────────────────────────
  const handleConnect = async () => {
    setSyncing(true);
    // Simulate 2-second "connecting" delay
    await new Promise(r => setTimeout(r, 2000));
    await syncData();
  };

  // ── Sync / refresh health data ────────────────────────────────────────────
  const syncData = async () => {
    setSyncing(true);
    fadeAnim.setValue(0);

    await new Promise(r => setTimeout(r, 1200)); // realistic delay

    const fresh = simulateHealthData(dosha);
    const now   = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setData(fresh);
    setScore(computeWellnessScore(fresh, dosha));
    setLastSync(now);
    setConnected(true);

    await AsyncStorage.setItem('wearableData',       JSON.stringify(fresh));
    await AsyncStorage.setItem('wearableLastSync',   now);
    await AsyncStorage.setItem('wearableConnected',  'true');
    // Boost health score
    await AsyncStorage.setItem('wearableScore',      String(computeWellnessScore(fresh, dosha)));

    setSyncing(false);
    fadeIn();
  };

  // ─── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.headerTitle}>Wearable Health</Text>
        <Text style={styles.headerSub}>
          {connected ? `⚡ Synced ${lastSync ? 'at ' + lastSync : 'recently'}` : '⌚ Not connected'}
        </Text>
      </View>
      {connected && (
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={syncData}
          disabled={syncing}
          activeOpacity={0.8}
        >
          {syncing
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={styles.syncBtnText}>↻  Sync</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Not connected screen ─────────────────────────────────────────────────
 if (!connected && !loading) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* What is Wearable Integration? */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⌚  What is Wearable Integration?</Text>
          <Text style={styles.infoBody}>
            Wearable Integration connects your daily health metrics — steps, heart rate, sleep hours, and calories burned — with Sanjeevani's Ayurvedic engine.
            {"\n\n"}
            Instead of generic health advice, Sanjeevani reads YOUR actual activity data and interprets it through your unique Dosha lens. A Vata person walking 10,000 steps gets very different advice than a Kapha person walking the same steps.
            {"\n\n"}
            📱 Works with: Google Fit, Apple Health, Samsung Health, Fitbit, Mi Band, and any smartwatch that syncs to your phone's health app.
          </Text>
        </View>

        {/* How it helps */}
        <Text style={styles.sectionTitle}>How it helps you</Text>
        {[
          { icon: '🏃', title: 'Movement Analysis', desc: "Checks if your step count matches your Dosha's ideal activity level and warns you when you're under- or over-doing it." },
          { icon: '❤️', title: 'Heart Rate Insight', desc: 'Analyzes resting and active heart rate through your Dosha. High HR means different things for Vata vs Kapha.' },
          { icon: '🌙', title: 'Sleep Quality', desc: 'Calculates your sleep score and gives Dosha-specific tips to improve your deepest, most healing sleep.' },
          { icon: '🔥', title: 'Calorie Balance', desc: "Checks if you're burning too much or too little based on your Dosha's nutritional needs." },
          { icon: '💯', title: 'Ayurvedic Score', desc: 'Computes a 0–100 wellness score that factors in all metrics weighted by your Dosha type.' },
        ].map((item, i) => (
          <View key={i} style={styles.howCard}>
            <Text style={styles.howIcon}>{item.icon}</Text>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.howTitle}>{item.title}</Text>
              <Text style={styles.howDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        {/* Connect button */}
        <TouchableOpacity
          style={styles.connectBtn}
          activeOpacity={0.85}
          onPress={handleConnect}
          disabled={syncing}
        >
          {syncing ? (
            <View style={styles.connectBtnInner}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.connectBtnText}>  Connecting...</Text>
            </View>
          ) : (
            <View style={styles.connectBtnInner}>
              <Text style={{ fontSize: 22 }}>⌚</Text>
              <Text style={styles.connectBtnText}>  Connect Health Data</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.connectNote}>
          Uses simulated sensor data. For live integration, connect Google Fit or Apple Health from your phone settings.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

  // ─── Connected + data screen ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_DARK} />
      {renderHeader()}

      {syncing && !data ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Reading health data...</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Wellness Ring */}
          <View style={styles.ringCard}>
            <WellnessRing score={score} dosha={dosha} />
            <Text style={styles.ringHint}>Based on your real-time health metrics</Text>
          </View>

          {/* Quick summary pills */}
          <View style={styles.pillRow}>
            {METRIC_CONFIG.map(cfg => (
              <View key={cfg.key} style={[styles.pill, { backgroundColor: cfg.bg }]}>
                <Text style={styles.pillIcon}>{cfg.icon}</Text>
                <Text style={[styles.pillVal, { color: cfg.color }]}>
                  {data ? cfg.format(data[cfg.key]) : '—'}
                </Text>
                <Text style={styles.pillUnit}>{cfg.unit}</Text>
              </View>
            ))}
          </View>

          {/* Metric cards */}
          <Text style={styles.sectionTitle}>Dosha-Aware Breakdown</Text>
          {data && METRIC_CONFIG.map(cfg => (
            <MetricCard
              key={cfg.key}
              config={cfg}
              value={data[cfg.key]}
              dosha={dosha}
              onPress={() => {}} // expand later
            />
          ))}

          {/* Action buttons */}
          <Text style={styles.sectionTitle}>Take Action</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: THEME_DARK }]}
              onPress={() => navigation.navigate('DailyPulseCheck', { dosha, userName })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>💚</Text>
              <Text style={styles.actionBtnText}>Daily Pulse Check</Text>
              <Text style={styles.actionBtnSub}>Use wearable data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#1A237E' }]}
              onPress={() => navigation.navigate('HealthScoreRing', { dosha, userName })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnIcon}>💯</Text>
              <Text style={styles.actionBtnText}>Health Score</Text>
              <Text style={styles.actionBtnSub}>Full wellness index</Text>
            </TouchableOpacity>
          </View>

          {/* Disconnect */}
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={async () => {
              await AsyncStorage.removeItem('wearableData');
              await AsyncStorage.removeItem('wearableConnected');
              await AsyncStorage.removeItem('wearableLastSync');
              setConnected(false);
              setData(null);
            }}
          >
            <Text style={styles.disconnectText}>Disconnect Wearable</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BACKGROUND },
  loadingBox:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { marginTop: 16, color: TEXT_SECONDARY, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight + 12,
    paddingBottom: 16,
    backgroundColor: THEME_DARK,
    elevation: 8,
    shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow:    { color: '#FFF', fontSize: 22 },
  headerTitle:  { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  headerSub:    { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 },
  syncBtn: {
    backgroundColor: THEME_LIGHT, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, minWidth: 80, alignItems: 'center',
  },
  syncBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  scroll: { padding: 20 },

  // Info card (not connected)
  infoCard: {
    backgroundColor: THEME_DARK, borderRadius: 20, padding: 20, marginBottom: 20,
    elevation: 6, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12,
  },
  infoTitle: { color: '#C8E6C9', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  infoBody:  { color: '#D4EDD7', fontSize: 13, lineHeight: 21 },

  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY,
    marginBottom: 12, marginTop: 4,
  },

  // How-it-helps cards
  howCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#FFF', borderRadius: 16, padding: 15,
    marginBottom: 10, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 3, shadowColor: '#1E5C33',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  howIcon:  { fontSize: 26, marginTop: 2 },
  howTitle: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 4 },
  howDesc:  { fontSize: 12, color: TEXT_SECONDARY, lineHeight: 18 },

  // Connect button
  connectBtn: {
    backgroundColor: THEME_COLOR, borderRadius: 18, padding: 18,
    alignItems: 'center', marginTop: 8, marginBottom: 14,
    elevation: 6, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10,
  },
  connectBtnInner: { flexDirection: 'row', alignItems: 'center' },
  connectBtnText:  { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  connectNote: {
    fontSize: 11, color: TEXT_SECONDARY, textAlign: 'center',
    lineHeight: 17, marginBottom: 10,
  },

  // Wellness ring card
  ringCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 22, alignItems: 'center',
    marginBottom: 18, borderWidth: 1, borderColor: '#EBEBEB',
    elevation: 5, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.1, shadowRadius: 12,
  },
  ringHint: { fontSize: 11, color: TEXT_SECONDARY, marginTop: 8, textAlign: 'center' },

  // Quick pill summary
  pillRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  pill: {
    width: (width - 56) / 4,
    borderRadius: 14, padding: 10, alignItems: 'center',
  },
  pillIcon: { fontSize: 18, marginBottom: 4 },
  pillVal:  { fontSize: 14, fontWeight: 'bold' },
  pillUnit: { fontSize: 9, color: TEXT_SECONDARY, marginTop: 1 },

  // Action buttons
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: {
    width: (width - 52) / 2, borderRadius: 18, padding: 16, alignItems: 'center',
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  actionBtnIcon: { fontSize: 26, marginBottom: 8 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13, textAlign: 'center' },
  actionBtnSub:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 3, textAlign: 'center' },

  // Disconnect
  disconnectBtn: {
    borderWidth: 1.5, borderColor: '#EF5350', borderRadius: 14,
    padding: 14, alignItems: 'center', backgroundColor: '#FFF9F9',
  },
  disconnectText: { color: '#EF5350', fontWeight: '700', fontSize: 14 },
});

export default WearableIntegrationScreen;