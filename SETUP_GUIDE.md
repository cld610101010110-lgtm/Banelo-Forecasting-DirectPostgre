# Banelo Coffee POS - Complete Setup Guide

## 🎯 System Overview

Your Banelo Coffee POS system consists of three main components:

```
┌────────────────────────────────────────────────────────────────┐
│                    LAPTOP A (Database Server)                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Mobile POS App │  │  PostgreSQL DB  │  │  Node.js API    ││
│  │  (Android/Room) │◄─┤  Port 5432      │◄─┤  Port 3000      ││
│  └─────────────────┘  └─────────────────┘  └────────┬────────┘│
└──────────────────────────────────────────────────────┼─────────┘
                                                        │
                                              Network Connection
                                                        │
┌──────────────────────────────────────────────────────┼─────────┐
│                    LAPTOP B (Web Dashboard)          │         │
│  ┌──────────────────────────────────────────────────┴───────┐ │
│  │         Django Website (Port 8000)                       │ │
│  │  - Inventory Management    - Waste Tracking              │ │
│  │  - Recipe Management       - Audit Trail                 │ │
│  │  - Forecasting             - Account Management          │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## 🔧 What Was Fixed

### ❌ Problems Before:
1. Recipe edit/delete buttons didn't work
2. Product deletion didn't work
3. Inventory A→B transfer didn't work
4. Beverage/pastry servings not calculated
5. Images uploading to Cloudinary but not displaying

### ✅ Solutions Implemented:
1. **Created Node.js API Server** - The missing link between Django and PostgreSQL
2. **Fixed serving calculations** - Now properly calculates based on ingredient stock
3. **Implemented all CRUD operations** - Recipes, products, inventory transfers all working
4. **Proper architecture** - Follows your two-laptop setup requirement

---

## 📥 Part 1: Setup on Laptop A (Database Server)

### Step 1: Verify PostgreSQL is Installed and Running

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql
```

### Step 2: Verify Database Exists

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# List databases
\l

# If banelo_db doesn't exist, create it:
CREATE DATABASE banelo_db;

# Connect to your database
\c banelo_db

# Verify tables exist (should see: products, recipes, recipe_ingredients, sales, waste_logs, audit_trail)
\dt

# Exit
\q
```

### Step 3: Install Node.js (if not already installed)

```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, install Node.js v18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Step 4: Install and Configure Node.js API Server

```bash
# Navigate to the project directory
cd /path/to/Banelo-Forecasting-DirectPostgre/nodejs-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit the .env file with your actual database credentials
nano .env
```

**Edit `.env` file:**
```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_POSTGRESQL_PASSWORD_HERE

# API Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration (Add Laptop B's IP address)
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.1.XXX:8000
```

**Important:** Replace:
- `YOUR_ACTUAL_POSTGRESQL_PASSWORD_HERE` with your PostgreSQL password
- `192.168.1.XXX` with Laptop B's actual IP address

### Step 5: Test Database Connection

```bash
# Test PostgreSQL connection
psql -U postgres -d banelo_db -c "SELECT COUNT(*) FROM products;"

# If you get an error about authentication, you may need to set a password:
sudo -u postgres psql
ALTER USER postgres PASSWORD 'your_password_here';
\q
```

### Step 6: Start the Node.js API Server

```bash
cd nodejs-api

# Start the server
npm start
```

You should see:
```
============================================================
🚀 Banelo Coffee POS API Server
============================================================
📡 Server running on: http://localhost:3000
🌍 Environment: production
🗄️  Database: banelo_db @ localhost
✅ CORS enabled for: http://localhost:8000, ...
============================================================
⏳ Waiting for requests...
```

### Step 7: Test API Endpoints

Open another terminal and test:

```bash
# Test health check
curl http://localhost:3000/api/health

# Should return:
# {"status":"healthy","message":"Banelo API Server is running",...}

# Test products endpoint
curl http://localhost:3000/api/products

# Test recipes endpoint
curl http://localhost:3000/api/recipes
```

### Step 8: Configure API Server to Auto-Start (Optional but Recommended)

Using PM2 for production:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start API server with PM2
cd /path/to/Banelo-Forecasting-DirectPostgre/nodejs-api
pm2 start server.js --name banelo-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Check status
pm2 status
```

### Step 9: Configure Firewall (Allow Port 3000)

```bash
# If using UFW
sudo ufw allow 3000/tcp
sudo ufw reload

# If using iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables-save
```

### Step 10: Find Your Laptop A IP Address

```bash
# Get your local network IP address
ip addr show | grep "inet " | grep -v 127.0.0.1

# Or simply:
hostname -I

