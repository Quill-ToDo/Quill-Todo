from django.db import models
import pytz
from django.utils import timezone

# Create your models here.

class Task(models.Model):
    # Fields
    created_at = models.DateTimeField(editable=False, auto_now_add=True)
    updated_at = models.DateTimeField(editable=False, auto_now=True)
    title = models.CharField(max_length=100, help_text="Enter task title")
    description = models.TextField(blank=True, null=True, help_text="Enter task description", max_length=1000)
    start = models.DateTimeField(blank=True, null=True, help_text="Enter the date to start working on the task")
    # Default due time is today at 11:59 pm
    due = models.DateTimeField(default=timezone.now().replace(hour=23, minute=59), help_text="Enter the date the task is due")
    complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(editable=True, blank=True, null=True)

    # TODO null for user should not be true
    # user =  models.ForeignKey('User', null=True)
    # TODO From rails, validations that will need to be made
    #   validates :title, presence: true, length: { maximum: 100 }
    #   validates :description, length: { maximum: 1000 }
    #   validates :due, presence: true
    #   validate :start_not_after_due?

    # Metadata
    class Meta:
        ordering = ['due', 'complete']


    # Methods
    def __str__(self):
        """String for representing the MyModelName object (in Admin site etc.)."""
        return f'{self.pk}: {self.title}'


    # def get_absolute_url(self):
    #     """Returns the url to access a particular instance of the model."""
    #     return reverse('task-detail', args=[str(self.id)])

# class User(models.Model):
#     pass


