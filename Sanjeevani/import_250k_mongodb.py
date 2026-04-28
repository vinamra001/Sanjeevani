import os
import django
import pandas as pd
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from recommender_api.models import SymptomDiseaseMapping

def ingest():
    print("Reading from sanjeevani_offline_master.db (2.5 Lakh rows)...")
    
    # 1. Purge existing mapping fully to avoid unique constraint duplicates
    print("Flushing old mappings from MongoDB...")
    SymptomDiseaseMapping.objects.all().delete()
    print("Flushed.")
    
    import sqlite3
    conn = sqlite3.connect('sanjeevani_offline_master.db')
    cursor = conn.cursor()
    cursor.execute("SELECT symptoms_combo_key, diseaseName FROM SymptomCombinationToDisease")
    rows = cursor.fetchall()
    
    print("Structuring combinations for Django ORM High-Speed DB...")
    
    bulk_instances = []
    
    for r in rows:
        combo_key = r[0]
        dis_name = r[1]
        
        # Only add valid items
        if combo_key and dis_name:
            bulk_instances.append(
                SymptomDiseaseMapping(
                    symptoms_combo_key=combo_key,
                    disease_name=dis_name
                )
            )

    conn.close()

    print(f"Prepared {len(bulk_instances)} records. Committing Bulk Insert (batch size=10,000)...")
    
    # Django batch bulk_create to protect RAM and IO overhead
    batch_size = 10000
    total = len(bulk_instances)
    
    for i in range(0, total, batch_size):
        batch = bulk_instances[i:i + batch_size]
        SymptomDiseaseMapping.objects.bulk_create(batch, ignore_conflicts=True)
        print(f"Inserted [{i + len(batch)} / {total}]...")
        
    print("Successfully ingested massive 2.5 Lakh combination dataset into Native MongoDB Django ORM!")

if __name__ == '__main__':
    ingest()