# Example output: 192.168.1.100
# Note this IP address - you'll need it for Laptop B
```

---

## 🌐 Part 2: Setup on Laptop B (Web Dashboard)

### Step 1: Update Django Configuration

```bash
# Navigate to Django project
cd /path/to/Banelo-Forecasting-DirectPostgre/baneloforecasting

# Edit settings.py to point to Laptop A's API
nano baneloforecasting/settings.py
```

Find the line with `API_BASE_URL` and update it:

```python
# Replace 'localhost' with Laptop A's IP address
API_BASE_URL = os.getenv('API_BASE_URL', 'http://192.168.1.100:3000')
```

**Or use environment variable (recommended):**

```bash
# Create a .env file in Django project root
cd /path/to/Banelo-Forecasting-DirectPostgre/baneloforecasting
nano .env
```

Add:
```env
API_BASE_URL=http://192.168.1.100:3000
API_TIMEOUT=30
```

Replace `192.168.1.100` with Laptop A's actual IP address.

### Step 2: Install/Update Django Dependencies

```bash
# Activate virtual environment (if using one)
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# If requirements.txt doesn't exist, install these:
pip install django requests python-dotenv
```

### Step 3: Test Connection to API Server

```bash
# Test if Laptop B can reach Laptop A's API
curl http://192.168.1.100:3000/api/health

# Should return:
# {"status":"healthy",...}
```

If this fails:
- Check if both laptops are on the same network
- Verify Laptop A's firewall allows port 3000
- Ping Laptop A: `ping 192.168.1.100`

### Step 4: Start Django Server

```bash
cd /path/to/Banelo-Forecasting-DirectPostgre/baneloforecasting

# Run migrations (if needed)
python manage.py migrate

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

### Step 5: Test the Website

Open a browser and go to:
- `http://localhost:8000` or `http://127.0.0.1:8000`

Login and test:
1. **Inventory Page** - Should show products with serving calculations
2. **Recipe Management** - Try editing/deleting recipes
3. **Inventory Transfer** - Try transferring from Inventory A to B
4. **Product Deletion** - Try deleting a product

---

## ✅ Verification Checklist

### On Laptop A:
- [ ] PostgreSQL is running
- [ ] Database `banelo_db` exists with all tables
- [ ] Node.js is installed (v14+)
- [ ] npm dependencies installed in `nodejs-api/`
- [ ] `.env` file configured with correct credentials
- [ ] API server starts without errors
- [ ] Can access `http://localhost:3000/api/health`
- [ ] Firewall allows port 3000
- [ ] Know your local IP address

### On Laptop B:
- [ ] Django project has correct API_BASE_URL
- [ ] Can reach API server: `curl http://LAPTOP_A_IP:3000/api/health`
- [ ] Django server starts without errors
- [ ] Can login to website
- [ ] Can view inventory with serving calculations
- [ ] Can edit/delete recipes
- [ ] Can transfer inventory A→B
- [ ] Can delete products

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to API server"

**Symptoms:** Django shows errors, API calls fail

**Solutions:**
1. Check if API server is running on Laptop A:
   ```bash
   pm2 status  # or check terminal where npm start is running
   ```

2. Verify API URL in Django:
   ```bash
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.API_BASE_URL)
   ```

3. Test network connectivity:
   ```bash
   ping 192.168.1.100  # Laptop A's IP
   curl http://192.168.1.100:3000/api/health
   ```

4. Check firewall on Laptop A:
   ```bash
   sudo ufw status
   sudo ufw allow 3000/tcp
   ```

### Problem: "Recipe edit/delete still not working"

**Solutions:**
1. Check browser console for errors (F12 → Console tab)
2. Verify API server is receiving requests (check API server logs)
3. Test endpoints directly:
   ```bash
   # Get recipes
   curl http://LAPTOP_A_IP:3000/api/recipes

   # Delete recipe (replace RECIPE_ID)
   curl -X DELETE http://LAPTOP_A_IP:3000/api/recipes/RECIPE_ID
   ```

### Problem: "Serving calculations show 0 or None"

**Solutions:**
1. Verify recipes have ingredients assigned
2. Check that ingredient products exist in inventory
3. Ensure `inventory_b` has stock (transfer from A to B first)
4. Check Django logs for calculation errors:
   ```bash
   # Look for "🧮 Calculating max servings" in logs
   python manage.py runserver  # Check terminal output
   ```

### Problem: "Inventory transfer not working"

**Solutions:**
1. Verify product has stock in `inventory_a`
2. Check API server logs for errors
3. Test transfer endpoint:
   ```bash
   curl -X POST http://LAPTOP_A_IP:3000/api/products/transfer \
     -H "Content-Type: application/json" \
     -d '{"firebaseId":"PRODUCT_ID","quantity":10}'
   ```

### Problem: "Images not displaying"

