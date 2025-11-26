/**
 * Audit Logs API Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ============================================
// GET /api/audit-logs - Get all audit logs
// ============================================
router.get('/', async (req, res) => {
  try {
    const { limit, user, action, date_from, date_to } = req.query;

    let queryText = 'SELECT * FROM audit_trail WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (user) {
      queryText += ` AND user_name = $${paramCount++}`;
      values.push(user);
    }

    if (action) {
      queryText += ` AND action = $${paramCount++}`;
      values.push(action);
    }

    if (date_from) {
      queryText += ` AND timestamp >= $${paramCount++}`;
      values.push(date_from);
    }

    if (date_to) {
      queryText += ` AND timestamp <= $${paramCount++}`;
      values.push(date_to);
    }

    queryText += ' ORDER BY timestamp DESC';

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
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// ============================================
// POST /api/audit-logs - Add audit log
// ============================================
router.post('/', async (req, res) => {
  try {
    const { action, user_id, user_name, details } = req.body;

    if (!action || !user_id || !user_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: action, user_id, and user_name'
      });
    }

    const result = await query(
      `INSERT INTO audit_trail
       (action, user_id, user_name, details, timestamp)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [action, user_id, user_name, details || '']
    );

    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audit log',
      error: error.message
    });
  }
});

module.exports = router;
