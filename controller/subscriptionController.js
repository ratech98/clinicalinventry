// Subscription Controller

const errorMessages = require("../errormessages");
const { SubscriptionDuration, SubscriptionTitle, SubscriptionFeature, freetrail } = require("../modal/subscription");


const addSubscriptionDuration = async (req, res) => {
  try {
    const { duration, pricePerMonth, discount, durationInNo, title,feature } = req.body;
    const newDuration = await SubscriptionDuration.create({
      duration,
      pricePerMonth,
      discount,
      durationInNo,
      title,
      feature
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
    res.status(500).json({ error: error.message });
  }
};

const getSubscriptionDurations = async (req, res) => {
  try {
    const durations = await SubscriptionDuration.find().populate('title');
    res.json({
      success: true,
      message: "Subscription durations fetched successfully",
      durations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};

const updateSubscriptionDuration = async (req, res) => {
  try {
    const updatedDuration = await SubscriptionDuration.findByIdAndUpdate(
      req.params.id,
      req.body,
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
};
const addSubscriptionFeature = async (req, res) => {
  try {
    const { Feature,title } = req.body;

    const newFeatureName = req.body.Feature.toLowerCase();

    const existingFeature = await SubscriptionFeature.findOne({
      name: { $regex: new RegExp("^" + newFeatureName, "i") },
    });
    if (existingFeature) {
      return res
        .status(400)
        .json({ error: errorMessages[1035], errorcode: 1035 });
    }
    const newFeature = await SubscriptionFeature.create({ Feature,title });

    res
      .status(200)
      .json({
        success: true,
        message: "Subscription Feature added successfully",
        Feature: newFeature,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getfreetrail = async (req, res) => {
  try {
    const freetrails = await freetrail.find()
    res.json({
      success: true,
      message: "freetrail fetched successfully",
      freetrails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const addfreetrail = async (req, res) => {
  try {
    const { days } = req.body;


    const newFeature = await freetrail.create({days});

    res
      .status(200)
      .json({
        success: true,
        message: "Subscription Feature added successfully",
        freetrail: newFeature,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const getSubscriptionFeatureById = async (req, res) => {
  try {
    const Feature = await SubscriptionFeature.findById(req.params.id);
    if (!Feature) {
      return res
        .status(400)
        .json({ error: errorMessages[1036], errorcode: 1036 });
    }
    res.json({
      success: true,
      message: "Subscription Feature fetched successfully",
      Feature,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const updateSubscriptionFeature = async (req, res) => {
  try {
    const updatedFeature = await SubscriptionFeature.findByIdAndUpdate(
      req.params.id,
       req.body ,
      { new: true }
    );
    if (!updatedFeature) {
      return res
        .status(400)
        .json({ error: errorMessages[1036], errorcode: 1036 });
    }
    res.json({
      success: true,
      message: "Subscription Feature updated successfully",
      Feature: updatedFeature,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const deleteSubscriptionFeature = async (req, res) => {
  try {
    const deletedFeature = await SubscriptionFeature.findByIdAndDelete(
      req.params.id
    );
    if (!deletedFeature) {
      return res
        .status(400)
        .json({ error: errorMessages[1036], errorcode: 1036 });
    }
    res.json({
      success: true,
      message: "Subscription Feature deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
const updatefreetrail = async (req, res) => {
  try {
    const updatedFeature = await freetrail.findByIdAndUpdate(
      req.params.id,
       req.body ,
      { new: true }
    );
 
    res.json({
      success: true,
      message: "freetail updated successfully",
      freetrail: updatedFeature,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
  addSubscriptionFeature,
  updateSubscriptionFeature,
  deleteSubscriptionFeature,
  getSubscriptionFeatureById,
  getfreetrail,
  updatefreetrail,
  addfreetrail
 
};
