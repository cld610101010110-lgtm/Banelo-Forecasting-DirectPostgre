# Banelo Coffee POS - Node.js API Server

This Node.js API server acts as a bridge between the Django website (running on Laptop B) and the PostgreSQL database (installed on Laptop A with the mobile POS).

## 🏗️ Architecture

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   Django Website    │         │   Node.js API       │         │   PostgreSQL DB     │
│   (Laptop B)        │◄───────►│   (Laptop A)        │◄───────►│   (Laptop A)        │
│   Port 8000         │  HTTP   │   Port 3000         │  Direct │   Port 5432         │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

## 📋 Prerequisites

Before running the API server, make sure you have:

1. **Node.js** installed (v14 or higher)
   ```bash
   node --version
   npm --version
   ```

2. **PostgreSQL** installed and running
   - Default port: 5432
   - Database created: `banelo_db` (or your database name)

3. **Database tables** created:
   - `products`
   - `recipes`
   - `recipe_ingredients`
   - `sales`
   - `waste_logs`
   - `audit_trail`

## 🚀 Installation

### Step 1: Install Dependencies

Navigate to the `nodejs-api` directory and install required packages:

```bash
cd nodejs-api
npm install
```

This will install:
- `express` - Web framework
- `pg` - PostgreSQL client
- `cors` - Cross-Origin Resource Sharing
- `dotenv` - Environment variables
- `body-parser` - Request body parsing
- `nodemon` - Auto-restart during development (dev only)

### Step 2: Configure Environment Variables

Create a `.env` file in the `nodejs-api` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# API Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (Django website URL)
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

**Important:** Replace `your_actual_password_here` with your actual PostgreSQL password.

### Step 3: Test Database Connection

Before starting the server, ensure PostgreSQL is running and accessible:

```bash
# On Linux/Mac
sudo systemctl status postgresql

# Or try connecting directly
psql -U postgres -d banelo_db
```

## ▶️ Running the Server

### Production Mode

```bash
npm start
```

### Development Mode (with auto-restart)

```bash
npm run dev
```

You should see output like:

```
============================================================
🚀 Banelo Coffee POS API Server
============================================================
📡 Server running on: http://localhost:3000
🌍 Environment: development
🗄️  Database: banelo_db @ localhost
✅ CORS enabled for: http://localhost:8000, http://127.0.0.1:8000
============================================================

📋 Available endpoints:
   GET  /                           - API documentation
   GET  /api/health                - Health check
   GET  /api/products              - List products
   POST /api/products/transfer     - Transfer inventory A→B
   GET  /api/recipes               - List recipes
   PUT  /api/recipes/:id           - Update recipe
   DELETE /api/recipes/:id         - Delete recipe
   POST /api/waste                 - Record waste

⏳ Waiting for requests...
```

## 🧪 Testing the API

### Test Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Banelo API Server is running",
  "timestamp": "2025-11-26T10:30:00.000Z",
  "version": "1.0.0"
}
```

### Test Products Endpoint

```bash
curl http://localhost:3000/api/products
```

### Test Recipes Endpoint

```bash
curl http://localhost:3000/api/recipes
```

## 📡 API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get single product by Firebase ID |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | **Delete product** |
| POST | `/api/products/transfer` | **Transfer inventory A→B** |
| PUT | `/api/products/:id/inventory` | Update inventory |

### Recipes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recipes` | Get all recipes with ingredients |
| GET | `/api/recipes/:id` | Get single recipe |
| POST | `/api/recipes` | Create new recipe |
| PUT | `/api/recipes/:id` | **Update recipe** |
| DELETE | `/api/recipes/:id` | **Delete recipe** |
| GET | `/api/recipes/:id/ingredients` | Get recipe ingredients |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all sales (with filters) |
| GET | `/api/sales/summary` | Get sales summary |

### Waste

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waste-logs` | Get all waste logs |
| POST | `/api/waste` | Add waste log and update inventory |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit-logs` | Get all audit logs |
| POST | `/api/audit-logs` | Create audit log |

## 🔧 Troubleshooting

### Issue: Cannot connect to PostgreSQL

**Error:** `Connection refused` or `ECONNREFUSED`

**Solution:**
1. Check if PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```
2. Verify PostgreSQL is listening on port 5432:
   ```bash
   sudo netstat -tulpn | grep 5432
   ```
3. Check `pg_hba.conf` allows local connections
4. Verify credentials in `.env` file

### Issue: CORS errors

**Error:** `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:8000' has been blocked by CORS policy`

**Solution:**
1. Ensure `ALLOWED_ORIGINS` in `.env` includes your Django URL
2. Restart the API server after changing `.env`

