const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  entrepreneur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entrepreneur',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: Number, // 0 for Sunday, 6 for Saturday
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String, // e.g. "09:00"
    required: true
  },
  endTime: {
    type: String, // e.g. "17:00"
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Availability = mongoose.models.Availability || mongoose.model('Availability', availabilitySchema);

module.exports = Availability;
