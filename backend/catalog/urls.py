from django.urls import path

from .views import CatalogFilterView, CategoryListView, ProductDetailView, ProductListView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("filters/", CatalogFilterView.as_view(), name="catalog-filter-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<str:slug>/", ProductDetailView.as_view(), name="product-detail"),
]
