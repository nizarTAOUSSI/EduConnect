from django.db import models
from accounts.models import Etudiant
from academics.models import Periode

class Bulletin(models.Model):

    class Mention(models.TextChoices):
        TRES_BIEN  = 'TB', 'Très Bien'
        BIEN       = 'B',  'Bien'
        ASSEZ_BIEN = 'AB', 'Assez Bien'
        PASSABLE   = 'P',  'Passable'
        INSUFFISANT = 'I', 'Insuffisant'

    etudiant         = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name='bulletins',
        verbose_name='Étudiant',
    )
    periode          = models.ForeignKey(
        Periode,
        on_delete=models.CASCADE,
        related_name='bulletins',
        verbose_name='Période',
    )
    moyenne_generale = models.FloatField(verbose_name='Moyenne générale')
    rang             = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='Rang dans la classe',
    )
    date_generation  = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de génération',
    )
    mention          = models.CharField(
        max_length=2,
        choices=Mention.choices,
        null=True,
        blank=True,
        verbose_name='Mention',
    )
    valide_St        = models.BooleanField(
        default=False,
        verbose_name='Validé par l\'étudiant',
    )
    validation_jury  = models.BooleanField(
        default=False,
        verbose_name='Validé par le jury',
    )

    class Meta:
        verbose_name        = 'Bulletin'
        verbose_name_plural = 'Bulletins'
        unique_together     = [('etudiant', 'periode')]
        ordering            = ['rang']

    def __str__(self):
        return (
            f'Bulletin – {self.etudiant} | {self.periode} | '
            f'Moy. {self.moyenne_generale:.2f} | Rang {self.rang}'
        )

    def get_mention_display_label(self):

        return self.get_mention_display()

    def is_validated(self):

        return self.valide_St and self.validation_jury

    def calculate_moyenne(self):
        """Calculates the weighted average based on Matiere coefficients."""
        from grades.models import Note
        
        # Get all notes for this student in evaluations that occurred during this period
        notes = Note.objects.filter(
            etudiant=self.etudiant,
            evaluation__date__range=(self.periode.date_debut, self.periode.date_fin),
            est_absent=False,
            valeur_note__isnull=False
        ).select_related('evaluation__matiere')
        
        if not notes.exists():
            self.moyenne_generale = 0.0
            return 0.0
            
        total_weighted_notes = 0
        total_coefficients = 0
        
        # We group by matiere to get the average per matiere first, 
        # then apply the coefficient for the general average
        matiere_notes = {}
        for note in notes:
            m_id = note.evaluation.matiere.id
            if m_id not in matiere_notes:
                matiere_notes[m_id] = {
                    'notes': [],
                    'coeff': note.evaluation.matiere.coefficient
                }
            matiere_notes[m_id]['notes'].append(note.valeur_note)
            
        for m_id, data in matiere_notes.items():
            matiere_avg = sum(data['notes']) / len(data['notes'])
            total_weighted_notes += matiere_avg * data['coeff']
            total_coefficients += data['coeff']
            
        if total_coefficients > 0:
            self.moyenne_generale = total_weighted_notes / total_coefficients
        else:
            self.moyenne_generale = 0.0
            
        self.calculate_mention()
        self.save()
        return self.moyenne_generale

    def calculate_mention(self):

        avg = self.moyenne_generale
        if avg >= 16:
            self.mention = self.Mention.TRES_BIEN
        elif avg >= 14:
            self.mention = self.Mention.BIEN
        elif avg >= 12:
            self.mention = self.Mention.ASSEZ_BIEN
        elif avg >= 10:
            self.mention = self.Mention.PASSABLE
        else:
            self.mention = self.Mention.INSUFFISANT
        return self.mention