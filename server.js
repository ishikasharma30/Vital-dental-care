require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// 1. DATABASE CONNECTION & MODELS
// ==========================================
// Use the exact connection string from MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
})
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// User Schema (Patients)
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
    patientName: String,
    patientEmail: String,
    concern: String,
    date: String,
    timeSlot: String,
    doctor: String,
    status: { type: String, default: 'Pending' }, // Pending, Confirmed, Rejected
    createdAt: { type: Date, default: Date.now }
});
const Appointment = mongoose.model('Appointment', AppointmentSchema);


// ==========================================
// 2. EMAIL CONFIGURATION (Nodemailer)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// ==========================================
// 3. AUTHENTICATION ROUTES
// ==========================================

// Patient Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already registered." });

        // Hash Password & Save
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ fullName, email, phone, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Account created successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error during signup." });
    }
});

// Admin Login Route (Validates ID, Password, and Security Key)
app.post('/api/admin/login', (req, res) => {
    const { email, securityKey, password } = req.body;

    if (
        email === process.env.ADMIN_EMAIL &&
        securityKey === process.env.ADMIN_SECURITY_KEY &&
        password === process.env.ADMIN_PASSWORD
    ) {
        res.status(200).json({ message: "Admin authenticated successfully.", role: "admin" });
    } else {
        res.status(401).json({ error: "Invalid Admin Credentials or Security Key." });
    }
});


// ==========================================
// 4. APPOINTMENT & EMAIL ROUTES
// ==========================================

// Patient Books Appointment -> Emails the Doctor
app.post('/api/appointments/book', async (req, res) => {
    try {
        const { patientName, patientEmail, concern, date, timeSlot, doctor } = req.body;

        // 1. Save to Database
        const newAppointment = new Appointment({
            patientName, patientEmail, concern, date, timeSlot, doctor
        });
        await newAppointment.save();

        // 2. Send Alert Email to Doctor
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL, // Doctor's Email
            subject: `🚨 New Appointment Request: ${patientName}`,
            html: `
                <h3>New Appointment Pending Approval</h3>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Contact:</strong> ${patientEmail}</p>
                <p><strong>Concern:</strong> ${concern}</p>
                <p><strong>Requested Slot:</strong> ${date} at ${timeSlot}</p>
                <br>
                <p>Please log in to the Admin Dashboard to approve or reject this request.</p>
            `
        };

        // AWAIT the email send. If it fails, it drops to the catch block.
        await transporter.sendMail(mailOptions);
        console.log(`✅ Alert email sent to doctor for ${patientName}`);

        res.status(201).json({ message: "Appointment requested and email sent successfully!", appointment: newAppointment });
    } catch (error) {
        console.error("❌ Booking Email Error:", error);
        res.status(500).json({ error: "Saved to DB, but failed to send email. Check server logs." });
    }
});

// Doctor Approves Appointment -> Emails the Patient
app.post('/api/appointments/approve', async (req, res) => {
    try {
        const { appointmentId } = req.body;

        // 1. Find and update status in DB
        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status: 'Confirmed' },
            { new: true }
        );

        if (!appointment) return res.status(404).json({ error: "Appointment not found." });

        // 2. Send Confirmation Email to Patient
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: appointment.patientEmail, // Patient's Email
            subject: `✅ Vital Dental Care: Appointment Confirmed`,
            html: `
                <h3>Hello ${appointment.patientName},</h3>
                <p>Dr. Prachi Sharma has approved your appointment for your scheduled meeting.</p>
                <hr>
                <p><strong>Date:</strong> ${appointment.date}</p>
                <p><strong>Time:</strong> ${appointment.timeSlot}</p>
                <p><strong>Reason:</strong> ${appointment.concern}</p>
                <hr>
                <p>Please arrive 10 minutes early. If you need to reschedule, please contact us on WhatsApp.</p>
                <p>Best regards,<br>Vital Dental Care Team</p>
            `
        };

        // AWAIT the email send
        await transporter.sendMail(mailOptions);
        console.log(`✅ Confirmation email sent to patient: ${appointment.patientEmail}`);

        res.status(200).json({ message: "Appointment confirmed. Email sent to patient." });
    } catch (error) {
        console.error("❌ Approval Email Error:", error);
        res.status(500).json({ error: "Approved in DB, but failed to send confirmation email." });
    }
});


// Fetch ALL Appointments for Admin Dashboard
app.get('/api/appointments/all', async (req, res) => {
    try {
        // Sort by newest first
        const allAppointments = await Appointment.find().sort({ createdAt: -1 }); 
        res.status(200).json(allAppointments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch appointments." });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running! Click here: http://localhost:${PORT}`);
});


//code to fetch the patient detail to the dashboard
// --- Add this to server.js ---

// 1. Real Patient Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ error: "Email not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid password." });

        // Send user data back to frontend
        res.status(200).json({
            message: "Login successful",
            user: { fullName: user.fullName, email: user.email, phone: user.phone }
        });
    } catch (error) {
        res.status(500).json({ error: "Server error during login." });
    }
});

// 2. Fetch specific patient's appointments
app.get('/api/appointments/patient/:email', async (req, res) => {
    try {
        const patientAppointments = await Appointment.find({ patientEmail: req.params.email });
        res.status(200).json(patientAppointments);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history." });
    }
});