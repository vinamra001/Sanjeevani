import os
import django
import csv
import sqlite3

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import Symptom, Disease, Remedy

def run():
    print("--- 1. Flushing MongoDB Data ---")
    Symptom.objects.all().delete()
    Disease.objects.all().delete()
    Remedy.objects.all().delete()
    print("MongoDB tables flushed.")

    symptoms_dict = {}
    diseases_dict = {}
    remedies_dict = {}

    print("--- 2. Reading CSVs and Populating MongoDB ---")
    # Read Symptoms
    with open('recommender_api_symptom.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            s_id = int(row['id'])
            # Deal with name[0] column
            s_name = row.get('name[0]') or row.get('name')
            s_cat = row.get('category', '')
            sym = Symptom.objects.create(name=s_name, category=s_cat)
            symptoms_dict[s_id] = sym

    # Read Remedies
    with open('recommender_api_remedy.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            r_id = int(row['id'])
            rem = Remedy.objects.create(
                name=row['name'],
                sanskrit_name=row['sanskrit_name'],
                description=row['description'],
                dosage=row['dosage'],
                preparation=row['preparation'],
                usage_instructions=row['usage_instructions']
            )
            remedies_dict[r_id] = rem

    # Read Diseases
    with open('recommender_api_disease.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_id = int(row['id'])
            dis = Disease.objects.create(
                name=row['name'],
                sanskrit_name=row['sanskrit_name'],
                description=row['description'],
                dosha_type=row['dosha_type'],
                diet_plan=row.get('diet', '') or row.get('diet_plan', '')
            )
            diseases_dict[d_id] = dis

    # Link Disease-Symptoms
    with open('recommender_api_disease_symptoms.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_id = int(row['disease_id'])
            s_id = int(row['symptom_id'])
            if d_id in diseases_dict and s_id in symptoms_dict:
                diseases_dict[d_id].symptoms.add(symptoms_dict[s_id])

    # Link Disease-Remedies
    with open('recommender_api_disease_remedies.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            d_id = int(row['disease_id'])
            r_id = int(row['remedy_id'])
            if d_id in diseases_dict and r_id in remedies_dict:
                diseases_dict[d_id].remedies.add(remedies_dict[r_id])

    print(f"MongoDB Populated: {len(symptoms_dict)} Symptoms, {len(diseases_dict)} Diseases, {len(remedies_dict)} Remedies.")

    print("--- 3. Populating SQLite Fallback (db.sqlite3) ---")
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    # Drop old tables if exist
    cursor.executescript("""
        DROP TABLE IF EXISTS disease_symptoms_local;
        DROP TABLE IF EXISTS disease_remedies_local;
        DROP TABLE IF EXISTS symptoms_local;
        DROP TABLE IF EXISTS remedies_local;
        DROP TABLE IF EXISTS diseases_local;
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
            diet_plan TEXT
        );
        CREATE TABLE disease_symptoms_local (
            disease_id INTEGER,
            symptom_id INTEGER
        );
        CREATE TABLE disease_remedies_local (
            disease_id INTEGER,
            remedy_id INTEGER
        );
    """)

    # Insert Data
    for s_id, sym in symptoms_dict.items():
        cursor.execute("INSERT INTO symptoms_local (id, name, category) VALUES (?, ?, ?)", 
                       (s_id, sym.name, sym.category))

    for r_id, rem in remedies_dict.items():
        cursor.execute("INSERT INTO remedies_local (id, name, sanskrit_name, description, dosage, preparation, usage_instructions) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (r_id, rem.name, rem.sanskrit_name, rem.description, rem.dosage, rem.preparation, rem.usage_instructions))

    for d_id, dis in diseases_dict.items():
        cursor.execute("INSERT INTO diseases_local (id, name, sanskrit_name, description, dosha_type, diet_plan) VALUES (?, ?, ?, ?, ?, ?)",
                       (d_id, dis.name, dis.sanskrit_name, dis.description, dis.dosha_type, dis.diet_plan))

    with open('recommender_api_disease_symptoms.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute("INSERT INTO disease_symptoms_local (disease_id, symptom_id) VALUES (?, ?)", 
                           (int(row['disease_id']), int(row['symptom_id'])))

    with open('recommender_api_disease_remedies.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute("INSERT INTO disease_remedies_local (disease_id, remedy_id) VALUES (?, ?)", 
                           (int(row['disease_id']), int(row['remedy_id'])))

    conn.commit()
    conn.close()
    print("SQLite Local Database populated successfully.")
    
    # 3b. Force retrain ML Model to guarantee it works online
    print("--- 4. Retraining ML Model ---")
    try:
        from recommender_api.ml_engine import AyurvedicML
        ml = AyurvedicML()
        if os.path.exists('ayurveda_model.pkl'):
            os.remove('ayurveda_model.pkl')
        ml.train()
        print("ML Model Retrained Successfully.")
    except Exception as e:
        print(f"ML Train Warning: {e}")

    print("\n--- ALL DONE! ---")

if __name__ == '__main__':
    run()
