import type { Database } from "@/types/database.types"

export type Service = Database["public"]["Tables"]["services"]["Row"]
export type ServiceCategory = Database["public"]["Enums"]["service_category"]
export type ServiceBillingType = Database["public"]["Enums"]["service_billing_type"]
