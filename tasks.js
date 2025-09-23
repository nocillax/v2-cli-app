const inquirer = require("inquirer");
const fs = require("fs");

const ensureDataDir = () => {
  const dataDirectory = "./data";
  if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory);
};

const ensureBackupDir = () => {
  ensureDataDir();
  const backupDirectory = "./data/backups";
  if (!fs.existsSync(backupDirectory)) fs.mkdirSync(backupDirectory);
};

const getTaskFilePath = (username) => {
  ensureDataDir();
  return `./data/tasks-${username}.json`;
};

const loadTasksForUser = (username) => {
  const filePath = getTaskFilePath(username);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
    }
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData);
  } catch (err) {
    console.error("Error reading tasks file", err);
    return [];
  }
};

// Manages undo/redo history for tasks
const taskHistory = {
  states: [],
  currentIndex: -1,
  maxHistory: 5,
  lastAction: "",
};

// Creates deep copy of tasks array
const cloneTasks = (tasks) => {
  return JSON.parse(JSON.stringify(tasks));
};

// Save current state before making changes
const saveState = (beforeTasks, afterTasks, actionDescription) => {
  // Remove any states after current index (when new action after undo)
  taskHistory.states = taskHistory.states.slice(
    0,
    taskHistory.currentIndex + 1
  );

  // Add new state with both before and after
  taskHistory.states.push({
    beforeTasks: cloneTasks(beforeTasks),
    afterTasks: cloneTasks(afterTasks),
    action: actionDescription,
    timestamp: new Date().toLocaleTimeString(),
  });

  // Keep only last maxHistory states
  if (taskHistory.states.length > taskHistory.maxHistory) {
    taskHistory.states.shift();
  } else {
    taskHistory.currentIndex++;
  }

  // Ensure currentIndex is never greater than states length - 1
  taskHistory.currentIndex = Math.min(
    taskHistory.currentIndex,
    taskHistory.states.length - 1
  );
};

