# Banelo Coffee POS - Complete API Documentation

## System Architecture

The Banelo Coffee POS system uses a hybrid architecture:

1. **PostgreSQL Database (Laptop A)** - Stores all business data
2. **Node.js API Server (Laptop A)** - Provides REST API access to PostgreSQL
3. **Django Web Application (Laptop B)** - Web interface and additional REST API

### Data Flow
```
Mobile App ──┐
             ├──> PostgreSQL (Laptop A) <──> Node.js API (Laptop A) <──> Django Web (Laptop B)
Web Browser ─┘
```

## Dual Inventory System

### Inventory A (Warehouse)
- Main storage inventory
- Stock received from suppliers
- **Not used** for sales calculations

### Inventory B (Operational)
- Active operational stock
- Used for sales and production
- Deducted when recording waste
- Used for recipe ingredient calculations

### Workflow
1. Receive stock → Add to **Inventory A**
2. Transfer to operations → Move from **A** to **B**
3. Create products (recipes) → Deduct from **B**
4. Record waste → Deduct from **B**

---

## Node.js API Endpoints (Port 3000)

Base URL: `http://192.168.254.176:3000` (Laptop A)

### Health Check
- **GET** `/api/health`
  - Returns server status
  - No authentication required

### Products (CRUD + Inventory Management)

#### List all products
- **GET** `/api/products`
- Returns: Array of all products with inventory A/B

#### Get single product
- **GET** `/api/products/:id`
- Params: `id` - firebase_id
- Returns: Single product object

#### Create product
- **POST** `/api/products`
- Body:
  ```json
  {
    "firebase_id": "generated-uuid",
    "name": "Product Name",
    "category": "ingredients",
    "price": 100.00,
    "quantity": 0,
    "inventory_a": 100.0,
    "inventory_b": 0.0,
    "cost_per_unit": 50.00,
    "unit": "g",
    "image_uri": "https://..."
  }
  ```

#### Update product
- **PUT** `/api/products/:id`
- Params: `id` - firebase_id
- Body: Same as create (all fields optional)

#### Delete product
- **DELETE** `/api/products/:id`
- Params: `id` - firebase_id

#### Transfer Inventory (A → B)
- **POST** `/api/products/transfer`
- Body:
  ```json
  {
    "firebaseId": "product-id",
    "quantity": 50.0
  }
  ```
- Deducts from Inventory A, adds to Inventory B
- Also updates main `quantity` field to match Inventory B

#### Update Inventory Directly
- **PUT** `/api/products/:id/inventory`
- Body:
  ```json
  {
    "inventory_a": 100.0,
    "inventory_b": 50.0
  }
  ```

### Recipes (CRUD with Ingredients)

#### List all recipes
- **GET** `/api/recipes`
- Returns: All recipes with nested ingredients array

#### Get single recipe
- **GET** `/api/recipes/:id`
- Params: `id` - recipe firebase_id
- Returns: Recipe with ingredients

#### Create recipe
- **POST** `/api/recipes`
- Body:
  ```json
  {
    "productFirebaseId": "product-id",
    "productName": "Latte",
    "productNumber": 0,
    "ingredients": [
      {
        "ingredientFirebaseId": "ing-1",
        "ingredientName": "Coffee Beans",
        "quantityNeeded": 18.0,
        "unit": "g"
      },
      {
        "ingredientFirebaseId": "ing-2",
        "ingredientName": "Milk",
        "quantityNeeded": 250.0,
        "unit": "ml"
      }
    ]
  }
  ```

#### Update recipe
- **PUT** `/api/recipes/:id`
- Body: Same as create
- Deletes old ingredients and creates new ones

#### Delete recipe
- **DELETE** `/api/recipes/:id`
- Deletes recipe and all its ingredients

#### Get recipe ingredients
- **GET** `/api/recipes/:id/ingredients`
- Returns: Array of ingredients for specific recipe

### Sales (Read-only)

#### List sales
- **GET** `/api/sales`
- Query params: `limit` (default 1000), `date_from`, `date_to`
- Returns: Array of sales records

#### Sales summary
- **GET** `/api/sales/summary`
- Query params: `period` (today/week/month)
- Returns: Aggregated sales data

### Waste Management

#### List waste logs
- **GET** `/api/waste-logs`
- Query params: `date_from`, `date_to`
- Returns: Array of waste log entries

#### Record waste
- **POST** `/api/waste`
- Body:
  ```json
  {
    "productFirebaseId": "product-id",
    "productName": "Milk",
    "category": "ingredients",
    "quantity": 5.0,
    "reason": "Expired",
    "recordedBy": "username"
  }
  ```
