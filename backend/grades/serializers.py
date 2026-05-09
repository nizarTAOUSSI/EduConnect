from rest_framework import serializers
from .models import Evaluation, Note

class EvaluationSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    matiere_coefficient = serializers.ReadOnlyField(source='matiere.coefficient')
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    enseignant_user = serializers.ReadOnlyField(source='enseignant.utilisateur.id')
    enseignant_name = serializers.ReadOnlyField(source='enseignant.utilisateur.get_full_name')
    classe_name = serializers.ReadOnlyField(source='classe.nom')
    salle_name = serializers.ReadOnlyField(source='salle.nom')

    class Meta:
        model = Evaluation
        fields = ['id', 'type', 'type_display', 'date', 'heure_debut', 'heure_fin', 'note_max', 'matiere', 'matiere_name', 'matiere_coefficient', 'classe', 'classe_name', 'enseignant', 'enseignant_user', 'enseignant_name', 'salle', 'salle_name']

    def validate(self, attrs):
        # Create a temporary instance to call clean()
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
                # Re-raise as DRF ValidationError to return JSON
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
            raise e
        return attrs

class NoteSerializer(serializers.ModelSerializer):
    evaluation_details = EvaluationSerializer(source='evaluation', read_only=True)

    class Meta:
        model = Note
        fields = '__all__'
