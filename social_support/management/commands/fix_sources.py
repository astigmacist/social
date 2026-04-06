"""
Management command to update benefit source URLs to working ones.
Run: python3 manage.py fix_sources
"""
from django.core.management.base import BaseCommand
from social_support.models import Benefit


CORRECT_SOURCES = {
    # Family
    'asp': 'https://www.gov.kz/memleket/entities/enbek',
    'birth': 'https://egov.kz/cms/ru/information/social-support',
    'childcare': 'https://egov.kz/cms/ru/information/social-support',
    'largefamily': 'https://egov.kz/cms/ru/information/social-support',
    # Elderly
    'elderlytravel': 'https://www.gov.kz/memleket/entities/mzsr',
    'medicines': 'https://www.gov.kz/memleket/entities/mzsr',
    # Disability
    'disability': 'https://egov.kz/cms/ru/information/social-support',
    'tsr': 'https://www.gov.kz/memleket/entities/mzsr',
    # Employment
    'unemployment': 'https://www.enbek.kz/ru',
    'retraining': 'https://www.enbek.kz/ru',
    # Housing
    'housing-subsidy': 'https://egov.kz/cms/ru/information/social-support',
    'utility': 'https://egov.kz/cms/ru/information/social-support',
}


class Command(BaseCommand):
    help = 'Fix benefit source URLs to working government portal links'

    def handle(self, *args, **options):
        updated = 0
        for benefit in Benefit.objects.all():
            # Find by title matching (since we use slug-like IDs in data.js)
            for key, url in CORRECT_SOURCES.items():
                if key.lower() in benefit.title_ru.lower().replace(' ', '-') or \
                   key.lower() in str(benefit.id):
                    pass  # handled below

        # Update by known title keywords
        title_to_url = {
            'Адресная социальная помощь': 'https://www.gov.kz/memleket/entities/enbek',
            'рождении ребёнка': 'https://egov.kz/cms/ru/information/social-support',
            'уходу за ребёнком': 'https://egov.kz/cms/ru/information/social-support',
            'многодетным': 'https://egov.kz/cms/ru/information/social-support',
            'проезд для пенсион': 'https://www.gov.kz/memleket/entities/mzsr',
            'лекарства пенсион': 'https://www.gov.kz/memleket/entities/mzsr',
            'инвалидности': 'https://egov.kz/cms/ru/information/social-support',
            'реабилитации': 'https://www.gov.kz/memleket/entities/mzsr',
            'безработиц': 'https://www.enbek.kz/ru',
            'переобучение': 'https://www.enbek.kz/ru',
            'аренды жилья': 'https://egov.kz/cms/ru/information/social-support',
            'ЖКУ': 'https://egov.kz/cms/ru/information/social-support',
        }

        for benefit in Benefit.objects.all():
            for keyword, url in title_to_url.items():
                if keyword.lower() in benefit.title_ru.lower():
                    if benefit.source != url:
                        benefit.source = url
                        benefit.save()
                        updated += 1
                        self.stdout.write(f'  Updated: {benefit.title_ru[:50]} → {url}')
                    break

        self.stdout.write(self.style.SUCCESS(f'\nDone. Updated {updated} benefits.'))
