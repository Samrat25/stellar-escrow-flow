import express from 'express';
import { supabase } from '../config/supabase.js';
import { isValidStellarAddress } from '../config/stellar.js';

const router = express.Router();

/**
 * POST /feedback
 * Submit user feedback
 */
router.post('/', async (req, res) => {
  try {
    const { walletAddress, feedbackText, rating } = req.body;

    if (!isValidStellarAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }

    if (!feedbackText || feedbackText.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback text required' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        wallet_address: walletAddress,
        feedback_text: feedbackText,
        rating: rating || null
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      feedbackId: data.id
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /feedback
 * Get all feedback (admin only in production)
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
