import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

export let db = null;

export const initDatabase = async () => {
  try {
    const internalDbName = "sanjeevani_offline_master.db";
    const sqliteDir = `${FileSystem.documentDirectory}SQLite`;

    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir);
    }
    
    const dbUri = `${sqliteDir}/${internalDbName}`;
    const dbInfo = await FileSystem.getInfoAsync(dbUri);

    if (!dbInfo.exists) {
      console.log("Copying SQLite Master DB from assets...");
      const [{ localUri }] = await Asset.loadAsync(require('../../assets/sanjeevani_offline_master.db'));
      await FileSystem.copyAsync({
        from: localUri,
        to: dbUri
      });
      console.log("Offline DB successfully bundled!");
    }

    db = SQLite.openDatabaseSync(internalDbName);

    // 1. History Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS RemedyHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diseaseName TEXT NOT NULL,
        remediesJSON TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        username TEXT NOT NULL
      );
    `);

    // 2. Local Blogs Table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS LocalBlogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        author TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        emoji TEXT NOT NULL,
        readTime TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    await seedOfflineData();
    console.log("Offline DB initialization complete.");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
};

const seedOfflineData = async () => {
    // Check if we need to seed the static DB
    const firstRun = await AsyncStorage.getItem('db_seeded_v1');
    if (firstRun === 'true') return;

    try {
        // Seed Basic Blogs (Preserving static logic)
        await db.runAsync(
            `INSERT INTO LocalBlogs (title, category, author, excerpt, content, emoji, readTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['The Power of Ashwagandha', 'Herbs', 'Sanjeevani AI', 'Discover the stress-relieving properties of this ancient herb.', 'Ashwagandha is one of the most powerful herbs in Ayurveda. It helps balance the Vata and Kapha doshas, offering immense resilience against physiological and psychological stress.', '🌿', '3 min', new Date().toISOString()]
        );
        
        await db.runAsync(
            `INSERT INTO LocalBlogs (title, category, author, excerpt, content, emoji, readTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Balancing Pitta in Summer', 'Wellness', 'Dr. Ramesh', 'Stay cool and collected during the hot summer months.', 'Pitta dosha is naturally aggravated by heat. Eat cooling foods like cucumber, coconut water, and watermelon. Avoid spicy and fried foods to maintain a clear skin and calm mind.', '🌞', '4 min', new Date().toISOString()]
        );

        // Note: We no longer insert mock OfflineRemediesMap as we bundled 2.5 lakh rows into SymptomCombinationToDisease

        await AsyncStorage.setItem('db_seeded_v1', 'true');
        console.log("Database Seeded with static content.");
    } catch (e) {
        console.error("Seeding Error:", e);
    }
};

// ── Exported Utility Functions ── 

export const addHistoryEntry = async (diseaseName, remedies, username) => {
    try {
        const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        await db.runAsync(
            `INSERT INTO RemedyHistory (diseaseName, remediesJSON, timestamp, date, time, username) VALUES (?, ?, ?, ?, ?, ?)`,
            [diseaseName, JSON.stringify(remedies), new Date().toISOString(), date, time, username]
        );
    } catch (e) {
        console.error('Save history fail:', e);
    }
};

export const getHistoryByUsername = async (username) => {
    try {
        return await db.getAllAsync(`SELECT * FROM RemedyHistory WHERE username = ? ORDER BY id DESC`, [username]);
    } catch (e) {
        console.error('Get history error:', e);
        return [];
    }
};

export const getAllBlogs = async () => {
    try {
        return await db.getAllAsync(`SELECT * FROM LocalBlogs ORDER BY id DESC`);
    } catch (e) {
        console.error('Get blogs error:', e);
        return [];
    }
};

export const addLocalBlog = async (title, category, author, excerpt, content) => {
    try {
        const emoji = "✍️";
        const readTime = Math.max(1, Math.round(content.split(' ').length / 200)) + " min";
        await db.runAsync(
            `INSERT INTO LocalBlogs (title, category, author, excerpt, content, emoji, readTime, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, category, author, excerpt, content, emoji, readTime, new Date().toISOString()]
        );
    } catch (e) {
        console.error('Insert blog error:', e);
    }
};

export const queryOfflineRemedies = async (selectedSymptoms) => {
    try {
        if (!db) return [];
        
        // Exact 1-to-1 match with python backend mapping protocol
        const sortedSymptoms = [...selectedSymptoms].map(s => s.trim().toLowerCase()).sort();
        const combo_key = sortedSymptoms.join("|");

        // Query the loaded sanjeevani_offline_master.db mapping table!
        const match = await db.getFirstAsync(
            `SELECT diseaseName FROM SymptomCombinationToDisease WHERE symptoms_combo_key = ?`, 
            [combo_key]
        );

        if (match && match.diseaseName) {
            const details = await db.getFirstAsync(
                `SELECT * FROM DiseaseDetails WHERE diseaseName = ?`,
                [match.diseaseName]
            );

            if (details) {
                return [{
                    name: details.diseaseName,
                    sanskrit_name: details.sanskritName || '',
                    dosha_type: details.doshaType || 'General',
                    confidence: 99.0, // Exact offline mapping confidence
                    diet_plan: details.dietPlan || "Follow general Ayurvedic principles.",
                    match_count: selectedSymptoms.length,
                    remedies: details.remediesJSON ? JSON.parse(details.remediesJSON) : []
                }];
            }
        }
        return [];
    } catch (e) {
        console.error('Offline ML mapping error:', e);
        return [];
    }
};
