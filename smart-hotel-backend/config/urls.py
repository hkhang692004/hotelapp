from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-v1'),
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.rooms.urls')),
    path('api/v1/', include('apps.bookings.urls')),
    path('api/v1/', include('apps.payments.urls')),
    path('api/v1/', include('apps.services.urls')),
    path('api/v1/', include('apps.housekeeping.urls')),
    path('api/v1/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
