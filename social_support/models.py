from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    LANG_CHOICES = [('ru', 'Русский'), ('kz', 'Қазақша')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Пользователь")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Телефон")
    iin = models.CharField(max_length=12, blank=True, verbose_name="ИИН")
    address = models.CharField(max_length=255, blank=True, verbose_name="Адрес")
    language = models.CharField(max_length=2, choices=LANG_CHOICES, default='ru', verbose_name="Язык")
    avatar_color = models.CharField(max_length=7, default='#2563eb', verbose_name="Цвет аватара")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Профиль пользователя"
        verbose_name_plural = "Профили пользователей"

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} — профиль"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


class BenefitCategory(models.Model):
    title_ru = models.CharField(max_length=100, verbose_name="Название (RU)")
    title_kz = models.CharField(max_length=100, verbose_name="Название (KZ)")
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name = "Категория льгот"
        verbose_name_plural = "Категории льгот"

    def __str__(self):
        return self.title_ru


class Benefit(models.Model):
    category = models.ForeignKey(BenefitCategory, on_delete=models.CASCADE, related_name="benefits", verbose_name="Категория")
    icon = models.CharField(max_length=50, verbose_name="Иконка", default="shield")

    badge_ru = models.CharField(max_length=50, verbose_name="Метка (RU)")
    badge_kz = models.CharField(max_length=50, verbose_name="Метка (KZ)")

    title_ru = models.CharField(max_length=200, verbose_name="Заголовок (RU)")
    title_kz = models.CharField(max_length=200, verbose_name="Заголовок (KZ)")

    short_desc_ru = models.TextField(verbose_name="Краткое описание (RU)")
    short_desc_kz = models.TextField(verbose_name="Краткое описание (KZ)")

    amount_ru = models.TextField(verbose_name="Размер выплат (RU)")
    amount_kz = models.TextField(verbose_name="Размер выплат (KZ)")

    who_ru = models.TextField(verbose_name="Кому положено (RU)")
    who_kz = models.TextField(verbose_name="Кому положено (KZ)")

    docs_ru = models.TextField(verbose_name="Документы (RU)")
    docs_kz = models.TextField(verbose_name="Документы (KZ)")

    how_ru = models.TextField(verbose_name="Как получить (RU)")
    how_kz = models.TextField(verbose_name="Как получить (KZ)")

    source = models.URLField(verbose_name="Источник", blank=True, null=True)

    class Meta:
        verbose_name = "Льгота"
        verbose_name_plural = "Льготы"

    def __str__(self):
        return self.title_ru


class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('processing', 'В обработке'),
        ('assigned', 'Специалист назначен'),
        ('done', 'Завершена'),
        ('rejected', 'Отклонена'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='applications', verbose_name="Пользователь")
    assigned_volunteer = models.ForeignKey('Volunteer', on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='assigned_cases', verbose_name="Назначенный волонтёр")
    full_name = models.CharField(max_length=255, verbose_name="ФИО")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    email = models.EmailField(verbose_name="Email", blank=True, null=True)
    help_type = models.CharField(max_length=100, verbose_name="Тип помощи")
    description = models.TextField(verbose_name="Описание ситуации")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    admin_note = models.TextField(blank=True, verbose_name="Заметка специалиста")
    application_number = models.CharField(max_length=20, unique=True, blank=True, verbose_name="Номер заявки")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата подачи")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата обновления")

    class Meta:
        verbose_name = "Заявка"
        verbose_name_plural = "Заявки"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application_number} — {self.full_name}"

    def save(self, *args, **kwargs):
        if not self.application_number:
            import time
            self.application_number = f"Q-{int(time.time() * 1000) % 1000000:06d}"
        super().save(*args, **kwargs)


class Volunteer(models.Model):
    ROLE_CHOICES = [
        ('psychologist', 'Психолог'),
        ('lawyer', 'Юрист'),
        ('digital', 'Цифровой волонтёр'),
        ('social', 'Социальный волонтёр'),
        ('other', 'Другое'),
    ]
    STATUS_CHOICES = [
        ('new', 'Новый'),
        ('active', 'Активный'),
        ('inactive', 'Неактивный'),
    ]

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True,
                                related_name='volunteer_profile', verbose_name="Пользователь")
    name = models.CharField(max_length=255, verbose_name="Имя")
    phone = models.CharField(max_length=20, verbose_name="Телефон")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='social', verbose_name="Направление")
    about = models.TextField(verbose_name="О себе", blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="Статус")
    cases_count = models.PositiveIntegerField(default=0, verbose_name="Завершено дел")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата регистрации")

    class Meta:
        verbose_name = "Волонтер"
        verbose_name_plural = "Волонтеры"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class NewsItem(models.Model):
    CATEGORY_CHOICES = [
        ('news', 'Новости'),
        ('announcement', 'Объявление'),
        ('law', 'Законодательство'),
        ('event', 'Мероприятие'),
    ]

    title_ru = models.CharField(max_length=300, verbose_name="Заголовок (RU)")
    title_kz = models.CharField(max_length=300, verbose_name="Заголовок (KZ)")
    body_ru = models.TextField(verbose_name="Текст (RU)")
    body_kz = models.TextField(verbose_name="Текст (KZ)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='news', verbose_name="Категория")
    source_url = models.URLField(blank=True, verbose_name="Ссылка на источник")
    is_published = models.BooleanField(default=True, verbose_name="Опубликовано")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата публикации")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Новость"
        verbose_name_plural = "Новости"
        ordering = ['-created_at']

    def __str__(self):
        return self.title_ru[:80]