### Issue: Recipe edit/delete not working

**Symptoms:**
- Click edit/delete button
- No response or error in browser console

**Solution:**
1. Verify API server is running on port 3000
2. Check browser console for error messages
3. Test endpoint directly: `curl -X DELETE http://localhost:3000/api/recipes/RECIPE_ID`
4. Check API server logs for errors

### Issue: Inventory transfer not working

**Symptoms:**
- Transfer button doesn't work
- "Insufficient stock" error even when stock is available

**Solution:**
1. Verify `inventory_a` and `inventory_b` fields exist in products table
2. Check that products have `inventory_a > 0`
3. Test endpoint: `curl -X POST http://localhost:3000/api/products/transfer -H "Content-Type: application/json" -d '{"firebaseId":"PRODUCT_ID","quantity":10}'`

## 🌐 Network Configuration for Two Laptops

### On Laptop A (Database + API Server)

1. **Find your local IP address:**
   ```bash
   # Linux
   ip addr show

   # Windows
   ipconfig

   # Mac
   ifconfig
   ```
   Example IP: `192.168.1.100`

2. **Configure PostgreSQL to accept remote connections:**

   Edit `/etc/postgresql/[version]/main/postgresql.conf`:
   ```
   listen_addresses = '*'
   ```

   Edit `/etc/postgresql/[version]/main/pg_hba.conf`:
   ```
   host    all             all             192.168.1.0/24          md5
   ```

   Restart PostgreSQL:
   ```bash
   sudo systemctl restart postgresql
   ```

3. **Start the API server:**
   ```bash
   cd nodejs-api
   npm start
   ```

4. **Configure firewall to allow port 3000:**
   ```bash
   # Linux (ufw)
   sudo ufw allow 3000/tcp

   # Or iptables
   sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
   ```

### On Laptop B (Django Website)

1. **Update Django API configuration:**

   Edit `baneloforecasting/settings.py`:
   ```python
   # Replace localhost with Laptop A's IP address
   API_BASE_URL = os.getenv('API_BASE_URL', 'http://192.168.1.100:3000')
   ```

2. **Or use environment variable:**
   ```bash
   export API_BASE_URL=http://192.168.1.100:3000
   python manage.py runserver 0.0.0.0:8000
   ```

3. **Test connection:**
   ```bash
   curl http://192.168.1.100:3000/api/health
   ```

## 📊 Database Schema Requirements

The API expects these tables to exist in PostgreSQL:

### products
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    category VARCHAR(100),
    price DECIMAL(10,2),
    quantity DECIMAL(10,2),
    inventory_a DECIMAL(10,2) DEFAULT 0,
    inventory_b DECIMAL(10,2) DEFAULT 0,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(50),
    image_uri TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### recipes
```sql
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255) UNIQUE NOT NULL,
    product_firebase_id VARCHAR(255),
    product_name VARCHAR(255),
    product_number INTEGER,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### recipe_ingredients
```sql
CREATE TABLE recipe_ingredients (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(255) UNIQUE NOT NULL,
    recipe_firebase_id VARCHAR(255),
    ingredient_firebase_id VARCHAR(255),
    ingredient_name VARCHAR(255),
    quantity_needed DECIMAL(10,2),
    unit VARCHAR(50),
    created_at TIMESTAMP
);
```

## 🔒 Security Considerations

1. **Never commit `.env` file** - It contains sensitive database credentials
2. **Use strong PostgreSQL passwords**
3. **Restrict CORS origins** to only your Django website
4. **Use HTTPS in production** (consider nginx reverse proxy)
5. **Implement authentication** for sensitive endpoints (future enhancement)
6. **Keep dependencies updated**: `npm audit` and `npm update`

## 📝 Logs

The API server logs all requests:

```
[2025-11-26T10:30:45.123Z] GET /api/products
Executed query { text: 'SELECT * FROM products...', duration: 25, rows: 42 }
```

Monitor logs for:
- Database connection errors
- Slow queries
- Failed requests
- CORS issues

## 🆘 Support

If you encounter issues:

1. Check the API server logs
2. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-[version]-main.log`
3. Verify network connectivity between laptops
4. Test endpoints with `curl` or Postman
5. Check Django logs for API connection errors

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
cd nodejs-api
npm update
npm audit fix
```

### Backup Database

```bash
pg_dump -U postgres banelo_db > backup_$(date +%Y%m%d).sql
```

### Monitoring

Consider using PM2 for production:

```bash
npm install -g pm2
pm2 start server.js --name banelo-api
pm2 save
pm2 startup
```

---

**Note:** This API server must be running on Laptop A (where PostgreSQL is installed) for the Django website on Laptop B to function properly.
