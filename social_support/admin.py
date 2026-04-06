from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html, mark_safe
from django.db.models import Count, Q
from .models import BenefitCategory, Benefit, Application, Volunteer, UserProfile, NewsItem


# ──────────────────────────────────────────────
#  Custom User Admin (with Profile + Applications inline)
# ──────────────────────────────────────────────

class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    fk_name = 'user'
    readonly_fields = ('application_number', 'help_type', 'status_badge_inline', 'created_at')
    fields = ('application_number', 'help_type', 'status_badge_inline', 'created_at')
    can_delete = False
    show_change_link = True
    verbose_name = "Заявка"
    verbose_name_plural = "Заявки пользователя"

    def status_badge_inline(self, obj):
        return format_html(
            '<span class="badge-status badge-{}">{}</span>',
            obj.status, obj.get_status_display()
        )
    status_badge_inline.short_description = "Статус"


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Профиль"
    extra = 0
    fields = ('phone', 'iin', 'address', 'language', 'avatar_color')


class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline, ApplicationInline]
    list_display = ('username', 'email', 'get_full_name', 'get_phone', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff')

    def get_full_name(self, obj):
        return obj.get_full_name() or '—'
    get_full_name.short_description = "ФИО"

    def get_phone(self, obj):
        try:
            return obj.profile.phone or '—'
        except Exception:
            return '—'
    get_phone.short_description = "Телефон"


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)


# ──────────────────────────────────────────────
#  UserProfile
# ──────────────────────────────────────────────

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'get_username', 'phone', 'iin', 'language', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'user__email', 'phone', 'iin')
    list_filter = ('language',)
    readonly_fields = ('created_at',)

    fieldsets = (
        ('Основная информация', {'fields': ('user', 'phone', 'iin', 'address')}),
        ('Настройки', {'fields': ('language', 'avatar_color')}),
        ('Системное', {'fields': ('created_at',), 'classes': ('collapse',)}),
    )

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username
    get_full_name.short_description = "Имя"
    get_full_name.admin_order_field = 'user__first_name'

    def get_username(self, obj):
        return obj.user.username
    get_username.short_description = "Username"


# ──────────────────────────────────────────────
#  Benefits
# ──────────────────────────────────────────────

@admin.register(BenefitCategory)
class BenefitCategoryAdmin(admin.ModelAdmin):
    list_display = ('title_ru', 'title_kz', 'slug', 'benefits_count')
    prepopulated_fields = {'slug': ('title_ru',)}

    def benefits_count(self, obj):
        count = obj.benefits.count()
        return format_html('<span style="font-weight:700;color:#2563eb">{}</span>', count)
    benefits_count.short_description = "Льгот"


@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ('title_ru', 'category', 'badge_ru', 'icon', 'source_link')
    list_filter = ('category',)
    search_fields = ('title_ru', 'title_kz', 'short_desc_ru')
    fieldsets = (
        ('Категория и значок', {'fields': ('category', 'icon', 'badge_ru', 'badge_kz')}),
        ('Название', {'fields': ('title_ru', 'title_kz')}),
        ('Описание', {'fields': ('short_desc_ru', 'short_desc_kz')}),
        ('Размер помощи', {'fields': ('amount_ru', 'amount_kz')}),
        ('Кому положено', {'fields': ('who_ru', 'who_kz')}),
        ('Документы', {'fields': ('docs_ru', 'docs_kz')}),
        ('Как получить', {'fields': ('how_ru', 'how_kz')}),
        ('Источник', {'fields': ('source',), 'classes': ('collapse',)}),
    )

    def source_link(self, obj):
        if obj.source:
            return format_html('<a href="{}" target="_blank" class="badge-role">🔗 Перейти</a>', obj.source)
        return mark_safe('<span class="badge-empty">—</span>')
    source_link.short_description = "Сайт/Источник"


# ──────────────────────────────────────────────
#  Applications — Actions
# ──────────────────────────────────────────────

@admin.action(description="Взять в обработку")
def mark_processing(modeladmin, request, queryset):
    queryset.update(status='processing')

@admin.action(description="Назначить специалиста")
def mark_assigned(modeladmin, request, queryset):
    queryset.update(status='assigned')

