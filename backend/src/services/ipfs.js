import { PinataSDK } from 'pinata-web3';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

/**
 * IPFS Service using Pinata
 * Handles file uploads to IPFS and CID management
 */
class IPFSService {
  constructor() {
    if (!process.env.PINATA_JWT) {
      console.warn('⚠️  PINATA_JWT not configured - IPFS uploads will fail');
      this.pinata = null;
    } else {
      this.pinata = new PinataSDK({
        pinataJwt: process.env.PINATA_JWT
      });
      console.log('✅ Pinata IPFS service initialized');
    }
  }

  /**
   * Upload file buffer to IPFS
   * @param {Buffer} fileBuffer - File data as buffer
   * @param {string} filename - Original filename
   * @param {object} metadata - Optional metadata
   * @returns {Promise<{cid: string, url: string, size: number}>}
   */
  async uploadFile(fileBuffer, filename, metadata = {}) {
    if (!this.pinata) {
      throw new Error('Pinata not configured. Add PINATA_JWT to .env');
    }

    try {
      console.log(`Uploading file to IPFS: ${filename} (${fileBuffer.length} bytes)`);

      // Create a File object from buffer
      const file = new File([fileBuffer], filename);

      // Upload to Pinata
      const upload = await this.pinata.upload.file(file);

      const cid = upload.IpfsHash;
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

      console.log(`✅ File uploaded to IPFS: ${cid}`);

      return {
        cid,
        url: gatewayUrl,
        size: fileBuffer.length,
        filename
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`Failed to upload to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload text content to IPFS
   * @param {string} content - Text content
   * @param {string} name - Content name/identifier
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadText(content, name = 'submission.txt') {
    if (!this.pinata) {
      throw new Error('Pinata not configured. Add PINATA_JWT to .env');
    }

    try {
      console.log(`Uploading text to IPFS: ${name}`);

      // Convert text to File
      const file = new File([content], name, { type: 'text/plain' });

      // Upload to Pinata
      const upload = await this.pinata.upload.file(file);

      const cid = upload.IpfsHash;
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

      console.log(`✅ Text uploaded to IPFS: ${cid}`);

      return {
        cid,
        url: gatewayUrl,
        size: content.length
      };
    } catch (error) {
      console.error('IPFS text upload error:', error);
      throw new Error(`Failed to upload text to IPFS: ${error.message}`);
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param {object} data - JSON data
   * @param {string} name - File name
   * @returns {Promise<{cid: string, url: string}>}
   */
  async uploadJSON(data, name = 'data.json') {
    if (!this.pinata) {
      throw new Error('Pinata not configured. Add PINATA_JWT to .env');
    }

    try {
      console.log(`Uploading JSON to IPFS: ${name}`);

      // Upload JSON directly
      const upload = await this.pinata.upload.json(data);

      const cid = upload.IpfsHash;
      const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

      console.log(`✅ JSON uploaded to IPFS: ${cid}`);

      return {
        cid,
        url: gatewayUrl
      };
    } catch (error) {
      console.error('IPFS JSON upload error:', error);
      throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
    }
  }

  /**
   * Validate CID format
   * @param {string} cid - IPFS CID to validate
   * @returns {boolean}
   */
  validateCID(cid) {
    if (!cid || typeof cid !== 'string') return false;
    
    // CIDv0: starts with Qm, 46 characters
    const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    
    // CIDv1: starts with b, followed by base32
    const cidv1Regex = /^b[a-z2-7]{58}$/;
    
    return cidv0Regex.test(cid) || cidv1Regex.test(cid);
  }

  /**
   * Get gateway URL from CID
   * @param {string} cid - IPFS CID
   * @returns {string}
   */
  getGatewayUrl(cid) {
    if (!this.validateCID(cid)) {
      throw new Error('Invalid CID format');
    }
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  /**
   * Pin existing CID (if you have a CID from elsewhere)
   * @param {string} cid - IPFS CID to pin
   * @returns {Promise<{success: boolean}>}
   */
  async pinByCID(cid) {
    if (!this.pinata) {
      throw new Error('Pinata not configured. Add PINATA_JWT to .env');
    }

    if (!this.validateCID(cid)) {
      throw new Error('Invalid CID format');
    }

    try {
      console.log(`Pinning CID: ${cid}`);
      
      await this.pinata.pin.cid(cid);

      console.log(`✅ CID pinned: ${cid}`);

      return {
        success: true,
        cid,
        url: this.getGatewayUrl(cid)
      };
    } catch (error) {
      console.error('IPFS pin error:', error);
      throw new Error(`Failed to pin CID: ${error.message}`);
    }
  }

  /**
   * Check if service is configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.pinata !== null;
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
