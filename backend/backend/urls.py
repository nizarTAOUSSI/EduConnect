
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Admin Django
    path('admin/', admin.site.urls),

    # OpenAPI schema (JSON/YAML)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI  →  http://127.0.0.1:8000/api/docs/
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # ReDoc       →  http://127.0.0.1:8000/api/redoc/
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # App routers
    path('api/accounts/',       include('accounts.urls')),
    path('api/academics/',      include('academics.urls')),
    path('api/grades/',         include('grades.urls')),
    path('api/reports/',        include('reports.urls')),
    path('api/communication/',  include('communication.urls')),
]
