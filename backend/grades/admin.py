from django.contrib import admin
from .models import Evaluation, Note

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('type', 'matiere', 'classe', 'date', 'note_max')
    list_filter = ('type', 'date', 'matiere', 'classe')
    search_fields = ('matiere__nom', 'classe__nom')

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'evaluation', 'valeur_note', 'est_absent')
    list_filter = ('est_absent', 'evaluation')
    search_fields = ('etudiant__utilisateur__email', 'evaluation__matiere__nom')