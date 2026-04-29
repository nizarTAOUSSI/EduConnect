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
    class Meta:
        model = Enseignant
        fields = '__all__'

class EtudiantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etudiant
        fields = '__all__'

class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = '__all__'
