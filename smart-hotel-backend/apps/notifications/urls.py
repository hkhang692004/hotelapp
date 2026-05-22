from django.urls import path

from apps.notifications.views.v1 import NotificationListView, NotificationReadAllView, NotificationReadView

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/read-all/', NotificationReadAllView.as_view(), name='notification-read-all'),
    path('notifications/<uuid:pk>/read/', NotificationReadView.as_view(), name='notification-read'),
]
