from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Reclamation, Notification
from academics.models import Absence
from grades.models import Note

@receiver(post_save, sender=Reclamation)
def notify_teacher_on_reclamation(sender, instance, created, **kwargs):
    """Notify teacher when a student submits a reclamation."""
    if created and instance.destinataire:
        Notification.objects.create(
            destinataire=instance.destinataire,
            from_user=instance.expediteur,
            message=f"Nouvelle réclamation de {instance.expediteur.get_full_name()}: {instance.message[:50]}...",
        )

@receiver(post_save, sender=Reclamation)
def notify_student_on_reclamation_response(sender, instance, created, **kwargs):
    """Notify student when teacher responds to reclamation."""
    if not created and instance.reponse and instance.expediteur:
        Notification.objects.create(
            destinataire=instance.expediteur,
            from_user=instance.destinataire,
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
            message=f"Nouvelle absence enregistrée pour {instance.enseignant_matiere.matiere.nom} le {instance.date}",
        )

        # Notify parents
        try:
            parents = student_user.profil_etudiant.classe.etudiants.filter(
                utilisateur__role='parent'
            ).values_list('utilisateur', flat=True)
            for parent_id in parents:
                Notification.objects.create(
                    destinataire_id=parent_id,
                    message=f"Absence de {student_user.get_full_name()} pour {instance.enseignant_matiere.matiere.nom} le {instance.date}",
                )
        except:
            pass  # Skip if no parents found

@receiver(post_save, sender=Note)
def notify_on_note(sender, instance, created, **kwargs):
    """Notify student and parents when grade is added."""
    if created:
        student_user = instance.etudiant.utilisateur
        grade_text = f"Note: {instance.valeur_note}/20" if instance.valeur_note else "Absent"
        # Notify student
        Notification.objects.create(
            destinataire=student_user,
            message=f"Nouvelle note pour {instance.evaluation.matiere.nom}: {grade_text}",
        )

        # Notify parents
        try:
            parents = student_user.profil_etudiant.classe.etudiants.filter(
                utilisateur__role='parent'
            ).values_list('utilisateur', flat=True)
            for parent_id in parents:
                Notification.objects.create(
                    destinataire_id=parent_id,
                    message=f"Note de {student_user.get_full_name()} pour {instance.evaluation.matiere.nom}: {grade_text}",
                )
        except:
            pass  # Skip if no parents found