/ middleware/validation.js
const Joi = require('joi');

const validateCompany = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    servicesOffered: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow('')
      })
    ),
    serviceOverview: Joi.string().min(10).required(),
    aboutCompany: Joi.string().min(10).required(),
    tone: Joi.string().valid('professional', 'casual', 'technical', 'friendly', 'authoritative').required(),
    brandVoice: Joi.string().min(10).required(),
    targetAudience: Joi.array().items(Joi.string()),
    isActive: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateBlogData = (req, res, next) => {
  const schema = Joi.object({
    focusKeyword: Joi.string().min(2).max(200).required(),
    articleFormat: Joi.string().valid(
      'how-to', 'listicle', 'guide', 'comparison', 'review', 'news', 'case-study'
    ).required(),
    wordCount: Joi.number().min(300).max(5000).required(),
    targetAudience: Joi.string().min(5).required(),
    objective: Joi.string().min(10).required(),
    companyId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    priority: Joi.number().min(1).max(5),
    status: Joi.string().valid('pending', 'in-progress', 'completed', 'published'),
    seoScore: Joi.number().min(0).max(100)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateContentBlock = (req, res, next) => {
  const schema = Joi.object({
    blogId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    blockType: Joi.string().valid(
      'h1', 'h2', 'h3', 'paragraph', 'list', 'image', 'quote', 'code'
    ).required(),
    content: Joi.string().min(1).required(),
    order: Joi.number().min(1).required(),
    metadata: Joi.object({
      wordCount: Joi.number(),
      aiGenerated: Joi.boolean(),
      source: Joi.string(),
      keywords: Joi.array().items(Joi.string()),
      citations: Joi.array().items(
        Joi.object({
          url: Joi.string().uri(),
          title: Joi.string(),
          description: Joi.string()
        })
      )
    }),
    isSelected: Joi.boolean(),
    alternatives: Joi.array().items(
      Joi.object({
        content: Joi.string(),
        source: Joi.string(),
        createdAt: Joi.date()
      })
    )
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateKeyword = (req, res, next) => {
  const schema = Joi.object({
    keyword: Joi.string().min(2).max(200).required(),
    searchVolume: Joi.number().min(0),
    difficulty: Joi.number().min(0).max(100),
    cpc: Joi.number().min(0),
    competition: Joi.string().valid('low', 'medium', 'high'),
    relatedKeywords: Joi.array().items(Joi.string()),
    companyIds: Joi.array().items(
      Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
    )
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};
const validateWordPressConfig = (req, res, next) => {
  const schema = Joi.object({
    baseUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required(),
    username: Joi.string().min(3).max(60).required(),
    appPassword: Joi.string().min(20).required(), // WordPress app passwords are long
    isActive: Joi.boolean()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

const validateContentGeneration = (req, res, next) => {
  const schema = Joi.object({
    blogId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    blockType: Joi.string().valid(
      'h1', 'h2', 'h3', 'paragraph', 'list', 'image', 'quote', 'code'
    ).required(),
    prompt: Joi.string().min(10).max(1000).required(),
    companyContext: Joi.object({
      name: Joi.string(),
      tone: Joi.string(),
      brandVoice: Joi.string(),
      serviceOverview: Joi.string(),
      targetAudience: Joi.string()
    })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateCompany,
  validateBlogData,
  validateContentBlock,
  validateKeyword,
  validateContentGeneration,
  validateWordPressConfig
};
