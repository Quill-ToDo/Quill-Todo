
from django.shortcuts import render
from .models import Task
from django.utils import timezone
from django.db.models import Q
from django.views.generic import View
from django.http import HttpResponse
from django.conf import settings
import os
import logging

from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import TaskSerializer

# Create your views here.
def serve_front_end(request):
    """
    Serves the compiled frontend entry point (only works if you have run `npm
    run build`).
    """
    try:
        with open(os.path.join(settings.REACT_APP_DIR, 'build', 'index.html')) as f:
            return HttpResponse(f.read())
    except FileNotFoundError:
        logging.exception('Production build of app not found')
        return HttpResponse(
            """
            This URL is only used when you have built the production
            version of the app. Visit http://localhost:3000/ instead, or
            run `npm run build` to test the production version.
            """,
            status=501,
        )


@api_view(['GET', 'POST'])
def tasks(request):
    if request.method == 'GET':
        data = Task.objects.all()
        serializer = TaskSerializer(data, context={'request': request}, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        print(request.data)
        serializer = TaskSerializer( 
            data=request.data, 
            partial=True)

        if serializer.is_valid():
            print(serializer.data)
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={
                "errors": serializer.errors,
                "submittedData": serializer})

@api_view(['GET', 'DELETE', 'PATCH'])
def task_details(request, pk):
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
    elif request.method == 'PATCH':
        # Update fields
        t_data = request.data.copy()
        t_data["updated_at"] = timezone.now()
        serializer = TaskSerializer(
            task, 
            data=t_data, 
            partial=True)


        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR, data={
                "errors": serializer.errors,
                "submittedData": serializer})

@api_view(['PATCH'])
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