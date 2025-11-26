# 🌐 Banelo Website Setup Guide
## Connecting Django Website (Laptop B) to PostgreSQL Database (Laptop A)

---

## 📌 System Overview

Your capstone project has **two main components**:

1. **Laptop A** (Mobile POS machine):
   - ✅ Mobile POS App (100% connected to PostgreSQL)
   - ✅ PostgreSQL Database (`banelo_db`)
   - 🔧 Node.js API Server (needs to be started)

2. **Laptop B** (Website machine):
   - 🌐 Django Website (inventory management)
   - Connects to Node.js API on Laptop A

---

## 🚀 Step-by-Step Setup

### **STEP 1: Find Laptop A's IP Address**

On Laptop A (Mobile POS machine), open Command Prompt and run:

```bash
ipconfig
```

Look for **IPv4 Address** under your active network adapter (WiFi or Ethernet).
Example: `192.168.254.176`

**Important:** Both laptops must be on the **same WiFi network**!

---

### **STEP 2: Setup Node.js API on Laptop A**

#### 2.1 Copy the `nodejs-api` folder to Laptop A

From this repository, copy the entire `nodejs-api` folder to Laptop A.

#### 2.2 Install Dependencies

On Laptop A, open Command Prompt in the `nodejs-api` folder:

```bash
cd nodejs-api
npm install
```

#### 2.3 Configure the API

Edit the `.env` file in `nodejs-api` folder:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banelo_db
DB_USER=postgres
# DB_PASSWORD=   (leave empty if no password)

# API Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration - UPDATE THIS with Laptop B's IP!
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.x.x:8000
```

**Replace `192.168.x.x` with Laptop B's IP address** (find using `ipconfig` on Laptop B)

#### 2.4 Start the Node.js API Server

```bash
npm start
```

You should see:
```
🚀 Banelo Coffee POS API Server
📡 Server running on: http://localhost:3000
🗄️  Database: banelo_db @ localhost
✅ Connected to PostgreSQL database
```

**Keep this terminal window open!** The server must run continuously.

---

### **STEP 3: Configure Django Website on Laptop B**

#### 3.1 Update API URL

On Laptop B, edit `baneloforecasting/baneloforecasting/settings.py`:

Find this line:
```python
API_BASE_URL = os.getenv('API_BASE_URL', 'http://192.168.254.176:3000')
```

**Replace `192.168.254.176` with Laptop A's actual IP address** (from Step 1)

Or create a `.env` file in the `baneloforecasting` folder:

```env
API_BASE_URL=http://192.168.x.x:3000
API_TIMEOUT=30
```

#### 3.2 Start Django Server

On Laptop B:

```bash
cd baneloforecasting
python manage.py runserver 0.0.0.0:8000
```

---

## ✅ Testing the Connection

### Test 1: API Health Check

On Laptop B, open browser and visit:
```
http://LAPTOP_A_IP:3000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "message": "Banelo API Server is running"
}
```

### Test 2: Django Connection

On Laptop B, visit:
```
http://localhost:8000/dashboard/
```

Login and check if data loads properly.

---

## 🐛 Troubleshooting

### Issue 1: "Connection refused" or "Cannot reach API server"

**Solutions:**
1. ✅ Verify Node.js API is running on Laptop A
2. ✅ Check both laptops are on same WiFi
3. ✅ Verify IP addresses are correct
4. ✅ Turn off firewalls temporarily to test
5. ✅ Ensure PostgreSQL is running on Laptop A

### Issue 2: "CORS policy error"

**Solution:** Make sure Laptop B's IP is in `ALLOWED_ORIGINS` in `nodejs-api/.env`

### Issue 3: Recipe edit/delete not working

**Check:**
1. ✅ Node.js API is running
2. ✅ Check browser console for errors (F12)
3. ✅ Verify API endpoints in Django settings

### Issue 4: Inventory transfer not working

**Check:**
1. ✅ Products have sufficient stock in Inventory A
2. ✅ Check Network tab in browser (F12) for API errors
3. ✅ Verify transfer button is calling correct endpoint

---

## 📊 Current Configuration Summary

| Component | Location | Port | Database |
|-----------|----------|------|----------|
| PostgreSQL | Laptop A | 5432 | banelo_db |
| Node.js API | Laptop A | 3000 | → PostgreSQL |
| Django Website | Laptop B | 8000 | → Node.js API |
| Mobile POS | Laptop A | - | → PostgreSQL |

---

## 🔧 Quick Reference: API Endpoints

All endpoints are prefixed with `http://LAPTOP_A_IP:3000/api/`

### Products
- `GET /products` - List all products
- `POST /products/transfer` - Transfer inventory A→B

### Recipes
- `GET /recipes` - List all recipes
- `POST /recipes` - Create recipe
- `PUT /recipes/:id` - Update recipe
- `DELETE /recipes/:id` - Delete recipe

### Sales
- `GET /sales` - List sales

### Waste
- `POST /waste` - Record waste
- `GET /waste-logs` - View waste logs

---

## 📝 Notes

1. **Pastries are already recipe-based**: The code treats pastries the same as beverages (see `views.py` line 1204-1210)

2. **Inventory System**: Uses dual inventory (A & B)
   - Inventory A: Main warehouse stock
   - Inventory B: Operational/expendable stock

3. **Keep Node.js API running**: Don't close the terminal on Laptop A when using the website

---

## 🆘 Need Help?

If issues persist:
1. Check Node.js API terminal for error messages
2. Check Django terminal for error messages
3. Check browser console (F12) for JavaScript errors
4. Verify PostgreSQL is running: `psql -U postgres -d banelo_db -c "\dt"`

---

**Last Updated:** 2025-11-26
