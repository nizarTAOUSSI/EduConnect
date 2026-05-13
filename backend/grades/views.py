from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Evaluation, Note
from .serializers import EvaluationSerializer, NoteSerializer
from academics.models import Periode
from django.db.models import Avg

class EvaluationViewSet(viewsets.ModelViewSet):
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['matiere', 'classe', 'type', 'periode']
    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
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
            from academics.models import EnseignantMatiere
            teacher_assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            evaluations = Evaluation.objects.filter(
                matiere__in=teacher_assignments.values('matiere'),
                classe__in=teacher_assignments.values('classe')
            )
            return Note.objects.filter(evaluation__in=evaluations)
        elif user.is_etudiant():
            return Note.objects.filter(etudiant__utilisateur=user)
        elif user.is_parent():
            enfants_ids = user.profil_parent.enfants.values_list('id', flat=True)
            return Note.objects.filter(etudiant_id__in=enfants_ids)
        elif user.is_admin():
            return Note.objects.all()
        return Note.objects.none()

class StudentNotesDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, periode_id):
        
        if not request.user.is_etudiant():
            return Response(
                {"error": "Only students can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        
        etudiant = request.user.profil_etudiant
        try:
            periode = Periode.objects.get(id=periode_id)
        except Periode.DoesNotExist:
            return Response(
                {"error": "Periode not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        
        notes = Note.objects.filter(
            etudiant=etudiant,
            evaluation__periode=periode
        ).select_related('evaluation', 'evaluation__matiere')
        
        
        matieres_dict = {}
        for note in notes:
            matiere_nom = note.evaluation.matiere.nom
            if matiere_nom not in matieres_dict:
                matieres_dict[matiere_nom] = {
                    'matiere': matiere_nom,
                    'evaluations': [],
                    'notes_values': []
                }
           
            if note.est_absent:
                note_value = 0.0
            else:
                note_value = note.note_effective if note.note_effective is not None else 0.0
            
            
            matieres_dict[matiere_nom]['evaluations'].append({
                'type': note.evaluation.get_type_display(),
                'note': note_value
            })
            matieres_dict[matiere_nom]['notes_values'].append(note_value)
        
        
        matieres_list = []
        all_matiere_averages = []
        for matiere_data in matieres_dict.values():
            if len(matiere_data['notes_values']) > 0:
                moyenne_matiere = sum(matiere_data['notes_values']) / len(matiere_data['notes_values'])
                matieres_list.append({
                    'matiere': matiere_data['matiere'],
                    'evaluations': matiere_data['evaluations'],
                    'moyenne_matiere': round(moyenne_matiere, 2)
                })
                all_matiere_averages.append(moyenne_matiere)
        
    
        moyenne_generale = 0
        if len(all_matiere_averages) > 0:
            moyenne_generale = sum(all_matiere_averages) / len(all_matiere_averages)
            moyenne_generale = round(moyenne_generale, 2)
        

        return Response({
            'periode': periode.nom,
            'matieres': matieres_list,
            'moyenne_generale': moyenne_generale
        })
