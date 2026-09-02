from fastapi import APIRouter, Query

router = APIRouter()


# Sample emergency locations
locations = [
    {
        "id": 1,
        "name": "Agra Emergency Hospital",
        "type": "Hospital",
        "location": "Agra",
        "latitude": 27.1767,
        "longitude": 78.0081
    },
    {
        "id": 2,
        "name": "Agra Rescue Center",
        "type": "Rescue Center",
        "location": "Agra",
        "latitude": 27.1800,
        "longitude": 78.0100
    },
    {
        "id": 3,
        "name": "Emergency Relief Point",
        "type": "Relief Center",
        "location": "Agra",
        "latitude": 27.1750,
        "longitude": 78.0050
    }
]

shelters = [
    {
        "id": 1,
        "name": "District Relief Shelter",
        "city": "Agra",
        "state": "Uttar Pradesh",
        "latitude": 27.1767,
        "longitude": 78.0081,
        "capacity": 500,
        "available": 320,
        "type": "Emergency Shelter",
        "contact": "District Emergency Control Room",
    },
    {
        "id": 2,
        "name": "Government Relief Centre",
        "city": "Mathura",
        "state": "Uttar Pradesh",
        "latitude": 27.4924,
        "longitude": 77.6737,
        "capacity": 400,
        "available": 280,
        "type": "Relief Centre",
        "contact": "Emergency Response",
    },
    {
        "id": 3,
        "name": "District Emergency Shelter",
        "city": "Delhi",
        "state": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.209,
        "capacity": 800,
        "available": 540,
        "type": "Emergency Shelter",
        "contact": "Delhi Emergency Services",
    },
    {
        "id": 4,
        "name": "Relief Camp",
        "city": "Jaipur",
        "state": "Rajasthan",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "capacity": 600,
        "available": 410,
        "type": "Relief Camp",
        "contact": "District Administration",
    },
    {
        "id": 5,
        "name": "District Safe Shelter",
        "city": "Lucknow",
        "state": "Uttar Pradesh",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "capacity": 700,
        "available": 450,
        "type": "Emergency Shelter",
        "contact": "District Control Room",
    },
    {
        "id": 6,
        "name": "Flood Relief Centre",
        "city": "Patna",
        "state": "Bihar",
        "latitude": 25.5941,
        "longitude": 85.1376,
        "capacity": 650,
        "available": 380,
        "type": "Flood Relief Centre",
        "contact": "Bihar Emergency Services",
    },
]


@router.get("/location/nearby")
def get_nearby_locations(
    latitude: float | None = Query(default=None),
    longitude: float | None = Query(default=None),
    radius_km: float = 25.0,
):
    items = locations

    if latitude is not None and longitude is not None:
        from math import radians, sin, cos, sqrt, atan2

        def distance_km(lat1, lon1, lat2, lon2):
            r = 6371.0
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = (
                sin(dlat / 2) ** 2
                + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
            )
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return r * c

        items = [
            item
            for item in locations
            if distance_km(latitude, longitude, item["latitude"], item["longitude"]) <= radius_km
        ]

    return {
        "message": "Nearby emergency locations",
        "total_locations": len(items),
        "locations": items,
    }


@router.get("/location/reverse")
def reverse_geocode(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    city = "Current GPS Location"
    if abs(latitude - 27.1767) < 0.5 and abs(longitude - 78.0081) < 0.5:
        city = "Agra, Uttar Pradesh"

    return {
        "success": True,
        "latitude": latitude,
        "longitude": longitude,
        "location": city,
        "formatted_address": city,
        "address": city,
    }


@router.get("/location/{location_id}")
def get_location(location_id: int):

    for location in locations:
        if location["id"] == location_id:
            return location

    return {
        "message": "Location not found"
    }


@router.get("/shelters")
def get_shelters():
    return {
        "success": True,
        "count": len(shelters),
        "shelters": shelters,
    }