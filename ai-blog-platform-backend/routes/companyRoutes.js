// routes/companyRoutes.js
const express = require('express');
const Company = require('../models/Company');
const googleSheetsService = require('../services/googleSheetsService');
const router = express.Router();

// GET all companies - fetch from Google Sheets directly
router.get('/', async (req, res) => {
  try {
    let companies = [];

    // Try to fetch from Google Sheets first
    if (process.env.COMPANY_DATA_SPREADSHEET_ID) {
      try {
        const sheetsData = await googleSheetsService.syncCompanyDataSheet(
          process.env.COMPANY_DATA_SPREADSHEET_ID
        );

        // Transform Google Sheets data to match frontend expectations
        companies = sheetsData.map((company, index) => ({
          id: company.name.toLowerCase().replace(/\s+/g, '-') + '-' + index,
          companyName: company.name,
          servicesOffered: Array.isArray(company.servicesOffered)
            ? company.servicesOffered.map(s => s.name || s).join(', ')
            : company.servicesOffered || '',
          serviceOverview: company.serviceOverview ? company.serviceOverview.substring(0, 200) + '...' : '',
          aboutTheCompany: company.aboutCompany ? company.aboutCompany.substring(0, 150) + '...' : ''
        }));

        console.log(`✅ Fetched ${companies.length} companies from Google Sheets`);
      } catch (sheetsError) {
        console.warn('⚠️ Google Sheets fetch failed, falling back to database:', sheetsError.message);
      }
    }

    // Fallback to database if Google Sheets fails
    if (companies.length === 0) {
      const dbCompanies = await Company.find({ isActive: true }).sort({ name: 1 });
      companies = dbCompanies.map(company => ({
        id: company._id,
        companyName: company.name,
        servicesOffered: Array.isArray(company.servicesOffered)
          ? company.servicesOffered.map(s => s.name || s).join(', ')
          : company.servicesOffered || '',
        serviceOverview: company.serviceOverview,
        aboutTheCompany: company.aboutCompany
      }));
    }

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET company by ID
router.get('/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new company
router.post('/', async (req, res) => {
  try {
    const company = new Company(req.body);
    const savedCompany = await company.save();
    res.status(201).json(savedCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update company
router.put('/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;