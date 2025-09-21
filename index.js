const inquirer = require("inquirer");
const now = new Date();
const fs = require("fs");
const { find } = require("rxjs");

const currentDate =
  now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
const filepath = "./tasks.json";

let tasks = [];

try {
  const data = fs.readFileSync(filepath, "utf8");
  tasks = JSON.parse(data);
} catch (err) {
  console.error("Error reading file", err);
}

const getNextId = () => {
  if (tasks.length === 0) return 1;

  const maxId = tasks.reduce((max, task) => (task.id > max ? task.id : max), 0);
  newId = maxId + 1;

  return newId;
};

const saveTasks = () => {
  const jsonData = JSON.stringify(tasks, null, 2);
  try {
    fs.writeFileSync("tasks.json", jsonData, "utf8");
  } catch (err) {
    console.error("Error writing file", err);
  }
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
    choices: ["Incomplete", "Pending", "Complete"],
  });
  return status;
};

const addTask = async () => {
  const name = await getTaskName();
  const status = await getTaskStatus();
  const newId = getNextId();

  let task = {
    id: newId,
    name: name,
    status: status,
    timestamp: currentDate,
  };

  tasks.push(task);

  saveTasks();
};

const showTask = () => {
  tasks.forEach((task) => {
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
  });
};

const getTaskId = async () => {
  const { id } = await inquirer.prompt({
    type: "input",
    name: "id",
    message: "Enter task ID: ",
  });
  return parseInt(id, 10);
};

const doneTask = async () => {
  const id = await getTaskId();

  let task = findTaskId(id);
  if (!task) {
    console.log(`Error: Task with ID ${id} not found.`);
    return;
  }

  if (task && task.status !== "Complete") {
    task.status = "Complete";
    saveTasks();
    console.log(`Task with ID ${id} marked as Complete.`);
  } else if (task && task.status === "Complete") {
    console.log(`Task with ID ${id} is already marked as Complete.`);
  } else {
    console.log(`Error: Task with ID ${id} not found.`);
  }
};

const deleteTask = async () => {
  const id = await getTaskId();
  const initialLength = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  if (tasks.length < initialLength) {
    saveTasks();
    console.log(`Task with ID ${id} deleted.`);
  } else {
    console.log(`Error: Task with ID ${id} not found.`);
  }
};

const getNewTaskName = async () => {
  const { name } = await inquirer.prompt({
    type: "input",
    name: "name",
    message: "Enter new task name: ",
  });
  return name;
};

const findTaskId = (id) => {
  return tasks.some((task) => task.id === id);
};

const editTask = async () => {
  const id = await getTaskId();
  if (!findTaskId(id)) {
    console.log(`Error: Task with ID ${id} not found.`);
    return;
  }
  const newName = await getNewTaskName();

  const updatedTasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, name: newName };
    }
    return task;
  });

  tasks = updatedTasks;
  saveTasks();
  console.log(`Task with ID ${id} updated.`);
};

const showTaskByStatus = async () => {
  const status = await getTaskStatus();
  const filteredTasks = tasks.filter((task) => task.status === status);
  if (filteredTasks.length === 0) {
    console.log(`No tasks with status: ${status}`);
    return;
  }
  filteredTasks.forEach((task) => {
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
  });
};

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
    "0. Exit",
  ],
};

const main = async () => {
  const { action } = await inquirer.prompt(mainPrompt);

  switch (action) {
    case "1. Add a new task":
      await addTask();
      break;

    case "2. Show all tasks":
      showTask();
      break;

    case "3. Change a task's status":
      await doneTask();
      break;

    case "4. Delete a task":
      await deleteTask();
      break;

    case "5. Edit task title":
      await editTask();
      break;

    case "6. Show tasks by status":
      await showTaskByStatus();
      break;

    case "0. Exit":
      process.exit(0);
    default:
      console.log("Invalid choice. Please try again.");
  }
  main();
};
main();
