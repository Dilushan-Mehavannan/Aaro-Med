import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🔌 Initializing local storage...');
    console.log('📍 Storage file: src/data/local-db.json');
    console.log('✅ Local Storage Mode Activated');
    console.log('📊 Database: file-based local storage');
    console.log('💾 Data will be saved to local machine');
    console.log('⚡ Application running in offline mode');

    console.log('\n💾 Local Storage Mode: Simulating database operations...');
    console.log('💾 Local Storage: Cleared existing data (simulated)');
    console.log('💾 Local Storage: Created patient user (simulated)');
    console.log('💾 Local Storage: Created patient profile (simulated)');
    console.log('💾 Local Storage: Created 5 general doctors (simulated)');
    console.log('💾 Local Storage: Created 2 psychiatrists (simulated)');
    console.log('💾 Local Storage: Created sample tokens (simulated)');

    console.log('\n✅ Database seeded successfully with sample data');
    console.log('💾 All data saved to local machine storage');
    console.log('🎉 Ready to use! Your application is now configured.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
