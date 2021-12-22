from django.shortcuts import render
from .models import Task
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

# Create your views here.
def tasks(request):

    now = timezone.now()
    context = {
        'overdue': overdue_tasks(now),
        'today_due': today_due_tasks(now),
        'today_work': today_work_tasks(now),
        'upcoming': upcoming_tasks(now)
    }

    # 'today_due': Task.objects.filter(due__range=(datetime.today().replace(hour=0, minute=0, second=0), datetime.today().replace(hour=23, minute=59, second=59)), complete=False),
    return render(request, 'application.html', context=context)

def task_details(request, id):
    task = get_object_or_404(Task, id=id)
    return render(request, 'catalog/book_detail.html', context={'task': task})

def overdue_tasks(now=timezone.now()):
    return Task.objects.filter(due__lt=now)

def today_due_tasks(now=timezone.now()): 
    return Task.objects.filter(due__range=(now.replace(hour=0, minute=0, second=0), now)),

def today_work_tasks(now=timezone.now()):
    return Task.objects.filter(start__isnull=False, start__lte=now, due__gte=now)

def upcoming_tasks(now=timezone.now()):
    return Task.objects.filter(Q(start__isnull=False) | Q(start__gt=now), due__gte=now)
