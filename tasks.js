const inquirer = require("inquirer");
const fs = require("fs");

const ensureDataDir = () => {
  const dataDir = "./data";
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
};

const ensureBackupDir = () => {
  ensureDataDir();
  const backupDir = "./data/backups";
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
};

const getTaskFilePath = (username) => {
  ensureDataDir();
  return `./data/tasks-${username}.json`;
};

const loadTasksForUser = (username) => {
  const fp = getTaskFilePath(username);
  try {
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, JSON.stringify([], null, 2), "utf8");
    }
    const data = fs.readFileSync(fp, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading tasks file", err);
    return [];
  }
};

// Undo/Redo History Management
const taskHistory = {
  states: [],
  currentIndex: -1,
  maxHistory: 5,
  lastAction: "",
};

// Deep clone tasks array to avoid reference issues
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

// Undo last action
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
  const fp = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(fp, JSON.stringify(tasksToRestore, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file during undo", err);
  }

  console.log(`↶ Undone: ${currentState.action}`);
  return cloneTasks(tasksToRestore);
};

// Redo last undone action
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
  const fp = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(fp, JSON.stringify(tasksToRestore, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file during redo", err);
  }

  console.log(`↷ Redone: ${stateToRedo.action}`);
  return cloneTasks(tasksToRestore);
};

// Initialize history with current tasks (call after loading)
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

const saveTasks = (tasks, currentUser) => {
  if (!currentUser) {
    console.error("No user selected. Tasks not saved.");
    return;
  }
  const fp = getTaskFilePath(currentUser);
  try {
    fs.writeFileSync(fp, JSON.stringify(tasks, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing tasks file", err);
  }
};

const getNextId = (tasks) => {
  if (tasks.length === 0) return 1;
  const maxId = tasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
  const newId = maxId + 1;
  return newId;
};

const findTaskId = (tasks, id) => {
  return tasks.find((task) => task.id === id);
};

const getTaskName = async () => {
  const { name } = await inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter task name: ",
  });
  return name;
};

const getTaskStatus = async () => {
  const { status } = await inquirer.prompt({
    type: "list",
    name: "status",
    message: "Select task status: ",
    choices: ["Pending", "Completed"],
  });
  return status;
};

const getTaskId = async () => {
  const { id } = await inquirer.prompt({
    type: "input",
    name: "id",
    message: "Enter task ID: ",
  });
  return parseInt(id, 10);
};

const getNewTaskName = async () => {
  const { name } = await inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter new task name: ",
  });
  return name;
};

const getSearchKeyword = async () => {
  const { keyword } = await inquirer.prompt({
    type: "input",
    name: "keyword",
    message: "Enter a keyword to search for:",
    validate: (input) => input.trim() !== "" || "Please enter a keyword.",
  });
  return keyword;
};

