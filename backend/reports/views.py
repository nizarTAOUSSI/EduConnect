from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse
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
        
    
        evaluations = Evaluation.objects.filter(
            classe=classe,
            periode=periode
        )
        
        if not evaluations.exists():
            return Response({
                "complete": False,
                "message": "No evaluations found for this class and periode"
            })
        
    
        if etudiant_id:
            
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
        
            students = classe.get_etudiants()
            if not students.exists():
                return Response({
                    "complete": False,
                    "message": "No students in this class"
                })
        
        
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
        

        etudiant = serializer.validated_data.get('etudiant')
        periode = serializer.validated_data.get('periode')
        
    
        student_class = etudiant.classe
        if not student_class:
            raise ValidationError("Student is not assigned to any class")
        
        
        matieres = student_class.get_matieres()
        
        
        for matiere in matieres:
            
            evaluations = Evaluation.objects.filter(
                matiere=matiere,
                classe=student_class,
                periode=periode
            )
            
            if not evaluations.exists():
                raise ValidationError(f"No evaluations found for {matiere.nom} in this periode")
            
            
            for evaluation in evaluations:
                note_exists = Note.objects.filter(
                    evaluation=evaluation,
                    etudiant=etudiant
                ).exists()
                if not note_exists:
                    raise ValidationError(
                        f"Missing note for {evaluation.get_type_display()} in {matiere.nom}"
                    )
        
        
        bulletin = serializer.save()
        bulletin.calculate_moyenne()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
    
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
        from io import BytesIO
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.units import inch
        
        instance = self.get_object()
        
        
        buffer = BytesIO()
        
 
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
      
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            textColor=colors.HexColor('#10b981'),
            alignment=1,
            spaceAfter=30
        )
        elements.append(Paragraph('Bulletin de Notes', title_style))
        
        info_style = ParagraphStyle(
            'CustomInfo',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=20
        )
        
        student_info = []
        try:
            last_name = instance.etudiant.utilisateur.last_name if hasattr(instance.etudiant, 'utilisateur') else 'N/A'
            first_name = instance.etudiant.utilisateur.first_name if hasattr(instance.etudiant, 'utilisateur') else 'N/A'
            classe = instance.etudiant.classe.nom if hasattr(instance.etudiant, 'classe') and instance.etudiant.classe else 'N/A'
            niveau = instance.etudiant.classe.niveau if hasattr(instance.etudiant, 'classe') and instance.etudiant.classe else 'N/A'
            periode = instance.periode.nom if hasattr(instance.periode, 'nom') else 'N/A'
            annee_scolaire = instance.periode.annee_scolaire.nom if hasattr(instance.periode, 'annee_scolaire') and instance.periode.annee_scolaire else 'N/A'
        except:
            last_name = first_name = classe = niveau = periode = annee_scolaire = 'N/A'
        
        student_info.append(Paragraph(f'<b>Nom:</b> {last_name}', info_style))
        student_info.append(Paragraph(f'<b>Prénom:</b> {first_name}', info_style))
        student_info.append(Paragraph(f'<b>Classe:</b> {classe}', info_style))
        student_info.append(Paragraph(f'<b>Niveau:</b> {niveau}', info_style))
        student_info.append(Paragraph(f'<b>Période:</b> {periode}', info_style))
        student_info.append(Paragraph(f'<b>Année Scolaire:</b> {annee_scolaire}', info_style))
        
        elements.extend(student_info)
        elements.append(Spacer(1, 20))
        
    
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
        total_weighted_notes = 0
        total_coefficients = 0
        for m_id, data in matiere_notes.items():
            data['moyenne'] = sum(data['notes']) / len(data['notes'])
            data['etat'] = 'Valide' if data['moyenne'] >= 10 else 'Non Valide'
            matieres_list.append(data)
            

            total_weighted_notes += data['moyenne'] * data['coefficient']
            total_coefficients += data['coefficient']
        
        if total_coefficients > 0:
            pdf_moyenne_generale = total_weighted_notes / total_coefficients
        else:
            pdf_moyenne_generale = 0
        
    
        table_data = [['Matière', 'Coefficient', 'Moyenne', 'État']]
        for matiere in matieres_list:
            table_data.append([
                matiere['nom'],
                str(matiere['coefficient']),
                f"{matiere['moyenne']:.2f}/20",
                matiere['etat']
            ])
        
      
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 30))
        
  
        avg_style = ParagraphStyle(
            'CustomAverage',
            parent=styles['Heading2'],
            textColor=colors.HexColor('#10b981'),
            alignment=1
        )
        elements.append(Paragraph(f'Moyenne Générale: {pdf_moyenne_generale:.2f}/20', avg_style))
        
     
        if instance.mention:
            mention_style = ParagraphStyle(
                'CustomMention',
                parent=styles['Normal'],
                textColor=colors.HexColor('#4f46e5'),
                alignment=1,
                fontSize=14
            )
            try:
                mention_display = instance.get_mention_display_label() if hasattr(instance, 'get_mention_display_label') else instance.get_mention_display()
            except:
                mention_display = instance.mention
            elements.append(Paragraph(f'Mention: {mention_display}', mention_style))
        
    
        doc.build(elements)
        
      
        buffer.seek(0)
        pdf_data = buffer.getvalue()
        buffer.close()
        
       
        response = HttpResponse(pdf_data, content_type='application/pdf')
        try:
            last_name = instance.etudiant.utilisateur.last_name if hasattr(instance.etudiant, 'utilisateur') and instance.etudiant.utilisateur else 'etudiant'
            first_name = instance.etudiant.utilisateur.first_name if hasattr(instance.etudiant, 'utilisateur') and instance.etudiant.utilisateur else ''
            periode_code = instance.periode.code if hasattr(instance.periode, 'code') and instance.periode.code else 'periode'
            filename = f"bulletin_{last_name}_{first_name}_{periode_code}.pdf".replace(' ', '_')
        except:
            filename = "bulletin.pdf"
        
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
