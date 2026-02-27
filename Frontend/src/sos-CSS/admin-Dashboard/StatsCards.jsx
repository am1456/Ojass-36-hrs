export default function StatsCards({ stats }) {
  const cards = [
    { label: "Total SOS Today", value: stats.totalToday },
    { label: "Active SOS", value: stats.active },
    { label: "Total Users", value: stats.totalUsers },
    { label: "Suspended Users", value: stats.suspendedUsers },
  ]

  return (
    <div className="grid grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className="p-6 bg-white shadow rounded-xl"
        >
          <p className="text-gray-500 text-sm">
            {card.label}
          </p>
          <h2 className="text-2xl font-bold">
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  )
}