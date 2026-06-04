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

interface PublicationEmailProps {
  recipientName: string;
  resourceType: string;
  resourceTitle: string;
  publicLink: string;
  dashboardLink: string;
}

export const PublicationEmail = ({
  recipientName = "Author",
  resourceType = "Journal",
  resourceTitle = "Untitled",
  publicLink = "#",
  dashboardLink = "#",
}: PublicationEmailProps) => {
  const previewText = `🎉 Your ${resourceType.toLowerCase()} has been published: "${resourceTitle}"`;

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
            <Text style={badgePublished}>🎉 Published</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={heading}>
              Congratulations! Your Work Is Live
            </Heading>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              We&apos;re thrilled to inform you that your{" "}
              {resourceType.toLowerCase()} has been officially published and is
              now publicly accessible!
            </Text>

            <Section style={resourceCard}>
              <Text style={resourceTypeLabel}>{resourceType}</Text>
              <Text style={resourceTitleText}>{resourceTitle}</Text>
              <Text style={statusText}>🌐 Publicly Available</Text>
            </Section>

            <Text style={paragraph}>
              Your work is now visible to the entire research community. Share
              the public link below with your colleagues and network:
            </Text>

            <Section style={linkCard}>
              <Text style={linkLabel}>Public Link:</Text>
              <Link href={publicLink} style={publicLinkText}>
                {publicLink}
              </Link>
            </Section>

            <Section style={buttonRow}>
              <Link href={publicLink} style={buttonPrimary}>
                View Public Page →
              </Link>
            </Section>

            <Section style={buttonRow}>
              <Link href={dashboardLink} style={buttonSecondary}>
                View in Dashboard
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
              Congratulations on this achievement!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PublicationEmail;

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

const badgePublished: React.CSSProperties = {
  backgroundColor: "#ede9fe",
  borderRadius: "20px",
  color: "#6d28d9",
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
  backgroundColor: "#f5f3ff",
  border: "1px solid #ddd6fe",
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
  margin: "0 0 8px",
  lineHeight: "24px",
};

const statusText: React.CSSProperties = {
  color: "#6d28d9",
  fontSize: "13px",
  fontWeight: 500,
  margin: 0,
};

const linkCard: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 20px",
};

const linkLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const publicLinkText: React.CSSProperties = {
  color: "#2563eb",
  fontSize: "13px",
  textDecoration: "underline",
  wordBreak: "break-all",
};

const buttonRow: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "8px 0",
};

const buttonPrimary: React.CSSProperties = {
  backgroundColor: "#c9f53b",
  borderRadius: "8px",
  color: "#0c0c0c",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 700,
  padding: "12px 32px",
  textDecoration: "none",
};

const buttonSecondary: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  color: "#374151",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: 600,
  padding: "10px 24px",
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
