from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0004_migrate_legacy_variant_options"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="productvariant",
            name="options",
        ),
    ]
