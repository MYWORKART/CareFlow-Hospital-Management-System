const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  blood_group: String,
  department: String,
  doctor: String,
  phone: String
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
