# Generated by Django 5.0.3 on 2024-06-09 21:16

import django.core.validators
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, editable=False,)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('title', models.CharField(blank=True, max_length=100, null=True)),
                ('description', models.TextField(blank=True, max_length=1000, null=True)),
                ('start', models.DateTimeField(blank=True, null=True)),
                ('due', models.DateTimeField(blank=True, null=True)),
                ('complete', models.BooleanField(default=False)),
                ('completed_at', models.DateTimeField(editable=False, null=True)),
                ('color', models.CharField(blank=True, default='#ffffff', max_length=7, null=True, validators=[django.core.validators.RegexValidator(message='Enter a valid hex code', regex='^#(?:[0-9a-fA-F]{3}){1,2}$')])),
            ],
            options={
                'ordering': ['due', 'complete'],
            },
        ),
    ]
