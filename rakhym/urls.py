"""
URL configuration for rakhym project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from django.http import HttpResponse, FileResponse
import os


def serve_html(request, filename='index.html'):
    """Serve static HTML files from project root."""
    file_path = os.path.join(settings.BASE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'), content_type='text/html')
    return HttpResponse('Not Found', status=404)


def serve_root(request):
    return serve_html(request, 'index.html')


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API
    path('api/', include('social_support.urls')),

    # HTML Pages
    path('', serve_root),
    path('index.html', lambda req: serve_html(req, 'index.html')),
    path('benefit.html', lambda req: serve_html(req, 'benefit.html')),
    path('profile.html', lambda req: serve_html(req, 'profile.html')),

    # Static files (JS, CSS, images, etc.)
    re_path(r'^(?P<path>.+\.(js|css|png|jpg|svg|ico|woff2?|ttf|eot))$',
            serve, {'document_root': settings.BASE_DIR}),
]
