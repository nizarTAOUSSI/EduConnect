

from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Classe',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100, verbose_name='Nom')),
                ('niveau', models.CharField(max_length=100, verbose_name='Niveau')),
            ],
            options={
                'verbose_name': 'Classe',
                'verbose_name_plural': 'Classes',
                'ordering': ['niveau', 'nom'],
            },
        ),
        migrations.CreateModel(
            name='Matiere',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=150, verbose_name='Nom de la matière')),
                ('coefficient', models.PositiveSmallIntegerField(default=1, verbose_name='Coefficient')),
            ],
            options={
                'verbose_name': 'Matière',
                'verbose_name_plural': 'Matières',
                'ordering': ['nom'],
            },
        ),
        migrations.CreateModel(
            name='Periode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nom', models.CharField(max_length=100, verbose_name='Nom')),
                ('date_debut', models.DateField(verbose_name='Date de début')),
                ('date_fin', models.DateField(verbose_name='Date de fin')),
                ('est_active', models.BooleanField(default=False, verbose_name='Période active')),
            ],
            options={
                'verbose_name': 'Période',
                'verbose_name_plural': 'Périodes',
                'ordering': ['-date_debut'],
            },
        ),
    ]