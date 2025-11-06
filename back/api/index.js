// Entrypoint para Vercel: exporta la app Express
const app = require('../index');

// Vercel espera module.exports = app (o export default app)
module.exports = app;
