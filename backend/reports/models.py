from django.db import models
from accounts.models import Etudiant
from academics.models import Periode


class Bulletin(models.Model):
    """
    Bulletin de notes généré pour un étudiant sur une période donnée.
    La moyenne_generale et le rang sont calculés à la génération.
    """
    etudiant          = models.ForeignKey(
        Etudiant,
        on_delete=models.CASCADE,
        related_name='bulletins',
        verbose_name='Étudiant',
    )
    periode           = models.ForeignKey(
        Periode,
        on_delete=models.CASCADE,
        related_name='bulletins',
        verbose_name='Période',
    )
    moyenne_generale  = models.FloatField(verbose_name='Moyenne générale')
    rang              = models.PositiveIntegerField(verbose_name='Rang dans la classe')
    date_generation   = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de génération',
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
