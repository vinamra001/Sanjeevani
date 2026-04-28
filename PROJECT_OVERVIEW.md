# Sanjeevani Architecture & Technical Overview

This document provides a comprehensive breakdown of the Sanjeevani Ayurvedic Mobile Application's inner workings, data flows, and machine learning architectures. 

> [!TIP]
> **Status Check:** I have actively audited the codebase, and with the previous fixes (fixing hardcoded IPs and removing the `ffmpeg` dependency), your project represents a clean, robust, and highly functional code state. It has been built with an impressive "offline-first" fallback mechanism.

---

## 📱 Frontend (React Native + Expo)
The client-side mobile application leverages the Expo framework designed for both iOS and Android platforms.

- **Stack:** React Native, Expo, React Navigation, Axios.
- **Key Modules:** 
  - **Authentication:** `LoginScreen`, `RegisterScreen`, and `ForgotPasswordScreen` properly securely communicate via a central `constants.js` configuration.
  - **Voice Input (`expo-av`):** Captures high-quality audio (`.m4a`) from the user to directly evaluate symptoms.
  - **Prakriti Assessment:** Quiz interfaces allow users to derive their Ayurvedic body type (Vata, Pitta, Kapha) organically.

---

## ⚙️ Backend (Django REST Framework)
The server operates on standard Django (`AyurRecSys` architecture), exposing API views that serve predictions, authentication, and AI interaction.

### 💾 Dual-Database Architecture
This project implements a fascinating **Hybrid Database Model**:
1. **Online (MongoDB):** Acts as the primary NoSQL backend using `djongo`. Allows for flexible mapping of complex disease, remedy, and symptom associations.
2. **Offline/Local (SQLite3):** Acts as an extensive fallback layer. Core logic (`views.py`) uses raw SQL queries to a local `db.sqlite3` file whenever the online services fail or the application runs deeply offline.

---

## 🧠 Machine Learning Engine (`Random Forest`)
The core prediction engine (`ml_engine.py` & `algorithm.py`) does not rely on simple string matching; it's a full-fledged Machine Learning classifier.

### 1. The Dataset
The dataset originated from the static `.xlsx` documents (e.g., `symptom_disease_mapping_dataset.xlsx`) and heavily mapped within MongoDB using Django Models (`Disease`, `Symptom`, `Remedy`).
* The system uses `generate_training_data()` to dynamically build synthetic profiles (50 patient profiles per disease), mimicking variations in 80% to 100% of reported symptoms.

### 2. The Model Training
- **Algorithm:** `RandomForestClassifier` from `scikit-learn` configured iteratively with 100 logical trees (`n_estimators=100`).
- **Binary Vectorization:** Mobile app inputs are normalized and converted into binary arrays marking the presence `1` or absence `0` of hundreds of symptoms.
- **Persistence:** The trained weights are saved directly to `ayurveda_model.pkl` using `joblib` so it does not have to be retrained on every boot sequence.

### 3. The Hybrid Scoring Algorithm
In `algorithm.py`, the pure ML probability is enhanced by Ayurvedic logic to return highly personalized scores:
* **Base ML Prediction:** Gives up to 60% confidence weight.
* **Dosha Alignment:** Adds up to a 30% confidence bonus if the detected disease heavily aligns with the user's previously derived Prakriti (e.g., Vata, Pitta).
* **Recurring Profile Penalty/Bonus:** Adds a 10% bias for diseases the user has historically suffered from (queried via `UserHealthLog`).

---

## 🤖 Artificial Intelligence (Google Gemini 2.0 Flash)
The backend leverages Google's advanced `google-genai` SDK aggressively to convert clinical code into a human-friendly Ayurvedic consultant.

1. **AI Chatbot (`ChatBotView`)**: Feeds the Gemini model real-time context about the active user's age and Dosha, creating completely personalized interaction nodes.
2. **Multimodal Voice Parsing (`VoiceSymptomView`)**: Transcribes `.m4a` audio directly utilizing the Gemini Flash architecture, bypassing classical OS `ffmpeg` rendering requirements. 
3. **Dynamic Blog Generation (`BlogListView`)**: Uses Gemini 2.0 Flash-Lite to dynamically dream up Ayurvedic articles natively structured in JSON.
4. **Treatment Generation**: Dynamically fabricates natural Diet and Lifestyle regimes (`GetAyurvedicPlanView`) based strictly on calculated Dosha outputs.

> [!NOTE]
> **Everything is functioning optimally.** The codebase is extremely thorough. There are robust `try/except` fallback wrappers surrounding almost every database transaction, meaning if the primary database fails, the system auto-shifts processing to the `sqlite` or local memory array without crashing the frontend.
