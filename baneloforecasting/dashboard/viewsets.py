"""
Django REST Framework ViewSets for Dashboard App
Provides comprehensive CRUD operations for all models
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime

from .models import (
    Product, Recipe, RecipeIngredient, Sale, WasteLog,
    AuditTrail, MLPrediction, MLModel
)
from .serializers import (
    ProductSerializer, RecipeSerializer, RecipeIngredientSerializer,
    SaleSerializer, WasteLogSerializer, AuditTrailSerializer,
    MLPredictionSerializer, MLModelSerializer,
    RecipeCreateSerializer, InventoryTransferSerializer,
    WasteCreateSerializer, ProductCreateSerializer, ProductUpdateSerializer
)
from .api_service import get_api_service


def log_audit_action(action, user, details=''):
    """Helper to log audit trail"""
    try:
        AuditTrail.objects.create(
            action=action,
            user_id=str(user.id) if hasattr(user, 'id') else '',
            user_name=user.username if hasattr(user, 'username') else str(user),
            details=details,
            timestamp=datetime.now()
        )
    except Exception as e:
        print(f"Warning: Could not log audit trail: {e}")


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations with dual inventory support
    Supports Inventory A (warehouse) and Inventory B (operational)
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'firebase_id'

    def list(self, request):
        """GET /api/v1/products/ - List all products"""
        try:
            api = get_api_service()
            products = api.get_products()

            return Response({
                'success': True,
                'data': products,
                'count': len(products)
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, firebase_id=None):
        """GET /api/v1/products/:id - Get single product"""
        try:
            product = Product.objects.get(firebase_id=firebase_id)
            serializer = self.get_serializer(product)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """POST /api/v1/products/ - Create new product"""
        try:
            serializer = ProductCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            api = get_api_service()

            # Prepare product data for Node API
            product_data = {
                'name': serializer.validated_data.get('name'),
                'category': serializer.validated_data.get('category'),
                'price': float(serializer.validated_data.get('price', 0)),
                'quantity': float(serializer.validated_data.get('quantity', 0)),
                'inventory_a': float(serializer.validated_data.get('inventoryA', serializer.validated_data.get('quantity', 0))),
                'inventory_b': float(serializer.validated_data.get('inventoryB', 0)),
                'cost_per_unit': float(serializer.validated_data.get('costPerUnit', 0)),
                'unit': serializer.validated_data.get('unit', 'pcs'),
                'image_uri': serializer.validated_data.get('imageUri', ''),
                'description': serializer.validated_data.get('description', ''),
                'sku': serializer.validated_data.get('sku', '')
            }

            result = api.add_product(product_data)

            if result.get('success'):
                log_audit_action('Product Created', request.user, f"Created product: {product_data['name']}")
                return Response({
                    'success': True,
                    'message': f"Product {product_data['name']} created successfully",
                    'data': result.get('data')
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'message': result.get('message', 'Failed to create product')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, firebase_id=None):
        """PUT /api/v1/products/:id - Update product"""
        try:
            api = get_api_service()

            update_data = {
                'firebaseId': firebase_id,
                'name': request.data.get('name'),
                'category': request.data.get('category'),
                'price': float(request.data.get('price', 0)),
                'quantity': float(request.data.get('quantity', 0)),
                'inventory_a': float(request.data.get('inventoryA', 0)),
                'inventory_b': float(request.data.get('inventoryB', 0)),
                'cost_per_unit': float(request.data.get('costPerUnit', 0)),
                'unit': request.data.get('unit', 'pcs'),
                'image_uri': request.data.get('imageUri', ''),
                'description': request.data.get('description', '')
            }

            result = api.update_product(firebase_id, update_data)

            if result.get('success'):
                log_audit_action('Product Updated', request.user, f"Updated product: {update_data['name']}")
                return Response({
                    'success': True,
                    'message': f"Product updated successfully"
                })
            else:
                return Response({
                    'success': False,
                    'message': result.get('message', 'Failed to update product')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, firebase_id=None):
        """DELETE /api/v1/products/:id - Delete product"""
        try:
            product = Product.objects.get(firebase_id=firebase_id)
            product_name = product.name
            product.delete()

            log_audit_action('Product Deleted', request.user, f"Deleted product: {product_name}")

            return Response({
                'success': True,
                'message': f"Product {product_name} deleted successfully"
            })
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='transfer')
    def transfer_inventory(self, request, firebase_id=None):
        """POST /api/v1/products/:id/transfer - Transfer from Inventory A to B"""
        try:
            serializer = InventoryTransferSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            quantity = serializer.validated_data.get('quantity')

            api = get_api_service()
            result = api.transfer_inventory(firebase_id, quantity)

            if result.get('success'):
                log_audit_action(
                    'Inventory Transfer',
                    request.user,
                    f"Transferred {quantity} units from A to B for product {firebase_id}"
                )
                return Response(result)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Recipe CRUD operations with ingredients
    """
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'firebase_id'

    def list(self, request):
        """GET /api/v1/recipes/ - List all recipes with ingredients"""
        try:
            api = get_api_service()
            recipes = api.get_recipes()

            return Response({
                'success': True,
                'data': recipes,
                'count': len(recipes)
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def retrieve(self, request, firebase_id=None):
        """GET /api/v1/recipes/:id - Get single recipe with ingredients"""
        try:
            api = get_api_service()
            recipe = api.get_recipe(firebase_id)

            if recipe:
                return Response({
                    'success': True,
                    'data': recipe
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Recipe not found'
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def create(self, request):
        """POST /api/v1/recipes/ - Create new recipe with ingredients"""
        try:
            serializer = RecipeCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            api = get_api_service()
            result = api.add_recipe(serializer.validated_data)

            if result.get('success'):
                product_name = serializer.validated_data.get('productName')
                log_audit_action('Recipe Created', request.user, f"Created recipe for {product_name}")
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, firebase_id=None):
        """PUT /api/v1/recipes/:id - Update recipe"""
        try:
            serializer = RecipeCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            api = get_api_service()
            result = api.update_recipe(firebase_id, serializer.validated_data)

            if result.get('success'):
                product_name = serializer.validated_data.get('productName')
                log_audit_action('Recipe Updated', request.user, f"Updated recipe for {product_name}")
                return Response(result)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, firebase_id=None):
        """DELETE /api/v1/recipes/:id - Delete recipe"""
        try:
            api = get_api_service()

            # Get recipe name before deletion
            recipe = api.get_recipe(firebase_id)
            product_name = recipe.get('productName', 'Unknown') if recipe else 'Unknown'

            result = api.delete_recipe(firebase_id)

            if result.get('success'):
                log_audit_action('Recipe Deleted', request.user, f"Deleted recipe for {product_name}")
                return Response(result)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Sales (Read-only)
    Sales are created by mobile app
    """
    queryset = Sale.objects.all().order_by('-order_date')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """GET /api/v1/sales/ - List all sales"""
        try:
            api = get_api_service()
            sales = api.get_sales(limit=1000)

            return Response({
                'success': True,
                'data': sales,
                'count': len(sales)
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WasteLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Waste Log management
    """
    queryset = WasteLog.objects.all().order_by('-waste_date')
    serializer_class = WasteLogSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request):
        """POST /api/v1/waste/ - Record waste (deducts from Inventory B)"""
        try:
            serializer = WasteCreateSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            product_id = serializer.validated_data.get('productId')
            quantity = serializer.validated_data.get('quantity')
            reason = serializer.validated_data.get('reason')

            # Get product details
            try:
                product = Product.objects.get(firebase_id=product_id)
            except Product.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Product not found'
                }, status=status.HTTP_404_NOT_FOUND)

            waste_data = {
                'productFirebaseId': product.firebase_id,
                'productName': product.name,
                'category': product.category,
                'quantity': quantity,
                'reason': reason,
                'recordedBy': request.user.username
            }

            api = get_api_service()
            result = api.add_waste_log(waste_data)

            if result.get('success'):
                log_audit_action(
                    'Waste Recorded',
                    request.user,
                    f"Recorded {quantity} units of {product.name} as waste ({reason})"
                )
                return Response(result, status=status.HTTP_201_CREATED)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AuditTrailViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Audit Trail (Read-only)
    """
    queryset = AuditTrail.objects.all().order_by('-timestamp')
    serializer_class = AuditTrailSerializer
    permission_classes = [IsAuthenticated]
