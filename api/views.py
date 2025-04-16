from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Organization, Program, ACO, Saving, Workshop
from .serializers import (UserSerializer, OrganizationSerializer, OrganizationDetailSerializer,
                          ProgramSerializer, ACOSerializer, SavingSerializer, WorkshopSerializer )

# Create your views here.

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OrganizationDetailSerializer
        return OrganizationSerializer


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]


class ACOViewSet(viewsets.ModelViewSet):
    queryset = ACO.objects.all()
    serializer_class = ACOSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ACO.objects.all()
        org_id = self.request.query_params.get('organization', None)
        if org_id:
            queryset = queryset.filter(organization_id=org_id)

        return queryset


class SavingViewSet(viewsets.ModelViewSet):
    queryset = Saving.objects.all()
    serializer_class = SavingSerializer
    permission_classes = [IsAuthenticated]


class WorkshopViewSet(viewsets.ModelViewSet):
    queryset = Workshop.objects.all()
    serializer_class = WorkshopSerializer
    permission_classes = [IsAuthenticated]