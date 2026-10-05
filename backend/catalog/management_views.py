"""Independent staff UI backed by the same records and sessions as Django Admin."""

from functools import wraps
from hashlib import sha256

from django.contrib import messages
from django.contrib.auth.views import LoginView, LogoutView
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.paginator import Paginator
from django.db import IntegrityError, transaction
from django.db.models import Count, Exists, Min, OuterRef, Q, Subquery, Sum
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods

from cart.models import CartItem
from orders.models import OrderLine, StockReservation

from .management_forms import (
    Images,
    ProductDeletionForm,
    ProductForm,
    StaffLoginForm,
    StockForm,
    Variants,
)
from .models import (
    Category,
    InventoryAdjustment,
    Product,
    ProductVariant,
    VariantOptionValue,
)


def staff_catalog(permission):
    def decorator(view):
        @wraps(view)
        @never_cache
        def wrapped(request, *args, **kwargs):
            user = request.user
            if not user.is_authenticated:
                return redirect(f"{reverse('catalog_management:login')}?next={request.path}")
            if not user.is_active or not user.is_staff or not user.has_perm(permission):
                raise PermissionDenied
            return view(request, *args, **kwargs)

        return wrapped

    return decorator


class StaffLoginView(LoginView):
    template_name = "catalog/manage/login.html"
    authentication_form = StaffLoginForm
    next_page = reverse_lazy("catalog_management:products")


class StaffLogoutView(LogoutView):
    next_page = reverse_lazy("catalog_management:login")


def product_version(product):
    if not product.pk:
        return ""
    state = (
        product.name,
        product.slug,
        product.description,
        product.brand_id,
        product.is_published,
        product.creation_source,
        product.is_archived,
        product.updated_at,
        list(product.categories.order_by("pk").values_list("pk", flat=True)),
        list(product.images.order_by("pk").values_list("pk", "image", "alt_text", "position")),
        list(
            product.variants.order_by("pk").values_list(
                "pk",
                "sku",
                "name",
                "price_irr",
                "stock_quantity",
                "is_active",
                "is_default",
                "updated_at",
            )
        ),
        list(
            VariantOptionValue.objects.filter(variant__product=product)
            .order_by("pk")
            .values_list(
                "variant_id",
                "option_id",
                "value_id",
            )
        ),
    )
    return sha256(repr(state).encode()).hexdigest()


def product_has_history(product):
    skus = product.variants.order_by().values("sku")
    return (
        InventoryAdjustment.objects.filter(variant__product=product).exists()
        or CartItem.objects.filter(variant__product=product).exists()
        or StockReservation.objects.filter(variant__product=product).exists()
        or OrderLine.objects.filter(sku__in=Subquery(skus)).exists()
    )


@require_http_methods(["GET"])
@staff_catalog("catalog.view_product")
def products(request):
    queryset = Product.objects.select_related("brand").prefetch_related("images", "categories")
    query = request.GET.get("q", "").strip()
    publication = request.GET.get("status", "")
    category = request.GET.get("category", "")
    archived = publication == "archived"
    queryset = queryset.filter(is_archived=archived)
    if query:
        queryset = queryset.filter(
            Q(name__icontains=query)
            | Q(variants__sku__icontains=query)
            | Q(brand__name__icontains=query)
        ).distinct()
    if publication in ("published", "draft"):
        queryset = queryset.filter(is_published=publication == "published")
    if category.isdecimal():
        queryset = queryset.filter(categories__pk=int(category))
    # Filter via IDs first, so an SKU match does not hide other variants from totals.
    queryset = (
        Product.objects.filter(pk__in=queryset.values("pk"))
        .select_related("brand")
        .prefetch_related("images", "categories")
        .annotate(
            variant_count=Count("variants"),
            stock_total=Sum("variants__stock_quantity"),
            starting_price=Min("variants__price_irr"),
            has_protected_history=(
                Exists(InventoryAdjustment.objects.filter(variant__product_id=OuterRef("pk")))
                | Exists(CartItem.objects.filter(variant__product_id=OuterRef("pk")))
                | Exists(StockReservation.objects.filter(variant__product_id=OuterRef("pk")))
                | Exists(
                    OrderLine.objects.filter(
                        sku__in=Subquery(
                            ProductVariant.objects.filter(product_id=OuterRef("pk")).values("sku")
                        )
                    )
                )
            ),
        )
        .order_by("-created_at", "-pk")
    )
    page = Paginator(queryset, 12).get_page(request.GET.get("page"))
    params = request.GET.copy()
    params.pop("page", None)
    all_products = Product.objects.filter(is_archived=False)
    return render(
        request,
        "catalog/manage/products.html",
        {
            "page": page,
            "query": query,
            "publication": publication,
            "category": category,
            "archived": archived,
            "categories": Category.objects.all(),
            "filter_query": params.urlencode(),
            "stats": {
                "total": all_products.count(),
                "archived": Product.objects.filter(is_archived=True).count(),
                "published": all_products.filter(is_published=True).count(),
                "draft": all_products.filter(is_published=False).count(),
                "low_stock": ProductVariant.objects.filter(
                    is_active=True, stock_quantity__lt=5
                ).count(),
            },
        },
    )


