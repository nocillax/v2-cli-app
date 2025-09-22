const inquirer = require("inquirer");
const { promptAuth } = require("./auth");
const {
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
} = require("./tasks");

let tasks = [];
let currentUser = null;

const mainPrompt = {
  type: "list",
  name: "action",
  message: "\nWhat would you like to do?",
  choices: [
    "1. Add a new task",
    "2. Show all tasks",
    "3. Mark a task Completed",
    "4. Delete a task",
    "5. Edit task title",
    "6. Show tasks by status",
    "7. Show tasks by date",
    "8. Search tasks by keyword",
    "9. Create backup",
    "10. Restore backup",
    "11. Check backup status",
    "12. Undo last action",
    "13. Redo last undone action",
    "0. Exit",
  ],
};

const main = async () => {
  const { action } = await inquirer.prompt(mainPrompt);

  switch (action) {
    case "1. Add a new task":
      tasks = await addTask(tasks, currentUser);
      break;

    case "2. Show all tasks":
      showTask(tasks);
      break;

    case "3. Mark a task Completed":
      tasks = await doneTask(tasks, currentUser);
      break;

    case "4. Delete a task":
      tasks = await deleteTask(tasks, currentUser);
      break;

    case "5. Edit task title":
      tasks = await editTask(tasks, currentUser);
      break;

    case "6. Show tasks by status":
      await showTaskByStatus(tasks);
      break;

    case "7. Show tasks by date":
      showTaskByDate(tasks);
      break;

    case "8. Search tasks by keyword":
      await showTaskByKeyword(tasks);
      break;

    case "9. Create backup":
      backupTasks(tasks, currentUser);
      break;

    case "10. Restore backup":
      tasks = restoreBackup(currentUser);
      break;

    case "11. Check backup status":
      checkBackup(currentUser);
      break;

    case "12. Undo last action":
      const undoneState = undoLastAction(currentUser);
      if (undoneState) {
        tasks = undoneState;
      }
      break;

    case "13. Redo last undone action":
      const redoneState = redoLastAction(currentUser);
      if (redoneState) {
        tasks = redoneState;
      }
      break;

    case "0. Exit":
      process.exit(0);
    default:
      console.log("Invalid choice. Please try again.");
  }
  main();
};

// Start the application
(async () => {
  currentUser = await promptAuth();
  tasks = loadTasksForUser(currentUser);
  initializeHistory(tasks);
  main();
})();
