from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Favorite, User


@admin.register(User)
class CustomerAdmin(UserAdmin):
    list_display = ("email", "full_name", "phone", "shipping_region", "is_active", "is_staff")
    list_filter = ("is_active", "is_staff", "shipping_region", "date_joined")
    search_fields = ("email", "first_name", "last_name", "phone")
    ordering = ("-date_joined",)
    list_per_page = 40
    fieldsets = UserAdmin.fieldsets + (
        ("اطلاعات مشتری و ارسال", {"fields": ("phone", "address", "shipping_region")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("اطلاعات مشتری", {"fields": ("email", "first_name", "last_name", "phone")}),
    )

    @admin.display(description="نام", ordering="first_name")
    def full_name(self, obj):
        return obj.get_full_name() or "—"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "product", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "product__name")
    autocomplete_fields = ("user", "product")
    date_hierarchy = "created_at"
