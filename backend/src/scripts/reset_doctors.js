import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://dilushanmehavannan_db_user:9VdcbqyFtjCv1Rdo@cluster0.u6cs7wz.mongodb.net/smartdoctor?retryWrites=true&w=majority';

async function resetOnlineStatus() {
  try {
    await mongoose.connect(mongoUri);
    const result = await mongoose.connection.db.collection('doctors').updateMany({}, { $set: { is_online: false } });
    console.log('✅ Successfully reset all doctors to offline. Modified count:', result.modifiedCount);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

resetOnlineStatus();
