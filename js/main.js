window.onload = loaded;

function loaded() {
    const path = window.location.pathname;

    if (path.includes("index.html") || path.endsWith("/")) {
        console.log("Index page loaded");
    }

    if (path.includes("add-event.html")) {
        setupAddEventForm();
    }

    if (path.includes("view-events.html")) {
        loadEvents();
        setupEventFilter();
    }

    if (path.includes("event-details.html")) {
        loadEventDetails();
    }

    setupDarkModeToggle();
}

// Toggles from light mode to dark mode
function setupDarkModeToggle() {
    const toggleButton = document.getElementById("dark-mode-toggle");
    if (!toggleButton) return;

    const isDarkMode = document.documentElement.classList.contains("dark-mode");
    if (isDarkMode) {
        toggleButton.textContent = "Switch to Light Mode";
    } else {
        toggleButton.textContent = "Switch to Dark Mode";
    }

    toggleButton.addEventListener("click", () => {
        document.documentElement.classList.toggle("dark-mode");

        const darkModeEnabled = document.documentElement.classList.contains("dark-mode");
        localStorage.setItem("dark-mode", darkModeEnabled);

        toggleButton.textContent = darkModeEnabled ? "Switch to Light Mode" : "Switch to Dark Mode";
    });
}

// Set up the Add Event form
function setupAddEventForm() {
    const form = document.getElementById("eventForm");
    if (form) {
        form.onsubmit = function (e) {
            e.preventDefault();
            addEvent();
        };
    }
}

// Add a new event
function addEvent() {
    const title = document.getElementById("title").value.trim();
    const date = document.getElementById("date").value.trim();
    const startTime = document.getElementById("startTime").value.trim();
    const endTime = document.getElementById("endTime").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();

    const messageEl = document.getElementById("message");

    if (!title || !date || !startTime || !endTime) {
        messageEl.textContent = "Please fill in all required fields.";
        messageEl.style.color = "red";
        return;
    }

    const id = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const eventData = { id, title, date, startTime, endTime, location, description };

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "https://f18r15nee0.execute-api.us-west-1.amazonaws.com/items");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            messageEl.textContent = "Event added successfully!";
            messageEl.style.color = "green";
            document.getElementById("eventForm").reset();
        } else {
            messageEl.textContent = "Failed to add event. Please try again.";
            messageEl.style.color = "red";
        }

        setTimeout(() => {
            messageEl.textContent = "";
        }, 3000);
    });

    xhr.send(JSON.stringify(eventData));
}

// Load all events into a table
function loadEvents() {
    const tableBody = document.getElementById("event-list")?.querySelector("tbody");
    if (!tableBody) return;

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            const events = JSON.parse(xhr.response);

            events.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.startTime}`);
                const dateB = new Date(`${b.date}T${b.startTime}`);
                return dateA - dateB;
            });

            tableBody.innerHTML = "";

            events.forEach(event => {
                const formattedStartTime = formatTime(event.startTime);
                const formattedEndTime = formatTime(event.endTime);

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><a href="event-details.html?id=${event.id}">${event.title}</a></td>
                    <td>${event.date}</td>
                    <td>${formattedStartTime} - ${formattedEndTime}</td>
                    <td>${event.location}</td>
                    <td>${event.description}</td>
                    <td><button onclick="deleteEvent('${event.id}')">Delete</button></td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            alert("Failed to load events. Please try again.");
        }
    });

    xhr.open("GET", "https://f18r15nee0.execute-api.us-west-1.amazonaws.com/items");
    xhr.send();
}

// Helper function to format time to 12-hour format with AM/PM
function formatTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Set up the event filter for the search bar
function setupEventFilter() {
    const searchBar = document.getElementById("search-bar");
    const tableBody = document.getElementById("event-list")?.querySelector("tbody");
    if (!searchBar || !tableBody) return;

    searchBar.addEventListener("input", function () {
        const filterText = searchBar.value.toLowerCase();

        Array.from(tableBody.rows).forEach(row => {
            const rowText = Array.from(row.cells).map(cell => cell.textContent.toLowerCase()).join(" ");
            row.style.display = rowText.includes(filterText) ? "" : "none";
        });
    });
}

// Load a single event's details by ID
function loadEventDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (!id) return;

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://f18r15nee0.execute-api.us-west-1.amazonaws.com/items/${id}`);
    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            const event = JSON.parse(xhr.response);

            document.getElementById("event-title").textContent = event.title;
            document.getElementById("event-date").textContent = event.date;
            document.getElementById("event-time").textContent = `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
            document.getElementById("event-location").textContent = event.location;
            document.getElementById("event-description").textContent = event.description;
        } else {
            alert("Failed to load event details. Please try again.");
        }
    });
    xhr.send();
}

// Delete an event by ID
function deleteEvent(id) {
    const messageEl = document.getElementById("message");

    const xhr = new XMLHttpRequest();
    xhr.open("DELETE", `https://f18r15nee0.execute-api.us-west-1.amazonaws.com/items/${id}`);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.addEventListener("load", function () {
        if (xhr.status === 200) {
            messageEl.textContent = "Event deleted successfully!";
            messageEl.style.color = "green";
            loadEvents();
        } else {
            messageEl.textContent = "Failed to delete event. Please try again.";
            messageEl.style.color = "red";
        }

        setTimeout(() => {
            messageEl.textContent = "";
        }, 3000);
    });

    xhr.send();
}

window.deleteEvent = deleteEvent;