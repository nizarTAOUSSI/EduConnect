from django.db import models
from accounts.models import Utilisateur

class Reclamation(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente'
        TRAITEE    = 'traitee',    'Traitée'
        REJETEE    = 'rejetee',    'Rejetée'

    expediteur    = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='reclamations_envoyees',
        verbose_name='Expéditeur',
    )
    destinataire  = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reclamations_recues',
        verbose_name='Destinataire',
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
    reponse       = models.TextField(
        null=True,
        blank=True,
        verbose_name='Réponse',
    )

    class Meta:
        verbose_name        = 'Réclamation'
        verbose_name_plural = 'Réclamations'
        ordering            = ['-date_creation']

    def __str__(self):
        return f'Réclamation #{self.pk} – {self.expediteur} [{self.get_statut_display()}]'

    def is_pending(self):

        return self.statut == self.Statut.EN_ATTENTE

    def mark_as_treated(self, reponse: str):

        self.reponse = reponse
        self.statut  = self.Statut.TRAITEE
        self.save()

class Notification(models.Model):

    destinataire = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire',
    )
    from_user    = models.ForeignKey(
        Utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_envoyees',
        verbose_name='Expéditeur',
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

    def mark_as_read(self):

        self.est_lu = True
        self.save()

    def is_unread(self):

        return not self.est_lu