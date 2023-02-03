const { Router } = require('express');

const SessionsController = require("../controllers/SessionsController");
const sessionsController = new SessionsController();

sessionsRoutes = Router();
sessionsRoutes.post('/', sessionsController.create);

module.exports = sessionsRoutes;