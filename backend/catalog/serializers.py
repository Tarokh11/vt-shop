from django.db.models import Q
from rest_framework import serializers

from .models import (
    AttributeDefinition,
    AttributeValue,
    Brand,
    Category,
    Collection,
    Product,
    ProductAttributeValue,
    ProductImage,
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "parent", "position")


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug", "description", "position")


class AttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttributeValue
        fields = ("id", "label", "slug", "position")


class AttributeDefinitionSerializer(serializers.ModelSerializer):
    values = AttributeValueSerializer(many=True, read_only=True)

    class Meta:
        model = AttributeDefinition
        fields = ("id", "name", "slug", "is_visible", "is_filterable", "position", "values")


class ProductAttributeValueSerializer(serializers.ModelSerializer):
    definition = serializers.SerializerMethodField()
    value = AttributeValueSerializer(read_only=True)

    class Meta:
        model = ProductAttributeValue
        fields = ("definition", "value")

    def get_definition(self, obj):
        definition = obj.value.definition
        return {"id": definition.id, "name": definition.name, "slug": definition.slug}


class ProductOptionDefinitionSerializer(serializers.ModelSerializer):
    definition = serializers.SerializerMethodField()

    class Meta:
        model = ProductOptionDefinition
        fields = ("id", "definition", "position")

    def get_definition(self, obj):
        definition = obj.definition
        return {"id": definition.id, "name": definition.name, "slug": definition.slug}


class VariantOptionValueSerializer(serializers.ModelSerializer):
    definition = serializers.SerializerMethodField()
    value = AttributeValueSerializer(read_only=True)

    class Meta:
        model = VariantOptionValue
        fields = ("definition", "value")

    def get_definition(self, obj):
        definition = obj.option.definition
        return {"id": definition.id, "name": definition.name, "slug": definition.slug}


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ("id", "name", "slug", "description", "position")


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "position")

    def get_image(self, obj):
        return obj.image.url


class ProductVariantSerializer(serializers.ModelSerializer):
    available = serializers.BooleanField(source="is_available", read_only=True)
    option_values = VariantOptionValueSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "sku",
            "name",
            "option_values",
            "price_irr",
            "available",
            "is_default",
        )


class ProductSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    brand = BrandSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeValueSerializer(
        source="attribute_values", many=True, read_only=True
    )
    option_definitions = ProductOptionDefinitionSerializer(many=True, read_only=True)
    collections = CollectionSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "categories",
            "attributes",
            "option_definitions",
            "collections",
            "images",
            "variants",
        )


class RelatedProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ("id", "name", "slug", "images")


class ProductDetailSerializer(ProductSerializer):
    related_products = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ("related_products",)

    def get_related_products(self, obj):
        category_ids = obj.categories.values_list("id", flat=True)
        if not category_ids:
            return []
        products = (
            Product.objects.filter(
                is_published=True,
                categories__in=category_ids,
                variants__is_active=True,
                variants__is_default=True,
            )
            .filter(Q(brand__isnull=True) | Q(brand__is_active=True))
            .exclude(pk=obj.pk)
            .prefetch_related("images")
            .distinct()
            .order_by("-created_at")[:4]
        )
        return RelatedProductSerializer(products, many=True).data