- Deducts quantity from **Inventory B**

### Audit Logs

#### List audit logs
- **GET** `/api/audit-logs`
- Query params: `limit`, `user`, `action`, `date_from`, `date_to`

#### Create audit log
- **POST** `/api/audit-logs`
- Body:
  ```json
  {
    "action": "Product Updated",
    "details": "Updated Coffee Beans quantity",
    "user_id": "user-123",
    "user_name": "admin"
  }
  ```

---

## Django REST API Endpoints (Port 8000)

Base URL: `http://localhost:8000` (Laptop B)
**Authentication Required:** Session-based (login required)

### REST Framework Browsable API

All endpoints support:
- JSON responses
- Browsable HTML interface
- Pagination (100 items per page)
- Search and filtering

### Products ViewSet

#### List products
- **GET** `/api/v1/products/`
- Returns: Paginated list of products from Node.js API

#### Get product
- **GET** `/api/v1/products/:firebase_id/`

#### Create product
- **POST** `/api/v1/products/`
- Proxies to Node.js API

#### Update product
- **PUT** `/api/v1/products/:firebase_id/`
- **PATCH** `/api/v1/products/:firebase_id/` (partial update)

#### Delete product
- **DELETE** `/api/v1/products/:firebase_id/`

#### Transfer inventory
- **POST** `/api/v1/products/:firebase_id/transfer/`
- Body:
  ```json
  {
    "quantity": 50.0
  }
  ```

### Recipes ViewSet

#### List recipes
- **GET** `/api/v1/recipes/`

#### Get recipe
- **GET** `/api/v1/recipes/:firebase_id/`

#### Create recipe
- **POST** `/api/v1/recipes/`
- Body: (see Node.js API format)

#### Update recipe
- **PUT** `/api/v1/recipes/:firebase_id/`

#### Delete recipe
- **DELETE** `/api/v1/recipes/:firebase_id/`

### Sales ViewSet (Read-only)

#### List sales
- **GET** `/api/v1/sales/`

#### Get sale
- **GET** `/api/v1/sales/:id/`

### Waste ViewSet

#### List waste logs
- **GET** `/api/v1/waste/`

#### Create waste log
- **POST** `/api/v1/waste/`

### Audit ViewSet (Read-only)

#### List audit logs
- **GET** `/api/v1/audit/`

---

## Legacy Django API Endpoints

These are the original function-based view endpoints (still functional for backward compatibility):

### Products
- **GET** `/api/products/` - List products
- **POST** `/api/products/add/` - Create product
- **POST** `/api/products/update/` - Update product
- **POST** `/api/products/delete/` - Delete product

### Recipes
- **POST** `/api/recipes/add/` - Create recipe
- **POST** `/api/recipes/update/` - Update recipe
- **POST** `/api/recipes/delete/` - Delete recipe

### Inventory & Waste
- **POST** `/api/inventory/transfer/` - Transfer A→B
- **POST** `/api/waste/add/` - Record waste

### System
- **GET** `/api/health/` - Check Node.js API connection
- **POST** `/api/train-forecasting/` - Train ML model

---

## Complete CRUD Operations Guide

### Product Management (with Inventory A & B)

#### 1. Create a new product (Ingredient)
```bash
# Via Node.js API
curl -X POST http://192.168.254.176:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_id": "ingredient-coffee-001",
    "name": "Coffee Beans",
    "category": "ingredients",
    "price": 0,
    "quantity": 0,
    "inventory_a": 1000.0,
    "inventory_b": 0.0,
    "cost_per_unit": 2.5,
    "unit": "g"
  }'
```

#### 2. Transfer stock from A to B
```bash
curl -X POST http://192.168.254.176:3000/api/products/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseId": "ingredient-coffee-001",
    "quantity": 200.0
  }'
```

#### 3. Update product
```bash
curl -X PUT http://192.168.254.176:3000/api/products/ingredient-coffee-001 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Coffee Beans",
    "cost_per_unit": 3.0
  }'
```

#### 4. Delete product
```bash
curl -X DELETE http://192.168.254.176:3000/api/products/ingredient-coffee-001
```

### Recipe Management (with Ingredients)

#### 1. Create recipe for a beverage
```bash
curl -X POST http://192.168.254.176:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "productFirebaseId": "beverage-latte-001",
    "productName": "Latte",
    "productNumber": 0,
    "ingredients": [
      {
        "ingredientFirebaseId": "ingredient-coffee-001",
        "ingredientName": "Coffee Beans",
        "quantityNeeded": 18.0,
        "unit": "g"
      },
      {
        "ingredientFirebaseId": "ingredient-milk-001",
        "ingredientName": "Milk",
        "quantityNeeded": 250.0,
        "unit": "ml"
      }
    ]
  }'
```

