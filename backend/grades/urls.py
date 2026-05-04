from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EvaluationViewSet, NoteViewSet

router = DefaultRouter()
router.register(r'evaluations', EvaluationViewSet)
router.register(r'notes', NoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]