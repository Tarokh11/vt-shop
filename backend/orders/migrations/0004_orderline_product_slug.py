from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0003_shipment"),
    ]

    operations = [
        migrations.AddField(
            model_name="orderline",
            name="product_slug",
            field=models.SlugField(blank=True, max_length=200),
        ),
    ]
