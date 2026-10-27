
const $ = (id) => document.getElementById(id);

const DEFAULT_BUSINESS = {
  name: "BrightPath Tuition Centre",
  courses: "Class 11 and Class 12 Science tuition",
  hours: "Sunday–Friday, 7:00 AM–6:00 PM",
  fees: "",
  contactInfo: ""
};

function loadData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    alert("Could not save data. Check your browser storage.");
    return false;
  }
}

let business = {
  ...DEFAULT_BUSINESS,
  ...loadData("sabalflow_business", {})
};

let leads = loadData("sabalflow_leads", []);
let faqs = loadData("sabalflow_faqs", []);

// ---------------- TABS ----------------

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".panel").forEach(panel => {
      panel.classList.toggle(
        "active",
        panel.id === tab + "Panel"
      );
    });
  });
});

// ---------------- BUSINESS INFORMATION ----------------

function fillBusinessForm() {
  $("businessName").value = business.name;
  $("courses").value = business.courses;
  $("hours").value = business.hours;
  $("fees").value = business.fees;
  $("contactInfo").value = business.contactInfo;
}

$("businessForm").addEventListener("submit", event => {
  event.preventDefault();

  business = {
    name: $("businessName").value.trim() || DEFAULT_BUSINESS.name,
    courses: $("courses").value.trim(),
    hours: $("hours").value.trim(),
    fees: $("fees").value.trim(),
    contactInfo: $("contactInfo").value.trim()
  };

  if (saveData("sabalflow_business", business)) {
    $("saveMessage").textContent = "Business information saved successfully!";
  }
});

// ---------------- CUSTOM FAQ MEMORY ----------------

function installFaqManager() {
  const section = document.createElement("div");
  section.id = "faqManager";
  section.className = "note";
  section.style.marginTop = "20px";

  section.innerHTML = `
    <h3>Custom FAQ Memory</h3>
    <p>Teach your assistant questions and verified answers.</p>

    <form id="faqForm">
      <label for="faqQuestion">Customer question</label>
      <input id="faqQuestion" required maxlength="250"
        placeholder="Do you offer trial classes?">

      <label for="faqAnswer">Approved answer</label>
      <textarea id="faqAnswer" required maxlength="1500" rows="3"
        placeholder="Enter the correct answer here"></textarea>

      <button class="primary-btn" type="submit">Save FAQ ＋</button>
    </form>

    <div id="faqList"></div>
  `;

  $("settingsPanel").appendChild(section);

  $("faqForm").addEventListener("submit", event => {
    event.preventDefault();

    const question = $("faqQuestion").value.trim();
    const answer = $("faqAnswer").value.trim();

    if (!question || !answer) return;

    // Replace an existing FAQ with the same question.
    const existing = faqs.findIndex(
      faq => normalize(faq.question) === normalize(question)
    );

    const faq = {
      id: existing >= 0 ? faqs[existing].id : String(Date.now()),
      question,
      answer
    };

    if (existing >= 0) {
      faqs[existing] = faq;
    } else {
      faqs.push(faq);
    }

    if (saveData("sabalflow_faqs", faqs)) {
      $("faqForm").reset();
      renderFaqs();
    }
  });

  renderFaqs();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderFaqs() {
  const list = $("faqList");
  if (!list) return;

  if (!faqs.length) {
    list.innerHTML = "<p>No custom FAQs saved yet.</p>";
    return;
  }

  list.innerHTML = faqs.map(faq => `
    <article style="padding:12px;margin-top:10px;border:1px solid #7775;border-radius:10px">
      <strong>${escapeHtml(faq.question)}</strong>
      <p>${escapeHtml(faq.answer)}</p>
      <button type="button" class="text-btn"
        data-edit-faq="${escapeHtml(faq.id)}">Edit</button>
      <button type="button" class="danger-text"
        data-delete-faq="${escapeHtml(faq.id)}">Delete</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-edit-faq]").forEach(button => {
    button.addEventListener("click", () => {
      const faq = faqs.find(item => item.id === button.dataset.editFaq);
      if (!faq) return;

      $("faqQuestion").value = faq.question;
      $("faqAnswer").value = faq.answer;
      $("faqQuestion").focus();
    });
  });

  list.querySelectorAll("[data-delete-faq]").forEach(button => {
    button.addEventListener("click", () => {
      if (!confirm("Delete this FAQ?")) return;

      faqs = faqs.filter(item => item.id !== button.dataset.deleteFaq);
      saveData("sabalflow_faqs", faqs);
      renderFaqs();
    });
  });
}

function findCustomFaq(question) {
  const inputWords = normalize(question)
    .split(" ")
    .filter(word => word.length > 2);

  if (!inputWords.length) return null;

  let best = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const faqWords = [
      ...new Set(
        normalize(faq.question)
          .split(" ")
          .filter(word => word.length > 2)
      )
    ];

    if (!faqWords.length) continue;

    const matches = inputWords.filter(word =>
      faqWords.includes(word)
    ).length;

    const score = matches / Math.max(inputWords.length, faqWords.length);

    if (matches >= 2 && score > bestScore) {
      best = faq;
      bestScore = score;
    }
  }

  return bestScore >= 0.35 ? best : null;
}

// ---------------- ASSISTANT BRAIN ----------------

function getAnswer(question) {
  const q = normalize(question);

  if (!q) return "Please enter a question first.";

  // Custom business FAQs get priority.
  const customFaq = findCustomFaq(question);
  if (customFaq) return customFaq.answer;

  if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening)\b/.test(q)) {
    return `Hello! Welcome to ${business.name}. How can I help you today?`;
  }

  if (/\b(thanks|thank you|thankyou)\b/.test(q)) {
    return "You're welcome! Feel free to ask if you need anything else.";
  }

  if (/\b(who are you|what are you|your name)\b/.test(q)) {
    return `I'm the business assistant for ${business.name}. I can help with questions about courses, fees, hours, and admissions.`;
  }

  if (/\b(fee|fees|price|prices|cost|costs|charge|charges)\b/.test(q)) {
    return business.fees
      ? `Our confirmed fee information is: ${business.fees}`
      : "Our confirmed fee information hasn't been added yet. Please contact the business for accurate details.";
  }

  if (/\b(hours|opening hours|opening time|closing time|when.*open)\b/.test(q)) {
    return business.hours
      ? `Our opening hours are ${business.hours}.`
      : "Opening hours haven't been added yet. Please contact the business to confirm.";
  }

  if (/\b(course|courses|service|services|subject|subjects|teach|teaching|biology|chemistry|physics|math|mathematics)\b/.test(q)) {
    return business.courses
      ? `We offer: ${business.courses}. Ask us for details about a specific course.`
      : "Our course information hasn't been added yet. Please contact the business.";
  }

  if (/\b(contact|phone|telephone|email|address|location)\b/.test(q)) {
    return business.contactInfo
      ? `Our approved contact information is: ${business.contactInfo}`
      : "Contact information hasn't been added yet. Please check with the business directly.";
  }

  if (/\b(admission|admissions|enrol|enroll|enrollment|enrolment|register|registration|join)\b/.test(q)) {
    return `For admission details, please contact ${business.name} to confirm requirements and available places.`;
  }

  if (/\b(online|offline|virtual|in person|in-person)\b/.test(q)) {
    return "I don't have verified information about online or in-person classes yet. Please contact the business to confirm.";
  }

  if (/\b(scholarship|scholarships|discount|discounts|trial class|free class)\b/.test(q)) {
    return "I don't have verified information about scholarships, discounts, or trial classes yet. Please contact the business to confirm.";
  }

  if (/\b(timetable|schedule|class timing|class timings)\b/.test(q)) {
    return `The listed business hours are ${business.hours || "not available yet"}. For the exact class timetable, please contact the business.`;
  }

  if (/\b(bye|goodbye|see you)\b/.test(q)) {
    return "Thank you for contacting us. Have a great day!";
  }

  return "I don't have a verified answer for that question yet. You can teach me the correct answer in Business Info → Custom FAQ Memory.";
}

function generateAnswer() {
  const question = $("question").value.trim();

  if (!question) {
    $("answerText").textContent = "Please type a customer question first.";
    $("answerStatus").textContent = "QUESTION NEEDED";
    $("copyAnswerBtn").disabled = true;
    return;
  }

  $("answerText").textContent = getAnswer(question);
  $("answerStatus").textContent = "DRAFT READY — REVIEW BEFORE SENDING";
  $("copyAnswerBtn").disabled = false;
}

$("askBtn").addEventListener("click", generateAnswer);

$("question").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    generateAnswer();
  }
});

