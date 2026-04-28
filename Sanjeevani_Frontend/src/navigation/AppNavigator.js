import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// --- SCREEN IMPORTS ---
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import InputScreen from "../screens/InputScreen";
import ResultsScreen from "../screens/ResultsScreen";
import BlogScreen from "../screens/BlogScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import DiseaseDetailsScreen from "../screens/DiseaseDetailsScreen";
import RemedyDetailScreen from "../screens/RemedyDetailScreen";
import GeneratePrescriptionScreen from "../screens/GeneratePrescriptionScreen";
import MorningRoutineScreen from "../screens/MorningRoutineScreen";
import DietRecommendationsScreen from "../screens/DietRecommendationsScreen";
import AyurvedicRemediesScreen from "../screens/AyurvedicRemediesScreen";
import DietDetailsScreen from "../screens/DietDetailsScreen";
import MindfulLivingScreen from "../screens/MindfulLivingScreen";
import DoshaQuizScreen from "../screens/DoshaQuizScreen";
import AboutScreen from "../screens/AboutScreen";
import FamilyProfilesScreen from "../screens/FamilyProfilesScreen";
import ARHerbIdentifierScreen from "../screens/ARHerbIdentifierScreen";
import HealthScoreRingScreen from "../screens/HealthScoreRingScreen";
import CommunityForumScreen from "../screens/CommunityForumScreen";
import DailyPulseCheckScreen from "../screens/DailyPulseCheckScreen";
import SmartNotificationsScreen from "../screens/SmartNotificationsScreen";
import PanchakarmaPlanner from "../screens/PanchakarmaPlanner";
import SeasonalRituScreen from "../screens/SeasonalRituScreen";
import VedicAstroScreen from "../screens/VedicAstroScreen";
import FaceScannerScreen from "../screens/FaceScannerScreen";
import ClinicFinderScreen from "../screens/ClinicFinderScreen";
import WearableIntegrationScreen from "../screens/WearableIntegrationScreen";
const THEME_COLOR = "#2D7D46";
const Stack = createNativeStackNavigator();

// --- SPLASH SCREEN ---
const SplashScreen = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View style={splashStyles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <Animated.View style={[splashStyles.content, { opacity: fadeAnim }]}>
        <View style={splashStyles.logoCircle}>
          <Text style={splashStyles.logoEmoji}>🌿</Text>
        </View>
        <Text style={splashStyles.brandName}>SANJEEVANI</Text>
        <Text style={splashStyles.tagline}>Smart Ayurvedic Assistant</Text>
      </Animated.View>
    </View>
  );
};

// --- APP STACK ---
function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "default" : "slide_from_right",
        contentStyle: { backgroundColor: "#F8FAF8" },
      }}
    >
      {/* --- AUTH & SPLASH --- */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* --- MAIN DASHBOARD --- */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* --- CORE AI & DIAGNOSIS --- */}
      <Stack.Screen name="Input" component={InputScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Blog" component={BlogScreen} />

      {/* --- PROFILE & SETTINGS --- */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="About" component={AboutScreen} />

      {/* --- DETAILS & REMEDIES --- */}
      <Stack.Screen
        name="AyurvedicRemedies"
        component={AyurvedicRemediesScreen}
      />
      <Stack.Screen name="RemedyDetail" component={RemedyDetailScreen} />
      <Stack.Screen name="DiseaseDetails" component={DiseaseDetailsScreen} />

      {/* --- DIET & NUTRITION --- */}
      <Stack.Screen
        name="DietRecommendations"
        component={DietRecommendationsScreen}
      />
      <Stack.Screen name="DietDetails" component={DietDetailsScreen} />

      {/* --- LIFESTYLE & UTILITIES --- */}
      <Stack.Screen name="MorningRoutine" component={MorningRoutineScreen} />
      <Stack.Screen name="MindfulLiving" component={MindfulLivingScreen} />
      <Stack.Screen
        name="GeneratePrescription"
        component={GeneratePrescriptionScreen}
      />
      <Stack.Screen name="DailyPulseCheck" component={DailyPulseCheckScreen} />
      <Stack.Screen
        name="SmartNotifications"
        component={SmartNotificationsScreen}
      />
      <Stack.Screen name="PanchakarmaPlanner" component={PanchakarmaPlanner} />

      {/* --- ADVANCED FEATURES --- */}
      <Stack.Screen name="FamilyProfiles" component={FamilyProfilesScreen} />
      <Stack.Screen
        name="ARHerbIdentifier"
        component={ARHerbIdentifierScreen}
      />
      <Stack.Screen name="HealthScoreRing" component={HealthScoreRingScreen} />
      <Stack.Screen name="CommunityForum" component={CommunityForumScreen} />
      <Stack.Screen
        name="WearableIntegration"
        component={WearableIntegrationScreen}
      />
      <Stack.Screen name="SeasonalRitu" component={SeasonalRituScreen} />
      <Stack.Screen name="VedicAstro" component={VedicAstroScreen} />
      <Stack.Screen name="FaceScanner" component={FaceScannerScreen} />
      <Stack.Screen name="ClinicFinder" component={ClinicFinderScreen} />

      {/* --- DOSHA QUIZ --- */}
      <Stack.Screen name="DoshaQuiz" component={DoshaQuizScreen} />
    </Stack.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}

// --- SPLASH STYLES ---
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { alignItems: "center" },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#F1F8E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  logoEmoji: { fontSize: 70 },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    color: THEME_COLOR,
    letterSpacing: 6,
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginTop: 8,
    letterSpacing: 1.5,
  },
});
