
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.contrib.admin.views.decorators import staff_member_required
from django.conf import settings
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

schema_view = SpectacularAPIView.as_view()
swagger_view = SpectacularSwaggerView.as_view(url_name='schema')
redoc_view = SpectacularRedocView.as_view(url_name='schema')

if not settings.DEBUG:
    schema_view = staff_member_required(schema_view)
    swagger_view = staff_member_required(swagger_view)
    redoc_view = staff_member_required(redoc_view)

urlpatterns = [
    # Root → Swagger UI (staff login required)
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),

    # Admin Django
    path('admin/', admin.site.urls),

    # OpenAPI schema
    path('api/schema/', schema_view, name='schema'),

    # Swagger UI  →  /api/docs/
    path('api/docs/', swagger_view, name='swagger-ui'),

    # ReDoc       →  /api/redoc/
    path('api/redoc/', redoc_view, name='redoc'),

    # App routers
    path('api/accounts/',       include('accounts.urls')),
    path('api/academics/',      include('academics.urls')),
    path('api/grades/',         include('grades.urls')),
    path('api/reports/',        include('reports.urls')),
    path('api/communication/',  include('communication.urls')),
]