// Undoes the last action
const undoLastAction = (currentUser) => {
  if (taskHistory.currentIndex <= 0) {
    console.log("❌ Nothing to undo.");
    return null;
  }

  const currentState = taskHistory.states[taskHistory.currentIndex];
  taskHistory.currentIndex--;

  // Use beforeTasks to restore the previous state
  const tasksToRestore = currentState.beforeTasks;

  // Save restored state to file WITHOUT adding to history
  const filePath = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(filePath, JSON.stringify(tasksToRestore, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file during undo", err);
  }

  console.log(`↶ Undone: ${currentState.action}`);
  return cloneTasks(tasksToRestore);
};

// Redoes the last undone action
const redoLastAction = (currentUser) => {
  if (taskHistory.currentIndex >= taskHistory.states.length - 1) {
    console.log("❌ Nothing to redo.");
    return null;
  }

  taskHistory.currentIndex++;
  const stateToRedo = taskHistory.states[taskHistory.currentIndex];

  // Use afterTasks to restore the action result
  const tasksToRestore = stateToRedo.afterTasks;

  // Save restored state to file WITHOUT adding to history
  const filePath = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(filePath, JSON.stringify(tasksToRestore, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file during redo", err);
  }

  console.log(`↷ Redone: ${stateToRedo.action}`);
  return cloneTasks(tasksToRestore);
};

// Sets up initial undo/redo history
const initializeHistory = (tasks) => {
  taskHistory.states = [
    {
      beforeTasks: cloneTasks(tasks),
      afterTasks: cloneTasks(tasks),
      action: "Initial state",
      timestamp: new Date().toLocaleTimeString(),
    },
  ];
  taskHistory.currentIndex = 0;
};

// Saves tasks to user's file
const saveTasks = (tasks, currentUser) => {
  if (!currentUser) {
    console.error("No user selected. Tasks not saved.");
    return;
  }
  const filePath = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file", err);
  }
};

const getNextId = (tasks) => {
  if (tasks.length === 0) return 1;
  const maxId = tasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
  const nextId = maxId + 1;
  return nextId;
};

const findTaskId = (tasks, id) => {
  return tasks.find((task) => task.id === id);
};

// Gets task name from user
const getTaskName = async () => {
  const { taskName } = await inquirer.prompt({
    type: "input",
    name: "taskName",
    message: "✏️  Task name:",
    validate: (input) => {
      if (input.trim() === "") {
        return "❌ Task name cannot be empty!";
      }
      if (input.length > 100) {
        return "❌ Task name too long! Maximum 100 characters.";
      }
      return true;
    },
  });
  return taskName.trim();
};

// Gets optional due date from user
const getTaskDueDate = async () => {
  const { hasDueDate } = await inquirer.prompt({
    type: "confirm",
    name: "hasDueDate",
    message: "📅 Does this task have a due date?",
    default: false,
  });

  if (!hasDueDate) {
    return null;
  }

  const { dueDateInput } = await inquirer.prompt({
    type: "input",
    name: "dueDateInput",
    message: "📅 Enter due date (YYYY-MM-DD or 'today', 'tomorrow'):",
    validate: (input) => {
      if (!input.trim()) {
        return "❌ Please enter a date or press Ctrl+C to cancel!";
      }

      const parsedDate = parseDueDate(input.trim());
      if (!parsedDate) {
        return "❌ Invalid date format! Use YYYY-MM-DD, 'today', or 'tomorrow'";
      }

      return true;
    },
  });

  return parseDueDate(dueDateInput.trim());
};

const parseDueDate = (input) => {
  const today = new Date();

  if (input.toLowerCase() === "today") {
    return formatDate(today);
  }

  if (input.toLowerCase() === "tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Try to parse YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(input)) {
    const parsedDate = new Date(input + "T00:00:00");
    if (!isNaN(parsedDate.getTime())) {
      return input;
    }
  }

  return null;
};

const formatDate = (date) => {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
};

const formatTimestampForDisplay = (timestamp) => {
  const date = new Date(timestamp);
  const dateStr = formatDate(date);
  const timeStr =
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0");
  return `${dateStr} ${timeStr}`;
};

// Checks if task is overdue
const isTaskOverdue = (task) => {
  if (!task.dueDate) return false;

  const today = new Date();
  const dueDate = new Date(task.dueDate + "T00:00:00");

  return dueDate < today && task.status !== "Completed";
};

// Gets task status for filtering
const getTaskStatus = async () => {
  const { selectedStatus } = await inquirer.prompt({
    type: "list",
    name: "selectedStatus",
    message: "📊 Filter by status:",
    choices: ["⏳ Pending", "✅ Completed"],
  });
  // Return the actual status without emoji
  return selectedStatus.includes("Pending") ? "Pending" : "Completed";
};

const getTaskId = async () => {
  const { taskId } = await inquirer.prompt({
    type: "input",
    name: "taskId",
    message: "🔢 Enter task ID:",
    validate: (input) => {
      const parsedNumber = parseInt(input, 10);
      if (isNaN(parsedNumber) || parsedNumber <= 0) {
        return "❌ Please enter a valid task ID (positive number)!";
      }
      return true;
    },
  });
  return parseInt(taskId, 10);
};

// select a task interactively from a list
const selectTaskInteractively = async (tasks, actionType) => {
  if (tasks.length === 0) {
    return null;
  }

  const taskChoices = tasks.map((task) => {
    const statusIcon = task.status === "Completed" ? "✅" : "⏳";
    const isOverdue = isTaskOverdue(task);

    const truncatedName =
      task.name.length > 45 ? task.name.substring(0, 42) + "..." : task.name;
    const dueDateText = task.dueDate ? ` (Due: ${task.dueDate})` : "";

    // Create colored task display
    const taskDisplay = `${statusIcon} [${task.id
      .toString()
      .padStart(3, "0")}] ${truncatedName}${dueDateText}`;

    let coloredTaskDisplay;

    if (isOverdue) {
      coloredTaskDisplay = "\x1b[91m" + taskDisplay + "\x1b[0m"; // Bright red for overdue
    } else if (task.status === "Completed") {
      coloredTaskDisplay = "\x1b[32m" + taskDisplay + "\x1b[0m"; // Green for completed
    } else {
      coloredTaskDisplay = "\x1b[33m" + taskDisplay + "\x1b[0m"; // Yellow for pending
    }

    return {
      name: coloredTaskDisplay,
      value: task.id,
      short: `Task ${task.id}`,
    };
  });

  // Add option to enter ID manually
  taskChoices.push(new inquirer.Separator());
  taskChoices.push({
    name: "🔢 Enter task ID manually",
    value: "manual",
    short: "Manual ID",
  });

  const { selectedTaskId } = await inquirer.prompt({
    type: "list",
    name: "selectedTaskId",
    message: `🔍 Select task to ${actionType}:`,
    choices: taskChoices,
    pageSize: Math.min(10, taskChoices.length),
  });

  if (selectedTaskId === "manual") {
    return await getTaskId();
  }

  return selectedTaskId;
};

// Gets new task name for editing
const getNewTaskName = async () => {
  const { newTaskName } = await inquirer.prompt({
    type: "input",
    name: "newTaskName",
    message: "✏️  New task name:",
    validate: (input) => {
      if (input.trim() === "") {
        return "❌ Task name cannot be empty!";
      }
      if (input.length > 100) {
        return "❌ Task name too long! Maximum 100 characters.";
      }
      return true;
    },
  });
  return newTaskName.trim();
};

// Gets search keyword from user
const getSearchKeyword = async () => {
  const { searchKeyword } = await inquirer.prompt({
    type: "input",
    name: "searchKeyword",
    message: "🔍 Search keyword:",
    validate: (input) =>
      input.trim() !== "" || "❌ Please enter a search keyword.",
  });
  return searchKeyword.trim();
};

// Format task with padding
const formatTaskForDisplay = (task) => {
  const taskId = task.id.toString().padStart(3, "0");

  let taskName = task.name;
  if (taskName.length > 45) {
    taskName = taskName.substring(0, 42) + "...";
  }
  taskName = taskName.padEnd(45);

  const statusIcon = task.status === "Completed" ? "✅" : "⏳";
  const statusText = task.status.padEnd(9);

  // Due date formatting
  const dueDateText = task.dueDate ? task.dueDate : "No due date";
  const formattedDueDate = dueDateText.padEnd(12);

  // Format creation timestamp for display
  const displayTimestamp = formatTimestampForDisplay(task.timestamp);

  // Check if overdue
  const isOverdue = isTaskOverdue(task);

  const taskLine = `│ ${taskId} │ ${taskName} │ ${statusIcon} ${statusText} │ ${formattedDueDate} │ 📅 ${displayTimestamp} │`; // Color coding: red for overdue, green for completed, yellow for pending
  if (isOverdue) {
    return "\x1b[91m" + taskLine + "\x1b[0m"; // Bright red for overdue
  } else if (task.status === "Completed") {
    return "\x1b[32m" + taskLine + "\x1b[0m"; // Green for completed
  } else {
    return "\x1b[33m" + taskLine + "\x1b[0m"; // Yellow for pending
  }
};

// Displays tasks in a formatted table
const displayTasksTable = (tasks, headerTitle = "Your Tasks") => {
  if (tasks.length === 0) {
    console.log(`\n📭 No tasks found! Add your first task to get started.\n`);
    return;
  }

  console.log(`\n📋 ${headerTitle}:`);
  console.log(
    "┌─────┬───────────────────────────────────────────────┬──────────────┬──────────────┬─────────────────────┐"
  );
  console.log(
    "│ ID  │ Task Name                                     │ Status       │ Due Date     │ Created             │"
  );
  console.log(
    "├─────┼───────────────────────────────────────────────┼──────────────┼──────────────┼─────────────────────┤"
  );

  tasks.forEach((task) => {
    console.log(formatTaskForDisplay(task));
  });

  console.log(
    "└─────┴───────────────────────────────────────────────┴──────────────┴──────────────┴─────────────────────┘"
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;

  console.log(
    `\n📊 Total: ${totalTasks} tasks | ✅ ${completedTasks} completed | 🚨 ${overdueTasks} overdue`
  );
};

//
const addTask = async (tasks, currentUser) => {
  console.log("\n➕ Adding new task...");
  const taskName = await getTaskName();
  const dueDate = await getTaskDueDate();
  const newTaskId = getNextId(tasks);

  const currentDate = new Date();
  // Store full ISO timestamp for accurate sorting
  const creationTimestamp = currentDate.toISOString();

  let newTask = {
    id: newTaskId,
    name: taskName,
    status: "Pending",
    timestamp: creationTimestamp,
    dueDate: dueDate,
  };

  // Create new tasks array with added task
  const updatedTasks = [...tasks, newTask];

  // Save both before and after states for undo/redo
  saveState(tasks, updatedTasks, `Add task "${taskName}"`);

  // Save the new state to file
  saveTasks(updatedTasks, currentUser);

  const dueDateInfo = dueDate ? ` (Due: ${dueDate})` : " (No due date)";
  console.log(
    `✅ Task "${taskName}" added successfully! (ID: ${newTaskId})${dueDateInfo}`
  );
  return updatedTasks;
};

// Displays all tasks in a formatted table
const showTask = (tasks) => {
  displayTasksTable(tasks, "Your Tasks");
};

// Displays only overdue tasks
const showOverdueTasks = (tasks) => {
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task));

  if (overdueTasks.length === 0) {
    console.log("\n🎉 No overdue tasks! You're all caught up!");
    return;
  }

  displayTasksTable(overdueTasks, "🚨 Overdue Tasks");
  console.log("\n⚠️  These tasks need your attention!");
};