def check_related_permissions(user, formset, model):
    for form in formset.forms:
        if not form.cleaned_data:
            continue
        if form.cleaned_data.get("DELETE"):
            action = "delete"
        elif not form.instance.pk and form.has_changed():
            action = "add"
        elif form.has_changed():
            action = "change"
        else:
            continue
        if not user.has_perm(f"catalog.{action}_{model}"):
            raise PermissionDenied


@require_http_methods(["GET", "POST"])
@staff_catalog("catalog.view_product")
def product_edit(request, pk=None):
    action = "change" if pk else "add"
    if not request.user.has_perm(f"catalog.{action}_product"):
        raise PermissionDenied
    response_status = 200
    with transaction.atomic():
        queryset = Product.objects.all()
        if request.method == "POST":
            queryset = queryset.select_for_update()
        product = get_object_or_404(queryset, pk=pk) if pk else Product()
        if pk and request.method == "POST":
            # Match the lock used by checkout and inventory adjustments.
            list(product.variants.select_for_update().order_by("pk"))
        version = product_version(product)
        data = request.POST if request.method == "POST" else None
        files = request.FILES if request.method == "POST" else None
        form = ProductForm(
            data,
            instance=product,
            initial={
                "publish": product.is_published,
                "version": version,
            },
        )
        publish = (
            form.fields["publish"].widget.value_from_datadict(data, {}, "publish")
            if data is not None
            else product.is_published
        )
        variants = Variants(
            data,
            instance=product,
            prefix="variants",
            publish=publish,
            initial=[{"is_default": True}] if not pk else None,
        )
        images = Images(data, files, instance=product, prefix="images")
        if request.method == "POST":
            valid = all([form.is_valid(), variants.is_valid(), images.is_valid()])
            if pk and form.cleaned_data.get("version") != version:
                form.add_error(
                    None,
                    "این محصول در پنل دیگری تغییر کرده است. "
                    "صفحه را تازه کنید و دوباره ویرایش کنید.",
                )
                response_status = 409
                valid = False
            if valid:
                check_related_permissions(request.user, variants, "productvariant")
                check_related_permissions(request.user, images, "productimage")
                try:
                    with transaction.atomic():
                        product = form.save(commit=False)
                        product.is_published = False
                        product.save()
                        form.save_m2m()
                        for assignment in product.attribute_values.select_related("value"):
                            assignment.full_clean()
                        for option in product.option_definitions.all():
                            option.full_clean()
                        # Clear first to allow swapping the default without violating uniqueness.
                        product.variants.filter(is_default=True).update(is_default=False)
                        for row in variants.forms:
                            if not row.cleaned_data:
                                continue
                            variant = row.save(commit=False)
                            variant.product = product
                            variant.save()
                            for option in row.product_options:
                                key = f"option_{option.pk}"
                                if key in row.changed_data:
                                    action = (
                                        "change"
                                        if row.instance.option_values.filter(option=option).exists()
                                        else "add"
                                    )
                                    if not request.user.has_perm(
                                        f"catalog.{action}_variantoptionvalue"
                                    ):
                                        raise PermissionDenied
                                assignment, _ = VariantOptionValue.objects.get_or_create(
                                    variant=variant,
                                    option=option,
                                    defaults={"value": row.cleaned_data[f"option_{option.pk}"]},
                                )
                                assignment.value = row.cleaned_data[f"option_{option.pk}"]
                                assignment.full_clean()
                                assignment.save()
                        product.is_published = form.cleaned_data["publish"]
                        product.full_clean()
                        product.save()
                        images.save()
                except (ValidationError, IntegrityError):
                    form.add_error(
                        None, "ذخیره انجام نشد. اطلاعات محصول و کدهای یکتای کالا را بررسی کنید."
                    )
                else:
                    messages.success(
                        request, "محصول ذخیره شد؛ تغییرات در پنل Django نیز قابل مشاهده است."
                    )
                    return redirect("catalog_management:product_edit", pk=product.pk)
        return render(
            request,
            "catalog/manage/product_edit.html",
            {
                "product": product,
                "form": form,
                "variants": variants,
                "images": images,
            },
            status=response_status,
        )


