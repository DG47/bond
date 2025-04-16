from rest_framework import serializers
from .models import Organization, Program, ACO, Saving, Workshop
from django.contrib.auth.models import  User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}


class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'


class ACOSerializer(serializers.ModelSerializer):
    class Meta:
        model = ACO
        fields = ['id', 'name', 'organization', 'program', 'program_name', 'projected_savings',
                  'score', 'created_at', 'updated_at']



class SavingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Saving
        fields = '__all__'


class WorkshopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workshop
        fields = '__all__'


class OrganizationSerializer(serializers.ModelSerializer):
    acos_count = serializers.SerializerMethodField()
    total_savings = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'hq_address', 'created_at', 'updated_at', 'acos_count', 'total_savings']


    def get_acos_count(self, obj):
        return obj.acos.count()

    def get_total_savings(self, obj):
        return sum(saving.amount for saving in obj.savings.all())



class OrganizationDetailSerializer(serializers.ModelSerializer):
    acos = ACOSerializer(many=True, read_only=True)
    savings = SavingSerializer(many=True, read_only=True)
    workshops = WorkshopSerializer(many=True, read_only=True)

    class Meta(OrganizationSerializer.Meta):
        fields = OrganizationSerializer.Meta.fields + ['acos', 'savings', 'workshops']
