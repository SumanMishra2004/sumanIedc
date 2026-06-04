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

interface SubmissionEmailProps {
  recipientName: string;
  resourceType: string;
  resourceTitle: string;
  submittedBy: string;
  dashboardLink: string;
}

export const SubmissionEmail = ({
  recipientName = "Colleague",
  resourceType = "Journal",
  resourceTitle = "Untitled",
  submittedBy = "A team member",
  dashboardLink = "#",
}: SubmissionEmailProps) => {
  const previewText = `New ${resourceType} submitted: "${resourceTitle}"`;

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
            <Text style={badgeSubmitted}>📄 New Submission</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={heading}>
              You&apos;ve Been Added as a Co-Author
            </Heading>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              <strong>{submittedBy}</strong> has submitted a new{" "}
              <strong>{resourceType.toLowerCase()}</strong> and listed you as a
              co-author:
            </Text>

            <Section style={resourceCard}>
              <Text style={resourceTypeLabel}>{resourceType}</Text>
              <Text style={resourceTitleText}>{resourceTitle}</Text>
            </Section>

            <Text style={paragraph}>
              This submission is now pending faculty review. You&apos;ll be
              notified when the status changes.
            </Text>

            <Section style={buttonSection}>
              <Link href={dashboardLink} style={button}>
                View in Dashboard →
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footerSection}>
            <Text style={footerText}>
              This email was sent by IEDC Research Hub. You received this because
              you are listed as a co-author.
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

export default SubmissionEmail;

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

const badgeSubmitted: React.CSSProperties = {
  backgroundColor: "#dbeafe",
  borderRadius: "20px",
  color: "#1d4ed8",
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
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 20px",
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
