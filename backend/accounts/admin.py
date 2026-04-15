from django.contrib import admin
from .models import Utilisateur, Enseignant, Etudiant, Parent

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')

@admin.register(Enseignant)
class EnseignantAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'specialite')
    search_fields = ('utilisateur__email', 'specialite')

@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'code_apogee')
    search_fields = ('utilisateur__email', 'code_apogee')

@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ('utilisateur',)
    filter_horizontal = ('enfants',)
