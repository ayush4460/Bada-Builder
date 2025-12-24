const { Unit, Project } = require('../models');

// GET /api/units/:id
exports.getUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
        include: [{
            model: require('../models').Floor,
            include: [{ model: require('../models').Tower }]
        }]
    });
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
    const { 
        unit_number, 
        unit_type_id, 
        // Dimensions
        carpet_area, 
        super_built_up_area, 
        // Config
        bhk_type,
        // Status
        status, 
        // Pricing Overrides
        price_per_sqft, 
        discounted_price_per_sqft
    } = req.body;

    const unit = await Unit.findByPk(id, {
        include: [{ model: require('../models').Floor }]
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    // Fetch Project Settings
    const project = await Project.findByPk(1); 
    
    // Determine Base Rates
    // Logic: If unit-specific override exists > 0, use it.
    // Else check Global rate based on Floor Type.
    let effectiveRegularRate = parseFloat(price_per_sqft) || 0;
    let effectiveDiscountRate = parseFloat(discounted_price_per_sqft) || 0;

    // Auto-fetch global if no override
    if (project && effectiveRegularRate === 0) {
        if (unit.Floor?.type === 'RESIDENTIAL') effectiveRegularRate = parseFloat(project.residential_rate) || 0;
        else if (unit.Floor?.type === 'OFFICE') effectiveRegularRate = parseFloat(project.office_rate) || 0;
        else if (unit.Floor?.type === 'SHOP') effectiveRegularRate = parseFloat(project.shop_rate) || 0;
        else effectiveRegularRate = parseFloat(project.regular_price_sqft) || 0; // Fallback
    }

    // Calculate Finals
    const area = parseFloat(super_built_up_area) || 0;
    const final_regular_price = area * effectiveRegularRate;
    const final_discounted_price = area * effectiveDiscountRate;

    await unit.update({
      unit_number,
      unit_type_id,
      carpet_area,
      super_built_up_area,
      bhk_type,
      status,
      price_per_sqft,
      discounted_price_per_sqft,
      final_regular_price,
      final_discounted_price
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
