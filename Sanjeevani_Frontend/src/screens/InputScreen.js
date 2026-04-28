import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Dimensions, Animated, Platform, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNavBar from '../components/BottomNavBar';
import { Audio } from 'expo-av';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

const { width } = Dimensions.get('window');

const THEME_COLOR    = '#2D7D46';
const THEME_DARK     = '#1E5C33';
const THEME_LIGHT    = '#4CAF72';
const THEME_SURFACE  = '#EAF4EC';
const BACKGROUND     = '#F7FAF8';
const TEXT_PRIMARY   = '#141F17';
const TEXT_SECONDARY = '#5A6E60';

// ─── Symptom names EXACTLY match recommender_api_symptom DB entries ───────────
// DB names (from CSV): Fatigue, Weight Loss, Restlessness, Lethargy, High Fever,
// Chills, Mild Fever, Malaise, Phlegm, Sweating, Vomiting, Indigestion,
// Constipation, Abdominal Pain, Diarrhoea, Nausea, Acidity, Stomach Pain,
// Distention of Abdomen, Swelling of Stomach, Itching, Skin Rash,
// Nodal Skin Eruptions, Dischromic Patches, Yellowish Skin, Bruising,
// Brittle Nails, Pus Filled Pimples, Blackheads, Scurrying,
// Inflammatory Nails, Continuous Sneezing, Cough, Breathlessness,
// Throat Irritation, Fast Heart Rate, Chest Pain, Sinus Pressure,
// Runny Nose, Congestion, Joint Pain, Headache, Back Pain, Neck Pain,
// Muscle Pain, Stiff Neck, Knee Pain, Hip Joint Pain, Muscle Weakness,
// Muscle Wasting
// ─────────────────────────────────────────────────────────────────────────────
const SYMPTOM_CATEGORIES = [
  {
    title: 'General & Fever', icon: '🌡️', color: '#FFF4E5',
    data: ['Fatigue', 'Weight Loss', 'Restlessness', 'Lethargy', 'High Fever', 'Chills', 'Mild Fever', 'Malaise', 'Phlegm', 'Sweating']
  },
  {
    title: 'Digestive', icon: '🥣', color: '#E3F2FD',
    data: ['Vomiting', 'Indigestion', 'Constipation', 'Abdominal Pain', 'Diarrhoea', 'Nausea', 'Acidity', 'Stomach Pain', 'Distention of Abdomen', 'Swelling of Stomach']
  },
  {
    title: 'Skin & External', icon: '✨', color: '#F3E5F5',
    data: ['Itching', 'Skin Rash', 'Nodal Skin Eruptions', 'Yellowish Skin', 'Bruising', 'Brittle Nails', 'Pus Filled Pimples', 'Blackheads', 'Inflammatory Nails']
  },
  {
    title: 'Respiratory', icon: '🫁', color: '#E8F5E9',
    data: ['Continuous Sneezing', 'Cough', 'Breathlessness', 'Throat Irritation', 'Fast Heart Rate', 'Chest Pain', 'Sinus Pressure', 'Runny Nose', 'Congestion']
  },
  {
    title: 'Pain & Muscles', icon: '💪', color: '#FFEBEE',
    data: ['Joint Pain', 'Headache', 'Back Pain', 'Neck Pain', 'Muscle Pain', 'Stiff Neck', 'Knee Pain', 'Hip Joint Pain', 'Muscle Weakness', 'Muscle Wasting']
  }
];


