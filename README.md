# Banelo Coffee POS - Forecasting & Inventory Management System

## Overview

A comprehensive Point of Sale (POS) and inventory management system for Banelo Coffee with ML-powered forecasting, dual inventory tracking, and recipe management.

## System Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────────┐
│   Mobile App    │ ───┐    │   PostgreSQL     │         │   Django Website   │
│  (Android POS)  │    │    │   Database       │ ◄────── │   (Laptop B)       │
└─────────────────┘    │    │  (Laptop A)      │         │                    │
                       │    └────────▲─────────┘         └────────────────────┘
                       │             │                              │
                       │             │                              │
┌─────────────────┐    │    ┌────────▼─────────┐                  │
│   Web Browser   │ ───┴───►│   Node.js API    │ ◄────────────────┘
│  (Customers)    │         │   Server         │
└─────────────────┘         │  (Laptop A)      │
                            └──────────────────┘
```

## Key Features

### ✅ Dual Inventory System
- **Inventory A (Warehouse)**: Main storage for received goods
- **Inventory B (Operational)**: Active stock for production and sales
- **Transfer System**: Move stock from A → B as needed

### ✅ Recipe Management
- Create recipes with multiple ingredients
- Automatic max servings calculation based on Inventory B
- Track ingredient costs and stock levels
- Recipe CRUD operations via REST API

### ✅ Product Management
- Full CRUD operations (Create, Read, Update, Delete)
- Support for categories: Ingredients, Beverages, Pastries
- Track cost per unit, pricing, and stock levels
- Image support for products

### ✅ Waste Tracking
- Record expired or damaged inventory
- Automatic deduction from Inventory B
- Cost calculation for waste analysis
- Date filtering and reporting

### ✅ Sales Analytics
- Real-time sales tracking
- Daily, weekly, monthly reports
- Top products analysis
- Export to CSV

### ✅ ML-Powered Forecasting
- Predict daily ingredient usage
- Calculate days until stock depletion
- Confidence scores for predictions
- Reorder quantity recommendations

### ✅ Audit Trail
- Track all system operations
- User action logging
- Date/time stamping
- Filter by user and action type

## Technology Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework 3.14+** - RESTful API
- **Node.js + Express** - API middleware
- **PostgreSQL** - Database
- **scikit-learn** - ML forecasting

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5
- Chart.js for analytics
- Responsive design

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

### Laptop A Setup (Database + Node.js API)

1. **Install PostgreSQL** and create database:
```bash
createdb banelo_db
```

2. **Setup Node.js API**:
```bash
cd nodejs-api
npm install
```

3. **Configure environment** (.env):
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres
DB_PASSWORD=your_password
ALLOWED_ORIGINS=http://localhost:8000,http://192.168.254.x:8000
```

4. **Start Node.js API**:
```bash
npm start
```

### Laptop B Setup (Django Website)

1. **Install Python dependencies**:
```bash
cd baneloforecasting
pip install -r requirements.txt
```

2. **Configure environment** (.env):
```env
API_BASE_URL=http://192.168.254.176:3000
API_TIMEOUT=30
DEBUG=True
SECRET_KEY=your-secret-key-here
```

3. **Run migrations**:
```bash
python manage.py migrate
```

4. **Create superuser**:
```bash
python manage.py createsuperuser
```

5. **Start Django server**:
```bash
python manage.py runserver 0.0.0.0:8000
```

## API Endpoints

### Node.js API (Port 3000)
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/transfer` - Transfer inventory A→B
- `GET /api/recipes` - List recipes
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/sales` - List sales
- `POST /api/waste` - Record waste

### Django REST API (Port 8000)
- `/api/v1/products/` - Products ViewSet
- `/api/v1/recipes/` - Recipes ViewSet
- `/api/v1/sales/` - Sales ViewSet (read-only)
- `/api/v1/waste/` - Waste ViewSet
- `/api/v1/audit/` - Audit Trail ViewSet

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Usage Guide

### Managing Products

