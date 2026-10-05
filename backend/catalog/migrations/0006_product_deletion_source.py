from django.db import migrations, models


def mark_products_with_inventory_records(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    database = schema_editor.connection.alias
    Product.objects.using(database).filter(
        variants__inventory_adjustments__isnull=False
    ).distinct().update(creation_source="INVENTORY")


class Migration(migrations.Migration):
    dependencies = [("catalog", "0005_remove_productvariant_options")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="creation_source",
            field=models.CharField(
                choices=[
                    ("UNKNOWN", "Needs source verification"),
                    ("MANUAL", "Manually managed"),
                    ("INVENTORY", "Imported from inventory"),
                ],
                default="UNKNOWN",
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_products_with_inventory_records, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="product",
            name="creation_source",
            field=models.CharField(
                choices=[
                    ("UNKNOWN", "Needs source verification"),
                    ("MANUAL", "Manually managed"),
                    ("INVENTORY", "Imported from inventory"),
                ],
                default="MANUAL",
                max_length=12,
            ),
        ),
    ]
