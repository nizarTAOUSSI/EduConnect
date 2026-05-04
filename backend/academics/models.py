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

class Absence(models.Model):

    enseignant_matiere = models.ForeignKey(
        EnseignantMatiere,
        on_delete=models.CASCADE,
        related_name='absences',
        verbose_name='Cours (Enseignant-Matière)',
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

    class Meta:
        verbose_name        = 'Absence'
        verbose_name_plural = 'Absences'
        ordering            = ['-date']

    def __str__(self):
        status = 'justifiée' if self.justifiee else 'non justifiée'
        return f'{self.etudiant} – {self.enseignant_matiere.matiere} – {self.date} [{status}]'

    def is_justified(self):

        return self.justifiee