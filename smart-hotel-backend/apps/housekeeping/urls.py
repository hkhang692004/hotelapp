from django.urls import path

from apps.housekeeping.views.v1 import (
    HousekeepingHistoryView,
    HousekeepingTaskAssignView,
    HousekeepingTaskDetailView,
    HousekeepingTaskListCreateView,
    HousekeepingTaskLogView,
)

urlpatterns = [
    path('housekeeping/tasks/', HousekeepingTaskListCreateView.as_view(), name='hk-task-list'),
    path('housekeeping/tasks/<uuid:pk>/', HousekeepingTaskDetailView.as_view(), name='hk-task-detail'),
    path('housekeeping/tasks/<uuid:pk>/assign/', HousekeepingTaskAssignView.as_view(), name='hk-task-assign'),
    path('housekeeping/tasks/<uuid:pk>/logs/', HousekeepingTaskLogView.as_view(), name='hk-task-logs'),
    path('housekeeping/history/', HousekeepingHistoryView.as_view(), name='hk-history'),
]
