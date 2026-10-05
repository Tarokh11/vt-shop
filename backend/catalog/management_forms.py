"""Forms for the standalone staff catalog panel."""

from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.forms import BaseInlineFormSet, inlineformset_factory

from .models import (
    AttributeValue,
    Product,
    ProductImage,
    ProductVariant,
)


class StaffLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="نام کاربری",
        widget=forms.TextInput(attrs={"autocomplete": "username", "autofocus": True, "dir": "ltr"}),
    )
    password = forms.CharField(
        label="رمز عبور",
        strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password", "dir": "ltr"}),
    )

    def confirm_login_allowed(self, user):
        super().confirm_login_allowed(user)
        if not user.is_staff:
            raise forms.ValidationError("ورود به این پنل فقط برای کارکنان فروشگاه مجاز است.")


class ProductForm(forms.ModelForm):
    publish = forms.BooleanField(required=False, label="نمایش محصول در فروشگاه")
    version = forms.CharField(widget=forms.HiddenInput, required=False)

    class Meta:
        model = Product
        fields = ("name", "slug", "description", "brand", "categories")
        labels = {
            "name": "نام محصول",
            "slug": "نشانی محصول",
            "description": "توضیحات",
            "brand": "برند",
            "categories": "دسته‌بندی‌ها",
        }
        widgets = {
            "description": forms.Textarea(attrs={"rows": 6}),
            "categories": forms.CheckboxSelectMultiple,
        }
        help_texts = {"slug": "نشانی یکتا؛ حروف فارسی، لاتین، عدد، خط تیره و زیرخط."}


