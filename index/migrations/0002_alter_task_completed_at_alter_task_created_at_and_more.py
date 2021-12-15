# Generated by Django 4.0 on 2021-12-15 03:02

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('index', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='completed_at',
            field=models.DateField(blank=True, editable=False, null=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='created_at',
            field=models.DateField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='due',
            field=models.DateField(default=datetime.date(2021, 12, 14), help_text='Enter the date the task is due'),
        ),
        migrations.AlterField(
            model_name='task',
            name='start',
            field=models.DateField(blank=True, help_text='Enter the date to start working on the task', null=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='updated_at',
            field=models.DateField(auto_now=True),
        ),
    ]