import "dotenv/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase.ts";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";

console.log(supabaseUrl + "\n" + supabaseKey);
export const supabase: SupabaseClient<Database> = createClient(
    supabaseUrl,
    supabaseKey,
);
