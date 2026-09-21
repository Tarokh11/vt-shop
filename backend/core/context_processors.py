from django.conf import settings


def storefront(request):
    return {"storefront_url": settings.FRONTEND_ORIGIN}
