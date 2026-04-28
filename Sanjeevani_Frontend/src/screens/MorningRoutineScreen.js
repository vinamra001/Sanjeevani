import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Dimensions, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { SafeAreaView } from "react-native-safe-area-context";
import { translations } from '../utils/translations';
import BottomNavBar from '../components/BottomNavBar';

const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

// ─── Dosha-specific routine content ──────────────────────────────────────────
const DOSHA_ROUTINES = {
  Vata: {
    color: '#7B68EE',
    bg: '#F0EEFF',
    emoji: '🌬️',
    wakeTime: '6:30 AM',
    tips: 'Vata types need grounding and warmth. Follow a consistent routine.',
    tasks: [
      { id: 'wake',  time: '6:30 AM', name: 'Wake Up Gently',        desc: 'Avoid alarms that jolt you. Rise slowly, stretch in bed before getting up.',          icon: '🌅' },
      { id: 'water', time: '6:45 AM', name: 'Warm Water with Ginger', desc: 'Drink 1 glass of warm water with a pinch of ginger to kindle digestion (Agni).',     icon: '🍶' },
      { id: 'oil',   time: '7:00 AM', name: 'Sesame Oil Massage',     desc: 'Massage warm sesame oil all over body for 10 mins. Grounding for Vata imbalance.',   icon: '🌿' },
      { id: 'move',  time: '7:20 AM', name: 'Gentle Yoga & Pranayama', desc: 'Practice slow, grounding asanas: Balasana, Tadasana. Nadi Shodhana for 10 mins.',   icon: '🧘' },
      { id: 'med',   time: '7:50 AM', name: 'Warm Nourishing Breakfast', desc: 'Eat warm oatmeal with ghee, warm milk, or khichdi. Avoid cold/raw foods.',        icon: '🍲' },
    ],
  },
  Pitta: {
    color: '#FF6B35',
    bg: '#FFF3EE',
    emoji: '🔥',
    wakeTime: '6:00 AM',
    tips: 'Pitta types need cooling and moderation. Avoid overheating.',
    tasks: [
      { id: 'wake',  time: '6:00 AM', name: 'Wake at Sunrise',         desc: 'Wake up fresh during the cool morning hours before the sun gets hot.',               icon: '🌅' },
      { id: 'water', time: '6:15 AM', name: 'Cool Rose Water',         desc: 'Drink 1 glass of cool (not cold) water with rose petals or mint to cool Pitta.',    icon: '🌹' },
      { id: 'oil',   time: '6:30 AM', name: 'Coconut Oil Massage',     desc: 'Apply cool coconut oil to the body and scalp. Reduces heat and inflammation.',      icon: '🥥' },
      { id: 'move',  time: '6:50 AM', name: 'Cooling Yoga & Sheetali', desc: 'Moon salutations, Sitali pranayama. Avoid hot yoga or vigorous exercise.',          icon: '🧘' },
      { id: 'med',   time: '7:20 AM', name: 'Cooling Breakfast',       desc: 'Sweet fruits, coconut water, cooling smoothies, or oats with milk. Avoid spicy.',   icon: '🍓' },
    ],
  },
  Kapha: {
    color: '#2D7D46',
    bg: '#EAF4EC',
    emoji: '🌊',
    wakeTime: '5:30 AM',
    tips: 'Kapha types need stimulation and movement. Rise early and stay active.',
    tasks: [
      { id: 'wake',  time: '5:30 AM', name: 'Early Rise — Beat Kapha!', desc: 'Rising before 6 AM is critical for Kapha. Sleeping late increases lethargy.',      icon: '🌅' },
      { id: 'water', time: '5:45 AM', name: 'Hot Ginger Lemon Water',   desc: 'Drink hot water with ginger and lemon to stimulate digestion and clear mucus.',    icon: '🍋' },
      { id: 'oil',   time: '6:00 AM', name: 'Dry Brushing (Garshana)', desc: 'Use a dry brush or raw silk gloves to stimulate lymph flow and reduce Kapha.',      icon: '🌿' },
      { id: 'move',  time: '6:20 AM', name: 'Vigorous Exercise',        desc: 'Brisk walk, jogging, or Sun Salutations vigorously for 30 mins. Essential daily.', icon: '🏃' },
      { id: 'med',   time: '7:00 AM', name: 'Light Spiced Breakfast',   desc: 'Small, light meal: spiced oats with black pepper, ginger tea. No heavy food.',    icon: '🌶️' },
    ],
  },
  'Vata-Pitta': {
    color: '#D95C3C',
    bg: '#FFF3EE',
    emoji: '🌬️🔥',
    wakeTime: '6:15 AM',
    tips: 'A balance of grounding and cooling is required. Do not skip meals to prevent Pitta burnout.',
    tasks: [
      { id: 'wake',  time: '6:15 AM', name: 'Gentle Awakening',         desc: 'Wake up peacefully before sunrise. Stretch lightly in bed.',                  icon: '🌅' },
      { id: 'water', time: '6:30 AM', name: 'Room Temp Water',          desc: 'Drink room temperature water. Avoid extreme hot or cold.',                    icon: '🍶' },
      { id: 'oil',   time: '6:45 AM', name: 'Coconut or Almond Oil',    desc: 'Self-massage to calm Vata while cooling Pitta. Use neutral oils.',            icon: '🌿' },
      { id: 'move',  time: '7:05 AM', name: 'Moderate Yoga',            desc: 'Grounding but not overheating sequence. Deep steady breaths.',                icon: '🧘' },
      { id: 'med',   time: '7:45 AM', name: 'Nourishing Breakfast',     desc: 'Oats with cooling sweet fruits. Avoid skipping breakfast.',                   icon: '🍲' },
    ],
  },
  'Pitta-Kapha': {
    color: '#D95C3C',
    bg: '#FFF3EE',
    emoji: '🔥🌊',
    wakeTime: '5:45 AM',
    tips: 'Needs vigorous but cooling stimulation to clear Kapha stagnation without increasing Pitta heat.',
    tasks: [
      { id: 'wake',  time: '5:45 AM', name: 'Early Sunrise Wake',       desc: 'Rise early to shake off Kapha lethargy before Pitta time starts.',            icon: '🌅' },
      { id: 'water', time: '6:00 AM', name: 'Cool Coriander Water',     desc: 'Drink water infused with coriander or mint to kindle digestion but cool body.',icon: '🌿' },
      { id: 'oil',   time: '6:15 AM', name: 'Dry Brushing',             desc: 'Stimulate lymph with garshana, followed by a cool shower.',                   icon: '🚿' },
      { id: 'move',  time: '6:35 AM', name: 'Active Cooling Exercise',  desc: 'Swimming or brisk walking in cool air is perfect for this combination.',      icon: '🏃' },
      { id: 'med',   time: '7:15 AM', name: 'Light Breakfast',          desc: 'Very light breakfast, like a green smoothie or bitter greens.',               icon: '🍏' },
    ],
  },
  'Vata-Kapha': {
    color: '#7B68EE',
    bg: '#F0EEFF',
    emoji: '🌬️🌊',
    wakeTime: '6:00 AM',
    tips: 'Needs warmth, regular routine, and gentle stimulation to balance both airy Vata and heavy Kapha.',
    tasks: [
      { id: 'wake',  time: '6:00 AM', name: 'Steady Routine Wake',      desc: 'Wake consistently at the same time to anchor Vata and motivate Kapha.',       icon: '🌅' },
      { id: 'water', time: '6:15 AM', name: 'Warm Spiced Water',        desc: 'Drink warm water with a pinch of ginger and cinnamon.',                       icon: '☕' },
      { id: 'oil',   time: '6:30 AM', name: 'Warm Sesame Oil',          desc: 'Warm oil massage followed by a warm shower balances both doshas well.',       icon: '🌿' },
      { id: 'move',  time: '6:50 AM', name: 'Warming Yoga',             desc: 'Sun salutations to build internal heat and flexibility.',                     icon: '🧘' },
      { id: 'med',   time: '7:30 AM', name: 'Warm Light Breakfast',     desc: 'Stewed apples with spices or light warm porridge.',                           icon: '🍲' },
    ],
  },
  General: {
    color: THEME_COLOR,
    bg: THEME_SURFACE,
    emoji: '🌿',
    wakeTime: '6:00 AM',
    tips: 'A balanced routine for general wellbeing. Complete your Dosha Quiz for a personalized plan!',
    tasks: [
      { id: 'wake',  time: '6:00 AM', name: 'Wake Up',                  desc: 'Rise with the sun for natural energy. Stretch gently before getting out of bed.',  icon: '🌅' },
      { id: 'water', time: '6:15 AM', name: 'Warm Water',               desc: 'Drink 1-2 glasses of warm water to flush toxins and activate digestion.',          icon: '🍶' },
      { id: 'detox', time: '6:30 AM', name: 'Oil Pulling',              desc: 'Swish 1 tbsp sesame or coconut oil for 10-15 mins. Removes oral bacteria.',        icon: '🌿' },
      { id: 'move',  time: '6:45 AM', name: 'Yoga & Pranayama',         desc: 'Practice 12 Sun Salutations followed by 10 mins of deep breathing.',               icon: '🧘' },
      { id: 'med',   time: '7:15 AM', name: 'Meditation',               desc: 'Sit quietly for 10-20 mins. Focus on breath to start the day with clarity.',       icon: '✨' },
    ],
  },
};

