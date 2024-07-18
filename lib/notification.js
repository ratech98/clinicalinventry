const Notification = require("../modal/notification");

// Function to create a notification
const  createNotification = async (recipientType, recipientId, content, clinicId = null) => {
  try {
    const notificationData = {
      recipientType,
      recipientId,
      content,
    };

    if (clinicId) {
      notificationData.clinicId = clinicId;
    }

    const notification = new Notification(notificationData);

    await notification.save();
    console.log('Notification sent successfully',notification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports={createNotification}