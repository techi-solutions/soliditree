import { useEffect, useState } from "react";

export const useIsPortrait = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOrientation = () => {
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);
    };

    // Check orientation on mount
    checkOrientation();

    // Add event listener for orientation changes
    window.addEventListener("resize", checkOrientation);

    // Cleanup
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  return isPortrait;
};