const addTask = async (tasks, currentUser) => {
  const name = await getTaskName();
  const newId = getNextId(tasks);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}`;

  let task = {
    id: newId,
    name: name,
    status: "Pending",
    timestamp: timestamp,
  };

  // Create new tasks array with added task
  const newTasks = [...tasks, task];

  // Save both before and after states for undo/redo
  saveState(tasks, newTasks, `Add task "${name}"`);

  // Save the new state to file
  saveTasks(newTasks, currentUser);

  return newTasks;
};

const getColoredTasks = (task) => {
  const paddedId = task.id.toString().padStart(3);

  let taskName = task.name;
  if (taskName.length > 40) {
    taskName = taskName.substring(0, 37) + "...";
  }
  taskName = taskName.padEnd(40);

  const paddedStatus = task.status.padEnd(9);

  const line = `[${paddedId}] ${taskName} (${paddedStatus}) created: ${task.timestamp}`;

  if (task.status === "Completed") {
    return "\x1b[32m" + line + "\x1b[0m";
  } else {
    return "\x1b[31m" + line + "\x1b[0m";
  }
};

const showTask = (tasks) => {
  tasks.forEach((task) => {
    console.log(getColoredTasks(task));
  });
};

const showTaskByDate = (tasks) => {
  tasks.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  tasks.forEach((task) => {
    console.log(getColoredTasks(task));
  });
};

const doneTask = async (tasks, currentUser) => {
  const id = await getTaskId();

  let task = findTaskId(tasks, id);
  if (!task) {
    console.log(`Error: Task with ID ${id} not found.`);
    return tasks;
  }

  // Determine what the new status will be
  const newStatus = task.status === "Completed" ? "Pending" : "Completed";

  // Create new tasks array with updated task
  const newTasks = tasks.map((t) =>
    t.id === id ? { ...t, status: newStatus } : t
  );

  // Save both before and after states for undo/redo
  saveState(tasks, newTasks, `Mark task "${task.name}" as ${newStatus}`);

  // Save to file
  saveTasks(newTasks, currentUser);

  if (newStatus === "Completed") {
    console.log(`Task with ID ${id} marked as Completed.`);
  } else {
    console.log(`Task with ID ${id} marked as Pending.`);
  }

  return newTasks;
};

const deleteTask = async (tasks, currentUser) => {
  const id = await getTaskId();
  const taskToDelete = findTaskId(tasks, id);

  if (!taskToDelete) {
    console.log(`Error: Task with ID ${id} not found.`);
    return tasks;
  }

  // Create new tasks array without the deleted task
  const newTasks = tasks.filter((t) => t.id !== id);

  // Save both before and after states for undo/redo
  saveState(tasks, newTasks, `Delete task "${taskToDelete.name}"`);

  saveTasks(newTasks, currentUser);
  console.log(`Task with ID ${id} deleted.`);

  return newTasks;
};

const editTask = async (tasks, currentUser) => {
  const id = await getTaskId();
  const taskToEdit = findTaskId(tasks, id);
  if (!taskToEdit) {
    console.log(`Error: Task with ID ${id} not found.`);
    return tasks;
  }

  const oldName = taskToEdit.name;
  const newName = await getNewTaskName();

  // Create new tasks array with updated task
  const updatedTasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, name: newName };
    }
    return task;
  });

  // Save both before and after states for undo/redo
  saveState(tasks, updatedTasks, `Edit task "${oldName}" to "${newName}"`);

  saveTasks(updatedTasks, currentUser);
  console.log(`Task with ID ${id} updated.`);
  return updatedTasks;
};

const showTaskByStatus = async (tasks) => {
  const status = await getTaskStatus();
  const filteredTasks = tasks.filter((task) => task.status === status);
  if (filteredTasks.length === 0) {
    console.log(`No tasks with status: ${status}`);
    return;
  }
  filteredTasks.forEach((task) => {
    console.log(getColoredTasks(task));
  });
};

const showTaskByKeyword = async (tasks) => {
  const keyword = await getSearchKeyword();
  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(keyword.toLowerCase())
  );
  if (filteredTasks.length === 0) {
    console.log(`No tasks found with keyword: ${keyword}`);
    return;
  }
  filteredTasks.forEach((task) => {
    console.log(getColoredTasks(task));
  });
};

const backupTasks = (tasks, currentUser) => {
  if (!currentUser) {
    console.error("No user selected. Backup failed.");
    return false;
  }

  ensureBackupDir();
  const backupPath = `./data/backups/tasks-${currentUser}-backup.json`;

  try {
    fs.writeFileSync(backupPath, JSON.stringify(tasks, null, 2), "utf8");
    console.log(`✅ Backup created successfully!`);
    return true;
  } catch (err) {
    console.error("Error creating backup:", err);
    return false;
  }
};

const restoreBackup = (currentUser) => {
  if (!currentUser) {
    console.error("No user selected. Restore failed.");
    return [];
  }

  const backupPath = `./data/backups/tasks-${currentUser}-backup.json`;

  if (!fs.existsSync(backupPath)) {
    console.log("❌ No backup found for this user.");
    return [];
  }

  try {
    const data = fs.readFileSync(backupPath, "utf8");
    const backupTasks = JSON.parse(data);

    // Get current tasks before restoring
    const currentTasks = loadTasksForUser(currentUser);

    // Save both before and after states for undo/redo
    saveState(currentTasks, backupTasks, "Restore from backup");

    // Overwrite current tasks file with backup
    const fp = getTaskFilePath(currentUser);
    fs.writeFileSync(fp, JSON.stringify(backupTasks, null, 2), "utf8");

    console.log(`✅ Tasks restored from backup successfully!`);
    return backupTasks;
  } catch (err) {
    console.error("Error restoring backup:", err);
    return [];
  }
};

const checkBackup = (currentUser) => {
  if (!currentUser) {
    console.log("No user selected.");
    return;
  }

  const backupPath = `./data/backups/tasks-${currentUser}-backup.json`;

  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    console.log(`📁 Backup exists for user '${currentUser}'`);
    console.log(`📅 Last modified: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log(`❌ No backup found for user '${currentUser}'`);
  }
};

module.exports = {
  loadTasksForUser,
  addTask,
  showTask,
  showTaskByDate,
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
