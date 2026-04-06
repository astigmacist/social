from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BenefitViewSet, BenefitCategoryListView,
    ApplicationCreateView, MyApplicationsView, ApplicationDetailView,
    VolunteerCreateView, MyVolunteerView, VolunteerCasesView,
    VolunteerUpdateCaseView, VolunteersListView,
    NewsListView, StatsView,
)
from .auth_views import RegisterView, LoginView, LogoutView, MeView, RefreshTokenView

router = DefaultRouter()
router.register(r'benefits', BenefitViewSet, basename='benefit')

urlpatterns = [
    # Benefits (public)
    path('', include(router.urls)),
    path('categories/', BenefitCategoryListView.as_view(), name='category-list'),

    # Applications
    path('apply/', ApplicationCreateView.as_view(), name='application-create'),
    path('my/applications/', MyApplicationsView.as_view(), name='my-applications'),
    path('my/applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),

    # Volunteers
    path('volunteer/', VolunteerCreateView.as_view(), name='volunteer-create'),
    path('volunteers/', VolunteersListView.as_view(), name='volunteer-list'),
    path('my/volunteer/', MyVolunteerView.as_view(), name='my-volunteer'),
    path('my/cases/', VolunteerCasesView.as_view(), name='my-cases'),
    path('my/cases/<int:pk>/', VolunteerUpdateCaseView.as_view(), name='case-update'),

    # News
    path('news/', NewsListView.as_view(), name='news-list'),

    # Stats
    path('stats/', StatsView.as_view(), name='stats'),

    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
]
