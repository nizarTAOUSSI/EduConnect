from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReclamationViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'reclamations', ReclamationViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]