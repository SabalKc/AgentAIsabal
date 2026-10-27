
const defaultBusiness = {
  name: "BrightPath Tuition Centre",
  courses: "Class 11 and Class 12 Science tuition",
  hours: "Sunday–Friday, 7:00 AM–6:00 PM",
  fees: "",
  contactInfo: ""
};

const $ = (selector) => document.querySelector(selector);

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

let business = {
  ...defaultBusiness,
  ...storage.get("sabalflow_business", {})
};

let leads = storage.get("sabalflow_leads", []);
let faqs = storage.get("sabalflow_faqs", []);

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

function saveBusiness() {
  storage.set("sabalflow_business", business);
}

function saveLeads() {
  storage.set("sabalflow_leads", leads);
}

function saveFaqs() {
  storage.set("sabalflow_faqs", faqs);
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------- TABS ----------------

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach(item =>
      item.classList.toggle("active", item === button)
    );

    document.querySelectorAll("[data-panel]").forEach(panel => {
      panel.hidden = panel.dataset.panel !== target;
    });
  });
});

// ---------------- BUSINESS SETTINGS ----------------

function fillBusinessForm() {
  const fields = {
    businessName: business.name,
    businessCourses: business.courses,
    businessHours: business.hours,
    businessFees: business.fees,
    businessContact: business.contactInfo
  };

  Object.entries(fields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value || "";
  });
}

function readBusinessForm() {
  const fields = {
    businessName: "name",
    businessCourses: "courses",
    businessHours: "hours",
    businessFees: "fees",
    businessContact: "contactInfo"
  };

  Object.entries(fields).forEach(([id, key]) => {
    const field = document.getElementById(id);
    if (field) business[key] = field.value.trim();
  });

  saveBusiness();
  alert("Business information saved!");
}

document.getElementById("saveBusiness")?.addEventListener("click", readBusinessForm);

// ---------------- CUSTOM FAQ MEMORY ----------------

// Add the FAQ manager to the existing Business Info panel.
function installFaqManager() {
  const panel =
    document.querySelector('[data-panel="business"]') ||
    document.getElementById("businessPanel");

  if (!panel || document.getElementById("faqManager")) return;

  const section = document.createElement("section");
  section.id = "faqManager";
  section.style.cssText =
    "margin-top:24px;padding:16px;border:1px solid #7775;border-radius:14px;";

  section.innerHTML = `
    <h3>🧠 Custom FAQ Memory</h3>
    <p>Teach your assistant verified answers for questions customers ask.</p>
    <form id="faqForm">
      <label for="faqQuestion">Customer question</label>
      <input id="faqQuestion" required maxlength="250"
        placeholder="Do you offer trial classes?"
        style="display:block;width:100%;box-sizing:border-box;padding:10px;margin:6px 0 12px;">

      <label for="faqAnswer">Verified answer</label>
      <textarea id="faqAnswer" required maxlength="1500" rows="3"
        placeholder="Yes, contact us to ask about a trial class."
        style="display:block;width:100%;box-sizing:border-box;padding:10px;margin:6px 0 12px;"></textarea>

      <button type="submit">Save FAQ</button>
    </form>
    <div id="faqList" style="margin-top:16px;"></div>
  `;

  panel.appendChild(section);

  $("#faqForm").addEventListener("submit", event => {
    event.preventDefault();

    const question = $("#faqQuestion").value.trim();
    const answer = $("#faqAnswer").value.trim();

    if (!question || !answer) return;

    faqs.push({
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      question,
      answer
    });

    saveFaqs();
    $("#faqForm").reset();
    renderFaqs();

    alert("FAQ saved to this browser!");
  });

  renderFaqs();
}

function renderFaqs() {
  const list = $("#faqList");
  if (!list) return;

  if (!faqs.length) {
    list.innerHTML = "<p>No custom FAQs yet. Add your first one above!</p>";
    return;
  }

  list.innerHTML = faqs.map(faq => `
    <article style="padding:12px;margin:8px 0;border:1px solid #7775;border-radius:10px;">
      <strong>${escapeHtml(faq.question)}</strong>
      <p>${escapeHtml(faq.answer)}</p>
      <button type="button" data-delete-faq="${escapeHtml(faq.id)}">
        Delete FAQ
      </button>
    </article>
  `).join("");

  list.querySelectorAll("[data-delete-faq]").forEach(button => {
    button.addEventListener("click", () => {
      faqs = faqs.filter(faq => faq.id !== button.dataset.deleteFaq);
      saveFaqs();
      renderFaqs();
    });
  });
}

