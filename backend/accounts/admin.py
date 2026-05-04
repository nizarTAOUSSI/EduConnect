from django.contrib import admin
from .models import Utilisateur, Enseignant, Etudiant, Parent

class EnseignantInline(admin.StackedInline):
    model = Enseignant
    can_delete = False
    verbose_name_plural = 'Profil Enseignant'

class EtudiantInline(admin.StackedInline):
    model = Etudiant
    can_delete = False
    verbose_name_plural = 'Profil Étudiant'

class ParentInline(admin.StackedInline):
    model = Parent
    can_delete = False
    verbose_name_plural = 'Profil Parent'
    filter_horizontal = ('enfants',)

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')

    def get_inlines(self, request, obj=None):
        if obj:
            if obj.role == Utilisateur.Role.ENSEIGNANT:
                return [EnseignantInline]
            elif obj.role == Utilisateur.Role.ETUDIANT:
                return [EtudiantInline]
            elif obj.role == Utilisateur.Role.PARENT:
                return [ParentInline]
        return []

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        if obj.role == Utilisateur.Role.ENSEIGNANT and not hasattr(obj, 'profil_enseignant'):
            Enseignant.objects.create(utilisateur=obj, specialite='')
        elif obj.role == Utilisateur.Role.ETUDIANT and not hasattr(obj, 'profil_etudiant'):

            pass
        elif obj.role == Utilisateur.Role.PARENT and not hasattr(obj, 'profil_parent'):
            Parent.objects.create(utilisateur=obj)