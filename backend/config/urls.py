from django.contrib import admin
from django.urls import include, path

from core.views import health, readiness

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/health/", health, name="health"),
    path("api/v1/ready/", readiness, name="readiness"),
]
