from rest_framework import serializers

from .models import Order, OrderLine, Shipment


class OrderLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderLine
        fields = ("product_name", "product_slug", "variant_name", "quantity", "line_total_irr")


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ("status", "tracking_code")


class CheckoutSerializer(serializers.Serializer):
    shipping_region = serializers.ChoiceField(choices=["TEHRAN", "OUTSIDE_TEHRAN"])
    recipient_name = serializers.CharField(max_length=160)
    recipient_phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=1000)


class OrderSerializer(serializers.ModelSerializer):
    lines = OrderLineSerializer(many=True, read_only=True)
    shipment = ShipmentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = (
            "number",
            "status",
            "shipping_region",
            "shipping_amount_irr",
            "subtotal_irr",
            "total_irr",
            "created_at",
            "lines",
            "shipment",
        )
