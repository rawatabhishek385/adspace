const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve('prisma/schema.prisma');
let c = fs.readFileSync(schemaPath, 'utf8');

// 1. Replace CampaignRequest
c = c.replace(/model CampaignRequest \{[\s\S]*?\n\}/, `model CampaignRequest {
  id String @id @default(cuid())

  requesterId         String
  influencerProfileId String

  title       String
  description String  @db.Text
  budget      Float?
  timeline    String?
  timelineDays Int    @default(1)
  progress     Int    @default(0)

  campaignType OutreachCampaignType

  status CampaignRequestStatus @default(PENDING)

  price              Float?
  startedAt          DateTime?
  submittedAt        DateTime?
  completedAt        DateTime?
  cancelledAt        DateTime?
  cancellationReason String? @db.Text

  paymentScreenshotUrl    String?
  paymentVerifiedAt       DateTime?
  paymentRejectedAt       DateTime?
  paymentVerificationNote String? @db.Text
  paymentReferenceId      String?
  paymentVerified         Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  requester         User                  @relation("CampaignRequestsSent", fields: [requesterId], references: [id], onDelete: Cascade)
  influencerProfile InfluencerProfile     @relation("InfluencerCampaignRequests", fields: [influencerProfileId], references: [id], onDelete: Cascade)
  conversations     Conversation[]
  deliverables      CampaignDeliverable[]
  statusHistory     CampaignStatusHistory[]
  activities        CampaignActivity[]
  dailyReports      CampaignDailyReport[]

  @@index([requesterId])
  @@index([influencerProfileId])
}`);

// 2. Replace CampaignDeliverable
c = c.replace(/model CampaignDeliverable \{[\s\S]*?\n\}/, `model CampaignDeliverable {
  id       String  @id @default(cuid())
  campaignRequestId  String

  title    String
  type     String  @default("LINK")
  url      String  @default("")

  status   DeliverableStatus @default(PENDING)
  reviewNote String? @db.Text

  uploadedById      String

  uploadedBy      User            @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  campaignRequest CampaignRequest @relation(fields: [campaignRequestId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([campaignRequestId])
  @@index([uploadedById])
}`);

// 3. Append Missing Enums and Models
const appendText = `
enum DailyReportStatus {
  PENDING
  SUBMITTED
  APPROVED
  REVISION_REQUIRED
}

enum DeliverableStatus {
  PENDING
  SUBMITTED
  APPROVED
  REVISION_REQUIRED
}

model CampaignStatusHistory {
  id          String   @id @default(cuid())
  campaignId  String

  fromStatus  CampaignRequestStatus?
  toStatus    CampaignRequestStatus

  changedBy   String
  note        String?  @db.Text

  createdAt   DateTime @default(now())

  campaign    CampaignRequest @relation(fields:[campaignId], references:[id], onDelete: Cascade)

  @@index([campaignId])
}

model CampaignActivity {
  id          String @id @default(cuid())

  campaignId  String

  actorId     String
  actorType   String

  action      String
  description String? @db.Text

  createdAt DateTime @default(now())

  campaign CampaignRequest @relation(fields:[campaignId], references:[id], onDelete: Cascade)

  @@index([campaignId])
}

model CampaignDailyReport {
  id          String   @id @default(cuid())
  campaignId  String
  dayNumber   Int
  
  title       String
  description String   @db.Text
  imageUrls   Json?
  videoUrls   Json?
  link        String?

  status      DailyReportStatus @default(PENDING)
  reviewNote  String?  @db.Text
  
  campaign    CampaignRequest @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([campaignId, dayNumber])
  @@index([campaignId])
}
`;

fs.writeFileSync(schemaPath, c + appendText);
console.log("Schema restored and updated perfectly");
