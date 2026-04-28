// ─────────────────────────────────────────────────────────────────────────────
// ADD to src/navigation/AppNavigator.js
// ─────────────────────────────────────────────────────────────────────────────

// Step 1 — Add these 5 imports with your other screen imports:
import FamilyProfilesScreen    from '../screens/FamilyProfilesScreen';
import AIMealPlannerScreen     from '../screens/AIMealPlannerScreen';
import ARHerbIdentifierScreen  from '../screens/ARHerbIdentifierScreen';
import HealthScoreRingScreen   from '../screens/HealthScoreRingScreen';
import CommunityForumScreen    from '../screens/CommunityForumScreen';

// Step 2 — Add these 5 Stack.Screen entries inside AppStack():
<Stack.Screen name="FamilyProfiles"   component={FamilyProfilesScreen} />
<Stack.Screen name="AIMealPlanner"    component={AIMealPlannerScreen} />
<Stack.Screen name="ARHerbIdentifier" component={ARHerbIdentifierScreen} />
<Stack.Screen name="HealthScoreRing"  component={HealthScoreRingScreen} />
<Stack.Screen name="CommunityForum"   component={CommunityForumScreen} />

// Step 3 — Install one new package (for ARHerbIdentifier camera):
// Run in your Sanjeevani_Frontend folder:
//   expo install expo-image-picker
//   (expo-print and expo-sharing already installed ✓)

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Add navigation calls to HomeScreen or ProfileScreen as needed:
// ─────────────────────────────────────────────────────────────────────────────
// navigation.navigate('FamilyProfiles',   { userName: displayName })
// navigation.navigate('AIMealPlanner',    { dosha, userName: displayName })
// navigation.navigate('ARHerbIdentifier', { lang })
// navigation.navigate('HealthScoreRing',  { userName: displayName, dosha })
// navigation.navigate('CommunityForum',   { userName: displayName, dosha })
