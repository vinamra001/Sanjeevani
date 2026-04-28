import os
import django
import sqlite3

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import Symptom, Disease, Remedy, SymptomDiseaseMapping

def sync_sqlite():
    print("--- Syncing MongoDB Data to Offline SQLite (db.sqlite3) ---")
    
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    # Drop old tables
    cursor.executescript("""
        DROP TABLE IF EXISTS disease_symptoms_local;
        DROP TABLE IF EXISTS disease_remedies_local;
        DROP TABLE IF EXISTS symptoms_local;
        DROP TABLE IF EXISTS remedies_local;
        DROP TABLE IF EXISTS diseases_local;
        DROP TABLE IF EXISTS symptom_combination_local;
    """)

    # Create tables
    cursor.executescript("""
        CREATE TABLE symptoms_local (
            id INTEGER PRIMARY KEY,
            name TEXT,
            category TEXT
        );
        CREATE TABLE remedies_local (
            id INTEGER PRIMARY KEY,
            name TEXT,
            sanskrit_name TEXT,
            description TEXT,
            dosage TEXT,
            preparation TEXT,
            usage_instructions TEXT
        );
        CREATE TABLE diseases_local (
            id INTEGER PRIMARY KEY,
            name TEXT,
            sanskrit_name TEXT,
            description TEXT,
            dosha_type TEXT,
            diet_plan TEXT,
            foods_to_take TEXT,
            foods_to_avoid TEXT,
            lifestyle_routine TEXT,
            recommended_exercises TEXT
        );
        CREATE TABLE disease_symptoms_local (
            disease_id INTEGER,
            symptom_id INTEGER
        );
        CREATE TABLE disease_remedies_local (
            disease_id INTEGER,
            remedy_id INTEGER
        );
        CREATE TABLE symptom_combination_local (
            combo_key TEXT PRIMARY KEY,
            disease_name TEXT
        );
    """)

    # Insert Data
    print("Importing Symptoms...")
    for sym in Symptom.objects.all():
        cursor.execute("INSERT INTO symptoms_local (id, name, category) VALUES (?, ?, ?)", 
                       (sym.id, sym.name, sym.category))

    print("Importing Remedies...")
    for rem in Remedy.objects.all():
        cursor.execute("INSERT INTO remedies_local (id, name, sanskrit_name, description, dosage, preparation, usage_instructions) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (rem.id, rem.name, rem.sanskrit_name, rem.description, rem.dosage, rem.preparation, rem.usage_instructions))

    print("Importing Diseases and Links...")
    for dis in Disease.objects.all():
        cursor.execute("INSERT INTO diseases_local (id, name, sanskrit_name, description, dosha_type, diet_plan, foods_to_take, foods_to_avoid, lifestyle_routine, recommended_exercises) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                       (dis.id, dis.name, dis.sanskrit_name, dis.description, dis.dosha_type, dis.diet_plan, dis.foods_to_take, dis.foods_to_avoid, dis.lifestyle_routine, dis.recommended_exercises))
        
        for s in dis.symptoms.all():
            cursor.execute("INSERT INTO disease_symptoms_local (disease_id, symptom_id) VALUES (?, ?)", 
                           (dis.id, s.id))
                           
        for r in dis.remedies.all():
            cursor.execute("INSERT INTO disease_remedies_local (disease_id, remedy_id) VALUES (?, ?)", 
                           (dis.id, r.id))

    print("Importing 2.5 Lakh Exact Parity Mappings...")
    mappings = []
    # Fast pull from Django ORM avoiding massive memory spike
    for mapping in SymptomDiseaseMapping.objects.all().iterator(chunk_size=10000):
        mappings.append((mapping.symptoms_combo_key, mapping.disease_name))
        
    cursor.executemany("INSERT INTO symptom_combination_local (combo_key, disease_name) VALUES (?, ?)", mappings)

    conn.commit()
    conn.close()
    print("SQLite Local Database populated successfully.")

    print("--- Retraining ML Model ---")
    try:
        from recommender_api.ml_engine import AyurvedicML
        import shutil
        if os.path.exists('ayurveda_model.pkl'):
            os.remove('ayurveda_model.pkl')
        ml = AyurvedicML()
        ml.train()
        print("ML Model Retrained Successfully.")
    except Exception as e:
        print(f"ML Train Warning: {e}")

if __name__ == '__main__':
    sync_sqlite()
