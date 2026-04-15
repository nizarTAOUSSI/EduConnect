from django.contrib import admin
from .models import Bulletin

@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display = ('etudiant', 'periode', 'moyenne_generale', 'rang', 'date_generation')
    list_filter = ('periode', 'date_generation')
    search_fields = ('etudiant__utilisateur__email',)
