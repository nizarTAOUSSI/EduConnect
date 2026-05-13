from rest_framework import serializers
from .models import Reclamation, Notification
from accounts.models import Utilisateur
from grades.serializers import NoteSerializer
class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'first_name', 'last_name', 'email']
class ReclamationSerializer(serializers.ModelSerializer):
    expediteur_details = UserBasicSerializer(source='expediteur', read_only=True)
    destinataire_details = UserBasicSerializer(source='destinataire', read_only=True)
    note_details = NoteSerializer(source='note', read_only=True)
    class Meta:
        model = Reclamation
        fields = '__all__'
        read_only_fields = ['expediteur', 'statut', 'date_creation', 'reponse']
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
