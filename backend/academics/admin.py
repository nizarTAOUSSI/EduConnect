from django.contrib import admin
from .models import Periode, Matiere, Classe

@admin.register(Periode)
class PeriodeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'date_debut', 'date_fin', 'est_active')
    list_filter = ('est_active',)
    search_fields = ('nom',)

@admin.register(Matiere)
class MatiereAdmin(admin.ModelAdmin):
    list_display = ('nom', 'coefficient')
    search_fields = ('nom',)

@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'niveau')
    search_fields = ('nom', 'niveau')
    filter_horizontal = ('enseignants', 'matieres')
