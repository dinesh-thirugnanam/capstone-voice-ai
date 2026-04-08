import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

export class AppointmentDAL {
    constructor(private db: SupabaseClient = supabase) {}

    getAllAppointments = async () => {
        const { data, error } = await this.db.from("appointment").select("*");
        if (error) throw error;
        return data;
    };
}
