from django.db import models
from accounts.models import Enseignant


class Periode(models.Model):
    """Période scolaire (semestre, trimestre, année…)."""
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
        """Retourne toutes les matières couvertes durant cette période (via EnseignantMatiere)."""
        from .models import EnseignantMatiere
        return EnseignantMatiere.objects.filter(periode=self).select_related('matiere')


class Matiere(models.Model):
    """Matière enseignée avec son coefficient."""
    nom         = models.CharField(max_length=150, verbose_name='Nom de la matière')
    coefficient = models.PositiveSmallIntegerField(default=1, verbose_name='Coefficient')

    class Meta:
        verbose_name        = 'Matière'
        verbose_name_plural = 'Matières'
        ordering            = ['nom']

    def __str__(self):
        return f'{self.nom} (coeff. {self.coefficient})'


class Classe(models.Model):
    """Classe regroupant des étudiants."""
    nom    = models.CharField(max_length=100, verbose_name='Nom')
    niveau = models.CharField(max_length=100, verbose_name='Niveau')

    class Meta:
        verbose_name        = 'Classe'
        verbose_name_plural = 'Classes'
        ordering            = ['niveau', 'nom']

    def __str__(self):
        return f'{self.nom} – {self.niveau}'

    def get_enseignants(self):
        """Retourne tous les enseignants affectés à cette classe."""
        return Enseignant.objects.filter(
            enseignant_matieres__classe=self
        ).distinct()

    def get_matieres(self):
        """Retourne toutes les matières enseignées dans cette classe."""
        return Matiere.objects.filter(
            enseignant_matieres__classe=self
        ).distinct()

    def get_etudiants(self):
        """Retourne tous les étudiants inscrits dans cette classe."""
        from accounts.models import Etudiant
        return Etudiant.objects.filter(classe=self)


class EnseignantMatiere(models.Model):
    """
    Modèle intermédiaire reliant un enseignant, une matière et une classe.
    Représente une affectation d'enseignement concrète.
    """
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
        """Retourne toutes les absences liées à cette affectation."""
        return self.absences.all()

    def get_evaluations(self):
        """Retourne les évaluations liées à la matière et classe de cette affectation."""
        from grades.models import Evaluation
        return Evaluation.objects.filter(matiere=self.matiere, classe=self.classe)


class Absence(models.Model):
    """Absence d'un étudiant lors d'un cours donné."""
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
        """Retourne True si l'absence est justifiée."""
        return self.justifiee
