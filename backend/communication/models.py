from django.db import models
from accounts.models import Utilisateur


class Reclamation(models.Model):
    """Réclamation soumise par un utilisateur."""

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente'
        TRAITEE    = 'traitee',    'Traitée'

    expediteur    = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='reclamations',
        verbose_name='Expéditeur',
    )
    message       = models.TextField(verbose_name='Message')
    statut        = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
        verbose_name='Statut',
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création',
    )

    class Meta:
        verbose_name        = 'Réclamation'
        verbose_name_plural = 'Réclamations'
        ordering            = ['-date_creation']

    def __str__(self):
        return f'Réclamation #{self.pk} – {self.expediteur} [{self.get_statut_display()}]'


class Notification(models.Model):
    """Notification envoyée à un utilisateur."""
    destinataire = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire',
    )
    message    = models.TextField(verbose_name='Message')
    date_envoi = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'envoi',
    )
    est_lu = models.BooleanField(
        default=False,
        verbose_name='Lu',
    )

    class Meta:
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering            = ['-date_envoi']

    def __str__(self):
        lu = '✓' if self.est_lu else '✗'
        return f'Notification [{lu}] → {self.destinataire} ({self.date_envoi:%Y-%m-%d})'
