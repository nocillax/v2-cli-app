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
    "3. Change a task's status",
    "4. Delete a task",
    "5. Edit task title",
    "6. Show tasks by status",
    "7. Show tasks by date",
    "8. Search tasks by keyword",
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

    case "3. Change a task's status":
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
  main();
})();
