from django.urls import path
from . import views

# Use the name param to reference this url
urlpatterns = [
    path('', views.tasks, name='tasks'),
]
