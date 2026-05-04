from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import Utilisateur, Enseignant, Etudiant, Parent
from .serializers import (
    UtilisateurCreateSerializer,
    UtilisateurSerializer,
    EnseignantSerializer,
    EtudiantSerializer,
    ParentSerializer,
)

@extend_schema_view(
    create=extend_schema(request=UtilisateurCreateSerializer, responses=UtilisateurSerializer),
)
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.select_related(
        'profil_enseignant', 'profil_etudiant', 'profil_parent'
    ).prefetch_related(
        'profil_parent__enfants__utilisateur'
    ).all()
    serializer_class = UtilisateurSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return UtilisateurCreateSerializer
        return UtilisateurSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.select_related('utilisateur').all()
    serializer_class = EnseignantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['utilisateur']

    def get_permissions(self):
        return [IsAuthenticated()]

class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.select_related('utilisateur', 'classe').all()
    serializer_class = EtudiantSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['utilisateur', 'classe']

    def get_permissions(self):
        return [IsAuthenticated()]

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.prefetch_related('enfants__utilisateur', 'enfants__classe').all()
    serializer_class = ParentSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

class MeView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)