from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, EnseignantViewSet, EtudiantViewSet, ParentViewSet

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'enseignants', EnseignantViewSet)
router.register(r'etudiants', EtudiantViewSet)
router.register(r'parents', ParentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
