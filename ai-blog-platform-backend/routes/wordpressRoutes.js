// New routes/wordpressRoutes.js - WordPress management routes
const express = require('express');
const router = express.Router();
const wordpressService = require('../services/wordpressService');
const Company = require('../models/Company');
const { validateWordPressConfig } = require('../middleware/validation');

// Test WordPress connection for a company
router.post('/test-connection/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const result = await wordpressService.testConnection(companyId);
    
    if (result.success) {
      res.json({
        message: 'WordPress connection successful',
        ...result
      });
    } else {
      res.status(400).json({
        message: 'WordPress connection failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Failed to test WordPress connection',
      error: error.message
    });
  }
});

// Update WordPress configuration for a company
router.put('/config/:companyId', validateWordPressConfig, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { baseUrl, username, appPassword, isActive = true } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyId,
      {
        'wordpressConfig.baseUrl': baseUrl,
        'wordpressConfig.username': username,
        'wordpressConfig.appPassword': appPassword,
        'wordpressConfig.isActive': isActive,
        'wordpressConfig.connectionStatus': 'not-tested'
      },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Test the new configuration
    const testResult = await wordpressService.testConnection(companyId);

    res.json({
      message: 'WordPress configuration updated',
      company: {
        id: company._id,
        name: company.name,
        wordpressConfig: {
          baseUrl: company.wordpressConfig.baseUrl,
          username: company.wordpressConfig.username,
          isActive: company.wordpressConfig.isActive,
          connectionStatus: company.wordpressConfig.connectionStatus
        }
      },
      connectionTest: testResult
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update WordPress configuration',
      error: error.message
    });
  }
});

// Get WordPress status for all companies
router.get('/status', async (req, res) => {
  try {
    const statusData = await wordpressService.getAllWordPressSitesStatus();
    res.json(statusData);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get WordPress status',
      error: error.message
    });
  }
});

// Get WordPress configuration for a company (without sensitive data)
router.get('/config/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId).select('name wordpressConfig');
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({
      companyId: company._id,
      companyName: company.name,
      wordpressConfig: {
        baseUrl: company.wordpressConfig?.baseUrl,
        username: company.wordpressConfig?.username,
        isActive: company.wordpressConfig?.isActive,
        connectionStatus: company.wordpressConfig?.connectionStatus,
        lastConnectionTest: company.wordpressConfig?.lastConnectionTest
        // Note: appPassword is not returned for security
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get WordPress configuration',
      error: error.message
    });
  }
});

module.exports = router;