from django.contrib import admin
from django.db.models import Count
from django.template.response import TemplateResponse
from django.utils.safestring import mark_safe
from django.urls import path
from courses.models import Category, Course, Lesson, Tag, Comment, Like, User


class MyCourseAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'active', 'created_date']
    search_fields = ['subject']
    list_filter = ['id', 'subject', 'created_date']
    readonly_fields = ['image_view']

    def image_view(self, course):
        if course.image:
            return mark_safe(f'<img src="{course.image.url}" width="200" />')
        return None

from django import forms
from ckeditor_uploader.widgets import CKEditorUploadingWidget

class LessonForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['content'].required = False

    content = forms.CharField(widget=CKEditorUploadingWidget)
    class Meta:
        model = Lesson
        fields = '__all__'


class MyLessonAdmin(admin.ModelAdmin):
    form = LessonForm


class MyAdminSite(admin.AdminSite):
    site_header = 'eCourseApp'

    def get_urls(self):
        return [
            path('course-stats/', self.course_stats)
        ] + super().get_urls()

    def course_stats(self, request):
        stats = Category.objects.annotate(count=Count('course')).values('id', 'name', 'count')
        return TemplateResponse(request, 'admin/stats.html', {
            'stats': stats
        })

admin_site = MyAdminSite(name='ecourse')

admin_site.register(Category)
admin_site.register(Course, MyCourseAdmin)
admin_site.register(Lesson, MyLessonAdmin)
admin_site.register(Tag)
admin_site.register(Comment)
admin_site.register(Like)
admin_site.register(User)
