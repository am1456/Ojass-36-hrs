// find users within radius of a point
const findNearbyUsers = async (UserModel, lng, lat, radiusInMeters, excludeUserId) => {
    return await UserModel.find({
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: radiusInMeters
            }
        },
        _id: { $ne: excludeUserId },
        isSuspended: false
    }).select("_id name skills trustScore")
}

// find active SOS within radius of a point
const findNearbyActiveSOS = async (SOSModel, lng, lat, radiusInMeters) => {
    return await SOSModel.find({
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                $maxDistance: radiusInMeters
            }
        },
        status: "active"
    }).populate("triggeredBy", "name")
}

export { findNearbyUsers, findNearbyActiveSOS }