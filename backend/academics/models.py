from django.db import models
from accounts.models import Enseignant

class Periode(models.Model):

    nom        = models.CharField(max_length=100, verbose_name='Nom')
    date_debut = models.DateField(verbose_name='Date de début')
    date_fin   = models.DateField(verbose_name='Date de fin')
    est_active = models.BooleanField(default=False, verbose_name='Période active')

    class Meta:
        verbose_name        = 'Période'
        verbose_name_plural = 'Périodes'
        ordering            = ['-date_debut']

    def __str__(self):
        return f'{self.nom} ({"active" if self.est_active else "inactive"})'

    def get_matieres(self):

        from .models import EnseignantMatiere
        return EnseignantMatiere.objects.filter(periode=self).select_related('matiere')

class Matiere(models.Model):

    nom         = models.CharField(max_length=150, verbose_name='Nom de la matière')
    coefficient = models.PositiveSmallIntegerField(default=1, verbose_name='Coefficient')

    class Meta:
        verbose_name        = 'Matière'
        verbose_name_plural = 'Matières'
        ordering            = ['nom']

    def __str__(self):
        return f'{self.nom} (coeff. {self.coefficient})'

class Classe(models.Model):

    nom    = models.CharField(max_length=100, verbose_name='Nom')
    niveau = models.CharField(max_length=100, verbose_name='Niveau')

    class Meta:
        verbose_name        = 'Classe'
        verbose_name_plural = 'Classes'
        ordering            = ['niveau', 'nom']

    def __str__(self):
        return f'{self.nom} – {self.niveau}'

    def get_enseignants(self):

        return Enseignant.objects.filter(
            enseignant_matieres__classe=self
        ).distinct()

    def get_matieres(self):

        return Matiere.objects.filter(
            enseignant_matieres__classe=self
        ).distinct()

    def get_etudiants(self):

        from accounts.models import Etudiant
        return Etudiant.objects.filter(classe=self)

class Salle(models.Model):
    nom = models.CharField(max_length=100, verbose_name='Nom de la salle')
    capacite = models.PositiveIntegerField(verbose_name='Capacité', null=True, blank=True)
    description = models.TextField(verbose_name='Description', null=True, blank=True)

    class Meta:
        verbose_name = 'Salle'
        verbose_name_plural = 'Salles'
        ordering = ['nom']

    def __str__(self):
        return self.nom

class EnseignantMatiere(models.Model):

    enseignant = models.ForeignKey(
        Enseignant,
        on_delete=models.CASCADE,
        related_name='enseignant_matieres',
        verbose_name='Enseignant',
    )
    matiere = models.ForeignKey(
        Matiere,
        on_delete=models.CASCADE,
        related_name='enseignant_matieres',
        verbose_name='Matière',
    )
    classe = models.ForeignKey(
        Classe,
        on_delete=models.CASCADE,
        related_name='enseignant_matieres',
        verbose_name='Classe',
    )

    class Meta:
        verbose_name        = 'Affectation Enseignant-Matière'
        verbose_name_plural = 'Affectations Enseignant-Matière'
        unique_together     = [('enseignant', 'matiere', 'classe')]

    def __str__(self):
        return f'{self.enseignant} → {self.matiere} ({self.classe})'

    def get_absences(self):

        return self.absences.all()

    def get_evaluations(self):

        from grades.models import Evaluation
        return Evaluation.objects.filter(matiere=self.matiere, classe=self.classe)

