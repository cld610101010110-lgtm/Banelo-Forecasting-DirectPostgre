# ⚡ Banelo Website - Quick Start Guide

**Goal:** Connect your Django website (Laptop B) to PostgreSQL database (Laptop A)

---

## 🎯 What You Have

- ✅ Mobile POS on Laptop A (100% working with PostgreSQL)
- ✅ PostgreSQL database on Laptop A (`banelo_db`)
- 🔧 Django website (needs connection to database)

---

## 🚀 3-Step Setup

### **STEP 1: On Laptop A (Mobile POS machine)**

#### 1.1 Find Your IP Address
```bash
ipconfig
```
Look for IPv4 Address (example: `192.168.254.176`)

#### 1.2 Start Node.js API Server
```bash
cd nodejs-api
npm install    # First time only
npm start      # Keep this running!
```

#### 1.3 Update CORS (if needed)
Edit `nodejs-api/.env`, add Laptop B's IP:
```env
ALLOWED_ORIGINS=http://localhost:8000,http://LAPTOP_B_IP:8000
```

---

### **STEP 2: On Laptop B (Website machine)**

#### 2.1 Update API URL
Edit `baneloforecasting/baneloforecasting/settings.py`:
```python
API_BASE_URL = os.getenv('API_BASE_URL', 'http://LAPTOP_A_IP:3000')
```
Replace `LAPTOP_A_IP` with the IP from Step 1.1

Or create `.env` file:
```env
API_BASE_URL=http://192.168.254.176:3000
```

#### 2.2 Start Django Server
```bash
cd baneloforecasting
python manage.py runserver 0.0.0.0:8000
```

---

### **STEP 3: Test Everything**

#### 3.1 Test API
Open browser on Laptop B:
```
http://LAPTOP_A_IP:3000/api/health
```

Should show:
```json
{"status": "healthy", "message": "Banelo API Server is running"}
```

#### 3.2 Test Website
```
http://localhost:8000/dashboard/
```

Login and verify:
- ✅ Products load
- ✅ Recipes load
- ✅ Can edit recipes
- ✅ Can delete recipes
- ✅ Can transfer inventory
- ✅ Pastries appear in recipe dropdown

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot reach API server" | ✅ Check Node.js API is running on Laptop A<br>✅ Verify IP address is correct<br>✅ Both laptops on same WiFi |
| "CORS error" | ✅ Add Laptop B's IP to `nodejs-api/.env` |
| "Recipe edit/delete not working" | ✅ Start Node.js API on Laptop A<br>✅ Check browser console (F12) for errors |
| "Inventory transfer fails" | ✅ Ensure product has stock in Inventory A<br>✅ Verify API connection |
| "Pastries not showing" | ✅ They ARE working! Check product category is "Pastry" or "Pastries" |

---

## 📚 More Documentation

- **WEBSITE_SETUP_GUIDE.md** - Complete setup instructions
- **ISSUES_AND_SOLUTIONS.md** - Detailed troubleshooting for all issues
- **nodejs-api/README_SETUP.md** - Node.js API server setup

---

## ✅ Success Checklist

Before using the website, ensure:

- [ ] PostgreSQL running on Laptop A
- [ ] Node.js API running on Laptop A (port 3000)
- [ ] Django website running on Laptop B (port 8000)
- [ ] Both laptops on same WiFi network
- [ ] IP addresses configured correctly
- [ ] Can access `http://LAPTOP_A_IP:3000/api/health`

---

## 📞 Quick Commands Reference

### On Laptop A:
```bash
# Check PostgreSQL is running
psql -U postgres -d banelo_db -c "\dt"

# Start Node.js API
cd nodejs-api && npm start

# Find IP address
ipconfig
```

### On Laptop B:
```bash
# Start Django
cd baneloforecasting && python manage.py runserver 0.0.0.0:8000

# Find IP address
ipconfig
```

---

**Need help?** Check **ISSUES_AND_SOLUTIONS.md** for detailed troubleshooting!
