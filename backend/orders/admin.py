from django.contrib import admin

from .models import Order, OrderLine, ShippingRate, StockReservation

admin.site.register(ShippingRate)
admin.site.register(Order)
admin.site.register(OrderLine)
admin.site.register(StockReservation)
