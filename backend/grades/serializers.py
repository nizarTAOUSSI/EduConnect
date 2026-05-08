from rest_framework import serializers
from .models import Evaluation, Note

class EvaluationSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    matiere_coefficient = serializers.ReadOnlyField(source='matiere.coefficient')
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    enseignant_user = serializers.ReadOnlyField(source='enseignant.utilisateur.id')
    enseignant_name = serializers.ReadOnlyField(source='enseignant.utilisateur.get_full_name')
    salle_name = serializers.ReadOnlyField(source='salle.nom')

    class Meta:
        model = Evaluation
        fields = ['id', 'type', 'type_display', 'date', 'heure_debut', 'heure_fin', 'note_max', 'matiere', 'matiere_name', 'matiere_coefficient', 'classe', 'enseignant', 'enseignant_user', 'enseignant_name', 'salle', 'salle_name']

class NoteSerializer(serializers.ModelSerializer):
    evaluation_details = EvaluationSerializer(source='evaluation', read_only=True)

    class Meta:
        model = Note
        fields = '__all__'