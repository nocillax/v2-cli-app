const inquirer = require("inquirer");
const { promptAuth } = require("./auth");
const {
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
} = require("./tasks");

let tasks = [];
let currentUser = null;

// Display welcome header
const showWelcomeHeader = () => {
  console.clear();
  console.log("╔═══════════════════════════════════════╗");
  console.log("║            📋 TASK MANAGER            ║");
  console.log("║          Your Personal CLI Todo       ║");
  console.log("╚═══════════════════════════════════════╝");
  console.log(`\n👤 Welcome back, ${currentUser}!`);

  const taskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const pendingCount = taskCount - completedCount;

  console.log(
    `📊 Tasks: ${taskCount} total | ✅ ${completedCount} completed | ⏳ ${pendingCount} pending\n`
  );
};

const mainPrompt = {
  type: "list",
  name: "action",
  message: "What would you like to do?",
  choices: [
    new inquirer.Separator("── 📝 Task Management ──"),
    "➕ Add a new task",
    "📋 Show all tasks",
    "✅ Change task status",
    "✏️  Edit task title",
    "🗑️  Delete a task",
    new inquirer.Separator("── 🔍 View & Search ──"),
    "🔍 Search tasks by keyword",
    "📊 Show tasks by status",
    "📅 Show tasks by date",
    "🚨 Show overdue tasks",
    new inquirer.Separator("── 💾 Backup & History ──"),
    "💾 Create backup",
    "♻️  Restore from backup",
    "📁 Check backup status",
    new inquirer.Separator("── ⏪ Undo/Redo ──"),
    "↶  Undo last action",
    "↷  Redo last action",
    new inquirer.Separator("── 🚪 Exit ──"),
    "🚪 Exit application",
  ],
};

const main = async () => {
  showWelcomeHeader();
  const { action } = await inquirer.prompt(mainPrompt);

  switch (action) {
    case "➕ Add a new task":
      tasks = await addTask(tasks, currentUser);
      break;

    case "📋 Show all tasks":
      showTask(tasks);
      break;

    case "✅ Change task status":
      tasks = await doneTask(tasks, currentUser);
      break;

    case "🗑️  Delete a task":
      tasks = await deleteTask(tasks, currentUser);
      break;

    case "✏️  Edit task title":
      tasks = await editTask(tasks, currentUser);
      break;

    case "📊 Show tasks by status":
      await showTaskByStatus(tasks);
      break;

    case "📅 Show tasks by date":
      await showTaskByDate(tasks);
      break;

    case "🚨 Show overdue tasks":
      showOverdueTasks(tasks);
      break;

    case "🔍 Search tasks by keyword":
      await showTaskByKeyword(tasks);
      break;

    case "💾 Create backup":
      backupTasks(tasks, currentUser);
      break;

    case "♻️  Restore from backup":
      tasks = restoreBackup(currentUser);
      break;

    case "📁 Check backup status":
      checkBackup(currentUser);
      break;

    case "↶  Undo last action":
      const undoneState = undoLastAction(currentUser);
      if (undoneState) {
        tasks = undoneState;
      }
      break;

    case "↷  Redo last action":
      const redoneState = redoLastAction(currentUser);
      if (redoneState) {
        tasks = redoneState;
      }
      break;

    case "🚪 Exit application":
      console.log("\n👋 Thanks for using Task Manager! Goodbye!");
      process.exit(0);

    default:
      console.log("Invalid choice. Please try again.");
  }

  // Add a small pause and "Press any key to continue" before showing menu again
  console.log("\n" + "─".repeat(50));
  await inquirer.prompt({
    type: "input",
    name: "continue",
    message: "Press Enter to continue...",
  });

  main();
};

// Start the application
(async () => {
  console.log("\n🚀 Starting Task Manager...\n");
  currentUser = await promptAuth();
  tasks = loadTasksForUser(currentUser);
  initializeHistory(tasks);
  main();
})();
