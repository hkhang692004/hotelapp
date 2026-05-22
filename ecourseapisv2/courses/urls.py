from django.urls import path, include
from rest_framework.routers import DefaultRouter
from courses import views

r = DefaultRouter()
r.register('categories', views.CategoryViewSet, 'category')
r.register('courses', views.CourseViewSet, 'course')
r.register('lessons', views.LessonViewSet, 'lesson')
r.register('users', views.UserViewSet, 'user')
r.register('comments', views.CommentViewSet, 'comment')

urlpatterns = [
    path('', include(r.urls)),
]