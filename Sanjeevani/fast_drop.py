import os
import django
from pymongo import MongoClient

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AyurRecSys.settings')
django.setup()

from django.conf import settings

def fast_drop():
    db_name = settings.DATABASES['default']['NAME']
    host = settings.DATABASES['default'].get('CLIENT', {}).get('host', 'mongodb://localhost:27017/')
    print(f"Connecting to MongoDB {host} -> {db_name}")
    client = MongoClient(host)
    db = client[db_name]
    
    # Drop collections instantly
    db['recommender_api_symptom'].drop()
    db['recommender_api_disease'].drop()
    db['recommender_api_remedy'].drop()
    db['recommender_api_disease_symptoms'].drop()
    db['recommender_api_disease_remedies'].drop()
    db['recommender_api_userhealthlog'].drop() # To prevent foreign key/schema issues if any
    
    print("Done dropping collections!")

if __name__ == '__main__':
    fast_drop()
