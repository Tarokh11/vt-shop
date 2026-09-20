from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Customer identity, extensible without replacing Django's user model later."""

    email = models.EmailField("email address", unique=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    shipping_region = models.CharField(
        max_length=20,
        blank=True,
        choices=(
            ("TEHRAN", "Tehran"),
            ("OUTSIDE_TEHRAN", "Outside Tehran"),
        ),
    )

    def save(self, *args, **kwargs):
        self.email = self.__class__.objects.normalize_email(self.email).lower()
        return super().save(*args, **kwargs)


class Favorite(models.Model):
    user = models.ForeignKey(User, related_name="favorites", on_delete=models.CASCADE)
    product = models.ForeignKey(
        "catalog.Product", related_name="favorites", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("user", "product"), name="accounts_unique_favorite")
        ]
