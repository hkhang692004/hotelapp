from django.contrib import admin
from django.template.response import TemplateResponse
from django.utils.html import mark_safe
from django.urls import path
from courses.models import Category, Course, Lesson, Tag
from django import forms
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django.db.models import Count

class CourseForm(forms.ModelForm):
    def __int__(self, *args, **kwargs):
        super().__int__(*args, **kwargs)
        self.fields['description'].required = False

class CourseAdmin(admin.ModelAdmin):
    list_display = ['id', 'subject', 'active', 'category']
    search_fields = ['subject', 'description']
    list_filter = ['id', 'subject']
    readonly_fields = ['avatar']
    form = CourseForm

    def avatar(self, course):
        return mark_safe(f'<img src="{course.image.url}" width="150" />')

class LessonForm(forms.ModelForm):
  content = forms.CharField(widget=CKEditorUploadingWidget)

  class Meta:
    model = Lesson
    fields = '__all__'

class LessonAdmin(admin.ModelAdmin):
    form = LessonForm


class MyAdminSite(admin.AdminSite):
    site_header = 'eCourseApp'

    def get_urls(self):
        return [
            path('courses-stats/', self.course_stats),
        ] + super().get_urls()

    def course_stats(self, request):
        stats = Category.objects.annotate(c=Count('courses')).values('id', 'name', 'c')
        return TemplateResponse(request, 'admin/stats.html', {
            'stats': stats
        })

admin_site = MyAdminSite()

admin_site.register(Category)
admin_site.register(Course, CourseAdmin)
admin_site.register(Lesson, LessonAdmin)
admin_site.register(Tag)
