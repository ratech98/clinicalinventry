const { errormesaages } = require("../errormessages");
const Notification = require("../modal/notification");

const getNotifications=async (req, res) => {
    try {
      const { recipientId, clinicId, read } = req.query;
  
      if (!recipientId) {
        return res.status(400).json({ error: 'recipientId is required' });
      }
  
      const filter = {
        recipientId
      };
  
      if (clinicId) {
        filter.clinicId = clinicId;
      }
  
      if (read !== undefined) {
        filter.read = read === 'true';
      }
  
      const notifications = await Notification.find(filter).sort({ createdAt: -1 });
  
      res.status(200).json({success:true,message:"notifications fetched successfully",notifications:notifications});
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

const readnotification= async (req, res) => {
    try {
      const { id } = req.params;
      const { read } = req.body;
  
      if (read === undefined) {
        return res.status(400).json({ error: 'read status is required' });
      }
  
      const notification = await Notification.findByIdAndUpdate(id, { read }, { new: true });
  
      if (!notification) {
        return res.status(404).json({success:false, error:errormesaages[1038],errorcode:1038  });
      }
  
      res.status(200).json(notification);
    } catch (error) {
      console.error('Error updating notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  const deleteNotifications = async (req, res) => {
    try {
      const { ids } = req.body;
  
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: 'Invalid input. IDs should be an array.' });
      }
  
      const result = await Notification.deleteMany({
        _id: { $in: ids }
      });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'No notifications found', errorcode: 1109 });
      }
  
      res.json({ success: true, message: "notifications deleted successfully", deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  module.exports={
                    getNotifications,
                    readnotification,
                    deleteNotifications

  }