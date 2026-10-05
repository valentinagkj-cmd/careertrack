# CareerTrack — Internship & Job Application Tracker 🎯

A personal dashboard to organize and track internships and jobs you apply for.

---

## 🎨 Design & Palette (v1)
- **Background:** Warm ivory / off-white (`#FBF9F5`)
- **Accents:** Muted rose (`#B86B6B`)
- **Typography:** Dark brown / warm charcoal (`#2B2320`)
- **Responsiveness:** Fluid grid and layout adapting seamlessly to desktop, tablet, and mobile screens.

---

## 📁 File Structure & Explanations

### 1. `index.html` (The Skeleton & Content)
- Defines the semantic structure of your web page.
- Contains:
  - **Header:** CareerTrack brand icon, title, and the subtitle: *"Track your opportunities. Stay organized."*
  - **Add Application Button:** Positioned in the header for quick access.
  - **4 Statistic Cards:** Total Applications, Interviews, Selected, and Rejected.
  - **Applications Section:** Features an empty state (*"No applications yet."*) that automatically toggles into an interactive cards grid when applications are added.
  - **Add & Edit Application Modal Form:** A popup dialog with fields for Company Name, Job/Internship Role, Application Date, Deadline, Status, Job Link, and Notes, plus Save/Update and Cancel buttons.
  - Links to `style.css` for styling and `app.js` for interactivity.

### 2. `style.css` (The Look & Feel)
- Controls all colors, typography, spacing, and responsive layout behavior.
- Uses **CSS Custom Properties (`:root`)** so you can easily customize colors and values in one place.
- Responsive CSS Grid layouts for stat cards, the modal form, and the application cards grid (adapting smoothly between desktop, tablet, and mobile).
- Styles application cards with status badges (Applied, Interviewing, Selected, Rejected), metadata tags, external job links, and edit (pencil) & delete (trash) action buttons.

### 3. `app.js` (The Logic & Interactivity)
- Brings the webpage to life using JavaScript:
  - Listens for clicks on *"Add Application"* buttons to open the modal dialog in creation mode.
  - **Edit & Status Updates:** Clicking the pencil icon opens the modal in Edit mode, pre-fills the existing data, and lets you update details or transition status (*Applied*, *Interviewing*, *Selected*, *Rejected*).
  - Pre-fills today's date automatically when creating new entries.
  - Closes the modal on *"Cancel"*, the *“X”* button, backdrop clicks, or pressing the `Escape` key.
  - **Applications List Rendering:** Dynamically builds job cards using safe DOM methods (`document.createElement`, `textContent`) to protect against XSS.
  - **Empty-State Toggling:** Automatically shows/hides the empty state illustration based on whether applications exist.
  - **Delete Functionality:** Prompts for confirmation, removes the job from `localStorage`, re-renders the list, and updates stats.
  - **LocalStorage Persistence:** Saves and loads all applications reliably (`careertrack_applications`).
  - Updates the 4 stat counters dynamically in real-time.

---

## 🚀 How to Run the Project

1. Simply double-click `index.html` to open it in any web browser (Chrome, Edge, Firefox, Safari).
2. Alternatively, if you use VS Code, right-click `index.html` and choose **"Open with Live Server"**.
