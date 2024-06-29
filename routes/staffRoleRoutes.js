const express = require('express');
const { createStaffRoles, getAllStaffRoless, getStaffRoles, getStaffRolesById, updateStaffRoles, updatepublishedstatus, deleteStaffRoles } = require('../controller/staffRoleController');
const router = express.Router();

// Create a new transport method
router.post('/StaffRole',createStaffRoles);

// Read all transport methods
router.get('/allStaffRole',getAllStaffRoless);

router.get('/StaffRole',getStaffRoles);

// Read a single transport method by ID
router.get('/StaffRole/:id',getStaffRolesById);

// Update a transport method by ID
router.put('/StaffRole/:id', updateStaffRoles);

// Update the 'published' field by ID
router.put('/StaffRole/:id/published', updatepublishedstatus);

// Delete a transport method by ID
router.delete('/StaffRole/:id', deleteStaffRoles);

module.exports = router;