const MorningRoutineScreen = ({ navigation }) => {
  const [loading, setLoading]         = useState(true);
  const [lang, setLang]               = useState('en');
  const [profile, setProfile]         = useState({ username: '', prakriti: 'General' });
  const [checkedTasks, setCheckedTasks] = useState({});
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [customTimes, setCustomTimes] = useState({});
  const [showPicker, setShowPicker]   = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [pickerDate, setPickerDate]   = useState(new Date());

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const username    = await AsyncStorage.getItem('userName');
      const savedLang   = await AsyncStorage.getItem('userLang') || 'en';
      const guestFlag   = await AsyncStorage.getItem('isGuest');
      const savedProgress = await AsyncStorage.getItem(`routine_progress_${username}`);
      const savedTimes  = await AsyncStorage.getItem(`custom_times_${username}`);

      // ── Get dosha from AsyncStorage FIRST (offline) ──
      const offlinePrakriti = await AsyncStorage.getItem(`prakriti_${username}`)
                           || await AsyncStorage.getItem('userPrakriti');

      setLang(savedLang);
      if (savedProgress) setCheckedTasks(JSON.parse(savedProgress));
      if (savedTimes)    setCustomTimes(JSON.parse(savedTimes));

      if (guestFlag === 'true') {
        setIsGuestMode(true);
        setProfile({ username: 'Family Member', prakriti: offlinePrakriti || 'General' });
      } else {
        // Try backend, fall back to offline
        let prakriti = offlinePrakriti || 'General';
        try {
          const response = await axios.get(
            `http://192.168.0.106:8000/api/v1/get-profile/?username=${username}`,
            { timeout: 5000 }
          );
          prakriti = response.data.prakriti || offlinePrakriti || 'General';
          // Save latest from backend to AsyncStorage
          if (response.data.prakriti) {
            await AsyncStorage.setItem('userPrakriti', response.data.prakriti);
            await AsyncStorage.setItem(`prakriti_${username}`, response.data.prakriti);
          }
        } catch {
          // Offline — use locally saved prakriti
        }
        setProfile({ username: username || 'User', prakriti });
      }
    } catch (e) {
      console.error('Routine Init Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onEditPress = (id, currentTimeStr) => {
    setEditingItemId(id);
    const [time, modifier] = currentTimeStr.split(' ');
    let [hours, minutes]   = time.split(':');
    if (modifier === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
    if (modifier === 'AM' && hours === '12') hours = 0;
    const d = new Date();
    d.setHours(parseInt(hours), parseInt(minutes));
    setPickerDate(d);
    setShowPicker(true);
  };

  const handleTimeChange = async (event, selectedDate) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      const formattedTime = selectedDate
        .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
        .toUpperCase();
      const updatedTimes = { ...customTimes, [editingItemId]: formattedTime };
      setCustomTimes(updatedTimes);
      const username = await AsyncStorage.getItem('userName');
      await AsyncStorage.setItem(`custom_times_${username}`, JSON.stringify(updatedTimes));
    }
  };

  const toggleTask = async (index) => {
    const newProgress = { ...checkedTasks, [index]: !checkedTasks[index] };
    setCheckedTasks(newProgress);
    const username = await AsyncStorage.getItem('userName');
    await AsyncStorage.setItem(`routine_progress_${username}`, JSON.stringify(newProgress));
  };

  const resetRoutine = () => {
    Alert.alert(
      'Reset Progress?',
      'Clear all checked tasks for today?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => setCheckedTasks({}) },
      ]
    );
  };

  const getRoutineData = () => {
    const prakriti = profile.prakriti || 'General';
    const routineKey = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'].includes(prakriti) ? prakriti : 'General';
    const routine = DOSHA_ROUTINES[routineKey];
    return {
      ...routine,
      tasks: routine.tasks.map(task => ({
        ...task,
        time: customTimes[task.id] || task.time,
      })),
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={{ marginTop: 10, color: TEXT_SECONDARY }}>Loading your Dinacharya...</Text>
      </View>
    );
  }

  const t = translations[lang];
  const routine = getRoutineData();
  const completedCount = Object.values(checkedTasks).filter(Boolean).length;
  const totalTasks = routine.tasks.length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {showPicker && (
        <DateTimePicker
          value={pickerDate} mode="time" is24Hour={false}
          display="default" onChange={handleTimeChange}
        />
      )}

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.routine_title || 'Morning Routine'}</Text>
        <TouchableOpacity
          style={styles.langBadge}
          onPress={async () => {
            const newLang = lang === 'en' ? 'hi' : 'en';
            setLang(newLang);
            await AsyncStorage.setItem('userLang', newLang);
          }}
        >
          {/* <Text style={styles.langToggle}>{lang === 'en' ? 'हिन्दी' : 'EN'}</Text> */}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── INTRO CARD ── */}
        <View style={[styles.introCard, { borderLeftColor: routine.color, borderLeftWidth: 4 }]}>
          <View style={{ flex: 1 }}>
            <View style={[styles.prakritiBadge, { backgroundColor: routine.bg }]}>
              <Text style={[styles.prakritiBadgeText, { color: routine.color }]}>
                {routine.emoji} {profile.prakriti || 'General'} Plan
              </Text>
            </View>
            <Text style={styles.introTitle}>Dinacharya</Text>
            <Text style={styles.introSubtitle}>
              {isGuestMode ? 'Family View' : `For ${profile.username}`}
            </Text>
            <Text style={styles.introTip}>{routine.tips}</Text>
          </View>
        </View>

        {/* ── PROGRESS BAR ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Today's Progress</Text>
            <Text style={[styles.progressPercent, { color: routine.color }]}>
              {completedCount}/{totalTasks} ✓
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${progressPercent}%`, backgroundColor: routine.color }
            ]} />
          </View>
          {progressPercent === 100 && (
            <Text style={styles.completedText}>🎉 Excellent! Routine complete for today!</Text>
          )}
        </View>

        {/* ── SECTION HEADER ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Schedule</Text>
          <TouchableOpacity onPress={resetRoutine}>
            <Text style={styles.resetText}>Reset All</Text>
          </TouchableOpacity>
        </View>

        {/* ── ROUTINE TASKS ── */}
        <View style={styles.routineBox}>
          {routine.tasks.map((item, i) => {
            const isDone = checkedTasks[i];
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleTask(i)}
                activeOpacity={0.8}
                style={[styles.row, isDone && styles.rowDone]}
              >
                <View style={[
                  styles.checkCircle,
                  isDone && { ...styles.checkedCircle, backgroundColor: routine.color, borderColor: routine.color }
                ]}>
                  {isDone && <Text style={styles.checkMark}>✓</Text>}
                </View>

                <View style={styles.taskInfo}>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.timeLabel, { color: isDone ? '#AAA' : routine.color }]}>
                      {item.time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => onEditPress(item.id, item.time)}
                      style={styles.editBtn}
                    >
                      <Text style={styles.editBtnText}>✎ Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.taskName, isDone && styles.strikeText]}>{item.name}</Text>
                  {!isDone && <Text style={styles.descriptionText}>{item.desc}</Text>}
                </View>

                <View style={[styles.iconContainer, { backgroundColor: routine.bg }]}>
                  <Text style={styles.itemIcon}>{item.icon}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── RETAKE QUIZ PROMPT (if General) ── */}
        {(!profile.prakriti || profile.prakriti === 'General' || profile.prakriti === 'Unknown') && (
          <TouchableOpacity
            style={styles.quizPromptCard}
            onPress={() => navigation.navigate('DoshaQuiz')}
          >
            <Text style={styles.quizPromptEmoji}>🧭</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.quizPromptTitle}>Get Your Personalized Routine</Text>
              <Text style={styles.quizPromptSubtitle}>
                Take the Prakriti Quiz to unlock a Vata, Pitta or Kapha specific plan
              </Text>
            </View>
            <Text style={{ color: THEME_LIGHT, fontWeight: 'bold' }}>➔</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNavBar navigation={navigation} activeScreen={isGuestMode ? 'Family' : ''} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: BACKGROUND },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BACKGROUND },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backCircle: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 5,
  },
  backArrow:   { color: TEXT_PRIMARY, fontSize: 22 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY },
  langBadge: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 100, backgroundColor: THEME_COLOR,
  },
  langToggle: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  content: { paddingHorizontal: 20, paddingTop: 10 },

  introCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 20,
    marginBottom: 16, elevation: 4, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10,
  },
  prakritiBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, alignSelf: 'flex-start', marginBottom: 8,
  },
  prakritiBadgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  introTitle:        { fontSize: 22, fontWeight: 'bold', color: TEXT_PRIMARY },
  introSubtitle:     { fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 },
  introTip:          { fontSize: 12, color: TEXT_SECONDARY, marginTop: 8, lineHeight: 18, fontStyle: 'italic' },

  progressCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16,
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8,
  },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:   { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY },
  progressPercent: { fontSize: 13, fontWeight: 'bold' },
  progressTrack: {
    height: 8, backgroundColor: '#F0F0F0', borderRadius: 10, overflow: 'hidden',
  },
  progressFill:   { height: 8, borderRadius: 10 },
  completedText:  { fontSize: 12, color: THEME_COLOR, marginTop: 8, fontWeight: '600', textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1 },
  resetText:    { color: '#E53935', fontSize: 13, fontWeight: '700' },

  routineBox: {
    backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden',
    elevation: 3, shadowColor: THEME_DARK,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10,
    marginBottom: 16,
  },
  row:     { flexDirection: 'row', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F2F2F2', alignItems: 'center' },
  rowDone: { backgroundColor: '#FAFAFA' },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: THEME_COLOR, marginRight: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  checkedCircle: { backgroundColor: THEME_COLOR },
  checkMark:     { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  taskInfo:      { flex: 1 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  timeLabel:     { fontSize: 10, fontWeight: 'bold', marginRight: 10 },
  editBtn:       { backgroundColor: THEME_SURFACE, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  editBtnText:   { fontSize: 9, color: TEXT_SECONDARY, fontWeight: 'bold' },
  taskName:        { fontSize: 16, fontWeight: 'bold', color: TEXT_PRIMARY },
  strikeText:      { textDecorationLine: 'line-through', color: '#BBB' },
  descriptionText: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 4, lineHeight: 18 },
  iconContainer: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  itemIcon: { fontSize: 20 },

  quizPromptCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: THEME_SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#C8E6C9',
    marginBottom: 16,
  },
  quizPromptEmoji:    { fontSize: 28, marginRight: 14 },
  quizPromptTitle:    { fontSize: 14, fontWeight: 'bold', color: THEME_DARK },
  quizPromptSubtitle: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 3, lineHeight: 17 },
});

export default MorningRoutineScreen;
