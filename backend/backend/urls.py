
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.contrib.admin.views.decorators import staff_member_required
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Root → Swagger UI (staff login required)
    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),

    # Admin Django
    path('admin/', admin.site.urls),

    # OpenAPI schema — protected: only staff can download the raw JSON
    path('api/schema/', staff_member_required(SpectacularAPIView.as_view()), name='schema'),

    # Swagger UI  →  /api/docs/  (staff login required)
    path('api/docs/', staff_member_required(SpectacularSwaggerView.as_view(url_name='schema')), name='swagger-ui'),

    # ReDoc       →  /api/redoc/  (staff login required)
    path('api/redoc/', staff_member_required(SpectacularRedocView.as_view(url_name='schema')), name='redoc'),

    # App routers
    path('api/accounts/',       include('accounts.urls')),
    path('api/academics/',      include('academics.urls')),
    path('api/grades/',         include('grades.urls')),
    path('api/reports/',        include('reports.urls')),
    path('api/communication/',  include('communication.urls')),
]
