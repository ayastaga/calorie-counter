import { HeroSection } from "./components/hero-section";
import { FeatureSection } from "./components/feature-section";
import Footer from "./components/footer";

export default function IndexPage() {
  return (
    <div>
      <HeroSection />
      <FeatureSection />
      <Footer />
    </div>
  );
}
