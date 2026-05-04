from rest_framework import serializers
from .models import Periode, Matiere, Classe, EnseignantMatiere, Absence, Seance
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

class SeanceSerializer(serializers.ModelSerializer):
    matiere_name = serializers.ReadOnlyField(source='matiere.nom')
    enseignant_name = serializers.ReadOnlyField(source='enseignant_matiere.enseignant.utilisateur.get_full_name')
    classe_name = serializers.ReadOnlyField(source='classe.nom')
    jour_display = serializers.CharField(source='get_jour_display', read_only=True)

    class Meta:
        model = Seance
        fields = '__all__'

class AbsenceSerializer(serializers.ModelSerializer):
    etudiant_details = EtudiantSerializer(source='etudiant', read_only=True)
    enseignant_matiere_details = serializers.SerializerMethodField()
    seance_details = SeanceSerializer(source='seance', read_only=True)

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