@require_http_methods(["GET", "POST"])
@staff_catalog("catalog.delete_product")
def product_delete(request, pk):
    response_status = 200
    with transaction.atomic():
        product = get_object_or_404(Product, pk=pk)
        if request.method == "POST":
            product = get_object_or_404(Product.objects.select_for_update(), pk=pk)
            list(product.variants.select_for_update().order_by("pk"))
        has_history = product_has_history(product)
        version = product_version(product)
        form = ProductDeletionForm(
            request.POST if request.method == "POST" else None,
            initial={"version": version},
            creation_source=product.creation_source,
            has_history=has_history,
        )
        if request.method == "POST":
            valid = form.is_valid()
            if request.POST.get("version") != version:
                form.add_error(None, "محصول تغییر کرده است. صفحه را تازه کنید و دوباره بررسی کنید.")
                response_status = 409
                valid = False
            if valid:
                checked_source = form.cleaned_data.get("source_check")
                preserve_record = (
                    has_history
                    or product.creation_source == "INVENTORY"
                    or checked_source == "inventory"
                )
                if preserve_record:
                    if checked_source == "inventory" and product.creation_source == "UNKNOWN":
                        product.creation_source = Product.CreationSource.INVENTORY
                    elif checked_source == "manual" and product.creation_source == "UNKNOWN":
                        product.creation_source = Product.CreationSource.MANUAL
                    product.is_published = False
                    product.is_archived = True
                    product.save(
                        update_fields=(
                            "creation_source",
                            "is_published",
                            "is_archived",
                            "updated_at",
                        )
                    )
                    messages.success(
                        request, "محصول از فروشگاه بایگانی شد؛ سوابق انبار و خریدها حفظ شدند."
                    )
                else:
                    try:
                        with transaction.atomic():
                            product.delete()
                    except (ProtectedError, ValidationError):
                        product.is_published = False
                        product.is_archived = True
                        product.save(update_fields=("is_published", "is_archived", "updated_at"))
                        messages.success(
                            request,
                            "برای حفظ سابقهٔ انبار، محصول بایگانی شد و سوابقش باقی ماندند.",
                        )
                    else:
                        messages.success(request, "محصولِ بدون سابقه به‌طور کامل حذف شد.")
                return redirect("catalog_management:products")
        return render(
            request,
            "catalog/manage/product_delete.html",
            {"product": product, "form": form, "has_history": has_history},
            status=response_status,
        )


@require_http_methods(["POST"])
@staff_catalog("catalog.change_product")
def product_restore(request, pk):
    with transaction.atomic():
        product = get_object_or_404(Product.objects.select_for_update(), pk=pk)
        product.is_archived = False
        product.save(update_fields=("is_archived", "updated_at"))
    messages.success(request, "محصول از بایگانی خارج شد؛ وضعیت انتشار آن را بررسی کنید.")
    return redirect("catalog_management:product_edit", pk=pk)


@require_http_methods(["GET", "POST"])
@staff_catalog("catalog.add_inventoryadjustment")
def stock_adjust(request, pk, variant_pk):
    if not request.user.has_perms(("catalog.view_product", "catalog.view_productvariant")):
        raise PermissionDenied
    variant = get_object_or_404(
        ProductVariant.objects.select_related("product"), pk=variant_pk, product_id=pk
    )
    form = StockForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        try:
            with transaction.atomic():
                variant = ProductVariant.objects.select_for_update().get(pk=variant.pk)
                quantity = variant.stock_quantity + form.cleaned_data["quantity_delta"]
                ProductVariant._meta.get_field("stock_quantity").clean(quantity, variant)
                InventoryAdjustment.objects.create(
                    variant=variant, created_by=request.user, **form.cleaned_data
                )
        except ValidationError:
            form.add_error("quantity_delta", "موجودی نهایی نباید منفی یا بیشتر از حد مجاز باشد.")
            variant.refresh_from_db()
        else:
            messages.success(request, "تغییر موجودی با نام شما و دلیل آن ثبت شد.")
            return redirect("catalog_management:product_edit", pk=pk)
    history = variant.inventory_adjustments.select_related("created_by")[:10]
    return render(
        request,
        "catalog/manage/stock.html",
        {
            "variant": variant,
            "form": form,
            "history": history,
        },
    )
