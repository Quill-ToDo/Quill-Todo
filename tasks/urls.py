from django.urls import path
from . import views
from rest_framework import routers, serializers, viewsets

# Use the name param to reference this url : using the method reverse('[name]') like
# reverse('task-detail')
urlpatterns = [
    path('', views.tasks, name='tasks'),
    path('<uuid:id>', views.task_details, name='task-detail')
]
