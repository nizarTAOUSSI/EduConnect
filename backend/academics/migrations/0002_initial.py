

from django.db import migrations, models

class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('academics', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='classe',
            name='enseignants',
            field=models.ManyToManyField(blank=True, related_name='classes', to='accounts.enseignant', verbose_name='Enseignants'),
        ),
        migrations.AddField(
            model_name='classe',
            name='matieres',
            field=models.ManyToManyField(blank=True, related_name='classes', to='academics.matiere', verbose_name='Matières'),
        ),
    ]