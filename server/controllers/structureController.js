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
  const { 
      name, 
      type = 'TOWER',
      basement_levels = 0, 
      shop_levels = 0,
      office_levels = 0,
      podium_levels = 0, // Parking
      residential_levels = 0, 
      units_per_floor = 4,
      site_name 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  // If site_name provided, update Project name (Global context for now)
  if (site_name) {
      const { Project } = require('../models');
      const project = await Project.findOne();
      if (project) {
          project.name = site_name;
          await project.save();
      } else {
          await Project.create({ name: site_name });
      }
  }

  const base = parseInt(basement_levels) || 0;
  const shop = parseInt(shop_levels) || 0;
  const off = parseInt(office_levels) || 0;
  const park = parseInt(podium_levels) || 0;
  const resi = parseInt(residential_levels) || 0;

  const total_floors = base + shop + off + park + resi; 

  try {
    const tower = await Tower.create({ 
        name, 
        type,
        total_floors,
        basement_levels: base,
        shop_levels: shop,
        office_levels: off,
        podium_levels: park,
        residential_levels: resi
    });
    
    // GENERATE FLOORS
    // Order: Basement (Neg) -> Ground/Shop -> Podium/Parking -> Office -> Residential

    // 1. Basements (Negative numbers: -1 down to -N)
    for (let i = 1; i <= base; i++) {
        await Floor.create({
            tower_id: tower.id,
            floor_number: -i,
            name: `Basement ${i}`,
            type: 'BASEMENT'
        });
        // Add generic placeholder unit for basement?
        await Unit.create({
             floor_id: (await Floor.findOne({ where: { tower_id: tower.id, floor_number: -i } })).id,
             unit_number: `B${i}`,
             carpet_area: 0,
             super_built_up_area: 0,
             status: 'AVAILABLE',
             price: 0
        });
    }

    let currentFloorIndex = 0; // Starts at Ground (0)

    // 2. Shops (Ground + Up)
    // If shop_levels > 0, they take the lowest positive slots.
    for (let i = 0; i < shop; i++) {
        const fName = (currentFloorIndex === 0) ? "Ground Floor (Shops)" : `Shop Level ${currentFloorIndex}`;
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: currentFloorIndex,
            name: fName,
            type: 'SHOP'
        });
        
        // Create Shop Units
        const shopsCount = units_per_floor > 0 ? units_per_floor : 2; 
        for (let u = 1; u <= shopsCount; u++) {
            await Unit.create({
                floor_id: floor.id,
                unit_number: `S-${currentFloorIndex === 0 ? 'G' : currentFloorIndex}-${u}`,
                carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE'
            });
        }
        currentFloorIndex++;
    }

    // 3. Offices
    for (let i = 0; i < off; i++) {
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: currentFloorIndex,
            name: `Office Level ${currentFloorIndex}`,
            type: 'OFFICE'
        });
        // Create Office Units
        const officesCount = units_per_floor > 0 ? units_per_floor : 2;
        for (let u = 1; u <= officesCount; u++) {
            await Unit.create({
                floor_id: floor.id,
                unit_number: `OFF-${currentFloorIndex}-${u}`,
                carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE'
            });
        }
        currentFloorIndex++;
    }

    // 4. Parking / Podium
    for (let i = 0; i < park; i++) {
        // If we haven't used Ground yet (no shops, no offices), this might be 0.
        // But typically Podium is above Ground if Ground is Lobby/Stilt.
        // Let's assume if currentFloorIndex is 0, this is Stilt Parking.
        const fName = (currentFloorIndex === 0) ? "Ground (Stilt Parking)" : `Parking Level ${currentFloorIndex}`;
        
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: currentFloorIndex,
            name: fName,
            type: 'PARKING'
        });

        // Add 1 big Parking Unit block or multiple slots? User said "parking icon for that unit".
        // Let's add 'units_per_floor' slots for parking management.
        const slots = units_per_floor > 0 ? units_per_floor : 10;
        for (let u = 1; u <= slots; u++) {
             await Unit.create({
                floor_id: floor.id,
                unit_number: `P-${currentFloorIndex}-${u}`,
                carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE'
            });
        }
        currentFloorIndex++;
    }

    // 5. Residential
    for (let i = 0; i < resi; i++) {
        const fName = (currentFloorIndex === 0) ? "Ground Floor" : `Floor ${currentFloorIndex}`;
        const floor = await Floor.create({
            tower_id: tower.id,
            floor_number: currentFloorIndex,
            name: fName,
            type: 'RESIDENTIAL'
        });

        if (units_per_floor > 0) {
            for (let u = 1; u <= units_per_floor; u++) {
                await Unit.create({
                    floor_id: floor.id,
                    unit_number: `${currentFloorIndex}${u.toString().padStart(2, '0')}`,
                    carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE'
                });
            }
        }
        currentFloorIndex++;
    }

    res.status(201).json({ message: 'Structure created successfully', tower });
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
    const { 
        name, 
        type,
        basement_levels, 
        shop_levels, 
        office_levels, 
        podium_levels, 
        residential_levels, 
        units_per_floor 
    } = req.body;

    try {
        const tower = await Tower.findByPk(id);
        if (!tower) return res.status(404).json({ error: 'Tower not found' });

        const base = parseInt(basement_levels) || 0;
        const shop = parseInt(shop_levels) || 0;
        const off = parseInt(office_levels) || 0;
        const park = parseInt(podium_levels) || 0;
        const resi = parseInt(residential_levels) || 0;

        const total_floors = base + shop + off + park + resi;

        await tower.update({ 
            name,
            type,
            total_floors,
            basement_levels: base,
            shop_levels: shop,
            office_levels: off,
            podium_levels: park,
            residential_levels: resi
        });
        
        // REGENERATE LOGIC
        // Nuke existing floors
        await Floor.destroy({ where: { tower_id: id } }); 

        // Re-use logic from create (This is duplicated, ideally should be a helper function)
        // I will implement the loop again here for stability within this single tool call replacement.
        
        // 1. Basements
        for (let i = 1; i <= base; i++) {
            const floor = await Floor.create({
                tower_id: tower.id,
                floor_number: -i,
                name: `Basement ${i}`,
                type: 'BASEMENT'
            });
             await Unit.create({
                 floor_id: floor.id,
                 unit_number: `B${i}`,
                 carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE', price: 0
            });
        }

        let currentFloorIndex = 0;

        // 2. Shops
        for (let i = 0; i < shop; i++) {
            const fName = (currentFloorIndex === 0) ? "Ground Floor (Shops)" : `Shop Level ${currentFloorIndex}`;
            const floor = await Floor.create({ tower_id: tower.id, floor_number: currentFloorIndex, name: fName, type: 'SHOP' });
            for (let u = 1; u <= (units_per_floor || 2); u++) {
                await Unit.create({ floor_id: floor.id, unit_number: `S-${currentFloorIndex === 0 ? 'G' : currentFloorIndex}-${u}`, carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE' });
            }
            currentFloorIndex++;
        }

        // 3. Offices
        for (let i = 0; i < off; i++) {
            const floor = await Floor.create({ tower_id: tower.id, floor_number: currentFloorIndex, name: `Office Level ${currentFloorIndex}`, type: 'OFFICE' });
             for (let u = 1; u <= (units_per_floor || 2); u++) {
                await Unit.create({ floor_id: floor.id, unit_number: `OFF-${currentFloorIndex}-${u}`, carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE' });
            }
            currentFloorIndex++;
        }

        // 4. Parking
        for (let i = 0; i < park; i++) {
            const fName = (currentFloorIndex === 0) ? "Ground (Stilt Parking)" : `Parking Level ${currentFloorIndex}`;
            const floor = await Floor.create({ tower_id: tower.id, floor_number: currentFloorIndex, name: fName, type: 'PARKING' });
             for (let u = 1; u <= (units_per_floor || 10); u++) {
                await Unit.create({ floor_id: floor.id, unit_number: `P-${currentFloorIndex}-${u}`, carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE' });
            }
            currentFloorIndex++;
        }

        // 5. Residential
        for (let i = 0; i < resi; i++) {
            const fName = (currentFloorIndex === 0) ? "Ground Floor" : `Floor ${currentFloorIndex}`;
            const floor = await Floor.create({ tower_id: tower.id, floor_number: currentFloorIndex, name: fName, type: 'RESIDENTIAL' });
            if (units_per_floor > 0) {
                for (let u = 1; u <= units_per_floor; u++) {
                    await Unit.create({ floor_id: floor.id, unit_number: `${currentFloorIndex}${u.toString().padStart(2, '0')}`, carpet_area: 0, super_built_up_area: 0, status: 'AVAILABLE' });
                }
            }
            currentFloorIndex++;
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
