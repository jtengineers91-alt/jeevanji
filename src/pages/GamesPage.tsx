import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import GameModules from "@/components/landing/GameModules";

const GamesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-12">
        <div className="container mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            All <span className="text-primary">Games</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Choose your game and start winning</p>
        </div>
        <GameModules />
      </div>
      <Footer />
    </div>
  );
};

export default GamesPage;