const InputScreen = ({ navigation }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [isGuestMode, setIsGuestMode]           = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isListening, setIsListening] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Clean up recording if unmounted
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const startVoiceInput = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert("Permission Denied", "Microphone access is required for voice input.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsListening(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Could not start recording.");
      setIsListening(false);
    }
  };

  const stopVoiceInput = async () => {
    if (!recording) return;
    setIsListening(false);
    setIsProcessingVoice(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // Prepare file for upload
      let formData = new FormData();
      formData.append('audio', {
        uri: uri,
        type: 'audio/m4a',
        name: 'voice.m4a',
      });

      const response = await axios.post(`${API_BASE_URL}/voice-symptom/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });

      const data = response.data;
      if (data.symptoms && data.symptoms.length > 0) {
        let addedCount = 0;
        data.symptoms.forEach(symptom => {
          const allSymptoms = SYMPTOM_CATEGORIES.flatMap(cat => cat.data);
          const properCasing = allSymptoms.find(s => s.toLowerCase() === symptom.toLowerCase());
          
          if (properCasing) {
            setSelectedSymptoms(prev => {
              if (prev.includes(properCasing)) return prev;
              if (prev.length >= MAX_SYMPTOMS) return prev;
              addedCount++;
              return [...prev, properCasing];
            });
          }
        });
        
        if (addedCount > 0) {
          Alert.alert("Symptoms Detected", `I understood: ${data.symptoms.join(', ')}`);
        } else {
          Alert.alert("Unrecognized", `I heard: ${data.transcription || 'something'}, but it didn't match our allowed symptom list.`);
        }
      } else {
        Alert.alert("Unrecognized", "I couldn't match your speech to any supported Ayurvedic symptoms. Please try again or select manually.");
      }

    } catch (err) {
      console.error("Voice processing error", err);
      if (err.response && err.response.data && err.response.data.error) {
        Alert.alert("Error", err.response.data.error);
      } else {
        Alert.alert("Error", "Failed to process voice input. Check your connection.");
      }
    } finally {
      setIsProcessingVoice(false);
    }
  };

  useEffect(() => {
    const checkGuestStatus = async () => {
      const guestFlag = await AsyncStorage.getItem('isGuest');
      if (guestFlag === 'true') setIsGuestMode(true);
    };
    checkGuestStatus();
  }, []);

  const MAX_SYMPTOMS = 4;

  const toggleSymptom = (name) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(name)) return prev.filter(s => s !== name);
      if (prev.length >= MAX_SYMPTOMS) {
        Alert.alert(
          "Limit Reached",
          `You can select up to ${MAX_SYMPTOMS} symptoms at a time for an accurate Ayurvedic analysis.`
        );
        return prev;
      }
      return [...prev, name];
    });
  };

  // ── FIX: pass symptoms as ARRAY (not joined string) ──────────────────────
  // Also read dosha + userName from AsyncStorage so ResultsScreen has them
  const handleAnalysis = async () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("No Selection", "Please select at least one symptom to run the analysis.");
      return;
    }
    const userName = await AsyncStorage.getItem('userName') || '';
    const dosha    = await AsyncStorage.getItem('userDosha')
                  || await AsyncStorage.getItem('userPrakriti')
                  || 'Unknown';

    navigation.navigate('Results', {
      symptoms: selectedSymptoms,   // ← array, not joined string
      isGuest:  isGuestMode,
      userName,
      dosha,
    });
  };



  return (
    <SafeAreaView style={styles.mainContainer} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>
            {isGuestMode ? "Family Health" : "Symptom Check"}
          </Text>
          {selectedSymptoms.length > 0 && (
            <View style={[styles.selectionBadge, selectedSymptoms.length === MAX_SYMPTOMS && styles.selectionBadgeFull]}>
              <Text style={styles.badgeText}>{selectedSymptoms.length}/{MAX_SYMPTOMS} Selected</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => setSelectedSymptoms([])} disabled={selectedSymptoms.length === 0}>
          <Text style={[styles.clearText, { opacity: selectedSymptoms.length > 0 ? 1 : 0 }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* ── VOICE INPUT BAR ── */}
      <View style={styles.voiceContainer}>
        <TouchableOpacity
          style={[styles.voiceButton, isListening && styles.voiceButtonRecording]}
          onPress={isProcessingVoice ? null : (isListening ? stopVoiceInput : startVoiceInput)}
        >
          {isProcessingVoice ? (
            <Text style={styles.voiceIcon}>⏳</Text>
          ) : (
            <Text style={styles.voiceIcon}>{isListening ? '⏹' : '🎤'}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.voiceHelperText}>
          {isProcessingVoice 
            ? "Analyzing speech..." 
            : isListening ? "Listening... tap to stop" : "Tap to speak your symptoms"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.instructionText}>
          Select up to <Text style={styles.limitHighlight}>4 symptoms</Text> you are experiencing for a personalized Ayurvedic insight.
        </Text>

        {SYMPTOM_CATEGORIES.map((category) => (
          <View key={category.title} style={styles.sectionWrapper}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: category.color }]}>
                <Text style={{ fontSize: 16 }}>{category.icon}</Text>
              </View>
              <Text style={styles.sectionTitle}>{category.title}</Text>
            </View>

            <View style={styles.chipGrid}>
              {category.data.map((item) => {
                const isSelected = selectedSymptoms.includes(item);
                const isDisabled = !isSelected && selectedSymptoms.length >= MAX_SYMPTOMS;
                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.6}
                    style={[styles.chip, isSelected && styles.chipActive, isDisabled && styles.chipDisabled]}
                    onPress={() => toggleSymptom(item)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive, isDisabled && styles.chipTextDisabled]}>
                      {item}
                    </Text>
                    {isSelected && <Text style={styles.checkIcon}> ✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ── ANALYSIS BUTTON BAR ── */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          style={[styles.predictButton, selectedSymptoms.length === 0 && styles.disabledButton]}
          onPress={handleAnalysis}
          activeOpacity={0.9}
        >
          <Text style={styles.predictButtonText}>Run Ayurvedic Analysis</Text>
          <Text style={styles.buttonSubText}>AI-Powered Insights</Text>
        </TouchableOpacity>
      </View>

      <BottomNavBar navigation={navigation} activeScreen={isGuestMode ? "Family" : ""} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: BACKGROUND },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  iconButton:  { width: 40, height: 40, justifyContent: 'center' },
  backArrow:   { fontSize: 26, color: TEXT_PRIMARY, fontWeight: '300' },
  titleArea:   { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: TEXT_PRIMARY },
  selectionBadge: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: 10, marginTop: 4,
  },
  selectionBadgeFull: { backgroundColor: THEME_DARK },
  badgeText:  { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  clearText:  { color: '#E53935', fontSize: 14, fontWeight: '600', width: 50, textAlign: 'right' },

  voiceContainer:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  voiceButton:          { width: 50, height: 50, borderRadius: 25, backgroundColor: THEME_COLOR, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  voiceButtonRecording: { backgroundColor: '#E53935' },
  voiceIcon:            { fontSize: 24, color: '#FFF' },
  voiceHelperText:      { marginLeft: 15, fontSize: 14, color: TEXT_SECONDARY, fontWeight: '600' },

  scrollContent:   { padding: 20 },
  instructionText: { fontSize: 13, color: TEXT_SECONDARY, marginBottom: 22, lineHeight: 22 },
  limitHighlight:  { color: THEME_DARK, fontWeight: '700' },

  sectionWrapper: { marginBottom: 28 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconCircle:     { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  sectionTitle:   { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, letterSpacing: 0.3 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5, borderColor: '#EBEBEB',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14, marginRight: 8, marginBottom: 10,
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 5, elevation: 2,
  },
  chipActive:       { backgroundColor: THEME_COLOR, borderColor: THEME_COLOR },
  chipDisabled:     { opacity: 0.38, elevation: 0 },
  chipText:         { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '500' },
  chipTextActive:   { color: '#FFF', fontWeight: 'bold' },
  chipTextDisabled: { color: TEXT_SECONDARY },
  checkIcon:        { color: '#FFF', fontSize: 12 },

  bottomOverlay: {
    position: 'absolute',
    bottom: 90, width: '100%', paddingHorizontal: 20,
  },
  predictButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 16, borderRadius: 18, alignItems: 'center',
    shadowColor: THEME_DARK, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30, shadowRadius: 18, elevation: 8,
  },
  disabledButton:    { backgroundColor: '#B0C4B8', shadowOpacity: 0 },
  predictButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  buttonSubText:     { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
});

export default InputScreen;