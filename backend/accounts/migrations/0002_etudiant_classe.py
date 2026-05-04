

from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0003_remove_classe_enseignants_remove_classe_matieres_and_more'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='etudiant',
            name='classe',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='etudiants', to='academics.classe', verbose_name='Classe'),
        ),
    ]