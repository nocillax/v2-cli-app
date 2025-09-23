# 📋 Task Manager CLI App

A powerful command-line task management application built with Node.js. Manage your daily tasks, set due dates, track progress, and stay organized - all from your terminal!

## ✨ Features

### 📝 Task Management

- **Add Tasks** - Create new tasks with optional due dates
- **Change Status** - Toggle between Pending ⏳ and Completed ✅
- **Edit Tasks** - Modify task names anytime
- **Delete Tasks** - Remove tasks you no longer need

### 📅 Due Date Support

- Set due dates when creating tasks
- Flexible date input: `today`, `tomorrow`, or `YYYY-MM-DD`
- **Overdue Detection** - Tasks past their due date are highlighted in red 🚨
- View all overdue tasks at once

### 🔍 Smart Viewing & Search

- **Show All Tasks** - Beautiful table view with status indicators
- **Filter by Status** - View only Pending or Completed tasks
- **Sort by Date** - Ascending or descending chronological order
- **Search by Keyword** - Find tasks by name
- **Overdue Tasks** - Dedicated view for tasks that need attention

### 🎨 Visual Excellence

- **Color-coded tasks**: Yellow for pending, Green for completed, Red for overdue
- **Interactive selection** - Navigate with arrow keys, no need to remember IDs
- **Status icons** - Clear visual indicators (⏳ 🚨 ✅)
- **Professional tables** - Clean, organized display

### 💾 Backup & Recovery

- **Create Backups** - Save your tasks safely
- **Restore from Backup** - Recover previous task states
- **Check Backup Status** - View backup information

### ⏪ Undo/Redo System

- **Undo last action** - Reverse any mistake
- **Redo undone action** - Restore what you undid
- **5-level history** - Multiple undo/redo operations

### 👥 Multi-User Support

- **User Authentication** - Secure login system with input validation
- **Separate Task Lists** - Each user has their own tasks
- **Account Creation** - Easy signup process with username/password requirements

### ✅ Smart Input Validation

- **Real-time validation** - See requirements while you type
- **Username requirements** - 3-20 characters, letters/numbers only
- **Password security** - Minimum 4 characters for account protection
- **Task name validation** - 1-100 characters, prevents empty inputs
- **Task ID validation** - Only accepts positive whole numbers
- **Search validation** - 2-50 characters for meaningful searches
- **Date format validation** - Ensures proper YYYY-MM-DD format or keywords
- **Clear error messages** - Specific guidance when validation fails

## 🚀 Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/nocillax/v2-cli-app.git
cd v2-cli-app

# Install dependencies
npm install

# Run the application
node index.js
```

### Dependencies

```json
{
  "inquirer": "^9.0.0", // Interactive CLI prompts
  "bcryptjs": "^2.4.3" // Password hashing
}
```

## 🎮 How to Use

### First Time Setup

1. Run `node index.js`
2. Choose "Create new account" 👤
3. Enter your username (3-20 characters, letters/numbers only)
4. Create a password (minimum 4 characters)
5. You're ready to manage tasks!

### Input Requirements & Validation

The app includes smart validation to help you enter data correctly:

#### 🔐 Account Creation

```
👤 Choose username (3-20 chars, letters/numbers only): john123
🔒 Choose password (minimum 4 characters): ********
```

#### 📝 Task Management

```
✏️ Task name (1-100 characters, no empty spaces only): Buy groceries
🔢 Enter task ID (positive number only, e.g., 1, 2, 3...): 5
```

#### 🔍 Search & Dates

```
🔍 Search keyword (2-50 characters, no empty spaces only): grocery
📅 Enter due date (YYYY-MM-DD format, or 'today'/'tomorrow'): 2025-12-25
```

**Validation Features:**

- ✅ Real-time feedback as you type
- ❌ Clear error messages explaining what went wrong
- 💡 Format examples shown in prompts
- 🔄 Re-prompt until valid input is entered

### Main Menu Navigation

The app presents an organized menu with sections:

```
── 📝 Task Management ──
➕ Add a new task
📋 Show all tasks
🔄 Change task status
✏️  Edit task title
🗑️  Delete a task

── 🔍 View & Search ──
🔍 Search tasks by keyword
📊 Show tasks by status
📅 Show tasks by date
🚨 Show overdue tasks

── 💾 Backup & History ──
💾 Create backup
♻️  Restore from backup
📁 Check backup status

