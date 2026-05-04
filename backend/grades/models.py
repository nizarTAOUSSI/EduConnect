from django.core.exceptions import ValidationError
from django.db import models
from academics.models import Matiere, Classe
from accounts.models import Etudiant

class Evaluation(models.Model):

    class TypeEvaluation(models.TextChoices):
        CC     = 'CC',     'Contrôle Continu'
        EXAMEN = 'Examen', 'Examen Final'
        TP     = 'TP',     'Travaux Pratiques'

    type     = models.CharField(
        max_length=20,
        choices=TypeEvaluation.choices,
        verbose_name='Type d\'évaluation',
    )
    date     = models.DateField(verbose_name='Date de l\'évaluation')
    note_max = models.FloatField(default=20.0, verbose_name='Note maximale')
    matiere  = models.ForeignKey(
        Matiere,
        on_delete=models.CASCADE,
        related_name='evaluations',
        verbose_name='Matière',
    )
    classe   = models.ForeignKey(
        Classe,
        on_delete=models.CASCADE,
        related_name='evaluations',
        verbose_name='Classe',
    )

    class Meta:
        verbose_name        = 'Évaluation'
        verbose_name_plural = 'Évaluations'
        ordering            = ['-date']

    def __str__(self):
        return f'{self.get_type_display()} – {self.matiere} – {self.classe} ({self.date})'

class Note(models.Model):

    evaluation  = models.ForeignKey(
        Evaluation,
        on_delete=models.CASCADE,
        related_name='notes',
        verbose_name='Évaluation',
    )
    etudiant    = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name='notes',
        verbose_name='Étudiant',
    )
    valeur_note = models.FloatField(
        null=True,
        blank=True,
        verbose_name='Note obtenue',
    )
    commentaire = models.TextField(blank=True, default='', verbose_name='Commentaire')
    est_absent  = models.BooleanField(
        default=False,
        verbose_name='Absent',
        help_text='Si coché, la note ne sera pas comptabilisée dans la moyenne.',
    )

    class Meta:
        verbose_name        = 'Note'
        verbose_name_plural = 'Notes'

        unique_together = [('evaluation', 'etudiant')]

    def clean(self):

        if self.est_absent and self.valeur_note is not None:
            raise ValidationError({
                'valeur_note': (
                    "Impossible de saisir une note pour un étudiant absent. "
                    "Laissez le champ vide ou décochez la case « Absent »."
                )
            })

    def save(self, *args, **kwargs):

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def note_effective(self):

        if self.est_absent:
            return None
        return self.valeur_note

    def __str__(self):
        if self.est_absent:
            return f'{self.etudiant} – {self.evaluation} : ABSENT'
        return f'{self.etudiant} – {self.evaluation} : {self.valeur_note}'