"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCountries, getStates, getCities } from "@/lib/locationData";

const ASIAN_COUNTRIES = getCountries();

// ─── Zod Validation Schema ──────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
    city: z.string().min(2, "City is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),

    applyInfluencer: z.boolean().optional(),
    influencerType: z.enum(["INDIVIDUAL", "DIGITAL_MARKETER"]).optional(),
    companyName: z.string().optional(),
    description: z.string().optional(),
    influencerCategory: z.string().optional(),
    influencerCity: z.string().optional(),
    followers: z.string().optional(),
    pricePerPost: z.string().optional(),
    profileImage: z.string().optional(),
    instagramUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
    twitterUrl: z.string().optional(),
    linkedinUrl: z.string().optional(),
    facebookUrl: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.applyInfluencer) {
        if (!data.influencerType) return false;
        if (data.influencerType === "DIGITAL_MARKETER" && (!data.companyName || data.companyName.trim() === "")) return false;
      }
      return true;
    },
    {
      message: "Company Name is required for Digital Marketers.",
      path: ["companyName"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Component ──────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { status } = useSession();
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: "India",
      state: "",
      city: "",
      applyInfluencer: false,
      influencerType: "INDIVIDUAL",
    },
  });

  const selectedCountry = watch("country");
  const selectedState = watch("state");
  const applyInfluencer = watch("applyInfluencer");
  const influencerType = watch("influencerType");

  // Cascading: states depend on country
  const stateList = useMemo(() => getStates(selectedCountry), [selectedCountry]);

  // Cascading: cities depend on country + state
  const cityList = useMemo(() => getCities(selectedCountry, selectedState), [selectedCountry, selectedState]);

  // When country changes, reset state and city
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setValue("country", newCountry);
    setValue("state", "");
    setValue("city", "");
  };

  // When state changes, reset city
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setValue("state", newState);
    setValue("city", "");
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          country: data.country,
          state: data.state,
          city: data.city,
          applyInfluencer: data.applyInfluencer,
          influencerType: data.influencerType,
          companyName: data.companyName,
          description: data.description,
          influencerCategory: data.influencerCategory,
          influencerCity: data.influencerCity,
          followers: data.followers,
          profileImage: data.profileImage,
          instagramUrl: data.instagramUrl,
          youtubeUrl: data.youtubeUrl,
          twitterUrl: data.twitterUrl,
          linkedinUrl: data.linkedinUrl,
          facebookUrl: data.facebookUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.message || "Registration failed");
        return;
      }

      setIsSuccess(true);
      setTimeout(() => router.push("/login"), 10000);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 py-12">
      <div className="w-full max-w-md">
        {/* ─── Brand Header ─────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Ad<span className="text-blue-500">Space</span>
            </h1>
          </Link>
          <p className="mt-2 text-slate-500 text-sm">
            Create your account to get started
          </p>
        </div>

        {/* ─── Card ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 shadow-xl">
          {/* Success State */}
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Account Created!</h2>
              <p className="text-slate-500 text-sm">A verification email has been sent to your registered email address. Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Server Error */}
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-500 text-sm">
                  {serverError}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  {...register("email")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Phone Number <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <select
                    id="country"
                    {...register("country")}
                    onChange={handleCountryChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  >
                    <option value="" disabled className="text-slate-500 bg-white">Select your country</option>
                    {ASIAN_COUNTRIES.map((country) => (
                      <option key={country} value={country} className="bg-white text-slate-800">
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.country && (
                  <p className="mt-1 text-xs text-red-500">{errors.country.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* State */}
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-slate-600 mb-1.5">
                    State
                  </label>
                  <div className="relative">
                    <select
                      id="state"
                      {...register("state")}
                      onChange={handleStateChange}
                      disabled={stateList.length === 0}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-white text-slate-400">
                        {stateList.length === 0 ? "Select country first" : "Select state"}
                      </option>
                      {stateList.map((state) => (
                        <option key={state} value={state} className="bg-white text-slate-800">
                          {state}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-600 mb-1.5">
                    City
                  </label>
                  <div className="relative">
                    <select
                      id="city"
                      {...register("city")}
                      disabled={cityList.length === 0}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-white text-slate-400">
                        {cityList.length === 0 ? "Select state first" : "Select city"}
                      </option>
                      {cityList.map((city) => (
                        <option key={city} value={city} className="bg-white text-slate-800">
                          {city}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Must be at least 8 characters, and contain an uppercase letter, lowercase letter, and number.
                </p>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-600 mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* ─── Influencer Section ───────────────────────────────────── */}
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50/50 border border-blue-100 rounded-xl transition-all hover:bg-blue-50">
                  <input
                    type="checkbox"
                    {...register("applyInfluencer")}
                    className="w-5 h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-slate-800">
                      🚀 Start Your Journey as an Influencer
                    </span>
                    <span className="text-xs text-slate-500">
                      Apply to become an Individual Creator or Digital Marketer.
                    </span>
                  </div>
                </label>
              </div>

              {/* Influencer Fields Form */}
              {applyInfluencer && (
                <div className="space-y-5 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Account Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="INDIVIDUAL"
                          {...register("influencerType")}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                        />
                        Individual Creator
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          value="DIGITAL_MARKETER"
                          {...register("influencerType")}
                          className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                        />
                        Company / Agency
                      </label>
                    </div>
                  </div>

                  {/* Company Name */}
                  {influencerType === "DIGITAL_MARKETER" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name</label>
                      <input
                        type="text"
                        placeholder="Agency Name LLC"
                        {...register("companyName")}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                      />
                      {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>}
                    </div>
                  )}

                  {/* Basic Influencer Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Tech, Fashion, General"
                        {...register("influencerCategory")}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">City</label>
                      <input
                        type="text"
                        placeholder="e.g. New York"
                        {...register("influencerCity")}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Followers</label>
                      <input
                        type="number"
                        placeholder="10000"
                        {...register("followers")}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1.5">Price Per Post (₹)</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        {...register("pricePerPost")}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Profile Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      {...register("profileImage")}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Description / Services */}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Services Offered</label>
                    <textarea
                      placeholder="List the services you offer (e.g., Sponsored Posts, Story Mentions, Content Creation)."
                      rows={3}
                      {...register("description")}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  {/* Social Media */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-600">Social Media URLs</label>
                    <input type="url" placeholder="Instagram URL" {...register("instagramUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
                    <input type="url" placeholder="YouTube URL" {...register("youtubeUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
                    <input type="url" placeholder="Twitter/X URL" {...register("twitterUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
                    <input type="url" placeholder="LinkedIn URL" {...register("linkedinUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
                    <input type="url" placeholder="Facebook URL" {...register("facebookUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}
        </div>

        {/* ─── Footer Link ──────────────────────────────────────────── */}
        <p className="text-center mt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
