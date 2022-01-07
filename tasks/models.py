from django.db import models
import pytz
from django.utils import timezone
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin

# Create your models here.

class CustomUserManager(BaseUserManager):
    def _create_user(self, email, password, is_staff, is_superuser, **extra_fields):
        now = timezone.now()
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, is_staff=is_staff, is_active = True, is_superuser=is_superuser, date_joined=now, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        return self._create_user(email, password, False, False, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        return self._create_user(email, password, True, True,**extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    # Fields
    first_name = models.CharField(max_length=5000, help_text="Enter your first name")
    last_name = models.CharField(max_length=5000, help_text="Enter your last name")
    email = models.EmailField(max_length=5000, unique=True, help_text="Enter your email address")
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(editable=False, auto_now_add=True)
    last_login = models.DateTimeField(editable=False, null=True)

    # Authenticate with email address
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects = CustomUserManager()
    
    #Methods
    def __str__(self):
        """String for representing the MyModelName object (in Admin site etc.)."""
        return self.email

class Task(models.Model):
    # Fields
    created_at = models.DateTimeField(editable=False, auto_now_add=True)
    updated_at = models.DateTimeField(editable=False, auto_now=True)
    title = models.CharField(max_length=100, help_text="Enter task title")
    description = models.TextField(blank=True, null=True, help_text="Enter task description", max_length=1000)
    start = models.DateTimeField(blank=True, null=True, help_text="Enter the date to start working on the task")
    # Default due time is today at 11:59 pm
    due = models.DateTimeField(help_text="Enter the date the task is due")
    complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(editable=True, blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

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


