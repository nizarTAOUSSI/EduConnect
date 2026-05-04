from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
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
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['enseignant', 'classe', 'matiere']

    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            # Teachers only see their own assignments
            return EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
        return EnseignantMatiere.objects.all()

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.select_related(
        'enseignant_matiere',
        'enseignant_matiere__matiere',
        'enseignant_matiere__classe',
        'enseignant_matiere__enseignant__utilisateur',
        'etudiant__utilisateur',
        'etudiant__classe',
    ).all()
    serializer_class = AbsenceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['etudiant', 'enseignant_matiere']

    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            # Teachers see absences from their classes
            teacher_assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            return Absence.objects.filter(enseignant_matiere__in=teacher_assignments)
        elif user.is_etudiant():
            # Students see their own absences
            return Absence.objects.filter(etudiant__utilisateur=user)
        elif user.is_parent():
            # Parents see absences of their children
            enfants_ids = user.profil_parent.enfants.values_list('id', flat=True)
            return Absence.objects.filter(etudiant_id__in=enfants_ids)
        elif user.is_admin():
            # Admins see all absences
            return Absence.objects.all()
        return Absence.objects.none()