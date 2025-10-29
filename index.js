const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Expo
const expo = new Expo();

// --- Hardcoded list of push tokens ---
// In a real app, you would get these from a database
const PUSH_TOKENS = [
    "ExponentPushToken[TmKQo3M3GVyFY9IE_VPB1P]",
    // "ExponentPushToken[other_user_token_here]",
];

/**
 * Sends push notifications to a list of tokens
 * @param {string[]} tokens - An array of Expo push tokens
 * @param {string} title - The title of the notification
 * @param {string} body - The body message of the notification
 * @param {object} [data={}] - Optional data to send with the notification
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
    let messages = [];
    for (const pushToken of tokens) {
        // Check that it is a valid Expo push token
        if (!Expo.isExpoPushToken(pushToken)) {
            console.warn(`Invalid Expo push token: ${pushToken}`);
            continue;
        }
        
        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            sound: "default",
            title: title,
            body: body,
            channelId: "default", // Ensure you have a channel set up in your app
            priority: "high",
            data: data,
        });
    }

    // Send notifications in chunks
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    try {
        for (const chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            // NOTE: You could check ticketChunk for errors (e.g., 'DeviceNotRegistered')
            // and handle removing invalid tokens from your database
        }
    } catch (error) {
        console.error(`Error sending push notification:`, error);
    }
};

/**
 * Route to notify users of a price update
 * Triggered automatically by the admin panel on save.
 * NOW A POST request expecting a 'message'.
 */
app.post('/push', async (req, res) => {
    const { message } = req.body;

    // Use the provided message or a default one
    const notificationBody = message || `Gold and Silver prices have been updated. Check the app for live rates!`;

    try {
        await sendPushNotification(
            PUSH_TOKENS,
            `Price Update! 📉`, // Title
            notificationBody, // Dynamic body from admin
        );
        res.status(200).send("Price update notification sent successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send push notification.");
    }
});

/**
 * Route to notify users of a custom offer
 * Triggered manually from the admin panel.
 */
app.post('/notify-offer', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).send("Message body is required.");
    }

    try {
        await sendPushNotification(
            PUSH_TOKENS,
            `New Offer! 🌟`, // Offer title
            message, // Custom message from admin
        );
        res.status(200).send("Custom offer notification sent successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to send custom offer notification.");
    }
});
// --- END NEW ROUTE ---

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


