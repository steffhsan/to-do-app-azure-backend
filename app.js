require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./src/config/db.js");

pool
  .query("SELECT 1")
  .then(() => console.log("✅ Datenbankverbindung erfolgreich"))
  .catch((err) => console.error("❌ Fehler bei Datenbankverbindung:", err));

const app = express();

app.use(express.json());
app.use(cors());

// 💡 ALLES unter /api erreichbar machen
const router = express.Router();

app.get("/api/todos", async (req, res) => {
  try {
    const todos = await pool.query("SELECT * FROM todos LIMIT 10");
    res.json(todos.rows);
  } catch (err) {
    console.error("Fehler bei GET /api/todos:", err.message);
    res.status(500).json({ error: "Fehler beim Abrufen der Todos" });
  }
});

router.post("/todos", async (req, res) => {
  try {
    const { title, text, date } = req.body;
    const result = await pool.query(
      "INSERT INTO todos (title, text, date, done, archived) VALUES ($1, $2, $3, false, false) RETURNING *",
      [title, text, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Fehler bei POST /todos:", err.message); // oder err.stack
    res.status(500).json({ error: err.message });
  }
});

router.put("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, text, done, archived } = req.body;
    const result = await pool.query(
      "UPDATE todos SET title = $1, text = $2, done = $3, archived = $4 WHERE id = $5 RETURNING *",
      [title, text, done, archived, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fehler bei PUT /todos/:id:", err);
    res.status(500).json({ error: "Fehler beim Aktualisieren" });
  }
});

router.delete("/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Fehler bei DELETE /todos/:id:", err);
    res.status(500).json({ error: "Fehler beim Löschen" });
  }
});

// Löscht alle Todos
router.delete("/todos", async (req, res) => {
  try {
    // SQL-Abfrage, die alle Todos löscht
    await pool.query("DELETE FROM todos");

    // Erfolgsantwort mit Status 204 (No Content)
    res.status(204).send();
  } catch (err) {
    // Fehlerbehandlung
    console.error("Fehler beim Löschen aller Todos:", err);
    res.status(500).json({ error: "Fehler beim Löschen der Todos" });
  }
});

// 👉 ALLES unter /api

// Zum Testen, ob Server erreichbar ist
app.get("/api/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.use("/api", router);

// Start
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend läuft auf Port ${PORT}`);
});
