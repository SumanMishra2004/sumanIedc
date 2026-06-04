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

interface PublicAnnouncementEmailProps {
  recipientName: string;
  resourceType: string;
  resourceTitle: string;
  publicLink: string;
  authors: string[];
}

export const PublicAnnouncementEmail = ({
  recipientName = "Member",
  resourceType = "Journal",
  resourceTitle = "Untitled",
  publicLink = "#",
  authors = [],
}: PublicAnnouncementEmailProps) => {
  const previewText = `New ${resourceType.toLowerCase()} published: "${resourceTitle}"`;
  const authorList =
    authors.length > 0 ? authors.join(", ") : "IEDC Research Hub";

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

          {/* Announcement Banner */}
          <Section style={bannerSection}>
            <Text style={bannerEmoji}>📢</Text>
            <Text style={bannerText}>New Publication</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={heading}>
              A New {resourceType} Has Been Published
            </Heading>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>
              A new {resourceType.toLowerCase()} from our research community has
              been published and is now publicly available. Check it out!
            </Text>

            <Section style={resourceCard}>
              <Text style={resourceTypeLabel}>{resourceType}</Text>
              <Text style={resourceTitleText}>{resourceTitle}</Text>
              <Hr style={cardDivider} />
              <Text style={authorLabel}>Authors</Text>
              <Text style={authorText}>{authorList}</Text>
            </Section>

            <Section style={buttonSection}>
              <Link href={publicLink} style={button}>
                Read Publication →
              </Link>
            </Section>

            <Text style={secondaryText}>
              Stay updated with the latest research from IEDC. More
              publications and achievements coming soon!
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footerSection}>
            <Text style={footerText}>
              This email was sent by IEDC Research Hub to all registered
              members.
            </Text>
            <Text style={footerText}>
              You received this because you are a member of the IEDC Research
              Hub community.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PublicAnnouncementEmail;

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

const bannerSection: React.CSSProperties = {
  backgroundColor: "#0c0c0c",
  padding: "0 40px 24px",
  textAlign: "center" as const,
};

const bannerEmoji: React.CSSProperties = {
  fontSize: "32px",
  margin: "0 0 4px",
};

const bannerText: React.CSSProperties = {
  color: "#c9f53b",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "2px",
  margin: 0,
  textTransform: "uppercase",
};

const bodySection: React.CSSProperties = {
  padding: "28px 40px 32px",
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
  backgroundColor: "#fafafa",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 24px",
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
  fontSize: "18px",
  fontWeight: 700,
  margin: "0",
  lineHeight: "26px",
};

const cardDivider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  borderTop: "1px solid #e5e7eb",
  margin: "12px 0",
};

const authorLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const authorText: React.CSSProperties = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: 0,
};

const buttonSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "0 0 20px",
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

const secondaryText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
  textAlign: "center" as const,
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
