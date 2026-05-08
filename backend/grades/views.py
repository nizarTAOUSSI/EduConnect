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
            # Teachers see evaluations for their assigned subjects/classes OR where they are the explicit teacher
            from academics.models import EnseignantMatiere
            from django.db.models import Q
            
            assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            # Create a list of (matiere_id, classe_id) tuples for assignments
            assignment_queries = Q()
            for a in assignments:
                assignment_queries |= Q(matiere_id=a.matiere_id, classe_id=a.classe_id)
            
            # Combine with explicit teacher field
            return Evaluation.objects.filter(
                assignment_queries | Q(enseignant__utilisateur=user)
            ).distinct()
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
            # Teachers see notes for evaluations in their classes/subjects
            from academics.models import EnseignantMatiere
            from django.db.models import Q
            
            assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            assignment_queries = Q()
            for a in assignments:
                assignment_queries |= Q(matiere_id=a.matiere_id, classe_id=a.classe_id)
            
            evaluations = Evaluation.objects.filter(
                assignment_queries | Q(enseignant__utilisateur=user)
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