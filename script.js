
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
  $("#saveMessage").textContent = "Saved on this device.";

  setTimeout(() => {
    $("#saveMessage").textContent = "";
  }, 2500);
});

function draftAnswer(question) {
  const q = question.toLowerCase();
  const name = business.name;

  if (!q.trim()) {
    return "Enter a customer's question first.";
  }

  if (/(fee|price|cost|tuition|charge|how much)/.test(q)) {
    if (business.fees.trim()) {
      return `Thanks for contacting ${name}. Our confirmed fee information is: ${business.fees}\n\nPlease contact the team if you need more details.`;
    }

    return `Thanks for contacting ${name}. I don't have a confirmed fee amount in the business information yet, so I don't want to give you an incorrect price. Our team will confirm the current fee with you.`;
  }

  if (/(hour|open|close|time|when)/.test(q)) {
    if (business.hours.trim()) {
      return `Thanks for contacting ${name}. Our listed hours are ${business.hours}. Please confirm with the team if you are planning a visit on a holiday.`;
    }

    return `Thanks for contacting ${name}. Our opening hours have not been confirmed in this demo. Please check with the team before visiting.`;
  }

  if (/(course|class|subject|service|teach|offer|program)/.test(q)) {
    if (business.courses.trim()) {
      return `Thanks for contacting ${name}. The services currently listed are: ${business.courses}. Tell us which class or service you're interested in and the team can share the relevant details.`;
    }

    return `Thanks for contacting ${name}. The course and service list has not been added yet. Our team will confirm what's available.`;
  }

  if (/(contact|phone|email|call|address|location|where)/.test(q)) {
    if (business.contactInfo.trim()) {
      return `You can contact ${name} using this approved contact information: ${business.contactInfo}.`;
    }

    return `Thanks for contacting ${name}. Contact details haven't been added to this demo yet. Please ask the business team for the correct contact information.`;
  }

  return `Thanks for your question. I couldn't find a confirmed answer in ${name}'s saved information. A staff member should review this enquiry before replying.\n\nInternal note: Add the correct answer to the business information if this question comes up often.`;
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
    $("#copyAnswerBtn").textContent = "Copied ✓";

    setTimeout(() => {
      $("#copyAnswerBtn").textContent = "Copy draft";
    }, 1800);
  } catch {
    const area = document.createElement("textarea");
    area.value = latestAnswer;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    $("#copyAnswerBtn").textContent = "Copied ✓";
  }
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
          ${["New","Contacted","Follow-up","Completed"].map(status =>
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
