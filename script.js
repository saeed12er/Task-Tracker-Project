
// ======================================
// 1. GET HTML ELEMENTS
// ======================================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const emptyMessage = document.getElementById("emptyMessage");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const pendingTasksElement = document.getElementById("pendingTasks");
const progressElement = document.getElementById("progress");
const progressBar = document.getElementById("progressBar");
const taskCountElement = document.getElementById("taskCount");

const themeToggle = document.getElementById("themeToggle");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");

const filterButtons = document.querySelectorAll(".filter-btn");


// ======================================
// 2. APPLICATION DATA
// ======================================

let tasks = [];

let currentFilter = "all";

let editingTaskId = null;

const priorityOrder = {
    high: 3,
    medium: 2,
    low: 1
};


// ======================================
// 3. LOAD DATA FROM LOCAL STORAGE
// ======================================

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("taskflowTasks");

        if (savedTasks) {
            const parsedTasks = JSON.parse(savedTasks);

            if (Array.isArray(parsedTasks)) {
                tasks = parsedTasks.filter(task =>
                    task &&
                    Number.isSafeInteger(task.id) &&
                    typeof task.name === "string" &&
                    typeof task.completed === "boolean" &&
                    ["low", "medium", "high"].includes(task.priority) &&
                    typeof task.dueDate === "string"
                );
            }
        }
    } catch (error) {
        console.error("Unable to load saved tasks:", error);
        tasks = [];
    }
}


// ======================================
// 4. SAVE DATA TO LOCAL STORAGE
// ======================================

function saveTasks() {
    try {
        localStorage.setItem("taskflowTasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Could not save tasks in this browser.");
    }
}


// ======================================
// 5. ADD OR UPDATE TASK
// ======================================

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const taskName = taskInput.value.trim();

    if (!taskName) {
        alert("Please enter a task!");
        return;
    }

    if (editingTaskId !== null) {

        const task = tasks.find(item => item.id === editingTaskId);

        if (task) {
            task.name = taskName;
            task.priority = priorityInput.value;
            task.dueDate = dueDateInput.value;
        }

    } else {

        const task = {
            id: Date.now(),
            name: taskName,
            priority: priorityInput.value,
            dueDate: dueDateInput.value,
            completed: false
        };

        tasks.push(task);
    }

    saveTasks();

    resetForm();

    renderTasks();

});


// ======================================
// 6. RESET TASK FORM
// ======================================

function resetForm() {

    taskForm.reset();

    editingTaskId = null;

    formTitle.textContent = "Add New Task";

    submitBtn.textContent = "+ Add Task";

    cancelEditBtn.hidden = true;
}


// ======================================
// 7. CANCEL EDITING
// ======================================

cancelEditBtn.addEventListener("click", function() {

    resetForm();

});


// ======================================
// 8. EDIT TASK
// ======================================

function editTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    editingTaskId = taskId;

    taskInput.value = task.name;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate;

    formTitle.textContent = "Edit Task";

    submitBtn.textContent = "Update Task";

    cancelEditBtn.hidden = false;

    taskInput.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ======================================
// 9. DELETE TASK
// ======================================

function deleteTask(taskId) {

    const confirmation = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmation) return;

    tasks = tasks.filter(task => task.id !== taskId);

    if (editingTaskId === taskId) {
        resetForm();
    }

    saveTasks();

    renderTasks();

}


// ======================================
// 10. COMPLETE OR UNDO TASK
// ======================================

function toggleTask(taskId) {

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    task.completed = !task.completed;

    saveTasks();

    renderTasks();

}


// ======================================
// 11. CHECK OVERDUE TASKS
// ======================================

function isOverdue(task) {

    if (!task.dueDate || task.completed) {
        return false;
    }

    const today = new Date();

    const localToday =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    return task.dueDate < localToday;

}


// ======================================
// 12. FORMAT DUE DATE
// ======================================

