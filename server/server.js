const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const { UnitType, Project } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Allow all for dev, or specify ['http://localhost:5173', 'http://localhost:5174']
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('Bada Builder API is running');
});

// Start Server
const startServer = async () => {
  await connectDB();
  
  // Sync Database
  // force: false ensures we don't drop tables on restart in prod, but for dev 'alter: true' is nice
  await sequelize.sync({ alter: true });
  console.log('✅ Database synced');

  // Seed Basic Data if needed
  await seedDefaults();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

const seedDefaults = async () => {
  try {
    // Seed Unit Types if empty
    const count = await UnitType.count();
    if (count === 0) {
      const types = [
        'Shop', 'Office', 'Apartment', 'Flat', 'Bungalow', 'Villa', 'Duplex', 'Triplex', 'Independent House'
      ];
      await UnitType.bulkCreate(types.map(name => ({ name })));
      console.log('🌱 Seeded Unit Types');
    }
    
    // Seed Default Project Config if empty
    const projCount = await Project.count();
    if (projCount === 0) {
      await Project.create({ name: 'Default Project', regular_price_sqft: 5000, group_price_sqft: 4500 });
      console.log('🌱 Seeded Default Project');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

startServer();
