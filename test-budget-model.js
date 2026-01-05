const mongoose = require('mongoose');
require('dotenv').config();

async function testBudgetModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saraswati_puja');
    console.log('✅ Connected to MongoDB');
    
    // Define a simple budget schema for testing
    const budgetSchema = new mongoose.Schema({
      name: String,
      category: String,
      allocated: Number,
      spent: Number,
      remaining: Number
    });
    
    const Budget = mongoose.model('TestBudget', budgetSchema);
    
    // Create a test budget
    const testBudget = new Budget({
      name: 'Test Budget',
      category: 'test-category',
      allocated: 1000,
      spent: 200,
      remaining: 800
    });
    
    await testBudget.save();
    console.log('✅ Test budget saved successfully');
    
    // Test updating
    testBudget.spent = 300;
    testBudget.remaining = testBudget.allocated - testBudget.spent;
    await testBudget.save();
    console.log('✅ Test budget updated successfully');
    
    console.log('🎯 Final budget:', {
      allocated: testBudget.allocated,
      spent: testBudget.spent,
      remaining: testBudget.remaining
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

testBudgetModel();