function formatDueDate(dateString) {

    if (!dateString) {
        return "No due date";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

}


// ======================================
// 13. RENDER TASKS
// ======================================

function renderTasks() {

    taskList.innerHTML = "";

    const searchText = searchInput.value.toLowerCase().trim();

    let filteredTasks = tasks.filter(function(task) {

        const matchesSearch =
            task.name.toLowerCase().includes(searchText);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "completed" && task.completed) ||
            (currentFilter === "pending" && !task.completed);

        return matchesSearch && matchesFilter;

    });


    // SORT TASKS

    const sortValue = sortSelect.value;

    filteredTasks.sort(function(a, b) {

        if (sortValue === "newest") {
            return b.id - a.id;
        }

        if (sortValue === "oldest") {
            return a.id - b.id;
        }

        if (sortValue === "priority") {
            return priorityOrder[b.priority] -
                   priorityOrder[a.priority];
        }

        if (sortValue === "dueDate") {

            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            return a.dueDate.localeCompare(b.dueDate);
        }

        return 0;

    });


    // CREATE TASK ELEMENTS

    filteredTasks.forEach(function(task) {

        const li = document.createElement("li");

        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        if (isOverdue(task)) {
            li.classList.add("overdue");
        }


        // TASK INFORMATION

        const info = document.createElement("div");

        info.className = "task-info";

        const heading = document.createElement("h3");

        heading.textContent = task.name;

        const details = document.createElement("p");

        details.textContent = "Due date: " + formatDueDate(task.dueDate);

        if (isOverdue(task)) {

            const overdueLabel = document.createElement("span");

            overdueLabel.className = "overdue-label";

            overdueLabel.textContent = "OVERDUE";

            details.appendChild(overdueLabel);

        }


        // PRIORITY BADGE

        const priority = document.createElement("span");

        priority.className = "priority " + task.priority;

        priority.textContent =
            task.priority.toUpperCase() + " PRIORITY";


        info.appendChild(heading);
        info.appendChild(details);
        info.appendChild(priority);


        // TASK ACTIONS

        const actions = document.createElement("div");

        actions.className = "task-actions";


        // COMPLETE BUTTON

        const completeButton = document.createElement("button");

        completeButton.className = "complete-btn";

        completeButton.textContent =
            task.completed ? "Undo" : "Complete";

        completeButton.addEventListener("click", function() {
            toggleTask(task.id);
        });


        // EDIT BUTTON

        const editButton = document.createElement("button");

        editButton.className = "edit-btn";

        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editTask(task.id);
        });


        // DELETE BUTTON

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";

        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteTask(task.id);
        });


        // ADD ELEMENTS

        actions.appendChild(completeButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        li.appendChild(info);
        li.appendChild(actions);

        taskList.appendChild(li);

    });


    // EMPTY MESSAGE

    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";


    // TASK COUNT

    taskCountElement.textContent =
        filteredTasks.length +
        (filteredTasks.length === 1 ? " task" : " tasks");


    // UPDATE DASHBOARD

    updateDashboard();

}


// ======================================
// 14. DASHBOARD STATISTICS
// ======================================

function updateDashboard() {

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(function(task) {
        return task.completed;
    }).length;

    const pendingTasks = totalTasks - completedTasks;


    let completionPercentage = 0;

    if (totalTasks > 0) {

        completionPercentage = Math.round(
            (completedTasks / totalTasks) * 100
        );

    }


    totalTasksElement.textContent = totalTasks;

    completedTasksElement.textContent = completedTasks;

    pendingTasksElement.textContent = pendingTasks;

    progressElement.textContent =
        completionPercentage + "%";

    progressBar.style.width =
        completionPercentage + "%";

}


// ======================================
// 15. SEARCH TASKS
// ======================================

searchInput.addEventListener("input", function() {

    renderTasks();

});


// ======================================
// 16. SORT TASKS
// ======================================

sortSelect.addEventListener("change", function() {

    renderTasks();

});


// ======================================
// 17. FILTER TASKS
// ======================================

filterButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        currentFilter = button.dataset.filter;

        filterButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        renderTasks();

    });

});


// ======================================
// 18. DARK AND LIGHT MODE
// ======================================

function applyTheme(theme) {

    document.body.classList.toggle("dark", theme === "dark");

    themeToggle.textContent =
        theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

}


function loadTheme() {

    const savedTheme = localStorage.getItem("taskflowTheme");

    applyTheme(savedTheme === "dark" ? "dark" : "light");

}


themeToggle.addEventListener("click", function() {

    const newTheme =
        document.body.classList.contains("dark") ? "light" : "dark";

    applyTheme(newTheme);

    localStorage.setItem("taskflowTheme", newTheme);

});


// ======================================
// 19. INITIALIZE APPLICATION
// ======================================

loadTasks();

loadTheme();

renderTasks();
