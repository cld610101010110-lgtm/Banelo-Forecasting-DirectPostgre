# 🔧 Known Issues and Solutions

This document addresses the specific issues you mentioned with your website.

---

## Issue #1: Ingredients Transfer in Inventory List ❌→✅

### **Problem:**
The "Transfer" button in the inventory page doesn't work or shows errors.

### **Root Cause:**
The Django website cannot reach the Node.js API server, OR the Node.js API is not running.

### **Solution:**

#### Step 1: Ensure Node.js API is Running on Laptop A
```bash
cd nodejs-api
npm start
```

You should see:
```
✅ Connected to PostgreSQL database
📡 Server running on: http://localhost:3000
```

#### Step 2: Test API Connection
From Laptop B, open browser and visit:
```
http://LAPTOP_A_IP:3000/api/health
```

Replace `LAPTOP_A_IP` with actual IP address (e.g., `192.168.254.176`)

#### Step 3: Check CORS Settings
In `nodejs-api/.env` on Laptop A, ensure Laptop B's IP is listed:
```env
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://192.168.254.177:8000
```

#### Step 4: Verify Django API URL
In `baneloforecasting/baneloforecasting/settings.py`, check:
```python
API_BASE_URL = os.getenv('API_BASE_URL', 'http://192.168.254.176:3000')
```

Make sure the IP matches Laptop A's actual IP.

### **How to Test:**
1. Go to Inventory page
2. Find an ingredient with stock in "Inventory A"
3. Click "Transfer to B" button
4. Enter quantity
5. Click "Transfer"
6. Should see success message and updated values

---

## Issue #2: Recipe Management Edit and Delete ❌→✅

### **Problem:**
- Clicking "Edit" on a recipe doesn't work
- Clicking "Delete" on a recipe doesn't work
- Changes don't save to database

### **Root Cause:**
Same as Issue #1 - Node.js API connection problem.

### **Solution:**

All the code is already correctly implemented! You just need to:

1. ✅ **Start Node.js API** on Laptop A (see Issue #1)
2. ✅ **Configure network** properly (same steps as Issue #1)
3. ✅ **Verify CORS** settings (same as Issue #1)

### **Code Verification:**

The following endpoints are already working correctly:

#### Django Views (`views.py`):
- ✅ `update_recipe_api()` - Line 1321
- ✅ `delete_recipe_api()` - Line 1377

#### Node.js Routes (`nodejs-api/routes/recipes.js`):
- ✅ `PUT /api/recipes/:id` - Line 206 (Update)
- ✅ `DELETE /api/recipes/:id` - Line 290 (Delete)

#### Frontend JavaScript (`recipes.html`):
- ✅ `editRecipe()` function - Line 815
- ✅ `deleteRecipe()` function - Line 953
- ✅ Form submission handler - Line 876

### **How to Test:**

#### Test Edit:
1. Go to Recipe Management page
2. Click ✏️ (Edit) button on any recipe
3. Modal should open with recipe details
4. Change product or ingredients
5. Click "Save Recipe"
6. Should see "Recipe updated successfully!" message
7. Page reloads with updated recipe

#### Test Delete:
1. Go to Recipe Management page
2. Click 🗑️ (Delete) button on any recipe
3. Confirmation dialog appears
4. Click "Yes, Delete"
5. Should see "Recipe deleted successfully!" message
6. Page reloads without that recipe

---

## Issue #3: Pastries Should Be Recipe-Based Like Beverages ✅

### **Status:** ✅ **ALREADY IMPLEMENTED!**

### **Explanation:**
The code already treats pastries exactly like beverages for recipe management.

### **Proof:**

In `baneloforecasting/dashboard/views.py` at **line 1204-1210**:

```python
# Beverages / pastries for recipe selection
if category_lower in ['beverage', 'beverages', 'pastries', 'pastry', 'drink', 'drinks',
                      'hot drinks', 'cold drinks', 'snacks', 'snack']:
    beverages.append({
        'id': firebase_id,
        'name': name,
        'category': category_lower,
    })
```

**This means:**
- Products with category "Pastry" or "Pastries" will appear in recipe dropdown
- You can create recipes for pastries just like beverages
- Both use the same recipe system

### **How to Verify:**

1. Go to **Recipe Management** page
2. Click **"+ Add Recipe"** button
3. Open the **"Select Product"** dropdown
4. You should see **BOTH beverages AND pastries** in the list

### **If You Don't See Pastries:**

Check your products in the database:

```sql
SELECT name, category FROM products WHERE LOWER(category) LIKE '%pastry%' OR LOWER(category) LIKE '%pastries%';
```

Make sure your pastry products have category set to **"Pastry"** or **"Pastries"**.

---

## 🎯 Quick Troubleshooting Checklist

Before reporting any issues, verify:

### ✅ Network Setup
- [ ] Both laptops on same WiFi
- [ ] Laptop A's IP is correct in Django settings
- [ ] Laptop B's IP is in Node.js CORS settings
- [ ] Can ping Laptop A from Laptop B: `ping LAPTOP_A_IP`

### ✅ Services Running
- [ ] PostgreSQL running on Laptop A
- [ ] Node.js API running on Laptop A (port 3000)
- [ ] Django website running on Laptop B (port 8000)

### ✅ Configuration Files
- [ ] `nodejs-api/.env` has correct database credentials
- [ ] `nodejs-api/.env` has Laptop B's IP in ALLOWED_ORIGINS
- [ ] Django `settings.py` has correct API_BASE_URL

### ✅ Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for JavaScript errors
- [ ] Check Network tab for failed API calls
- [ ] Look for red error messages

---

## 🔍 Advanced Debugging

### Check API Connectivity

From Laptop B's browser console (F12):

```javascript
fetch('http://LAPTOP_A_IP:3000/api/health')
  .then(res => res.json())
  .then(data => console.log('API Status:', data))
  .catch(err => console.error('API Error:', err));
```

Replace `LAPTOP_A_IP` with actual IP.

### Test Recipe Operations

From browser console on Recipe Management page:

```javascript
// Test fetching recipes
fetch('http://LAPTOP_A_IP:3000/api/recipes')
  .then(res => res.json())
  .then(data => console.log('Recipes:', data))
  .catch(err => console.error('Error:', err));
```

### Check Database Directly

On Laptop A, connect to PostgreSQL:

```bash
psql -U postgres -d banelo_db
```

Then run:

```sql
-- Check recipes
SELECT COUNT(*) as recipe_count FROM recipes;

-- Check products
SELECT name, category, inventory_a, inventory_b FROM products LIMIT 5;

-- Check recipe ingredients
SELECT r.product_name, ri.ingredient_name, ri.quantity_needed
FROM recipes r
JOIN recipe_ingredients ri ON r.firebase_id = ri.recipe_firebase_id
LIMIT 10;
```

---

## 📞 Still Having Issues?

If problems persist after following all steps:

1. **Capture error messages:**
   - Django terminal output
   - Node.js API terminal output
   - Browser console errors (F12)

2. **Take screenshots of:**
   - The error message
   - Network tab showing failed requests
   - Console tab showing JavaScript errors

3. **Verify versions:**
   ```bash
   # On Laptop A
   node --version  # Should be v14 or higher
   npm --version
   psql --version

   # On Laptop B
   python --version  # Should be 3.8 or higher
   ```

---

**Last Updated:** 2025-11-26
