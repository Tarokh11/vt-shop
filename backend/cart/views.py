from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import ProductVariant

from .models import Cart, CartItem
from .serializers import AddCartItemSerializer, CartSerializer, UpdateCartItemSerializer


def customer_cart(customer):
    cart, _ = Cart.objects.get_or_create(customer=customer)
    return cart


def serialized_cart(cart):
    cart = Cart.objects.prefetch_related("items__variant__product__images").get(pk=cart.pk)
    return CartSerializer(cart).data


def active_variant(variant_id):
    try:
        variant = ProductVariant.objects.select_for_update().select_related("product").get(
            pk=variant_id
        )
    except ProductVariant.DoesNotExist as error:
        raise ValidationError({"variant_id": ["This product option is unavailable."]}) from error
    if not variant.is_active or not variant.product.is_published:
        raise ValidationError({"variant_id": ["This product option is unavailable."]})
    return variant


def validate_quantity(variant, quantity):
    if quantity > variant.stock_quantity:
        raise ValidationError({"quantity": ["The requested quantity is unavailable."]})


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialized_cart(customer_cart(request.user)))


class CartItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            cart = customer_cart(request.user)
            variant = active_variant(serializer.validated_data["variant_id"])
            item = CartItem.objects.select_for_update().filter(cart=cart, variant=variant).first()
            created = item is None
            quantity = serializer.validated_data["quantity"] + (0 if created else item.quantity)
            validate_quantity(variant, quantity)
            if created:
                CartItem.objects.create(cart=cart, variant=variant, quantity=quantity)
            else:
                item.quantity = quantity
                item.save(update_fields=("quantity", "updated_at"))
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serialized_cart(cart), status=response_status)


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_item(self, customer, item_id):
        try:
            return CartItem.objects.select_related("variant__product").get(
                cart__customer=customer, pk=item_id
            )
        except CartItem.DoesNotExist:
            return None

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            item = self.get_item(request.user, item_id)
            if item is None:
                return Response(status=status.HTTP_404_NOT_FOUND)
            variant = active_variant(item.variant_id)
            quantity = serializer.validated_data["quantity"]
            validate_quantity(variant, quantity)
            item.quantity = quantity
            item.save(update_fields=("quantity", "updated_at"))
            cart = item.cart
        return Response(serialized_cart(cart))

    def delete(self, request, item_id):
        with transaction.atomic():
            item = self.get_item(request.user, item_id)
            if item is None:
                return Response(status=status.HTTP_404_NOT_FOUND)
            cart = item.cart
            item.delete()
        return Response(serialized_cart(cart))
