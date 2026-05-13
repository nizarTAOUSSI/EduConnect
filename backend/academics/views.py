from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import AnneeScolaire, Periode, Matiere, Classe, EnseignantMatiere, Absence, Seance, Salle
from .serializers import (
    AnneeScolaireSerializer,
    PeriodeSerializer,
    MatiereSerializer,
    ClasseSerializer,
    EnseignantMatiereSerializer,
    AbsenceSerializer,
    SeanceSerializer,
    SalleSerializer,
)
class AnneeScolaireViewSet(viewsets.ModelViewSet):
    queryset = AnneeScolaire.objects.all()
    serializer_class = AnneeScolaireSerializer
    permission_classes = [IsAuthenticated]
class SalleViewSet(viewsets.ModelViewSet):
    queryset = Salle.objects.all()
    serializer_class = SalleSerializer
    permission_classes = [IsAuthenticated]
class PeriodeViewSet(viewsets.ModelViewSet):
    queryset = Periode.objects.all()
    serializer_class = PeriodeSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='available-for-student')
    def available_for_student(self, request):
        user = request.user
        if not user.is_etudiant():
            return Response(
                {"error": "Only students can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
      
        from grades.models import Evaluation
        student = user.profil_etudiant
        student_class = student.classe
        
   
        from django.utils import timezone
        today = timezone.now().date()
        
       
        periods_with_evaluations = Periode.objects.filter(
            evaluations__classe=student_class
        ).distinct()
        
      
        all_periods = Periode.objects.filter(
            date_debut__lte=today
        ).distinct()
        
     
        available_periods = all_periods.order_by('date_debut')
        
        serializer = PeriodeSerializer(available_periods, many=True)
        return Response(serializer.data)
class MatiereViewSet(viewsets.ModelViewSet):
    queryset = Matiere.objects.all()
    serializer_class = MatiereSerializer
    permission_classes = [IsAuthenticated]
class ClasseViewSet(viewsets.ModelViewSet):
    queryset = Classe.objects.all()
    serializer_class = ClasseSerializer
    permission_classes = [IsAuthenticated]
    @action(detail=True, methods=['get'], url_path='emploi')
    def emploi(self, request, pk=None):
        from grades.models import Evaluation
        from django.utils import timezone
        today = timezone.now().date()
        classe = self.get_object()
        seances = Seance.objects.filter(classe=classe).select_related('matiere', 'enseignant_matiere__enseignant__utilisateur', 'salle')
        evaluations = Evaluation.objects.filter(classe=classe, date__gte=today).select_related('matiere', 'enseignant__utilisateur', 'salle')
        days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
        day_names_fr = {
            'Monday': 'lundi', 'Tuesday': 'mardi', 'Wednesday': 'mercredi', 
            'Thursday': 'jeudi', 'Friday': 'vendredi', 'Saturday': 'samedi', 'Sunday': 'dimanche'
        }
        timetable = {day: [] for day in days}
        for seance in seances:
            timetable[seance.jour].append({
                'id': seance.id,
                'type': 'seance',
                'matiere': seance.matiere.nom,
                'enseignant': seance.enseignant_matiere.enseignant.utilisateur.get_full_name() or seance.enseignant_matiere.enseignant.utilisateur.email,
                'enseignant_id': seance.enseignant_matiere.enseignant.id,
                'salle': seance.salle.nom if seance.salle else None,
                'salle_id': seance.salle.id if seance.salle else None,
                'heure_debut': seance.heure_debut.strftime('%H:%M'),
                'heure_fin': seance.heure_fin.strftime('%H:%M'),
            })
        for eval_item in evaluations:
            if eval_item.heure_debut and eval_item.heure_fin:
                day_name = eval_item.date.strftime('%A')
                day_key = day_names_fr.get(day_name, 'lundi').lower()
                timetable[day_key].append({
                    'id': eval_item.id,
                    'type': 'evaluation',
                    'evaluation_type': eval_item.get_type_display(),
                    'matiere': eval_item.matiere.nom,
                    'classe': eval_item.classe.nom,
                    'enseignant': eval_item.enseignant.utilisateur.get_full_name() if eval_item.enseignant else "N/A",
                    'salle': eval_item.salle.nom if eval_item.salle else None,
                    'salle_id': eval_item.salle.id if eval_item.salle else None,
                    'heure_debut': eval_item.heure_debut.strftime('%H:%M'),
                    'heure_fin': eval_item.heure_fin.strftime('%H:%M'),
                    'date': eval_item.date.strftime('%Y-%m-%d'),
                })
        for day in days:
            timetable[day].sort(key=lambda x: x['heure_debut'])
        return Response(timetable)
class EnseignantMatiereViewSet(viewsets.ModelViewSet):
    queryset = EnseignantMatiere.objects.select_related('enseignant', 'matiere', 'classe').all()
    serializer_class = EnseignantMatiereSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['enseignant', 'classe', 'matiere']
    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            return EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
        return EnseignantMatiere.objects.all()
class SeanceViewSet(viewsets.ModelViewSet):
    queryset = Seance.objects.select_related('classe', 'matiere', 'enseignant_matiere__enseignant__utilisateur').all()
    serializer_class = SeanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['classe', 'jour']
    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            return Seance.objects.filter(enseignant_matiere__enseignant__utilisateur=user)
        elif user.is_etudiant():
            return Seance.objects.filter(classe=user.profil_etudiant.classe)
        elif user.is_parent():
            enfants_classes = user.profil_parent.enfants.values_list('classe_id', flat=True)
            return Seance.objects.filter(classe_id__in=enfants_classes)
        return Seance.objects.all()
    @action(detail=False, methods=['get'], url_path='mon-emploi')
    def mon_emploi(self, request):
        from grades.models import Evaluation
        from django.utils import timezone
        today = timezone.now().date()
        user = request.user
        if not user.is_enseignant():
            return Response({"detail": "Seuls les enseignants peuvent accéder à leur emploi du temps global."}, status=403)
        seances = Seance.objects.filter(
            enseignant_matiere__enseignant__utilisateur=user
        ).select_related('matiere', 'classe', 'salle')
        evaluations = Evaluation.objects.filter(
            enseignant__utilisateur=user, date__gte=today
        ).select_related('matiere', 'classe', 'salle')
        days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
        day_names_fr = {
            'Monday': 'lundi', 'Tuesday': 'mardi', 'Wednesday': 'mercredi', 
            'Thursday': 'jeudi', 'Friday': 'vendredi', 'Saturday': 'samedi', 'Sunday': 'dimanche'
        }
        timetable = {day: [] for day in days}
        for seance in seances:
            timetable[seance.jour].append({
                'id': seance.id,
                'type': 'seance',
                'matiere': seance.matiere.nom,
                'classe': seance.classe.nom,
                'salle': seance.salle.nom if seance.salle else None,
                'salle_id': seance.salle.id if seance.salle else None,
                'heure_debut': seance.heure_debut.strftime('%H:%M'),
                'heure_fin': seance.heure_fin.strftime('%H:%M'),
            })
        for eval_item in evaluations:
            if eval_item.heure_debut and eval_item.heure_fin:
                day_name = eval_item.date.strftime('%A')
                day_key = day_names_fr.get(day_name, 'lundi').lower()
                timetable[day_key].append({
                    'id': eval_item.id,
                    'type': 'evaluation',
                    'evaluation_type': eval_item.get_type_display(),
                    'matiere': eval_item.matiere.nom,
                    'classe': eval_item.classe.nom,
                    'salle': eval_item.salle.nom if eval_item.salle else None,
                    'salle_id': eval_item.salle.id if eval_item.salle else None,
                    'heure_debut': eval_item.heure_debut.strftime('%H:%M'),
                    'heure_fin': eval_item.heure_fin.strftime('%H:%M'),
                    'date': eval_item.date.strftime('%Y-%m-%d'),
                })
        for day in days:
            timetable[day].sort(key=lambda x: x['heure_debut'])
        return Response(timetable)
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_enseignant():
            enseignant_matiere = serializer.validated_data.get('enseignant_matiere')
            if enseignant_matiere.enseignant.utilisateur != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Vous ne pouvez créer des séances que pour vos propres affectations.")
        serializer.save()
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
            teacher_assignments = EnseignantMatiere.objects.filter(enseignant__utilisateur=user)
            return Absence.objects.filter(enseignant_matiere__in=teacher_assignments)
        elif user.is_etudiant():
            return Absence.objects.filter(etudiant__utilisateur=user)
        elif user.is_parent():
            enfants_ids = user.profil_parent.enfants.values_list('id', flat=True)
            return Absence.objects.filter(etudiant_id__in=enfants_ids)
        elif user.is_admin():
            return Absence.objects.all()
        return Absence.objects.none()
