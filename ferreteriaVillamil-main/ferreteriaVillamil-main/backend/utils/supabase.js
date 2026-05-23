const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const WebSocket = require('ws'); // fallback for Node < 22

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    { realtime: { transport: WebSocket } }
);

module.exports = supabase;
