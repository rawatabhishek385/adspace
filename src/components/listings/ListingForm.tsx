"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import dynamic from "next/dynamic";
import AIDescriptionGenerator from "@/components/listings/AIDescriptionGenerator";

const LocationPicker = dynamic(() => import("@/components/maps/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-sm">
      Loading map...
    </div>
  ),
});

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Category is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  indoorOutdoor: z.enum(["Indoor", "Outdoor"]),
  digitalPhysical: z.enum(["Digital", "Physical"]),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  pricePeriod: z.enum(["Hour", "Day", "Week", "Month", "Year"]),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface Category {
  id: string;
  name: string;
}

interface MediaItem {
  url: string;
  publicId?: string;
  type: "IMAGE" | "VIDEO";
}

interface ListingFormProps {
  initialData?: ListingFormData & { id?: string; mediaUrls?: MediaItem[] };
  isEditing?: boolean;
}

export default function ListingForm({ initialData, isEditing }: ListingFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>(initialData?.mediaUrls || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(listingSchema) as any,
    defaultValues: initialData || {
      indoorOutdoor: "Outdoor",
      digitalPhysical: "Physical",
      pricePeriod: "Month",
      latitude: 0,
      longitude: 0,
    },
  });

  const watchLat = watch("latitude");
  const watchLng = watch("longitude");

  const geocodeAddress = async () => {
    const address = watch("address");
    const city = watch("city");
    const country = watch("country");

    if (!address && !city && !country) return;

    const query = `${address || ""}, ${city || ""}, ${country || ""}`.replace(/^,\s*|,\s*$/g, '').trim();
    if (!query) return;

    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setValue("latitude", parseFloat(parseFloat(data[0].lat).toFixed(6)), { shouldValidate: true });
        setValue("longitude", parseFloat(parseFloat(data[0].lon).toFixed(6)), { shouldValidate: true });
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (uploadedMedia.length + files.length > 5) {
      setServerError("You can only upload a maximum of 5 media files.");
      e.target.value = ""; // clear the input
      return;
    }

    setServerError(null); // clear any previous errors

    setIsUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setUploadedMedia((prev) => [...prev, ...data.data]);
      }
    } catch {
      setServerError("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingFormData) => {
    setServerError(null);
    try {
      const url = isEditing ? `/api/listings/${initialData?.id}` : "/api/listings";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, mediaUrls: uploadedMedia }),
      });

      const result = await res.json();
      if (!res.ok) {
        setServerError(result.message);
        return;
      }

      router.push("/dashboard/listings");
      router.refresh();
    } catch {
      setServerError("Something went wrong");
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const selectClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-red-600 text-sm">{serverError}</div>
      )}

      {/* Basic Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Basic Information</h3>
        <div>
          <label htmlFor="title" className={labelClass}>Title</label>
          <input id="title" {...register("title")} placeholder="e.g. Premium LED Billboard - Highway 45" className={inputClass} />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <AIDescriptionGenerator
          title={watch("title")}
          category={categories.find(c => c.id === watch("categoryId"))?.name || ""}
          city={watch("city")}
          indoorOutdoor={watch("indoorOutdoor")}
          digitalPhysical={watch("digitalPhysical")}
          onDescriptionGenerated={(desc) => setValue("description", desc, { shouldValidate: true })}
        />

        <div>
          <label htmlFor="description" className={labelClass}>Description</label>
          <textarea id="description" {...register("description")} rows={4} placeholder="Describe your advertising space..." className={inputClass} />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>
        <div>
          <label htmlFor="categoryId" className={labelClass}>Category</label>
          <select id="categoryId" {...register("categoryId")} className={selectClass}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="country" className={labelClass}>Country</label>
            <input 
              id="country" 
              {...register("country")} 
              onBlur={(e) => {
                register("country").onBlur(e);
                geocodeAddress();
              }}
              placeholder="India" 
              className={inputClass} 
            />
            {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>}
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input 
              id="city" 
              {...register("city")} 
              onBlur={(e) => {
                register("city").onBlur(e);
                geocodeAddress();
              }}
              placeholder="Mumbai" 
              className={inputClass} 
            />
            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="address" className={labelClass}>Address {isGeocoding && <span className="text-blue-500 text-xs ml-2 animate-pulse">Finding on map...</span>}</label>
          <input 
            id="address" 
            {...register("address")} 
            onBlur={(e) => {
              register("address").onBlur(e);
              geocodeAddress();
            }}
            placeholder="Full address" 
            className={inputClass} 
          />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label htmlFor="latitude" className={labelClass}>Latitude</label>
            <input id="latitude" type="number" step="any" {...register("latitude")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="longitude" className={labelClass}>Longitude</label>
            <input id="longitude" type="number" step="any" {...register("longitude")} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Pick Location on Map</label>
          <LocationPicker
            latitude={Number(watchLat) || 0}
            longitude={Number(watchLng) || 0}
            onLocationChange={(lat, lng) => {
              setValue("latitude", parseFloat(lat.toFixed(6)), { shouldValidate: true });
              setValue("longitude", parseFloat(lng.toFixed(6)), { shouldValidate: true });
            }}
          />
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="indoorOutdoor" className={labelClass}>Indoor / Outdoor</label>
            <select id="indoorOutdoor" {...register("indoorOutdoor")} className={selectClass}>
              <option value="Indoor">Indoor</option>
              <option value="Outdoor">Outdoor</option>
            </select>
          </div>
          <div>
            <label htmlFor="digitalPhysical" className={labelClass}>Digital / Physical</label>
            <select id="digitalPhysical" {...register("digitalPhysical")} className={selectClass}>
              <option value="Digital">Digital</option>
              <option value="Physical">Physical</option>
            </select>
          </div>
          <div>
            <label htmlFor="width" className={labelClass}>Width (ft) <span className="text-slate-500">Optional</span></label>
            <input id="width" type="number" step="0.1" {...register("width")} placeholder="0" className={inputClass} />
          </div>
          <div>
            <label htmlFor="height" className={labelClass}>Height (ft) <span className="text-slate-500">Optional</span></label>
            <input id="height" type="number" step="0.1" {...register("height")} placeholder="0" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="price" className={labelClass}>Price (₹)</label>
            <input id="price" type="number" step="0.01" {...register("price")} placeholder="5000" className={inputClass} />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div>
            <label htmlFor="pricePeriod" className={labelClass}>Price Period</label>
            <select id="pricePeriod" {...register("pricePeriod")} className={selectClass}>
              <option value="Hour">Per Hour</option>
              <option value="Day">Per Day</option>
              <option value="Week">Per Week</option>
              <option value="Month">Per Month</option>
              <option value="Year">Per Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">Media</h3>
        <div>
          <label className={labelClass}>Upload Images / Video</label>
          <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-slate-50">
            <div className="text-center">
              {isUploading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-slate-500">Click to upload images or video</span>
                </>
              )}
            </div>
            <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {uploadedMedia.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploadedMedia.map((m, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden bg-slate-100 aspect-square">
                {m.type === "VIDEO" ? (
                  <video src={m.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded">
                  {m.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/listings" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
          ← Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-slate-700 font-medium rounded-lg transition-all flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Listing" : "Create Listing"
          )}
        </button>
      </div>
    </form>
  );
}
