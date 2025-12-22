const { Unit, Project } = require('../models');

// GET /api/units/:id
exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/units/:id - Update unit configuration
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit_number, unit_type_id, carpet_area, super_built_up_area, status } = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    // Fetch Project Settings for Price Calculation
    // Assuming single project for now, ID 1
    const project = await Project.findByPk(1); 
    let price = unit.price;

    // Logic: calculate price if area is updated
    if (super_built_up_area && project) {
        // Simple logic: regular price. 
        // Real logic might need to know if it's "Group" price etc. 
        // For now, let's use regular_price_sqft * area
        price = parseFloat(super_built_up_area) * parseFloat(project.regular_price_sqft);
    }

    await unit.update({
      unit_number,
      unit_type_id,
      carpet_area,
      super_built_up_area,
      status,
      price
    });

    res.json({ message: 'Unit updated', unit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/units/bulk - Bulk update (e.g. for a whole floor)
exports.bulkUpdateUnits = async (req, res) => {
    try {
        const { unitIds, data } = req.body; // data contains { unit_type_id, ... }
        // We need to loop to update prices individually if areas are involved, 
        // but if it's just type/status, simple update works.
        // For robustness, let's iterate.
        
        // Fetch project for pricing
        const project = await Project.findByPk(1); 

        const promises = unitIds.map(async (id) => {
            const unit = await Unit.findByPk(id);
            if (!unit) return;
            
            let updates = { ...data };
            let newArea = updates.super_built_up_area || unit.super_built_up_area;
            
            if (newArea > 0 && project) {
                updates.price = newArea * project.regular_price_sqft;
            }

            return unit.update(updates);
        });

        await Promise.all(promises);
        res.json({ message: 'Units updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
