import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion, useIsMobile } from "../../utils/performance";
import Container from "react-bootstrap/Container";
import "../../Assets/CSS/style.css";
import heroVideo from "../../Assets/videos/1761381301391.mp4";
import { Link } from "react-router-dom";
import AnimatedButton from "../AnimatedButton";
import ScrollAnimation from "../ScrollAnimation";
import { fadeInLeft, fadeInRight, staggerContainer, staggerItem } from "../../utils/animations";

const HotspotMap = React.lazy(() => import("./HotspotMap"));

/* ═══════════════════════════════════════════════════════════════════════════
   CINEMATIC SCROLL INTRO
═══════════════════════════════════════════════════════════════════════════ */

function CinematicIntro({ children }) {
  const canvasRef = useRef(null);
  const introRef = useRef(null);
  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const images = useRef([]);
  const frameRef = useRef(1);
  const [isLogged, setIsLogged] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  useEffect(() => {
    const user = localStorage.getItem("citizen_username");
    setIsLogged(user && user !== "undefined" && user !== "null");
  }, []);

  useEffect(() => {
    if (reducedMotion || isMobile) {
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.pointerEvents = "auto";
      }
      return;
    }
    let animFrame;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    const totalFrames = 180;
    const preloadFirstCount = 20;

    const renderFrame = (index) => {
      let img = images.current[index];
      // Fallback to the closest loaded frame to prevent blank flashes while loading on scroll
      if (!img || !img.complete || img.naturalWidth === 0) {
        let closestIndex = -1;
        let minDiff = Infinity;
        for (let i = 1; i <= totalFrames; i++) {
          const checkImg = images.current[i];
          if (checkImg && checkImg.complete && checkImg.naturalWidth !== 0) {
            const diff = Math.abs(i - index);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = i;
            }
          }
        }
        if (closestIndex !== -1) {
          img = images.current[closestIndex];
        }
      }

      if (img && img.complete && img.naturalWidth !== 0) {
        const ratio = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;

        ctx.fillStyle = "#0A0A0A";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, w, h);
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame(frameRef.current);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const loadFrame = (i) => {
      if (images.current[i]) return images.current[i];
      const img = new Image();
      const indexStr = i.toString().padStart(3, "0");
      img.src = `/earthframes/ezgif-6eaa3726579bf57f-jpg/ezgif-frame-${indexStr}.jpg`;
      img.onload = () => {
        // Trigger a re-render of the current frame if this newly loaded frame is close to the active frame
        if (Math.abs(frameRef.current - i) <= 2) {
          renderFrame(frameRef.current);
        }
      };
      images.current[i] = img;
      return img;
    };

    // Preload only the initial active frames on mount
    for (let i = 1; i <= preloadFirstCount; i++) {
      const img = loadFrame(i);
      if (i === 1) {
        img.onload = () => {
          if (frameRef.current === 1) renderFrame(1);
        };
      }
    }

    const updateScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = window.innerHeight * 2;
      let progress = scrollTop / maxScroll;
      progress = Math.max(0, Math.min(1, progress));

      let frameIndex = Math.floor(progress * totalFrames);
      frameIndex = Math.min(180, Math.max(1, frameIndex));

      // Just-in-time prefetch window: load current frame and next 15 frames dynamically on scroll
      const prefetchLookahead = 15;
      for (let i = frameIndex; i <= Math.min(totalFrames, frameIndex + prefetchLookahead); i++) {
        if (!images.current[i]) {
          loadFrame(i);
        }
      }

      if (frameRef.current !== frameIndex) {
        frameRef.current = frameIndex;
        renderFrame(frameIndex);
      }

      if (titleRef.current) {
        const titleOpacity = 1 - Math.min(1, progress / 0.15);
        titleRef.current.style.opacity = titleOpacity;
        titleRef.current.style.pointerEvents = titleOpacity > 0 ? "auto" : "none";
      }

      if (contentRef.current) {
        const show = frameIndex === totalFrames || progress >= 1;
        contentRef.current.style.opacity = show ? "1" : "0";
        contentRef.current.style.pointerEvents = show ? "auto" : "none";
      }
    };

    const handleScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        updateScroll();
      });
    };
    let rafPending = false;

    window.addEventListener("scroll", handleScroll, { passive: true });
    setTimeout(updateScroll, 0);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (animFrame) window.cancelAnimationFrame(animFrame);
    };
  }, [reducedMotion, isMobile]);

  if (reducedMotion || isMobile) {
    return (
      <div style={{ background: "#0A0A0A" }}>
        <GlobalStyles />
        <div id="homepage-content">{children}</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0A0A0A" }}>
      <GlobalStyles />
      <div id="earth-scroll-intro" ref={introRef} style={{ height: "300vh", position: "relative", background: "#0A0A0A" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

          {/* ── HERO TITLE OVERLAY ── */}
          <div ref={titleRef} style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            zIndex: 2, pointerEvents: "none",
            width: "100%", padding: "0 20px"
          }}>
            <div style={{
              textAlign: "center",
              display: "flex", flexDirection: "column", gap: "10px",
            }}>
              <h1 style={{ color: "#FFFFFF", margin: 0, fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: "bold", textShadow: "0px 4px 15px rgba(0,0,0,0.8)" }}>CiviFix</h1>
              <h2 style={{ color: "#FFFFFF", margin: 0, fontSize: "clamp(1.2rem, 3vw, 1.8rem)", fontWeight: 600, textShadow: "0px 4px 15px rgba(0,0,0,0.8)" }}>AI Powered Civic Issue Intelligence</h2>
              <p style={{ color: "#FFFFFF", margin: 0, fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)", opacity: 0.9, textShadow: "0px 2px 10px rgba(0,0,0,0.8)" }}>Detecting civic problem hotspots using citizen reports and AI.</p>
            </div>
          </div>
        </div>
      </div>
      <div id="homepage-content" ref={contentRef} style={{ opacity: 0, pointerEvents: "none", position: "relative", zIndex: 5, transition: "opacity 0.8s ease-in-out" }}>
        {children}
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      #homepage-content {
        color: #fff !important;
      }
      #homepage-content section:not(.bg-white) { background-color: #0A0A0A !important; }

      #homepage-content h1,#homepage-content h2,#homepage-content h3,
      #homepage-content h4,#homepage-content h5,#homepage-content h6,
      #homepage-content .text-gray-900,#homepage-content .text-gray-800,
      #homepage-content .text-blue-600,#homepage-content .text-blue-500,
      #homepage-content .text-indigo-600,#homepage-content .text-green-800,
      #homepage-content .text-blue-800,#homepage-content .text-purple-800 {
        color: #FFD166 !important;
      }

      #homepage-content .text-gray-600,
      #homepage-content .text-gray-500,
      #homepage-content .text-gray-700 { color: #bbb !important; }

      #homepage-content button,#homepage-content .btn {
        background: linear-gradient(135deg,#FFD166,#E6B84C) !important;
        color: #0A0A0A !important; border: none !important;
        box-shadow: 0 4px 18px rgba(255,209,102,.3) !important;
      }

      #homepage-content .bg-green-100,
      #homepage-content .bg-blue-100,
      #homepage-content .bg-purple-100,
      #homepage-content .bg-indigo-100 {
        background: rgba(255,209,102,.1) !important;
        color: #FFD166 !important;
        border: 1px solid rgba(255,209,102,.3) !important;
      }

      #homepage-content .card,
      #homepage-content [class*="shadow"] {
        background-color: #121212 !important;
        border: 1px solid #222 !important;
        box-shadow: 0 4px 18px rgba(0,0,0,.5) !important;
      }
    `}</style>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO  —  Original JSX completely unchanged, wrapped in CinematicIntro
═══════════════════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <CinematicIntro>

      {/* ── EXISTING HOMEPAGE JSX — DO NOT TOUCH ── */}
      <Container className="main_container">
        <motion.section
          className="text-gray-700 body-font"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <div className="container mx-auto flex px-5 py-20 md:flex-row flex-col items-center">

            {/* Left – hero video */}
            <motion.div
              className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6 mb-10 md:mb-0 drop-shadow-xl"
              variants={fadeInLeft}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.video
                className="object-cover object-center rounded-xl w-full h-auto overflow-hidden gpu-layer"
                autoPlay loop muted playsInline
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{
                  objectFit: "cover", objectPosition: "center",
                  transform: "scale(1.1)", transformOrigin: "center",
                }}
              >
                <source src={heroVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </motion.video>
            </motion.div>

            {/* Right – text */}
            <motion.div
              className="lg:flex-grow md:w-1/2 lg:pl-20 md:pl-14 flex flex-col md:items-start md:text-left items-center text-left"
              variants={fadeInRight}
            >
              <motion.h1
                className="title-font sm:text-5xl text-3xl mb-4 font-bold text-gray-900 leading-tight"
                variants={staggerItem}
              >
                Citizen Grievance Redressal Portal
              </motion.h1>
              <motion.p
                className="mb-8 leading-relaxed text-gray-600 text-lg"
                variants={staggerItem}
              >
                Transform your community with the power of digital governance.
                Report civic issues like waste management, roads, lighting, or water supply —
                all in one place. Track updates, get transparent responses, and be part of
                a responsive governance system that listens to you.
              </motion.p>
              <motion.div
                className="mb-8 flex flex-wrap gap-4 text-sm"
                variants={staggerItem}
              >
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">✓ 24/7 Support</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">✓ Real-time Tracking</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">✓ Secure Platform</span>
              </motion.div>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
                variants={staggerItem}
              >
                <Link to="/register">
                  <AnimatedButton variant="primary"
                    className="inline-flex py-3 px-8 text-lg font-semibold w-full sm:w-auto">
                    Register Complaint
                  </AnimatedButton>
                </Link>
                <Link to="/track-status">
                  <AnimatedButton variant="outline"
                    className="inline-flex py-3 px-8 text-lg font-semibold w-full sm:w-auto">
                    Track Status
                  </AnimatedButton>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </Container>

      <div className="w-full relative z-10">
        <React.Suspense fallback={<div className="h-[420px] max-w-6xl mx-auto rounded-2xl bg-gray-50 animate-pulse my-10" />}>
          <HotspotMap />
        </React.Suspense>
      </div>
    </CinematicIntro>
  );
}

export default Hero;