// Displays tasks sorted by date
const showTaskByDate = async (tasks) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks found!\n");
    return;
  }

  const { sortOrder } = await inquirer.prompt({
    type: "list",
    name: "sortOrder",
    message: "📅 Choose sort order:",
    choices: ["📈 Newest first (descending)", "📉 Oldest first (ascending)"],
  });

  const isDescending = sortOrder.includes("Newest");

  const sortedTasks = [...tasks].sort((a, b) => {
    // Convert timestamps to Date objects for proper chronological sorting
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);

    if (isDescending) {
      return dateB.getTime() - dateA.getTime(); // Newest first
    } else {
      return dateA.getTime() - dateB.getTime(); // Oldest first
    }
  });

  const headerTitle = isDescending
    ? "Tasks sorted by date (newest first)"
    : "Tasks sorted by date (oldest first)";

  displayTasksTable(sortedTasks, headerTitle);
};

// Marks a selected task as Completed or Pending
const doneTask = async (tasks, currentUser) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks available to update!");
    return tasks;
  }

  console.log("\n✅ Mark task as completed/pending...");

  const taskId = await selectTaskInteractively(
    tasks,
    "mark as completed/pending"
  );
  if (!taskId) return tasks;

  let selectedTask = findTaskId(tasks, taskId);
  if (!selectedTask) {
    console.log(`❌ Task with ID ${taskId} not found.`);
    return tasks;
  }

  // Determine what the new status will be
  const newStatus =
    selectedTask.status === "Completed" ? "Pending" : "Completed";

  // Create new tasks array with updated task
  const updatedTasks = tasks.map((task) =>
    task.id === taskId ? { ...task, status: newStatus } : task
  );

  // Save both before and after states for undo/redo
  saveState(
    tasks,
    updatedTasks,
    `Mark task "${selectedTask.name}" as ${newStatus}`
  );

  // Save to file
  saveTasks(updatedTasks, currentUser);

  const statusIcon = newStatus === "Completed" ? "✅" : "⏳";
  console.log(
    `${statusIcon} Task "${selectedTask.name}" marked as ${newStatus}!`
  );

  return updatedTasks;
};

