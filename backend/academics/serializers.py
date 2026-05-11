from rest_framework import serializers
from .models import AnneeScolaire, Periode, Matiere, Classe, EnseignantMatiere, Absence, Seance, Salle
from accounts.serializers import EtudiantSerializer
class SalleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Salle
        fields = '__all__'
class AnneeScolaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeScolaire
        fields = '__all__'
    def validate(self, attrs):
        est_active = attrs.get('est_active', False)
        if est_active:
            other_active = AnneeScolaire.objects.filter(est_active=True)
            if self.instance:
                other_active = other_active.exclude(pk=self.instance.pk)
            if other_active.exists():
                raise serializers.ValidationError({'est_active': 'Il ne peut y avoir qu\'une seule année scolaire active à la fois.'})
        date_debut = attrs.get('date_debut')
        date_fin = attrs.get('date_fin')
        if date_debut and date_fin and date_debut > date_fin:
            raise serializers.ValidationError({'date_debut': 'La date de début doit être antérieure à la date de fin.'})
        return attrs
class PeriodeSerializer(serializers.ModelSerializer):
    annee_scolaire_nom = serializers.ReadOnlyField(source='annee_scolaire.nom')
    
    class Meta:
        model = Periode
        fields = '__all__'
    
    def get_fields(self):
        fields = super().get_fields()
        if self.instance:
            fields['annee_scolaire'].required = False
            fields['annee_scolaire'].allow_null = True
        else:
            fields['annee_scolaire'].required = True
            fields['annee_scolaire'].allow_null = False
        return fields
    
    def validate(self, attrs):
        if not self.instance and not attrs.get('annee_scolaire'):
            raise serializers.ValidationError({'annee_scolaire': 'Ce champ est obligatoire.'})
        
        annee_scolaire = attrs.get('annee_scolaire')
        if not annee_scolaire and self.instance:
            annee_scolaire = self.instance.annee_scolaire
        
        date_debut = attrs.get('date_debut')
        if date_debut is None and self.instance:
            date_debut = self.instance.date_debut
        
        date_fin = attrs.get('date_fin')
        if date_fin is None and self.instance:
            date_fin = self.instance.date_fin
        
        if date_debut and date_fin and date_debut > date_fin:
            raise serializers.ValidationError({'date_debut': 'La date de début doit être antérieure à la date de fin.'})
        
        if annee_scolaire and date_debut:
            if date_debut < annee_scolaire.date_debut or date_debut > annee_scolaire.date_fin:
                raise serializers.ValidationError({'date_debut': 'La date de début de la période doit être dans l\'intervalle de l\'année scolaire.'})
        
        if annee_scolaire and date_fin:
            if date_fin < annee_scolaire.date_debut or date_fin > annee_scolaire.date_fin:
                raise serializers.ValidationError({'date_fin': 'La date de fin de la période doit être dans l\'intervalle de l\'année scolaire.'})
        
        return attrs
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
    etudiant_user = serializers.ReadOnlyField(source='etudiant.utilisateur.id')
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
