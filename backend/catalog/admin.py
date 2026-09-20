from django.contrib import admin

from .models import (
    AttributeDefinition,
    AttributeValue,
    Brand,
    Category,
    CategoryAttributeDefinition,
    Collection,
    CollectionProduct,
    InventoryAdjustment,
    Product,
    ProductAttributeValue,
    ProductImage,
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    readonly_fields = ("stock_quantity",)
    fields = ("sku", "name", "options", "price_irr", "stock_quantity", "is_active", "is_default")


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 0
    autocomplete_fields = ("value",)


class ProductOptionDefinitionInline(admin.TabularInline):
    model = ProductOptionDefinition
    extra = 0
    autocomplete_fields = ("definition",)


class VariantOptionValueInline(admin.TabularInline):
    model = VariantOptionValue
    extra = 0
    autocomplete_fields = ("option", "value")


class AttributeValueInline(admin.TabularInline):
    model = AttributeValue
    extra = 0
    prepopulated_fields = {"slug": ("label",)}


class CategoryAttributeDefinitionInline(admin.TabularInline):
    model = CategoryAttributeDefinition
    extra = 0
    autocomplete_fields = ("definition",)


class CollectionProductInline(admin.TabularInline):
    model = CollectionProduct
    extra = 0
    autocomplete_fields = ("product",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "slug", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    autocomplete_fields = ("parent",)
    inlines = (CategoryAttributeDefinitionInline,)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(AttributeDefinition)
class AttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "is_visible", "is_filterable", "is_searchable", "position")
    list_editable = ("is_visible", "is_filterable", "is_searchable", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    inlines = (AttributeValueInline,)


@admin.register(AttributeValue)
class AttributeValueAdmin(admin.ModelAdmin):
    list_display = ("label", "definition", "slug", "is_active", "position")
    list_filter = ("definition", "is_active")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("label",)}
    search_fields = ("label", "definition__name")


@admin.register(CategoryAttributeDefinition)
class CategoryAttributeDefinitionAdmin(admin.ModelAdmin):
    list_display = ("category", "definition", "is_required", "position")
    list_filter = ("category", "definition")
    list_editable = ("is_required", "position")
    autocomplete_fields = ("category", "definition")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "is_published", "updated_at")
    list_filter = ("is_published", "brand", "categories")
    filter_horizontal = ("categories",)
    autocomplete_fields = ("brand",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "variants__sku")
    inlines = (
        ProductVariantInline,
        ProductImageInline,
        ProductAttributeValueInline,
        ProductOptionDefinitionInline,
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("sku", "product", "name", "price_irr", "stock_quantity", "is_active")
    list_filter = ("is_active", "is_default")
    search_fields = ("sku", "product__name", "name")
    readonly_fields = ("stock_quantity",)
    inlines = (VariantOptionValueInline,)


@admin.register(ProductAttributeValue)
class ProductAttributeValueAdmin(admin.ModelAdmin):
    list_display = ("product", "value")
    list_filter = ("value__definition",)
    autocomplete_fields = ("product", "value")


@admin.register(ProductOptionDefinition)
class ProductOptionDefinitionAdmin(admin.ModelAdmin):
    list_display = ("product", "definition", "position")
    list_filter = ("definition",)
    list_editable = ("position",)
    autocomplete_fields = ("product", "definition")
    search_fields = ("product__name", "definition__name")


@admin.register(VariantOptionValue)
class VariantOptionValueAdmin(admin.ModelAdmin):
    list_display = ("variant", "option", "value")
    list_filter = ("option__definition",)
    autocomplete_fields = ("variant", "option", "value")


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    inlines = (CollectionProductInline,)


@admin.register(CollectionProduct)
class CollectionProductAdmin(admin.ModelAdmin):
    list_display = ("collection", "product", "position")
    list_filter = ("collection",)
    list_editable = ("position",)
    autocomplete_fields = ("collection", "product")


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
