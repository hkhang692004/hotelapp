from django.contrib import admin

from apps.housekeeping.models import HousekeepingLog, HousekeepingTask


class HousekeepingLogInline(admin.TabularInline):
    model = HousekeepingLog
    extra = 0


@admin.register(HousekeepingTask)
class HousekeepingTaskAdmin(admin.ModelAdmin):
    list_display = ('room', 'assigned_to', 'status', 'priority', 'task_type')
    list_filter = ('status', 'priority')
    inlines = [HousekeepingLogInline]
