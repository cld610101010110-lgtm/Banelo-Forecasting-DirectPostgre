/**
 * Sales API Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================
// GET /api/sales - Get all sales
// ============================================
router.get('/', async (req, res) => {
  try {
    const { limit, date_from, date_to } = req.query;

    let queryText = 'SELECT * FROM sales WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (date_from) {
      queryText += ` AND order_date >= $${paramCount++}`;
      values.push(date_from);
    }

    if (date_to) {
      queryText += ` AND order_date <= $${paramCount++}`;
      values.push(date_to);
    }

    queryText += ' ORDER BY order_date DESC';

    if (limit) {
      queryText += ` LIMIT $${paramCount++}`;
      values.push(parseInt(limit));
    }

    const result = await query(queryText, values);

    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales',
      error: error.message
    });
  }
});

// ============================================
// GET /api/sales/summary - Get sales summary
// ============================================
router.get('/summary', async (req, res) => {
  try {
    const { period } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(order_date) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = '';
    }

    const summaryQuery = `
      SELECT
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        SUM(quantity) as total_items_sold,
        AVG(total) as average_order_value
      FROM sales
      WHERE 1=1 ${dateFilter}
    `;

    const result = await query(summaryQuery);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales summary',
      error: error.message
    });
  }
});

module.exports = router;