// Find the best matching custom FAQ.
function findCustomFaq(question) {
  const words = normalize(question)
    .split(" ")
    .filter(word => word.length > 2);

  if (!words.length) return null;

  let bestFaq = null;
  let bestScore = 0;

  faqs.forEach(faq => {
    const faqWords = new Set(
      normalize(faq.question).split(" ").filter(word => word.length > 2)
    );

    let matches = 0;
    words.forEach(word => {
      if (faqWords.has(word)) matches++;
    });

    const score = matches / Math.max(words.length, faqWords.size, 1);

    if (matches >= 2 && score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  });

  return bestScore >= 0.35 ? bestFaq : null;
}

// ---------------- ASSISTANT ----------------

function getIntent(question) {
  const q = normalize(question);

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(q))
    return "greeting";

  if (/\b(thank you|thanks|thankyou|thx)\b/.test(q))
    return "thanks";

  if (/\b(who are you|what are you|your name)\b/.test(q))
    return "identity";

  if (/\b(fee|fees|price|cost|charge|tuition fee)\b/.test(q))
    return "fees";

  if (/\b(hours|opening time|open time|closing time|when.*open)\b/.test(q))
    return "hours";

  if (/\b(course|courses|subject|subjects|teach|teaching|biology|chemistry|physics|math|mathematics)\b/.test(q))
    return "courses";

  if (/\b(contact|phone number|email|address|location|where.*located)\b/.test(q))
    return "contact";

  if (/\b(admission|admit|enrol|enroll|join|register|registration)\b/.test(q))
    return "admission";

  if (/\b(online|offline|physical class|in person|in-person)\b/.test(q))
    return "classmode";

  if (/\b(schedule|timetable|class time|class timing)\b/.test(q))
    return "schedule";

  if (/\b(scholarship|discount|trial class|free class)\b/.test(q))
    return "special";

  if (/\b(bye|goodbye|see you)\b/.test(q))
    return "goodbye";

  if (/\b(help|what can you do)\b/.test(q))
    return "help";

  return "unknown";
}

function draftAnswer(question) {
  // Custom saved FAQs take priority over built-in answers.
  const customFaq = findCustomFaq(question);
  if (customFaq) return customFaq.answer;

  const intent = getIntent(question);

  switch (intent) {
    case "greeting":
      return `Hello! Welcome to ${business.name}. How can I help you today?`;

    case "thanks":
      return "You're welcome! Let me know if you have any other questions.";

    case "identity":
      return `I'm the virtual assistant for ${business.name}. I can answer questions about our services and admissions.`;

    case "fees":
      return business.fees
        ? `Our fee information: ${business.fees}`
        : "I don't have the latest fee details yet. Please contact the centre directly for accurate information.";

    case "hours":
      return business.hours
        ? `Our operating hours are ${business.hours}.`
        : "Please contact the centre to confirm its operating hours.";

    case "courses":
      return business.courses
        ? `We offer: ${business.courses}. Ask us if you need details about a specific subject.`
        : "Please contact us for the latest list of available courses.";

    case "contact":
      return business.contactInfo
        ? `You can contact us here: ${business.contactInfo}`
        : "Our contact details haven't been added yet. Please check with the centre for verified contact information.";

    case "admission":
      return `For admission enquiries, please contact ${business.name}. We can help you confirm the requirements and available seats.`;

    case "classmode":
      return "I don't have confirmed information about online or in-person classes yet. Please contact the centre to verify.";

    case "schedule":
      return `Our listed operating hours are ${business.hours || "not available yet"}. For the exact class timetable, please contact the centre.`;

    case "special":
      return "I don't have confirmed information about scholarships, discounts, or trial classes yet. Please contact the centre to verify.";

    case "goodbye":
      return "Thank you for contacting us. Have a great day!";

    case "help":
      return "You can ask me about courses, fees, opening hours, admissions, or contact details. You can also teach me custom answers in Business Info → Custom FAQ Memory.";

    default:
      return "I don't have a verified answer for that yet. Please contact the centre, or add the question and its correct answer in Custom FAQ Memory.";
  }
}

