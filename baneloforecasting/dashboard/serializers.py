"""
Django REST Framework Serializers for Dashboard App
Provides JSON serialization for all models
"""

from rest_framework import serializers
from .models import (
    Product, Recipe, RecipeIngredient, Sale, WasteLog,
    AuditTrail, MLPrediction, MLModel
)


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model with dual inventory support"""

    class Meta:
        model = Product
        fields = [
            'id', 'firebase_id', 'name', 'category', 'price', 'unit',
            'quantity', 'stock', 'inventory_a', 'inventory_b',
            'cost_per_unit', 'image_uri', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    """Serializer for Recipe Ingredients"""

    # Optional: Include ingredient product details
    ingredient_stock = serializers.SerializerMethodField()
    ingredient_cost = serializers.SerializerMethodField()

    class Meta:
        model = RecipeIngredient
        fields = [
            'id', 'firebase_id', 'recipe_firebase_id',
            'ingredient_firebase_id', 'ingredient_name',
            'quantity_needed', 'unit', 'recipe_id', 'created_at',
            'ingredient_stock', 'ingredient_cost'
        ]
        read_only_fields = ['id', 'created_at']

    def get_ingredient_stock(self, obj):
        """Get current stock of ingredient from Product table"""
        try:
            product = Product.objects.get(firebase_id=obj.ingredient_firebase_id)
            return {
                'inventory_a': float(product.inventory_a or 0),
                'inventory_b': float(product.inventory_b or 0),
                'total': float(product.quantity or 0)
            }
        except Product.DoesNotExist:
            return None

    def get_ingredient_cost(self, obj):
        """Get cost per unit of ingredient"""
        try:
            product = Product.objects.get(firebase_id=obj.ingredient_firebase_id)
            return float(product.cost_per_unit or 0)
        except Product.DoesNotExist:
            return 0.0


class RecipeSerializer(serializers.ModelSerializer):
    """Serializer for Recipe model with nested ingredients"""

    ingredients = RecipeIngredientSerializer(
        source='recipeingredient_set',
        many=True,
        read_only=True
    )
    ingredient_count = serializers.SerializerMethodField()
    max_servings = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'firebase_id', 'product_firebase_id', 'product_name',
            'product_number', 'created_at', 'updated_at',
            'ingredients', 'ingredient_count', 'max_servings'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_ingredient_count(self, obj):
        """Count number of ingredients in recipe"""
        return RecipeIngredient.objects.filter(
            recipe_firebase_id=obj.firebase_id
        ).count()

    def get_max_servings(self, obj):
        """Calculate maximum servings based on available inventory B"""
        try:
            ingredients = RecipeIngredient.objects.filter(
                recipe_firebase_id=obj.firebase_id
            )

            if not ingredients.exists():
                return 0

            max_servings_list = []

            for ingredient in ingredients:
                try:
                    product = Product.objects.get(
                        firebase_id=ingredient.ingredient_firebase_id
                    )
                    # Use inventory_b (operational stock) for calculation
                    available = float(product.inventory_b or 0)
                    needed = float(ingredient.quantity_needed or 0)

                    if needed > 0:
                        max_for_ingredient = int(available / needed)
                        max_servings_list.append(max_for_ingredient)
                    else:
                        max_servings_list.append(0)
                except Product.DoesNotExist:
                    max_servings_list.append(0)

            return min(max_servings_list) if max_servings_list else 0
        except Exception as e:
            return 0


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sales data"""

    class Meta:
        model = Sale
        fields = [
            'id', 'product_firebase_id', 'product_name', 'category',
            'quantity', 'price', 'total', 'order_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WasteLogSerializer(serializers.ModelSerializer):
    """Serializer for Waste tracking"""

    waste_cost = serializers.SerializerMethodField()

    class Meta:
        model = WasteLog
        fields = [
            'id', 'product_firebase_id', 'product_name', 'category',
            'quantity', 'reason', 'waste_date', 'recorded_by',
            'created_at', 'waste_cost'
        ]
        read_only_fields = ['id', 'created_at']

    def get_waste_cost(self, obj):
        """Calculate waste cost based on product cost_per_unit"""
        try:
            product = Product.objects.get(firebase_id=obj.product_firebase_id)
            cost_per_unit = float(product.cost_per_unit or 0)
            quantity = float(obj.quantity or 0)
            return cost_per_unit * quantity
        except Product.DoesNotExist:
            return 0.0


class AuditTrailSerializer(serializers.ModelSerializer):
    """Serializer for Audit Trail"""

    class Meta:
        model = AuditTrail
        fields = [
            'id', 'action', 'details', 'user_id', 'user_name', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class MLPredictionSerializer(serializers.ModelSerializer):
    """Serializer for ML Predictions"""

    class Meta:
        model = MLPrediction
        fields = [
            'id', 'product_firebase_id', 'product_name',
            'predicted_daily_usage', 'avg_daily_usage', 'trend',
            'confidence_score', 'data_points', 'last_updated'
        ]
        read_only_fields = ['id', 'last_updated']


class MLModelSerializer(serializers.ModelSerializer):
    """Serializer for ML Model metadata"""

    class Meta:
        model = MLModel
        fields = [
            'id', 'name', 'is_trained', 'last_trained', 'total_records',
            'products_analyzed', 'predictions_generated', 'accuracy',
            'model_type', 'training_period_days'
        ]
        read_only_fields = ['id']


# ============================================
# Nested Serializers for Create/Update Operations
# ============================================

class RecipeIngredientCreateSerializer(serializers.Serializer):
    """Serializer for creating recipe ingredients"""
    ingredientFirebaseId = serializers.CharField(max_length=255)
    ingredientName = serializers.CharField(max_length=255)
    quantityNeeded = serializers.FloatField()
    unit = serializers.CharField(max_length=50, default='g')


class RecipeCreateSerializer(serializers.Serializer):
    """Serializer for creating/updating recipes with ingredients"""
    productFirebaseId = serializers.CharField(max_length=255)
    productName = serializers.CharField(max_length=255)
    productNumber = serializers.IntegerField(default=0)
    ingredients = RecipeIngredientCreateSerializer(many=True)


class InventoryTransferSerializer(serializers.Serializer):
    """Serializer for inventory transfer from A to B"""
    productId = serializers.CharField(max_length=255)
    quantity = serializers.FloatField(min_value=0.01)


class WasteCreateSerializer(serializers.Serializer):
    """Serializer for creating waste logs"""
    productId = serializers.CharField(max_length=255)
    quantity = serializers.FloatField(min_value=0.01)
    reason = serializers.CharField(max_length=255)


class ProductCreateSerializer(serializers.Serializer):
    """Serializer for creating products"""
    name = serializers.CharField(max_length=255)
    category = serializers.CharField(max_length=100)
    price = serializers.FloatField(default=0)
    quantity = serializers.FloatField(default=0)
    inventoryA = serializers.FloatField(default=0, required=False)
    inventoryB = serializers.FloatField(default=0, required=False)
    costPerUnit = serializers.FloatField(default=0, required=False)
    unit = serializers.CharField(max_length=50, default='pcs')
    imageUri = serializers.CharField(max_length=500, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    sku = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ProductUpdateSerializer(serializers.Serializer):
    """Serializer for updating products"""
    productId = serializers.CharField(max_length=255)
    name = serializers.CharField(max_length=255, required=False)
    category = serializers.CharField(max_length=100, required=False)
    price = serializers.FloatField(required=False)
    quantity = serializers.FloatField(required=False)
    inventoryA = serializers.FloatField(required=False)
    inventoryB = serializers.FloatField(required=False)
    costPerUnit = serializers.FloatField(required=False)
    unit = serializers.CharField(max_length=50, required=False)
    imageUri = serializers.CharField(max_length=500, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
