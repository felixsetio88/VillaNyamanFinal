// orderController.js
import Order from "../models/Order.js";
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import moment from 'moment';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';  
import { fileURLToPath } from 'url';

// Create a new order
export const createOrder = async (req, res) => {
  const newOrder = new Order(req.body);
  try {
      const savedOrder = await newOrder.save();
      return res.status(200).json(savedOrder);
  } catch (error) {
      alert("Failed to add new order!")
  }
};

// Get all orders made by all customers (admin access only)
export const getAllOrders = async (req, res, next) => {
  
  try {
    if (req.user.isAdmin) {
      console.log(req.user.isAdmin)
      console.log(req.user.firstname)
      const orders = await Order.find();
      res.status(200).json(orders);
    }
    return res.status(403).json({ message: 'Access denied' });
    
  } catch (err) {
    next(err);
  }
};

// Get orders made by the logged-in user
export const getMyOrders = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
   
    const orders = await Order.find({ user: user }).populate('hotel');
    console.log(user)
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('hotel');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete an order by ID
export const deleteOrder = async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json("Order has been deleted.");
  } catch (err) {
    next(err);
  }
};

export const confirmOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { confirmed: true }, { new: true });
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
}

export const cancelOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { canceled: true }, { new: true });
    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(500).json(err);
  }
}

