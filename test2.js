require('dotenv').config({path:'.env.local'});
const { getClassDashboard } = require('./src/lib/actions/organization'); // We can't easily require Next.js TS files in node natively without ts-node or transpiler.
