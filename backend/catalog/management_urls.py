from django.urls import path

from . import management_views as views

app_name = "catalog_management"

urlpatterns = [
    path("", views.products, name="home"),
    path("login/", views.StaffLoginView.as_view(), name="login"),
    path("logout/", views.StaffLogoutView.as_view(), name="logout"),
    path("products/", views.products, name="products"),
    path("products/new/", views.product_edit, name="product_create"),
    path("products/<int:pk>/", views.product_edit, name="product_edit"),
    path("products/<int:pk>/delete/", views.product_delete, name="product_delete"),
    path("products/<int:pk>/restore/", views.product_restore, name="product_restore"),
    path("products/<int:pk>/stock/<int:variant_pk>/", views.stock_adjust, name="stock_adjust"),
]
