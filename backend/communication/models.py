from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
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
    note = models.ForeignKey(
        'grades.Note',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='reclamations',
        verbose_name='Note concernée',
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
        return f'Réclamation 
    def is_pending(self):
        return self.statut == self.Statut.EN_ATTENTE
    def mark_as_treated(self, reponse: str):
        self.reponse = reponse
        self.statut  = self.Statut.TRAITEE
        self.save()
class Notification(models.Model):
    class TypeNotification(models.TextChoices):
        ABSENCE    = 'absence', 'Absence'
        NOTE       = 'note', 'Note'
        RECLAMATION = 'reclamation', 'Réclamation'
        SYSTEM     = 'system', 'Système'
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
    type = models.CharField(
        max_length=20,
        choices=TypeNotification.choices,
        default=TypeNotification.SYSTEM,
        verbose_name='Type de notification'
    )
    title = models.CharField(max_length=255, verbose_name='Titre', default='')
    message    = models.TextField(verbose_name='Message')
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'envoi',
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name='Lu',
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    class Meta:
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering            = ['-created_at']
    def __str__(self):
        lu = '✓' if self.is_read else '✗'
        return f'Notification [{lu}] → {self.destinataire} ({self.created_at:%Y-%m-%d})'
    def mark_as_read(self):
        self.is_read = True
        self.save()
    def is_unread(self):
        return not self.is_read