function askAssistant() {
  const input =
    document.getElementById("userQuestion") ||
    document.getElementById("questionInput") ||
    document.querySelector("textarea[placeholder*='question' i]") ||
    document.querySelector("input[placeholder*='question' i]");

  const answerBox =
    document.getElementById("assistantAnswer") ||
    document.getElementById("answerOutput") ||
    document.getElementById("answer");

  if (!input || !answerBox) {
    alert("Couldn't find the assistant question or answer field. Check the IDs in index.html.");
    return;
  }

  const question = input.value.trim();
  if (!question) return;

  answerBox.textContent = draftAnswer(question);
}

const askButton =
  document.getElementById("askButton") ||
  document.getElementById("sendQuestion") ||
  document.querySelector("[data-ask]");

askButton?.addEventListener("click", askAssistant);

const questionField =
  document.getElementById("userQuestion") ||
  document.getElementById("questionInput");

questionField?.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    askAssistant();
  }
});

document.getElementById("copyAnswer")?.addEventListener("click", async () => {
  const answerBox =
    document.getElementById("assistantAnswer") ||
    document.getElementById("answerOutput") ||
    document.getElementById("answer");

  if (!answerBox?.textContent.trim()) return;

  try {
    await navigator.clipboard.writeText(answerBox.textContent);
    alert("Answer copied!");
  } catch {
    alert("Copy isn't available here. Select and copy the answer manually.");
  }
});

// ---------------- LEAD TRACKER ----------------

function renderLeads() {
  const list =
    document.getElementById("leadList") ||
    document.getElementById("leadsList");

  if (!list) return;

  if (!leads.length) {
    list.innerHTML = "<p>No enquiries recorded yet.</p>";
    return;
  }

  list.innerHTML = leads.map(lead => `
    <article style="padding:12px;margin:8px 0;border:1px solid #7775;border-radius:10px;">
      <strong>${escapeHtml(lead.name)}</strong>
      <p>${escapeHtml(lead.contact)}</p>
      <p>${escapeHtml(lead.message)}</p>
      <label>Status:
        <select data-lead-status="${escapeHtml(lead.id)}">
          ${["New", "Contacted", "Enrolled"].map(status => `
            <option ${lead.status === status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>
      </label>
      <button type="button" data-delete-lead="${escapeHtml(lead.id)}">Delete</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-lead-status]").forEach(select => {
    select.addEventListener("change", () => {
      const lead = leads.find(item => item.id === select.dataset.leadStatus);
      if (lead) {
        lead.status = select.value;
        saveLeads();
      }
    });
  });

  list.querySelectorAll("[data-delete-lead]").forEach(button => {
    button.addEventListener("click", () => {
      leads = leads.filter(item => item.id !== button.dataset.deleteLead);
      saveLeads();
      renderLeads();
    });
  });
}

const leadForm = document.getElementById("leadForm");

leadForm?.addEventListener("submit", event => {
  event.preventDefault();

  const name = leadForm.querySelector('[name="name"]')?.value.trim();
  const contact = leadForm.querySelector('[name="contact"]')?.value.trim();
  const message = leadForm.querySelector('[name="message"]')?.value.trim();

  if (!name || !contact || !message) {
    alert("Please complete all enquiry fields.");
    return;
  }

  const consent = document.getElementById("leadConsent");
  if (consent && !consent.checked) {
    alert("Please confirm that the person agrees to have their enquiry recorded.");
    return;
  }

  leads.unshift({
    id: Date.now().toString(),
    name,
    contact,
    message,
    status: "New"
  });

  saveLeads();
  leadForm.reset();
  renderLeads();
  alert("Enquiry saved!");
});

document.getElementById("clearLeads")?.addEventListener("click", () => {
  if (!confirm("Delete all saved enquiries from this browser?")) return;
  leads = [];
  saveLeads();
  renderLeads();
});

// ---------------- STARTUP ----------------

fillBusinessForm();
installFaqManager();
renderFaqs();
renderLeads();
