from django.urls import path
from . import views

# Use the name param to reference this url
urlpatterns = [
    path('', views.tasks, name='tasks'),
    path('task/<int:id>', views.task_details, name='task-detail'),
]
