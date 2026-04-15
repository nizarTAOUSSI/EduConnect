from django.contrib.auth.models import AbstractUser
from django.db import models


class Utilisateur(AbstractUser):
    """
    Modèle utilisateur personnalisé.
    L'authentification se fait par email au lieu du username.
    """
    class Role(models.TextChoices):
        ADMIN      = 'admin',      'Administrateur'
        ENSEIGNANT = 'enseignant', 'Enseignant'
        ETUDIANT   = 'etudiant',   'Étudiant'
        PARENT     = 'parent',     'Parent'

    # On remplace username par email comme identifiant principal
    email = models.EmailField(unique=True, verbose_name='Adresse e-mail')
    role  = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ETUDIANT,
        verbose_name='Rôle',
    )

    USERNAME_FIELD  = 'email'
    # username n'est plus requis, mais on le garde pour la compatibilité admin
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name        = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f'{self.get_full_name() or self.email} ({self.get_role_display()})'


# ---------------------------------------------------------------------------
# Profils étendus
# ---------------------------------------------------------------------------

class Enseignant(models.Model):
    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_enseignant',
        limit_choices_to={'role': Utilisateur.Role.ENSEIGNANT},
    )
    specialite = models.CharField(max_length=150, verbose_name='Spécialité')

    class Meta:
        verbose_name        = 'Enseignant'
        verbose_name_plural = 'Enseignants'

    def __str__(self):
        return f'Enseignant : {self.utilisateur}'


class Etudiant(models.Model):
    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_etudiant',
        limit_choices_to={'role': Utilisateur.Role.ETUDIANT},
    )
    code_apogee = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Code Apogée',
    )

    class Meta:
        verbose_name        = 'Étudiant'
        verbose_name_plural = 'Étudiants'

    def __str__(self):
        return f'Étudiant : {self.utilisateur} | {self.code_apogee}'


class Parent(models.Model):
    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_parent',
        limit_choices_to={'role': Utilisateur.Role.PARENT},
    )
    enfants = models.ManyToManyField(
        Etudiant,
        related_name='parents',
        blank=True,
        verbose_name='Enfants',
    )

    class Meta:
        verbose_name        = 'Parent'
        verbose_name_plural = 'Parents'

    def __str__(self):
        return f'Parent : {self.utilisateur}'
