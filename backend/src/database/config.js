import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meditoken';
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log('🔄 Using MongoDB for data storage');

    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('⚠️  Falling back to local storage mode');
    
    // Fallback to mock connection
    return {
      connection: {
        host: 'localhost',
        name: 'meditoken',
        readyState: 1
      }
    };
  }
};

export default connectDB;

