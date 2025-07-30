// scripts/updateDraftStatus.js
// Script to update existing drafts with proper status field

const mongoose = require('mongoose');
const Draft = require('../models/Draft');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog-platform');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateDraftStatuses = async () => {
  try {
    console.log('🔄 Updating draft statuses...');

    // Get all drafts
    const drafts = await Draft.find({});
    console.log(`📊 Found ${drafts.length} drafts to update`);

    let updated = 0;

    for (const draft of drafts) {
      let newStatus = 'keyword_selection'; // Default

      // Determine status based on existing data
      if (draft.wordpressStatus === 'published') {
        newStatus = 'ready_to_publish';
      } else if (draft.wordpressStatus === 'draft') {
        newStatus = 'ready_to_publish';
      } else if (draft.generatedContent && draft.generatedContent.generatedAt) {
        newStatus = 'content_review';
      } else if (draft.selectedH1 && draft.selectedMetaTitle && draft.selectedMetaDescription) {
        newStatus = 'meta_selection';
      } else if (draft.selectedKeyword) {
        newStatus = 'meta_generation';
      }

      // Update the draft
      await Draft.findByIdAndUpdate(draft._id, { status: newStatus });
      updated++;

      console.log(`✅ Updated draft ${draft._id}: ${newStatus}`);
    }

    console.log(`🎉 Successfully updated ${updated} drafts`);
  } catch (error) {
    console.error('❌ Error updating draft statuses:', error);
  }
};

const main = async () => {
  await connectDB();
  await updateDraftStatuses();
  await mongoose.disconnect();
  console.log('✅ Script completed');
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { updateDraftStatuses };
