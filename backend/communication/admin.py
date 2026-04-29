from django.contrib import admin
from .models import Reclamation, Notification


@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display  = ('expediteur', 'destinataire', 'statut', 'date_creation')
    list_filter   = ('statut', 'date_creation')
    search_fields = ('expediteur__email', 'message')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('destinataire', 'from_user', 'est_lu', 'date_envoi')
    list_filter   = ('est_lu', 'date_envoi')
    search_fields = ('destinataire__email', 'message')
