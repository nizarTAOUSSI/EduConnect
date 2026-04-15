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
    """Classe regroupant des étudiants, des enseignants et des matières."""
    nom        = models.CharField(max_length=100, verbose_name='Nom')
    niveau     = models.CharField(max_length=100, verbose_name='Niveau')
    enseignants = models.ManyToManyField(
        Enseignant,
        related_name='classes',
        blank=True,
        verbose_name='Enseignants',
    )
    matieres = models.ManyToManyField(
        Matiere,
        related_name='classes',
        blank=True,
        verbose_name='Matières',
    )

    class Meta:
        verbose_name        = 'Classe'
        verbose_name_plural = 'Classes'
        ordering            = ['niveau', 'nom']

    def __str__(self):
        return f'{self.nom} – {self.niveau}'
