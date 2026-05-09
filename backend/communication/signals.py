from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import Reclamation, Notification
from academics.models import Absence
from grades.models import Note, Evaluation

@receiver(post_save, sender=Reclamation)
def notify_teacher_on_reclamation(sender, instance, created, **kwargs):
    """Notify teacher when a student submits a reclamation."""
    if created and instance.destinataire:
        Notification.objects.create(
            destinataire=instance.destinataire,
            from_user=instance.expediteur,
            type=Notification.TypeNotification.RECLAMATION,
            content_object=instance,
            title="Nouvelle réclamation",
            message=f"Nouvelle réclamation de {instance.expediteur.get_full_name()}: {instance.message[:50]}...",
        )

@receiver(post_save, sender=Reclamation)
def notify_student_on_reclamation_response(sender, instance, created, **kwargs):
    """Notify student when teacher responds to reclamation."""
    if not created and instance.reponse and instance.expediteur:
        Notification.objects.create(
            destinataire=instance.expediteur,
            from_user=instance.destinataire,
            type=Notification.TypeNotification.RECLAMATION,
            content_object=instance,
            title="Réponse à votre réclamation",
            message=f"Réponse à votre réclamation: {instance.reponse[:50]}...",
        )

@receiver(post_save, sender=Absence)
def notify_on_absence(sender, instance, created, **kwargs):
    """Notify student and parents when absence is recorded."""
    if created:
        student_user = instance.etudiant.utilisateur
        # Notify student
        Notification.objects.create(
            destinataire=student_user,
            type=Notification.TypeNotification.ABSENCE,
            content_object=instance,
            title="Nouvelle absence",
            message=f"Nouvelle absence enregistrée pour {instance.enseignant_matiere.matiere.nom} le {instance.date}",
        )

        # Notify parents
        try:
            parents = instance.etudiant.parents.all()
            for parent in parents:
                Notification.objects.create(
                    destinataire=parent.utilisateur,
                    type=Notification.TypeNotification.ABSENCE,
                    content_object=instance,
                    title="Absence de votre enfant",
                    message=f"Absence de {student_user.get_full_name()} pour {instance.enseignant_matiere.matiere.nom} le {instance.date}",
                )
        except Exception as e:
            print(f"Error notifying parents: {e}")

@receiver(post_save, sender=Note)
def notify_on_note(sender, instance, created, **kwargs):
    """Notify student and parents when grade is added."""
    if created:
        student_user = instance.etudiant.utilisateur
        grade_text = f"Note: {instance.valeur_note}/20" if instance.valeur_note else "Absent"
        # Notify student
        Notification.objects.create(
            destinataire=student_user,
            type=Notification.TypeNotification.NOTE,
            content_object=instance,
            title="Nouvelle note disponible",
            message=f"Nouvelle note pour {instance.evaluation.matiere.nom}: {grade_text}",
        )

        # Notify parents
        try:
            parents = instance.etudiant.parents.all()
            for parent in parents:
                Notification.objects.create(
                    destinataire=parent.utilisateur,
                    type=Notification.TypeNotification.NOTE,
                    content_object=instance,
                    title="Nouvelle note de votre enfant",
                    message=f"Note de {student_user.get_full_name()} pour {instance.evaluation.matiere.nom}: {grade_text}",
                )
        except Exception as e:
            print(f"Error notifying parents: {e}")

@receiver(post_delete, sender=Note)
@receiver(post_delete, sender=Reclamation)
@receiver(post_delete, sender=Absence)
@receiver(post_delete, sender=Evaluation)
def delete_related_notifications(sender, instance, **kwargs):
    """Delete notifications when the related object is deleted."""
    content_type = ContentType.objects.get_for_model(instance)
    Notification.objects.filter(content_type=content_type, object_id=instance.id).delete()
    
    # If an evaluation is deleted, notes are deleted via CASCADE, 
    # and the signal for Note will handle those notifications.
    # We added @receiver(post_delete, sender=Evaluation) just in case 
    # some notifications were directly linked to it in the future.