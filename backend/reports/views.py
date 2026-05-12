from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse
from django.template.loader import render_to_string
from .models import Bulletin
from .serializers import BulletinSerializer
from grades.models import Evaluation, Note
from academics.models import Matiere, Classe, Periode

class BulletinViewSet(viewsets.ModelViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='check-evaluations-complete')
    def check_evaluations_complete(self, request):
        classe_id = request.query_params.get('classe_id')
        periode_id = request.query_params.get('periode_id')
        etudiant_id = request.query_params.get('etudiant_id')
        
        if not classe_id or not periode_id:
            return Response(
                {"error": "classe_id and periode_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            classe = Classe.objects.get(id=classe_id)
            periode = Periode.objects.get(id=periode_id)
        except (Classe.DoesNotExist, Periode.DoesNotExist):
            return Response(
                {"error": "Classe or Periode not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all evaluations for the class and periode
        evaluations = Evaluation.objects.filter(
            classe=classe,
            periode=periode
        )
        
        if not evaluations.exists():
            return Response({
                "complete": False,
                "message": "No evaluations found for this class and periode"
            })
        
        # Determine which students to check
        if etudiant_id:
            # Check a single student
            try:
                from accounts.models import Etudiant
                student = Etudiant.objects.get(id=etudiant_id)
                students = [student]
            except Etudiant.DoesNotExist:
                return Response(
                    {"error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Check all students in the class
            students = classe.get_etudiants()
            if not students.exists():
                return Response({
                    "complete": False,
                    "message": "No students in this class"
                })
        
        # Check if every evaluation has a note for the student(s)
        missing_notes = []
        for evaluation in evaluations:
            for student in students:
                note_exists = Note.objects.filter(
                    evaluation=evaluation,
                    etudiant=student
                ).exists()
                if not note_exists:
                    missing_notes.append({
                        "evaluation_id": evaluation.id,
                        "evaluation_type": evaluation.get_type_display(),
                        "matiere": evaluation.matiere.nom,
                        "student_id": student.id,
                        "student_name": f"{student.utilisateur.first_name} {student.utilisateur.last_name}"
                    })
        
        if missing_notes:
            return Response({
                "complete": False,
                "missing_notes": missing_notes,
                "message": "Some notes are missing"
            })
        
        if etudiant_id:
            return Response({
                "complete": True,
                "message": "All evaluations have notes for this student"
            })
        else:
            return Response({
                "complete": True,
                "message": "All evaluations have notes for all students"
            })
    
    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        # Get the bulletin data
        etudiant = serializer.validated_data.get('etudiant')
        periode = serializer.validated_data.get('periode')
        
        # Get all matieres for the student's class
        student_class = etudiant.classe
        if not student_class:
            raise ValidationError("Student is not assigned to any class")
        
        # Get all matieres for the class
        matieres = student_class.get_matieres()
        
        # Check if all matieres have at least one evaluation for the periode
        for matiere in matieres:
            # Get evaluations for this matiere, class, and periode
            evaluations = Evaluation.objects.filter(
                matiere=matiere,
                classe=student_class,
                periode=periode
            )
            
            if not evaluations.exists():
                raise ValidationError(f"No evaluations found for {matiere.nom} in this periode")
            
            # Check if this student has notes for ALL evaluations in this matiere
            for evaluation in evaluations:
                note_exists = Note.objects.filter(
                    evaluation=evaluation,
                    etudiant=etudiant
                ).exists()
                if not note_exists:
                    raise ValidationError(
                        f"Missing note for {evaluation.get_type_display()} in {matiere.nom}"
                    )
        
        # If all checks pass, save and calculate average
        bulletin = serializer.save()
        bulletin.calculate_moyenne()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Get matiere details with moyenne and etat
        from grades.models import Note
        notes = Note.objects.filter(
            etudiant=instance.etudiant,
            evaluation__periode=instance.periode,
            est_absent=False,
            valeur_note__isnull=False
        ).select_related('evaluation__matiere')
        
        matiere_notes = {}
        for note in notes:
            m_id = note.evaluation.matiere.id
            if m_id not in matiere_notes:
                matiere_notes[m_id] = {
                    'id': m_id,
                    'nom': note.evaluation.matiere.nom,
                    'coefficient': note.evaluation.matiere.coefficient,
                    'notes': [],
                    'moyenne': 0,
                    'etat': 'Non Valide'
                }
            matiere_notes[m_id]['notes'].append(note.valeur_note)
        
        matieres_list = []
        for m_id, data in matiere_notes.items():
            data['moyenne'] = sum(data['notes']) / len(data['notes'])
            data['etat'] = 'Valide' if data['moyenne'] >= 10 else 'Non Valide'
            matieres_list.append(data)
        
        return Response({
            **serializer.data,
            'matieres': matieres_list
        })
    
    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        from weasyprint import HTML
        instance = self.get_object()
        
        # Get matiere details
        from grades.models import Note
        notes = Note.objects.filter(
            etudiant=instance.etudiant,
            evaluation__periode=instance.periode,
            est_absent=False,
            valeur_note__isnull=False
        ).select_related('evaluation__matiere')
        
        matiere_notes = {}
        for note in notes:
            m_id = note.evaluation.matiere.id
            if m_id not in matiere_notes:
                matiere_notes[m_id] = {
                    'id': m_id,
                    'nom': note.evaluation.matiere.nom,
                    'coefficient': note.evaluation.matiere.coefficient,
                    'notes': [],
                    'moyenne': 0,
                    'etat': 'Non Valide'
                }
            matiere_notes[m_id]['notes'].append(note.valeur_note)
        
        matieres_list = []
        for m_id, data in matiere_notes.items():
            data['moyenne'] = sum(data['notes']) / len(data['notes'])
            data['etat'] = 'Valide' if data['moyenne'] >= 10 else 'Non Valide'
            matieres_list.append(data)
        
        # Render HTML template
        html_string = render_to_string('bulletin.html', {
            'bulletin': instance,
            'matieres': matieres_list,
            'etudiant': instance.etudiant,
            'periode': instance.periode,
        })
        
        # Generate PDF
        html = HTML(string=html_string)
        pdf_file = html.write_pdf()
        
        # Create response
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="bulletin_{instance.etudiant.utilisateur.last_name}_{instance.etudiant.utilisateur.first_name}_{instance.periode.code}.pdf"'
        
        return response
