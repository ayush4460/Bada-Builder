const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// --- Models ---

const Project = sequelize.define('Project', {
  name: { type: DataTypes.STRING, defaultValue: 'Bada Builder Project' },
  regular_price_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  group_price_sqft: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
});

const Tower = sequelize.define('Tower', {
  name: { type: DataTypes.STRING, allowNull: false },
  total_floors: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Total combined
  basement_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
  podium_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
  residential_levels: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const Floor = sequelize.define('Floor', {
  floor_number: { type: DataTypes.INTEGER, allowNull: false }, // Physical floor index (0 for G, -1 for B1 etc, though typically 0 or 1 based mapped by display name)
  name: { type: DataTypes.STRING, allowNull: false }, // "Ground", "1st Floor", "Basement 1"
  type: { 
    type: DataTypes.ENUM('RESIDENTIAL', 'COMMERCIAL', 'PARKING', 'AMENITY'), 
    defaultValue: 'RESIDENTIAL' 
  },
});

const UnitType = sequelize.define('UnitType', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true }, // Apartment, Villa, Shop, etc.
});

const Unit = sequelize.define('Unit', {
  unit_number: { type: DataTypes.STRING, allowNull: false },
  carpet_area: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  super_built_up_area: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'ON_HOLD', 'BOOKED'),
    defaultValue: 'AVAILABLE'
  },
  price: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 }, // Calculated
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
