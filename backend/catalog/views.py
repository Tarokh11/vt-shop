from collections import defaultdict

from django.db.models import Exists, OuterRef, Prefetch, Q
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AttributeDefinition,
    AttributeValue,
    Brand,
    Category,
    CategoryAttributeDefinition,
    Collection,
    Product,
    ProductAttributeValue,
    ProductOptionDefinition,
    ProductVariant,
    VariantOptionValue,
)
from .serializers import (
    AttributeDefinitionSerializer,
    BrandSerializer,
    CategorySerializer,
    CollectionSerializer,
    ProductDetailSerializer,
    ProductSerializer,
)


class CatalogPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 100


def _descendant_category_ids(category):
    category_ids = {category.id}
    parent_ids = {category.id}
    while parent_ids:
        child_ids = set(
            Category.objects.filter(parent_id__in=parent_ids, is_active=True).values_list(
                "id", flat=True
            )
        )
        child_ids -= category_ids
        category_ids.update(child_ids)
        parent_ids = child_ids
    return category_ids


def _requested_category(params):
    category_slugs = _query_values(params, "category")
    if len(category_slugs) > 1:
        raise ValidationError({"category": "Only one category may be selected."})
    if not category_slugs:
        return None
    category = Category.objects.filter(slug=category_slugs[0], is_active=True).first()
    if category is None:
        raise ValidationError({"category": "Unknown active category."})
    return category


def _category_attribute_definition_ids(category):
    category_ids = _descendant_category_ids(category)
    parent = category.parent
    while parent is not None:
        category_ids.add(parent.id)
        parent = parent.parent
    return set(
        CategoryAttributeDefinition.objects.filter(category_id__in=category_ids).values_list(
            "definition_id", flat=True
        )
    )


def _query_values(params, name):
    values = params.getlist(name)
    if any(not value for value in values):
        raise ValidationError({name: "Empty values are not allowed."})
    return values


def _filter_params(request, queryset):
    allowed = {"page", "page_size", "category", "brand", "collection", "attribute", "in_stock", "q"}
    unknown = set(request.query_params) - allowed
    if unknown:
        raise ValidationError({"detail": f"Unsupported filters: {', '.join(sorted(unknown))}."})

    category = _requested_category(request.query_params)
    if category is not None:
        queryset = queryset.filter(categories__in=_descendant_category_ids(category))

    for name, model, field in (
        ("brand", Brand, "brand__slug"),
        ("collection", Collection, "collections__slug"),
    ):
        slugs = _query_values(request.query_params, name)
        if not slugs:
            continue
        active = model.objects.filter(slug__in=slugs, is_active=True)
        if active.count() != len(set(slugs)):
            raise ValidationError({name: "Unknown active value."})
        queryset = queryset.filter(**{f"{field}__in": slugs})

    values_by_definition = defaultdict(list)
    attribute_definition_ids = (
        _category_attribute_definition_ids(category) if category is not None else set()
    )
    for raw_value in _query_values(request.query_params, "attribute"):
        if category is None:
            raise ValidationError(
                {"attribute": "Select a category before filtering by attributes."}
            )
        try:
            definition_slug, value_slug = raw_value.split(":", 1)
        except ValueError as error:
            raise ValidationError(
                {"attribute": "Use the definition-slug:value-slug format."}
            ) from error
        definition = AttributeDefinition.objects.filter(
            id__in=attribute_definition_ids,
            slug=definition_slug,
            is_visible=True,
            is_filterable=True,
        ).first()
        value = AttributeValue.objects.filter(
            definition=definition, slug=value_slug, is_active=True
        ).first()
        if definition is None or value is None:
            raise ValidationError({"attribute": "Unknown filterable attribute value."})
        values_by_definition[definition.id].append(value.id)

    for definition_id, value_ids in values_by_definition.items():
        queryset = queryset.filter(
            Q(attribute_values__value_id__in=value_ids)
            | Q(
                variants__is_active=True,
                variants__option_values__option__definition_id=definition_id,
                variants__option_values__value_id__in=value_ids,
            )
        )

    in_stock = request.query_params.get("in_stock")
    if in_stock is not None:
        if in_stock not in {"true", "false"}:
            raise ValidationError({"in_stock": "Use true or false."})
        available_variants = ProductVariant.objects.filter(
            product_id=OuterRef("pk"), is_active=True, stock_quantity__gt=0
        )
        queryset = queryset.annotate(has_stock=Exists(available_variants)).filter(
            has_stock=in_stock == "true"
        )

    query = request.query_params.get("q", "").strip()
    if query:
        queryset = queryset.filter(
            Q(name__icontains=query)
            | Q(description__icontains=query)
            | Q(brand__name__icontains=query)
            | Q(variants__sku__icontains=query)
            | Q(
                attribute_values__value__definition__is_searchable=True,
                attribute_values__value__label__icontains=query,
            )
            | Q(
                variants__option_values__value__definition__is_searchable=True,
                variants__option_values__value__label__icontains=query,
            )
        )
    return queryset


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
            .filter(Q(brand__isnull=True) | Q(brand__is_active=True))
            .select_related("brand")
            .prefetch_related(
                Prefetch("categories", queryset=Category.objects.filter(is_active=True)),
                "images",
                Prefetch(
                    "attribute_values",
                    queryset=ProductAttributeValue.objects.filter(
                        value__is_active=True, value__definition__is_visible=True
                    ).select_related("value__definition"),
                ),
                Prefetch(
                    "option_definitions",
                    queryset=ProductOptionDefinition.objects.filter(
                        definition__is_visible=True
                    ).select_related("definition"),
                ),
                Prefetch("collections", queryset=Collection.objects.filter(is_active=True)),
                Prefetch(
                    "variants",
                    queryset=ProductVariant.objects.filter(is_active=True).prefetch_related(
                        Prefetch(
                            "option_values",
                            queryset=VariantOptionValue.objects.filter(
                                value__is_active=True, option__definition__is_visible=True
                            ).select_related("option__definition", "value"),
                        )
                    ),
                ),
            )
            .distinct()
        )
        return _filter_params(self.request, queryset).distinct()


class ProductListView(PublishedProductQuerysetMixin, ListAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductSerializer
    pagination_class = CatalogPagination


class ProductDetailView(PublishedProductQuerysetMixin, RetrieveAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"


class CatalogFilterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        category = _requested_category(request.query_params)
        attribute_definition_ids = (
            _category_attribute_definition_ids(category) if category is not None else set()
        )
        attributes = AttributeDefinition.objects.filter(
            id__in=attribute_definition_ids,
            is_visible=True,
            is_filterable=True,
            values__is_active=True,
        ).distinct().prefetch_related(
            Prefetch("values", queryset=AttributeValue.objects.filter(is_active=True))
        )
        return Response(
            {
                "categories": CategorySerializer(
                    Category.objects.filter(is_active=True), many=True
                ).data,
                "brands": BrandSerializer(Brand.objects.filter(is_active=True), many=True).data,
                "collections": CollectionSerializer(
                    Collection.objects.filter(is_active=True), many=True
                ).data,
                "attributes": AttributeDefinitionSerializer(attributes, many=True).data,
            }
        )