class Seance(models.Model):
    DAYS_OF_WEEK = [
        ('lundi', 'Lundi'),
        ('mardi', 'Mardi'),
        ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'),
        ('vendredi', 'Vendredi'),
        ('samedi', 'Samedi'),
        ('dimanche', 'Dimanche'),
    ]
    classe = models.ForeignKey(
        Classe,
        on_delete=models.CASCADE,
        related_name='seances',
        verbose_name='Classe'
    )
    matiere = models.ForeignKey(
        Matiere,
        on_delete=models.CASCADE,
        related_name='seances',
        verbose_name='Matière'
    )
    enseignant_matiere = models.ForeignKey(
        EnseignantMatiere,
        on_delete=models.CASCADE,
        related_name='seances',
        verbose_name='Enseignant-Matière'
    )
    salle = models.ForeignKey(
        Salle,
        on_delete=models.SET_NULL,
        related_name='seances',
        verbose_name='Salle',
        null=True,
        blank=True
    )
    jour = models.CharField(max_length=10, choices=DAYS_OF_WEEK, verbose_name='Jour')
    heure_debut = models.TimeField(verbose_name='Heure de début')
    heure_fin = models.TimeField(verbose_name='Heure de fin')

    class Meta:
        verbose_name = 'Séance'
        verbose_name_plural = 'Séances'
        ordering = ['jour', 'heure_debut']

    def __str__(self):
        return f'{self.matiere.nom} - {self.classe.nom} ({self.get_jour_display()} {self.heure_debut}-{self.heure_fin})'

    def clean(self):
        from django.core.exceptions import ValidationError
        
        if not self.enseignant_matiere or not self.classe or not self.matiere:
            return

        # Coherence check
        if self.enseignant_matiere.classe != self.classe:
            raise ValidationError("L'affectation Enseignant-Matière ne correspond pas à la classe sélectionnée.")
        if self.enseignant_matiere.matiere != self.matiere:
            raise ValidationError("L'affectation Enseignant-Matière ne correspond pas à la matière sélectionnée.")
        
        # Time validation
        if self.heure_debut >= self.heure_fin:
            raise ValidationError("L'heure de début doit être antérieure à l'heure de fin.")
            
        # Overlap check for the same class
        overlaps = Seance.objects.filter(
            classe=self.classe,
            jour=self.jour,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if self.pk:
            overlaps = overlaps.exclude(pk=self.pk)
            
        if overlaps.exists():
            raise ValidationError("Cette séance chevauche une autre séance déjà programmée pour cette classe.")

        # Overlap check for the same teacher
        teacher_overlaps = Seance.objects.filter(
            enseignant_matiere__enseignant=self.enseignant_matiere.enseignant,
            jour=self.jour,
            heure_debut__lt=self.heure_fin,
            heure_fin__gt=self.heure_debut
        )
        if self.pk:
            teacher_overlaps = teacher_overlaps.exclude(pk=self.pk)

        if teacher_overlaps.exists():
            overlap = teacher_overlaps.first()
            raise ValidationError(
                f"L'enseignant a déjà un cours ({overlap.matiere.nom} - {overlap.classe.nom}) sur ce créneau."
            )

        # Overlap check for the same salle
        if self.salle:
            salle_overlaps = Seance.objects.filter(
                salle=self.salle,
                jour=self.jour,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            )
            if self.pk:
                salle_overlaps = salle_overlaps.exclude(pk=self.pk)
            
            if salle_overlaps.exists():
                overlap = salle_overlaps.first()
                raise ValidationError(
                    f"La salle {self.salle.nom} est déjà occupée par le cours {overlap.matiere.nom} - {overlap.classe.nom} sur ce créneau."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class Absence(models.Model):

    enseignant_matiere = models.ForeignKey(
        EnseignantMatiere,
        on_delete=models.CASCADE,
        related_name='absences',
        verbose_name='Cours (Enseignant-Matière)',
    )
    seance = models.ForeignKey(
        Seance,
        on_delete=models.CASCADE,
        related_name='absences',
        verbose_name='Séance',
        null=True,
        blank=True
    )
    etudiant = models.ForeignKey(
        'accounts.Etudiant',
        on_delete=models.CASCADE,
        related_name='absences',
        verbose_name='Étudiant',
    )
    date          = models.DateField(verbose_name='Date')
    motif         = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name='Motif',
    )
    justifiee     = models.BooleanField(default=False, verbose_name='Justifiée')
    duree_heures  = models.FloatField(verbose_name='Durée (heures)', default=1.0)

    def clean(self):
        from django.core.exceptions import ValidationError
        from datetime import date

        if self.seance and self.date:
           
            # Dictionnaire de traduction des jours (weekday() : 0=Lundi, ..., 6=Dimanche)
            days_map = {
                0: 'lundi',
                1: 'mardi',
                2: 'mercredi',
                3: 'jeudi',
                4: 'vendredi',
                5: 'samedi',
                6: 'dimanche'
            }
            # Le jour de la date choisie
            day_of_date = days_map[self.date.weekday()]
            
            if day_of_date != self.seance.jour:
                raise ValidationError(
                    f"La date choisie ({self.date}) est un {day_of_date}, "
                    f"mais la séance sélectionnée est programmée le {self.seance.jour}."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.seance:
            # Calculer la durée basée sur la séance
            from datetime import datetime, date
            d1 = datetime.combine(date.today(), self.seance.heure_fin)
            d2 = datetime.combine(date.today(), self.seance.heure_debut)
            diff = d1 - d2
            self.duree_heures = diff.total_seconds() / 3600.0
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name        = 'Absence'
        verbose_name_plural = 'Absences'
        ordering            = ['-date']
        unique_together     = [('etudiant', 'seance', 'date')]

    def __str__(self):
        status = 'justifiée' if self.justifiee else 'non justifiée'
        return f'{self.etudiant} – {self.enseignant_matiere.matiere} – {self.date} [{status}]'

    def is_justified(self):

        return self.justifiee