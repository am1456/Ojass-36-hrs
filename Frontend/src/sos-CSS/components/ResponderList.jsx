export default function ResponderList({ responders, onSelect }) {

  const getBadgeColor = (score) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="p-4 border-b">
      <h3 className="font-bold mb-2">Responders</h3>

      {responders.length === 0 && (
        <p className="text-sm text-gray-500">
          No responders yet
        </p>
      )}

      {responders.map((r) => (
        <div
          key={r._id}
          onClick={() => onSelect(r)}
          className="flex justify-between items-center p-2 border rounded mb-2 cursor-pointer"
        >
          <span>{r.name}</span>

          <span
            className={`text-white text-xs px-2 py-1 rounded ${getBadgeColor(
              r.trustScore
            )}`}
          >
            {r.trustScore}
          </span>
        </div>
      ))}
    </div>
  )
}