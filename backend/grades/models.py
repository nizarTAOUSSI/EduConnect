from django.core.exceptions import ValidationError
from django.db import models
from academics.models import Matiere, Classe, Periode
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
    date     = models.DateField(verbose_name='Date de l\'évaluation', null=True, blank=True)
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
    periode = models.ForeignKey(
        Periode,
        on_delete=models.CASCADE,
        related_name='evaluations',
        verbose_name='Période',
        null=True,
        blank=True,
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
        from academics.models import Seance, EnseignantMatiere, AnneeScolaire, Periode
        
        if self.date:
            # Check date is in an AnneeScolaire
            annee = AnneeScolaire.objects.filter(
                date_debut__lte=self.date,
                date_fin__gte=self.date
            ).first()
            if not annee:
                raise ValidationError(
                    f"La date {self.date} n'appartient à aucune année scolaire."
                )
            
            # Check date is in a Periode that belongs to the same AnneeScolaire
            periode_exists = Periode.objects.filter(
                annee_scolaire=annee,
                date_debut__lte=self.date,
                date_fin__gte=self.date
            ).exists()
            if not periode_exists:
                raise ValidationError(
                    f"La date {self.date} n'appartient à aucune période (semestre) de l'année scolaire {annee.nom}."
                )
        
        if self.enseignant and self.matiere and self.classe:
            if not EnseignantMatiere.objects.filter(
                enseignant=self.enseignant,
                matiere=self.matiere,
                classe=self.classe
            ).exists():
                raise ValidationError(
                    f"L'enseignant {self.enseignant.utilisateur.get_full_name()} n'est pas affecté à la matière "
                    f"'{self.matiere.nom}' pour la classe '{self.classe.nom}'."
                )
        if not self.date or not self.heure_debut or not self.heure_fin:
            return
        if self.date.weekday() == 6: 
            raise ValidationError("Les évaluations ne peuvent pas être programmées le dimanche.")
        if self.heure_debut >= self.heure_fin:
            raise ValidationError("L'heure de début doit être antérieure à l'heure de fin.")
        if self.salle and self.salle.capacite is not None:
            etudiants_count = self.classe.get_etudiants().count()
            if etudiants_count > self.salle.capacite:
                raise ValidationError(
                    f"La capacité de la salle {self.salle.nom} ({self.salle.capacite} places) est insuffisante "
                    f"pour le nombre d'étudiants de la classe {self.classe.nom} ({etudiants_count} étudiants)."
                )
        eval_overlaps = Evaluation.objects.filter(
            date=self.date,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if self.pk:
            eval_overlaps = eval_overlaps.exclude(pk=self.pk)
        if eval_overlaps.filter(classe=self.classe).exists():
            raise ValidationError("Cette classe a déjà une évaluation prévue sur ce créneau.")
        if self.enseignant and eval_overlaps.filter(enseignant=self.enseignant).exists():
            raise ValidationError("L'enseignant a déjà une évaluation prévue sur ce créneau.")
        if self.salle and eval_overlaps.filter(salle=self.salle).exists():
            raise ValidationError(f"La salle {self.salle.nom} est déjà occupée par une autre évaluation sur ce créneau.")
        days_map = {
            0: 'lundi',
            1: 'mardi',
            2: 'mercredi',
            3: 'jeudi',
            4: 'vendredi',
            5: 'samedi',
            6: 'dimanche'
        }
        day_of_week = days_map[self.date.weekday()]
        seance_overlaps = Seance.objects.filter(
            jour=day_of_week,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if seance_overlaps.filter(classe=self.classe).exists():
            overlap = seance_overlaps.filter(classe=self.classe).first()
            raise ValidationError(f"Conflit avec un cours existant : {overlap.matiere.nom} pour cette classe.")
        if self.enseignant and seance_overlaps.filter(enseignant_matiere__enseignant=self.enseignant).exists():
            overlap = seance_overlaps.filter(enseignant_matiere__enseignant=self.enseignant).first()
            raise ValidationError(f"L'enseignant a déjà un cours ({overlap.matiere.nom}) sur ce créneau.")
        if self.salle and seance_overlaps.filter(salle=self.salle).exists():
            overlap = seance_overlaps.filter(salle=self.salle).first()
            raise ValidationError(f"La salle {self.salle.nom} est occupée par le cours {overlap.matiere.nom} ({overlap.classe.nom}).")
    def save(self, *args, **kwargs):
        if self.date:
            from academics.models import AnneeScolaire
            annee = AnneeScolaire.objects.get(date_debut__lte=self.date, date_fin__gte=self.date)
            periode = Periode.objects.get(
                annee_scolaire=annee,
                date_debut__lte=self.date,
                date_fin__gte=self.date
            )
            self.periode = periode
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
    created_at = models.DateTimeField(auto_now_add=True, null=True)
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
