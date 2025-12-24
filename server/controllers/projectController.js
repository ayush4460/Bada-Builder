const { Project, UnitType } = require('../models');

exports.getProjectSettings = async (req, res) => {
    try {
        const project = await Project.findByPk(1);
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProjectSettings = async (req, res) => {
    try {
        const { regular_price_sqft, group_price_sqft, residential_rate, office_rate, shop_rate, name } = req.body;
        const project = await Project.findByPk(1);
        await project.update({ 
            name,
            regular_price_sqft, 
            group_price_sqft,
            residential_rate,
            office_rate,
            shop_rate 
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUnitTypes = async (req, res) => {
    try {
        const types = await UnitType.findAll();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
