from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Customer identity, extensible without replacing Django's user model later."""

    email = models.EmailField("email address", unique=True)

    def save(self, *args, **kwargs):
        self.email = self.__class__.objects.normalize_email(self.email).lower()
        return super().save(*args, **kwargs)
