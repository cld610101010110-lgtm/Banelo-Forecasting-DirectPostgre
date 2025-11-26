/**
 * Products API Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================
// GET /api/products - Get all products
// ============================================
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY name ASC');

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// ============================================
// GET /api/products/:id - Get single product
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM products WHERE firebase_id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// ============================================
// POST /api/products - Create new product
// ============================================
router.post('/', async (req, res) => {
  try {
    const {
      firebase_id,
      name,
      category,
      price,
      quantity,
      inventory_a,
      inventory_b,
      cost_per_unit,
      unit,
      image_uri
    } = req.body;

    const result = await query(
      `INSERT INTO products
       (firebase_id, name, category, price, quantity, inventory_a, inventory_b, cost_per_unit, unit, image_uri, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [firebase_id, name, category, price || 0, quantity || 0, inventory_a || 0, inventory_b || 0, cost_per_unit || 0, unit || 'pcs', image_uri || '']
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// ============================================
// PUT /api/products/:id - Update product
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      quantity,
      inventory_a,
      inventory_b,
      cost_per_unit,
      unit,
      image_uri
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }
    if (inventory_a !== undefined) {
      updates.push(`inventory_a = $${paramCount++}`);
      values.push(inventory_a);
    }
    if (inventory_b !== undefined) {
      updates.push(`inventory_b = $${paramCount++}`);
      values.push(inventory_b);
    }
    if (cost_per_unit !== undefined) {
      updates.push(`cost_per_unit = $${paramCount++}`);
      values.push(cost_per_unit);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }
    if (image_uri !== undefined) {
      updates.push(`image_uri = $${paramCount++}`);
      values.push(image_uri);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE firebase_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// ============================================
// DELETE /api/products/:id - Delete product
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const checkResult = await query(
      'SELECT * FROM products WHERE firebase_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productName = checkResult.rows[0].name;

    // Delete product
    await query(
      'DELETE FROM products WHERE firebase_id = $1',
      [id]
    );

    res.json({
      success: true,
      message: `Product "${productName}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// ============================================
// POST /api/products/transfer - Transfer inventory A to B
// ============================================
router.post('/transfer', async (req, res) => {
  try {
    const { firebaseId, quantity } = req.body;

    if (!firebaseId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firebaseId and quantity'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Get current product
    const productResult = await query(
      'SELECT * FROM products WHERE firebase_id = $1',
      [firebaseId]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    const currentInventoryA = parseFloat(product.inventory_a || 0);
    const currentInventoryB = parseFloat(product.inventory_b || 0);

    // Check if enough stock in A
    if (currentInventoryA < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in Inventory A. Available: ${currentInventoryA}, Requested: ${quantity}`
      });
    }

    // Calculate new values
    const newInventoryA = currentInventoryA - quantity;
    const newInventoryB = currentInventoryB + quantity;

    // Update product
    await query(
      `UPDATE products
       SET inventory_a = $1, inventory_b = $2, quantity = $2, updated_at = NOW()
       WHERE firebase_id = $3`,
      [newInventoryA, newInventoryB, firebaseId]
    );

    res.json({
      success: true,
      message: `Successfully transferred ${quantity} units to Inventory B`,
      newInventoryA: newInventoryA,
      newInventoryB: newInventoryB
    });
  } catch (error) {
    console.error('Error transferring inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer inventory',
      error: error.message
    });
  }
});

// ============================================
// PUT /api/products/:id/inventory - Update inventory
// ============================================
router.put('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory_a, inventory_b } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (inventory_a !== undefined) {
      updates.push(`inventory_a = $${paramCount++}`);
      values.push(inventory_a);
    }
    if (inventory_b !== undefined) {
      updates.push(`inventory_b = $${paramCount++}`);
      values.push(inventory_b);
      updates.push(`quantity = $${paramCount++}`);
      values.push(inventory_b); // Keep quantity in sync with inventory_b
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE products SET ${updates.join(', ')} WHERE firebase_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

module.exports = router;
