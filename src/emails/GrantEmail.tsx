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

export interface GrantEmailProps {
  recipientName?: string;
  badgeText: string;
  badgeType?: "info" | "success" | "warning" | "error";
  emailSubject: string;
  heading: string;
  bodyText: string;
  projectCode: string;
  projectTitle?: string;
  statusText: string;
  dashboardLink: string;
}

export const GrantEmail = ({
  recipientName = "Member",
  badgeText = "Update",
  badgeType = "info",
  emailSubject = "Grant Update",
  heading = "Grant Workflow Update",
  bodyText = "There has been an update to a grant you are associated with.",
  projectCode = "N/A",
  projectTitle,
  statusText = "Updated",
  dashboardLink = "#",
}: GrantEmailProps) => {
  // Determine badge styling
  let badgeStyle = badgeInfo;
  let cardStyle = cardInfo;
  let statusColor = "#1d4ed8";

  if (badgeType === "success") {
    badgeStyle = badgeSuccess;
    cardStyle = cardSuccess;
    statusColor = "#15803d";
  } else if (badgeType === "warning") {
    badgeStyle = badgeWarning;
    cardStyle = cardWarning;
    statusColor = "#b45309";
  } else if (badgeType === "error") {
    badgeStyle = badgeError;
    cardStyle = cardError;
    statusColor = "#b91c1c";
  }

  return (
    <Html>
      <Head />
      <Preview>{emailSubject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={logo}>IEDC Research Hub</Heading>
          </Section>

          {/* Status Badge */}
          <Section style={badgeSection}>
            <Text style={badgeStyle}>{badgeText}</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Heading style={headingStyle}>{heading}</Heading>

            <Text style={paragraph}>Hi {recipientName},</Text>

            <Text style={paragraph}>{bodyText}</Text>

            {/* Grant Details Card */}
            <Section style={cardStyle}>
              <Text style={cardLabel}>PROJECT CODE</Text>
              <Text style={cardTitleText}>{projectCode}</Text>
              {projectTitle && (
                <>
                  <Text style={{ ...cardLabel, marginTop: "8px" }}>PROJECT NAME</Text>
                  <Text style={cardTitleText}>{projectTitle}</Text>
                </>
              )}
              <Text style={{ ...cardLabel, marginTop: "8px" }}>STATUS</Text>
              <Text style={{ ...cardStatusText, color: statusColor }}>{statusText}</Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonSection}>
              <Link href={dashboardLink} style={button}>
                View Grant Details →
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
              If you believe this was sent in error, please contact your administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default GrantEmail;

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

const baseBadge: React.CSSProperties = {
  borderRadius: "20px",
  display: "inline-block",
  fontSize: "13px",
  fontWeight: 600,
  padding: "6px 16px",
  margin: 0,
};

const badgeInfo: React.CSSProperties = {
  ...baseBadge,
  backgroundColor: "#dbeafe",
  color: "#1d4ed8",
};

const badgeSuccess: React.CSSProperties = {
  ...baseBadge,
  backgroundColor: "#dcfce7",
  color: "#15803d",
};

const badgeWarning: React.CSSProperties = {
  ...baseBadge,
  backgroundColor: "#fef3c7",
  color: "#b45309",
};

const badgeError: React.CSSProperties = {
  ...baseBadge,
  backgroundColor: "#fee2e2",
  color: "#b91c1c",
};

const bodySection: React.CSSProperties = {
  padding: "16px 40px 32px",
};

const headingStyle: React.CSSProperties = {
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

const baseCard: React.CSSProperties = {
  border: "1px solid",
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 20px",
};

const cardInfo: React.CSSProperties = {
  ...baseCard,
  backgroundColor: "#f0f9ff",
  borderColor: "#bae6fd",
};

const cardSuccess: React.CSSProperties = {
  ...baseCard,
  backgroundColor: "#f0fdf4",
  borderColor: "#bbf7d0",
};

const cardWarning: React.CSSProperties = {
  ...baseCard,
  backgroundColor: "#fffbeb",
  borderColor: "#fde68a",
};

const cardError: React.CSSProperties = {
  ...baseCard,
  backgroundColor: "#fef2f2",
  borderColor: "#fecaca",
};

const cardLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const cardTitleText: React.CSSProperties = {
  color: "#0c0c0c",
  fontSize: "15px",
  fontWeight: 600,
  margin: 0,
  lineHeight: "22px",
};

const cardStatusText: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
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
