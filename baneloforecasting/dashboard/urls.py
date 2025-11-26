from django.urls import path, include
from . import views


urlpatterns = [
    # ========================================
    # WEB PAGE VIEWS
    # ========================================
    path('', views.dashboard_view, name='dashboard'),
    path('inventory/', views.inventory_view, name='inventory'),
    path('inventory/recipes/', views.recipes_view, name='recipes'),
    path('inventory/waste-tracking/', views.waste_tracking_view, name='waste_tracking'),
    path('inventory/forecasting/', views.inventory_forecasting_view, name='inventory_forecasting'),
    path('settings/', views.settings_view, name='settings'),
    path('sales/', views.sales_view, name='sales'),
    path('sales/export/', views.export_sales_csv, name='export_sales_csv'),
    path('accounts/', views.accounts_view, name='accounts'),
    path('audit-trail/', views.audit_trail_view, name='audit_trail'),
    path('audit-trail/api/', views.get_audit_logs_api, name='audit_logs_api'),
    path('audit-trail/export/', views.export_audit_trail_csv, name='export_audit_trail_csv'),

    # ========================================
    # LEGACY API ENDPOINTS (Function-based views)
    # ========================================
    path('api/products/', views.api_products, name='api_products'),
    path('api/sales/', views.api_sales, name='api_sales'),
    path('api/health/', views.firebase_health_check, name='firebase_health_check'),
    path('api/debug/firebase/', views.debug_firebase_status, name='debug_firebase_status'),
    path('api/update-password/', views.update_password_api, name='update_password_api'),
    path('api/train-forecasting/', views.train_forecasting_model, name='train_forecasting_model'),

    # Product CRUD (legacy)
    path('api/products/add/', views.add_product_view, name='add_product'),
    path('api/products/update/', views.update_product_view, name='update_product'),
    path('api/products/delete/', views.delete_product_view, name='delete_product'),

    # Recipe CRUD (legacy)
    path('api/recipes/add/', views.add_recipe_api, name='add_recipe_api'),
    path('api/recipes/update/', views.update_recipe_api, name='update_recipe_api'),
    path('api/recipes/delete/', views.delete_recipe_api, name='delete_recipe_api'),

    # Inventory & Waste (legacy)
    path('api/inventory/transfer/', views.transfer_inventory_api, name='transfer_inventory_api'),
    path('api/waste/add/', views.add_waste_api, name='add_waste_api'),

    # ========================================
    # REST API ENDPOINTS (DRF ViewSets)
    # ========================================
    # Provides comprehensive RESTful API with proper HTTP methods
    # GET /api/v1/products/              - List products
    # POST /api/v1/products/             - Create product
    # GET /api/v1/products/:id/          - Get product
    # PUT /api/v1/products/:id/          - Update product
    # DELETE /api/v1/products/:id/       - Delete product
    # POST /api/v1/products/:id/transfer/ - Transfer inventory
    # ... and similar for recipes, sales, waste, audit
    path('api/v1/', include('dashboard.api_urls')),
]