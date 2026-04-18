import Navbar from "@/components/landing/Navbar";
import IPLBannerCarousel from "@/components/landing/IPLBannerCarousel";
import HeroSection from "@/components/landing/HeroSection";
import GameModules from "@/components/landing/GameModules";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import LiveScoreTicker from "@/components/LiveScoreTicker";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-14">
        <IPLBannerCarousel />
        <LiveScoreTicker />
      </div>
      <HeroSection />
      <GameModules />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
