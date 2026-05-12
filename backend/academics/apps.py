from django.apps import AppConfig
class AcademicsConfig(AppConfig):
    name = 'academics'
    def ready(self):
        from .models import AnneeScolaire, Periode
        try:
            AnneeScolaire.update_active_annee()
            Periode.update_active_periode()
        except Exception:
            pass
