from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task 
        fields = ('pk', 'title', 'complete', 'completed_at', 'start', 'due', 'description', 'created_at', 'updated_at')