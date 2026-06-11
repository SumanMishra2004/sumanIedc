import { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us | IEDC Research Lab",
  description: "Discover the journey, mission, vision, and core pillars of the Innovation & Entrepreneurship Development Cell (IEDC) at the Computer Science & Engineering department.",
};

export default function AboutPage() {
  return <AboutClient />;
}
