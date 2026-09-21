from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.db.models import Count, Sum
from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html

from .forms import CatalogImportForm
from .importers import CatalogImportError, build_catalog_template, import_catalog_workbook
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
    fields = ("sku", "name", "price_irr", "stock_quantity", "is_active", "is_default")
    show_change_link = True


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = ("preview", "image", "alt_text", "position")
    readonly_fields = ("preview",)

    @admin.display(description="پیش‌نمایش")
    def preview(self, obj):
        if not obj.pk or not obj.image:
            return "—"
        return format_html('<img src="{}" class="catalog-image-preview" alt="" />', obj.image.url)


class ProductAttributeValueInline(admin.TabularInline):
    model = ProductAttributeValue
    extra = 0
    autocomplete_fields = ("value",)
    verbose_name = "ویژگی ثابت محصول"
    verbose_name_plural = "ویژگی‌های ثابت محصول"


class ProductOptionDefinitionInline(admin.TabularInline):
    model = ProductOptionDefinition
    extra = 0
    autocomplete_fields = ("definition",)
    verbose_name = "گزینه تنوع"
    verbose_name_plural = "گزینه‌های تنوع مثل رنگ یا اندازه"


class VariantOptionValueInline(admin.TabularInline):
    model = VariantOptionValue
    extra = 0
    autocomplete_fields = ("option", "value")
    extra = 1


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
    list_filter = ("is_active", "parent")
    list_per_page = 30


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "position")
    list_editable = ("is_active", "position")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    list_filter = ("is_active",)


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
    change_list_template = "admin/catalog/product/change_list.html"
    list_display = (
        "name",
        "publication_status",
        "brand",
        "category_names",
        "variant_total",
        "inventory_total",
        "updated_at",
    )
    list_filter = ("is_published", "brand", "categories")
    list_select_related = ("brand",)
    list_per_page = 30
    filter_horizontal = ("categories",)
    autocomplete_fields = ("brand",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug", "variants__sku", "brand__name")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("اطلاعات اصلی", {"fields": ("name", "slug", "description", "brand")}),
        ("دسته‌بندی و انتشار", {"fields": ("categories", "is_published")}),
        ("زمان‌ها", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
    )
    actions = ("publish_selected", "unpublish_selected")
    inlines = (
        ProductVariantInline,
        ProductImageInline,
        ProductAttributeValueInline,
        ProductOptionDefinitionInline,
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .prefetch_related("categories")
            .annotate(
                admin_variant_count=Count("variants", distinct=True),
                admin_stock_total=Sum("variants__stock_quantity"),
            )
        )

    @admin.display(description="وضعیت", ordering="is_published")
    def publication_status(self, obj):
        css_class = "status-live" if obj.is_published else "status-draft"
        label = "منتشر" if obj.is_published else "پیش‌نویس"
        return format_html('<span class="admin-status {}">{}</span>', css_class, label)

    @admin.display(description="دسته‌ها")
    def category_names(self, obj):
        return "، ".join(category.name for category in obj.categories.all()) or "—"

    @admin.display(description="تنوع‌ها", ordering="admin_variant_count")
    def variant_total(self, obj):
        return obj.admin_variant_count

    @admin.display(description="موجودی کل", ordering="admin_stock_total")
    def inventory_total(self, obj):
        return obj.admin_stock_total or 0

    @admin.action(description="انتشار محصولات انتخاب‌شده")
    def publish_selected(self, request, queryset):
        published = 0
        for product in queryset:
            if product.variants.filter(is_active=True, is_default=True).exists():
                product.is_published = True
                product.save(update_fields=("is_published", "updated_at"))
                published += 1
            else:
                self.message_user(
                    request,
                    f"'{product.name}' تنوع پیش‌فرض فعال ندارد و منتشر نشد.",
                    messages.WARNING,
                )
        self.message_user(request, f"{published} محصول منتشر شد.", messages.SUCCESS)

    @admin.action(description="برداشتن محصولات انتخاب‌شده از فروشگاه")
    def unpublish_selected(self, request, queryset):
        count = queryset.update(is_published=False)
        self.message_user(request, f"{count} محصول از فروشگاه برداشته شد.", messages.SUCCESS)

    def get_urls(self):
        return [
            path(
                "import-excel/",
                self.admin_site.admin_view(self.import_excel),
                name="catalog_product_import_excel",
            ),
            path(
                "import-template/",
                self.admin_site.admin_view(self.download_template),
                name="catalog_product_import_template",
            ),
        ] + super().get_urls()

    def import_excel(self, request):
        if not self.has_add_permission(request) or not self.has_change_permission(request):
            raise PermissionDenied
        errors = []
        if request.method == "POST":
            form = CatalogImportForm(request.POST, request.FILES)
            if form.is_valid():
                try:
                    result = import_catalog_workbook(form.cleaned_data["workbook"], request.user)
                except CatalogImportError as exc:
                    errors = exc.errors
                except ValidationError as exc:
                    errors = exc.messages
                else:
                    self.message_user(
                        request,
                        "ورود انجام شد: "
                        f"{result.products_created} محصول و {result.variants_created} تنوع جدید؛ "
                        f"{result.products_updated} محصول و "
                        f"{result.variants_updated} تنوع به‌روز شد.",
                        messages.SUCCESS,
                    )
                    return redirect(reverse("admin:catalog_product_changelist"))
        else:
            form = CatalogImportForm()
        context = {
            **self.admin_site.each_context(request),
            "title": "ورود محصولات از اکسل",
            "form": form,
            "errors": errors,
            "opts": self.model._meta,
            "template_url": reverse("admin:catalog_product_import_template"),
        }
        return render(request, "admin/catalog/product/import_excel.html", context)

    def download_template(self, request):
        response = HttpResponse(
            build_catalog_template().getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="nora-catalog-template.xlsx"'
        return response


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        "sku", "product", "name", "price_irr", "stock_indicator", "is_active", "is_default"
    )
    list_filter = ("is_active", "is_default", "product__categories")
    list_editable = ("price_irr", "is_active")
    list_select_related = ("product",)
    list_per_page = 40
    search_fields = ("sku", "product__name", "name")
    readonly_fields = ("stock_quantity",)
    inlines = (VariantOptionValueInline,)

    @admin.display(description="موجودی", ordering="stock_quantity")
    def stock_indicator(self, obj):
        if obj.stock_quantity == 0:
            css_class = "stock-empty"
        elif obj.stock_quantity < 5:
            css_class = "stock-low"
        else:
            css_class = "stock-ok"
        return format_html(
            '<span class="stock-indicator {}">{}</span>', css_class, obj.stock_quantity
        )


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
    date_hierarchy = "created_at"
    list_select_related = ("variant", "created_by")
    list_per_page = 50
    search_fields = ("variant__sku", "reason")
    readonly_fields = ("resulting_quantity", "created_by", "created_at")

    def has_change_permission(self, request, obj=None):
        return obj is None

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.created_by = request.user
        obj.save()
