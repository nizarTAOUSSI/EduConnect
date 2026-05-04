from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Utilisateur, Enseignant, Etudiant, Parent

@receiver(pre_save, sender=Utilisateur)
def track_role_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Utilisateur.objects.get(pk=instance.pk)
            instance._original_role = old_instance.role
        except Utilisateur.DoesNotExist:
            pass

@receiver(post_save, sender=Utilisateur)
def create_user_profile(sender, instance, created, **kwargs):

    if created:

        if instance.role == Utilisateur.Role.ENSEIGNANT:
            Enseignant.objects.get_or_create(utilisateur=instance, defaults={'specialite': ''})
        elif instance.role == Utilisateur.Role.ETUDIANT:
            Etudiant.objects.get_or_create(utilisateur=instance, defaults={'code_apogee': f'temp_{instance.id}', 'classe': None})
        elif instance.role == Utilisateur.Role.PARENT:
            Parent.objects.get_or_create(utilisateur=instance)
    else:

        old_role = getattr(instance, '_original_role', instance.role)
        if old_role != instance.role:

            if old_role == Utilisateur.Role.ENSEIGNANT and hasattr(instance, 'profil_enseignant'):
                instance.profil_enseignant.delete()
            elif old_role == Utilisateur.Role.ETUDIANT and hasattr(instance, 'profil_etudiant'):
                instance.profil_etudiant.delete()
            elif old_role == Utilisateur.Role.PARENT and hasattr(instance, 'profil_parent'):
                instance.profil_parent.delete()

            if instance.role == Utilisateur.Role.ENSEIGNANT:
                Enseignant.objects.get_or_create(utilisateur=instance, defaults={'specialite': ''})
            elif instance.role == Utilisateur.Role.ETUDIANT:
                Etudiant.objects.get_or_create(utilisateur=instance, defaults={'code_apogee': f'temp_{instance.id}', 'classe': None})
            elif instance.role == Utilisateur.Role.PARENT:
                Parent.objects.get_or_create(utilisateur=instance)