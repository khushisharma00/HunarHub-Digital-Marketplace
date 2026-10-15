const db = require('../config/db');

// Get availability slots for an entrepreneur
exports.getSlots = async (req, res, next) => {
  try {
    const { entrepreneur_id, date } = req.query;

    if (!entrepreneur_id) {
      return res.status(400).json({ success: false, message: 'entrepreneur_id is required' });
    }

    const slots = await db('availability_slots')
      .where({ entrepreneur_id, is_active: true })
      .orderBy('day_of_week', 'asc')
      .orderBy('start_time', 'asc');

    // If date is passed (YYYY-MM-DD), also return which slots are already booked on that date
    let bookedSlots = [];
    if (date) {
      const activeBookings = await db('service_requests')
        .where({
          entrepreneur_id,
          booking_date: date
        })
        .whereNotIn('status', ['Rejected', 'Cancelled'])
        .select('time_slot');

      bookedSlots = activeBookings.map((b) => b.time_slot);
    }

    return res.json({
      success: true,
      slots,
      bookedSlots
    });
  } catch (error) {
    next(error);
  }
};

// Add slot (Entrepreneur only)
exports.addSlot = async (req, res, next) => {
  try {
    const { day_of_week, start_time, end_time } = req.body;

    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'day_of_week, start_time, and end_time are required' });
    }

    // Check duplicate
    const existing = await db('availability_slots')
      .where({
        entrepreneur_id: req.entrepreneur.id,
        day_of_week,
        start_time,
        end_time
      })
      .first();

    if (existing) {
      if (!existing.is_active) {
        await db('availability_slots').where({ id: existing.id }).update({ is_active: true });
        return res.json({ success: true, message: 'Slot reactivated', slot: existing });
      }
      return res.status(409).json({ success: false, message: 'This slot already exists' });
    }

    const [id] = await db('availability_slots').insert({
      entrepreneur_id: req.entrepreneur.id,
      day_of_week,
      start_time,
      end_time,
      is_active: true
    });

    const slot = await db('availability_slots').where({ id }).first();
    return res.status(201).json({ success: true, message: 'Slot added successfully', slot });
  } catch (error) {
    next(error);
  }
};

// Delete slot (Entrepreneur ownership check)
exports.deleteSlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = await db('availability_slots').where({ id }).first();
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.entrepreneur_id !== req.entrepreneur.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this slot' });
    }

    await db('availability_slots').where({ id }).delete();
    return res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    next(error);
  }
};
