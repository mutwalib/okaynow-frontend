import { redirect } from "next/navigation";

export default function AgencyInvoicesRedirect() {
  redirect("/agency/settings/invoices");
}
