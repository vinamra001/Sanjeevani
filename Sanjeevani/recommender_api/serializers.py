from rest_framework import serializers
from .models import Symptom, Disease, Remedy, UserHealthLog, UserProfile

class SymptomSerializer(serializers.ModelSerializer):
    """Serializes symptoms for the multi-select input and display chips."""
    class Meta:
        model = Symptom
        fields = ['id', 'name', 'category']

class RemedySerializer(serializers.ModelSerializer):
    """Serializes full remedy details including preparation and usage."""
    class Meta:
        model = Remedy
        fields = [
            'id', 'name', 'sanskrit_name', 'description', 
            'dosage', 'preparation', 'usage_instructions'
        ]

class DiseaseSerializer(serializers.ModelSerializer):
    """
    Nested Serializer for the Disease model.
    Includes the full details of related symptoms and remedies.
    """
    # These fields ensure the frontend receives objects, not just ID integers
    symptoms = SymptomSerializer(many=True, read_only=True)
    remedies = RemedySerializer(many=True, read_only=True)

    class Meta:
        model = Disease
        fields = [
            'id', 'name', 'sanskrit_name', 'description', 
            'dosha_type', 'diet_plan', 'foods_to_take', 'foods_to_avoid',
            'lifestyle_routine', 'recommended_exercises', 'symptoms', 'remedies'
        ]

class UserHealthLogSerializer(serializers.ModelSerializer):
    """Serializes the history of predictions for the user profile."""
    # Format the date for better readability in the app (e.g., 07 Feb 2026, 06:45 PM)
    timestamp = serializers.DateTimeField(format="%d %b %Y, %I:%M %p", read_only=True)

    class Meta:
        model = UserHealthLog
        fields = [
            'id', 'detected_disease', 'confidence', 
            'dosha_at_time', 'input_symptoms', 'timestamp'
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializes extended user data like age and Prakriti."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        # ✅ Changed 'base_dosha' to 'prakriti' to match your models.py
        fields = ['username', 'email', 'prakriti', 'age', 'gender']