// Deletes a task from the list
const deleteTask = async (tasks, currentUser) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks available to delete!");
    return tasks;
  }

  console.log("\n🗑️  Delete task...");

  const taskId = selectTaskInteractively(tasks, "delete");
  if (!taskId) return tasks;

  const taskToDelete = findTaskId(tasks, taskId);

  if (!taskToDelete) {
    console.log(`❌ Task with ID ${taskId} not found.`);
    return tasks;
  }

  // Create new tasks array without the deleted task
  const updatedTasks = tasks.filter((task) => task.id !== taskId);

  // Save both before and after states for undo/redo
  saveState(tasks, updatedTasks, `Delete task "${taskToDelete.name}"`);

  saveTasks(updatedTasks, currentUser);
  console.log(`🗑️  Task "${taskToDelete.name}" deleted successfully!`);

  return updatedTasks;
};

/**
 * Allows user to edit the name of an existing task
 * Provides interactive task selection and name modification
 * @param {Array} tasks - Current array of tasks
 * @param {string} currentUser - Username for file saving
 * @returns {Array} Updated array of tasks with edited task name
 */
const editTask = async (tasks, currentUser) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks available to edit!");
    return tasks;
  }

  console.log("\n✏️  Edit task...");

  const taskId = await selectTaskInteractively(tasks, "edit");
  if (!taskId) return tasks;

  const taskToEdit = findTaskId(tasks, taskId);
  if (!taskToEdit) {
    console.log(`❌ Task with ID ${taskId} not found.`);
    return tasks;
  }

  console.log(`📝 Current name: "${taskToEdit.name}"`);
  const oldTaskName = taskToEdit.name;
  const newTaskName = await getNewTaskName();

  // Create new tasks array with updated task
  const updatedTasks = tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, name: newTaskName };
    }
    return task;
  });

  // Save both before and after states for undo/redo
  saveState(
    tasks,
    updatedTasks,
    `Edit task "${oldTaskName}" to "${newTaskName}"`
  );

  saveTasks(updatedTasks, currentUser);
  console.log(`✅ Task updated successfully!`);
  console.log(`   Old: "${oldTaskName}"`);
  console.log(`   New: "${newTaskName}"`);
  return updatedTasks;
};

