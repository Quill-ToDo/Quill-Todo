from django.urls import path
from . import views
from rest_framework import routers, serializers, viewsets

# Use the name param to reference this url
urlpatterns = [
    path('', views.tasks, name='tasks'),
    path('<int:pk>', views.task_details, name='task-detail'),
    path('<int:pk>/toggle-complete', views.toggle_complete, name='toggle-complete'),
]
