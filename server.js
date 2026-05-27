const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const DB_NAME = "recordmanagementsystem";
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "Viraj@1005",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db;

async function initializeDatabase() {
  const setupConnection = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    port: dbConfig.port
  });

  await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await setupConnection.end();

  db = mysql.createPool({
    ...dbConfig,
    database: DB_NAME
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS Patient (
      patient_id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      date_of_birth DATE NULL,
      gender VARCHAR(20) NULL,
      contact_number VARCHAR(15) NULL,
      email VARCHAR(100) NULL,
      address VARCHAR(255) NULL,
      emergency_contact VARCHAR(15) NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Doctor (
      doctor_id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      specialization VARCHAR(100) NULL,
      license_number VARCHAR(50) NULL,
      contact_number VARCHAR(15) NULL,
      department_id INT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Appointment (
      appointment_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      doctor_id INT NOT NULL,
      appointment_date DATETIME NOT NULL,
      status VARCHAR(50) NULL,
      notes VARCHAR(255) NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Medical_Record (
      record_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      doctor_id INT NOT NULL,
      record_date DATE NOT NULL,
      chief_complaint VARCHAR(255) NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Billing (
      billing_id INT AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      billing_date DATE NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS Prescription (
      prescription_id INT AUTO_INCREMENT PRIMARY KEY,
      record_id INT NOT NULL,
      medication_name VARCHAR(100) NOT NULL,
      generic_name VARCHAR(100) NULL,
      category VARCHAR(50) NULL,
      price DECIMAL(10,2) NULL,
      dosage VARCHAR(50) NOT NULL,
      frequency VARCHAR(100) NOT NULL,
      duration_days INT NOT NULL
    )
  `);
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/test-db", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ message: "Backend and MySQL connected successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/dashboard-stats", async (req, res) => {
  try {
    const [[patients]] = await db.query("SELECT COUNT(*) AS total FROM Patient");
    const [[doctors]] = await db.query("SELECT COUNT(*) AS total FROM Doctor");
    const [[appointments]] = await db.query("SELECT COUNT(*) AS total FROM Appointment");
    const [[billing]] = await db.query("SELECT COUNT(*) AS total FROM Billing");

    res.json({
      patients: patients.total,
      doctors: doctors.total,
      appointments: appointments.total,
      billing: billing.total
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res.json({
      patients: 0,
      doctors: 0,
      appointments: 0,
      billing: 0
    });
  }
});

/* PATIENTS */

app.post("/patients", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      date_of_birth,
      gender,
      contact_number,
      email,
      address,
      emergency_contact
    } = req.body;

    const sql = `
      INSERT INTO Patient 
      (first_name, last_name, date_of_birth, gender, contact_number, email, address, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      first_name,
      last_name,
      date_of_birth,
      gender,
      contact_number,
      email,
      address,
      emergency_contact
    ]);

    res.json({
      message: "Patient added successfully",
      patient_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/patients", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Patient");
    res.json(rows);
  } catch (error) {
    console.error("Patients list error:", error.message);
    res.json([]);
  }
});

/* DOCTORS */

app.post("/doctors", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      specialization,
      license_number,
      contact_number,
      department_id
    } = req.body;

    const sql = `
      INSERT INTO Doctor
      (first_name, last_name, specialization, license_number, contact_number, department_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      first_name,
      last_name,
      specialization,
      license_number,
      contact_number,
      department_id
    ]);

    res.json({
      message: "Doctor added successfully",
      doctor_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/doctors", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Doctor");
    res.json(rows);
  } catch (error) {
    console.error("Doctors list error:", error.message);
    res.json([]);
  }
});

/* APPOINTMENTS */

app.post("/appointments", async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      status,
      notes
    } = req.body;

    const sql = `
      INSERT INTO Appointment
      (patient_id, doctor_id, appointment_date, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      patient_id,
      doctor_id,
      appointment_date,
      status,
      notes
    ]);

    res.json({
      message: "Appointment added successfully",
      appointment_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/appointments", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.status,
        a.notes,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
      FROM Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      JOIN Doctor d ON a.doctor_id = d.doctor_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Appointments list error:", error.message);
    res.json([]);
  }
});

/* MEDICAL RECORDS */

app.post("/medical-records", async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      record_date,
      chief_complaint
    } = req.body;

    const sql = `
      INSERT INTO Medical_Record
      (patient_id, doctor_id, record_date, chief_complaint)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      patient_id,
      doctor_id,
      record_date,
      chief_complaint
    ]);

    res.json({
      message: "Medical record added successfully",
      record_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/medical-records", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        m.record_id,
        m.record_date,
        m.chief_complaint,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
      FROM Medical_Record m
      JOIN Patient p ON m.patient_id = p.patient_id
      JOIN Doctor d ON m.doctor_id = d.doctor_id
    `);
    res.json(rows);
  } catch (error) {
    console.error("Medical records list error:", error.message);
    res.json([]);
  }
});

/* PRESCRIPTIONS */

app.post("/prescriptions", async (req, res) => {
  try {
    const {
      record_id,
      medication_name,
      generic_name,
      category,
      price,
      dosage,
      frequency,
      duration_days
    } = req.body;

    const sql = `
      INSERT INTO Prescription
      (record_id, medication_name, generic_name, category, price, dosage, frequency, duration_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      record_id,
      medication_name,
      generic_name,
      category,
      price,
      dosage,
      frequency,
      duration_days
    ]);

    res.json({
      message: "Prescription saved successfully",
      prescription_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/prescriptions", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pr.prescription_id,
        pr.medication_name,
        pr.dosage,
        pr.frequency,
        pr.duration_days,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,
        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name
      FROM Prescription pr
      JOIN Medical_Record m ON pr.record_id = m.record_id
      JOIN Patient p ON m.patient_id = p.patient_id
      JOIN Doctor d ON m.doctor_id = d.doctor_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Prescriptions list error:", error.message);
    res.json([]);
  }
});

/* BILLING */

app.post("/billing", async (req, res) => {
  try {
    const {
      patient_id,
      billing_date,
      total_amount,
      status
    } = req.body;

    const sql = `
      INSERT INTO Billing
      (patient_id, billing_date, total_amount, status)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      patient_id,
      billing_date,
      total_amount,
      status
    ]);

    res.json({
      message: "Billing record added successfully",
      billing_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/billing", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.billing_id,
        b.billing_date,
        b.total_amount,
        b.status,
        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name
      FROM Billing b
      JOIN Patient p ON b.patient_id = p.patient_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Billing list error:", error.message);
    res.json([]);
  }
});

/* LOGIN SIMPLE EXAMPLE */

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid login" });
  }
});

app.post("/patient-login", async (req, res) => {
  try {
    const { identifier } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM Patient WHERE patient_id = ? OR email = ? LIMIT 1",
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid patient login" });
    }

    res.json({
      success: true,
      message: "Login successful",
      patient: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/patient-report", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        d.department_id AS department_name,
        CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
        m.chief_complaint AS diagnosis,
        a.appointment_date,
        b.status AS bill_status
      FROM Patient p
      LEFT JOIN Appointment a ON p.patient_id = a.patient_id
      LEFT JOIN Doctor d ON a.doctor_id = d.doctor_id
      LEFT JOIN Medical_Record m ON p.patient_id = m.patient_id
      LEFT JOIN Billing b ON p.patient_id = b.patient_id
    `);

    res.json(rows);
  } catch (error) {
    console.error("Patient report error:", error.message);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    console.error("Check that MySQL is running and the username/password in server.js are correct.");
  });
