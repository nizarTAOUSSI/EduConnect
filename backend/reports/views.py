from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Bulletin
from .serializers import BulletinSerializer
from grades.models import Evaluation, Note
from academics.models import Matiere

class BulletinViewSet(viewsets.ModelViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
    permission_classes = [IsAuthenticated]
    
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
        
        # Check if all matieres have at least one evaluation with notes for the periode
        for matiere in matieres:
            # Get evaluations for this matiere, class, and periode
            evaluations = Evaluation.objects.filter(
                matiere=matiere,
                classe=student_class,
                periode=periode
            )
            
            if not evaluations.exists():
                raise ValidationError(f"No evaluations found for {matiere.nom} in this periode")
            
            # Check if all evaluations have notes for the student
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
