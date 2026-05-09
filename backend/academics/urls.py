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

urlpatterns = []