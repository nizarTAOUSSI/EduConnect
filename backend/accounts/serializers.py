from rest_framework import serializers
from .models import Utilisateur, Enseignant, Etudiant, Parent

class UtilisateurCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = Utilisateur
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'password',
            'is_active',
            'date_joined',
        ]
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()

        role = user.role
        if role == Utilisateur.Role.ETUDIANT:
            Etudiant.objects.get_or_create(utilisateur=user)
        elif role == Utilisateur.Role.ENSEIGNANT:
            Enseignant.objects.get_or_create(utilisateur=user, defaults={'specialite': ''})
        elif role == Utilisateur.Role.PARENT:
            Parent.objects.get_or_create(utilisateur=user)

        return user

    def validate_role(self, value):

        if value == Utilisateur.Role.ADMIN:
            raise serializers.ValidationError("Le rôle 'admin' ne peut pas être choisi lors de l'inscription.")
        return value

class UtilisateurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = Utilisateur
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'password',
            'is_active',
            'date_joined',
        ]
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class EnseignantSerializer(serializers.ModelSerializer):
    nom_complet   = serializers.SerializerMethodField()
    email         = serializers.ReadOnlyField(source='utilisateur.email')
    first_name    = serializers.ReadOnlyField(source='utilisateur.first_name')
    last_name     = serializers.ReadOnlyField(source='utilisateur.last_name')
    is_active     = serializers.ReadOnlyField(source='utilisateur.is_active')

    class Meta:
        model  = Enseignant
        fields = ['id', 'utilisateur', 'nom_complet', 'first_name', 'last_name', 'email', 'specialite', 'is_active']

    def get_nom_complet(self, obj):
        name = obj.utilisateur.get_full_name().strip()
        return name if name else obj.utilisateur.email

class EtudiantSerializer(serializers.ModelSerializer):
    nom_complet   = serializers.SerializerMethodField()
    email         = serializers.ReadOnlyField(source='utilisateur.email')
    first_name    = serializers.ReadOnlyField(source='utilisateur.first_name')
    last_name     = serializers.ReadOnlyField(source='utilisateur.last_name')
    is_active     = serializers.ReadOnlyField(source='utilisateur.is_active')
    classe_name   = serializers.SerializerMethodField()
    niveau        = serializers.SerializerMethodField()

    class Meta:
        model  = Etudiant
        fields = [
            'id', 'utilisateur', 'nom_complet', 'first_name', 'last_name',
            'email', 'code_apogee', 'classe', 'classe_name', 'niveau', 'is_active',
        ]

    def get_nom_complet(self, obj):
        name = obj.utilisateur.get_full_name().strip()
        return name if name else obj.utilisateur.email

    def get_classe_name(self, obj):

        if obj.classe_id is None:
            return None

        try:
            return obj.classe.nom
        except Exception:
            return None

    def get_niveau(self, obj):
        try:
            return obj.classe.niveau if obj.classe_id else None
        except Exception:
            return None

class ParentSerializer(serializers.ModelSerializer):
    nom_complet     = serializers.SerializerMethodField()
    email           = serializers.ReadOnlyField(source='utilisateur.email')
    first_name      = serializers.ReadOnlyField(source='utilisateur.first_name')
    last_name       = serializers.ReadOnlyField(source='utilisateur.last_name')
    is_active       = serializers.ReadOnlyField(source='utilisateur.is_active')
    enfants_details = EtudiantSerializer(source='enfants', many=True, read_only=True)

    class Meta:
        model  = Parent
        fields = [
            'id', 'utilisateur', 'nom_complet', 'first_name', 'last_name',
            'email', 'is_active', 'enfants', 'enfants_details',
        ]

    def get_nom_complet(self, obj):
        name = obj.utilisateur.get_full_name().strip()
        return name if name else obj.utilisateur.email