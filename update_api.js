const fs = require('fs');
const path = require('path');

const apiPath = path.resolve('src/app/api/campaigns/request/[id]/status/route.ts');
let c = fs.readFileSync(apiPath, 'utf8');

// 1. Update schema
c = c.replace(/const statusSchema = z\.object\(\{[\s\S]*?\}\);/, `const statusSchema = z.object({
  status: z.nativeEnum(CampaignRequestStatus),
  cancellationReason: z.string().optional(),
  note: z.string().optional(), // Used for REVISION_REQUIRED
  paymentScreenshotUrl: z.string().optional(),
  paymentReferenceId: z.string().optional(),
  paymentVerificationNote: z.string().optional(),
});`);

// 2. Extract new fields from result.data
c = c.replace('const { status, cancellationReason, note } = result.data;', 
  'const { status, cancellationReason, note, paymentScreenshotUrl, paymentReferenceId, paymentVerificationNote } = result.data;');

// 3. Update validTransitions
c = c.replace(/const validTransitions: Record<string, string\[\]> = \{[\s\S]*?\};/, `const validTransitions: Record<string, string[]> = {
      "PENDING": ["ACCEPTED", "REJECTED", "CANCELLED"],
      "ACCEPTED": ["IN_PROGRESS", "CANCELLED"],
      "IN_PROGRESS": ["DELIVERABLES_SUBMITTED", "CANCELLED"],
      "DELIVERABLES_SUBMITTED": ["REVISION_REQUIRED", "PAYMENT_PENDING", "CANCELLED"],
      "REVISION_REQUIRED": ["DELIVERABLES_SUBMITTED", "CANCELLED"],
      "PAYMENT_PENDING": ["PAYMENT_VERIFICATION_PENDING", "CANCELLED"],
      "PAYMENT_VERIFICATION_PENDING": ["PAYMENT_VERIFIED", "PAYMENT_REJECTED"],
      "PAYMENT_REJECTED": ["PAYMENT_VERIFICATION_PENDING", "CANCELLED"],
      "PAYMENT_VERIFIED": ["COMPLETED"],
      "COMPLETED": [],
      "REJECTED": [],
      "CANCELLED": []
    };`);

// 4. Update Role-based validation
c = c.replace('if ((status === "COMPLETED" || status === "REVISION_REQUIRED") && !isAdmin && !isRequester) {\n      return NextResponse.json({ error: "Only the brand can approve or request revisions" }, { status: 403 });\n    }', 
`if ((status === "PAYMENT_PENDING" || status === "REVISION_REQUIRED" || status === "PAYMENT_VERIFICATION_PENDING") && !isAdmin && !isRequester) {
      return NextResponse.json({ error: "Only the brand can submit payment or request revisions" }, { status: 403 });
    }

    if ((status === "PAYMENT_VERIFIED" || status === "PAYMENT_REJECTED" || status === "COMPLETED") && !isAdmin && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can verify payments or complete the campaign" }, { status: 403 });
    }`);

// 5. Update Timestamp updates
c = c.replace('if (status === "COMPLETED") timestampUpdates.completedAt = new Date();\n    if (status === "CANCELLED") {',
`if (status === "COMPLETED") timestampUpdates.completedAt = new Date();
    if (status === "PAYMENT_VERIFIED") {
      timestampUpdates.paymentVerifiedAt = new Date();
      timestampUpdates.paymentVerified = true;
    }
    if (status === "PAYMENT_REJECTED") {
      timestampUpdates.paymentRejectedAt = new Date();
      if (paymentVerificationNote) timestampUpdates.paymentVerificationNote = paymentVerificationNote;
    }
    if (status === "PAYMENT_VERIFICATION_PENDING") {
      if (paymentScreenshotUrl) timestampUpdates.paymentScreenshotUrl = paymentScreenshotUrl;
      if (paymentReferenceId) timestampUpdates.paymentReferenceId = paymentReferenceId;
    }
    if (status === "CANCELLED") {`);

// 6. Update Activity note
c = c.replace('note: note || cancellationReason || null', 'note: note || cancellationReason || paymentVerificationNote || null');

// 7. Update Notifications
c = c.replace(/    } else if \(status === "COMPLETED"\) {[\s\S]*?}\n\n    return NextResponse\.json/g, 
`} else if (status === "PAYMENT_PENDING") {
      await createNotification(
        campaign.requesterId,
        "Payment Required",
        \`Please upload your payment proof for "\${campaign.title}".\`,
        requesterUrl
      );
    } else if (status === "PAYMENT_VERIFICATION_PENDING") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Payment Verification Needed",
        \`The brand has uploaded payment proof for "\${campaign.title}". Please verify.\`,
        influencerUrl
      );
    } else if (status === "PAYMENT_VERIFIED") {
      await createNotification(
        campaign.requesterId,
        "Payment Verified",
        \`The influencer verified your payment for "\${campaign.title}".\`,
        requesterUrl
      );
    } else if (status === "PAYMENT_REJECTED") {
      await createNotification(
        campaign.requesterId,
        "Payment Rejected",
        \`Your payment proof for "\${campaign.title}" was rejected. Please re-upload.\`,
        requesterUrl
      );
    } else if (status === "COMPLETED") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Campaign Completed",
        \`The campaign "\${campaign.title}" has been successfully completed!\`,
        influencerUrl
      );
      await createNotification(
        campaign.requesterId,
        "Campaign Completed",
        \`The campaign "\${campaign.title}" has been successfully completed!\`,
        requesterUrl
      );
    } else if (status === "CANCELLED") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Campaign Cancelled",
        \`The campaign request "\${campaign.title}" was cancelled by the brand.\`,
        "/dashboard/campaigns"
      );
    }

    return NextResponse.json`);

fs.writeFileSync(apiPath, c);
console.log("API written perfectly");
