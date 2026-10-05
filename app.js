/* ==========================================================================
   CareerTrack — JavaScript (app.js)
   --------------------------------------------------------------------------
   Welcome to CareerTrack!
   This file manages the interactive behavior of your application, including:
   
   1. Modal Dialog Controls: Opening and closing the form in Add or Edit mode.
   2. Form Processing & Validation: Capturing job application inputs safely.
   3. LocalStorage Persistence:
      - Automatically saves application data into the browser's LocalStorage.
      - Loads saved applications when the page opens or refreshes.
      - Retains all existing entries when new applications are added or edited.
   4. Applications List Rendering (Safe DOM):
      - Renders an interactive card for each saved application.
      - Toggles between the Empty State (0 applications) and Grid (1+ applications).
      - Uses safe DOM methods (textContent) to prevent XSS vulnerabilities.
   5. Edit & Status Update Functionality:
      - Lets the user edit any application details and update its status
        (Applied, Interviewing, Selected, Rejected).
   6. Delete Functionality:
      - Lets the user remove an application with a confirmation prompt.
      - Updates LocalStorage, re-renders the list, and recalculates dashboard stats.
   7. Live Dashboard Stats: Updating Total Applications, Interviews,
      Selected, and Rejected counts automatically.
   ========================================================================== */

