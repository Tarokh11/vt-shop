from django.urls import path

from .views import CheckoutView, OrderListView

urlpatterns = [path("", OrderListView.as_view()), path("checkout/", CheckoutView.as_view())]
