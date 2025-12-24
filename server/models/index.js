const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// --- Models ---

const Project = sequelize.define('Project', {
  name: { type: DataTypes.STRING, defaultValue: 'Bada Builder Project' },
  residential_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  office_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  shop_rate: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  regular_price_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Legacy/Fallback
  group_price_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

// Tower Model
const Tower = sequelize.define('Tower', {
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('TOWER', 'BUNGALOW'), defaultValue: 'TOWER' },
  total_floors: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, 
  basement_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
  shop_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
  office_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
  podium_levels: { type: DataTypes.INTEGER, defaultValue: 0 }, // Used for Parking usually
  residential_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Floor = sequelize.define('Floor', {
  floor_number: { type: DataTypes.INTEGER, allowNull: false }, 
  name: { type: DataTypes.STRING, allowNull: false }, 
  type: { 
    type: DataTypes.ENUM('RESIDENTIAL', 'COMMERCIAL', 'PARKING', 'AMENITY', 'OFFICE', 'SHOP', 'BASEMENT'), 
    defaultValue: 'RESIDENTIAL' 
  },
});

const UnitType = sequelize.define('UnitType', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true }, // Apartment, Villa, Shop, etc.
});

const Unit = sequelize.define('Unit', {
  unit_number: { type: DataTypes.STRING, allowNull: false },
  // Dimensions
  carpet_area: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  super_built_up_area: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  // Configuration
  bhk_type: { 
    type: DataTypes.ENUM('1BHK', '2BHK', '3BHK', '4BHK', '5BHK', 'STUDIO', 'PENTHOUSE', 'N/A'), 
    defaultValue: 'N/A' 
  },
  // Status
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'ON_HOLD', 'BOOKED'),
    defaultValue: 'AVAILABLE'
  },
  // Pricing Overrides (if 0, use global)
  price_per_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Regular rate override
  discounted_price_per_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // Discount rate
  
  // Final calculated prices (can be cached here or calculated on fly)
  final_regular_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
  final_discounted_price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
});

// --- Associations ---

// A Project has many Towers (Conceptually, even if singular for now)
// We'll keep it simple: Tower belongs to nothing specific if single project, but let's assume global scope.

// Tower -> Floors
Tower.hasMany(Floor, { foreignKey: 'tower_id', onDelete: 'CASCADE' });
Floor.belongsTo(Tower, { foreignKey: 'tower_id' });

// Floor -> Units
Floor.hasMany(Unit, { foreignKey: 'floor_id', onDelete: 'CASCADE' });
Unit.belongsTo(Floor, { foreignKey: 'floor_id' });

// Unit -> UnitType
UnitType.hasMany(Unit, { foreignKey: 'unit_type_id' });
Unit.belongsTo(UnitType, { foreignKey: 'unit_type_id' });

module.exports = {
  sequelize,
  Project,
  Tower,
  Floor,
  UnitType,
  Unit,
};
