from django.contrib import admin
from .models import Task

# Register your models here.

# Register the Admin classes for Task using the decorator
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('complete', 'title', 'start', 'due')