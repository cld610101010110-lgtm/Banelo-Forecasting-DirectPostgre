/**
 * Waste Logs API Routes
 */

const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');

// ============================================
// GET /api/waste-logs - Get all waste logs
// ============================================
router.get('/', async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    let queryText = 'SELECT * FROM waste_logs WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (date_from) {
      queryText += ` AND waste_date >= $${paramCount++}`;
      values.push(date_from);
    }

    if (date_to) {
      queryText += ` AND waste_date <= $${paramCount++}`;
      values.push(date_to);
    }

    queryText += ' ORDER BY waste_date DESC';

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching waste logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch waste logs',
      error: error.message
    });
  }
});

// ============================================
// POST /api/waste - Add waste log
// ============================================
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      productFirebaseId,
      productName,
      category,
      quantity,
      reason,
      recordedBy
    } = req.body;

    // Validate inputs
    if (!productFirebaseId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productFirebaseId and quantity'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    await client.query('BEGIN');

    // Get current product
    const productResult = await client.query(
      'SELECT * FROM products WHERE firebase_id = $1',
      [productFirebaseId]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    const currentInventoryB = parseFloat(product.inventory_b || 0);

    // Check if enough stock in B
    if (currentInventoryB < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in Inventory B. Available: ${currentInventoryB}, Requested: ${quantity}`
      });
    }

    // Create waste log
    await client.query(
      `INSERT INTO waste_logs
       (product_firebase_id, product_name, category, quantity, reason, recorded_by, waste_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [productFirebaseId, productName, category, quantity, reason, recordedBy || 'system']
    );

    // Update inventory_b
    const newInventoryB = currentInventoryB - quantity;
    await client.query(
      `UPDATE products
       SET inventory_b = $1, quantity = $1, updated_at = NOW()
       WHERE firebase_id = $2`,
      [newInventoryB, productFirebaseId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Successfully recorded ${quantity} units of ${productName} as waste`,
      newInventoryB: newInventoryB
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding waste log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add waste log',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
