// services/googleSheetsService.js
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class GoogleSheetsService {
  getAuth() {
    try {
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
        throw new Error('Missing Google Sheets credentials');
      }

      return new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
    } catch (error) {
      console.error('Google Auth setup error:', error);
      throw error;
    }
  }

  async syncBlogDataSheet(spreadsheetId, sheetTitle = 'Manual Keywords') {
    try {
      const doc = new GoogleSpreadsheet(spreadsheetId, this.getAuth());
      await doc.loadInfo();
      
      const sheet = doc.sheetsByTitle[sheetTitle];
      if (!sheet) {
        throw new Error(`Sheet "${sheetTitle}" not found`);
      }

      const rows = await sheet.getRows();
      const blogData = rows.map(row => {
        const articleFormat = row.get('Article Format') || row.get('article_format') || '';
        const normalizedFormat = articleFormat.toLowerCase().replace(/\s+/g, '-');

        return {
          focusKeyword: row.get('Focus Keyword') || row.get('focus_keyword'),
          articleFormat: normalizedFormat,
          wordCount: parseInt(row.get('Word Count') || row.get('word_count')) || 1000,
          targetAudience: row.get('Target Audience') || row.get('target_audience'),
          objective: row.get('Objective') || row.get('objective'),
          priority: parseInt(row.get('Priority')) || 1,
          status: row.get('Status')?.toLowerCase() || 'pending'
        };
      }).filter(item => item.focusKeyword);

      return blogData;
    } catch (error) {
      console.error('Google Sheets sync error:', error);
      throw error;
    }
  }

  async syncCompanyDataSheet(spreadsheetId, sheetTitle = 'Wattmonk KT') {
    try {
      const doc = new GoogleSpreadsheet(spreadsheetId, this.getAuth());
      await doc.loadInfo();
      
      const sheet = doc.sheetsByTitle[sheetTitle];
      if (!sheet) {
        throw new Error(`Sheet "${sheetTitle}" not found`);
      }

      const rows = await sheet.getRows();
      const companyData = rows.map(row => ({
        name: row.get('Company Name') || row.get('company_name'),
        servicesOffered: (row.get('Services Offered') || row.get('services_offered') || '')
          .split(',')
          .map(service => ({
            name: service.trim(),
            description: ''
          })),
        serviceOverview: row.get('Service Overview') || row.get('service_overview'),
        aboutCompany: row.get('About The Company') || row.get('about_company'),
        tone: (row.get('Tone') || row.get('tone') || 'professional').toLowerCase(),
        brandVoice: row.get('Brand Voice') || row.get('brand_voice'),
        targetAudience: (row.get('Target Audience') || row.get('target_audience') || '')
          .split(',')
          .map(audience => audience.trim())
          .filter(audience => audience.length > 0)
      })).filter(item => item.name);

      return companyData;
    } catch (error) {
      console.error('Company data sync error:', error);
      throw error;
    }
  }

  async getKeywordsFromSheet(spreadsheetId, sheetTitle = 'Manual Keywords') {
    try {
      const doc = new GoogleSpreadsheet(spreadsheetId, this.getAuth());
      await doc.loadInfo();

      const sheet = doc.sheetsByTitle[sheetTitle];
      if (!sheet) {
        throw new Error(`Sheet "${sheetTitle}" not found`);
      }

      const rows = await sheet.getRows();
      const keywords = rows.map(row => {
        const articleFormat = row.get('Article Format') || row.get('article_format') || '';
        const normalizedFormat = articleFormat.toLowerCase().replace(/\s+/g, '-');

        return {
          focusKeyword: row.get('Focus Keyword') || row.get('focus_keyword'),
          articleFormat: normalizedFormat,
          wordCount: row.get('Word Count') || row.get('word_count') || '2000-2500',
          targetAudience: row.get('Target Audience') || row.get('target_audience'),
          objective: row.get('Objective') || row.get('objective'),
          source: 'manual'
        };
      }).filter(item => item.focusKeyword);

      return keywords;
    } catch (error) {
      console.error('Keywords fetch error:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();