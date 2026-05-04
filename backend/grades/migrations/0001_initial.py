

import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('academics', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Evaluation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('CC', 'Contrôle Continu'), ('Examen', 'Examen Final'), ('TP', 'Travaux Pratiques')], max_length=20, verbose_name="Type d'évaluation")),
                ('date', models.DateField(verbose_name="Date de l'évaluation")),
                ('note_max', models.FloatField(default=20.0, verbose_name='Note maximale')),
                ('classe', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluations', to='academics.classe', verbose_name='Classe')),
                ('matiere', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluations', to='academics.matiere', verbose_name='Matière')),
            ],
            options={
                'verbose_name': 'Évaluation',
                'verbose_name_plural': 'Évaluations',
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('valeur_note', models.FloatField(blank=True, null=True, verbose_name='Note obtenue')),
                ('commentaire', models.TextField(blank=True, default='', verbose_name='Commentaire')),
                ('est_absent', models.BooleanField(default=False, help_text='Si coché, la note ne sera pas comptabilisée dans la moyenne.', verbose_name='Absent')),
                ('etudiant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='accounts.etudiant', verbose_name='Étudiant')),
                ('evaluation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='grades.evaluation', verbose_name='Évaluation')),
            ],
            options={
                'verbose_name': 'Note',
                'verbose_name_plural': 'Notes',
                'unique_together': {('evaluation', 'etudiant')},
            },
        ),
    ]