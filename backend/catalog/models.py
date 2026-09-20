from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", related_name="children", on_delete=models.SET_NULL, null=True, blank=True
    )
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "name")
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def clean(self):
        if not self.parent_id:
            return
        if self.pk and self.parent_id == self.pk:
            raise ValidationError({"parent": "A category cannot be its own parent."})

        ancestor_ids = set()
        ancestor = self.parent
        while ancestor is not None:
            if ancestor.pk in ancestor_ids or (self.pk and ancestor.pk == self.pk):
                raise ValidationError({"parent": "A category cannot be a descendant of itself."})
            ancestor_ids.add(ancestor.pk)
            ancestor = ancestor.parent


class Brand(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "name")

    def __str__(self):
        return self.name


class AttributeDefinition(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    is_visible = models.BooleanField(default=True)
    is_filterable = models.BooleanField(default=False)
    is_searchable = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "name")

    def __str__(self):
        return self.name


class AttributeValue(models.Model):
    definition = models.ForeignKey(
        AttributeDefinition, related_name="values", on_delete=models.CASCADE
    )
    label = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, allow_unicode=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("definition__position", "position", "label")
        constraints = [
            models.UniqueConstraint(
                fields=("definition", "slug"), name="catalog_attribute_value_definition_slug"
            )
        ]

    def __str__(self):
        return f"{self.definition}: {self.label}"


class CategoryAttributeDefinition(models.Model):
    category = models.ForeignKey(
        Category, related_name="attribute_definitions", on_delete=models.CASCADE
    )
    definition = models.ForeignKey(
        AttributeDefinition, related_name="category_mappings", on_delete=models.CASCADE
    )
    is_required = models.BooleanField(default=False)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "definition__name")
        constraints = [
            models.UniqueConstraint(
                fields=("category", "definition"), name="catalog_category_attribute_definition"
            )
        ]

    def __str__(self):
        return f"{self.category}: {self.definition}"


class Product(models.Model):
    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    categories = models.ManyToManyField(Category, related_name="products", blank=True)
    brand = models.ForeignKey(
        Brand, related_name="products", on_delete=models.SET_NULL, null=True, blank=True
    )
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


class ProductAttributeValue(models.Model):
    product = models.ForeignKey(
        Product, related_name="attribute_values", on_delete=models.CASCADE
    )
    value = models.ForeignKey(
        AttributeValue, related_name="product_assignments", on_delete=models.PROTECT
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("product", "value"), name="catalog_product_attribute_value"
            )
        ]

    def clean(self):
        category_ids = self.product.categories.values_list("id", flat=True)
        if category_ids and not CategoryAttributeDefinition.objects.filter(
            category_id__in=category_ids, definition_id=self.value.definition_id
        ).exists():
            raise ValidationError(
                {"value": "This value is not configured for the product categories."}
            )
        if ProductOptionDefinition.objects.filter(
            product_id=self.product_id, definition_id=self.value.definition_id
        ).exists():
            raise ValidationError({"value": "A variant option cannot also be a product attribute."})

    def __str__(self):
        return f"{self.product}: {self.value}"


class ProductOptionDefinition(models.Model):
    product = models.ForeignKey(
        Product, related_name="option_definitions", on_delete=models.CASCADE
    )
    definition = models.ForeignKey(
        AttributeDefinition, related_name="product_option_definitions", on_delete=models.PROTECT
    )
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "definition__name")
        constraints = [
            models.UniqueConstraint(
                fields=("product", "definition"), name="catalog_product_option_definition"
            )
        ]

    def clean(self):
        category_ids = self.product.categories.values_list("id", flat=True)
        if category_ids and not CategoryAttributeDefinition.objects.filter(
            category_id__in=category_ids, definition_id=self.definition_id
        ).exists():
            raise ValidationError(
                {"definition": "This option is not configured for the product categories."}
            )
        if ProductAttributeValue.objects.filter(
            product_id=self.product_id, value__definition_id=self.definition_id
        ).exists():
            raise ValidationError(
                {"definition": "A product attribute cannot also be a variant option."}
            )

    def __str__(self):
        return f"{self.product}: {self.definition}"


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    sku = models.CharField(max_length=80, unique=True)
    name = models.CharField(max_length=140, blank=True)
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
        if self.is_default and not self.is_active:
            raise ValidationError({"is_default": "The default variant must be active."})

    @property
    def is_available(self):
        return self.is_active and self.product.is_published and self.stock_quantity > 0

    def __str__(self):
        return f"{self.product} / {self.name or self.sku}"


class VariantOptionValue(models.Model):
    variant = models.ForeignKey(
        ProductVariant, related_name="option_values", on_delete=models.CASCADE
    )
    option = models.ForeignKey(
        ProductOptionDefinition, related_name="variant_values", on_delete=models.PROTECT
    )
    value = models.ForeignKey(
        AttributeValue, related_name="variant_assignments", on_delete=models.PROTECT
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("variant", "option"), name="catalog_variant_one_value_per_option"
            )
        ]

    def clean(self):
        if self.option.product_id != self.variant.product_id:
            raise ValidationError({"option": "The option must belong to this variant's product."})
        if self.value.definition_id != self.option.definition_id:
            raise ValidationError(
                {"value": "The value must belong to the selected option definition."}
            )

    def __str__(self):
        return f"{self.variant}: {self.value}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="catalog/%Y/%m/")
    alt_text = models.CharField(max_length=180, blank=True)
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return self.alt_text or self.image.name


class Collection(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveIntegerField(default=0)
    products = models.ManyToManyField(
        Product, through="CollectionProduct", related_name="collections"
    )

    class Meta:
        ordering = ("position", "name")

    def __str__(self):
        return self.name


class CollectionProduct(models.Model):
    collection = models.ForeignKey(
        Collection, related_name="product_memberships", on_delete=models.CASCADE
    )
    product = models.ForeignKey(
        Product, related_name="collection_memberships", on_delete=models.CASCADE
    )
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("position", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("collection", "product"), name="catalog_collection_product"
            )
        ]

    def __str__(self):
        return f"{self.collection}: {self.product}"


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
