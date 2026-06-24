const fs = require('fs');
const path = require('path');

const filePath = path.resolve('src/app/dashboard/campaigns/[id]/page.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// 1. Types
c = c.replace('activities: CampaignActivity[];', 
`activities: CampaignActivity[];
  paymentScreenshotUrl?: string;
  paymentVerifiedAt?: string;
  paymentRejectedAt?: string;
  paymentVerificationNote?: string;
  paymentReferenceId?: string;
  paymentVerified?: boolean;`);

// 2. State
c = c.replace('const [cancelReason, setCancelReason] = useState("");', 
`const [cancelReason, setCancelReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({ referenceId: "" });
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });`);

// 3. Handlers
c = c.replace('const showToast = (msg: string, type: "error"|"success") => {', 
`const handlePaymentUpload = async (result: any) => {
    if (result.event !== "success") return;
    setUploadingPayment(true);
    try {
      const res = await fetch(\`/api/campaigns/request/\${id}/status\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAYMENT_VERIFICATION_PENDING",
          paymentScreenshotUrl: result.info.secure_url,
          paymentReferenceId: paymentForm.referenceId,
        })
      });
      if (!res.ok) throw new Error("Failed to submit payment proof");
      showToast("Payment proof submitted successfully", "success");
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUploadingPayment(false);
    }
  };

  const submitReview = async () => {
    setUpdating(true);
    try {
      const res = await fetch(\`/api/campaigns/request/\${id}/review\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit review");
      }
      showToast("Review submitted successfully", "success");
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (msg: string, type: "error"|"success") => {`);

// 4. Stepper mapping
c = c.replace(/\{"PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERABLES_SUBMITTED", "COMPLETED"\}\.map\(\(step, idx\) => \{/g,
`{["PENDING", "ACCEPTED", "IN_PROGRESS", "SUBMITTED", "PAYMENT", "VERIFICATION", "COMPLETED"].map((step, idx) => {`);

c = c.replace(/const currentIdx = \["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERABLES_SUBMITTED", "COMPLETED"\]\.indexOf\([\s\S]*?campaign\.status[\s\S]*?\);/,
`const currentIdx = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERABLES_SUBMITTED", "PAYMENT_PENDING", "PAYMENT_VERIFICATION_PENDING", "COMPLETED"].indexOf(
                campaign.status === "REVISION_REQUIRED" ? "DELIVERABLES_SUBMITTED" : 
                campaign.status === "PAYMENT_REJECTED" ? "PAYMENT_PENDING" :
                campaign.status === "PAYMENT_VERIFIED" ? "COMPLETED" :
                campaign.status
              );`);

c = c.replace('width: campaign.status === "PENDING" ? "10%" :', 
`width: campaign.status === "PENDING" ? "5%" : 
                       campaign.status === "ACCEPTED" ? "20%" : 
                       campaign.status === "IN_PROGRESS" ? "35%" : 
                       campaign.status === "DELIVERABLES_SUBMITTED" || campaign.status === "REVISION_REQUIRED" ? "50%" : 
                       campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_REJECTED" ? "65%" : 
                       campaign.status === "PAYMENT_VERIFICATION_PENDING" ? "85%" : `);

// 5. Payment UI and Reviews UI
const paymentUi = `
            {/* Payment Section */}
            {(campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_VERIFICATION_PENDING" || campaign.status === "PAYMENT_REJECTED" || campaign.status === "COMPLETED") && (
              <section className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Verification</h3>
                
                {campaign.status === "PAYMENT_REJECTED" && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <h4 className="font-bold mb-1">Payment Rejected</h4>
                    <p className="text-sm">{campaign.paymentVerificationNote || "Please verify your payment details and re-upload the proof."}</p>
                  </div>
                )}

                {(campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_REJECTED") && isRequester && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                    <h4 className="font-bold text-indigo-900 mb-3">Upload Payment Proof</h4>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Reference ID / UTR Number" 
                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={paymentForm.referenceId}
                        onChange={(e) => setPaymentForm({...paymentForm, referenceId: e.target.value})}
                      />
                      <CldUploadWidget uploadPreset="ad_space" onSuccess={handlePaymentUpload}>
                        {({ open }) => (
                          <button 
                            onClick={() => open()} 
                            disabled={uploadingPayment || !paymentForm.referenceId} 
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {uploadingPayment ? "Uploading..." : "Upload Screenshot & Submit"}
                          </button>
                        )}
                      </CldUploadWidget>
                    </div>
                  </div>
                )}

                {(campaign.status === "PAYMENT_VERIFICATION_PENDING" || campaign.status === "COMPLETED") && campaign.paymentScreenshotUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <a href={campaign.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                        <img src={campaign.paymentScreenshotUrl} alt="Payment Proof" className="w-full h-full object-cover" />
                      </a>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment Reference</p>
                        <p className="font-bold text-slate-800 text-lg">{campaign.paymentReferenceId || "N/A"}</p>
                        {campaign.status === "COMPLETED" ? (
                          <span className="inline-flex mt-2 items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex mt-2 items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Optional Reviews Section */}
            {campaign.status === "COMPLETED" && (
              <section className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Leave a Review</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-slate-600 mb-4">How was your experience working on this campaign? Your review helps keep the community safe and reliable.</p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className={\`w-8 h-8 rounded-full flex items-center justify-center \${reviewForm.rating >= star ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}\`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Write your review here (optional)..." 
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    ></textarea>
                    <button 
                      onClick={submitReview}
                      disabled={updating}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </section>
            )}
`;

c = c.replace('{/* Status History & Timeline */}', paymentUi + '\n\n            {/* Status History & Timeline */}');

// 6. Action buttons mapping
c = c.replace('onClick={() => handleUpdateStatus("COMPLETED")}', 
`onClick={() => handleUpdateStatus("PAYMENT_PENDING")}`);

c = c.replace('Approve & Complete', 'Approve Deliverables & Proceed to Payment');

const influencerPaymentVerificationButtons = `
              {campaign.status === "PAYMENT_VERIFICATION_PENDING" && isInfluencer && (
                <>
                  <button 
                    onClick={() => {
                      const note = prompt("Please provide a reason for rejecting the payment:");
                      if (note) {
                        handleUpdateStatus("PAYMENT_REJECTED", note);
                      }
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
                  >
                    Reject Payment
                  </button>
                  <button 
                    onClick={() => {
                       handleUpdateStatus("PAYMENT_VERIFIED").then(() => handleUpdateStatus("COMPLETED"));
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
                  >
                    Verify Payment & Complete Campaign
                  </button>
                </>
              )}
`;

c = c.replace('</>\n              )}', `</>\n              )}\n\n` + influencerPaymentVerificationButtons);


fs.writeFileSync(filePath, c);
console.log("UI updated perfectly");
