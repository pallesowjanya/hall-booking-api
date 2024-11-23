const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(bodyParser.json());

// Example data (in-memory storage)
let rooms = [];
let bookings = [];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Hall Booking API! Use endpoints like /create-room, /book-room, /list-rooms, or /list-customers.');
});

// 1. Create a Room
app.post('/create-room', (req, res) => {
  const { name, seatsAvailable, amenities, pricePerHour } = req.body;

  if (!name || !seatsAvailable || !amenities || !pricePerHour) {
    return res.status(400).send('Please provide name, seatsAvailable, amenities, and pricePerHour.');
  }

  const room = {
    id: rooms.length + 1,
    name,
    seatsAvailable,
    amenities,
    pricePerHour,
    bookings: [], // For storing bookings specific to this room
  };

  rooms.push(room);
  res.status(201).send(`Room "${name}" created successfully.`);
});

// 2. Book a Room
app.post('/book-room', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  if (!customerName || !date || !startTime || !endTime || !roomId) {
    return res.status(400).send('Please provide customerName, date, startTime, endTime, and roomId.');
  }

  // Find the room
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    return res.status(404).send('Room not found.');
  }

  // Check for existing bookings in the same time slot
  const isAlreadyBooked = room.bookings.some(
    (booking) =>
      booking.date === date &&
      ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime))
  );

  if (isAlreadyBooked) {
    return res.status(400).send('Room is already booked for the selected time slot.');
  }

  const booking = {
    id: bookings.length + 1,
    customerName,
    date,
    startTime,
    endTime,
    roomId,
  };

  // Save booking in the room and global bookings list
  room.bookings.push(booking);
  bookings.push(booking);

  res.status(201).send('Room booked successfully.');
});

// 3. List All Rooms with Booked Data
app.get('/list-rooms', (req, res) => {
  const roomDetails = rooms.map((room) => ({
    name: room.name,
    bookedStatus: room.bookings.length > 0,
    bookings: room.bookings,
  }));

  res.status(200).json(roomDetails);
});

// 4. List All Customers with Booked Data
app.get('/list-customers', (req, res) => {
  const customerDetails = bookings.map((booking) => ({
    customerName: booking.customerName,
    roomName: rooms.find((room) => room.id === booking.roomId)?.name,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
  }));

  res.status(200).json(customerDetails);
});

// 5. Count How Many Times a Customer Has Booked a Room
app.get('/customer-bookings/:customerName', (req, res) => {
  const { customerName } = req.params;

  const customerBookings = bookings.filter((booking) => booking.customerName === customerName);

  if (customerBookings.length === 0) {
    return res.status(404).send('No bookings found for the specified customer.');
  }

  res.status(200).json({
    customerName,
    totalBookings: customerBookings.length,
    bookings: customerBookings,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
