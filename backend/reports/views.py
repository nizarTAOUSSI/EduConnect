from rest_framework import viewsets
from .models import Bulletin
from .serializers import BulletinSerializer

class BulletinViewSet(viewsets.ModelViewSet):
    queryset = Bulletin.objects.all()
    serializer_class = BulletinSerializer
