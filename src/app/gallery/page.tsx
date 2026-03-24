import Footer from "@/components/home/Footer";
import Navbar from "@/components/home/Navbar";

export default function GalleryPage() {
  const galleryItems = [
    {
      title: "Innovation Expo",
      tag: "Events",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774103610/iot/2839f291-11e1-47bf-bf72-c56c2bc3b861.png",
    },
    {
      title: "Prototype Lab",
      tag: "Infrastructure",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774104001/iot/08182265-1d07-4b60-ac81-72aed66b0956.png",
    },
    {
      title: "Industry Session",
      tag: "Mentorship",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774099272/iot/4c5adcf5-81ae-45d4-a989-71dd48f6b1aa_de6560.png",
    },
    {
      title: "Research Showcase",
      tag: "Publications",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774099485/iot/630b65d2-c9eb-46dc-81a0-afde5664f0ee.png",
    },
    {
      title: "Startup Pitch Day",
      tag: "Entrepreneurship",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774103669/iot/e7aa4373-5920-499d-af38-7d109e14ecef.png",
    },
    {
      title: "Student Project Review",
      tag: "Academics",
      image:
        "https://res.cloudinary.com/dvky83edw/image/upload/v1774100388/iot/qdu9vtbn3in9wvkucxxy.jpg",
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
      <Navbar />
      <section className="pt-28 md:pt-36 pb-14 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-[0.3em] uppercase text-[#c9f53b]/85">Visual Archive</p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold">Gallery</h1>
          <p className="mt-5 max-w-3xl text-white/75 leading-relaxed">
            A curated look into events, project demos, lab activities, industry interactions, and team milestones.
          </p>
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {galleryItems.map((item) => (
            <article key={item.title} className="group rounded-2xl overflow-hidden border border-white/10 bg-[#121212]">
              <div
                className="h-56 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c9f53b]/80">{item.tag}</p>
                <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
              </div>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
