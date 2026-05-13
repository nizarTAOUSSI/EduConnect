from rest_framework import serializers
from .models import Evaluation, Note
from academics.models import Matiere

class EvaluationSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    matiere_coefficient = serializers.ReadOnlyField(source='matiere.coefficient')
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    periode = serializers.PrimaryKeyRelatedField(read_only=True)
    periode_name = serializers.ReadOnlyField(source='periode.nom')
    enseignant_user = serializers.ReadOnlyField(source='enseignant.utilisateur.id')
    enseignant_name = serializers.ReadOnlyField(source='enseignant.utilisateur.get_full_name')
    enseignant_id = serializers.ReadOnlyField(source='enseignant.id')
    classe_name = serializers.ReadOnlyField(source='classe.nom')
    salle_name = serializers.ReadOnlyField(source='salle.nom')
    class Meta:
        model = Evaluation
        fields = ['id', 'type', 'type_display', 'date', 'heure_debut', 'heure_fin', 'note_max', 'matiere', 'matiere_name', 'matiere_coefficient', 'classe', 'classe_name', 'periode', 'periode_name', 'enseignant', 'enseignant_id', 'enseignant_user', 'enseignant_name', 'salle', 'salle_name']
    def validate(self, attrs):
        if self.instance:
            instance = self.instance
            for field, value in attrs.items():
                setattr(instance, field, value)
        else:
            instance = Evaluation(**attrs)
        try:
            instance.clean()
        except Exception as e:
            from django.core.exceptions import ValidationError as DjangoValidationError
            if isinstance(e, DjangoValidationError):
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
            raise e
        return attrs

class NoteSerializer(serializers.ModelSerializer):
    evaluation_details = EvaluationSerializer(source='evaluation', read_only=True)
    etudiant_user = serializers.ReadOnlyField(source='etudiant.utilisateur.id')
    etudiant_name = serializers.ReadOnlyField(source='etudiant.utilisateur.get_full_name')
    etudiant_email = serializers.ReadOnlyField(source='etudiant.utilisateur.email')
    class Meta:
        model = Note
        fields = '__all__'

class EvaluationNoteSerializer(serializers.Serializer):
    type = serializers.CharField(source='get_type_display')
    note = serializers.FloatField(source='note_effective')

class MatiereNotesSerializer(serializers.Serializer):
    matiere = serializers.CharField()
    evaluations = EvaluationNoteSerializer(many=True)
    moyenne_matiere = serializers.FloatField()

class StudentNotesDashboardSerializer(serializers.Serializer):
    periode = serializers.CharField()
    matieres = MatiereNotesSerializer(many=True)
    moyenne_generale = serializers.FloatField()
