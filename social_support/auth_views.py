from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import UserProfile
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, UpdateProfileSerializer
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'message': 'Регистрация прошла успешно.',
            'tokens': tokens,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        login_val = serializer.validated_data['login']
        password = serializer.validated_data['password']

        user = None
        # Try email
        if '@' in login_val:
            try:
                u = User.objects.get(email=login_val)
                user = authenticate(request, username=u.username, password=password)
            except User.DoesNotExist:
                pass
        # Try phone (stored in profile)
        if user is None:
            digits = ''.join(filter(str.isdigit, login_val))
            try:
                profile = UserProfile.objects.get(phone__icontains=digits[-10:])
                user = authenticate(request, username=profile.user.username, password=password)
            except UserProfile.DoesNotExist:
                pass
        # Try username directly
        if user is None:
            user = authenticate(request, username=login_val, password=password)

        if user is None:
            return Response({'error': 'Неверный логин или пароль.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Аккаунт заблокирован.'}, status=status.HTTP_403_FORBIDDEN)

        tokens = get_tokens_for_user(user)
        return Response({
            'tokens': tokens,
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass
        return Response({'message': 'Вы вышли из системы.'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = request.user

        # Update User fields
        for field in ['first_name', 'last_name', 'email']:
            if field in data:
                setattr(user, field, data[field])
        user.save()

        # Update Profile fields
        profile, _ = UserProfile.objects.get_or_create(user=user)
        for field in ['phone', 'iin', 'address', 'language']:
            if field in data:
                setattr(profile, field, data[field])
        profile.save()

        return Response({
            'message': 'Профиль обновлён.',
            'user': UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token),
            })
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
