from rest_framework import serializers
from .models import Periode, Matiere, Classe, EnseignantMatiere, Absence


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
    class Meta:
        model = EnseignantMatiere
        fields = '__all__'


class AbsenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Absence
        fields = '__all__'
