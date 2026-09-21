from django import forms


class CatalogImportForm(forms.Form):
    workbook = forms.FileField(
        label="فایل اکسل کاتالوگ",
        help_text="فقط فایل .xlsx تا حجم ۵ مگابایت پذیرفته می‌شود.",
    )

    def clean_workbook(self):
        workbook = self.cleaned_data["workbook"]
        if not workbook.name.lower().endswith(".xlsx"):
            raise forms.ValidationError("فایل باید با فرمت .xlsx باشد.")
        if workbook.size > 5 * 1024 * 1024:
            raise forms.ValidationError("حجم فایل نباید بیشتر از ۵ مگابایت باشد.")
        return workbook
