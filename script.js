
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const defaultBusiness = {
  name: "BrightPath Tuition Centre",
  courses: "Class 11 and Class 12 Science tuition",
  hours: "Sunday–Friday, 7:00 AM–6:00 PM",
  fees: "",
  contactInfo: ""
};

function loadBusiness() {
  try {
    return {
      ...defaultBusiness,
      ...JSON.parse(localStorage.getItem("sabalflow_business") || "{}")
    };
  } catch {
    return { ...defaultBusiness };
  }
}

function saveBusiness(data) {
  localStorage.setItem("sabalflow_business", JSON.stringify(data));
}

function loadLeads() {
  try {
    const value = JSON.parse(localStorage.getItem("sabalflow_leads") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveLeads(leads) {
  localStorage.setItem("sabalflow_leads", JSON.stringify(leads));
}

let business = loadBusiness();
let leads = loadLeads();
let latestAnswer = "";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function switchTab(name) {
  $$(".tab").forEach(button =>
    button.classList.toggle("active", button.dataset.tab === name)
  );

  $$(".panel").forEach(panel =>
    panel.classList.toggle("active", panel.id === `${name}Panel`)
  );
}

$$(".tab").forEach(button => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

function fillBusinessForm() {
  $("#businessName").value = business.name;
  $("#courses").value = business.courses;
  $("#hours").value = business.hours;
  $("#fees").value = business.fees;
  $("#contactInfo").value = business.contactInfo;
}

fillBusinessForm();

$("#businessForm").addEventListener("submit", event => {
  event.preventDefault();

  business = {
    name: $("#businessName").value.trim() || defaultBusiness.name,
    courses: $("#courses").value.trim(),
    hours: $("#hours").value.trim(),
    fees: $("#fees").value.trim(),
    contactInfo: $("#contactInfo").value.trim()
  };

  saveBusiness(business);
  $("#saveMessage").textContent = "Business information saved on this device.";

  setTimeout(() => {
    $("#saveMessage").textContent = "";
  }, 2500);
});

// Understand more customer question styles.
function getIntent(question) {
  const q = question.toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^(hi|hello|hey|hii|heyy|namaste|good morning|good afternoon|good evening)\b/.test(q)) {
    return "greeting";
  }

  if (/\b(thank you|thanks|thx|thank u)\b/.test(q)) {
    return "thanks";
  }

  if (/\b(who are you|what are you|your name|what is sabalflow)\b/.test(q)) {
    return "identity";
  }

  if (/\b(fee|fees|price|prices|cost|tuition fee|how much|payment|discount)\b/.test(q)) {
    return "fees";
  }

  if (/\b(hours|opening time|closing time|open|close|opening hours|working hours|when are you open|when do you open)\b/.test(q)) {
    return "hours";
  }

  if (/\b(course|courses|class|classes|subject|subjects|service|services|teach|teaching|offer|offers|program|programs|study|studies|science|biology|chemistry|physics|maths|mathematics)\b/.test(q)) {
    return "courses";
  }

  if (/\b(contact|phone|telephone|email|call|address|location|located|directions|where are you|how can i reach)\b/.test(q)) {
    return "contact";
  }

  if (/\b(admission|admissions|enroll|enrol|enrollment|registration|join|joining|apply|application|seat|seats|available seats)\b/.test(q)) {
    return "admission";
  }

  if (/\b(online|offline|physical class|in person|virtual class)\b/.test(q)) {
    return "class_mode";
  }

  if (/\b(schedule|timetable|time table|routine|class time|class timing|class starts|class start)\b/.test(q)) {
    return "schedule";
  }

  if (/\b(scholarship|scholarships|trial class|demo class|free class)\b/.test(q)) {
    return "special";
  }

  if (/\b(bye|goodbye|see you|talk later)\b/.test(q)) {
    return "goodbye";
  }

  if (/\b(help|help me|what can you do|how does this work)\b/.test(q)) {
    return "help";
  }

  return "unknown";
}

function draftAnswer(question) {
  if (!question.trim()) {
    return "Please enter a customer's question first.";
  }

  const name = business.name || "our business";
  const intent = getIntent(question);

  switch (intent) {
    case "greeting":
      return `Hello! 👋 Thank you for contacting ${name}. How can we help you today?`;

    case "thanks":
      return `You're welcome! 😊 Thank you for contacting ${name}. Let us know if you need anything else.`;

    case "identity":
      return `I'm the SabalFlow assistant for ${name}. I help prepare replies using the business information available to me. How can I help you?`;

    case "fees":
      return business.fees.trim()
        ? `Thanks for contacting ${name}! Our saved fee information is: ${business.fees}\n\nPlease contact the team if you need any additional details.`
        : `Thanks for your interest in ${name}! I don't have confirmed fee information yet, so I won't guess the price. Our team can confirm the latest fees for you.`;

    case "hours":
      return business.hours.trim()
        ? `Thanks for contacting ${name}! Our listed opening hours are ${business.hours}.\n\nPlease confirm with the team before visiting on a holiday.`
        : `Thanks for contacting ${name}! Our opening hours haven't been confirmed yet. Please check with the team before visiting.`;

    case "courses":
      return business.courses.trim()
        ? `Thanks for your interest in ${name}! Our currently listed courses or services are: ${business.courses}.\n\nWhich class or subject would you like to know more about?`
        : `Thanks for your interest in ${name}! Our course list hasn't been added yet. Our team can confirm the available courses.`;

    case "contact":
      return business.contactInfo.trim()
        ? `You can contact ${name} using these saved contact details:\n${business.contactInfo}`
        : `I'd be happy to help you contact ${name}, but the contact details haven't been added yet. Please ask the business team for the correct information.`;

    case "admission":
      return `Thanks for your interest in joining ${name}! I don't have confirmed admission dates, seat availability, or registration requirements. Our team can provide the latest admission details.`;

    case "class_mode":
      return `You're asking whether ${name} offers online or in-person classes. That information isn't confirmed in my saved business details yet. Please check with the team.`;

    case "schedule":
      return business.hours.trim()
        ? `The listed business hours are ${business.hours}. However, I don't have a confirmed class timetable. Please ask the team for the exact class schedule.`
        : `I don't have a confirmed class timetable yet. Please contact the team for the latest schedule.`;

    case "special":
      return `That's a good question! I don't have confirmed information about scholarships, discounts, or trial classes. The team at ${name} can confirm which options are available.`;

    case "goodbye":
      return `Thank you for contacting ${name}! Have a wonderful day. We hope to hear from you again!`;

    case "help":
      return `I can help prepare replies about ${name}'s courses, fees, opening hours, admissions, and contact details.\n\nI use the saved business information, so some questions may need a staff member to confirm the answer.`;

    default:
      return `Thanks for contacting ${name}!\n\nI couldn't find a confirmed answer to your question in the saved business information. A staff member should review this enquiry before you receive a final reply.\n\nInternal note: If this question comes up often, add the verified answer to the business information or FAQ list.`;
  }
}

$("#askBtn").addEventListener("click", () => {
  const question = $("#question").value.trim();

  latestAnswer = draftAnswer(question);
  $("#answerText").textContent = latestAnswer;
  $("#answerStatus").textContent = question
    ? "DRAFT READY · REVIEW BEFORE SENDING"
    : "QUESTION REQUIRED";

  $("#copyAnswerBtn").disabled = !question;
});

$("#copyAnswerBtn").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(latestAnswer);
  } catch {
    const area = document.createElement("textarea");
    area.value = latestAnswer;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  $("#copyAnswerBtn").textContent = "Copied ✓";

  setTimeout(() => {
    $("#copyAnswerBtn").textContent = "Copy draft";
  }, 1800);
});

function renderLeads() {
  $("#leadCount").textContent = leads.length;
  const list = $("#leadList");

  if (!leads.length) {
    list.innerHTML = '<div class="answer-card"><p>No enquiries saved yet. Add a fictional demo lead above to test the tracker.</p></div>';
    return;
  }

  list.innerHTML = leads.map(lead => `
    <article class="lead-card">
      <div class="lead-card-head">
        <div>
          <strong>${escapeHtml(lead.name)}</strong>
          <p>${escapeHtml(lead.need)}</p>
        </div>
        <button class="text-btn remove-lead" data-id="${escapeHtml(lead.id)}" aria-label="Delete lead">Delete</button>
      </div>
      <div class="lead-meta">
        <p>${escapeHtml(lead.date)}</p>
        <select class="lead-status" data-id="${escapeHtml(lead.id)}" aria-label="Lead status">
          ${["New", "Contacted", "Follow-up", "Completed"].map(status =>
            `<option ${lead.status === status ? "selected" : ""}>${status}</option>`
          ).join("")}
        </select>
      </div>
    </article>
  `).join("");

  $$(".remove-lead").forEach(button => {
    button.addEventListener("click", () => {
      leads = leads.filter(lead => lead.id !== button.dataset.id);
      saveLeads(leads);
      renderLeads();
    });
  });

  $$(".lead-status").forEach(select => {
    select.addEventListener("change", () => {
      leads = leads.map(lead =>
        lead.id === select.dataset.id
          ? { ...lead, status: select.value }
          : lead
      );

      saveLeads(leads);
      renderLeads();
    });
  });
}

$("#leadForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!$("#leadConsent").checked) {
    alert("For this prototype, confirm you have permission to store the contact's details. Use fictional information for testing.");
    return;
  }

  leads.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name: $("#leadName").value.trim(),
    need: $("#leadNeed").value.trim(),
    status: $("#leadStatus").value,
    date: new Date().toLocaleDateString()
  });

  saveLeads(leads);
  $("#leadForm").reset();
  renderLeads();
});

$("#clearLeadsBtn").addEventListener("click", () => {
  if (confirm("Clear all saved demo leads from this browser?")) {
    leads = [];
    saveLeads(leads);
    renderLeads();
  }
});

renderLeads();
           
