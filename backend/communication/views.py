from rest_framework import viewsets
from .models import Reclamation, Notification
from .serializers import ReclamationSerializer, NotificationSerializer

class ReclamationViewSet(viewsets.ModelViewSet):
    queryset = Reclamation.objects.all()
    serializer_class = ReclamationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
