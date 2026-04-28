from django.db import models
from django.contrib.auth.models import User

# --- 1. KNOWLEDGE BASE MODELS ---

class Symptom(models.Model):
    """
    Standardized symptoms (e.g., 'itching', 'high_fever').
    Used by the ML Engine to create the input vector.
    """
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, blank=True) # e.g., Respiratory

    def __str__(self):
        return self.name


class Remedy(models.Model):
    """
    Ayurvedic treatments, herbs, and formulations.
    """
    name = models.CharField(max_length=200)
    sanskrit_name = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    dosage = models.CharField(max_length=200, blank=True)
    preparation = models.TextField(blank=True)
    usage_instructions = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Disease(models.Model):
    """
    The core Disease model. 
    Linked to multiple Symptoms (for ML) and multiple Remedies (for UI).
    """
    name = models.CharField(max_length=200, unique=True)
    sanskrit_name = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    dosha_type = models.CharField(
        max_length=50, 
        choices=[('Vata', 'Vata'), ('Pitta', 'Pitta'), ('Kapha', 'Kapha'), ('Tridoshic', 'Tridoshic')]
    )
    diet_plan = models.TextField(help_text="Recommended Ayurvedic diet for this condition.")
    foods_to_take = models.TextField(blank=True, help_text="Specific foods to take")
    foods_to_avoid = models.TextField(blank=True, help_text="Specific foods to avoid")
    lifestyle_routine = models.TextField(blank=True, help_text="Lifestyle instructions")
    recommended_exercises = models.TextField(blank=True, help_text="Yoga and exercises")
    
    # Relationships
    symptoms = models.ManyToManyField(Symptom, related_name='diseases')
    remedies = models.ManyToManyField(Remedy, related_name='diseases')

    def __str__(self):
        return self.name


class SymptomDiseaseMapping(models.Model):
    """
    Houses the 2.5 Lakh exact symptom combination mappings explicitly.
    db_index=True ensures rapid retrieval across high volume records.
    """
    symptoms_combo_key = models.CharField(max_length=500, unique=True, db_index=True)
    disease_name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.symptoms_combo_key} -> {self.disease_name}"


# --- 2. USER HEALTH TRACKING MODELS ---

class UserHealthLog(models.Model):
    """
    Logs every prediction made by a user.
    Used by algorithm.py to detect 'Recurring' issues.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_logs')
    detected_disease = models.CharField(max_length=200)
    confidence = models.FloatField() # Confidence percentage from ML
    dosha_at_time = models.CharField(max_length=50) # The user's dosha when predicted
    input_symptoms = models.TextField() # JSON string of symptoms selected
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.detected_disease} ({self.timestamp.date()})"

class UserProfile(models.Model):
    # Change 'on_register_delete' to 'on_delete'
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10, 
        choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')]
    )
    prakriti = models.CharField(max_length=20, default="Unknown")

    def __str__(self):
        return f"{self.user.username}'s Profile"