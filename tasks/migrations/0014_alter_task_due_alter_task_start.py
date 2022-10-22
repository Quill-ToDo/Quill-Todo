# Generated by Django 4.0.6 on 2022-10-22 01:54

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0013_alter_task_due_alter_task_start'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='due',
            field=models.DateTimeField(default=datetime.datetime(2022, 10, 22, 23, 59, 59, 999999, tzinfo=utc), help_text='Enter the date the task is due'),
        ),
        migrations.AlterField(
            model_name='task',
            name='start',
            field=models.DateTimeField(default=datetime.datetime(2022, 10, 22, 0, 0, tzinfo=utc), help_text='Enter the date to start working on the task'),
        ),
    ]
