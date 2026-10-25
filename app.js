
/* =====================================================
   CAREFLOW HOSPITAL MANAGEMENT SYSTEM
   FRONTEND + MONGODB BACKEND API
   ===================================================== */

// LOCAL TESTING BACKEND
const API_BASE = 
/* =====================================================
   CAREFLOW HOSPITAL MANAGEMENT SYSTEM
   FRONTEND + MONGODB BACKEND API
   ===================================================== */

// LOCAL TESTING BACKEND
const API_BASE = "https://careflow-hospital-management-system-3.onrender.com/api";

const $ = id => document.getElementById(id);

let patients = [];
let appointments = [];


/* ================= ESCAPE HTML ================= */

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}


/* ================= API CONNECTION ================= */

async function api(path, options = {}) {

    const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Backend returned invalid JSON");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    if (data.success !== true) {
        throw new Error(data.message || "Backend request failed");
    }

    return data;
}


/* ================= TOAST ================= */

function toast(message) {

    const element = $("toast");

    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}


/* ================= LOAD DATA ================= */

async function load() {

    try {

        const [patientResponse, appointmentResponse] =
            await Promise.all([
                api("/patients"),
                api("/appointments")
            ]);

        patients = Array.isArray(patientResponse.patients)
            ? patientResponse.patients
            : [];

        appointments = Array.isArray(appointmentResponse.appointments)
            ? appointmentResponse.appointments
            : [];

        if ($("status")) {
            $("status").textContent = "Connected";
        }

        draw();

    } catch (error) {

        console.error("Loading error:", error);

        if ($("status")) {
            $("status").textContent = "Offline";
        }

        toast("Backend error: " + error.message);
    }
}


/* ================= DRAW PATIENTS ================= */

