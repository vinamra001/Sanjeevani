# Sanjeevani - Smart Ayurvedic Assistant
## Complete Project Summary & Architecture Report

**Sanjeevani** is a comprehensive, AI-powered holistic wellness mobile application bridging ancient Ayurvedic principles with state-of-the-art modern technology (Google Gemini). 

---

### 🛠️ Technology Stack
*   **Frontend**: React Native (Expo framework)
*   **Backend API**: Python (Django Framework with Django REST framework)
*   **Database**: SQLite (Local persistence for app configuration and simple relational data)
*   **Local Storage**: AsyncStorage (Caching offline AI models and user history on mobile)
*   **AI Engine**: Google GenAI (`gemini-2.0-flash` and `gemini-1.5-flash` for multimodal inferences)
*   **Networking**: Axios for frontend-backend REST communication over local Wi-Fi.

---

### 🌟 The 11 Advanced Core Features

Over the course of this project, we systematically built out and integrated a suite of highly complex, interconnected features. Every single feature possesses its own custom React Native UI screen successfully wired to a bespoke Python Django API view.

#### 1. Voice Symptom Analyzer
*   **Concept:** Allows patients to speak their symptoms instead of typing.
*   **How it Works:** The frontend captures audio via `expo-av`, sends the Base64 audio string to the backend, which parses it using Google `SpeechRecognition` to automatically match and select diagnostic symptons.

#### 2. AI Meal Planner
*   **Concept:** Generates a personalized 7-day Ayurvedic diet plan.
*   **How it Works:** Sends the user's analyzed Dosha to the backend, prompting Gemini to calculate exact macro-balanced meals aligned with Vata, Pitta, or Kapha dominance.

#### 3. AR Herb Identifier
*   **Concept:** Users scan plants in the real world to detect Ayurvedic properties.
*   **How it Works:** The mobile camera (`expo-image-picker`) converts images to strings, sending them to the backend where Gemini Vision structurally compares the image against a local `HERB_DB` database, outputting scientific names and medicinal uses in formatted JSON.

#### 4. Health Score Ring
*   **Concept:** A gamified "Holistic Wellness" score out of 100.
*   **How it Works:** Aggregates the user's historical diagnosis data and pulse checks, calculating a dynamic overall metric and persistently storing it in the SQLite database via `HealthScoreView`.

#### 5. Family Profiles
*   **Concept:** Manage the Doshas and histories of entire households.
*   **How it Works:** Users can create and swap between different profiles using `FamilyMembersSyncView`, meaning one smartphone app can safely hold records for a mother, father, and child.

#### 6. Community Forum
*   **Concept:** A social sharing platfrom for Ayurvedic herbs and remedies.
*   **How it Works:** The `ForumPostsView` handles a fully functional CRUD interface, storing community-generated remedies with an upvote scoring system.

#### 7. Daily Pulse Check & Smart Notifications
*   **Concept:** Daily check-ins for Dosha alignment and app reminders.
*   **How it Works:** Simple user-engagement tools stored with fast local storage.

#### 8. Panchakarma Planner
*   **Concept:** Detox program scheduling.
*   **How it Works:** Instructs users on the 5-step detoxification procedure dynamically mapped to their body constitution.

#### 9. Offline AI Chatbot
*   **Concept:** Receive instant Ayurvedic remedies when disconnected from WiFi.
*   **How it Works:** The frontend downloads a compressed Knowledge-Graph dictionary from `OfflineChatSyncView` when online. When offline, it runs a blazing-fast local keyword-mapping algorithm to chat dynamically without backend latency.

#### 10. Seasonal Ritu Guide
*   **Concept:** Auto-adjusts lifestyle and diet recommendations based on the current season.
*   **How it Works:** The Django backend calculates the active Ayurvedic Ritu (e.g., *Grishma*, *Vasant*, *Sharad*) based on the server calendar, returning exactly what foods to heavily favor and strictly avoid.

#### 11. Vedic Astro + Ayurveda
*   **Concept:** Combines astrological birth charts with physical Doshas.
*   **How it Works:** The user submits their birth Date, Time, and City. Gemini processes this cosmological data to calculate their Astrological Sign, Ruling Planet, and recommends specific specific protective Gemstones and Mantras.

---

### 🎯 Final Architecture Flow
1. **AppNavigator.js** manages the central routing tree of all 11 unique screens.
2. **HomeScreen.js** acts as the central hub, verifying returning users against `AsyncStorage` and mapping them to their saved Dosha.
3. **recommender_api/urls.py** provides local endpoints under the prefix `http://192.168.0.114:8000/api/v1/`.
4. **recommender_api/views.py** safely executes all AI inferences behind a robust error-catching boundary to prevent mobile crashes!