class VariantForm(forms.ModelForm):
    class Meta:
        model = ProductVariant
        fields = ("sku", "name", "price_irr", "is_active", "is_default")
        labels = {
            "sku": "کد کالا (SKU)",
            "name": "نام تنوع",
            "price_irr": "قیمت (ریال)",
            "is_active": "فعال",
            "is_default": "تنوع پیش‌فرض",
        }
        widgets = {"sku": forms.TextInput(attrs={"dir": "ltr"})}

    def __init__(self, *args, product=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.product_options = (
            list(product.option_definitions.select_related("definition")) if product.pk else []
        )
        current = (
            {item.option_id: item.value_id for item in self.instance.option_values.all()}
            if self.instance.pk
            else {}
        )
        for option in self.product_options:
            self.fields[f"option_{option.pk}"] = forms.ModelChoiceField(
                label=option.definition.name,
                queryset=AttributeValue.objects.filter(definition=option.definition),
                initial=current.get(option.pk),
            )

    def _get_validation_exclusions(self):
        # The formset validates defaults together so switching the default is possible.
        return super()._get_validation_exclusions() | {"is_default"}


class VariantFormSet(BaseInlineFormSet):
    def __init__(self, *args, publish=False, **kwargs):
        self.publish = publish
        super().__init__(*args, **kwargs)

    def get_form_kwargs(self, index):
        return {**super().get_form_kwargs(index), "product": self.instance}

    def add_fields(self, form, index):
        super().add_fields(form, index)
        form.fields["id"].queryset = self.get_queryset()

    def clean(self):
        super().clean()
        if any(self.errors):
            return
        rows = [form for form in self.forms if form.cleaned_data]
        defaults = [form for form in rows if form.cleaned_data.get("is_default")]
        if len(defaults) > 1:
            raise forms.ValidationError("فقط یک تنوع می‌تواند پیش‌فرض باشد.")
        if any(not form.cleaned_data.get("is_active") for form in defaults):
            raise forms.ValidationError("تنوع پیش‌فرض باید فعال باشد.")
        if self.publish and not defaults:
            raise forms.ValidationError("برای انتشار محصول، یک تنوع فعال را پیش‌فرض کنید.")
        existing_ids = (
            set(self.instance.variants.values_list("pk", flat=True)) if self.instance.pk else set()
        )
        submitted_ids = [form.cleaned_data["id"].pk for form in rows if form.cleaned_data.get("id")]
        if set(submitted_ids) != existing_ids or len(submitted_ids) != len(set(submitted_ids)):
            raise forms.ValidationError(
                "تنوع‌های موجود نباید حذف یا تکرار شوند؛ آن‌ها را غیرفعال کنید."
            )
        combinations = set()
        for form in rows:
            if form.cleaned_data.get("id") and form.cleaned_data["id"].pk not in existing_ids:
                raise forms.ValidationError("تنوع انتخاب‌شده متعلق به این محصول نیست.")
            if form.product_options:
                combination = tuple(
                    form.cleaned_data[f"option_{option.pk}"].pk for option in form.product_options
                )
                if combination in combinations:
                    raise forms.ValidationError(
                        "دو تنوع نمی‌توانند ترکیب گزینه‌های یکسان داشته باشند."
                    )
                combinations.add(combination)


Variants = inlineformset_factory(
    Product,
    ProductVariant,
    form=VariantForm,
    formset=VariantFormSet,
    extra=1,
    can_delete=False,
    max_num=100,
    validate_max=True,
)


class ImageForm(forms.ModelForm):
    class Meta:
        model = ProductImage
        fields = ("image", "alt_text", "position")
        labels = {"image": "تصویر", "alt_text": "توضیح تصویر", "position": "ترتیب نمایش"}

    def clean_image(self):
        image = self.cleaned_data.get("image")
        if image and hasattr(image, "content_type"):
            if image.size > 5 * 1024 * 1024:
                raise forms.ValidationError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.")
            if image.image.format not in ("JPEG", "PNG", "WEBP", "GIF"):
                raise forms.ValidationError("تصویر باید PNG، JPEG، WebP یا GIF باشد.")
        return image


class ImageFormSet(BaseInlineFormSet):
    def add_fields(self, form, index):
        super().add_fields(form, index)
        form.fields["id"].queryset = self.get_queryset()

    def clean(self):
        super().clean()
        if any(self.errors):
            return
        existing_ids = (
            set(self.instance.images.values_list("pk", flat=True)) if self.instance.pk else set()
        )
        submitted_ids = [
            form.cleaned_data["id"].pk for form in self.forms if form.cleaned_data.get("id")
        ]
        if set(submitted_ids) != existing_ids or len(submitted_ids) != len(set(submitted_ids)):
            raise forms.ValidationError("تصاویر موجود باید یک‌بار در فرم ارسال شوند.")


Images = inlineformset_factory(
    Product,
    ProductImage,
    form=ImageForm,
    formset=ImageFormSet,
    extra=1,
    can_delete=True,
    max_num=30,
    validate_max=True,
)


class StockForm(forms.Form):
    quantity_delta = forms.IntegerField(
        label="تغییر موجودی",
        min_value=-2_147_483_648,
        max_value=2_147_483_647,
        help_text="برای افزایش عدد مثبت و برای کاهش عدد منفی وارد کنید.",
    )
    reason = forms.CharField(
        label="دلیل تغییر",
        max_length=240,
        widget=forms.TextInput(attrs={"placeholder": "مثلاً دریافت محموله یا اصلاح شمارش"}),
    )

    def clean_quantity_delta(self):
        delta = self.cleaned_data["quantity_delta"]
        if not delta:
            raise forms.ValidationError("مقدار تغییر نباید صفر باشد.")
        return delta


class ProductDeletionForm(forms.Form):
    version = forms.CharField(widget=forms.HiddenInput)
    source_check = forms.ChoiceField(
        label="منشأ محصول را بررسی کردم",
        choices=(
            ("manual", "محصول دستی وارد شده و از انبار نیامده است"),
            ("inventory", "محصول از انبار آمده و آنجا حذف شده است"),
        ),
        widget=forms.RadioSelect,
        required=False,
    )
    warehouse_checked = forms.BooleanField(
        label="حذف محصول را در انبار بررسی و تأیید کردم",
        required=False,
    )

    def __init__(self, *args, creation_source, has_history, **kwargs):
        self.creation_source = creation_source
        self.has_history = has_history
        super().__init__(*args, **kwargs)
        if creation_source == "MANUAL":
            self.initial["source_check"] = "manual"
        elif creation_source == "INVENTORY":
            self.initial["source_check"] = "inventory"
            self.fields["source_check"].choices = (
                ("inventory", "محصول از انبار آمده و آنجا حذف شده است"),
            )

    def clean(self):
        data = super().clean()
        if self.creation_source == "UNKNOWN" and not data.get("source_check"):
            self.add_error("source_check", "ابتدا منشأ محصول را مشخص کنید.")
        if (
            self.creation_source == "INVENTORY"
            or data.get("source_check") == "inventory"
        ) and not data.get("warehouse_checked"):
            self.add_error(
                "warehouse_checked", "پیش از حذف باید حذف محصول از انبار را تأیید کنید."
            )
        if self.has_history:
            return data
        return data
