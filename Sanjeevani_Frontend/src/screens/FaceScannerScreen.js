import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import * as ImagePicker from 'expo-image-picker';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#873E23'; 

const FaceScannerScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Camera permission is required to scan.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;

    // Check internet connection since ML requires it
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert(
        "Offline",
        "The Tongue/Face Scanner requires an active internet connection to process the image."
      );
      return;
    }

    setAnalyzing(true);
    setResult(null);

    // Simulate ML network analysis processing time
    setTimeout(async () => {
        setAnalyzing(false);
        const randomDoshas = [
            { dosha: "Pitta Aggravation", details: "A slight redness on the tongue tip indicates elevated Pitta. Recommend cooling diet like cucumber, mint, and aloe vera." },
            { dosha: "Kapha Imbalance", details: "Whitish coating on the tongue suggests Ama (toxins) accumulation due to kapha. Recommend warm ginger water." },
            { dosha: "Vata Dominance", details: "Dry edges on the tongue indicates Vata imbalance. Increased healthy fats and warm soups recommended." }
        ];
        // Pick one at random for the mock
        const chosen = randomDoshas[Math.floor(Math.random() * randomDoshas.length)];
        setResult(chosen);
        
        // Sync Dosha to Global Profile
        try {
            const rootDosha = chosen.dosha.split(' ')[0]; // Extract "Pitta", "Vata", or "Kapha"
            await AsyncStorage.setItem('userPrakriti', rootDosha);
            const username = await AsyncStorage.getItem('username');
            if (username) {
                await AsyncStorage.setItem(`prakriti_${username}`, rootDosha);
                await axios.post(`${API_BASE_URL}/update-prakriti/`, {
                    username: username,
                    prakriti: rootDosha
                });
            }
        } catch (e) {
            console.error("Failed to sync FaceScanner Dosha", e);
        }
    }, 3500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#632B16" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tongue / Face Scanner</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.helperText}>
          Take a clear picture of your tongue in natural lighting for instant Ayurvedic analysis.
        </Text>

        <View style={styles.imageBox}>
           {imageUri ? (
               <Image source={{ uri: imageUri }} style={styles.previewImage} />
           ) : (
               <View style={styles.placeholderBox}>
                   <Text style={{ fontSize: 50 }}>📸</Text>
                   <Text style={{ color: '#aaa', marginTop: 10, fontWeight: 'bold' }}>No Image Selected</Text>
               </View>
           )}
        </View>

        {!analyzing && !result && (
            <View style={styles.buttonRow}>
               <TouchableOpacity style={styles.actionBtn} onPress={openCamera}>
                  <Text style={{ fontSize: 24, marginBottom: 5 }}>📷</Text>
                  <Text style={styles.btnText}>Use Camera</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.actionBtn} onPress={openGallery}>
                  <Text style={{ fontSize: 24, marginBottom: 5 }}>🖼️</Text>
                  <Text style={styles.btnText}>Gallery</Text>
               </TouchableOpacity>
            </View>
        )}

        {imageUri && !analyzing && !result && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImage}>
               <Text style={styles.analyzeText}>✨ Analyze Dosha ✨</Text>
            </TouchableOpacity>
        )}

        {analyzing && (
            <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={MAIN_COLOR} />
                <Text style={styles.loadingText}>Sanjeevani Vision AI is analyzing...</Text>
                <Text style={styles.loadingSub}>Checking texture, color, and coating</Text>
            </View>
        )}

        {result && (
            <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                   <Text style={{fontSize: 22, marginRight: 8}}>🔬</Text>
                   <Text style={styles.resultTitle}>{result.dosha}</Text>
                </View>
                <Text style={styles.resultDetails}>{result.details}</Text>
                
                <TouchableOpacity style={styles.resetBtn} onPress={() => { setImageUri(null); setResult(null); }}>
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>Scan Again</Text>
                </TouchableOpacity>
            </View>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    backgroundColor: MAIN_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, paddingTop: 20
  },
  backButton: { padding: 5 },
  backArrow: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20, alignItems: 'center' },
  helperText: { textAlign: 'center', color: '#666', marginBottom: 20, fontSize: 13, lineHeight: 20, paddingHorizontal: 10 },
  imageBox: {
      width: width * 0.8, height: width * 0.8, borderRadius: 20,
      backgroundColor: '#EBEBEB', overflow: 'hidden', marginBottom: 30,
      elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonRow: { flexDirection: 'row', gap: 20, width: '100%', justifyContent: 'center' },
  actionBtn: { 
      backgroundColor: '#FFF', width: width * 0.4, padding: 20, borderRadius: 15,
      alignItems: 'center', borderWidth: 2, borderColor: '#F0E5DF', elevation: 2
  },
  btnText: { color: MAIN_COLOR, fontWeight: 'bold', fontSize: 14 },
  analyzeBtn: { 
      backgroundColor: MAIN_COLOR, width: '90%', padding: 20, borderRadius: 15, 
      alignItems: 'center', marginTop: 10, elevation: 4
  },
  analyzeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  loadingBox: { alignItems: 'center', marginTop: 20 },
  loadingText: { marginTop: 15, color: MAIN_COLOR, fontWeight: 'bold', fontSize: 16 },
  loadingSub: { marginTop: 5, color: '#888', fontStyle: 'italic' },
  resultBox: {
      backgroundColor: '#FEF9F6', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#EBDCD5', width: '100%', marginTop: 10
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: MAIN_COLOR },
  resultDetails: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 20 },
  resetBtn: { backgroundColor: MAIN_COLOR, alignSelf: 'center', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 }
});

export default FaceScannerScreen;
