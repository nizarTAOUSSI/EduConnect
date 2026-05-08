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
    heure_debut = models.TimeField(verbose_name='Heure de début', null=True, blank=True)
    heure_fin   = models.TimeField(verbose_name='Heure de fin', null=True, blank=True)
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
    enseignant = models.ForeignKey(
        'accounts.Enseignant',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations',
        verbose_name='Enseignant',
    )
    salle = models.ForeignKey(
        'academics.Salle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluations',
        verbose_name='Salle',
    )

    class Meta:
        verbose_name        = 'Évaluation'
        verbose_name_plural = 'Évaluations'
        ordering            = ['-date']

    def clean(self):
        from django.core.exceptions import ValidationError
        from academics.models import Seance
        import datetime

        if not self.date or not self.heure_debut or not self.heure_fin:
            return

        if self.heure_debut >= self.heure_fin:
            raise ValidationError({'heure_debut': "L'heure de début doit être antérieure à l'heure de fin."})

        # Get day of week for the evaluation date
        days_map = {
            0: 'lundi', 1: 'mardi', 2: 'mercredi', 3: 'jeudi',
            4: 'vendredi', 5: 'samedi', 6: 'dimanche'
        }
        day_of_week = days_map[self.date.weekday()]

        # 1. Overlap check for the same class
        # Check against other Evaluations
        eval_overlaps = Evaluation.objects.filter(
            classe=self.classe,
            date=self.date,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if self.pk:
            eval_overlaps = eval_overlaps.exclude(pk=self.pk)
        
        if eval_overlaps.exists():
            raise ValidationError("Cette classe a déjà une évaluation prévue sur ce créneau.")

        # Check against Seances (weekly schedule)
        seance_overlaps = Seance.objects.filter(
            classe=self.classe,
            jour=day_of_week,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if seance_overlaps.exists():
            overlap = seance_overlaps.first()
            raise ValidationError(
                f"La classe a déjà un cours de {overlap.matiere.nom} programmé à cette heure (chaque {day_of_week})."
            )

        # 2. Overlap check for the same teacher
        if self.enseignant:
            # Teacher vs other Evaluations
            teacher_eval_overlaps = Evaluation.objects.filter(
                enseignant=self.enseignant,
                date=self.date,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            )
            if self.pk:
                teacher_eval_overlaps = teacher_eval_overlaps.exclude(pk=self.pk)
            
            if teacher_eval_overlaps.exists():
                raise ValidationError(f"L'enseignant a déjà une autre évaluation prévue sur ce créneau.")

            # Teacher vs Seances
            teacher_seance_overlaps = Seance.objects.filter(
                enseignant_matiere__enseignant=self.enseignant,
                jour=day_of_week,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            )
            if teacher_seance_overlaps.exists():
                overlap = teacher_seance_overlaps.first()
                raise ValidationError(
                    f"L'enseignant a déjà un cours de {overlap.matiere.nom} avec la classe {overlap.classe.nom} à cette heure."
                )

        # 3. Overlap check for the same salle
        if self.salle:
            # Salle vs other Evaluations
            salle_eval_overlaps = Evaluation.objects.filter(
                salle=self.salle,
                date=self.date,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            )
            if self.pk:
                salle_eval_overlaps = salle_eval_overlaps.exclude(pk=self.pk)
            
            if salle_eval_overlaps.exists():
                raise ValidationError(f"La salle {self.salle.nom} est déjà occupée par une autre évaluation.")

            # Salle vs Seances
            salle_seance_overlaps = Seance.objects.filter(
                salle=self.salle,
                jour=day_of_week,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            )
            if salle_seance_overlaps.exists():
                overlap = salle_seance_overlaps.first()
                raise ValidationError(
                    f"La salle {self.salle.nom} est déjà occupée par le cours de {overlap.matiere.nom} ({overlap.classe.nom})."
                )

            # Capacity check
            if self.salle.capacite is not None:
                etudiants_count = self.classe.get_etudiants().count()
                if etudiants_count > self.salle.capacite:
                    raise ValidationError(
                        f"La salle {self.salle.nom} est trop petite ({self.salle.capacite} places) "
                        f"pour cette classe ({etudiants_count} étudiants)."
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

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