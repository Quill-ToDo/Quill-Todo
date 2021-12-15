from django.shortcuts import render
from .models import Task
from datetime import datetime
from django.db.models import Q

# Create your views here.
def index(request):

    now = datetime.now()
    context = {
        'overdue': Task.objects.filter(due__lt=now),
        'today_due': Task.objects.filter(due__range=(now.replace(hour=0, minute=0, second=0), now)),
        'today_work': Task.objects.filter(start__isnull=False, start__lte=now, due__gte=now),
        'upcoming': Task.objects.filter(Q(start__isnull=False) | Q(start__gt=now), due__gte=now)
    }

    # 'today_due': Task.objects.filter(due__range=(datetime.today().replace(hour=0, minute=0, second=0), datetime.today().replace(hour=23, minute=59, second=59)), complete=False),
    return render(request, 'application.html', context=context)
