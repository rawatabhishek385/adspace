import { requireAuth } from "@/lib/session";
import Link from "next/link";
import ListingForm from "@/components/listings/ListingForm";

export default async function CreateListingPage() {
  await requireAuth();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Create New Listing</h2>
        <p className="mt-1 text-slate-500 text-sm">List your advertising space for potential renters</p>
      </div>
      <ListingForm />
    </div>
  );
}
