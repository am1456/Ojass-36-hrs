import { useState } from "react";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    skills: [],
  });

  const skillsOptions = [
    "CPR",
    "Doctor",
    "Nurse",
    "Firefighter",
    "Mechanic",
  ];

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);
      alert("Registered Successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-2xl font-bold text-center text-red-600 mb-6">
          Register
        </h2>

        <input
          name="name"
          value={form.name}
          placeholder="Name"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <input
          name="email"
          type="email"
          value={form.email}
          placeholder="Email"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <input
          name="password"
          type="password"
          value={form.password}
          placeholder="Password"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
          className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
        />

        <div className="grid grid-cols-2 gap-3 mb-6">
          {skillsOptions.map((skill) => (
            <button
              type="button"
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`p-2 rounded-lg border text-sm transition ${
                form.skills.includes(skill)
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {skill}
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition"
        >
          Register
        </button>
      </form>
    </div>
  );
}