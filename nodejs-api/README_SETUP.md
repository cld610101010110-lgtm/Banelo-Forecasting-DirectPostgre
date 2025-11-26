# Node.js API Server Setup

This API server connects your Django website to the PostgreSQL database.

## Quick Start (For Laptop A - Mobile POS Machine)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update it:

```bash
cp .env.example .env
```

Then edit `.env`:
- Update `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` if different
- **IMPORTANT:** Add Laptop B's IP to `ALLOWED_ORIGINS`

Example `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres

PORT=3000
NODE_ENV=development

ALLOWED_ORIGINS=http://localhost:8000,http://192.168.254.177:8000
```

### 3. Start the Server

**Option A - Using startup script (Windows):**
```bash
START_API_SERVER.bat
```

**Option B - Using startup script (Linux/Mac):**
```bash
./START_API_SERVER.sh
```

**Option C - Direct command:**
```bash
npm start
```

### 4. Verify It's Running

Open browser and visit:
```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "message": "Banelo API Server is running"
}
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/transfer` - Transfer inventory A→B
- `PUT /api/products/:id/inventory` - Update inventory

### Recipes
- `GET /api/recipes` - List all recipes with ingredients
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/:id/ingredients` - Get recipe ingredients

### Sales
- `GET /api/sales` - List sales
- `GET /api/sales/summary` - Get sales summary

### Waste Management
- `GET /api/waste-logs` - List waste logs
- `POST /api/waste` - Record waste

### Audit Trail
- `GET /api/audit-logs` - List audit logs
- `POST /api/audit-logs` - Create audit log

## Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Test connection: `psql -U postgres -d banelo_db`

### "CORS error" from Django website
- Add Laptop B's IP to `ALLOWED_ORIGINS` in `.env`
- Restart the server after changing `.env`

### Port 3000 already in use
- Change `PORT` in `.env`
- Update Django's `API_BASE_URL` to match

## Important Notes

1. **Keep this server running** while using the Django website
2. **Both laptops must be on the same network**
3. **Update CORS settings** with correct Laptop B IP
4. **PostgreSQL must be running** before starting this server
