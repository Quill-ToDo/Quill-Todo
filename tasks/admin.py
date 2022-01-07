from django.contrib import admin
from .models import Task, User

# Register your models here.

# Register the Admin classes for Task using the decorator
@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'start', 'due', 'complete')
    
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name')
    