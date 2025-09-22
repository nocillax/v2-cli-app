const inquirer = require("inquirer");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const ensureDataDir = () => {
  const dataDir = "./data";
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
};

const usersFile = "./data/users.json";

const saveUsers = (users) => {
  ensureDataDir();
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing users file", err);
  }
};

const loadUsers = () => {
  ensureDataDir();
  try {
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify([], null, 2), "utf8");
    }
    const data = fs.readFileSync(usersFile, "utf8");
    return JSON.parse(data) || [];
  } catch (err) {
    console.error("Error reading users file", err);
    return [];
  }
};

const promptAuth = async () => {
  while (true) {
    const { choice } = await inquirer.prompt({
      type: "list",
      name: "choice",
      message: "Select an option:",
      choices: ["Login", "Signup", "Exit"],
    });

    if (choice == "Exit") {
      process.exit(0);
    }

    const users = loadUsers();

    if (choice === "Signup") {
      const { username, password } = await inquirer.prompt([
        { type: "input", name: "username", message: "Choose username:" },
        { type: "password", name: "password", message: "Choose password:" },
      ]);
      if (users.find((u) => u.username === username)) {
        console.log("Username already exists. Try again.");
        continue;
      }
      const passwordHash = await bcrypt.hash(password, 10);
      users.push({ username, passwordHash });
      saveUsers(users);
      console.log(`User ${username} created and logged in.`);
      return username;
    }

    if (choice === "Login") {
      const { username, password } = await inquirer.prompt([
        { type: "input", name: "username", message: "Username:" },
        { type: "password", name: "password", message: "Password:" },
      ]);
      const user = users.find((u) => u.username === username);
      if (!user) {
        console.log("User not found.");
        continue;
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        console.log("Invalid password.");
        continue;
      }
      console.log(`Logged in as ${username}.`);
      return username;
    }
  }
};

module.exports = { promptAuth };
