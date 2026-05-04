

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
            name='Bulletin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('moyenne_generale', models.FloatField(verbose_name='Moyenne générale')),
                ('rang', models.PositiveIntegerField(verbose_name='Rang dans la classe')),
                ('date_generation', models.DateTimeField(auto_now_add=True, verbose_name='Date de génération')),
                ('etudiant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bulletins', to='accounts.etudiant', verbose_name='Étudiant')),
                ('periode', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='bulletins', to='academics.periode', verbose_name='Période')),
            ],
            options={
                'verbose_name': 'Bulletin',
                'verbose_name_plural': 'Bulletins',
                'ordering': ['rang'],
                'unique_together': {('etudiant', 'periode')},
            },
        ),
    ]