from django.contrib.auth.models import AbstractUser
from django.db import models

class Utilisateur(AbstractUser):

    class Role(models.TextChoices):
        ADMIN      = 'admin',      'Administrateur'
        ENSEIGNANT = 'enseignant', 'Enseignant'
        ETUDIANT   = 'etudiant',   'Étudiant'
        PARENT     = 'parent',     'Parent'

    email = models.EmailField(unique=True, verbose_name='Adresse e-mail')
    role  = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ETUDIANT,
        verbose_name='Rôle',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name        = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f'{self.get_full_name() or self.email} ({self.get_role_display()})'

    def get_full_name_display(self):

        return self.get_full_name() or self.email

    def is_admin(self):
        return self.role == self.Role.ADMIN

    def is_enseignant(self):
        return self.role == self.Role.ENSEIGNANT

    def is_etudiant(self):
        return self.role == self.Role.ETUDIANT

    def is_parent(self):
        return self.role == self.Role.PARENT

class Enseignant(models.Model):
    utilisateur = models.OneToOneField(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name='profil_enseignant',
        limit_choices_to={'role': Utilisateur.Role.ENSEIGNANT},
    )
    specialite = models.CharField(max_length=150, blank=True, verbose_name='Spécialité')

    class Meta:
        verbose_name        = 'Enseignant'
        verbose_name_plural = 'Enseignants'

    def __str__(self):
        return f'Enseignant : {self.utilisateur}'

    def get_classes(self):

        from academics.models import Classe
        return Classe.objects.filter(
            enseignant_matieres__enseignant=self
        ).distinct()

    def get_matieres(self):

        from academics.models import Matiere
        return Matiere.objects.filter(
            enseignant_matieres__enseignant=self
        ).distinct()

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
        blank=True,
        verbose_name='Code Apogée',
    )
    classe = models.ForeignKey(
        'academics.Classe',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='etudiants',
        verbose_name='Classe',
    )

    class Meta:
        verbose_name        = 'Étudiant'
        verbose_name_plural = 'Étudiants'

    def __str__(self):
        return f'Étudiant : {self.utilisateur} | {self.code_apogee}'

    def get_notes(self):

        return self.notes.all()

    def get_absences(self):

        return self.absences.all()

    def get_bulletins(self):

        return self.bulletins.all()

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

    def get_enfants(self):

        return self.enfants.all()