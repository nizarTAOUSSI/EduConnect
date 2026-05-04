from rest_framework import serializers
from .models import Periode, Matiere, Classe, EnseignantMatiere, Absence
from accounts.serializers import EtudiantSerializer

class PeriodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Periode
        fields = '__all__'

class MatiereSerializer(serializers.ModelSerializer):
    class Meta:
        model = Matiere
        fields = '__all__'

class ClasseSerializer(serializers.ModelSerializer):
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

class AbsenceSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantSerializer(source='etudiant', read_only=True)
    enseignant_matiere_details = serializers.SerializerMethodField()

    class Meta:
        model = Absence
        fields = '__all__'

    def get_enseignant_matiere_details(self, obj):
        return {
            'id': obj.enseignant_matiere.id,
            'matiere_name': obj.enseignant_matiere.matiere.nom,
            'classe_name': obj.enseignant_matiere.classe.nom,
            'enseignant_name': obj.enseignant_matiere.enseignant.utilisateur.get_full_name() or obj.enseignant_matiere.enseignant.utilisateur.email,
        }