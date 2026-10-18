import { IntroOverlay } from "./intro-overlay";

// Runs before the overlay is painted: skip the intro if it already played this visit.
const skipIfSeen = `try{if(sessionStorage.getItem("yideaz-intro"))document.documentElement.dataset.intro="seen";else sessionStorage.setItem("yideaz-intro","1")}catch(e){}`;

/** Full-screen logo animation shown the first time the site loads. */
export function Intro() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: skipIfSeen }} />
      <IntroOverlay />
    </>
  );
}