// Displays tasks filtered by their status
const showTaskByStatus = async (tasks) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks available to filter!");
    return;
  }

  console.log("\n📊 Filter tasks by status...");
  const selectedStatus = await getTaskStatus();
  const filteredTasks = tasks.filter((task) => task.status === selectedStatus);

  if (filteredTasks.length === 0) {
    const statusIcon = selectedStatus === "Completed" ? "✅" : "⏳";
    console.log(
      `\n${statusIcon} No ${selectedStatus.toLowerCase()} tasks found!`
    );
    return;
  }

  const statusIcon = selectedStatus === "Completed" ? "✅" : "⏳";
  const headerTitle = `${statusIcon} ${selectedStatus} Tasks`;
  displayTasksTable(filteredTasks, headerTitle);
};

// Displays tasks matching a search keyword
const showTaskByKeyword = async (tasks) => {
  if (tasks.length === 0) {
    console.log("\n📭 No tasks available to search!");
    return;
  }

  console.log("\n🔍 Search tasks...");
  const searchKeyword = await getSearchKeyword();
  const matchingTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  if (matchingTasks.length === 0) {
    console.log(`\n❌ No tasks found containing "${searchKeyword}"`);
    return;
  }

  const headerTitle = `🔍 Search results for "${searchKeyword}"`;
  displayTasksTable(matchingTasks, headerTitle);
};

// Creates a backup of the current tasks to a separate file
const backupTasks = (tasks, currentUser) => {
  if (!currentUser) {
    console.error("❌ No user selected. Backup failed.");
    return false;
  }

  console.log("\n💾 Creating backup...");
  ensureBackupDir();
  const backupFilePath = `./data/backups/tasks-${currentUser}-backup.json`;

  try {
    fs.writeFileSync(backupFilePath, JSON.stringify(tasks, null, 2), "utf8");
    console.log(`✅ Backup created successfully!`);
    console.log(`📁 Location: ${backupFilePath}`);
    console.log(`📊 Backed up: ${tasks.length} tasks`);
    return true;
  } catch (err) {
    console.error("❌ Error creating backup:", err);
    return false;
  }
};

// Restores tasks from the backup file
const restoreBackup = (currentUser) => {
  if (!currentUser) {
    console.error("❌ No user selected. Restore failed.");
    return [];
  }

  const backupFilePath = `./data/backups/tasks-${currentUser}-backup.json`;

  if (!fs.existsSync(backupFilePath)) {
    console.log("❌ No backup found for this user.");
    return [];
  }

  try {
    const backupData = fs.readFileSync(backupFilePath, "utf8");
    const restoredTasks = JSON.parse(backupData);

    // Get current tasks before restoring
    const currentTasks = loadTasksForUser(currentUser);

    // Save both before and after states for undo/redo
    saveState(currentTasks, restoredTasks, "Restore from backup");

    // Overwrite current tasks file with backup
    const taskFilePath = getTaskFilePath(currentUser);
    fs.writeFileSync(
      taskFilePath,
      JSON.stringify(restoredTasks, null, 2),
      "utf8"
    );

    console.log(`✅ Tasks restored from backup successfully!`);
    console.log(`📊 Restored: ${restoredTasks.length} tasks`);
    return restoredTasks;
  } catch (err) {
    console.error("❌ Error restoring backup:", err);
    return [];
  }
};

// Checks if a backup exists and displays its details
const checkBackup = (currentUser) => {
  if (!currentUser) {
    console.log("❌ No user selected.");
    return;
  }

  const backupFilePath = `./data/backups/tasks-${currentUser}-backup.json`;

  if (fs.existsSync(backupFilePath)) {
    const fileStats = fs.statSync(backupFilePath);
    console.log(`\n📁 Backup exists for user '${currentUser}'`);
    console.log(`📍 Location: ${backupFilePath}`);
    console.log(`📅 Last modified: ${fileStats.mtime.toLocaleString()}`);
    console.log(`📏 File size: ${(fileStats.size / 1024).toFixed(2)} KB`);
  } else {
    console.log(`\n❌ No backup found for user '${currentUser}'`);
    console.log(`🔍 Expected location: ${backupFilePath}`);
  }
};

module.exports = {
  loadTasksForUser,
  addTask,
  showTask,
  showTaskByDate,
  showOverdueTasks,
  doneTask,
  deleteTask,
  editTask,
  showTaskByStatus,
  showTaskByKeyword,
  backupTasks,
  restoreBackup,
  checkBackup,
  initializeHistory,
  undoLastAction,
  redoLastAction,
};
