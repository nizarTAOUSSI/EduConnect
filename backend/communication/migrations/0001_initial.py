

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(verbose_name='Message')),
                ('date_envoi', models.DateTimeField(auto_now_add=True, verbose_name="Date d'envoi")),
                ('est_lu', models.BooleanField(default=False, verbose_name='Lu')),
                ('destinataire', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL, verbose_name='Destinataire')),
            ],
            options={
                'verbose_name': 'Notification',
                'verbose_name_plural': 'Notifications',
                'ordering': ['-date_envoi'],
            },
        ),
        migrations.CreateModel(
            name='Reclamation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message', models.TextField(verbose_name='Message')),
                ('statut', models.CharField(choices=[('en_attente', 'En attente'), ('traitee', 'Traitée')], default='en_attente', max_length=20, verbose_name='Statut')),
                ('date_creation', models.DateTimeField(auto_now_add=True, verbose_name='Date de création')),
                ('expediteur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reclamations', to=settings.AUTH_USER_MODEL, verbose_name='Expéditeur')),
            ],
            options={
                'verbose_name': 'Réclamation',
                'verbose_name_plural': 'Réclamations',
                'ordering': ['-date_creation'],
            },
        ),
    ]