// 1. Wait for the HTML document to fully load before running JavaScript
document.addEventListener("DOMContentLoaded", () => {

  // ------------------------------------------------------------------------
  // 2. Constants & Storage Key
  // LocalStorage stores data as key-value pairs. STORAGE_KEY is the label/name
  // under which our application list is stored in the browser.
  // ------------------------------------------------------------------------
  const STORAGE_KEY = "careertrack_applications";

  // In-memory array that holds all applications while the page is open.
  // When the page opens, we load saved data from LocalStorage into this array.
  let applications = [];

  // ------------------------------------------------------------------------
  // 3. Element Selectors
  // Using document.getElementById to grab references to HTML elements by their ID.
  // ------------------------------------------------------------------------
  // Buttons that trigger opening the modal
  const addAppBtn = document.getElementById("addAppBtn");         // Header button
  const emptyAddBtn = document.getElementById("emptyAddBtn");     // Empty state button

  // Applications list & empty-state containers
  const applicationsGrid = document.getElementById("applicationsGrid"); // Cards grid
  const emptyState = document.getElementById("emptyState");             // Empty state container

  // Modal elements
  const applicationModal = document.getElementById("applicationModal"); // Modal backdrop overlay
  const modalTitle = document.getElementById("modalTitle");             // Modal heading
  const modalSubtitle = document.getElementById("modalSubtitle");       // Modal subtext
  const closeModalBtn = document.getElementById("closeModalBtn");       // Top-right 'X' button
  const cancelBtn = document.getElementById("cancelBtn");               // 'Cancel' button
  const saveBtnText = document.getElementById("saveBtnText");           // Save button text span
  const applicationForm = document.getElementById("applicationForm");   // The <form> element
  const editAppIdInput = document.getElementById("editAppId");           // Hidden input for edit mode

  // Form input fields
  const companyNameInput = document.getElementById("companyName");
  const jobRoleInput = document.getElementById("jobRole");
  const appDateInput = document.getElementById("appDate");
  const appDeadlineInput = document.getElementById("appDeadline");
  const appStatusSelect = document.getElementById("appStatus");
  const jobLinkInput = document.getElementById("jobLink");
  const appNotesInput = document.getElementById("appNotes");

  // Stat count elements in the top cards
  const statTotal = document.getElementById("statTotal");
  const statInterviews = document.getElementById("statInterviews");
  const statSelected = document.getElementById("statSelected");
  const statRejected = document.getElementById("statRejected");

  // ------------------------------------------------------------------------
  // 4. LocalStorage Functions: Loading and Saving Data
  // ========================================================================
  // BEGINNER GUIDE: HOW LOCALSTORAGE WORKS
  // ------------------------------------------------------------------------
  // • What is LocalStorage?
  //   It is a built-in browser feature that allows websites to save data
  //   directly on the user's computer. The data does NOT disappear when
  //   the page is refreshed or the browser is closed.
  //
  // • The String Limitation:
  //   LocalStorage can ONLY store plain text (strings). It cannot directly
  //   store JavaScript objects or arrays.
  //
  // • Saving with JSON.stringify():
  //   To store our array of applications, we turn it into a text string
  //   using `JSON.stringify(applications)`. Then we call:
  //   `localStorage.setItem(STORAGE_KEY, stringData)`.
  //
  // • Loading with JSON.parse():
  //   To retrieve the data, we read the text string using:
  //   `localStorage.getItem(STORAGE_KEY)`.
  //   Then we convert the string back into a real JavaScript array using
  //   `JSON.parse(stringData)`.
  //
  // • Preserving Existing Data:
  //   We update our in-memory `applications` array before saving. This
  //   ensures previously saved applications are never lost.
  // ========================================================================

  /**
   * Loads saved applications from the browser's LocalStorage.
   * Runs automatically every time the page opens or refreshes.
   */
  function loadApplicationsFromStorage() {
    try {
      // 1. Retrieve the saved string from LocalStorage
      const storedData = localStorage.getItem(STORAGE_KEY);

      // 2. If data exists, parse it back into our applications array
      if (storedData) {
        applications = JSON.parse(storedData);
        console.log(`[LocalStorage] Successfully loaded ${applications.length} application(s).`);
      } else {
        // If this is the user's first visit, start with an empty array
        applications = [];
        console.log("[LocalStorage] No saved applications found. Starting fresh.");
      }
    } catch (error) {
      // If the data is somehow corrupted, catch the error gracefully
      console.error("[LocalStorage] Error parsing stored applications:", error);
      applications = [];
    }

    // 3. Immediately render the applications cards & toggle the empty state
    renderApplications();

    // 4. Update the statistic cards with the loaded numbers
    updateStatistics();
  }

  /**
   * Saves the current applications array to LocalStorage.
   * Called whenever an application is added, edited, or deleted.
   */
  function saveApplicationsToStorage() {
    try {
      // Convert the JavaScript array into a JSON text string
      const jsonString = JSON.stringify(applications);

      // Write the string into LocalStorage under our key
      localStorage.setItem(STORAGE_KEY, jsonString);
      console.log(`[LocalStorage] Saved ${applications.length} application(s) to storage.`);
    } catch (error) {
      console.error("[LocalStorage] Error saving applications to LocalStorage:", error);
    }
  }

  // ------------------------------------------------------------------------
  // 5. Safe DOM Rendering: Render Applications List & Empty-State Toggle
  // ========================================================================
  // BEGINNER GUIDE: SAFE DOM RENDERING (PREVENTING XSS)
  // ------------------------------------------------------------------------
  // When displaying user-entered data on a webpage, you should never insert
  // raw text with `element.innerHTML = userInput`. If a user enters text
  // containing `<script>` or HTML tags, it could execute malicious code
  // (a vulnerability called Cross-Site Scripting, or XSS).
  //
  // Instead, we use `document.createElement()` and assign user text using
  // `element.textContent = userText`. The browser automatically treats it
  // strictly as text, making it 100% safe.
  // ========================================================================

  /**
   * Renders the applications list or displays the empty state.
   */
  function renderApplications() {
    if (!applicationsGrid || !emptyState) return;

    // Check if there are no applications
    if (applications.length === 0) {
      // Show empty state, hide the grid
      emptyState.style.display = "flex";
      applicationsGrid.style.display = "none";
      applicationsGrid.innerHTML = "";
      return;
    }

    // When 1 or more applications exist: hide empty state, show grid
    emptyState.style.display = "none";
    applicationsGrid.style.display = "grid";

    // Clear previous card elements before re-rendering
    applicationsGrid.innerHTML = "";

    // Render applications in reverse order (newest application first)
    const reversedList = [...applications].reverse();

    reversedList.forEach((app) => {
      // Create the main card container
      const card = document.createElement("article");
      card.className = "application-card";
      card.setAttribute("data-id", app.id);

      // --------------------------------------------------------------------
      // Card Header: Title group (Company & Role) + Actions (Badge, Edit, Delete)
      // --------------------------------------------------------------------
      const header = document.createElement("div");
      header.className = "app-card-header";

      const titleGroup = document.createElement("div");
      titleGroup.className = "app-card-title-group";

      const companyEl = document.createElement("h3");
      companyEl.className = "app-card-company";
      companyEl.textContent = app.company; // Safe textContent

      const roleEl = document.createElement("p");
      roleEl.className = "app-card-role";
      roleEl.textContent = app.role;       // Safe textContent

      titleGroup.appendChild(companyEl);
      titleGroup.appendChild(roleEl);

      const actionsGroup = document.createElement("div");
      actionsGroup.className = "app-card-actions";

      // Status Badge
      const statusBadge = document.createElement("span");
      const normalizedStatus = (app.status || "Applied").toLowerCase();
      statusBadge.className = `status-badge status-badge-${normalizedStatus}`;
      statusBadge.textContent = app.status || "Applied"; // Safe textContent
      actionsGroup.appendChild(statusBadge);

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.className = "app-card-edit-btn";
      editBtn.type = "button";
      editBtn.setAttribute("aria-label", `Edit application for ${app.company}`);
      editBtn.setAttribute("title", "Edit application");
      editBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      // Attach click event for editing this application
      editBtn.addEventListener("click", () => {
        handleEditApplication(app.id);
      });
      actionsGroup.appendChild(editBtn);

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "app-card-delete-btn";
      deleteBtn.type = "button";
      deleteBtn.setAttribute("aria-label", `Delete application for ${app.company}`);
      deleteBtn.setAttribute("title", "Delete application");
      deleteBtn.innerHTML = `
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      // Attach click event for deleting this specific application
      deleteBtn.addEventListener("click", () => {
        handleDeleteApplication(app.id, app.company);
      });
      actionsGroup.appendChild(deleteBtn);

      header.appendChild(titleGroup);
      header.appendChild(actionsGroup);
      card.appendChild(header);

      // --------------------------------------------------------------------
      // Card Meta: Application Date & Deadline (if provided)
      // --------------------------------------------------------------------
      if (app.date || app.deadline) {
        const metaContainer = document.createElement("div");
        metaContainer.className = "app-card-meta";

        if (app.date) {
          const dateItem = document.createElement("span");
          dateItem.className = "app-card-meta-item";
          dateItem.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          `;
          const dateText = document.createElement("span");
          dateText.textContent = `Applied: ${formatDate(app.date)}`; // Safe textContent
          dateItem.appendChild(dateText);
          metaContainer.appendChild(dateItem);
        }

        if (app.deadline) {
          const deadlineItem = document.createElement("span");
          deadlineItem.className = "app-card-meta-item";
          deadlineItem.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          `;
          const deadlineText = document.createElement("span");
          deadlineText.textContent = `Deadline: ${formatDate(app.deadline)}`; // Safe textContent
          deadlineItem.appendChild(deadlineText);
          metaContainer.appendChild(deadlineItem);
        }

        card.appendChild(metaContainer);
      }

      // --------------------------------------------------------------------
      // Card Link: Job Link (if provided)
      // --------------------------------------------------------------------
      if (app.link && app.link.trim() !== "") {
        let safeUrl = app.link.trim();
        // Automatically add https:// if the user didn't include a protocol
        if (!/^https?:\/\//i.test(safeUrl)) {
          safeUrl = "https://" + safeUrl;
        }

        // Security check: only allow http:// or https:// URLs
        if (/^https?:\/\//i.test(safeUrl)) {
          const linkEl = document.createElement("a");
          linkEl.className = "app-card-link";
          linkEl.href = safeUrl;
          linkEl.target = "_blank";
          linkEl.rel = "noopener noreferrer"; // Security best practice for external links
          linkEl.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>View Job Listing</span>
          `;
          card.appendChild(linkEl);
        }
      }

      // --------------------------------------------------------------------
      // Card Notes: User Notes (if provided)
      // --------------------------------------------------------------------
      if (app.notes && app.notes.trim() !== "") {
        const notesEl = document.createElement("div");
        notesEl.className = "app-card-notes";
        notesEl.textContent = app.notes; // Safe textContent prevents any HTML execution
        card.appendChild(notesEl);
      }

      // Append the assembled card into the grid
      applicationsGrid.appendChild(card);
    });
  }

  // ------------------------------------------------------------------------
  // 6. Edit & Delete Application Handlers
  // ------------------------------------------------------------------------
  /**
   * Opens the modal in "Edit Mode" populated with the existing application details.
   */
  function handleEditApplication(id) {
    const appToEdit = applications.find((app) => app.id == id);
    if (!appToEdit) return;

    openEditModal(appToEdit);
  }

  /**
   * Deletes an application after asking for user confirmation.
   * Updates LocalStorage, re-renders the grid, and updates statistic counters.
   */
  function handleDeleteApplication(id, companyName) {
    // Show a browser confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the application for "${companyName}"?`);
    if (!confirmed) return;

    // Filter out the application with the matching ID
    applications = applications.filter((app) => app.id != id);

    // Save the updated list to LocalStorage
    saveApplicationsToStorage();

    // Re-render the application cards (or restore the empty state if 0 remain)
    renderApplications();

    // Recalculate dashboard statistics
    updateStatistics();

    // Show a helpful notification toast
    showNotification(`Deleted application for ${companyName}.`);
  }

  /**
   * Helper function to format YYYY-MM-DD dates nicely (e.g., "Oct 5, 2026")
   */
  function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }
    }
    return dateString;
  }

  // ------------------------------------------------------------------------
  // 7. Modal Controls (Add Mode vs. Edit Mode)
  // ------------------------------------------------------------------------
  
  /**
   * Opens the modal in "Add Application" mode with blank inputs.
   */
  function openAddModal() {
    if (!applicationModal) return;

    // Set modal headers and button for Add mode
    if (modalTitle) modalTitle.textContent = "Add Application";
    if (modalSubtitle) modalSubtitle.textContent = "Track a new internship or job opportunity.";
    if (saveBtnText) saveBtnText.textContent = "Save Application";

    // Clear hidden edit ID
    if (editAppIdInput) editAppIdInput.value = "";

    // Clear previous inputs
    applicationForm.reset();

    // Automatically pre-fill today's date
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    appDateInput.value = today;

    // Show modal
    applicationModal.classList.add("active");

    // Focus on Company Name field
    setTimeout(() => {
      companyNameInput.focus();
    }, 150);
  }

  /**
   * Opens the modal in "Edit Application" mode pre-filled with existing data.
   */
  function openEditModal(app) {
    if (!applicationModal) return;

    // Set modal headers and button for Edit mode
    if (modalTitle) modalTitle.textContent = "Edit Application";
    if (modalSubtitle) modalSubtitle.textContent = "Update your application details and status.";
    if (saveBtnText) saveBtnText.textContent = "Update Application";

    // Store application ID in hidden input so the submit handler knows we are editing
    if (editAppIdInput) editAppIdInput.value = app.id;

    // Pre-populate all form fields with existing values
    companyNameInput.value = app.company || "";
    jobRoleInput.value = app.role || "";
    appDateInput.value = app.date || "";
    appDeadlineInput.value = app.deadline || "";
    appStatusSelect.value = app.status || "Applied";
    jobLinkInput.value = app.link || "";
    appNotesInput.value = app.notes || "";

    // Show modal
    applicationModal.classList.add("active");

    // Focus on Company Name field
    setTimeout(() => {
      companyNameInput.focus();
    }, 150);
  }

  /**
   * Closes the modal and resets the form state.
   */
  function closeModal() {
    if (!applicationModal) return;

    // Hide modal
    applicationModal.classList.remove("active");

    // Reset form inputs and hidden edit ID
    applicationForm.reset();
    if (editAppIdInput) editAppIdInput.value = "";

    // Restore default Add mode labels
    if (modalTitle) modalTitle.textContent = "Add Application";
    if (modalSubtitle) modalSubtitle.textContent = "Track a new internship or job opportunity.";
    if (saveBtnText) saveBtnText.textContent = "Save Application";
  }

  // Attach event listeners to open the modal in Add mode
  if (addAppBtn) {
    addAppBtn.addEventListener("click", openAddModal);
  }

  if (emptyAddBtn) {
    emptyAddBtn.addEventListener("click", openAddModal);
  }

  // Attach event listeners to close the modal
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  // Close the modal when clicking on the dimmed background backdrop
  if (applicationModal) {
    applicationModal.addEventListener("click", (event) => {
      if (event.target === applicationModal) {
        closeModal();
      }
    });
  }

  // Close the modal when pressing the "Escape" key on the keyboard
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && applicationModal.classList.contains("active")) {
      closeModal();
    }
  });

  // ------------------------------------------------------------------------
  // 8. Form Submission: Save New Application OR Update Existing Application
  // ------------------------------------------------------------------------
  if (applicationForm) {
    applicationForm.addEventListener("submit", (event) => {
      // Prevent browser from reloading the page
      event.preventDefault();

      // Retrieve values from each input field
      const company = companyNameInput.value.trim();
      const role = jobRoleInput.value.trim();
      const date = appDateInput.value;
      const deadline = appDeadlineInput.value;
      const status = appStatusSelect.value;
      const link = jobLinkInput.value.trim();
      const notes = appNotesInput.value.trim();

      // Validation: Ensure required fields are not empty
      if (!company) {
        showNotification("Please enter a company name.");
        companyNameInput.focus();
        return;
      }

      if (!role) {
        showNotification("Please enter a job or internship role.");
        jobRoleInput.focus();
        return;
      }

      const editingId = editAppIdInput ? editAppIdInput.value : "";

      // --------------------------------------------------------------------
      // CASE 1: EDIT EXISTING APPLICATION
      // --------------------------------------------------------------------
      if (editingId) {
        const index = applications.findIndex((app) => app.id == editingId);

        if (index !== -1) {
          // Update properties while preserving ID and creation timestamp
          applications[index].company = company;
          applications[index].role = role;
          applications[index].date = date;
          applications[index].deadline = deadline;
          applications[index].status = status;
          applications[index].link = link;
          applications[index].notes = notes;
          applications[index].updatedAt = new Date().toISOString();

          // 1. Save updated list to LocalStorage
          saveApplicationsToStorage();

          // 2. Re-render cards (reflecting new company, role, status badge, etc.)
          renderApplications();

          // 3. Recalculate statistics (e.g. if status moved from Applied to Interviewing/Selected)
          updateStatistics();

          // 4. Close the modal dialog
          closeModal();

          // 5. Show confirmation toast
          showNotification(`Updated: ${role} at ${company}!`);
        }
      } 
      // --------------------------------------------------------------------
      // CASE 2: ADD NEW APPLICATION
      // --------------------------------------------------------------------
      else {
        // Create a new application object
        const newApplication = {
          id: Date.now(), // Unique ID using current timestamp
          company: company,
          role: role,
          date: date,
          deadline: deadline,
          status: status,
          link: link,
          notes: notes,
          createdAt: new Date().toISOString()
        };

        // 1. Add the new application to our array
        applications.push(newApplication);

        // 2. Persist the updated array to LocalStorage immediately
        saveApplicationsToStorage();

        // 3. Render the updated applications list
        renderApplications();

        // 4. Update the 4 statistic cards on the dashboard
        updateStatistics();

        // 5. Close the modal dialog and clear the form inputs
        closeModal();

        // 6. Show a friendly confirmation toast
        showNotification(`Saved: ${role} at ${company}!`);
      }
    });
  }

  // ------------------------------------------------------------------------
  // 9. Update Statistic Cards Function
  // Recalculates Total, Interviews, Selected, and Rejected counts
  // based on the applications currently in memory.
  // ------------------------------------------------------------------------
  function updateStatistics() {
    const totalCount = applications.length;
    const interviewCount = applications.filter((app) => app.status === "Interviewing").length;
    const selectedCount = applications.filter((app) => app.status === "Selected").length;
    const rejectedCount = applications.filter((app) => app.status === "Rejected").length;

    if (statTotal) statTotal.textContent = totalCount;
    if (statInterviews) statInterviews.textContent = interviewCount;
    if (statSelected) statSelected.textContent = selectedCount;
    if (statRejected) statRejected.textContent = rejectedCount;
  }

  // ------------------------------------------------------------------------
  // 10. Helper Function: Notification Banner (Toast)
  // Creates and displays a subtle pop-up at the bottom of the screen.
  // ------------------------------------------------------------------------
  let toastTimeout;

  function showNotification(message) {
    let toast = document.querySelector(".toast-notice");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast-notice";
      toast.innerHTML = `<span class="toast-dot"></span><span class="toast-message"></span>`;
      document.body.appendChild(toast);
    }

    // Set the text message
    toast.querySelector(".toast-message").textContent = message;

    // Show the toast by adding the active CSS class
    toast.classList.add("show");

    // Clear any previous timer so toasts don't flicker if clicked quickly
    clearTimeout(toastTimeout);

    // Hide the notification automatically after 3.5 seconds
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }

  // ------------------------------------------------------------------------
  // 11. Initial Load on Page Startup
  // Load saved applications from LocalStorage, render the cards,
  // and update dashboard statistics right away!
  // ------------------------------------------------------------------------
  loadApplicationsFromStorage();

});
