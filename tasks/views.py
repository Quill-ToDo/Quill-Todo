
from django.http import response
from django.shortcuts import render
from .models import Task
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

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
    # TODO: Add post
    if request.method == 'GET':
        data = Task.objects.all()
        serializer = TaskSerializer(data, context={'request': request}, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def tasks_by_status(request):
    if request.method == 'GET':
        now = timezone.now()
        data = {
            'overdue': TaskSerializer(check_not_empty(overdue_tasks(now)), many=True).data,
            'today_due': TaskSerializer(check_not_empty(today_due_tasks(now)), many=True).data,
            'today_work': TaskSerializer(check_not_empty(today_work_tasks(now)), many=True).data,
            'upcoming': TaskSerializer(check_not_empty(upcoming_tasks(now)), many=True).data
        }
        return Response(data)

@api_view(['GET'])
def task_details(request, pk):
    # TODO Add put and delete
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TaskSerializer(task, context={"request": request})
        return Response(serializer.data)

def overdue_tasks(now=timezone.now()):
    return Task.objects.filter(due__lt=now)

def today_due_tasks(now=timezone.now()): 
    return Task.objects.filter(due__range=(now.replace(hour=0, minute=0, second=0), now)),

def today_work_tasks(now=timezone.now()):
    return Task.objects.filter(start__isnull=False, start__lte=now, due__gte=now)

def upcoming_tasks(now=timezone.now()):
    return Task.objects.filter(Q(start__isnull=False) | Q(start__gt=now), due__gte=now)

def check_not_empty(query_result):
    if isinstance(query_result, tuple):
        return None
    else:
        return query_result