from django.contrib import admin

from .models import Order, OrderLine, Shipment, ShippingRate, StockReservation


class OrderLineInline(admin.TabularInline):
    model = OrderLine
    extra = 0
    can_delete = False
    readonly_fields = (
        "sku", "product_name", "variant_name", "unit_price_irr", "quantity", "line_total_irr"
    )

    def has_add_permission(self, request, obj=None):
        return False


class StockReservationInline(admin.TabularInline):
    model = StockReservation
    extra = 0
    can_delete = False
    readonly_fields = ("variant", "quantity", "expires_at", "status")

    def has_add_permission(self, request, obj=None):
        return False


class ShipmentInline(admin.StackedInline):
    model = Shipment
    extra = 0
    max_num = 1
    fields = ("status", "tracking_code", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(ShippingRate)
class ShippingRateAdmin(admin.ModelAdmin):
    list_display = ("region", "amount_irr", "is_active")
    list_editable = ("amount_irr", "is_active")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "short_number",
        "customer",
        "status",
        "total_irr",
        "shipping_region",
        "created_at",
    )
    list_filter = ("status", "shipping_region", "created_at")
    search_fields = ("number", "customer__email", "recipient_name", "recipient_phone")
    readonly_fields = (
        "number",
        "customer",
        "status",
        "shipping_region",
        "shipping_amount_irr",
        "subtotal_irr",
        "total_irr",
        "recipient_name",
        "recipient_phone",
        "address",
        "created_at",
    )
    date_hierarchy = "created_at"
    list_select_related = ("customer",)
    list_per_page = 40
    inlines = (ShipmentInline, OrderLineInline, StockReservationInline)

    @admin.display(description="شماره سفارش", ordering="number")
    def short_number(self, obj):
        return str(obj.number)[:8]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(OrderLine)
class OrderLineAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "sku", "quantity", "line_total_irr")
    search_fields = ("order__number", "product_name", "sku")
    readonly_fields = [field.name for field in OrderLine._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = ("order", "variant", "quantity", "status", "expires_at")
    list_filter = ("status", "expires_at")
    search_fields = ("order__number", "variant__sku")
    readonly_fields = [field.name for field in StockReservation._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "tracking_code", "updated_at")
    list_filter = ("status",)
    search_fields = ("order__number", "tracking_code")
    autocomplete_fields = ("order",)
    readonly_fields = ("created_at", "updated_at")
