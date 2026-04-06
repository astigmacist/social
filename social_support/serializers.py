from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Benefit, BenefitCategory, Application, Volunteer, UserProfile, NewsItem


# ──────────────────────────────────────────────
#  Auth / User
# ──────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'iin', 'address', 'language', 'avatar_color']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    is_volunteer = serializers.SerializerMethodField()
    volunteer_role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'profile', 'is_volunteer', 'volunteer_role']
        read_only_fields = ['id', 'username']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_is_volunteer(self, obj):
        return hasattr(obj, 'volunteer_profile') and obj.volunteer_profile is not None

    def get_volunteer_role(self, obj):
        if hasattr(obj, 'volunteer_profile') and obj.volunteer_profile:
            return obj.volunteer_profile.role
        return None


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value

    def create(self, validated_data):
        name = validated_data['name']
        parts = name.strip().split(' ', 2)
        first_name = parts[0] if len(parts) > 0 else ''
        last_name = parts[1] if len(parts) > 1 else ''

        digits = ''.join(filter(str.isdigit, validated_data['phone']))
        username = f"u{digits[-10:]}" if digits else f"user_{User.objects.count()}"
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
        )

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.phone = validated_data['phone']
        profile.save()
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    iin = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    language = serializers.ChoiceField(choices=['ru', 'kz'], required=False)


# ──────────────────────────────────────────────
#  Benefits
# ──────────────────────────────────────────────

class BenefitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BenefitCategory
        fields = ['id', 'title_ru', 'title_kz', 'slug']


class BenefitSerializer(serializers.ModelSerializer):
    category_slug = serializers.ReadOnlyField(source='category.slug')
    category_ru = serializers.ReadOnlyField(source='category.title_ru')
    category_kz = serializers.ReadOnlyField(source='category.title_kz')

    class Meta:
        model = Benefit
        fields = '__all__'


# ──────────────────────────────────────────────
#  Applications
# ──────────────────────────────────────────────

class ApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['full_name', 'phone', 'email', 'help_type', 'description']


class ApplicationDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField()
    assigned_volunteer_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'application_number', 'full_name', 'phone', 'email',
            'help_type', 'description', 'status', 'status_display',
            'admin_note', 'assigned_volunteer_name', 'created_at', 'updated_at'
        ]

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_assigned_volunteer_name(self, obj):
        if obj.assigned_volunteer:
            return obj.assigned_volunteer.name
        return None


# ──────────────────────────────────────────────
#  Volunteers
# ──────────────────────────────────────────────

class VolunteerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = ['name', 'phone', 'role', 'about']


class VolunteerDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    assigned_cases_count = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = ['id', 'name', 'phone', 'role', 'role_display', 'about',
                  'status', 'status_display', 'cases_count', 'assigned_cases_count', 'created_at']

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_role_display(self, obj):
        return obj.get_role_display()

    def get_assigned_cases_count(self, obj):
        return obj.assigned_cases.count()


class VolunteerCaseSerializer(serializers.ModelSerializer):
    """Serializer for volunteer to see their assigned cases."""
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ['id', 'application_number', 'full_name', 'phone',
                  'help_type', 'description', 'status', 'status_display',
                  'admin_note', 'created_at']

    def get_status_display(self, obj):
        return obj.get_status_display()


# ──────────────────────────────────────────────
#  News
# ──────────────────────────────────────────────

class NewsItemSerializer(serializers.ModelSerializer):
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = NewsItem
        fields = ['id', 'title_ru', 'title_kz', 'body_ru', 'body_kz',
                  'category', 'category_display', 'source_url', 'created_at']

    def get_category_display(self, obj):
        return obj.get_category_display()
