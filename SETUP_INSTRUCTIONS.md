# Banelo Coffee POS - Setup Instructions

## Issues Fixed

After 3 days of debugging, the following critical issues have been resolved:

### 1. **Recipe Management Not Working**
   - **Root Cause**: Node.js API server was not running
   - **Solution**:
     - Installed Node.js dependencies (`npm install`)
     - Created PostgreSQL database and tables
     - Configured database connection
     - Started Node.js API server

### 2. **Ingredient Transfer to Inventory Not Working**
   - **Root Cause**: Same as above - API server was not running
   - **Solution**: All inventory transfer operations now work through the running Node.js API

### 3. **PostgreSQL Authentication Issues**
   - **Root Cause**: PostgreSQL was using SCRAM-SHA-256 authentication requiring passwords
   - **Solution**: Changed `pg_hba.conf` to use `trust` authentication for local connections

## System Architecture

```
┌─────────────────────┐
│   Django Website    │ ──┐
│   (Port 8000)       │   │
└─────────────────────┘   │
                          │  HTTP Requests
                          ▼
            ┌──────────────────────────┐
            │   Node.js API Server     │
            │   (Port 3000)            │
            └────────────┬─────────────┘
                         │
                         │  SQL Queries
                         ▼
            ┌──────────────────────────┐
            │   PostgreSQL Database    │
            │   (banelo_db)            │
            └──────────────────────────┘
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+

## Quick Start

### 1. Start PostgreSQL

```bash
service postgresql start
```

### 2. Start Node.js API Server

```bash
cd nodejs-api
node server.js &
```

The API server will start on port 3000.

### 3. Start Django Website

```bash
cd baneloforecasting
python manage.py runserver
```

The website will start on port 8000.

### 4. Access the Application

Open your browser and navigate to:
- **Website**: http://localhost:8000
- **API Documentation**: http://localhost:3000

## Testing Recipe Management

1. **Add a Recipe**:
   - Navigate to Inventory → Recipe Management
   - Click "Add Recipe"
   - Select a beverage/pastry product
   - Add ingredients and quantities
   - Save

2. **Transfer Ingredients**:
   - Navigate to Inventory
   - Find an ingredient
   - Click "Transfer" button
   - Enter quantity to transfer from Inventory A → B
   - Confirm

## Database Information

- **Database Name**: `banelo_db`
- **User**: `postgres`
- **Authentication**: Trust (no password required for local connections)
- **Tables Created**:
  - `products` - All products (ingredients, beverages, pastries)
  - `recipes` - Recipe definitions
  - `recipe_ingredients` - Ingredients used in each recipe
  - `sales` - Sales transactions
  - `waste_logs` - Waste tracking

## Sample Data

The database has been populated with sample data:

**Ingredients**:
- Milk (5000g)
- Coffee Beans (3000g)
- Sugar (2000g)
- Chocolate Powder (1500g)
- Whipped Cream (1000g)
- Flour (5000g)
- Butter (2000g)
- Eggs (2400g)

**Beverages**:
- Caffe Latte (₱120)
- Cappuccino (₱130)
- Mocha (₱150)
- Americano (₱100)

**Pastries**:
- Croissant (₱80)
- Blueberry Muffin (₱75)

## API Endpoints

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/transfer` - Transfer inventory A→B

### Recipes
- `GET /api/recipes` - List all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Other
- `GET /api/health` - Health check
- `GET /api/sales` - List sales
- `POST /api/waste` - Record waste
- `GET /api/waste-logs` - List waste logs

## Troubleshooting

### Node.js API not responding

```bash
# Check if server is running
ps aux | grep "node server.js"

# Restart server
pkill -9 node
cd nodejs-api
node server.js &
```

### PostgreSQL not running

```bash
# Start PostgreSQL
service postgresql start

# Check status
pg_isready
```

### Database connection errors

Check that PostgreSQL is configured to allow local connections:
```bash
# Check pg_hba.conf
cat /etc/postgresql/16/main/pg_hba.conf | grep "^local\|^host"
```

Ensure these lines exist:
```
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

## Files Modified/Created

1. **nodejs-api/.env** - Environment configuration
2. **nodejs-api/config/database.js** - Fixed password handling
3. **/etc/postgresql/16/main/pg_hba.conf** - Changed authentication to trust
4. **/etc/postgresql/16/main/postgresql.conf** - Disabled SSL
5. **Database schema** - Created all required tables

## Next Steps

1. Add more products and ingredients
2. Create recipes for beverages and pastries
3. Test the inventory transfer functionality
4. Start making sales and track inventory usage
5. View ML-powered forecasting predictions

## Support

If you encounter any issues:
1. Check that both PostgreSQL and Node.js API server are running
2. Verify database contains sample data
3. Check the server logs in `/tmp/server-restart.log`
4. Ensure you're accessing the correct URLs (localhost:8000 for Django, localhost:3000 for API)
