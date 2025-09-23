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
  // Show welcome screen
  console.clear();
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║                📋 TASK MANAGER                 ║");
  console.log("║          Your Personal CLI Todo List App       ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("\n🔐 Authentication Required\n");

  while (true) {
    const { choice } = await inquirer.prompt({
      type: "list",
      name: "choice",
      message: "Please choose an option:",
      choices: [
        "🔑 Login to existing account",
        "👤 Create new account",
        "🚪 Exit application",
      ],
    });

    if (choice === "🚪 Exit application") {
      console.log("\n👋 Goodbye!");
      process.exit(0);
    }

    const users = loadUsers();

    if (choice === "👤 Create new account") {
      console.log("\n📝 Creating new account...");
      const { username, password } = await inquirer.prompt([
        {
          type: "input",
          name: "username",
          message: "👤 Choose username (3-20 chars, letters/numbers only):",
          validate: (input) => {
            if (!input.trim()) {
              return "❌ Username cannot be empty!";
            }
            if (input.length < 3) {
              return "❌ Username must be at least 3 characters long!";
            }
            if (input.length > 20) {
              return "❌ Username cannot exceed 20 characters!";
            }
            if (!/^[a-zA-Z0-9]+$/.test(input)) {
              return "❌ Username can only contain letters and numbers!";
            }
            return true;
          },
        },
        {
          type: "password",
          name: "password",
          message: "🔒 Choose password (minimum 4 characters):",
          validate: (input) => {
            if (!input) {
              return "❌ Password cannot be empty!";
            }
            if (input.length < 4) {
              return "❌ Password must be at least 4 characters long!";
            }
            if (input.length > 50) {
              return "❌ Password cannot exceed 50 characters!";
            }
            return true;
          },
        },
      ]);

      if (users.find((u) => u.username === username)) {
        console.log(
          "❌ Username already exists. Please try a different name.\n"
        );
        continue;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      users.push({ username, passwordHash });
      saveUsers(users);
      console.log(`✅ Account created successfully! Welcome, ${username}!`);
      return username;
    }

    if (choice === "🔑 Login to existing account") {
      console.log("\n🔐 Please enter your credentials...");
      const { username, password } = await inquirer.prompt([
        {
          type: "input",
          name: "username",
          message: "👤 Username:",
          validate: (input) => {
            if (!input.trim()) {
              return "❌ Please enter your username!";
            }
            return true;
          },
        },
        {
          type: "password",
          name: "password",
          message: "🔒 Password:",
          validate: (input) => {
            if (!input) {
              return "❌ Please enter your password!";
            }
            return true;
          },
        },
      ]);

      const user = users.find((u) => u.username === username);
      if (!user) {
        console.log(
          "❌ User not found. Please check your username or create a new account.\n"
        );
        continue;
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        console.log("❌ Invalid password. Please try again.\n");
        continue;
      }

      console.log(`✅ Login successful! Welcome back, ${username}!`);
      return username;
    }
  }
};

module.exports = { promptAuth };
