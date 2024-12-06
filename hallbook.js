const express = require('express');
const app = express();
app.use(express.json());

// Local storage for rooms and bookings
const rooms = [];
const bookings = [];

// 1. Creating a Room
app.post('/create-room', (req, res) => {
    const { roomName, numberOfSeats, amenities, pricePerHour } = req.body;

    if (!roomName || !numberOfSeats || !amenities || !pricePerHour) {
        return res.status(400).send({ message: 'All fields are required: roomName, numberOfSeats, amenities, pricePerHour.' });
    }

    const newRoom = {
        roomId: rooms.length + 1,
        roomName,
        numberOfSeats,
        amenities,
        pricePerHour,
        bookings: []
    };

    rooms.push(newRoom);
    res.status(201).send({ message: 'Room created successfully', room: newRoom });
});

// 2. Booking a Room
app.post('/book-room', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    if (!customerName || !date || !startTime || !endTime || !roomId) {
        return res.status(400).send({ message: 'All fields are required: customerName, date, startTime, endTime, roomId.' });
    }

    const room = rooms.find(r => r.roomId === roomId);

    if (!room) {
        return res.status(404).send({ message: 'Room not found.' });
    }

    // Check if the room is already booked for the given time slot
    const isRoomBooked = room.bookings.some(booking => 
        booking.date === date && (
            (startTime >= booking.startTime && startTime < booking.endTime) ||
            (endTime > booking.startTime && endTime <= booking.endTime) ||
            (startTime <= booking.startTime && endTime >= booking.endTime)
        )
    );

    if (isRoomBooked) {
        return res.status(400).send({ message: 'Room is already booked for the selected time slot.' });
    }

    const newBooking = {
        bookingId: bookings.length + 1,
        customerName,
        date,
        startTime,
        endTime,
        roomId
    };

    room.bookings.push(newBooking);
    bookings.push(newBooking);
    res.status(201).send({ message: 'Room booked successfully', booking: newBooking });
});

// 3. List all Rooms with Booked Data
app.get('/rooms', (req, res) => {
    const roomDetails = rooms.map(room => ({
        roomName: room.roomName,
        bookedStatus: room.bookings.length > 0,
        bookings: room.bookings
    }));

    res.status(200).send(roomDetails);
});

// 4. List all Customers with Booked Data
app.get('/customers', (req, res) => {
    const customerBookings = bookings.map(booking => ({
        customerName: booking.customerName,
        roomName: rooms.find(room => room.roomId === booking.roomId)?.roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
    }));

    res.status(200).send(customerBookings);
});

// 5. List how many times a customer has booked the room with details
app.get('/customer-bookings/:customerName', (req, res) => {
    const { customerName } = req.params;

    const customerBookingDetails = bookings.filter(booking => booking.customerName === customerName).map(booking => ({
        customerName: booking.customerName,
        roomName: rooms.find(room => room.roomId === booking.roomId)?.roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.bookingId,
        bookingDate: booking.date,
        bookingStatus: 'Confirmed'
    }));

    if (customerBookingDetails.length === 0) {
        return res.status(404).send({ message: 'No bookings found for the customer.' });
    }

    res.status(200).send(customerBookingDetails);
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
