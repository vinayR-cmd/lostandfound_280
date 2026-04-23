const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Item = require('../models/Item');
const authMiddleware = require('../middleware/authMiddleware');

// --- User Authentication Routes ---

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Item Management Routes ---

// POST /api/items -> add item (protected)
router.post('/items', authMiddleware, async (req, res) => {
  try {
    const { itemName, description, type, location, date, contactInfo } = req.body;
    
    const newItem = new Item({
      itemName,
      description,
      type,
      location,
      date,
      contactInfo,
      createdBy: req.user.id
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating item' });
  }
});

// GET /api/items/search?name=xyz -> search items by name or type (protected)
// Note: Put this BEFORE /:id so 'search' isn't treated as an ID
router.get('/items/search', authMiddleware, async (req, res) => {
  try {
    const { name, type } = req.query;
    let query = {};

    if (name) {
      query.itemName = { $regex: name, $options: 'i' }; // Case-insensitive search
    }
    if (type) {
      query.type = type;
    }

    const items = await Item.find(query).populate('createdBy', 'name email').sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error searching items' });
  }
});

// GET /api/items -> get all items (protected)
router.get('/items', authMiddleware, async (req, res) => {
  try {
    const items = await Item.find().populate('createdBy', 'name email').sort({ date: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching items' });
  }
});

// GET /api/items/:id -> get item by id (protected)
router.get('/items/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('createdBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching item' });
  }
});

// PUT /api/items/:id -> update item (protected)
router.put('/items/:id', authMiddleware, async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Ensure only the creator can update the item
    if (item.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this item' });
    }

    const { itemName, description, type, location, date, contactInfo } = req.body;
    item.itemName = itemName || item.itemName;
    item.description = description || item.description;
    item.type = type || item.type;
    item.location = location || item.location;
    item.date = date || item.date;
    item.contactInfo = contactInfo || item.contactInfo;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating item' });
  }
});

// DELETE /api/items/:id -> delete item (protected)
router.delete('/items/:id', authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Ensure only the creator can delete the item
    if (item.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this item' });
    }

    await item.deleteOne();
    res.json({ message: 'Item removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting item' });
  }
});

module.exports = router;
