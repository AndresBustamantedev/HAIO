import type { Database } from "@/types/database.types"

export type Client = Database["public"]["Tables"]["clients"]["Row"]
export type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"]
export type ClientStatus = Database["public"]["Enums"]["client_status"]
export type ClientType = Database["public"]["Enums"]["client_type"]
