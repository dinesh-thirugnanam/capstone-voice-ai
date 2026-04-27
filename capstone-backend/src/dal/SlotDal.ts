import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

export class SlotDAL {
    constructor(private db: SupabaseClient = supabase) {}

    getAllSlots = async () => {
        // attempt to include counsellor name via relationship
        const { data, error } = await this.db
            .from("availability_slot")
            .select("*, users(name)")
            .order("start_time");
        if (error) throw error;
        return data;
    };

    createSlot = async (slot: Record<string, any>) => {
        const { data, error } = await this.db
            .from("availability_slot")
            .insert([slot])
            .select();
        if (error) throw error;
        return data?.[0];
    };

    deleteSlot = async (id: string) => {
        const { error } = await this.db
            .from("availability_slot")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return { success: true };
    };

    getSlotsByUser = async (counsellor_id: string) => {
        const { data, error } = await this.db
            .from("availability_slot")
            .select("*")
            .eq("counsellor_id", counsellor_id)
            .order("start_time");
        if (error) throw error;
        return data;
    };

    getAvailableSlots = async () => {
        const { data, error } = await this.db
            .from("availability_slot")
            .select("*, users(name)")
            .eq("is_booked", false)
            .order("start_time");
        if (error) throw error;
        return data;
    };
}
