import express from 'express';
import multer from 'multer';
import ipfsService from '../services/ipfs.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * POST /ipfs/upload
 * Upload file to IPFS via Pinata
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ 
        error: 'IPFS service not configured',
        message: 'Add PINATA_JWT to environment variables'
      });
    }

    const { buffer, originalname, mimetype, size } = req.file;

    console.log(`Uploading file: ${originalname} (${size} bytes, ${mimetype})`);

    // Upload to IPFS
    const result = await ipfsService.uploadFile(buffer, originalname, {
      mimetype,
      uploadedBy: req.body.walletAddress || 'unknown'
    });

    res.json({
      success: true,
      cid: result.cid,
      url: result.url,
      filename: result.filename,
      size: result.size
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload to IPFS'
    });
  }
});

/**
 * POST /ipfs/upload-text
 * Upload text content to IPFS
 */
router.post('/upload-text', async (req, res) => {
  try {
    const { content, name } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'No content provided' });
    }

    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ 
        error: 'IPFS service not configured',
        message: 'Add PINATA_JWT to environment variables'
      });
    }

    // Upload text to IPFS
    const result = await ipfsService.uploadText(content, name || 'submission.txt');

    res.json({
      success: true,
      cid: result.cid,
      url: result.url,
      size: result.size
    });
  } catch (error) {
    console.error('IPFS text upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to upload text to IPFS'
    });
  }
});

/**
 * POST /ipfs/pin-cid
 * Pin existing CID to Pinata
 */
router.post('/pin-cid', async (req, res) => {
  try {
    const { cid } = req.body;

    if (!cid) {
      return res.status(400).json({ error: 'CID required' });
    }

    if (!ipfsService.validateCID(cid)) {
      return res.status(400).json({ error: 'Invalid CID format' });
    }

    if (!ipfsService.isConfigured()) {
      return res.status(503).json({ 
        error: 'IPFS service not configured',
        message: 'Add PINATA_JWT to environment variables'
      });
    }

    // Pin CID
    const result = await ipfsService.pinByCID(cid);

    res.json({
      success: true,
      cid: result.cid,
      url: result.url
    });
  } catch (error) {
    console.error('IPFS pin error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to pin CID'
    });
  }
});

/**
 * GET /ipfs/validate/:cid
 * Validate CID format
 */
router.get('/validate/:cid', (req, res) => {
  try {
    const { cid } = req.params;
    const isValid = ipfsService.validateCID(cid);

    res.json({
      valid: isValid,
      cid,
      url: isValid ? ipfsService.getGatewayUrl(cid) : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /ipfs/status
 * Check IPFS service status
 */
router.get('/status', (req, res) => {
  res.json({
    configured: ipfsService.isConfigured(),
    service: 'Pinata',
    gateway: 'https://gateway.pinata.cloud/ipfs/'
  });
});

export default router;