export const getOrderStats = async (req, res) => {
  try {
    if(!req.user.isAdmin){
      return next(createError(400, "Sorry you must be an admin!"));
    }
      const startOfWeek = moment().startOf('isoWeek').toDate();
      const endOfWeek = moment().endOf('isoWeek').toDate();

      const totalRoomNumber = await Order.aggregate([
          { $group: { _id: null, totalRooms: { $sum: "$roomNumber" } } }
      ]);

      const totalAmount = await Order.aggregate([
          { $group: { _id: null, totalAmount: { $sum: "$total" } } }
      ]);

      const totalCanceled = await Order.countDocuments({ canceled: true });

      const totalRoomNumberThisWeek = await Order.aggregate([
          { $match: { orderDate: { $gte: startOfWeek, $lte: endOfWeek } } },
          { $group: { _id: null, totalRooms: { $sum: "$roomNumber" } } }
      ]);

      const totalAmountThisWeek = await Order.aggregate([
          { $match: { orderDate: { $gte: startOfWeek, $lte: endOfWeek } } },
          { $group: { _id: null, totalAmount: { $sum: "$total" } } }
      ]);

      const totalCanceledThisWeek = await Order.countDocuments({
          canceled: true,
          orderDate: { $gte: startOfWeek, $lte: endOfWeek }
      });


      const totalConfirmed = await Order.countDocuments({ confirmed: true });

      const totalProductListed = await Hotel.countDocuments();

      const totalProductViewed = await Hotel.aggregate([
        { $group: { _id: null, totalProductViewed: { $sum: "$viewed" } } }
    ]);

      const totalAccountRegistered = await User.countDocuments();

      const totalNotConfirmed = await Order.countDocuments({ confirmed: false });

      const totalConfirmedThisWeek = await Order.countDocuments({
          confirmed: true,
          orderDate: { $gte: startOfWeek, $lte: endOfWeek }
      });

      res.status(200).json({
          totalRoomNumber: totalRoomNumber[0]?.totalRooms || 0,
          totalAmount: totalAmount[0]?.totalAmount || 0,
          totalCanceled,
          totalRoomNumberThisWeek: totalRoomNumberThisWeek[0]?.totalRooms || 0,
          totalAmountThisWeek: totalAmountThisWeek[0]?.totalAmount || 0,
          totalCanceledThisWeek,
          totalConfirmed,
          totalConfirmedThisWeek,
          totalNotConfirmed,
          totalProductListed,
          totalAccountRegistered,
          totalProductViewed: totalProductViewed[0]?.totalProductViewed || 0,
          
      });
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
}

export const getRevenueGraph = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('isoWeek').toDate();
    const endOfWeek = moment().endOf('isoWeek').toDate();

    const startOfPreviousWeeks = [
      moment().subtract(1, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').startOf('isoWeek').toDate()
    ];
    const endOfPreviousWeeks = [
      moment().subtract(1, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').endOf('isoWeek').toDate()
    ];

    // Function to get total amount for a given date range
    const getTotalAmountForDateRange = async (start, end) => {
      const result = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalAmount: { $sum: "$total" } } }
      ]);
      return result[0]?.totalAmount || 0;
    };

    // Get total amount for the current week
    const totalAmountThisWeek = await getTotalAmountForDateRange(startOfWeek, endOfWeek);

    // Get total amount for previous weeks
    const totalAmountsForPreviousWeeks = await Promise.all(
      startOfPreviousWeeks.map((start, index) =>
        getTotalAmountForDateRange(start, endOfPreviousWeeks[index])
      )
    );

    // Combine results
    const data = {
      labels: ['This Week', 'A Week Ago', 'Two Weeks Ago', 'Three Weeks Ago'],
      datasets: [
        {
          label: 'Total Amount',
          data: [totalAmountThisWeek, ...totalAmountsForPreviousWeeks],
          fill: false,
          borderColor: 'rgba(103, 232, 249, 1)',
          tension: 0.1
        }
      ]
    };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRoomSoldGraph = async (req, res) => {
  try {
    const startOfWeek = moment().startOf('isoWeek').toDate();
    const endOfWeek = moment().endOf('isoWeek').toDate();

    const startOfPreviousWeeks = [
      moment().subtract(1, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').startOf('isoWeek').toDate()
    ];
    const endOfPreviousWeeks = [
      moment().subtract(1, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').endOf('isoWeek').toDate()
    ];

    // Function to get total amount for a given date range
    const gettotalRoomForDateRange = async (start, end) => {
      const result = await Order.aggregate([
        { $match: { orderDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, totalRoom: { $sum: "$roomNumber" } } }
      ]);
      return result[0]?.totalRoom || 0;
    };

    // Get total amount for the current week
    const totalRoomThisWeek = await gettotalRoomForDateRange(startOfWeek, endOfWeek);

    // Get total amount for previous weeks
    const totalRoomsForPreviousWeeks = await Promise.all(
      startOfPreviousWeeks.map((start, index) =>
        gettotalRoomForDateRange(start, endOfPreviousWeeks[index])
      )
    );

    // Combine results
    const data = {
      labels: ['This Week', 'A Week Ago', 'Two Weeks Ago', 'Three Weeks Ago'],
      datasets: [
        {
          label: 'Total Amount',
          data: [totalRoomThisWeek, ...totalRoomsForPreviousWeeks],
          fill: false,
          borderColor: 'rgba(103, 232, 249, 1)',
          tension: 0.1
        }
      ]
    };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAccountRegisteredGraph = async (req, res) => {
  try {
    // Get start and end of the current week
    const startOfWeek = moment().startOf('isoWeek').toDate();
    const endOfWeek = moment().endOf('isoWeek').toDate();

    // Get start and end of previous weeks
    const startOfPreviousWeeks = [
      moment().subtract(1, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').startOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').startOf('isoWeek').toDate()
    ];
    const endOfPreviousWeeks = [
      moment().subtract(1, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(2, 'weeks').endOf('isoWeek').toDate(),
      moment().subtract(3, 'weeks').endOf('isoWeek').toDate()
    ];

    // Function to count registered accounts for a given date range
    const getRegisteredAccountsForDateRange = async (start, end) => {
      return await User.countDocuments({ registrationDate: { $gte: start, $lte: end } });
    };

    // Get registered accounts for the current week
    const registeredAccountsThisWeek = await getRegisteredAccountsForDateRange(startOfWeek, endOfWeek);

    // Get registered accounts for previous weeks
    const registeredAccountsForPreviousWeeks = await Promise.all(
      startOfPreviousWeeks.map((start, index) =>
        getRegisteredAccountsForDateRange(start, endOfPreviousWeeks[index])
      )
    );

    // Combine results
    const data = {
      labels: ['This Week', 'A Week Ago', 'Two Weeks Ago', 'Three Weeks Ago'],
      datasets: [
        {
          label: 'Registered Accounts',
          data: [registeredAccountsThisWeek, ...registeredAccountsForPreviousWeeks],
          fill: false,
          borderColor: 'rgba(103, 232, 249, 1)',
          tension: 0.1
        }
      ]
    };

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadProofOfPayment = async (req, res, next) => {
  const form = formidable({
    uploadDir: path.join(__dirname, '../uploads/payments'), // Set the upload directory
    keepExtensions: true, // Keep file extensions
    multiples: false, // Only allow one file to be uploaded at a time
  });

  // Ensure the upload directory exists
  if (!fs.existsSync(form.uploadDir)) {
    fs.mkdirSync(form.uploadDir, { recursive: true });
  }

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return next(createError(400, 'Error parsing the file'));
    }

    try {
      const orderId = req.params.id; // Get the order ID from request parameters

      const order = await Order.findById(orderId);
      if (!order) {
        return next(createError(404, 'Order not found'));
      }

      if (files.proofImage) {
        const proofImage = Array.isArray(files.proofImage) ? files.proofImage[0] : files.proofImage; // Handle array format

        // Check if the file is an image
        if (!proofImage.mimetype.startsWith('image')) {
          return next(createError(400, 'Only image files are allowed.'));
        }

        const oldPath = proofImage.filepath; // Old path after file upload
        const newFilename = `${uuidv4()}${path.extname(proofImage.originalFilename)}`; // Generate a new unique filename
        const newPath = path.join(form.uploadDir, newFilename); // New path to move the file

        // Rename and move the file to the desired location
        fs.renameSync(oldPath, newPath);

        // Add the new proof of payment path to the proofOfTransfer array in the order
        const picturePath = `/uploads/payments/${newFilename}`;
        order.proofOfTransfer.push(picturePath); // Push the new image path to the array

        await order.save();

        res.status(200).json({
          message: 'Proof of payment uploaded successfully',
          proofOfTransfer: order.proofOfTransfer,
        });
      } else {
        res.status(400).json({ message: 'No file uploaded' });
      }
    } catch (error) {
      next(error);
    }
  });
};