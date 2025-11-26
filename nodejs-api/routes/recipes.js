/**
 * Recipes API Routes
 */

const express = require('express');
const router = express.Router();
const { query, pool } = require('../config/database');

// ============================================
// GET /api/recipes - Get all recipes with ingredients
// ============================================
router.get('/', async (req, res) => {
  try {
    // Get all recipes
    const recipesResult = await query(`
      SELECT * FROM recipes ORDER BY product_name ASC
    `);

    const recipes = [];

    // For each recipe, get its ingredients
    for (const recipe of recipesResult.rows) {
      const ingredientsResult = await query(
        `SELECT * FROM recipe_ingredients WHERE recipe_firebase_id = $1`,
        [recipe.firebase_id]
      );

      recipes.push({
        id: recipe.firebase_id,
        productFirebaseId: recipe.product_firebase_id,
        productName: recipe.product_name,
        productNumber: recipe.product_number,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        ingredients: ingredientsResult.rows.map(ing => ({
          id: ing.firebase_id,
          ingredientFirebaseId: ing.ingredient_firebase_id,
          ingredientName: ing.ingredient_name,
          quantity: ing.quantity_needed,
          quantityNeeded: ing.quantity_needed,
          unit: ing.unit
        }))
      });
    }

    res.json({
      success: true,
      data: recipes,
      count: recipes.length
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipes',
      error: error.message
    });
  }
});

// ============================================
// GET /api/recipes/:id - Get single recipe
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get recipe
    const recipeResult = await query(
      'SELECT * FROM recipes WHERE firebase_id = $1',
      [id]
    );

    if (recipeResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const recipe = recipeResult.rows[0];

    // Get ingredients
    const ingredientsResult = await query(
      'SELECT * FROM recipe_ingredients WHERE recipe_firebase_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        id: recipe.firebase_id,
        productFirebaseId: recipe.product_firebase_id,
        productName: recipe.product_name,
        productNumber: recipe.product_number,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        ingredients: ingredientsResult.rows.map(ing => ({
          id: ing.firebase_id,
          ingredientFirebaseId: ing.ingredient_firebase_id,
          ingredientName: ing.ingredient_name,
          quantity: ing.quantity_needed,
          quantityNeeded: ing.quantity_needed,
          unit: ing.unit
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe',
      error: error.message
    });
  }
});

// ============================================
// POST /api/recipes - Create new recipe
// ============================================
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      productFirebaseId,
      productName,
      productNumber,
      ingredients
    } = req.body;

    // Validate inputs
    if (!productFirebaseId || !productName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: productFirebaseId and productName'
      });
    }

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one ingredient is required'
      });
    }

    await client.query('BEGIN');

    // Generate unique firebase_id for recipe
    const recipeFirebaseId = `recipe_${productFirebaseId}_${Date.now()}`;

    // Insert recipe
    const recipeResult = await client.query(
      `INSERT INTO recipes
       (firebase_id, product_firebase_id, product_name, product_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [recipeFirebaseId, productFirebaseId, productName, productNumber || 0]
    );

    // Insert ingredients
    for (const ingredient of ingredients) {
      const ingredientFirebaseId = `ingredient_${recipeFirebaseId}_${ingredient.ingredientFirebaseId}_${Date.now()}`;

      await client.query(
        `INSERT INTO recipe_ingredients
         (firebase_id, recipe_firebase_id, ingredient_firebase_id, ingredient_name, quantity_needed, unit, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          ingredientFirebaseId,
          recipeFirebaseId,
          ingredient.ingredientFirebaseId,
          ingredient.ingredientName,
          ingredient.quantityNeeded,
          ingredient.unit || 'g'
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Recipe for ${productName} created successfully`,
      data: {
        id: recipeFirebaseId,
        ...recipeResult.rows[0]
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recipe',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/recipes/:id - Update recipe
// ============================================
router.put('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
      productFirebaseId,
      productName,
      productNumber,
      ingredients
    } = req.body;

    // Check if recipe exists
    const checkResult = await client.query(
      'SELECT * FROM recipes WHERE firebase_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    await client.query('BEGIN');

    // Update recipe
    await client.query(
      `UPDATE recipes
       SET product_firebase_id = $1, product_name = $2, product_number = $3, updated_at = NOW()
       WHERE firebase_id = $4`,
      [productFirebaseId, productName, productNumber || 0, id]
    );

    // Delete old ingredients
    await client.query(
      'DELETE FROM recipe_ingredients WHERE recipe_firebase_id = $1',
      [id]
    );

    // Insert new ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        const ingredientFirebaseId = `ingredient_${id}_${ingredient.ingredientFirebaseId}_${Date.now()}`;

        await client.query(
          `INSERT INTO recipe_ingredients
           (firebase_id, recipe_firebase_id, ingredient_firebase_id, ingredient_name, quantity_needed, unit, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            ingredientFirebaseId,
            id,
            ingredient.ingredientFirebaseId,
            ingredient.ingredientName,
            ingredient.quantityNeeded,
            ingredient.unit || 'g'
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Recipe for ${productName} updated successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recipe',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/recipes/:id - Delete recipe
// ============================================
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // Check if recipe exists
    const checkResult = await client.query(
      'SELECT * FROM recipes WHERE firebase_id = $1',
      [id]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const productName = checkResult.rows[0].product_name;

    await client.query('BEGIN');

    // Delete ingredients first (foreign key constraint)
    await client.query(
      'DELETE FROM recipe_ingredients WHERE recipe_firebase_id = $1',
      [id]
    );

    // Delete recipe
    await client.query(
      'DELETE FROM recipes WHERE firebase_id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Recipe for ${productName} deleted successfully`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recipe',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================
// GET /api/recipes/:id/ingredients - Get recipe ingredients
// ============================================
router.get('/:id/ingredients', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM recipe_ingredients WHERE recipe_firebase_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: result.rows.map(ing => ({
        id: ing.firebase_id,
        ingredientFirebaseId: ing.ingredient_firebase_id,
        ingredientName: ing.ingredient_name,
        quantity: ing.quantity_needed,
        quantityNeeded: ing.quantity_needed,
        unit: ing.unit
      })),
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching recipe ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recipe ingredients',
      error: error.message
    });
  }
});

module.exports = router;
