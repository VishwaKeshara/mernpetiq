import { useState, useEffect } from "react";
import { medicalRecordBaseURL } from "../../axiosinstance";
import MedicalHistory from "../../components/MedicalHistory";
import PdfDownloader from "../../components/PdfDownloader";

// lightweight placeholder for prescriptions list (component may not exist)
function PrescriptionList({ prescriptions = [] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-3">Prescriptions</h2>
      {prescriptions.length === 0 ? (
        <p className="text-gray-500">No prescriptions available.</p>
      ) : (
        <ul className="space-y-2">
          {prescriptions.map((p, i) => (
            <li key={i} className="text-sm text-gray-700">{p.medicine} — {p.dosage} ({p.duration})</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OwnerDashboard() {
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // Simulated owner’s petId (later, get from AuthContext)
  const petId = "123";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use medical records API; endpoint returns paginated list — here fetch owner pet records by owner id
        const { data } = await medicalRecordBaseURL.get("/", { params: { ownerId: petId, limit: 50 } });
        setRecords(data?.data || []);

        // Prescriptions (later from backend API)
        setPrescriptions([
          { medicine: "Amoxicillin", dosage: "250mg", duration: "7 days" },
          { medicine: "Vitamin B12", dosage: "5ml injection", duration: "Once" },
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [petId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MedicalHistory records={records} />
        <PrescriptionList prescriptions={prescriptions} />
      </div>

      <div className="mt-6">
        <PdfDownloader records={records} />
      </div>
    </div>
  );
}
