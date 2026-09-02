from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class DisasterReport(BaseModel):
    disaster_type: str
    location: str
    severity: str
    description: str
    latitude: float
    longitude: float


reports = []


@router.post("/reports")
def create_report(report: DisasterReport):

    report_id = len(reports) + 1

    new_report = {
        "id": report_id,
        "disaster_type": report.disaster_type,
        "location": report.location,
        "severity": report.severity,
        "description": report.description,
        "latitude": report.latitude,
        "longitude": report.longitude
    }

    reports.append(new_report)

    return {
        "message": "Disaster report created successfully",
        "report": new_report
    }


@router.get("/reports")
def get_reports():

    return {
        "total_reports": len(reports),
        "reports": reports
    }


@router.get("/reports/{report_id}")
def get_single_report(report_id: int):

    for report in reports:
        if report["id"] == report_id:
            return report

    return {
        "message": "Report not found"
    }