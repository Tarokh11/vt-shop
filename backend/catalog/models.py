from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "name")
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    categories = models.ManyToManyField(Category, related_name="products", blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def clean(self):
        if self.is_published and (
            not self.pk or not self.variants.filter(is_active=True, is_default=True).exists()
        ):
            raise ValidationError(
                {"is_published": "A published product requires an active default variant."}
            )

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    sku = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=140, blank=True)
    options = models.JSONField(default=dict, blank=True)
    price_irr = models.PositiveBigIntegerField()
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("product_id", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("product",),
                condition=Q(is_default=True),
                name="catalog_one_default_variant_per_product",
            ),
            models.CheckConstraint(
                condition=Q(is_default=False) | Q(is_active=True),
                name="catalog_default_variant_must_be_active",
            ),
        ]

    def clean(self):
        if not isinstance(self.options, dict):
            raise ValidationError({"options": "Options must be a JSON object."})
        if self.is_default and not self.is_active:
            raise ValidationError({"is_default": "The default variant must be active."})

    @property
    def is_available(self):
        return self.is_active and self.product.is_published and self.stock_quantity > 0

    def __str__(self):
        return f"{self.product} / {self.name or self.sku}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="catalog/%Y/%m/")
    alt_text = models.CharField(max_length=180, blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return self.alt_text or self.image.name


class InventoryAdjustment(models.Model):
    variant = models.ForeignKey(
        ProductVariant, related_name="inventory_adjustments", on_delete=models.PROTECT
    )
    quantity_delta = models.IntegerField()
    resulting_quantity = models.PositiveIntegerField(editable=False)
    reason = models.CharField(max_length=240)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="inventory_adjustments",
        on_delete=models.PROTECT,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=~Q(quantity_delta=0), name="catalog_inventory_delta_nonzero"
            )
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError("Inventory adjustments are immutable.")
        if not self.quantity_delta:
            raise ValidationError({"quantity_delta": "Adjustment cannot be zero."})
        with transaction.atomic():
            variant = ProductVariant.objects.select_for_update().get(pk=self.variant_id)
            new_quantity = variant.stock_quantity + self.quantity_delta
            if new_quantity < 0:
                raise ValidationError({"quantity_delta": "Adjustment would make stock negative."})
            variant.stock_quantity = new_quantity
            variant.save(update_fields=("stock_quantity", "updated_at"))
            self.resulting_quantity = new_quantity
            return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("Inventory adjustments are immutable.")

    def __str__(self):
        return f"{self.variant.sku}: {self.quantity_delta:+d}"
