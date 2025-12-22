const { Tower, Floor, Unit, UnitType } = require('../models');

// GET /api/structures - Fetch full hierarchy
exports.getStructure = async (req, res) => {
  try {
    const towers = await Tower.findAll({
      include: [
        {
          model: Floor,
          include: [
            {
              model: Unit,
              include: [UnitType]
            }
          ]
        }
      ],
      order: [
        ['id', 'ASC'],
        [Floor, 'floor_number', 'ASC'], // Assuming visual order logic might differ, but this is standard
        [Floor, Unit, 'unit_number', 'ASC'] // Or string sort
      ]
    });
    res.json(towers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/structures - Initialize/Update basic structure
// This is a "Builder" operation. It might be complex.
// For simplicity: Create a Tower -> Create Floors -> Create Unit Placeholders
exports.createTower = async (req, res) => {
  const { name, basement_levels = 0, podium_levels = 0, residential_levels = 10, units_per_floor } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const total_floors = parseInt(basement_levels) + 1 + parseInt(podium_levels) + parseInt(residential_levels); // +1 is Ground

  try {
    const tower = await Tower.create({ 
        name, 
        total_floors,
        basement_levels: parseInt(basement_levels),
        podium_levels: parseInt(podium_levels),
        residential_levels: parseInt(residential_levels)
    });
    
    // 1. Basements (Negative floor numbers: -1, -2...)
    // Usually B1 is -1, B2 is -2. Let's iterate down.
    for (let i = 1; i <= basement_levels; i++) {
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: -i,
            name: `Basement ${i}`,
            type: 'PARKING'
        });
        // Generate placeholder parking units? Or leave empty? 
        // User asked to "adjust basement for whole layer parking levels". 
        // We'll skip standard units for now unless requested, or maybe create 1 big unit?
        // Let's create 'units_per_floor' generic units for consistency if > 0, but maybe mark them PARKING?
    }

    // 2. Ground Floor (0)
    await Floor.create({
        tower_id: tower.id,
        floor_number: 0,
        name: 'Ground Floor',
        type: 'AMENITY' // or COMMERCIAL
    });

    // 3. Podium Levels (1 to P)
    for (let i = 1; i <= podium_levels; i++) {
        await Floor.create({
            tower_id: tower.id,
            floor_number: i,
            name: `Podium ${i}`,
            type: 'PARKING'
        });
    }

    // 4. Residential Floors (Starting from podium_levels + 1)
    const start_res_floor = parseInt(podium_levels) + 1;
    for (let i = 0; i < residential_levels; i++) {
        const floorNum = start_res_floor + i;
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: floorNum,
            name: `Floor ${floorNum}`,
            type: 'RESIDENTIAL'
        });

        // Create Units for Residential only for now, as standard flow
        if (units_per_floor > 0) {
            for (let u = 1; u <= units_per_floor; u++) {
                await Unit.create({
                    floor_id: floor.id,
                    unit_number: `${floorNum}${u.toString().padStart(2, '0')}`,
                    carpet_area: 0,
                    super_built_up_area: 0,
                    status: 'AVAILABLE',
                    price: 0
                });
            }
        }
    }

    res.status(201).json({ message: 'Tower created successfully', tower });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTower = async (req, res) => {
    try {
        const { id } = req.params;
        await Tower.destroy({ where: { id } });
        res.json({ message: 'Tower deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTower = async (req, res) => {
    const { id } = req.params;
    const { name, basement_levels, podium_levels, residential_levels, units_per_floor } = req.body;

    try {
        const tower = await Tower.findByPk(id);
        if (!tower) return res.status(404).json({ error: 'Tower not found' });

        const total_floors = parseInt(basement_levels) + 1 + parseInt(podium_levels) + parseInt(residential_levels);

        await tower.update({ 
            name, 
            total_floors,
            basement_levels,
            podium_levels,
            residential_levels
        });

        // For structural changes (changing tier counts), it's complex to map old floors to new.
        // Strategy: Nuke floors and recreate. *WARNING: DATA LOSS on existing unit configs*.
        // Ideally we should warn the user. For this prototype, we will regenerate content.
        
        await Floor.destroy({ where: { tower_id: id } }); // Cascade deletes units

        // --- Regeneration Logic (Same as Create) ---
        
        // 1. Basements
        for (let i = 1; i <= basement_levels; i++) {
            await Floor.create({
                tower_id: tower.id,
                floor_number: -i,
                name: `Basement ${i}`,
                type: 'PARKING'
            });
        }

        // 2. Ground
        await Floor.create({
            tower_id: tower.id,
            floor_number: 0,
            name: 'Ground Floor',
            type: 'AMENITY'
        });

        // 3. Podiums
        for (let i = 1; i <= podium_levels; i++) {
            await Floor.create({
                tower_id: tower.id,
                floor_number: i,
                name: `Podium ${i}`,
                type: 'PARKING'
            });
        }

        // 4. Residential
        const start_res_floor = parseInt(podium_levels) + 1;
        for (let i = 0; i < residential_levels; i++) {
            const floorNum = start_res_floor + i;
            const floor = await Floor.create({
                tower_id: tower.id,
                floor_number: floorNum,
                name: `Floor ${floorNum}`,
                type: 'RESIDENTIAL'
            });

            if (units_per_floor > 0) {
                for (let u = 1; u <= units_per_floor; u++) {
                    await Unit.create({
                        floor_id: floor.id,
                        unit_number: `${floorNum}${u.toString().padStart(2, '0')}`,
                        carpet_area: 0,
                        super_built_up_area: 0,
                        status: 'AVAILABLE',
                        price: 0
                    });
                }
            }
        }

        res.json({ message: 'Tower updated and structure regenerated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createFloor = async (req, res) => {
    const { tower_id, floor_number, name, type } = req.body;
    try {
        const floor = await Floor.create({
            tower_id,
            floor_number,
            name,
            type
        });
        res.status(201).json(floor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateFloor = async (req, res) => {
    const { id } = req.params;
    const { floor_number, name, type } = req.body;
    try {
        const floor = await Floor.findByPk(id);
        if (!floor) return res.status(404).json({ error: 'Floor not found' });
        
        await floor.update({ floor_number, name, type });
        res.json(floor);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFloor = async (req, res) => {
    const { id } = req.params;
    try {
        await Floor.destroy({ where: { id } });
        res.json({ message: 'Floor deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
