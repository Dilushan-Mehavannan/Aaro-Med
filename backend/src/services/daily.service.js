import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const createVideoRoom = async (consultationId) => {
  const roomName = `consult-${consultationId}`;
  if (!process.env.DAILY_API_KEY || process.env.DAILY_API_KEY === 'your_daily_api_key') {
    // Return a public Jitsi Meet URL when API key is not set
    return `https://meet.jit.si/smartdoctor-consult-${consultationId}`;
  }
  try {
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      { name: roomName, properties: { enable_chat: true, enable_screenshare: true, exp: Math.floor(Date.now() / 1000) + 3600 } },
      { headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data.url;
  } catch (err) {
    console.error('[DAILY.CO ERROR]', err.message);
    return `https://meet.jit.si/smartdoctor-consult-${consultationId}`;
  }
};
