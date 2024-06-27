from django.db import models
import uuid
from django.utils import timezone
from django.core.validators import RegexValidator


class Task(models.Model):
    # Fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4,serialize=False)
    created_at = models.DateTimeField(editable=False, auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(null=True, blank=True, max_length=1000)
    start = models.DateTimeField(blank=True, null=True)
    due = models.DateTimeField(blank=True, null=True)
    complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(editable=False, null=True)
    color = models.CharField(
        max_length=7, 
        editable=True, 
        null=True, 
        default="#ffffff", 
        validators=[RegexValidator(
            regex=r'^#(?:[0-9a-fA-F]{3}){1,2}$',
            message='Enter a valid hex code',
        )]
    )

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
        return f'{self.id}: {self.title}'

    # def get_absolute_url(self):
    #     """Returns the url to access a particular instance of the model."""
    #     return reverse('task-detail', args=[str(self.id)])

# class User(models.Model):
#     pass


