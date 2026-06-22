import NearbyListingsSection from "@/components/location/NearbyListingsSection";

export default function NearbyPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-3xl font-bold text-slate-800">Explore Nearby</h1>
        <p className="text-slate-600 mt-2">Discover advertising spaces closest to your current location.</p>
      </div>
      <NearbyListingsSection />
    </div>
  );
}
