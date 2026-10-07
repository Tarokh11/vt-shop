from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    variant_id = serializers.IntegerField(source="variant.id", read_only=True)
    product = serializers.CharField(source="variant.product.name", read_only=True)
    product_slug = serializers.CharField(source="variant.product.slug", read_only=True)
    product_image = serializers.SerializerMethodField()
    variant = serializers.CharField(source="variant.name", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    price_irr = serializers.IntegerField(source="variant.price_irr", read_only=True)
    available = serializers.BooleanField(source="variant.is_available", read_only=True)
    line_total_irr = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "variant_id",
            "product",
            "product_slug",
            "product_image",
            "variant",
            "sku",
            "quantity",
            "price_irr",
            "line_total_irr",
            "available",
        )

    def get_product_image(self, item):
        image = next(iter(item.variant.product.images.all()), None)
        return image.image.url if image else None

    def get_line_total_irr(self, item):
        return item.quantity * item.variant.price_irr


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal_irr = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "subtotal_irr")

    def get_subtotal_irr(self, cart):
        return sum(item.quantity * item.variant.price_irr for item in cart.items.all())


class AddCartItemSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=999)
