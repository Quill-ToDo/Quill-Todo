
from django.shortcuts import render
from .models import Task
from django.utils import timezone
from django.db.models import Q

from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import TaskSerializer
from tasks import serializers

# Create your views here.

def home(request):
    return render(request, 'application.html')

@api_view(['GET'])
def tasks(request):
    # TODO: Add post handler
    if request.method == 'GET':
        data = Task.objects.all()
        serializer = TaskSerializer(data, context={'request': request}, many=True)
        return Response(serializer.data)

@api_view(['GET', 'DELETE'])
def task_details(request, pk):
    # TODO Add put and delete
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TaskSerializer(task, context={"request": request})
        return Response(serializer.data)
    elif request.method == 'DELETE':
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['PUT'])
def toggle_complete(request, pk):
    '''
    Toggle task complete status
    '''
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.method == 'PUT':
        if not task.complete:
            now = timezone.now()
        else:
            now = None

        serializer = TaskSerializer(task, 
                context={"request": request}, 
                data={'complete': not task.complete, 'completed_at': now}, 
                partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data={
                "errors": serializer.errors,
                "submittedData": serializer})