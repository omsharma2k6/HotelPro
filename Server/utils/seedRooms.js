const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../config/db');
const Room = require('../models/Room');

const initialSuites = [
  {
    roomNumber: 'SUITE-101',
    roomType: 'Suite',
    rentPerNight: 350,
    inventory: 3,
    description: 'Our premier Executive Royal Suite featuring bespoke Italian furnishings, expansive ocean-view balcony, private jacuzzi, and 24/7 dedicated butler service.',
    photos: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['King Bed', 'Panoramic Ocean View', 'Private Jacuzzi', 'High-speed WiFi', 'Espresso Machine', 'Butler Service'],
    status: 'available',
    housekeepingStatus: 'clean',
    isActive: true
  },
  {
    roomNumber: 'DELUXE-201',
    roomType: 'Deluxe',
    rentPerNight: 220,
    inventory: 5,
    description: 'Immaculately crafted Deluxe Horizon Room providing sublime tranquility, panoramic city skyline vistas, rain shower, and premium bedding.',
    photos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Queen Bed', 'City Skyline View', 'Rain Shower', 'Espresso Machine', 'High-speed WiFi', 'Smart TV'],
    status: 'available',
    housekeepingStatus: 'clean',
    isActive: true
  },
  {
    roomNumber: 'DOUBLE-301',
    roomType: 'Double',
    rentPerNight: 160,
    inventory: 4,
    description: 'Spacious accommodation offering seamless comfort for couples and traveling families, soundproof architecture, and ergonomic workstation.',
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Two Double Beds', 'Soundproof Windows', 'Ergonomic Workstation', 'High-speed WiFi', 'Mini Bar'],
    status: 'available',
    housekeepingStatus: 'clean',
    isActive: true
  },
  {
    roomNumber: 'SINGLE-401',
    roomType: 'Single',
    rentPerNight: 110,
    inventory: 6,
    description: 'Tailored for the discerning solo business traveler. Features plush single comfort, high-speed fiber internet, and sleek modern aesthetic.',
    photos: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    amenities: ['Single Bed', 'Ergonomic Desk', 'High-speed WiFi', 'City View', 'Coffee Maker'],
    status: 'available',
    housekeepingStatus: 'clean',
    isActive: true
  }
];

const seedRooms = async () => {
  try {
    await connectDB();
    console.log('--- Seeding Initial Hotel Suites ---');

    for (const suite of initialSuites) {
      const exists = await Room.findOne({ roomNumber: suite.roomNumber });
      if (!exists) {
        await Room.create(suite);
        console.log(`Created room: ${suite.roomNumber} (${suite.roomType})`);
      } else {
        console.log(`Room already exists: ${suite.roomNumber}`);
      }
    }

    console.log('Room seeding completed successfully.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding rooms:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedRooms();
