from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.utils import timezone

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

class CustomUser(AbstractBaseUser, PermissionsMixin):
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