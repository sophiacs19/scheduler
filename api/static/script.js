const datesContainer = document.getElementById("dates");
const monthYearHeader = document.getElementById("monthYear");
const overlaysContainer = document.getElementById("overlays");

let currentDate = new Date();
let tasksAndEvents = {};

function getIncompleteTasksFromPreviousMonth(currentDate) {
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0).getDate();

    let incompleteCount = 0;
    for (let day = 1; day <= daysInPreviousMonth; day++) {
        const dateString = `${previousMonth.getFullYear()}-${previousMonth.getMonth()}-${day}`;
        const tasks = (tasksAndEvents[dateString]?.tasks || []).filter(task => !task.completed);
        incompleteCount += tasks.length;
    }

    return incompleteCount;
}

async function getEvents() {
    const response = await fetch('/events/all');
    if (!response.ok) {
        throw new Error('Failed to fetch events');
    }

    const events = await response.json();
    console.log('events list here:', events);
    events.forEach(e => {
        const id = e[0];
        const dateKey = e[3];
        const text = e[1];
        const startTime = e[4];
        const endTime = e[5];
        const eventObj = { id, type: "event", text, startTime, endTime };
        tasksAndEvents[dateKey] = tasksAndEvents[dateKey] || { tasks: [], events: [] };
        tasksAndEvents[dateKey].events.push(eventObj);
    });    
    renderCalendar(currentDate);
}

async function deleteEvent(eventId) {
    const response = await fetch(`/events/${eventId}`, {
        method: 'DELETE'
    });
}

function renderCalendar(date) {

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    datesContainer.innerHTML = "";
    monthYearHeader.textContent = `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`;

    // Add empty blocks for alignment
    for (let i = 0; i < firstDay; i++) {
        datesContainer.appendChild(document.createElement("div"));
    }

    // Calculate incomplete tasks from the previous month
    const incompleteTasks = getIncompleteTasksFromPreviousMonth(date);

    // Render date blocks
    for (let day = 1; day <= daysInMonth; day++) {
        const dateDiv = document.createElement("div");
        dateDiv.className = "date-block";

        if (isToday(date.getFullYear(), date.getMonth(), day)) {
            dateDiv.classList.add("current-date");
        }

        const dateNumber = document.createElement("span");
        dateNumber.className = "date-number";
        dateNumber.textContent = day;

        dateDiv.appendChild(dateNumber);

        // Add incomplete tasks block for the first day
        if (day === 1 && incompleteTasks > 0) {
            const incompleteDiv = document.createElement("div");
            incompleteDiv.className = "incomplete-block";
            incompleteDiv.textContent = `${incompleteTasks} incomplete task(s) from last month`;
            dateDiv.appendChild(incompleteDiv);
        }

        const dateString = `${date.getFullYear()}-${date.getMonth()}-${day}`;
        const { tasks = [], events = [] } = tasksAndEvents[dateString] || {};
        const items = [...tasks, ...events];

        items.slice(0, 10).forEach((item) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = item.type === "task" ? "task-item" : "event-item";
        
            if (item.type === "task") {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                
                checkbox.checked = item.completed || false; // Update based on completion status
                checkbox.addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleTaskCompletion(item, checkbox);
                });
        
                itemDiv.appendChild(checkbox);
            }
        
            const text = document.createElement("span");
            text.textContent = item.text || item.description;
            itemDiv.appendChild(text);
        
            itemDiv.addEventListener("click", (e) => {
                e.stopPropagation();
                openEditItemOverlay(dateString, item);
            });
        
            dateDiv.appendChild(itemDiv);
        });

        if (items.length > 10) {
            const moreButton = document.createElement("button");
            moreButton.className = "more-button";
            moreButton.textContent = `+${items.length - 10} more`;
            moreButton.addEventListener("click", (e) => {
                e.stopPropagation();
                openAllItemsOverlay(date, day, items);
            });
            dateDiv.appendChild(moreButton);
        }

        dateDiv.addEventListener("click", (e) => {
            if (e.target === dateDiv) {
                openAddOverlay(date, day);
            }
        });

        datesContainer.appendChild(dateDiv);
    }
}



function toggleTaskCompletion(item, checkbox) {
    const textElement = checkbox.nextSibling;
    if (checkbox.checked) {
        textElement.style.textDecoration = "line-through";
    } else {
        textElement.style.textDecoration = "none";
    }
}

