import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.ts";

export class UserDAL {
    constructor(private db: SupabaseClient = supabase) {}

    getAllUsers = async () => {
        const { data, error } = await this.db
            .from("users")
            .select("*")
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    };

    createUser = async (user: {
        id: string;
        name: string;
        email: string;
        role: string;
    }) => {
        const { data, error } = await this.db
            .from("users")
            .insert([user])
            .select();
        if (error) throw error;
        return data?.[0];
    };

    updateUser = async (id: string, payload: Record<string, any>) => {
        const { data, error } = await this.db
            .from("users")
            .update(payload)
            .eq("id", id)
            .select();
        if (error) throw error;
        return data?.[0];
    };

    deleteUser = async (id: string) => {
        const { error } = await this.db.from("users").delete().eq("id", id);
        if (error) throw error;
        return { success: true };
    };
}
