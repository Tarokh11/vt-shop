from django.core.management.base import BaseCommand

from orders.services import release_expired_reservations


class Command(BaseCommand):
    help = "Release stock held by expired unpaid order reservations."

    def handle(self, *args, **options):
        self.stdout.write(f"Released {release_expired_reservations()} reservation(s).")
