from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Evaluation, Note
from .serializers import EvaluationSerializer, NoteSerializer

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['matiere', 'classe', 'type']

    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            # Teachers see evaluations for their assigned subjects/classes
            from academics.models import EnseignantMatiere
            teacher_assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            return Evaluation.objects.filter(
                matiere__in=teacher_assignments.values('matiere'),
                classe__in=teacher_assignments.values('classe')
            )
        return Evaluation.objects.all()

class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['evaluation', 'etudiant']

    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            # Teachers see notes for evaluations in their classes
            from academics.models import EnseignantMatiere
            teacher_assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            evaluations = Evaluation.objects.filter(
                matiere__in=teacher_assignments.values('matiere'),
                classe__in=teacher_assignments.values('classe')
            )
            return Note.objects.filter(evaluation__in=evaluations)
        elif user.is_etudiant():
            # Students see their own notes
            return Note.objects.filter(etudiant__utilisateur=user)
        elif user.is_parent():
            # Parents see notes of their children
            enfants_ids = user.profil_parent.enfants.values_list('id', flat=True)
            return Note.objects.filter(etudiant_id__in=enfants_ids)
        elif user.is_admin():
            # Admins see all notes
            return Note.objects.all()
        return Note.objects.none()