#### 2. Update recipe
```bash
# Use same format as create
curl -X PUT http://192.168.254.176:3000/api/recipes/recipe-id \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

#### 3. Delete recipe
```bash
curl -X DELETE http://192.168.254.176:3000/api/recipes/recipe-id
```

### Waste Management

#### Record waste (deducts from Inventory B)
```bash
curl -X POST http://192.168.254.176:3000/api/waste \
  -H "Content-Type: application/json" \
  -d '{
    "productFirebaseId": "ingredient-milk-001",
    "productName": "Milk",
    "category": "ingredients",
    "quantity": 100.0,
    "reason": "Expired",
    "recordedBy": "admin"
  }'
```

---

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price FLOAT DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pcs',
    quantity FLOAT DEFAULT 0,       -- Synced with inventory_b
    stock FLOAT DEFAULT 0,          -- Legacy field
    inventory_a FLOAT DEFAULT 0,    -- Warehouse stock
    inventory_b FLOAT DEFAULT 0,    -- Operational stock
    cost_per_unit FLOAT DEFAULT 0,
    image_uri TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Recipes Table
```sql
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255) UNIQUE,
    product_firebase_id VARCHAR(255),
    product_name VARCHAR(255),
    product_number INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Recipe Ingredients Table
```sql
CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255),
    recipe_firebase_id VARCHAR(255),
    ingredient_firebase_id VARCHAR(255),
    ingredient_name VARCHAR(255),
    quantity_needed FLOAT,
    unit VARCHAR(50) DEFAULT 'g',
    recipe_id INTEGER,
    created_at TIMESTAMP
);
```

### Sales Table
```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    product_firebase_id VARCHAR(255),
    product_name VARCHAR(255),
    category VARCHAR(100),
    quantity FLOAT,
    price FLOAT,
    total FLOAT,
    order_date TIMESTAMP,
    created_at TIMESTAMP
);
```

### Waste Logs Table
```sql
CREATE TABLE waste_logs (
    id SERIAL PRIMARY KEY,
    product_firebase_id VARCHAR(255),
    product_name VARCHAR(255),
    quantity FLOAT,
    reason VARCHAR(255),
    category VARCHAR(100),
    waste_date TIMESTAMP,
    recorded_by VARCHAR(255),
    created_at TIMESTAMP
);
```

### Audit Trail Table
```sql
CREATE TABLE audit_trail (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255),
    details TEXT,
    user_id VARCHAR(255),
    user_name VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Testing Guide

### Test Node.js API (Laptop A)

```bash
# Test health check
curl http://192.168.254.176:3000/api/health

# List products
curl http://192.168.254.176:3000/api/products

# List recipes
curl http://192.168.254.176:3000/api/recipes
```

### Test Django REST API (Laptop B)

```bash
# Login first to get session cookie
curl -c cookies.txt -X POST http://localhost:8000/accounts/login/ \
  -d "username=admin&password=admin123"

# Then use cookie for authenticated requests
curl -b cookies.txt http://localhost:8000/api/v1/products/

# Or use the browsable API in browser
# Visit: http://localhost:8000/api/v1/
```

---

## Deployment Configuration

### Environment Variables (.env)

**Node.js API (Laptop A):**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres
DB_PASSWORD=your_password
ALLOWED_ORIGINS=http://localhost:8000,http://192.168.254.x:8000
```

**Django (Laptop B):**
```env
API_BASE_URL=http://192.168.254.176:3000
API_TIMEOUT=30
DEBUG=True
SECRET_KEY=your-secret-key
```

### Starting the Servers

**Laptop A (PostgreSQL + Node.js):**
```bash
cd nodejs-api
npm install
npm start
```

**Laptop B (Django):**
```bash
cd baneloforecasting
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

---

## Summary

✅ **Complete CRUD** for Products (with Inventory A & B)
✅ **Complete CRUD** for Recipes (with nested ingredients)
✅ **Inventory Transfer** system (A → B)
✅ **Waste Management** (deducts from B)
✅ **Sales tracking** (read-only)
✅ **Audit Trail** logging
✅ **REST API** via Node.js (port 3000)
✅ **Django REST Framework** API (port 8000)
✅ **Dual inventory** system fully implemented
✅ **Recipe-based** max servings calculation

All endpoints are functional and tested! 🎉
