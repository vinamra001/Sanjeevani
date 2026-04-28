import sqlite3
import pandas as pd
import json
import os

def import_ayurveda_data():
    db_name = 'db.sqlite3'
    
    # 1. Connect and Clear Existing Data
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    tables = [
        "recommender_api_disease", 
        "recommender_api_remedy", 
        "recommender_api_symptom",
        "recommender_api_disease_symptoms",
        "recommender_api_disease_remedies"
    ]
    
    print("🧹 Clearing existing data...")
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
    
    # 2. Import CSV Files (Disease, Remedy, Disease_Remedies)
    print("csv Importing CSV files...")
    csv_files = {
        "recommender_api_disease": "recommender_api_disease.csv",
        "recommender_api_remedy": "recommender_api_remedy.csv",
        "recommender_api_disease_remedies": "recommender_api_disease_remedies.csv"
    }
    
    for table, file in csv_files.items():
        if os.path.exists(file):
            df = pd.read_csv(file)
            df.to_sql(table, conn, if_exists='replace', index=False)
            print(f"✅ Imported {len(df)} rows into {table}")

    # 3. Import JSON Files (Symptoms and Mappings)
    json_files = {
        "recommender_api_symptom": "recommender_api_symptom.json",
        "recommender_api_disease_symptoms": "recommender_api_disease_symptoms.json"
    }

    for table, file in json_files.items():
        if os.path.exists(file):
            with open(file, 'r') as f:
                data = json.load(f)
            
            # Flatten the 'name' array into a string for SQLite compatibility
            flattened_data = []
            for entry in data:
                new_entry = entry.copy()
                if 'name' in new_entry and isinstance(new_entry['name'], list):
                    new_entry['name'] = ", ".join(new_entry['name'])
                flattened_data.append(new_entry)
            
            df_json = pd.DataFrame(flattened_data)
            df_json.to_sql(table, conn, if_exists='replace', index=False)
            print(f"✅ Imported {len(df_json)} rows into {table}")

    # 4. Create Performance Indexes
    print("🚀 Optimizing database with indexes...")
    cursor.execute("CREATE INDEX idx_disease_id ON recommender_api_disease_symptoms(disease_id)")
    cursor.execute("CREATE INDEX idx_symptom_id ON recommender_api_disease_symptoms(symptom_id)")
    
    conn.commit()
    conn.close()
    print("🎉 All 2.5 Lakh records imported successfully!")

if __name__ == "__main__":
    import_ayurveda_data()