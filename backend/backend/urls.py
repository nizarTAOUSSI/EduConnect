
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

from rest_framework.routers import DefaultRouter
from accounts.views import UtilisateurViewSet, EnseignantViewSet, EtudiantViewSet, ParentViewSet
from academics.views import (
    PeriodeViewSet, MatiereViewSet, ClasseViewSet, 
    EnseignantMatiereViewSet, AbsenceViewSet, SeanceViewSet, SalleViewSet
)
from grades.views import EvaluationViewSet, NoteViewSet
from communication.views import ReclamationViewSet, NotificationViewSet
from reports.views import BulletinViewSet

router = DefaultRouter()
# Accounts
router.register(r'accounts/utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'accounts/enseignants', EnseignantViewSet, basename='enseignant')
router.register(r'accounts/etudiants', EtudiantViewSet, basename='etudiant')
router.register(r'accounts/parents', ParentViewSet, basename='parent')
# Academics
router.register(r'academics/salles', SalleViewSet, basename='salle')
router.register(r'academics/periodes', PeriodeViewSet, basename='periode')
router.register(r'academics/matieres', MatiereViewSet, basename='matiere')
router.register(r'academics/classes', ClasseViewSet, basename='classe')
router.register(r'academics/enseignant-matieres', EnseignantMatiereViewSet, basename='enseignantmatiere')
router.register(r'academics/absences', AbsenceViewSet, basename='absence')
router.register(r'academics/seances', SeanceViewSet, basename='seance')
# Grades
router.register(r'grades/evaluations', EvaluationViewSet, basename='evaluation')
router.register(r'grades/notes', NoteViewSet, basename='note')
# Communication
router.register(r'communication/reclamations', ReclamationViewSet, basename='reclamation')
router.register(r'communication/notifications', NotificationViewSet, basename='notification')
# Reports
router.register(r'reports/bulletins', BulletinViewSet, basename='bulletin')

urlpatterns = [

    path('', RedirectView.as_view(url='/api/docs/', permanent=False)),

    path('admin/', admin.site.urls),

    path('api/schema/', schema_view, name='schema'),

    path('api/docs/', swagger_view, name='swagger-ui'),

    path('api/redoc/', redoc_view, name='redoc'),

    path('api/', include(router.urls)),
    path('api/accounts/',       include('accounts.urls')),
]