function draw() {

    const searchElement = $("search");

    const query = searchElement
        ? searchElement.value.toLowerCase()
        : "";

    const filteredPatients = patients.filter(patient => {

        return [
            patient.name,
            patient.department,
            patient.phone
        ].some(value =>
            String(value || "")
                .toLowerCase()
                .includes(query)
        );
    });


    /* PATIENT TABLE */

    if ($("patientsTable")) {

        $("patientsTable").innerHTML =
            filteredPatients.length

                ? filteredPatients.map(patient => `
                    <tr>
                        <td>${esc(patient.name)}</td>
                        <td>${esc(patient.age)}</td>
                        <td>${esc(patient.gender)}</td>
                        <td>${esc(patient.blood_group || "—")}</td>
                        <td>${esc(patient.department || "—")}</td>
                        <td>${esc(patient.phone || "—")}</td>
                        <td>
                            <button
                                class="del"
                                data-id="${esc(patient._id)}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join("")

                : `
                    <tr>
                        <td colspan="7">
                            No patients found
                        </td>
                    </tr>
                `;
    }


    /* RECENT PATIENTS */

    if ($("recent")) {

        $("recent").innerHTML =

            patients.slice(0, 5).map(patient => `
                <tr>
                    <td>${esc(patient.name)}</td>
                    <td>${esc(patient.age)}</td>
                    <td>${esc(patient.gender)}</td>
                    <td>${esc(patient.department || "—")}</td>
                    <td>${esc(patient.phone || "—")}</td>
                </tr>
            `).join("")

            || `
                <tr>
                    <td colspan="5">
                        No patients yet
                    </td>
                </tr>
            `;
    }


    /* STATISTICS */

    if ($("statPatients")) {
        $("statPatients").textContent = patients.length;
    }

    if ($("statAppointments")) {
        $("statAppointments").textContent = appointments.length;
    }
}


/* ================= PATIENT REGISTRATION ================= */

if ($("patientForm")) {

    $("patientForm").addEventListener("submit", async event => {

        event.preventDefault();

        const form = event.target;

        const formData = new FormData(form);

        const patientData = Object.fromEntries(formData);

        patientData.name = String(patientData.name || "").trim();

        patientData.age = Number(patientData.age);

        patientData.gender = String(patientData.gender || "").trim();

        patientData.blood_group =
            String(patientData.blood_group || "").trim();

        patientData.department =
            String(patientData.department || "").trim();

        patientData.phone =
            String(patientData.phone || "").trim();


        /* VALIDATION */

        if (!patientData.name) {
            $("message").textContent = "Enter patient name";
            return;
        }

        if (
            !Number.isInteger(patientData.age) ||
            patientData.age < 0 ||
            patientData.age > 150
        ) {
            $("message").textContent = "Enter valid age";
            return;
        }

        if (!["Male", "Female", "Other"].includes(patientData.gender)) {
            $("message").textContent = "Select valid gender";
            return;
        }


        /* BUTTON */

        if ($("submit")) {
            $("submit").disabled = true;
        }

        if ($("message")) {
            $("message").textContent = "Saving patient...";
        }


        /* SEND TO MONGODB BACKEND */

        try {

            const response = await api("/patients", {
                method: "POST",
                body: JSON.stringify(patientData)
            });


            /* VERIFY RESPONSE */

            if (
                response.success !== true ||
                !response.patient ||
                !response.patient._id
            ) {
                throw new Error(
                    "Patient response missing from backend"
                );
            }


            /* SUCCESS */

            form.reset();

            if ($("modal")) {
                $("modal").close();
            }

            if ($("message")) {
                $("message").textContent = "";
            }

            toast("Patient registered successfully!");

            await load();

        } catch (error) {

            console.error("Registration error:", error);

            if ($("message")) {
                $("message").textContent =
                    "Registration failed: " + error.message;
            }

        } finally {

            if ($("submit")) {
                $("submit").disabled = false;
            }
        }

    });
}


/* ================= OPEN MODAL ================= */

if ($("openModal")) {

    $("openModal").addEventListener("click", () => {

        if ($("message")) {
            $("message").textContent = "";
        }

        if ($("patientForm")) {
            $("patientForm").reset();
        }

        if ($("modal")) {
            $("modal").showModal();
        }

    });
}


/* ================= CLOSE MODAL ================= */

if ($("close")) {

    $("close").addEventListener("click", () => {

        if ($("modal")) {
            $("modal").close();
        }

    });
}


/* ================= SEARCH ================= */

if ($("search")) {

    $("search").addEventListener("input", draw);
}


/* ================= DELETE PATIENT ================= */

if ($("patientsTable")) {

    $("patientsTable").addEventListener("click", async event => {

        const button = event.target.closest("[data-id]");

        if (!button) {
            return;
        }

        const patientId = button.dataset.id;

        if (!patientId) {
            return;
        }

        if (!confirm("Delete this patient?")) {
            return;
        }

        try {

            await api(
                "/patients/" + encodeURIComponent(patientId),
                {
                    method: "DELETE"
                }
            );

            toast("Patient deleted successfully");

            await load();

        } catch (error) {

            console.error("Delete error:", error);

            toast("Delete failed: " + error.message);
        }

    });
}


/* ================= NAVIGATION ================= */

document.querySelectorAll("nav button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll("nav button").forEach(navButton => {

            navButton.classList.toggle(
                "active",
                navButton === button
            );

        });


        document.querySelectorAll(".page").forEach(page => {

            page.classList.toggle(
                "hidden",
                page.id !== button.dataset.page
            );

        });


        if ($("heading")) {

            $("heading").textContent =
                button.textContent.trim();
        }

    });

});


/* ================= START APP ================= */

load();;

const $ = id => document.getElementById(id);

let patients = [];
let appointments = [];


/* ================= ESCAPE HTML ================= */

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}


/* ================= API CONNECTION ================= */

async function api(path, options = {}) {

    const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Backend returned invalid JSON");
    }

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    if (data.success !== true) {
        throw new Error(data.message || "Backend request failed");
    }

    return data;
}


/* ================= TOAST ================= */

function toast(message) {

    const element = $("toast");

    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}


/* ================= LOAD DATA ================= */

async function load() {

    try {

        const [patientResponse, appointmentResponse] =
            await Promise.all([
                api("/patients"),
                api("/appointments")
            ]);

        patients = Array.isArray(patientResponse.patients)
            ? patientResponse.patients
            : [];

        appointments = Array.isArray(appointmentResponse.appointments)
            ? appointmentResponse.appointments
            : [];

        if ($("status")) {
            $("status").textContent = "Connected";
        }

        draw();

    } catch (error) {

        console.error("Loading error:", error);

        if ($("status")) {
            $("status").textContent = "Offline";
        }

        toast("Backend error: " + error.message);
    }
}


/* ================= DRAW PATIENTS ================= */

function draw() {

    const searchElement = $("search");

    const query = searchElement
        ? searchElement.value.toLowerCase()
        : "";

    const filteredPatients = patients.filter(patient => {

        return [
            patient.name,
            patient.department,
            patient.phone
        ].some(value =>
            String(value || "")
                .toLowerCase()
                .includes(query)
        );
    });


    /* PATIENT TABLE */

    if ($("patientsTable")) {

        $("patientsTable").innerHTML =
            filteredPatients.length

                ? filteredPatients.map(patient => `
                    <tr>
                        <td>${esc(patient.name)}</td>
                        <td>${esc(patient.age)}</td>
                        <td>${esc(patient.gender)}</td>
                        <td>${esc(patient.blood_group || "—")}</td>
                        <td>${esc(patient.department || "—")}</td>
                        <td>${esc(patient.phone || "—")}</td>
                        <td>
                            <button
                                class="del"
                                data-id="${esc(patient._id)}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join("")

                : `
                    <tr>
                        <td colspan="7">
                            No patients found
                        </td>
                    </tr>
                `;
    }


    /* RECENT PATIENTS */

    if ($("recent")) {

        $("recent").innerHTML =

            patients.slice(0, 5).map(patient => `
                <tr>
                    <td>${esc(patient.name)}</td>
                    <td>${esc(patient.age)}</td>
                    <td>${esc(patient.gender)}</td>
                    <td>${esc(patient.department || "—")}</td>
                    <td>${esc(patient.phone || "—")}</td>
                </tr>
            `).join("")

            || `
                <tr>
                    <td colspan="5">
                        No patients yet
                    </td>
                </tr>
            `;
    }


    /* STATISTICS */

    if ($("statPatients")) {
        $("statPatients").textContent = patients.length;
    }

    if ($("statAppointments")) {
        $("statAppointments").textContent = appointments.length;
    }
}


/* ================= PATIENT REGISTRATION ================= */

if ($("patientForm")) {

    $("patientForm").addEventListener("submit", async event => {

        event.preventDefault();

        const form = event.target;

        const formData = new FormData(form);

        const patientData = Object.fromEntries(formData);

        patientData.name = String(patientData.name || "").trim();

        patientData.age = Number(patientData.age);

        patientData.gender = String(patientData.gender || "").trim();

        patientData.blood_group =
            String(patientData.blood_group || "").trim();

        patientData.department =
            String(patientData.department || "").trim();

        patientData.phone =
            String(patientData.phone || "").trim();


        /* VALIDATION */

        if (!patientData.name) {
            $("message").textContent = "Enter patient name";
            return;
        }

        if (
            !Number.isInteger(patientData.age) ||
            patientData.age < 0 ||
            patientData.age > 150
        ) {
            $("message").textContent = "Enter valid age";
            return;
        }

        if (!["Male", "Female", "Other"].includes(patientData.gender)) {
            $("message").textContent = "Select valid gender";
            return;
        }


        /* BUTTON */

        if ($("submit")) {
            $("submit").disabled = true;
        }

        if ($("message")) {
            $("message").textContent = "Saving patient...";
        }


        /* SEND TO MONGODB BACKEND */

        try {

            const response = await api("/patients", {
                method: "POST",
                body: JSON.stringify(patientData)
            });


            /* VERIFY RESPONSE */

            if (
                response.success !== true ||
                !response.patient ||
                !response.patient._id
            ) {
                throw new Error(
                    "Patient response missing from backend"
                );
            }


            /* SUCCESS */

            form.reset();

            if ($("modal")) {
                $("modal").close();
            }

            if ($("message")) {
                $("message").textContent = "";
            }

            toast("Patient registered successfully!");

            await load();

        } catch (error) {

            console.error("Registration error:", error);

            if ($("message")) {
                $("message").textContent =
                    "Registration failed: " + error.message;
            }

        } finally {

            if ($("submit")) {
                $("submit").disabled = false;
            }
        }

    });
}


/* ================= OPEN MODAL ================= */

if ($("openModal")) {

    $("openModal").addEventListener("click", () => {

        if ($("message")) {
            $("message").textContent = "";
        }

        if ($("patientForm")) {
            $("patientForm").reset();
        }

        if ($("modal")) {
            $("modal").showModal();
        }

    });
}


/* ================= CLOSE MODAL ================= */

if ($("close")) {

    $("close").addEventListener("click", () => {

        if ($("modal")) {
            $("modal").close();
        }

    });
}


/* ================= SEARCH ================= */

if ($("search")) {

    $("search").addEventListener("input", draw);
}


/* ================= DELETE PATIENT ================= */

if ($("patientsTable")) {

    $("patientsTable").addEventListener("click", async event => {

        const button = event.target.closest("[data-id]");

        if (!button) {
            return;
        }

        const patientId = button.dataset.id;

        if (!patientId) {
            return;
        }

        if (!confirm("Delete this patient?")) {
            return;
        }

        try {

            await api(
                "/patients/" + encodeURIComponent(patientId),
                {
                    method: "DELETE"
                }
            );

            toast("Patient deleted successfully");

            await load();

        } catch (error) {

            console.error("Delete error:", error);

            toast("Delete failed: " + error.message);
        }

    });
}


/* ================= NAVIGATION ================= */

document.querySelectorAll("nav button").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll("nav button").forEach(navButton => {

            navButton.classList.toggle(
                "active",
                navButton === button
            );

        });


        document.querySelectorAll(".page").forEach(page => {

            page.classList.toggle(
                "hidden",
                page.id !== button.dataset.page
            );

        });


        if ($("heading")) {

            $("heading").textContent =
                button.textContent.trim();
        }

    });

});


/* ================= START APP ================= */

load();
