require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// Load Firebase service account key from .env
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint to send FCM notifications
app.post('/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;

  console.log('[DEBUG] Received request to send FCM notification');
  console.log('[DEBUG] Token:', token);
  console.log('[DEBUG] Title:', title);
  console.log('[DEBUG] Body:', body);
  console.log('[DEBUG] Data:', data);

  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            priority: 'high',
          },
        },
      },
    };

    console.log('[DEBUG] Sending FCM message:', message);
    const response = await admin.messaging().send(message);
    console.log('[DEBUG] Successfully sent FCM message:', response);
    res.status(200).json({ success: true, message: 'Notification sent successfully', response });
  } catch (error) {
    console.error('[DEBUG] Error sending FCM message:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[DEBUG] Server running on port ${PORT}`);
});
