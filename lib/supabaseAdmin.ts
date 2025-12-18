import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.sb_publishable_WoyuqBZiXrRKHj6BHvYHfQ_1Gxypm1a!;
const serviceRoleKey = process.env.sb_secret_xF2zOElR7_OhvtUOlyoTUA_f3dnYLcy!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