── ⏪ Undo/Redo ──
↶  Undo last action
↷  Redo last action
```

### Adding Tasks

1. Select "➕ Add a new task"
2. Enter task name
3. Choose if it has a due date
4. If yes, enter date (`today`, `tomorrow`, or `YYYY-MM-DD`)

### Interactive Task Selection

When changing status, deleting, or editing:

- See all tasks with colors and status icons
- Use arrow keys to navigate
- Press Enter to select
- Option to manually enter task ID

### Task Status Colors

- 🟡 **Yellow**: Pending tasks
- 🟢 **Green**: Completed tasks
- 🔴 **Red**: Overdue tasks (past due date)

### Due Date Examples

```
📅 Enter due date: today
📅 Enter due date: tomorrow
📅 Enter due date: 2025-12-25
📅 Enter due date: 2025-01-01
```

**Validation prevents common errors:**

- ❌ Invalid formats like `25-12-2025` or `Dec 25`
- ❌ Impossible dates like `2025-13-45`
- ❌ Empty or spaces-only input
- ✅ Accepts `today`, `tomorrow`, or proper `YYYY-MM-DD` format

## 📊 Example Usage

### Creating and Managing Tasks

```
📋 Your Tasks:
┌──────┬───────────────────────────────────────────────┬──────────────┬──────────────┬──────────────────────┐
│  ID  │ Task Name                                     │ Status       │ Due Date     │ Created              │
├──────┼───────────────────────────────────────────────┼──────────────┼──────────────┼──────────────────────┤
│  001 │ Buy groceries                                 │ ⏳ Pending   │ today        │ 📅 2025-09-22 14:30 │
│  002 │ Submit report                                 │ ⏳ Pending   │ 2025-09-21   │ 📅 2025-09-22 09:15 │
│  003 │ Call dentist                                  │ ✅ Completed │ No due date  │ 📅 2025-09-22 16:45 │
└──────┴───────────────────────────────────────────────┴──────────────┴──────────────┴──────────────────────┘

📊 Total: 3 tasks | ✅ 1 completed | 🚨 1 overdue
```

### Interactive Selection

```
🔍 Select task to change status:
❯ 🟡⏳ [001] Buy groceries
  🔴⏳ [002] Submit report (Due: 2025-09-21)
  🟢✅ [003] Call dentist
  ──────────────
  🔢 Enter task ID manually
```

## 📁 File Structure

```
v2-cli-app/
├── index.js          # Main application entry point
├── auth.js           # User authentication system
├── tasks.js          # Core task management logic
├── package.json      # Project dependencies
├── README.md         # This file
└── data/
    ├── users.json    # User accounts (encrypted passwords)
    ├── tasks-{user}.json  # Individual user task files
    └── backups/
        └── tasks-{user}-backup.json  # Backup files
```

## 🔧 Technical Details

### Data Storage

- **Users**: Stored in `data/users.json` with bcrypt-hashed passwords
- **Tasks**: Each user has `data/tasks-{username}.json`
- **Backups**: Saved in `data/backups/` directory
- **History**: 5-level undo/redo stored in memory

### Task Object Structure

```javascript
{
  id: 1,
  name: "Buy groceries",
  status: "Pending", // or "Completed"
  timestamp: "2025-09-22T14:30:15.123Z", // ISO format for accurate sorting
  dueDate: "2025-09-23" // YYYY-MM-DD format, null if no due date
}
```

### Authentication

- Secure password hashing with bcryptjs
- Session-based user management
- Individual task isolation per user

## 🎯 Use Cases

### Personal Productivity

- Daily task management
- Project milestone tracking
- Shopping lists and errands
- Deadline management

### Getting Help

1. **Check validation messages** - The app provides real-time feedback on input requirements
2. **Read error messages carefully** - They explain exactly what format is expected
3. **Check this README** for examples and usage patterns
4. **Verify all dependencies are installed** with `npm install`
5. **Make sure you're using Node.js v14+**
6. **Try creating a fresh user account** if login issues persist

### Common Validation Examples

**✅ Valid inputs:**

- Username: `john123`, `user1`, `myname`
- Password: `pass123`, `mypassword`
- Task name: `Buy groceries`, `Call mom`, `Finish report`
- Task ID: `1`, `25`, `100`
- Search: `grocery`, `work`, `call`
- Date: `today`, `tomorrow`, `2025-12-31`

**❌ Invalid inputs:**

- Username: `jo` (too short), `user-name` (special chars), `` (empty)
- Password: `abc` (too short), `` (empty)
- Task name: ``(empty),` ` (spaces only)
- Task ID: `0`, `-5`, `abc`, `1.5`
- Search: `a` (too short), `` (empty)
- Date: `25-12-2025`, `Dec 25`, `2025/12/25`

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 👨‍💻 Contributing

This is a learning project, but suggestions and improvements are welcome!

---

**Happy coding! 📋✨**

_nocillax_
