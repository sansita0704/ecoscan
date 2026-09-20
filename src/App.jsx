import { useCallback, useState } from "react";
import Header from "./components/layout/Header";
import MobileNav from "./components/layout/MobileNav";
import Sidebar from "./components/layout/Sidebar";
import { useCamera } from "./hooks/useCamera";
import { useMultiDisposalAdvice } from "./hooks/useMultiDisposalAdvice";
import { useScanLog } from "./hooks/useScanLog";
import ChatPage from "./pages/ChatPage";
import FacilitiesPage from "./pages/FacilitiesPage";
import ImpactPage from "./pages/ImpactPage";
import LandingPage from "./pages/LandingPage";
import ScannerPage from "./pages/ScannerPage";
import WasteGuidePage from "./pages/WasteGuidePage";

/**
 * App shell. The camera, mute state and the local scan log live here so they
 * survive page switches (the camera keeps running; the detection loop pauses
 * when Scanner unmounts).
 * If you later need URLs, swap the `view` state for react-router routes.
 */
export default function App() {
  const [view, setView] = useState("home");
  const [muted, setMuted] = useState(false);
  const camera = useCamera();
  const { stats, track, reset } = useScanLog();
  // Held here rather than in ScannerPage so advice survives leaving the scanner
  // and coming back, the same way the camera does. One independent advice
  // slot per confirmed item (see hooks/useMultiDisposalAdvice), not one global
  // slot, so asking about a second item doesn't clear the first item's answer.
  const advice = useMultiDisposalAdvice();

  const navigate = useCallback((next) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const startScanning = useCallback(() => {
    navigate("scanner");
    camera.start();
  }, [navigate, camera]);

  return (
    <div className="min-h-screen">
      <Sidebar view={view} onNavigate={navigate} points={stats.points} />

      <div className="lg:pl-60">
        <Header camera={camera} onNavigate={navigate} />

        <main
          id="main"
          className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10"
        >
          {view === "home" && (
            <LandingPage
              stats={stats}
              onStart={startScanning}
              onExplore={() => navigate("impact")}
            />
          )}
          {view === "scanner" && (
            <ScannerPage
              camera={camera}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
              onScan={track}
              advice={advice}
            />
          )}
          {view === "guide" && <WasteGuidePage stats={stats} />}
          {view === "facilities" && <FacilitiesPage />}
          {view === "chat" && <ChatPage />}
          {view === "impact" && (
            <ImpactPage stats={stats} onReset={reset} onStartScanning={startScanning} />
          )}
        </main>
      </div>

      <MobileNav view={view} onNavigate={navigate} />
    </div>
  );
}
