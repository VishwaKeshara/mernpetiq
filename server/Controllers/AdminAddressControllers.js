const Address = require("../Model/AddressModel");

// Constants
const PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa",
];

// Helper functions
function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Controller functions
const getAdminAddresses = async (req, res) => {
  try {
    const {
      q = "",
      province = "",
      page = "1",
      limit = "20",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 1000);

    const filter = {};

    // Province filter
    if (province && PROVINCES.includes(province)) {
      filter.state = province;
    }

    // Search filter
    if (q && q.trim().length) {
      const trimmed = q.trim();
      const esc = (s) => ({ $regex: escapeRegex(s), $options: "i" });

      // Basic field searches
      const or = [
        { firstName: esc(trimmed) },
        { lastName: esc(trimmed) },
        { phone: esc(trimmed) },
        { line1: esc(trimmed) },
        { line2: esc(trimmed) },
        { city: esc(trimmed) },
        { state: esc(trimmed) },
        { postalCode: esc(trimmed) },
        { country: esc(trimmed) },
      ];

      // Name combination searches
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const first = parts[0];
        const last = parts[parts.length - 1];
        const rest = parts.slice(1).join(" ");          
        const restFront = parts.slice(0, -1).join(" "); 

        // Add combination searches
        or.unshift(
          { $and: [{ firstName: esc(first) }, { lastName: esc(rest) }] },
          { $and: [{ firstName: esc(restFront) }, { lastName: esc(last) }] }
        );

        // Two-word name searches
        if (parts.length === 2) {
          or.unshift(
            { $and: [{ firstName: esc(parts[0]) }, { lastName: esc(parts[1]) }] },
            { $and: [{ firstName: esc(parts[1]) }, { lastName: esc(parts[0]) }] }
          );
        }
      }

      filter.$or = or;
    }

    // Sort configuration
    const sortField = ["createdAt", "firstName", "lastName", "city", "state"].includes(sort)
      ? sort
      : "createdAt";
    const sortDir = order === "asc" ? 1 : -1;
    const sortObj = { [sortField]: sortDir };

    // Execute query
    const total = await Address.countDocuments(filter);
    const items = await Address.find(filter)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      items,
      total,
      page: pageNum,
      pages: Math.max(Math.ceil(total / limitNum), 1),
      limit: limitNum,
      sort: sortField,
      order: sortDir === 1 ? "asc" : "desc",
    });
  } catch (e) {
    console.error("GET /api/admin/addresses error:", e);
    res.status(500).json({ error: "SERVER_ERROR", message: e.message });
  }
};

//Export all functions  
exports.getAdminAddresses = getAdminAddresses;
