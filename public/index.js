// === MOBILE MENU TOGGLE ===
const mobileMenu = document.getElementById("mobile-menu");
const navMenu = document.querySelector(".nav-menu");

if (mobileMenu) {
  mobileMenu.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  // Close menu when clicking on a link
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });
}

// === SMOOTH SCROLLING ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href === "#") return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const navHeight = document.querySelector(".navbar").offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: "smooth"
      });
    }
  });
});

// === CONTACT FORM ===
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = {
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      subject: document.getElementById("contact-subject").value,
      message: document.getElementById("contact-message").value
    };

    // Disable submit button
    const submitBtn = contactForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const API_BASE = window.APP_CONFIG?.API_BASE || window.location.origin + '/api';
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Success
      contactStatus.textContent = "Message sent successfully! We'll get back to you soon.";
      contactStatus.className = "contact-status success";
      contactForm.reset();

    } catch (error) {
      console.error("Error:", error);
      contactStatus.textContent = "Failed to send message. Please try again later.";
      contactStatus.className = "contact-status error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
      
      // Hide status message after 5 seconds
      setTimeout(() => {
        contactStatus.className = "contact-status";
      }, 5000);
    }
  });
}

// === WAITLIST FORM ===
const waitlistRoleBtns = document.querySelectorAll('.waitlist-role-btn');
const waitlistRoleInput = document.getElementById('waitlist-role');
const companyGroup = document.getElementById('company-group');

waitlistRoleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    waitlistRoleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const role = btn.dataset.role;
    if (waitlistRoleInput) waitlistRoleInput.value = role;
    if (companyGroup) companyGroup.style.display = role === 'Partner' ? 'block' : 'none';
  });
});

const waitlistForm = document.getElementById('waitlist-form');
const waitlistStatus = document.getElementById('waitlist-status');

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById('waitlist-name').value,
      email: document.getElementById('waitlist-email').value,
      role: document.getElementById('waitlist-role').value,
      company: document.getElementById('waitlist-company')?.value || '',
      message: document.getElementById('waitlist-message').value
    };

    const submitBtn = waitlistForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining...';

    try {
      const API_BASE = window.APP_CONFIG?.API_BASE || window.location.origin + '/api';
      const res = await fetch(`${API_BASE}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to join waitlist');

      waitlistStatus.textContent = "You're on the list! We'll reach out when $forS launches. 🎉";
      waitlistStatus.className = 'contact-status success';
      waitlistForm.reset();
      waitlistRoleBtns.forEach((b, i) => b.classList.toggle('active', i === 0));
      if (waitlistRoleInput) waitlistRoleInput.value = 'Student';
      if (companyGroup) companyGroup.style.display = 'none';
    } catch (err) {
      waitlistStatus.textContent = 'Something went wrong. Please try again.';
      waitlistStatus.className = 'contact-status error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join the Waitlist';
      setTimeout(() => { waitlistStatus.className = 'contact-status'; }, 6000);
    }
  });
}

// === HANDLE ROLE PARAMETER IN REGISTER LINK ===
const urlParams = new URLSearchParams(window.location.search);
const role = urlParams.get("role");

if (role && window.location.pathname.includes("register.html")) {
  // This will be handled by register.html if it has logic for role pre-selection
  // For now, we just pass it along
  console.log("Role parameter:", role);
}

