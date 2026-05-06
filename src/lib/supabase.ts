import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://tioqeskkuyopiklxlvjq.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImMzZWEyYTQ3LTRiNmYtNDA1Mi04MWMwLWExNDg3ZGZkNmVkZSJ9.eyJwcm9qZWN0SWQiOiJ0aW9xZXNra3V5b3Bpa2x4bHZqcSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1NDU5MTgwLCJleHAiOjIwODA4MTkxODAsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.hVIPlH7e1bfV2xdNUpGq9KKIuckmG8mthH7a2mTxMOQ';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };