from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PeriodeViewSet,
    MatiereViewSet,
    ClasseViewSet,
    EnseignantMatiereViewSet,
    AbsenceViewSet,
)

router = DefaultRouter()
router.register(r'periodes', PeriodeViewSet)
router.register(r'matieres', MatiereViewSet)
router.register(r'classes', ClasseViewSet)
router.register(r'enseignant-matieres', EnseignantMatiereViewSet)
router.register(r'absences', AbsenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]