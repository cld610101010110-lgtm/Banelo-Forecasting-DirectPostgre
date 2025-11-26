"""
REST API URL Configuration for Dashboard App
Provides RESTful endpoints for CRUD operations
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import (
    ProductViewSet,
    RecipeViewSet,
    SaleViewSet,
    WasteLogViewSet,
    AuditTrailViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='api-product')
router.register(r'recipes', RecipeViewSet, basename='api-recipe')
router.register(r'sales', SaleViewSet, basename='api-sale')
router.register(r'waste', WasteLogViewSet, basename='api-waste')
router.register(r'audit', AuditTrailViewSet, basename='api-audit')

# URL patterns
urlpatterns = [
    # DRF Router URLs - provides standard REST endpoints:
    # GET    /api/v1/products/              - List all products
    # POST   /api/v1/products/              - Create product
    # GET    /api/v1/products/:id/          - Get product details
    # PUT    /api/v1/products/:id/          - Update product
    # DELETE /api/v1/products/:id/          - Delete product
    # POST   /api/v1/products/:id/transfer/ - Transfer inventory A→B
    #
    # GET    /api/v1/recipes/               - List all recipes
    # POST   /api/v1/recipes/               - Create recipe
    # GET    /api/v1/recipes/:id/           - Get recipe details
    # PUT    /api/v1/recipes/:id/           - Update recipe
    # DELETE /api/v1/recipes/:id/           - Delete recipe
    #
    # GET    /api/v1/sales/                 - List all sales
    # GET    /api/v1/sales/:id/             - Get sale details
    #
    # GET    /api/v1/waste/                 - List waste logs
    # POST   /api/v1/waste/                 - Create waste log
    #
    # GET    /api/v1/audit/                 - List audit logs
    path('', include(router.urls)),
]
