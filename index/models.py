from typing import Deque
from django.db import models
from datetime import date

# Create your models here.

class Task(models.Model):
    # Fields
    created_at = models.DateTimeField(editable=False, auto_now_add=True)
    updated_at = models.DateTimeField(editable=False, auto_now=True)
    title = models.CharField(max_length=100, help_text="Enter task title")
    description = models.TextField(blank=True, null=True, help_text="Enter task description", max_length=1000)
    start = models.DateTimeField(blank=True, null=True, help_text="Enter the date to start working on the task")
    due = models.DateTimeField(default=date.today(), help_text="Enter the date the task is due")
    complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(editable=False, blank=True, null=True)
    # TODO null should not be true
    # user =  models.ForeignKey('User', null=True)

    # Metadata
    class Meta:
        ordering = ['due', 'complete']

    # Methods
    def __str__(self):
        """String for representing the MyModelName object (in Admin site etc.)."""
        return f'{self.id}: {self.title}'
    #   validates :title, presence: true, length: { maximum: 100 }
    #   validates :description, length: { maximum: 1000 }
    #   validates :due, presence: true
    #   validate :start_not_after_due?

    def get_absolute_url(self):
        """Returns the url to access a particular instance of the model."""
        return reverse('task-detail', args=[str(self.id)])

# class User(models.Model):
#     pass


