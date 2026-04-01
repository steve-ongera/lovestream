"""
lovestream/urls.py – Root URL configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# JWT auth views (Simple JWT)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # Django admin
    path("admin/",  admin.site.urls),

    # JWT token endpoints
    path("api/auth/token/",         TokenObtainPairView.as_view(),  name="token-obtain"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(),     name="token-refresh"),
    path("api/auth/token/verify/",  TokenVerifyView.as_view(),      name="token-verify"),

    # Core application routes
    path("api/", include("core.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)