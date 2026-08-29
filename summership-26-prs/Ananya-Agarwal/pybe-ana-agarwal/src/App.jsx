import React, { useState } from "react";
import { SessionProvider } from "./context/SessionContext.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import RecursionExperience from "./components/recursion/RecursionExperience.jsx";
import ClassesExperience from "./components/classes/ClassesExperience.jsx";
import BfsDfsExperience from "./components/bfsdfs/BfsDfsExperience.jsx";
import CoderModeOverlay from "./components/coder/CoderModeOverlay.jsx";

export default function App() {
  const [view, setView] = useState("home"); // "home" | "recursion" | "classes" | "bfsdfs" | "coder"

  const goHome = () => setView("home");

  return (
    <SessionProvider>
      {view === "home"      && <HomeScreen onSelect={setView} />}
      {view === "recursion" && <RecursionExperience onHome={goHome} />}
      {view === "classes"   && <ClassesExperience onHome={goHome} />}
      {view === "bfsdfs"    && <BfsDfsExperience onHome={goHome} />}
      {view === "coder"     && <CoderModeOverlay concept="recursion" onClose={goHome} />}
    </SessionProvider>
  );
}
