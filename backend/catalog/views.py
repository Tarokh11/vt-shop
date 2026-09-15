from django.db.models import Prefetch
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny

from .models import Category, Product, ProductVariant
from .serializers import CategorySerializer, ProductSerializer


class CategoryListView(ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class PublishedProductQuerysetMixin:
    def get_queryset(self):
        queryset = (
            Product.objects.filter(
                is_published=True, variants__is_active=True, variants__is_default=True
            )
            .prefetch_related(
                Prefetch("categories", queryset=Category.objects.filter(is_active=True)),
                "images",
                Prefetch("variants", queryset=ProductVariant.objects.filter(is_active=True)),
            )
            .distinct()
        )
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(categories__slug=category, categories__is_active=True)
        return queryset


class ProductListView(PublishedProductQuerysetMixin, ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer


class ProductDetailView(PublishedProductQuerysetMixin, RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    lookup_field = "slug"
