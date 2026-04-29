from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Periode, Matiere, Classe, EnseignantMatiere, Absence
from .serializers import (
    PeriodeSerializer,
    MatiereSerializer,
    ClasseSerializer,
    EnseignantMatiereSerializer,
    AbsenceSerializer,
)


class PeriodeViewSet(viewsets.ModelViewSet):
    queryset = Periode.objects.all()
    serializer_class = PeriodeSerializer
    permission_classes = [IsAuthenticated]


class MatiereViewSet(viewsets.ModelViewSet):
    queryset = Matiere.objects.all()
    serializer_class = MatiereSerializer
    permission_classes = [IsAuthenticated]


class ClasseViewSet(viewsets.ModelViewSet):
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer
    permission_classes = [IsAuthenticated]


class EnseignantMatiereViewSet(viewsets.ModelViewSet):
    queryset = EnseignantMatiere.objects.select_related('enseignant', 'matiere', 'classe').all()
    serializer_class = EnseignantMatiereSerializer
    permission_classes = [IsAuthenticated]


class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.select_related('enseignant_matiere', 'etudiant').all()
    serializer_class = AbsenceSerializer
    permission_classes = [IsAuthenticated]