#### 1. Add a new ingredient
1. Navigate to Inventory page
2. Click "Add Product"
3. Fill in details:
   - Name: "Coffee Beans"
   - Category: "ingredients"
   - Cost per unit: 2.5
   - Inventory A: 1000 (initial stock)
4. Click Save

#### 2. Transfer to operational stock
1. Find the product in inventory
2. Click "Transfer to B"
3. Enter quantity (e.g., 200g)
4. Confirm transfer

### Creating Recipes

#### 1. Create a beverage recipe
1. Go to Inventory → Recipes
2. Click "Add Recipe"
3. Select product: "Latte"
4. Add ingredients:
   - Coffee Beans: 18g
   - Milk: 250ml
   - Sugar: 5g
5. Save recipe

#### 2. View max servings
- System automatically calculates max servings based on Inventory B
- Updates in real-time as ingredients are used

### Recording Waste

1. Go to Waste Tracking
2. Click "Record Waste"
3. Select product
4. Enter quantity
5. Choose reason (Expired, Damaged, Spoiled)
6. Submit - automatically deducts from Inventory B

### ML Forecasting

1. Go to Inventory Forecasting
2. Click "Train Model"
3. System analyzes sales history
4. View predictions:
   - Daily usage estimates
   - Days until depletion
   - Reorder recommendations

## Project Structure

```
Banelo-Forecasting-DirectPostgre/
├── baneloforecasting/              # Django project
│   ├── baneloforecasting/          # Project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── dashboard/                  # Main app
│   │   ├── models.py               # Database models
│   │   ├── views.py                # View functions
│   │   ├── viewsets.py             # DRF ViewSets
│   │   ├── serializers.py          # DRF Serializers
│   │   ├── api_service.py          # Node.js API client
│   │   ├── urls.py                 # URL routing
│   │   ├── api_urls.py             # REST API routing
│   │   └── templates/              # HTML templates
│   ├── accounts/                   # Authentication
│   ├── static/                     # CSS, JS, images
│   ├── manage.py
│   └── requirements.txt
│
├── nodejs-api/                     # Node.js API server
│   ├── server.js                   # Main server
│   ├── routes/
│   │   ├── products.js
│   │   ├── recipes.js
│   │   ├── sales.js
│   │   ├── waste.js
│   │   └── audit.js
│   ├── config/
│   │   └── database.js
│   ├── package.json
│   └── .env
│
├── API_DOCUMENTATION.md            # Complete API docs
└── README.md                       # This file
```

## Database Schema

### Core Tables
- `products` - Product master data with dual inventory
- `recipes` - Recipe definitions
- `recipe_ingredients` - Recipe ingredient relationships
- `sales` - Sales transactions
- `waste_logs` - Waste tracking
- `audit_trail` - System audit logs
- `ml_predictions` - ML forecast data
- `ml_models` - ML model metadata

## Troubleshooting

### Node.js API not connecting
1. Check if Node.js server is running on Laptop A
2. Verify API_BASE_URL in Django settings
3. Check firewall settings allow port 3000
4. Test connection: `curl http://192.168.254.176:3000/api/health`

### Database connection issues
1. Verify PostgreSQL is running
2. Check database credentials in Node.js .env
3. Ensure database exists: `psql -l`
4. Check PostgreSQL logs

### Migration errors
1. Delete migration files except `__init__.py`
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate`

## Development

### Running tests
```bash
# Django tests
python manage.py test

# Node.js tests
npm test
```

### Code formatting
```bash
# Python
black baneloforecasting/

# JavaScript
npx prettier --write nodejs-api/
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

Proprietary - Banelo Coffee POS

## Support

For issues or questions, contact the development team.

## Changelog

### v2.0.0 (2025-01-26)
- ✅ Added Django REST Framework API
- ✅ Implemented dual inventory system (A & B)
- ✅ Complete Recipe CRUD with ingredients
- ✅ Product CRUD operations
- ✅ Waste management with cost tracking
- ✅ ML-powered inventory forecasting
- ✅ Comprehensive audit trail
- ✅ API documentation

### v1.0.0 (Initial Release)
- Basic POS functionality
- Product management
- Sales tracking
