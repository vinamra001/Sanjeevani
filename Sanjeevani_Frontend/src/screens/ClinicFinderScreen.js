import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions, StatusBar } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const MAIN_COLOR = '#704214';

const mockClinics = [
  { id: 1, name: "Dr. Sharma's Ayurveda", latOffset: 0.005, lngOffset: 0.005, rating: '4.8 ⭐', address: 'Street 42, Green Park' },
  { id: 2, name: "Patanjali Chikitsalaya", latOffset: -0.003, lngOffset: 0.008, rating: '4.5 ⭐', address: 'Gandhi Road Clinic' },
  { id: 3, name: "Vedic Wellness Center", latOffset: 0.008, lngOffset: -0.006, rating: '4.9 ⭐', address: 'Riverside Avenue' },
  { id: 4, name: "Sanjeevani Local Herbals", latOffset: -0.007, lngOffset: -0.004, rating: '4.7 ⭐', address: 'Old City Center' },
];

const ClinicFinderScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4f2d0c" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Ayurvedic Doctors</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerMode}>
           <ActivityIndicator size="large" color={MAIN_COLOR} />
           <Text style={styles.basicText}>Locating clinics near you...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centerMode}>
           <Text style={styles.basicText}>{errorMsg}</Text>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryBtn}>
               <Text style={{color: '#fff'}}>Go Back</Text>
           </TouchableOpacity>
        </View>
      ) : (
        <MapView 
            style={styles.map} 
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
        >
            {/* Mock Clinics around the user */}
            {mockClinics.map(clinic => (
                <Marker 
                    key={clinic.id} 
                    coordinate={{ 
                        latitude: location.latitude + clinic.latOffset, 
                        longitude: location.longitude + clinic.lngOffset 
                    }}
                    pinColor="green"
                >
                    <Callout tooltip>
                       <View style={styles.calloutBox}>
                           <Text style={styles.callTitle}>{clinic.name}</Text>
                           <Text style={styles.callRating}>{clinic.rating}</Text>
                           <Text style={styles.callAddr}>{clinic.address}</Text>
                       </View>
                    </Callout>
                </Marker>
            ))}
        </MapView>
      )}
      
      {!loading && !errorMsg && (
          <View style={styles.footerOverlay}>
              <Text style={{fontSize: 14, color: '#333', fontWeight: 'bold'}}>{mockClinics.length} clinics found near your location.</Text>
          </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: MAIN_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, paddingTop: 20, elevation: 5, zIndex: 10
  },
  backButton: { padding: 5 },
  backArrow: { color: '#FFF', fontSize: 26, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  centerMode: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  basicText: { marginTop: 15, fontSize: 16, color: '#555' },
  retryBtn: { marginTop: 20, backgroundColor: MAIN_COLOR, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  map: { width: '100%', height: '100%' },
  calloutBox: {
      backgroundColor: '#fff', borderRadius: 10, padding: 10, width: 150, elevation: 4, 
      borderWidth: 1, borderColor: '#eee'
  },
  callTitle: { fontWeight: 'bold', fontSize: 14, color: MAIN_COLOR, marginBottom: 5 },
  callRating: { fontSize: 12, color: '#f39c12', marginBottom: 2 },
  callAddr: { fontSize: 11, color: '#666' },
  footerOverlay: {
      position: 'absolute', bottom: 30, left: '10%', right: '10%', backgroundColor: '#fff',
      padding: 15, borderRadius: 20, alignItems: 'center', elevation: 5,
      shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 5
  }
});

export default ClinicFinderScreen;
