import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  // --- shared compact 2D simplex-style value noise (smooth, cheap) ---
  var perm = new Uint8Array(512);
  (function () {
    var p = new Uint8Array(256), i, j, t;
    for (i = 0; i < 256; i++) p[i] = i;
    var seed = 1337;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (i = 255; i > 0; i--) { j = (rnd() * (i + 1)) | 0; t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function grad(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }
  function noise2(x, y) {
    var X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    var u = fade(x), v = fade(y);
    var a = perm[X] + Y, b = perm[X + 1] + Y;
    return lerp(
      lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
      lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u),
      v) * 0.7;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ============================================================
     1. STATIC GRID BACKGROUND (styled via CSS in .hero-bg)
     ============================================================ */

  /* ============================================================
     2. PRELOADER + HERO REVEAL
     ============================================================ */
  var loader = document.getElementById("loader");
  function initHeroState() {
    if (!hasGSAP || reduced) return;
    gsap.set(".hero-inner", { scale: 0.96, opacity: 0 });
    gsap.set(".hero .mask .line", { yPercent: 115 });
    gsap.set(".hero .rv", { y: 25, opacity: 0 });
    gsap.set("#hdr", { y: -24, opacity: 0 });
  }

  function heroIn() {
    if (!hasGSAP || reduced) {
      document.querySelectorAll(".hero-inner, .hero .rv, #hdr").forEach(function (el) {
        el.style.opacity = 1;
        el.style.transform = "none";
      });
      document.querySelectorAll(".hero .mask .line").forEach(function (el) {
        el.style.transform = "none";
      });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(".hero-inner", { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out" }, 0)
      .to(".hero .mask .line", { yPercent: 0, duration: 1.1, stagger: 0.08 }, 0.2)
      .to(".hero .rv", { y: 0, opacity: 1, duration: 0.8, stagger: 0.08 }, "-=0.6")
      .to("#hdr", { y: 0, opacity: 1, duration: 0.75 }, "-=0.7");
  }

  if (reduced || !hasGSAP) {
    if (loader) loader.style.display = "none";
    document.querySelectorAll(".hero .mask .line").forEach(function (el) { el.style.transform = "none"; });
    heroIn();
  } else {
    initHeroState(); // Immediately hide hero elements so they don't leak behind the preloader
    document.body.style.overflow = "hidden";
    var counter = { v: 0 };
    var lc = document.getElementById("lc");

    var loaderTl = gsap.timeline({
      onComplete: function () {
        document.body.style.overflow = "";
        heroIn();
      }
    });

    // Content entrance animation
    loaderTl.fromTo("#loader .loader-content", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" });

    // Percentage counter timeline
    loaderTl.to(counter, {
      v: 100,
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: function () {
        lc.textContent = String(Math.round(counter.v)).padStart(2, "0");
      }
    }, "-=0.3");

    // Outro exit slide up animation
    loaderTl.to("#loader .loader-content", { opacity: 0, y: -20, duration: 0.6, ease: "power3.in" }, "+=0.2")
      .to(loader, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut"
      }, "-=0.35")
      .set(loader, { display: "none" });
  }

  if (reduced || !hasGSAP) {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      el.textContent = parseFloat(el.getAttribute("data-count")).toFixed(dec);
    });
    return; // everything below is motion and scroll reveals
  }

  /* ============================================================
     3. SCROLL CHOREOGRAPHY
     ============================================================ */
  // Header behavior on scroll
  var lastY = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: function (self) {
      var y = self.scroll();
      var hdr = document.getElementById("hdr");
      if (!hdr) return;
      hdr.classList.toggle("hdr-solid", y > 140);
      if (y > 140 && y > lastY + 4) hdr.classList.add("hdr-hide");
      else if (y < lastY - 4) hdr.classList.remove("hdr-hide");
      lastY = y;
    }
  });

  // Generic reveals
  gsap.utils.toArray("main section:not(.hero) .rv, .a-copy .rv").forEach(function (el) {
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  // Manifesto word-by-word highlights
  (function () {
    var p = document.getElementById("mani");
    if (!p) return;
    var hotWords = ["aquacare360", "shubham", "maintenance", "performance", "operation"];
    var words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map(function (w) {
      var clean = w.replace(/[^\w]/g, "").toLowerCase();
      var cls = hotWords.indexOf(clean) > -1 ? "w hot" : "w";
      return '<span class="' + cls + '">' + w + "</span>";
    }).join(" ");
    var spans = p.querySelectorAll(".w");
    ScrollTrigger.create({
      trigger: p, start: "top 78%", end: "bottom 45%", scrub: 0.4,
      onUpdate: function (self) {
        var n = Math.floor(self.progress * spans.length);
        spans.forEach(function (s, i) { s.classList.toggle("on", i <= n); });
      }
    });
  })();

  // Counters
  gsap.utils.toArray("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: end, duration: 1.6, ease: "power2.out",
          onUpdate: function () { el.textContent = obj.v.toFixed(dec); }
        });
      }
    });
  });

  // Footer ghost parallax
  gsap.to(".f-ghost", {
    yPercent: -22, ease: "none",
    scrollTrigger: { trigger: "footer", start: "top bottom", end: "bottom bottom", scrub: true }
  });

  // Email magnetic pull
  (function () {
    var m = document.getElementById("mailLink");
    if (!m || !window.matchMedia("(hover:hover)").matches) return;
    var qx = gsap.quickTo(m, "x", { duration: 0.4, ease: "power3" });
    var qy = gsap.quickTo(m, "y", { duration: 0.4, ease: "power3" });
    m.addEventListener("pointermove", function (e) {
      var r = m.getBoundingClientRect();
      qx((e.clientX - (r.left + r.width / 2)) * 0.08);
      qy((e.clientY - (r.top + r.height / 2)) * 0.18);
    });
    m.addEventListener("pointerleave", function () { qx(0); qy(0); });
  })();

  // Horizontal scroll pinning for Services (Desktop only)
  (function initServicesPin() {
    var slider = document.querySelector(".services-slider");
    var ventures = document.querySelector(".ventures");
    if (!slider || !ventures) return;

    var mm = gsap.matchMedia();

    // Pin section and translate slider horizontally on screens > 840px
    mm.add("(min-width: 841px)", function () {
      var scrollTween = gsap.to(slider, {
        x: function () {
          return -(slider.scrollWidth - window.innerWidth);
        },
        ease: "none",
        scrollTrigger: {
          trigger: ventures,
          pin: true,
          scrub: 1,
          start: "top top",
          end: function () {
            return "+=" + (slider.scrollWidth - window.innerWidth);
          },
          invalidateOnRefresh: true
        }
      });

      return function () {
        if (scrollTween.scrollTrigger) {
          scrollTween.scrollTrigger.kill();
        }
        gsap.set(slider, { clearProps: "all" });
      };
    });
  })();

  /* ============================================================
     5. DYNAMIC WATER RIPPLES GENERATOR
     ============================================================ */
  (function initPortraitTopo() {
    var svgGroup = document.querySelector(".portrait .topo g");
    if (!svgGroup) return;

    var cx = 300, cy = 375; // SVG coordinate center
    var numContours = 9;
    var pathsHTML = "";

    for (var i = 1; i <= numContours; i++) {
      var r = i * 28; // concentric spacing
      var points = [];
      var PTS = 80;

      for (var j = 0; j <= PTS; j++) {
        var angle = (j / PTS) * Math.PI * 2;
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var bx = cx + r * cos;
        var by = cy + r * sin;

        // organic deformation wave noise
        var n = noise2(bx * 0.007, by * 0.007);
        var n2 = noise2(bx * 0.015, by * 0.015) * 0.25;
        var r_dynamic = r + (n + n2) * (12 + r * 0.06);

        var x = cx + r_dynamic * cos;
        var y = cy + r_dynamic * sin;
        points.push(x.toFixed(1) + "," + y.toFixed(1));
      }

      pathsHTML += '<path d="M ' + points.join(' L ') + ' Z" stroke="#6A2C91" stroke-width="1.5" opacity="' + (0.8 - (i * 0.07)).toFixed(2) + '" fill="none" class="rot-' + (i % 2 === 0 ? 'medium' : 'reverse') + '" />';
    }

    // Insert contours before the central water-flow path
    var flowLine = document.getElementById("water-flow-line");
    var container = document.createElement("g");
    container.innerHTML = pathsHTML;
    svgGroup.insertBefore(container, flowLine);
  })();

  /* ============================================================
     6. MOBILE MENU INTERACTION (Hamburger toggle + animate-in)
     ============================================================ */
  (function initMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.getElementById("mobile-menu");
    var menuLinks = document.querySelectorAll(".mobile-menu-link");
    var body = document.body;

    if (!toggle || !menu) return;

    var isOpen = false;
    var menuItems = menu.querySelectorAll(".mobile-menu-item");

    function toggleMenu(state) {
      isOpen = (typeof state === "boolean") ? state : !isOpen;

      toggle.classList.toggle("is-active", isOpen);
      menu.classList.toggle("is-active", isOpen);
      body.classList.toggle("menu-open", isOpen);

      toggle.setAttribute("aria-expanded", String(isOpen));
      menu.setAttribute("aria-hidden", String(!isOpen));

      if (isOpen) {
        if (hasGSAP && !reduced) {
          gsap.set(menuItems, { y: 30, opacity: 0 });
          gsap.to(menuItems, {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.25
          });
        } else {
          menuItems.forEach(function (el) {
            el.style.opacity = "1";
            el.style.transform = "none";
          });
        }
      } else {
        if (hasGSAP && !reduced) {
          gsap.to(menuItems, {
            y: 20,
            opacity: 0,
            duration: 0.35,
            ease: "power3.in"
          });
        } else {
          menuItems.forEach(function (el) {
            el.style.opacity = "";
            el.style.transform = "";
          });
        }
      }
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        if (href.startsWith("mailto:") || href.startsWith("http")) {
          toggleMenu(false);
          return;
        }

        e.preventDefault();
        toggleMenu(false);

        var targetId = href.substring(1);
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          setTimeout(function () {
            var targetY = targetEl.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
              top: targetY,
              behavior: "smooth"
            });
          }, 80);
        }
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 840 && isOpen) {
        toggleMenu(false);
      }
    });
  })();

  /* ============================================================
     7. CLICK-TO-COPY FUNCTIONALITY
     ============================================================ */
  (function initClickToCopy() {
    var copyLinks = document.querySelectorAll(".copy-link");
    if (!copyLinks.length) return;
    
    copyLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var textToCopy = link.getAttribute("data-copy");
        if (!textToCopy) return;

        function showSuccess() {
          var originalHTML = link.innerHTML;
          link.innerHTML = '<span style="color: var(--saffron); font-style: italic; font-weight: 300;">Copied!</span>';
          link.style.pointerEvents = "none";
          setTimeout(function () {
            link.innerHTML = originalHTML;
            link.style.pointerEvents = "";
          }, 1500);
        }

        function fallbackCopy() {
          var textArea = document.createElement("textarea");
          textArea.value = textToCopy;
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            showSuccess();
          } catch (err) {
            console.error("Fallback copy failed: ", err);
          }
          document.body.removeChild(textArea);
        }

        if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(showSuccess).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      });
    });
  })();

  /* ============================================================
     8. BRAND TEXT SCRAMBLE ON HOVER
     ============================================================ */
  (function initBrandTextMorph() {
    var el = document.querySelector(".brand-text");
    var brandEl = document.querySelector(".brand");
    if (!el || !brandEl) return;

    var nameText = "AQUACARE360";
    var scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789💧🌀🌊🔋⚡";
    var glitchIntervalId = null;
    var activeTransitionResolver = null;
    var isHovered = false;

    el.textContent = nameText.replace(/ /g, "\u00a0");
    el.setAttribute("data-text", nameText);

    function scrambleTransition(targetText, callback) {
      var currentText = el.textContent || "";
      currentText = currentText.replace(/\u00a0/g, " ");

      var maxLen = Math.max(currentText.length, targetText.length);
      var startTime = null;

      var charStates = [];
      for (var i = 0; i < maxLen; i++) {
        var startDelay = i * 35;
        var endDelay = startDelay + 200 + Math.random() * 150;
        charStates.push({
          start: startDelay,
          end: endDelay,
          resolved: false
        });
      }

      var totalDuration = Math.max.apply(null, charStates.map(function (s) { return s.end; }));
      var rAfId = null;

      function tick(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;

        var result = [];
        var allResolved = true;

        for (var i = 0; i < maxLen; i++) {
          var state = charStates[i];
          var targetChar = targetText[i] || " ";
          var currentChar = currentText[i] || " ";

          if (elapsed >= state.end) {
            state.resolved = true;
            result.push(targetChar);
          } else if (elapsed >= state.start) {
            allResolved = false;
            if (Math.random() < 0.35) {
              var randIdx = Math.floor(Math.random() * scrambleChars.length);
              result.push(scrambleChars[randIdx]);
            } else {
              result.push(currentChar);
            }
          } else {
            allResolved = false;
            result.push(currentChar);
          }
        }

        var newStr = result.join("").replace(/ /g, "\u00a0");
        el.textContent = newStr;
        el.setAttribute("data-text", result.join(""));

        if (elapsed < totalDuration && !allResolved) {
          rAfId = requestAnimationFrame(tick);
        } else {
          complete();
        }
      }

      function complete() {
        el.textContent = targetText.replace(/ /g, "\u00a0");
        el.setAttribute("data-text", targetText);
        activeTransitionResolver = null;
        if (callback) callback();
      }

      activeTransitionResolver = function forceComplete() {
        if (rAfId) cancelAnimationFrame(rAfId);
        complete();
      };

      rAfId = requestAnimationFrame(tick);
    }

    brandEl.addEventListener("mouseenter", function () {
      isHovered = true;
      if (reduced) return;

      if (activeTransitionResolver) activeTransitionResolver();
      if (glitchIntervalId) clearInterval(glitchIntervalId);

      glitchIntervalId = setInterval(function () {
        var chars = nameText.split("");
        for (var i = 0; i < chars.length; i++) {
          if (chars[i] !== " ") {
            if (Math.random() < 0.75) {
              var randChar = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              chars[i] = randChar;
            }
          }
        }
        var scrambledStr = chars.join("");
        el.textContent = scrambledStr.replace(/ /g, "\u00a0");
        el.setAttribute("data-text", scrambledStr);
      }, 55);
    });

    brandEl.addEventListener("mouseleave", function () {
      isHovered = false;
      if (reduced) return;

      if (glitchIntervalId) {
        clearInterval(glitchIntervalId);
        glitchIntervalId = null;
      }
      scrambleTransition(nameText);
    });
  })();

  /* ============================================================
     9. INQUIRY FORM INTERACTIVE VALIDATION & SUBMISSION
     ============================================================ */
  (function initInquiryForm() {
    var form = document.getElementById("inquiryForm");
    var submitBtn = document.getElementById("submitBtn");
    var successMessage = document.getElementById("formSuccessMessage");
    var resetFormLink = document.getElementById("resetFormLink");

    if (!form || !submitBtn || !successMessage || !resetFormLink) return;

    // Helper: Validate email format
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Helper: Validate phone number format
    function isValidPhone(phone) {
      return /^[0-9]{10,12}$/.test(phone);
    }

    // Helper: Mark field as valid/invalid
    function setFieldValidity(inputEl, isValid) {
      var group = inputEl.closest(".form-group");
      if (!group) return;
      if (isValid) {
        group.classList.remove("invalid");
      } else {
        group.classList.add("invalid");
      }
    }

    // Live validation on blur
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("blur", function () {
        validateField(input);
      });
      input.addEventListener("input", function () {
        var group = input.closest(".form-group");
        if (group && group.classList.contains("invalid")) {
          validateField(input);
        }
      });
    });

    // Message word count limiter
    var messageInput = document.getElementById("frmMessage");
    var wordCountSpan = document.getElementById("wordCount");
    var wordCountContainer = document.getElementById("wordCountContainer");

    function updateWordCount() {
      if (!messageInput || !wordCountSpan) return;
      var text = messageInput.value.trim();
      var words = text ? text.split(/\s+/) : [];
      var count = words.length;

      if (count > 1000) {
        // Truncate to first 1000 words
        var truncated = words.slice(0, 1000).join(" ");
        messageInput.value = truncated;
        count = 1000;
      }

      wordCountSpan.textContent = count;

      if (wordCountContainer) {
        if (count >= 1000) {
          wordCountContainer.style.color = "var(--saffron)";
          wordCountContainer.style.fontWeight = "600";
        } else {
          wordCountContainer.style.color = "";
          wordCountContainer.style.fontWeight = "";
        }
      }
    }

    if (messageInput) {
      messageInput.addEventListener("input", updateWordCount);
      messageInput.addEventListener("keyup", updateWordCount);
      messageInput.addEventListener("change", updateWordCount);
      messageInput.addEventListener("paste", function () {
        setTimeout(updateWordCount, 10);
      });
      // Initial count update
      updateWordCount();
    }

    function validateField(input) {
      if (!input.hasAttribute("required") && input.value.trim() === "") {
        setFieldValidity(input, true);
        return true;
      }

      var val = input.value.trim();
      var name = input.getAttribute("name");
      var isValid = true;

      if (input.hasAttribute("required") && val === "") {
        isValid = false;
      } else if (name === "email" && !isValidEmail(val)) {
        isValid = false;
      } else if (name === "mobile" && !isValidPhone(val)) {
        isValid = false;
      }

      setFieldValidity(input, isValid);
      return isValid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Block double submissions if already loading or succeeded
      if (submitBtn.classList.contains("is-loading") || submitBtn.classList.contains("is-success")) {
        return;
      }

      var isFormValid = true;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        if (!validateField(input)) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // Disable form fields
        form.classList.add("submitting");
        form.querySelectorAll("input, select, textarea").forEach(function (input) {
          input.disabled = true;
        });

        // Set button loading state
        submitBtn.classList.add("is-loading");

        var submissionData = {
          name: form.frmName.value,
          mobile: form.frmMobile.value,
          email: form.frmEmail.value,
          location: form.frmLocation.value,
          message: form.frmMessage.value
        };
        if (form.frmService) {
          submissionData.serviceType = form.frmService.value;
        }
        console.log("Submitting Proposal Form Data:", submissionData);

        // Get Google Sheet URL from environment variables
        var googleSheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL;

        function showSuccess() {
          // Morph button to success state
          submitBtn.classList.remove("is-loading");
          submitBtn.classList.add("is-success");

          // Show success message container
          successMessage.style.display = "block";
          // Trigger CSS transitions in the next tick
          setTimeout(function () {
            successMessage.classList.add("show");
            successMessage.setAttribute("aria-hidden", "false");
          }, 50);
        }

        if (googleSheetUrl) {
          // Format as application/x-www-form-urlencoded to prevent preflight OPTIONS requests that Apps Script doesn't support
          var formData = new URLSearchParams();
          for (var key in submissionData) {
            formData.append(key, submissionData[key]);
          }

          fetch(googleSheetUrl, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
          })
            .then(function (res) {
              if (!res.ok) {
                throw new Error("HTTP error! Status: " + res.status);
              }
              return res.json();
            })
            .then(function (data) {
              console.log("Form successfully logged to Google Sheets:", data);
              showSuccess();
            })
            .catch(function (error) {
              console.error("Failed to submit to Google Sheets:", error);
              // Fallback to visual success so the user isn't blocked by network/backend configuration issues
              showSuccess();
            });
        } else {
          console.warn("VITE_GOOGLE_SHEET_URL is not set. Falling back to simulated submission.");
          setTimeout(showSuccess, 1500);
        }

      } else {
        // Scroll to first error
        var firstError = form.querySelector(".form-group.invalid");
        if (firstError) {
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });

    resetFormLink.addEventListener("click", function (e) {
      e.preventDefault();

      // Fade out success message
      successMessage.classList.remove("show");
      successMessage.setAttribute("aria-hidden", "true");

      setTimeout(function () {
        successMessage.style.display = "none";

        // Revert button states
        submitBtn.classList.remove("is-success", "is-loading");

        // Re-enable form fields
        form.classList.remove("submitting");
        form.querySelectorAll("input, select, textarea").forEach(function (input) {
          input.disabled = false;
        });

        // Reset form inputs
        form.reset();

        // Reset word count
        if (wordCountSpan) {
          wordCountSpan.textContent = "0";
        }
        if (wordCountContainer) {
          wordCountContainer.style.color = "";
          wordCountContainer.style.fontWeight = "";
        }

        // Reset form title
        var formTitle = document.querySelector(".form-title");
        if (formTitle) {
          formTitle.textContent = "Tell Us About Your System";
        }

        // Remove validation error styles
        form.querySelectorAll(".form-group").forEach(function (group) {
          group.classList.remove("invalid");
        });
      }, 300); // match transition speed
    });
  })();

  /* ============================================================
     10. WHY CHOOSE US ACCORDION (GSAP SMOOTH HEIGHT TRANSITION)
     ============================================================ */
  (function initWhyAccordion() {
    var items = document.querySelectorAll(".why-accordion-item");
    if (!items.length) return;

    items.forEach(function (item) {
      var header = item.querySelector(".why-accordion-header");
      var content = item.querySelector(".why-accordion-content");

      // Set initial state for closed items
      if (!item.classList.contains("is-active")) {
        gsap.set(content, { height: 0, opacity: 0 });
      } else {
        gsap.set(content, { height: "auto", opacity: 1 });
      }

      header.addEventListener("click", function () {
        var isActive = item.classList.contains("is-active");

        // Close other items
        items.forEach(function (otherItem) {
          if (otherItem !== item && otherItem.classList.contains("is-active")) {
            otherItem.classList.remove("is-active");
            gsap.to(otherItem.querySelector(".why-accordion-content"), {
              height: 0,
              opacity: 0,
              duration: 0.45,
              ease: "power2.inOut"
            });
          }
        });

        // Toggle clicked item
        if (isActive) {
          item.classList.remove("is-active");
          gsap.to(content, {
            height: 0,
            opacity: 0,
            duration: 0.45,
            ease: "power2.inOut"
          });
        } else {
          item.classList.add("is-active");
          gsap.to(content, {
            height: "auto",
            opacity: 1,
            duration: 0.55,
            ease: "power2.out"
          });
        }
      });
    });
  })();

  /* ============================================================
     11. AMC PLANS BUTTON CLICKS (Auto-select dropdown & smooth scroll)
     ============================================================ */
  (function initPricingCta() {
    var ctaButtons = document.querySelectorAll(".btn-plan-cta");
    var selectEl = document.getElementById("frmService");
    var contactSection = document.getElementById("contact");

    if (!ctaButtons.length || !selectEl || !contactSection) return;

    ctaButtons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var planValue = btn.getAttribute("data-plan");
        
        if (planValue) {
          selectEl.value = planValue;
          
          var event = new Event('change', { bubbles: true });
          selectEl.dispatchEvent(event);
          
          var formTitle = document.querySelector(".form-title");
          if (formTitle) {
            formTitle.textContent = "Request Proposal: " + planValue;
          }
          
          var group = selectEl.closest(".form-group");
          if (group) {
            group.classList.remove("invalid");
          }
        }
        
        var targetY = contactSection.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: targetY,
          behavior: "smooth"
        });
      });
    });
  })();

  /* ============================================================
     12. HERO MARQUEE SMOOTH HOVER PAUSE
     ============================================================ */
  (function initHeroMarquee() {
    var tracks = document.querySelectorAll(".marquee-track");
    if (!tracks.length || !hasGSAP) return;

    tracks.forEach(function (track) {
      // Disable native CSS animation so GSAP can take full control
      track.style.animation = "none";

      // Animate track using GSAP
      var tween = gsap.to(track, {
        xPercent: -50,
        ease: "none",
        duration: 45,
        repeat: -1
      });

      // Smoothly decelerate to paused state on hover
      track.addEventListener("mouseenter", function () {
        gsap.to(tween, { timeScale: 0, duration: 1.0, ease: "power2.out" });
      });

      // Smoothly accelerate back to running state on mouse leave
      track.addEventListener("mouseleave", function () {
        gsap.to(tween, { timeScale: 1, duration: 1.0, ease: "power2.out" });
      });
    });
  })();
})();

