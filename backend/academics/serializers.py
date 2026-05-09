from rest_framework import serializers
from .models import Periode, Matiere, Classe, EnseignantMatiere, Absence, Seance, Salle
from accounts.serializers import EtudiantSerializer

class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = '__all__'

class PeriodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Periode
        fields = '__all__'

class MatiereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matiere
        fields = '__all__'

class ClasseSerializer(serializers.ModelSerializer):
    nb_etudiants = serializers.IntegerField(source='etudiants.count', read_only=True)

    class Meta:
        model = Classe
        fields = '__all__'

class EnseignantMatiereSerializer(serializers.ModelSerializer):
    enseignant_user = serializers.ReadOnlyField(source='enseignant.utilisateur.id')
    enseignant_name = serializers.ReadOnlyField(source='enseignant.utilisateur.get_full_name')
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    classe_name = serializers.ReadOnlyField(source='classe.nom')

    class Meta:
        model = EnseignantMatiere
        fields = '__all__'

class SeanceSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    enseignant_name = serializers.ReadOnlyField(source='enseignant_matiere.enseignant.utilisateur.get_full_name')
    enseignant_id = serializers.ReadOnlyField(source='enseignant_matiere.enseignant.id')
    classe_name = serializers.ReadOnlyField(source='classe.nom')
    salle_name = serializers.ReadOnlyField(source='salle.nom')
    jour_display = serializers.CharField(source='get_jour_display', read_only=True)

    class Meta:
        model = Seance
        fields = '__all__'

    def validate(self, attrs):
      
        
        if self.instance:
           
            instance = self.instance
            for field, value in attrs.items():
                setattr(instance, field, value)
        else:
            instance = Seance(**attrs)
            
        try:
            instance.clean()
        except Exception as e:
            from django.core.exceptions import ValidationError as DjangoValidationError
            if isinstance(e, DjangoValidationError):
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
            raise e
        return attrs

class AbsenceSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantSerializer(source='etudiant', read_only=True)
    enseignant_matiere_details = serializers.SerializerMethodField()
    seance_details = SeanceSerializer(source='seance', read_only=True)

    class Meta:
        model = Absence
        fields = '__all__'

    def validate(self, attrs):
        if self.instance:
            instance = self.instance
            for field, value in attrs.items():
                setattr(instance, field, value)
        else:
            instance = Absence(**attrs)
            
        try:
            instance.clean()
        except Exception as e:
            from django.core.exceptions import ValidationError as DjangoValidationError
            if isinstance(e, DjangoValidationError):
                raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.messages)
            raise e
        return attrs

    def get_enseignant_matiere_details(self, obj):
        return {
            'id': obj.enseignant_matiere.id,
            'matiere_name': obj.enseignant_matiere.matiere.nom,
            'classe_name': obj.enseignant_matiere.classe.nom,
            'enseignant_name': obj.enseignant_matiere.enseignant.utilisateur.get_full_name() or obj.enseignant_matiere.enseignant.utilisateur.email,
        }