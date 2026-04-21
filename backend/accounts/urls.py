from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from .views import UtilisateurViewSet, EnseignantViewSet, EtudiantViewSet, ParentViewSet, MeView

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'enseignants', EnseignantViewSet)
router.register(r'etudiants', EtudiantViewSet)
router.register(r'parents', ParentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/token/',         TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('auth/token/verify/',  TokenVerifyView.as_view(),      name='token_verify'),
    path('auth/me/',            MeView.as_view(),               name='me'),
]
