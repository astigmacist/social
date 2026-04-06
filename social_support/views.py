from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Benefit, BenefitCategory, Application, Volunteer, NewsItem
from .serializers import (
    BenefitSerializer, BenefitCategorySerializer,
    ApplicationCreateSerializer, ApplicationDetailSerializer,
    VolunteerCreateSerializer, VolunteerDetailSerializer, VolunteerCaseSerializer,
    NewsItemSerializer,
)


# ──────────────────────────────────────────────
#  Benefits (public)
# ──────────────────────────────────────────────

class BenefitViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BenefitSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        category = self.request.query_params.get('category')
        if category and category != 'all':
            return Benefit.objects.filter(category__slug=category)
        return Benefit.objects.all()


class BenefitCategoryListView(generics.ListAPIView):
    queryset = BenefitCategory.objects.all()
    serializer_class = BenefitCategorySerializer
    permission_classes = [AllowAny]


# ──────────────────────────────────────────────
#  Applications
# ──────────────────────────────────────────────

class ApplicationCreateView(generics.CreateAPIView):
    serializer_class = ApplicationCreateSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        return serializer.save(user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        return Response(ApplicationDetailSerializer(instance).data, status=status.HTTP_201_CREATED)


class MyApplicationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        apps = Application.objects.filter(user=request.user)
        return Response(ApplicationDetailSerializer(apps, many=True).data)


class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, user=request.user)
        except Application.DoesNotExist:
            return Response({'error': 'Заявка не найдена.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ApplicationDetailSerializer(app).data)


# ──────────────────────────────────────────────
#  Volunteers
# ──────────────────────────────────────────────

class VolunteerCreateView(generics.CreateAPIView):
    serializer_class = VolunteerCreateSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({'message': 'Заявка волонтёра принята. Мы свяжемся с вами.'}, status=status.HTTP_201_CREATED)


class MyVolunteerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vol = Volunteer.objects.get(user=request.user)
            return Response(VolunteerDetailSerializer(vol).data)
        except Volunteer.DoesNotExist:
            return Response({'detail': 'not_found'}, status=status.HTTP_404_NOT_FOUND)


class VolunteerCasesView(APIView):
    """Get cases assigned to the authenticated volunteer."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            vol = Volunteer.objects.get(user=request.user)
        except Volunteer.DoesNotExist:
            return Response({'error': 'Вы не являетесь волонтёром.'}, status=status.HTTP_403_FORBIDDEN)

        if vol.status != 'active':
            return Response({'error': 'Ваш аккаунт волонтёра ещё не одобрен.'}, status=status.HTTP_403_FORBIDDEN)

        cases = Application.objects.filter(assigned_volunteer=vol)
        return Response(VolunteerCaseSerializer(cases, many=True).data)


class VolunteerUpdateCaseView(APIView):
    """Volunteer can update the note/status of their assigned case."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            vol = Volunteer.objects.get(user=request.user, status='active')
        except Volunteer.DoesNotExist:
            return Response({'error': 'Доступ запрещён.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            case = Application.objects.get(pk=pk, assigned_volunteer=vol)
        except Application.DoesNotExist:
            return Response({'error': 'Дело не найдено.'}, status=status.HTTP_404_NOT_FOUND)

        note = request.data.get('admin_note')
        new_status = request.data.get('status')

        if note is not None:
            case.admin_note = note
        if new_status and new_status in ['processing', 'done']:
            case.status = new_status
            if new_status == 'done':
                vol.cases_count += 1
                vol.save()
        case.save()

        return Response(VolunteerCaseSerializer(case).data)


class VolunteersListView(APIView):
    """Public list of active volunteers (for display on site)."""
    permission_classes = [AllowAny]

    def get(self, request):
        role = request.query_params.get('role')
        qs = Volunteer.objects.filter(status='active')
        if role:
            qs = qs.filter(role=role)
        return Response(VolunteerDetailSerializer(qs, many=True).data)


# ──────────────────────────────────────────────
#  News
# ──────────────────────────────────────────────

class NewsListView(generics.ListAPIView):
    serializer_class = NewsItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        limit = int(self.request.query_params.get('limit', 6))
        return NewsItem.objects.filter(is_published=True)[:limit]


# ──────────────────────────────────────────────
#  Stats
# ──────────────────────────────────────────────

class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'total_applications': Application.objects.count(),
            'done_applications': Application.objects.filter(status='done').count(),
            'pending_applications': Application.objects.filter(status='pending').count(),
            'total_volunteers': Volunteer.objects.filter(status='active').count(),
            'total_benefits': Benefit.objects.count(),
            'total_news': NewsItem.objects.filter(is_published=True).count(),
            'volunteers_by_role': {
                role[0]: Volunteer.objects.filter(role=role[0], status='active').count()
                for role in Volunteer.ROLE_CHOICES
            }
        })
