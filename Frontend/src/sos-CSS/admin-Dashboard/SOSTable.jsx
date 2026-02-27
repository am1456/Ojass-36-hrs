export default function SOSTable({
  sosList,
  onSuspend,
  onFlag,
}) {
  return (
    <div className="bg-white shadow rounded-xl overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Crisis</th>
            <th className="p-3">Location</th>
            <th className="p-3">Triggered By</th>
            <th className="p-3">Trust Score</th>
            <th className="p-3">Responders</th>
            <th className="p-3">Status</th>
            <th className="p-3">Time</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sosList.map((sos) => (
            <tr
              key={sos._id}
              className="border-t"
            >
              <td className="p-3">
                {sos.crisisType}
              </td>

              <td className="p-3">
                {sos.location.city || "N/A"}
              </td>

              <td className="p-3">
                {sos.triggeredBy.name}
              </td>

              <td className="p-3">
                {sos.triggeredBy.trustScore}
              </td>

              <td className="p-3">
                {sos.responders.length}
              </td>

              <td className="p-3">
                {sos.status}
              </td>

              <td className="p-3">
                {new Date(
                  sos.createdAt
                ).toLocaleString()}
              </td>

              <td className="p-3 space-x-2">
                <button
                  onClick={() =>
                    onSuspend(
                      sos.triggeredBy._id
                    )
                  }
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Suspend
                </button>

                <button
                  onClick={() =>
                    onFlag(sos._id)
                  }
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Flag
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}