$("copyAnswerBtn").addEventListener("click", async () => {
  const text = $("answerText").textContent;

  try {
    await navigator.clipboard.writeText(text);
    $("copyAnswerBtn").textContent = "Copied!";
    setTimeout(() => {
      $("copyAnswerBtn").textContent = "Copy draft";
    }, 1500);
  } catch {
    alert("Copy is unavailable. Please select and copy the answer manually.");
  }
});

// ---------------- LEAD TRACKER ----------------

function renderLeads() {
  const list = $("leadList");
  $("leadCount").textContent = leads.length;

  if (!leads.length) {
    list.innerHTML = '<p class="muted">No enquiries saved yet.</p>';
    return;
  }

  list.innerHTML = leads.map(lead => `
    <article class="note" style="margin:12px 0">
      <strong>${escapeHtml(lead.name)}</strong>
      <p>${escapeHtml(lead.need)}</p>
      <label>Status
        <select data-status-id="${escapeHtml(lead.id)}">
          ${["New", "Contacted", "Follow-up", "Completed"].map(status => `
            <option ${lead.status === status ? "selected" : ""}>${status}</option>
          `).join("")}
        </select>
      </label>
      <button type="button" class="danger-text"
        data-remove-id="${escapeHtml(lead.id)}">Delete enquiry</button>
    </article>
  `).join("");

  list.querySelectorAll("[data-status-id]").forEach(select => {
    select.addEventListener("change", () => {
      const lead = leads.find(item => item.id === select.dataset.statusId);
      if (!lead) return;

      lead.status = select.value;
      saveData("sabalflow_leads", leads);
    });
  });

  list.querySelectorAll("[data-remove-id]").forEach(button => {
    button.addEventListener("click", () => {
      leads = leads.filter(item => item.id !== button.dataset.removeId);
      saveData("sabalflow_leads", leads);
      renderLeads();
    });
  });
}

$("leadForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!$("leadConsent").checked) {
    alert("Please confirm you have permission to store this contact's details.");
    return;
  }

  leads.unshift({
    id: String(Date.now()),
    name: $("leadName").value.trim(),
    need: $("leadNeed").value.trim(),
    status: $("leadStatus").value
  });

  if (saveData("sabalflow_leads", leads)) {
    $("leadForm").reset();
    renderLeads();
  }
});

$("clearLeadsBtn").addEventListener("click", () => {
  if (!leads.length) {
    alert("There are no saved enquiries.");
    return;
  }

  if (!confirm("Delete all saved demo enquiries?")) return;

  leads = [];
  saveData("sabalflow_leads", leads);
  renderLeads();
});

// ---------------- STARTUP ----------------

fillBusinessForm();
installFaqManager();
renderLeads();
      
