from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (login_view, OrganizationViewSet, ProgramViewSet, ACOViewSet,
                    SavingViewSet, WorkshopViewSet)

router = DefaultRouter()
router.register('organizations', OrganizationViewSet)
router.register('programs', ProgramViewSet)
router.register('acos', ACOViewSet)
router.register('savings', SavingViewSet)
router.register('workshops', WorkshopViewSet)

urlpatterns = [
    path('login', login_view, name='login'),
    path('', include(router.urls)),
]
