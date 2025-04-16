from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Organization(models.Model):
    name = models.CharField(max_length=255)
    hq_address = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Program(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ACO(models.Model):
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='acos')
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name='acos')
    projected_savings = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    score= models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Saving(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='savings')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.organization.name} - ${self.amount}  ({self.year})"


class Workshop(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='workshops')
    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title