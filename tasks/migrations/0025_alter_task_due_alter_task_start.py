# Generated by Django 4.0.6 on 2024-04-02 04:32

import datetime
from django.db import migrations, models
from django.utils.timezone import utc


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0024_alter_task_due_alter_task_start'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='due',
            field=models.DateTimeField(default=datetime.datetime(2024, 4, 2, 23, 59, 59, 999999, tzinfo=utc), help_text='Enter the date the task is due'),
        ),
        migrations.AlterField(
            model_name='task',
            name='start',
            field=models.DateTimeField(default=datetime.datetime(2024, 4, 2, 0, 0, tzinfo=utc), help_text='Enter the date to start working on the task'),
        ),
    ]
