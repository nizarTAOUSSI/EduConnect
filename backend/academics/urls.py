from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PeriodeViewSet,
    MatiereViewSet,
    ClasseViewSet,
    EnseignantMatiereViewSet,
    AbsenceViewSet,
    SeanceViewSet,
    SalleViewSet,
)

router = DefaultRouter()
router.register(r'salles', SalleViewSet)
router.register(r'periodes', PeriodeViewSet)
router.register(r'matieres', MatiereViewSet)
router.register(r'classes', ClasseViewSet)
router.register(r'enseignant-matieres', EnseignantMatiereViewSet)
router.register(r'absences', AbsenceViewSet)
router.register(r'seances', SeanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]