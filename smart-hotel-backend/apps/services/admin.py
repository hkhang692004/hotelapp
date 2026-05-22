from django.contrib import admin

from apps.services.models import Service, ServiceCategory, ServiceOrder, ServiceOrderItem


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'unit', 'is_active')


class ServiceOrderItemInline(admin.TabularInline):
    model = ServiceOrderItem
    extra = 0


@admin.register(ServiceOrder)
class ServiceOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'customer', 'status', 'total_amount')
    inlines = [ServiceOrderItemInline]
