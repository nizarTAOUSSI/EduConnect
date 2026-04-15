from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PeriodeViewSet, MatiereViewSet, ClasseViewSet

router = DefaultRouter()
router.register(r'periodes', PeriodeViewSet)
router.register(r'matieres', MatiereViewSet)
router.register(r'classes', ClasseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
