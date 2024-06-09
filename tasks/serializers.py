from rest_framework import serializers
from .models import Task
from uuid import UUID

class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task 
        fields = ('id', 'title', 'complete', 'completed_at', 'start', 'due', 'description', 'created_at', 'updated_at', 'color')