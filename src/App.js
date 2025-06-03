import { useState, useEffect } from "react"; // ✅ this is fine
import "./App.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  const [filterBy, setFilterBy] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Save to localStorage on update
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Add new task
  function addTask() {
    const taskText = task.trim();
    const dueDate = document.getElementById("taskDate").value;
    const dueTime = document.getElementById("taskTime").value;
    const priority = document.getElementById("taskPriority").value;

    if (!taskText) return alert("Please enter a task");

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      dueDate,
      dueTime,
      priority,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
    setTask("");
    scheduleReminder(newTask);
  }

  // drag and drop
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newTasks = [...tasks];
    const [movedTask] = newTasks.splice(result.source.index, 1);
    newTasks.splice(result.destination.index, 0, movedTask);
    setTasks(newTasks);
  };

  // Reminder logic
  function scheduleReminder(task) {
    if (!task.dueDate || !task.dueTime) return;

    const now = new Date();
    const due = new Date(`${task.dueDate}T${task.dueTime}`);
    const diff = due.getTime() - now.getTime();

    if (diff > 0) {
      setTimeout(() => {
        showNotification(task.text);
      }, diff);
    }
  }

  function showNotification(taskText) {
    if (Notification.permission === "granted") {
      new Notification("📝 Task Reminder", {
        body: `⏰ "${taskText}" is due now!`,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("📝 Task Reminder", {
            body: `⏰ "${taskText}" is due now!`,
          });
        }
      });
    }
  }

  // Toggle complete
  const toggleTaskCompletion = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Delete
  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Start editing
  const startEditing = (id, currentText) => {
    setEditing(id);
    setEditText(currentText);
  };

  // Save edit
  const saveEditedTask = () => {
    setTasks(
      tasks.map((t) => (t.id === editing ? { ...t, text: editText } : t))
    );
    setEditing(null);
    setEditText("");
  };

  // Filter
  // Filter only (no sort)
  const filteredTasks = tasks.filter((t) => {
    const matchesFilter =
      filterBy === "completed"
        ? t.completed
        : filterBy === "pending"
        ? !t.completed
        : true;

    const matchesSearch = t.text
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort

  return (
    <div className="app">
      <div className="app-content">
        <h1>📝 ToDo App</h1>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        {/* Add Task */}
        <div className="add-task">
          <input
            type="text"
            id="taskInput"
            placeholder="Enter a task..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <div className="input-with-icon">
            <input type="date" id="taskDate" />
            <span className="icon">📅</span>
          </div>
          <div className="input-with-icon">
            <input type="time" id="taskTime" />
            <span className="icon">🕒</span>
          </div>

          <select id="taskPriority">
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>
          <button onClick={addTask}>Add Task</button>
        </div>

        {/* Filter and Sort */}
        <div className="filters">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Date</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Task List */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="taskList">
            {(provided) => (
              <ul
                className="task-list"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {filteredTasks.length === 0 ? (
                  <li className="empty-task">No tasks found.</li>
                ) : (
                  filteredTasks.map((t, index) => (
                    <Draggable
                      key={t.id}
                      draggableId={t.id.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`task-item ${
                            t.completed ? "completed" : ""
                          }`}
                        >
                          {editing === t.id ? (
                            <>
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                              />
                              <button onClick={saveEditedTask}>Save</button>
                              <button onClick={() => setEditing(null)}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{t.text}</span>
                              {t.dueDate && (
                                <div className="due-date">
                                  📅 {t.dueDate}{" "}
                                  {t.dueTime && <>🕒 {t.dueTime}</>}
                                </div>
                              )}
                              <span className={`priority ${t.priority}`}>
                                {t.priority ? t.priority.toUpperCase() : "LOW"}
                              </span>
                              <div className="btn-task-status">
                                <button
                                  onClick={() => toggleTaskCompletion(t.id)}
                                >
                                  {t.completed ? "Undo" : "Complete"}
                                </button>
                                <button
                                  onClick={() => startEditing(t.id, t.text)}
                                >
                                  Edit
                                </button>
                                <button onClick={() => deleteTask(t.id)}>
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>

        {/* Footer */}
        <footer>
          <p>{tasks.filter((t) => !t.completed).length} tasks pending</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
