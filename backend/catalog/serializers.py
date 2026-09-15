from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description")


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "position")

    def get_image(self, obj):
        return obj.image.url


class ProductVariantSerializer(serializers.ModelSerializer):
    available = serializers.BooleanField(source="is_available", read_only=True)

    class Meta:
        model = ProductVariant
        fields = ("id", "sku", "name", "options", "price_irr", "available", "is_default")


class ProductSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ("id", "name", "slug", "description", "categories", "images", "variants")
