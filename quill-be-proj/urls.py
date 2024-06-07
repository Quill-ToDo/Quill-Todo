"""quill-be-proj URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from tasks import views as task_views
from django.views.generic import RedirectView

urlpatterns = [
    path('', task_views.serve_front_end, name='home'),
    path('admin/', admin.site.urls, name='admin'),
    path(r'api/tasks/', include('tasks.urls')),
    # path('tasks/', RedirectView.as_view(url='/', permanent=True)),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
