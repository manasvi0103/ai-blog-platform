// services/s3Service.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class S3Service {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
    
    if (!this.bucketName) {
      console.warn('⚠️ AWS_S3_BUCKET_NAME not configured. S3 uploads will fail.');
    }
    
    console.log(`🪣 S3 Service initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Upload a buffer or file to S3
   * @param {Buffer|string} data - Buffer data or file path
   * @param {string} fileName - Name for the file in S3
   * @param {string} contentType - MIME type of the file
   * @param {string} folder - Optional folder prefix (e.g., 'images', 'uploads')
   * @returns {Promise<Object>} Upload result with S3 URL
   */
  async uploadToS3(data, fileName, contentType = 'image/jpeg', folder = 'images') {
    try {
      let fileBuffer;
      
      // Handle different data types
      if (typeof data === 'string') {
        // If data is a file path, read the file
        fileBuffer = fs.readFileSync(data);
      } else if (Buffer.isBuffer(data)) {
        // If data is already a buffer
        fileBuffer = data;
      } else {
        throw new Error('Data must be a file path string or Buffer');
      }

      // Create S3 key with folder structure
      const s3Key = folder ? `${folder}/${fileName}` : fileName;
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: 'public-read', // Make images publicly accessible
        CacheControl: 'max-age=31536000', // Cache for 1 year
        Metadata: {
          'uploaded-by': 'ai-blog-platform',
          'upload-timestamp': new Date().toISOString()
        }
      };

      console.log(`📤 Uploading to S3: ${s3Key} (${fileBuffer.length} bytes)`);
      
      const result = await this.s3.upload(uploadParams).promise();
      
      console.log(`✅ Successfully uploaded to S3: ${result.Location}`);
      
      return {
        success: true,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        size: fileBuffer.length,
        contentType: contentType
      };
      
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Upload an AI-generated image to S3
   * @param {Buffer} imageBuffer - Image data buffer
   * @param {string} prompt - The prompt used to generate the image
   * @param {string} source - Source of the image (e.g., 'gemini', 'pollinations')
   * @returns {Promise<Object>} Upload result
   */
  async uploadAIImage(imageBuffer, prompt, source = 'ai') {
    try {
      // Create a descriptive filename
      const timestamp = Date.now();
      const sanitizedPrompt = prompt.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const fileName = `${source}-${sanitizedPrompt}-${timestamp}.jpg`;
      
      const result = await this.uploadToS3(
        imageBuffer, 
        fileName, 
        'image/jpeg', 
        'ai-generated'
      );
      
      return {
        ...result,
        prompt: prompt,
        source: source,
        fileName: fileName
      };
      
    } catch (error) {
      console.error('❌ AI image upload to S3 failed:', error);
      throw error;
    }
  }

  /**
   * Upload a user-uploaded image to S3
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Upload result
   */
  async uploadUserImage(file) {
    try {
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const fileName = `user-upload-${timestamp}${fileExtension}`;
      
      const result = await this.uploadToS3(
        file.path, // File path from multer
        fileName,
        file.mimetype,
        'user-uploads'
      );
      
      // Clean up temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Cleaned up temporary file: ${file.path}`);
      }
      
      return {
        ...result,
        originalName: file.originalname,
        uploadedSize: file.size
      };
      
    } catch (error) {
      console.error('❌ User image upload to S3 failed:', error);
      throw error;
    }
  }

  /**
   * Delete an image from S3
   * @param {string} s3Key - The S3 key of the file to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteFromS3(s3Key) {
    try {
      const deleteParams = {
        Bucket: this.bucketName,
        Key: s3Key
      };
      
      await this.s3.deleteObject(deleteParams).promise();
      console.log(`🗑️ Successfully deleted from S3: ${s3Key}`);
      
      return true;
    } catch (error) {
      console.error('❌ S3 delete failed:', error);
      return false;
    }
  }

  /**
   * Check if S3 is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    );
  }

  /**
   * Test S3 connection by listing bucket contents
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      if (!this.isConfigured()) {
        console.log('⚠️ S3 not configured properly');
        return false;
      }
      
      const params = {
        Bucket: this.bucketName,
        MaxKeys: 1
      };
      
      await this.s3.listObjectsV2(params).promise();
      console.log('✅ S3 connection test successful');
      return true;
    } catch (error) {
      console.error('❌ S3 connection test failed:', error);
      return false;
    }
  }
}

module.exports = new S3Service();
