// Vercel Serverless Function entry point.
//
// This module exports the Express application WITHOUT calling listen(), so
// Vercel can invoke it as a Serverless Function. Requests to /api/* are routed
// here by vercel.json; the /api prefix is stripped inside src/app.js so the
// existing root-mounted routes continue to work unchanged.
module.exports = require('../src/app');
