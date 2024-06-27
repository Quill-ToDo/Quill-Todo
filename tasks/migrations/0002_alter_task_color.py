# Generated by Django 5.0.3 on 2024-06-27 05:34

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='color',
            field=models.CharField(default='#ffffff', max_length=7, null=True, validators=[django.core.validators.RegexValidator(message='Enter a valid hex code', regex='^#(?:[0-9a-fA-F]{3}){1,2}$')]),
        ),
    ]
