import Counter from "../Model/CounterModel.js";

function formatSeq(n, width = 6) {
  return String(n).padStart(width, "0");
}

// Returns e.g., 'APPT-000001' (or any prefix you pass)
export async function getNextRef(prefix = "GEN") {
  const p = String(prefix).toUpperCase();

  const doc = await Counter.findOneAndUpdate(
    { _id: p },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${p}-${formatSeq(doc.seq)}`;
}