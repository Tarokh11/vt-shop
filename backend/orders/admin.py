from django.contrib import admin

from .models import Order, OrderLine, Shipment, ShippingRate, StockReservation

admin.site.register(ShippingRate)
admin.site.register(Order)
admin.site.register(OrderLine)
admin.site.register(StockReservation)


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "tracking_code", "updated_at")
    list_filter = ("status",)
    search_fields = ("order__number", "tracking_code")
