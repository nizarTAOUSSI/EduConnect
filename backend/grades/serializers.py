from rest_framework import serializers
from .models import Evaluation, Note

class EvaluationSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Evaluation
        fields = '__all__'

class NoteSerializer(serializers.ModelSerializer):
    evaluation_details = EvaluationSerializer(source='evaluation', read_only=True)

    class Meta:
        model = Note
        fields = '__all__'