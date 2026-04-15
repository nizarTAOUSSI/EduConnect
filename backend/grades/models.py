from django.core.exceptions import ValidationError
from django.db import models
from academics.models import Matiere, Classe
from accounts.models import Etudiant


class Evaluation(models.Model):
    """
    Évaluation associée à une matière et une classe.
    Exemple de types : CC (Contrôle Continu), Examen, TP.
    """
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
    """
    Note d'un étudiant pour une évaluation donnée.

    Règle métier : si est_absent == True, valeur_note doit être None.
    La validation métier est appliquée dans clean() et full_clean() est
    appelé automatiquement dans save() pour garantir l'intégrité.
    """
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
        # Un étudiant ne peut avoir qu'une seule note par évaluation
        unique_together = [('evaluation', 'etudiant')]

    # ------------------------------------------------------------------
    # Règle métier : absence et note incompatibles
    # ------------------------------------------------------------------
    def clean(self):
        """
        Empêche la saisie d'une valeur_note quand l'étudiant est absent.
        Cette méthode est appelée par full_clean() et les formulaires Django.
        """
        if self.est_absent and self.valeur_note is not None:
            raise ValidationError({
                'valeur_note': (
                    "Impossible de saisir une note pour un étudiant absent. "
                    "Laissez le champ vide ou décochez la case « Absent »."
                )
            })

    def save(self, *args, **kwargs):
        """
        Override de save() pour appliquer full_clean() avant chaque
        enregistrement, garantissant la règle métier même hors formulaire.
        """
        self.full_clean()
        super().save(*args, **kwargs)

    # ------------------------------------------------------------------
    # Propriété utilitaire
    # ------------------------------------------------------------------
    @property
    def note_effective(self):
        """
        Retourne la note prise en compte dans la moyenne :
        - None si absent (exclu du calcul)
        - 0.0  si la configuration choisit de pénaliser l'absence
        - valeur_note sinon
        """
        if self.est_absent:
            return None          # Exclure du calcul de moyenne
        return self.valeur_note

    def __str__(self):
        if self.est_absent:
            return f'{self.etudiant} – {self.evaluation} : ABSENT'
        return f'{self.etudiant} – {self.evaluation} : {self.valeur_note}'