**Solutions:**
1. Check if `image_uri` field in database contains valid Cloudinary URL
2. Verify URL format: `https://res.cloudinary.com/...`
3. Update product with image:
   ```sql
   UPDATE products
   SET image_uri = 'https://res.cloudinary.com/your-cloud/image/upload/...'
   WHERE firebase_id = 'PRODUCT_ID';
   ```

### Problem: "Database connection refused"

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. Verify PostgreSQL accepts connections:
   ```bash
   sudo nano /etc/postgresql/[version]/main/postgresql.conf
   # Ensure: listen_addresses = 'localhost' or '*'

   sudo systemctl restart postgresql
   ```

3. Check credentials in `.env` file

### Problem: "CORS errors in browser"

**Solutions:**
1. Update `ALLOWED_ORIGINS` in Node.js API `.env` file
2. Include Laptop B's IP address
3. Restart API server after changing `.env`

---

## 🚀 Production Deployment Tips

### 1. Use Process Manager for Node.js API

```bash
# Install PM2
sudo npm install -g pm2

# Start with PM2
cd nodejs-api
pm2 start server.js --name banelo-api

# Auto-restart on crashes
pm2 save

# Start on system boot
pm2 startup
```

### 2. Use Nginx Reverse Proxy (Optional)

For HTTPS and better security:

```nginx
server {
    listen 80;
    server_name laptop-a.local;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Regular Backups

```bash
# Backup PostgreSQL database
pg_dump -U postgres banelo_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automate with cron (daily at 2 AM)
crontab -e
# Add: 0 2 * * * pg_dump -U postgres banelo_db > /backups/banelo_$(date +\%Y\%m\%d).sql
```

### 4. Monitoring

```bash
# Monitor API server logs
pm2 logs banelo-api

# Monitor PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Monitor disk space
df -h
```

### 5. Security Hardening

```bash
# Change default PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'strong_random_password_here';

# Restrict PostgreSQL to localhost only
sudo nano /etc/postgresql/[version]/main/postgresql.conf
# Set: listen_addresses = 'localhost'

# Use environment variables for all secrets (never commit .env files)
```

---

## 📊 Database Schema Reference

### Products Table
```sql
Table: products
- id (INTEGER, Primary Key)
- firebase_id (VARCHAR, Unique)
- name (VARCHAR)
- category (VARCHAR) - 'beverage', 'pastries', 'ingredients'
- price (DECIMAL)
- quantity (DECIMAL) - Legacy field, synced with inventory_b
- inventory_a (DECIMAL) - Main warehouse stock
- inventory_b (DECIMAL) - Operational stock
- cost_per_unit (DECIMAL)
- unit (VARCHAR) - 'g', 'ml', 'pcs'
- image_uri (TEXT) - Cloudinary URL
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Recipes Table
```sql
Table: recipes
- id (INTEGER, Primary Key)
- firebase_id (VARCHAR, Unique)
- product_firebase_id (VARCHAR) - Links to products.firebase_id
- product_name (VARCHAR)
- product_number (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Recipe Ingredients Table
```sql
Table: recipe_ingredients
- id (INTEGER, Primary Key)
- firebase_id (VARCHAR, Unique)
- recipe_firebase_id (VARCHAR) - Links to recipes.firebase_id
- ingredient_firebase_id (VARCHAR) - Links to products.firebase_id
- ingredient_name (VARCHAR)
- quantity_needed (DECIMAL)
- unit (VARCHAR)
- created_at (TIMESTAMP)
```

---

## 📞 Support

If you encounter issues not covered in this guide:

1. **Check Logs:**
   - API Server: `pm2 logs banelo-api` or check terminal
   - Django: Check terminal where `runserver` is running
   - PostgreSQL: `sudo tail -f /var/log/postgresql/*.log`

2. **Test Components:**
   - Database: `psql -U postgres -d banelo_db -c "SELECT COUNT(*) FROM products;"`
   - API: `curl http://localhost:3000/api/health`
   - Network: `ping LAPTOP_A_IP`

3. **Common Commands:**
   ```bash
   # Restart API server
   pm2 restart banelo-api

   # Restart PostgreSQL
   sudo systemctl restart postgresql

   # Check ports in use
   sudo netstat -tulpn | grep -E '3000|5432|8000'

   # View Django database
   python manage.py dbshell
   ```

---

## 🎉 Success Indicators

Your system is working correctly when:

✅ API server shows "healthy" status
✅ Django website loads without errors
✅ Inventory page shows products with serving calculations
✅ Recipe edit/delete buttons work
✅ Inventory transfer A→B works
✅ Product deletion works
✅ Waste logging works
✅ Audit trail records all actions

**Congratulations! Your Banelo Coffee POS system is now fully operational! 🚀**