@admin.action(description="Отметить завершёнными")
def mark_done(modeladmin, request, queryset):
    queryset.update(status='done')

@admin.action(description="Отклонить")
def mark_rejected(modeladmin, request, queryset):
    queryset.update(status='rejected')


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('application_number', 'full_name', 'help_type', 'status_badge', 'phone', 'volunteer_badge', 'created_at')
    list_filter = ('status', 'help_type', 'created_at')
    search_fields = ('full_name', 'phone', 'email', 'application_number')
    readonly_fields = ('application_number', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    actions = [mark_processing, mark_assigned, mark_done, mark_rejected]

    fieldsets = (
        ('Заявка', {'fields': ('application_number', 'status', 'assigned_volunteer', 'admin_note')}),
        ('Заявитель', {'fields': ('user', 'full_name', 'phone', 'email')}),
        ('Детали', {'fields': ('help_type', 'description')}),
        ('Даты', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def status_badge(self, obj):
        return format_html(
            '<span class="badge-status badge-{}">{}</span>',
            obj.status, obj.get_status_display()
        )
    status_badge.short_description = "Статус"
    status_badge.admin_order_field = 'status'

    def volunteer_badge(self, obj):
        if obj.assigned_volunteer:
            return format_html(
                '<span class="badge-role">👤 {}</span>',
                obj.assigned_volunteer.name[:20]
            )
        return mark_safe('<span class="badge-empty">— Нет —</span>')
    volunteer_badge.short_description = "Волонтер"


# ──────────────────────────────────────────────
#  Volunteers — Actions
# ──────────────────────────────────────────────

@admin.action(description="Одобрить (сделать активными)")
def approve_vols(modeladmin, request, queryset):
    queryset.update(status='active')

@admin.action(description="Деактивировать")
def deactivate_vols(modeladmin, request, queryset):
    queryset.update(status='inactive')


@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ('name', 'role_badge', 'status_badge', 'phone', 'cases_count', 'created_at')
    list_filter = ('status', 'role')
    search_fields = ('name', 'phone')
    readonly_fields = ('created_at', 'cases_count')
    actions = [approve_vols, deactivate_vols]

    fieldsets = (
        ('Волонтёр', {'fields': ('user', 'name', 'phone', 'role', 'status')}),
        ('О себе', {'fields': ('about',)}),
        ('Статистика', {'fields': ('cases_count', 'created_at'), 'classes': ('collapse',)}),
    )

    def status_badge(self, obj):
        return format_html(
            '<span class="badge-status badge-{}">{}</span>',
            obj.status, obj.get_status_display()
        )
    status_badge.short_description = "Статус"

    def role_badge(self, obj):
        icons = {
            'psychologist': '🧠', 'lawyer': '⚖️',
            'digital': '💻', 'social': '🤝', 'other': '⭐'
        }
        icon = icons.get(obj.role, '⭐')
        return format_html('<span class="badge-role">{} {}</span>', icon, obj.get_role_display())
    role_badge.short_description = "Специализация"


# ──────────────────────────────────────────────
#  News
# ──────────────────────────────────────────────

@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ('title_ru_short', 'category_badge', 'is_published', 'created_at')
    list_filter = ('category', 'is_published', 'created_at')
    search_fields = ('title_ru', 'title_kz', 'body_ru')
    list_editable = ('is_published',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'

    fieldsets = (
        ('Заголовок', {'fields': ('title_ru', 'title_kz', 'category', 'is_published')}),
        ('Содержание', {'fields': ('body_ru', 'body_kz')}),
        ('Источник', {'fields': ('source_url',)}),
        ('Даты', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def title_ru_short(self, obj):
        return obj.title_ru[:60] + ('…' if len(obj.title_ru) > 60 else '')
    title_ru_short.short_description = "Заголовок"

    def category_badge(self, obj):
        badge_classes = {
            'news': 'badge-processing', 'announcement': 'badge-pending',
            'law': 'badge-assigned', 'event': 'badge-done'
        }
        cls = badge_classes.get(obj.category, 'badge-secondary')
        return format_html(
            '<span class="badge-status {}">{}</span>',
            cls, obj.get_category_display()
        )
    category_badge.short_description = "Тип контента"
