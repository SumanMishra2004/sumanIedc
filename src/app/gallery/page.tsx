import GalleryClient from "./GalleryClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Gallery | IEDC Research Lab",
  description: "Browse images and visual snapshots from our Innovation and Entrepreneurship Development Cell research laboratories, campus hackathons, workshops, and technology presentations.",
};

export default function GalleryPage() {
  return <GalleryClient />;
}
