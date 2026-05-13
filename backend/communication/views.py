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
    
    def perform_create(self, serializer):
        serializer.save(expediteur=self.request.user)
    
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
            return Reclamation.objects.filter(expediteur=user)
        elif user.is_parent():
            enfants_ids = user.profil_parent.enfants.values_list('utilisateur_id', flat=True)
            return Reclamation.objects.filter(expediteur_id__in=enfants_ids)
        elif user.is_admin():
            return Reclamation.objects.all()
        return Reclamation.objects.none()
class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_admin():
            return Notification.objects.all()
        return Notification.objects.filter(destinataire=user)
