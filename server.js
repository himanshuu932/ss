const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint to send FCM notifications
app.post('/send-notification', async (req, res) => {
  const { token, title, body, data } = req.body;

  try {
    const message = {
      token: token,
      notification: {
        title: title,
        body: body,
      },
      data: data, // Optional: Add custom data
      android: {
        priority: 'high', // Ensure high priority for Android
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            priority: 'high', // Ensure high priority for iOS
          },
        },
      },
    };

    // Send the message
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.status(200).json({ success: true, message: 'Notification sent successfully', response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
