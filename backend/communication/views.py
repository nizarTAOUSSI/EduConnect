from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Reclamation, Notification
from .serializers import ReclamationSerializer, NotificationSerializer

class ReclamationViewSet(viewsets.ModelViewSet):
    queryset = Reclamation.objects.all()
    serializer_class = ReclamationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['expediteur', 'destinataire', 'statut']

    def get_queryset(self):
        user = self.request.user
        if user.is_enseignant():
            teacher = getattr(user, 'profil_enseignant', None)
            if teacher is None:
                return Reclamation.objects.none()
            teacher_classes = teacher.get_classes()
            return Reclamation.objects.filter(
                destinataire=user,
                expediteur__profil_etudiant__classe__in=teacher_classes,
            )
        elif user.is_etudiant():
            # Students see reclamations they sent
            return Reclamation.objects.filter(expediteur=user)
        elif user.is_parent():
            # Parents see reclamations from their children
            enfants_ids = user.profil_parent.enfants.values_list('utilisateur_id', flat=True)
            return Reclamation.objects.filter(expediteur_id__in=enfants_ids)
        elif user.is_admin():
            # Admins see all reclamations
            return Reclamation.objects.all()
        return Reclamation.objects.none()

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(destinataire=self.request.user)