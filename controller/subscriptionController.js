// Subscription Controller

const errorMessages = require("../errormessages");
const { SubscriptionDuration, SubscriptionTitle } = require("../modal/subscription");


const addSubscriptionDuration = async (req, res) => {
  try {
    const { duration, pricePerMonth, discount, durationInNo, title } = req.body;
    const newDuration = await SubscriptionDuration.create({
      duration,
      pricePerMonth,
      discount,
      durationInNo,
      title,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Subscription duration added successfully",
        duration: newDuration,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSubscriptionDurations = async (req, res) => {
  try {
    const durations = await SubscriptionDuration.find();
    res.json({
      success: true,
      message: "Subscription durations fetched successfully",
      durations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSubscriptionDurationById = async (req, res) => {
  try {
    const duration = await SubscriptionDuration.findById(req.params.id);
    if (!duration) {
      return res
        .status(400)
        .json({ error: errorMessages[1032], errorcode: 1032 });
    }
    res.json({
      success: true,
      message: "Subscription duration fetched successfully",
      duration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSubscriptionDuration = async (req, res) => {
  try {
    const { duration, pricePerMonth, discount, durationInNo } = req.body;
    const updatedDuration = await SubscriptionDuration.findByIdAndUpdate(
      req.params.id,
      { duration, durationInNo, pricePerMonth, discount },
      { new: true }
    );
    if (!updatedDuration) {
      return res
        .status(400)
        .json({ error: errorMessages[1032], errorcode: 1032 });
    }
    res.json({
      success: true,
      message: "Subscription duration updated successfully",
      duration: updatedDuration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSubscriptionDuration = async (req, res) => {
  try {
    const deletedDuration = await SubscriptionDuration.findByIdAndDelete(
      req.params.id
    );
    if (!deletedDuration) {
        res.json({ error: errorMessages[1032], errorcode: 1032 });

    }
    res.json({
      success: true,
      message: "Subscription duration deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addSubscriptionTitle = async (req, res) => {
  try {
    const { title } = req.body;
    console.log(title);

    const newTitleName = title.toLowerCase();

    const existingTitle = await SubscriptionTitle.findOne({
      name: { $regex: new RegExp("^" + newTitleName, "i") },
    });
    if (existingTitle) {
      return res
        .status(400)
        .json({ error: errorMessages[1031], errorcode: 1031 });
    }

    const newTitle = await SubscriptionTitle.create({ title });

    res
      .status(200)
      .json({
        success: true,
        message: "Subscription Title added successfully",
        Title: newTitle,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSubscriptionTitles = async (req, res) => {
  try {
    const Titles = await SubscriptionTitle.find();
    res.json({
      success: true,
      message: "Subscription Titles fetched successfully",
      Titles,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSubscriptionTitleById = async (req, res) => {
  try {
    const Title = await SubscriptionTitle.findById(req.params.id);
    if (!Title) {
      return res
        .status(400)
        .json({ error: errorMessages[1031], errorcode: 1031});
    }
    res.json({
      success: true,
      message: "Subscription Title fetched successfully",
      Title,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSubscriptionTitle = async (req, res) => {
  try {
    const { title } = req.body;
    const updatedTitle = await SubscriptionTitle.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );
    if (!updatedTitle) {
      return res
        .status(400)
        .json({ error: errorMessages[1031], errorcode: 1031 });
    }
    res.json({
      success: true,
      message: "Subscription Title updated successfully",
      title: updatedTitle,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSubscriptionTitle = async (req, res) => {
  try {
    const deletedTitle = await SubscriptionTitle.findByIdAndDelete(
      req.params.id
    );
    if (!deletedTitle) {
      return res
        .status(400)
        .json({ error: errorMessages[1031], errorcode: 1031 });
    }
    res.json({
      success: true,
      message: "Subscription Title deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addSubscriptionDuration,
  getSubscriptionDurations,
  getSubscriptionDurationById,
  updateSubscriptionDuration,
  deleteSubscriptionDuration,
  addSubscriptionTitle,
  getSubscriptionTitles,
  getSubscriptionTitleById,
  updateSubscriptionTitle,
  deleteSubscriptionTitle,
 
};
