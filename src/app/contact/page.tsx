import ContactClient from "./ContactClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | IEDC Research Lab",
  description: "Get in touch with the Innovation and Entrepreneurship Development Cell. Inquire about research publications, patent filings, startups incubator space, or general support.",
};

export default function ContactPage() {
  return <ContactClient />;
}
