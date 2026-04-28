import sqlite3
import pandas as pd
import json
import os

def build_offline_db():
    print("Building Offline Mobile Database...")
    source_excel = "symptom_disease_mapping_dataset.xlsx"
    target_db = "sanjeevani_offline_master.db"
    
    if os.path.exists(target_db):
        os.remove(target_db)
        
    conn = sqlite3.connect(target_db)
    c = conn.cursor()
    
    # Create the optimized schema for mobile
    c.execute("""
      CREATE TABLE IF NOT EXISTS DiseaseDetails (
        diseaseName TEXT PRIMARY KEY,
        sanskritName TEXT,
        doshaType TEXT,
        dietPlan TEXT,
        remediesJSON TEXT
      );
    """)
    
    # Rather than shipping 2.5 lakh rows of JSON arrays which JS can't parse fast enough,
    # we create a strict mapping table.
    c.execute("""
      CREATE TABLE IF NOT EXISTS SymptomCombinationToDisease (
        symptoms_combo_key TEXT PRIMARY KEY,
        diseaseName TEXT
      );
    """)
    
    print(f"Reading {source_excel} (This may take a moment for 2.5 lakh rows)...")
    df = pd.read_excel(source_excel)
    
    # Process Combinations
    combinations = []
    print("Processing symptom combinations...")
    for index, row in df.iterrows():
        # Clean symptom array string and standardize as alphabetical key
        sym_list = json.loads(row['Symptom'])
        sym_list.sort()
        combo_key = "|".join([s.strip().lower() for s in sym_list])
        combinations.append((combo_key, str(row['Disease']).strip()))
        
    c.executemany(
        "INSERT OR REPLACE INTO SymptomCombinationToDisease (symptoms_combo_key, diseaseName) VALUES (?, ?)", 
        combinations
    )
    
    conn.commit()
    conn.close()
    print("Offline database built successfully!")

if __name__ == "__main__":
    build_offline_db()
