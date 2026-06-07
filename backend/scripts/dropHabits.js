const mongoose = require('mongoose');

async function dropHabits() {
  try {
    await mongoose.connect('mongodb://localhost:27017/life-os', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    const db = mongoose.connection;
    await db.collection('habits').drop();
    console.log('Habits collection dropped successfully.');
    
  } catch (err) {
    if (err.code === 26) {
      console.log('Habits collection does not exist.');
    } else {
      console.error('Error dropping habits:', err);
    }
  } finally {
    mongoose.disconnect();
  }
}

dropHabits();
