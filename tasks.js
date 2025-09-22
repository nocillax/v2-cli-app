const inquirer = require("inquirer");
const fs = require("fs");

const ensureDataDir = () => {
  const dataDir = "./data";
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
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
    choices: ["Incomplete", "Pending", "Complete"],
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
  const status = await getTaskStatus();
  const newId = getNextId(tasks);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${
    now.getMonth() + 1
  }-${now.getDate()}`;

  let task = {
    id: newId,
    name: name,
    status: status,
    timestamp: timestamp,
  };

  tasks.push(task);
  saveTasks(tasks, currentUser);
  return tasks;
};

const showTask = (tasks) => {
  tasks.forEach((task) => {
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
  });
};

const showTaskByDate = (tasks) => {
  tasks.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  tasks.forEach((task) => {
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
  });
};

const doneTask = async (tasks, currentUser) => {
  const id = await getTaskId();

  let task = findTaskId(tasks, id);
  if (!task) {
    console.log(`Error: Task with ID ${id} not found.`);
    return tasks;
  }

  if (task && task.status !== "Complete") {
    task.status = "Complete";
    saveTasks(tasks, currentUser);
    console.log(`Task with ID ${id} marked as Complete.`);
  } else if (task && task.status === "Complete") {
    console.log(`Task with ID ${id} is already marked as Complete.`);
  }
  return tasks;
};

const deleteTask = async (tasks, currentUser) => {
  const id = await getTaskId();
  const initialLength = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  if (tasks.length < initialLength) {
    saveTasks(tasks, currentUser);
    console.log(`Task with ID ${id} deleted.`);
  } else {
    console.log(`Error: Task with ID ${id} not found.`);
  }
  return tasks;
};

const editTask = async (tasks, currentUser) => {
  const id = await getTaskId();
  if (!findTaskId(tasks, id)) {
    console.log(`Error: Task with ID ${id} not found.`);
    return tasks;
  }
  const newName = await getNewTaskName();

  const updatedTasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, name: newName };
    }
    return task;
  });

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
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
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
    console.log(
      `[${task.id}] ${task.name} (${task.status}) created: ${task.timestamp}`
    );
  });
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
};
