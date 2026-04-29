from django.contrib import admin
from .models import Bulletin


@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display  = ('etudiant', 'periode', 'moyenne_generale', 'rang', 'mention', 'valide_St', 'validation_jury', 'date_generation')
    list_filter   = ('periode', 'mention', 'valide_St', 'validation_jury')
    search_fields = ('etudiant__utilisateur__email',)
