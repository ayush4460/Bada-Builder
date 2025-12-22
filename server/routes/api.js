const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const unitController = require('../controllers/unitController');
const projectController = require('../controllers/projectController');

// Structure Routes
router.get('/structures', structureController.getStructure);
router.post('/towers', structureController.createTower); // Simple builder
router.put('/towers/:id', structureController.updateTower);
router.delete('/towers/:id', structureController.deleteTower);

// Floor Routes
router.post('/floors', structureController.createFloor);
router.put('/floors/:id', structureController.updateFloor);
router.delete('/floors/:id', structureController.deleteFloor);

// Unit Routes
router.get('/units/:id', unitController.getUnit);
router.patch('/units/bulk', unitController.bulkUpdateUnits);
router.patch('/units/:id', unitController.updateUnit);


// Project Routes
router.get('/projects/settings', projectController.getProjectSettings);
router.put('/projects/settings', projectController.updateProjectSettings);
router.get('/unittypes', projectController.getUnitTypes);

module.exports = router;
