from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Utilisateur, Enseignant, Etudiant, Parent
from .serializers import (
    UtilisateurCreateSerializer,
    UtilisateurSerializer,
    EnseignantSerializer,
    EtudiantSerializer,
    ParentSerializer,
)

@extend_schema_view(
   
    create=extend_schema(
        request=UtilisateurCreateSerializer,
        responses=UtilisateurSerializer,
        auth=[],
    ),
)
class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return UtilisateurCreateSerializer
        return UtilisateurSerializer

    def get_permissions(self):
        # Allow anyone to create an account (signup).
        # Everything else stays protected by default.
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

class EnseignantViewSet(viewsets.ModelViewSet):
    queryset = Enseignant.objects.all()
    serializer_class = EnseignantSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

class EtudiantViewSet(viewsets.ModelViewSet):
    queryset = Etudiant.objects.all()
    serializer_class = EtudiantSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

class MeView(APIView):
    """Return the currently authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)
