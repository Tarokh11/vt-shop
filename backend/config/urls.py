from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from core.views import health, readiness

admin.site.site_header = "مدیریت فروشگاه نورا"
admin.site.site_title = "مدیریت نورا"
admin.site.index_title = "داشبورد عملیات فروشگاه"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/catalog/", include("catalog.urls")),
    path("api/v1/cart/", include("cart.urls")),
    path("api/v1/orders/", include("orders.urls")),
    path("api/v1/payments/", include("payments.urls")),
    path("api/v1/health/", health, name="health"),
    path("api/v1/ready/", readiness, name="readiness"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