// Utility function to check if the date is today's date
function isToday(year, month, day) {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

function dragStart(event, itemDiv) {
    event.dataTransfer.setData("text", itemDiv.textContent);
    event.dataTransfer.setData("index", itemDiv.dataset.index);
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event, itemDiv) {
    event.preventDefault();
    const index = event.dataTransfer.getData("index");
    // Handle drop logic for rearranging tasks here
    console.log("Dropped item index:", index);
}

// Open overlay to add task or event
function openAddOverlay(date, day) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const closeButton = document.createElement("button");
    closeButton.className = "close-overlay";
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => overlay.remove());
    overlay.appendChild(closeButton);

    const title = document.createElement("h3");
    title.textContent = `Add Task or Event for ${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
    overlay.appendChild(title);

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const addTaskButton = document.createElement("button");
    addTaskButton.textContent = "Add Task";
    addTaskButton.addEventListener("click", () => showTaskInput(overlay, date, day));
    buttonGroup.appendChild(addTaskButton);

    const addEventButton = document.createElement("button");
    addEventButton.textContent = "Add Event";
    addEventButton.addEventListener("click", () => showEventInput(overlay, date, day));
    buttonGroup.appendChild(addEventButton);

    overlay.appendChild(buttonGroup);
    overlaysContainer.appendChild(overlay);
}

function showTaskInput(overlay, date, day) {
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${day}`;
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const input = document.createElement("input");
    input.placeholder = "Task description";
    inputGroup.appendChild(input);

    const addButton = document.createElement("button");
    addButton.textContent = "Add Task";
    addButton.addEventListener("click", () => {
        const text = input.value.trim();
        if (text) {
            tasksAndEvents[dateString] = tasksAndEvents[dateString] || { tasks: [], events: [] };
            tasksAndEvents[dateString].tasks.push({ type: "task", text });
            renderCalendar(currentDate);
            overlay.remove();
        }
    });

    inputGroup.appendChild(addButton);
    overlay.appendChild(inputGroup);
}

function showEventInput(overlay, date, day) {
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${day}`;
    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";

    const descriptionInput = document.createElement("input");
    descriptionInput.placeholder = "Event description";
    inputGroup.appendChild(descriptionInput);

    //<input type="time" id="appt" name="appt">
    const timePanel = document.createElement("div");
    timePanel.innerHTML = 'Start time: <input type="time" id="startTime"/> End time: <input type="time" id="endTime"/>';
    inputGroup.appendChild(timePanel);

    const addButton = document.createElement("button");
    addButton.textContent = "Add Event";
    addButton.addEventListener("click", () => {
        const text = descriptionInput.value.trim();
        // const time = timeInput.value.trim();
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;        
        if (text) {
            tasksAndEvents[dateString] = tasksAndEvents[dateString] || { tasks: [], events: [] };
            tasksAndEvents[dateString].events.push({ type: "event", text, startTime, endTime });
            renderCalendar(currentDate);
            overlay.remove();
        }
    });

    inputGroup.appendChild(addButton);
    overlay.appendChild(inputGroup);
}

function openAllItemsOverlay(date, day, items) {
    const dateString = `${date.getFullYear()}-${date.getMonth()}-${day}`;
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const closeButton = document.createElement("button");
    closeButton.className = "close-overlay";
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => overlay.remove());
    overlay.appendChild(closeButton);

    const title = document.createElement("h3");
    title.textContent = `All Items for ${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
    overlay.appendChild(title);

    items.forEach((item) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = item.type === "task" ? "task-item" : "event-item";
        itemDiv.textContent = item.text;

        if (item.type === "event" && item.time) {
            const timeDiv = document.createElement("div");
            timeDiv.className = "event-time";
            timeDiv.textContent = item.time;
            itemDiv.appendChild(timeDiv);
        }

        // Allow editing
        itemDiv.addEventListener("click", () => {
            openEditItemOverlay(dateString, item);
        });

        overlay.appendChild(itemDiv);
    });

    overlaysContainer.appendChild(overlay);
}

function openEditItemOverlay(dateString, item) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const closeButton = document.createElement("button");
    closeButton.className = "close-overlay";
    closeButton.textContent = "X";
    closeButton.addEventListener("click", () => overlay.remove());
    overlay.appendChild(closeButton);

    const title = document.createElement("h3");
    title.textContent = `Edit ${item.type === "task" ? "Task" : "Event"}`;
    overlay.appendChild(title);

    const input = document.createElement("input");
    input.value = item.text;
    overlay.appendChild(input);

    if (item.type === "event") {
        // const timeInput = document.createElement("input");
        // timeInput.placeholder = "HH:MM - HH:MM";
        // timeInput.value = item.time || "";
        // overlay.appendChild(timeInput);

        const timePanel = document.createElement("div");
        timePanel.innerHTML = `Start time: <input type="time" value="${item.startTime}" id="startTime"/> End time: <input type="time" value="${item.endTime}" id="endTime"/>`;
        overlay.appendChild(timePanel);

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", () => {
            item.text = input.value.trim();
            item.time = timeInput.value.trim();
            renderCalendar(currentDate);
            overlay.remove();
        });
        overlay.appendChild(saveButton);
    } else {
        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.addEventListener("click", () => {
            item.text = input.value.trim();
            renderCalendar(currentDate);
            overlay.remove();
        });
        overlay.appendChild(saveButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.background = "red";
    deleteButton.addEventListener("click", () => {
        const index = tasksAndEvents[dateString][item.type === "task" ? "tasks" : "events"].indexOf(item);
        tasksAndEvents[dateString][item.type === "task" ? "tasks" : "events"].splice(index, 1);
        renderCalendar(currentDate);
        overlay.remove();

        deleteEvent(item.id);
    });
    overlay.appendChild(deleteButton);

    overlaysContainer.appendChild(overlay);
}

// Navigation
document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
});

document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
});

// Initial Render
getEvents();    