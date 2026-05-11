from django.contrib import admin
from .models import AnneeScolaire, Periode, Matiere, Classe, EnseignantMatiere, Absence, Salle, Seance
@admin.register(AnneeScolaire)
class AnneeScolaireAdmin(admin.ModelAdmin):
    list_display = ('nom', 'date_debut', 'date_fin', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)
@admin.register(Salle)
class SalleAdmin(admin.ModelAdmin):
    list_display = ('nom', 'capacite')
    search_fields = ('nom',)
@admin.register(Seance)
class SeanceAdmin(admin.ModelAdmin):
    list_display = ('matiere', 'classe', 'salle', 'jour', 'heure_debut', 'heure_fin')
    list_filter = ('jour', 'classe', 'salle')
    search_fields = ('matiere__nom', 'classe__nom', 'salle__nom')
@admin.register(Periode)
class PeriodeAdmin(admin.ModelAdmin):
    list_display  = ('nom', 'annee_scolaire', 'date_debut', 'date_fin', 'est_active')
    list_filter   = ('annee_scolaire', 'est_active')
    search_fields = ('nom',)
@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display  = ('nom', 'coefficient')
    search_fields = ('nom',)
@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display  = ('nom', 'niveau')
    search_fields = ('nom', 'niveau')
@admin.register(EnseignantMatiere)
class EnseignantMatiereAdmin(admin.ModelAdmin):
    list_display  = ('enseignant', 'matiere', 'classe')
    list_filter   = ('classe', 'matiere')
    search_fields = ('enseignant__utilisateur__email', 'matiere__nom', 'classe__nom')
@admin.register(Absence)
class AbsenceAdmin(admin.ModelAdmin):
    list_display  = ('etudiant', 'enseignant_matiere', 'date', 'justifiee', 'duree_heures')
    list_filter   = ('justifiee', 'date')
    search_fields = ('etudiant__utilisateur__email', 'enseignant_matiere__matiere__nom')
