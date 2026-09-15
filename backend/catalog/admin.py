from django.contrib import admin

from .models import Category, InventoryAdjustment, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    readonly_fields = ("stock_quantity",)
    fields = ("sku", "name", "options", "price_irr", "stock_quantity", "is_active", "is_default")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "is_published", "updated_at")
    list_filter = ("is_published", "categories")
    filter_horizontal = ("categories",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "variants__sku")
    inlines = (ProductVariantInline, ProductImageInline)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "name", "price_irr", "stock_quantity", "is_active")
    list_filter = ("is_active", "is_default")
    search_fields = ("sku", "product__name", "name")
    readonly_fields = ("stock_quantity",)


@admin.register(InventoryAdjustment)
class InventoryAdjustmentAdmin(admin.ModelAdmin):
    list_display = (
        "variant", "quantity_delta", "resulting_quantity", "reason", "created_by", "created_at"
    )
    list_filter = ("created_at",)
    search_fields = ("variant__sku", "reason")
    readonly_fields = ("resulting_quantity", "created_by", "created_at")

    def has_change_permission(self, request, obj=None):
        return obj is None

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.created_by = request.user
        obj.save()
