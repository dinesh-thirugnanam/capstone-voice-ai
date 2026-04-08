import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

export class EventDAL {
    constructor(private db: SupabaseClient = supabase) {}

    getAllEvents = async () => {
        const { data, error } = await this.db
            .from("college_event")
            .select("id,title,description,event_date,location,organizer")
            .order("event_date");
        if (error) throw error;
        return data;
    };

    createEvent = async (event: Record<string, any>) => {
        const { data, error } = await this.db
            .from("college_event")
            .insert([event])
            .select();
        if (error) throw error;
        return data?.[0];
    };

    deleteEvent = async (id: string) => {
        const { error } = await this.db
            .from("college_event")
            .delete()
            .eq("id", id);
        if (error) throw error;
        return { success: true };
    };
}
