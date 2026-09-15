from django.urls import path

from .views import MockZarinpalGatewayView, StartPaymentView, ZarinpalCallbackView

urlpatterns = [
    path("orders/<uuid:number>/start/", StartPaymentView.as_view()),
    path("zarinpal/callback/", ZarinpalCallbackView.as_view()),
    path("zarinpal/mock/<str:authority>/", MockZarinpalGatewayView.as_view()),
]
