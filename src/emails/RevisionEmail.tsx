import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface RevisionEmailProps {
  recipientName: string;
  resourceType: string;
  resourceTitle: string;
  revisionReason?: string;
  reviewerName?: string;
  dashboardLink: string;
}

export const RevisionEmail = ({
  recipientName = "Author",
  resourceType = "Journal",
  resourceTitle = "Untitled",
  revisionReason,
  reviewerName,
  dashboardLink = "#",
}: RevisionEmailProps) => {
  const previewText = `Revision requested for your ${resourceType.toLowerCase()}: "${resourceTitle}"`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logo}>IEDC Research Hub</Heading>
          </Section>

          {/* Status Badge */}
          <Section style={badgeSection}>
            <Text style={badgeRevision}>🔄 Revision Requested</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={heading}>Changes Requested</Heading>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              {reviewerName ? `${reviewerName}` : "The faculty reviewer"} has
              reviewed your {resourceType.toLowerCase()} and requested some
              changes before it can proceed:
            </Text>

            <Section style={resourceCard}>
              <Text style={resourceTypeLabel}>{resourceType}</Text>
              <Text style={resourceTitleText}>{resourceTitle}</Text>
            </Section>

            {revisionReason && (
              <Section style={reasonCard}>
                <Text style={reasonLabel}>Reviewer&apos;s Comments:</Text>
                <Text style={reasonText}>{revisionReason}</Text>
              </Section>
            )}

            <Text style={paragraph}>
              Please review the feedback and make the necessary updates. Once
              you save your changes, the submission will be automatically
              resubmitted for review.
            </Text>

            <Section style={buttonSection}>
              <Link href={dashboardLink} style={button}>
                Make Changes →
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footerSection}>
            <Text style={footerText}>
              This email was sent by IEDC Research Hub.
            </Text>
            <Text style={footerText}>
              If you believe this was sent in error, please contact your
              administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RevisionEmail;

// ─── Styles ──────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
};

const headerSection: React.CSSProperties = {
  backgroundColor: "#0c0c0c",
  padding: "24px 40px",
};

const logo: React.CSSProperties = {
  color: "#c9f53b",
  fontSize: "20px",
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.5px",
};

const badgeSection: React.CSSProperties = {
  padding: "20px 40px 0",
};

const badgeRevision: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "20px",
  color: "#b45309",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: 600,
  padding: "6px 16px",
  margin: 0,
};

const bodySection: React.CSSProperties = {
  padding: "16px 40px 32px",
};

const heading: React.CSSProperties = {
  color: "#0c0c0c",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "32px",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const resourceCard: React.CSSProperties = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 16px",
};

const resourceTypeLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const resourceTitleText: React.CSSProperties = {
  color: "#0c0c0c",
  fontSize: "16px",
  fontWeight: 600,
  margin: 0,
  lineHeight: "24px",
};

const reasonCard: React.CSSProperties = {
  backgroundColor: "#fef9ee",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "0 8px 8px 0",
  padding: "16px 20px",
  margin: "0 0 20px",
};

const reasonLabel: React.CSSProperties = {
  color: "#92400e",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
  textTransform: "uppercase",
};

const reasonText: React.CSSProperties = {
  color: "#451a03",
  fontSize: "14px",
  fontStyle: "italic",
  lineHeight: "22px",
  margin: 0,
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "8px 0 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#c9f53b",
  borderRadius: "8px",
  color: "#0c0c0c",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 32px",
  textDecoration: "none",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderTop: "1px solid #e5e7eb",
  margin: "0",
};

const footerSection: React.CSSProperties = {
  padding: "24px 40px",
};

const footerText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 4px",
};
