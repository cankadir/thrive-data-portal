"""Annotate the Sector Map T+I tab of the Thrive expectations sheet with TRIP coverage.

Inputs
  pub.xlsx        the Google sheet exported locally (all 8 tabs)
  Trip_Layers.xlsx  the 67 layers of the Trip Updates 2026 web map, with descriptions

Output
  Sector_Map_TI_trip_annotated.xlsx   same workbook, T+I tab annotated, plus a notes tab

Verdict scale
  in TRIP     the data is in the map as asked
  proxy       a related TRIP layer stands in; not the same measure
  partial     TRIP has part of it, something the row asks for is missing
  not in TRIP nothing in the 67 layers answers the row
"""
import re
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill

SRC = "/home/cank/projects/thrive-data-portal/PY/expectations_source.xlsx"
TRIP = "/home/cank/projects/thrive-data-portal/PY/Trip_Layers.xlsx"
OUT = "/home/cank/projects/thrive-data-portal/PY/Sector_Map_TI_trip_annotated.xlsx"
TAB = "Sector Map T+I"

# ---------------------------------------------------------------- trip corpus
twb = openpyxl.load_workbook(TRIP)
tws = twb["Sheet1"]
trip = []                                     # (title, sublayer, group, description)
for r in tws.iter_rows(min_row=2, values_only=True):
    if r[2] is None:
        continue
    trip.append({"group": r[1], "title": str(r[2]).strip(), "sub": str(r[5]),
                 "url": r[4], "desc": str(r[7] or "").strip()})
by_title = {t["title"]: t for t in trip}
corpus = "\n".join(t["title"] + " " + t["desc"] for t in trip).lower()

# ---------------------------------------------------------------- verdicts
V = {}
V["Freight infrastructure (ports, transfer stations, locks, etc)"] = dict(
    verdict="in TRIP",
    layers=["Major Ports", "Docks", "Locks", "Intermodal Transfer Facilities",
            "Non Retail Shipping Facilities", "Rail Freight Stations"],
    evidence="Major Ports: US Waterway Data, 'Navigation Data Center'; Docks: 'nearly 12,000 "
             "ports-and-waterway facilities'; Locks: Lock Performance Monitoring System; "
             "Intermodal Transfer Facilities, Non Retail Shipping Facilities, Rail Freight Stations",
    gap="")
V["Truck Infrastructure: parking and Rest Areas"] = dict(
    verdict="partial",
    layers=["Truck Parking"],
    evidence="Truck Parking: 'truck parking locations obtained from TDOT, USDOT, and FHWA'",
    gap="no rest areas and no truck stops, exactly the gap the sheet's own note flags")
V["Origin + Destination: Freight Movement"] = dict(
    verdict="in TRIP",
    layers=["CFS Subareas Origin Data 2022", "CFS Subareas Destination Data - 2022",
            "Commodity Flow Survery Areas: National", "Freight Analysis Framework (FAF) Network: 2022 Estimates",
            "Freight Analysis Framework (FAF) Network: 2050 Estimates"],
    evidence="CFS: 'the primary source of national and state-level data on domestic freight "
             "shipments'; FAF integrates CFS with other sources",
    gap="")
V["Manufacturing / Industrial zones"] = dict(
    verdict="partial",
    layers=["Manufacturing Facilities"],
    evidence="Manufacturing Facilities: 'manufacturing facilities (NAICS Codes 31, 32...'",
    gap="points only, no industrial zone polygons. Same gap the sheet notes")
V["Alternative Transportation + Multi modal Options (for freight)"] = dict(
    verdict="proxy",
    layers=["Waterway Shipping Links (Commodity Tonnage)", "Air Cargo (2024 - 6 2025)",
            "Airports", "Rail Network", "Rail Freight Stations", "Navigable Waterways"],
    evidence="Link Tonnages 2023 'waterway shipping links'; Air Cargo 2023-2025 Chattanooga and "
             "other airports; BTS rail network",
    gap="single modes shown side by side, no combined multimodal measure")
V["Emissions"] = dict(verdict="not in TRIP", layers=[], evidence="no layer mentions emissions",
                      gap="EPA NEI work is the source named in the sheet, not TRIP")
V["Freight traffic: non-permitted / off truck route"] = dict(
    verdict="not in TRIP", layers=[], evidence="no permit or route-designation field anywhere",
    gap="HPMS and VMT give volume, not truck route legality")
V["Truck tracking"] = dict(verdict="not in TRIP", layers=[],
                           evidence="no tracking source", gap="proprietary data, per the sheet")
V["Traffic and Speed (Traffic Congestion)"] = dict(
    verdict="partial",
    layers=["Regional Traffic Counts (2022-2024)", "VMT Traffic volume",
            "TN Road Network Traffic 2024: % Peak Multi-Unit Trucks",
            "GA Road Network Truck 2024: % Peak Multi-Unit Trucks",
            "Highway Performance Monitoring System (HPMS)"],
    evidence="Regional Traffic Counts: GDOT/TDOT/ALDOT counts 2022-2024, AADT; VMT: 'annual "
             "vehicle miles travelled'; road network layers carry AADT and % peak trucks",
    gap="volume only, no speed or delay. The sheet says speed data is not public")
V["Alternative Transportation + Multi modal Options (for people)"] = dict(
    verdict="not in TRIP", layers=[], evidence="no transit, bicycle or pedestrian facility layer",
    gap="CARTA routes and bike paths are named in the sheet as separate work")
V["Commute times"] = dict(verdict="in TRIP", layers=["ACS Travel Time"],
                          evidence="ACS Travel Time (B08303): 'workers' place of residence by "
                                   "commute length', tract / county / region",
                          gap="")
V["Commuting Patterns: Origin + Destination (people)"] = dict(
    verdict="partial",
    layers=["ACS Commute Mode", "ACS Drive Alone"],
    evidence="ACS Commute Mode (B08301): 'workers' place of residence by mode of commute'",
    gap="mode split by home tract, not home-to-work flows. No LODES or county-to-county pairs")
V["Crash Data , traffic + pedestrian"] = dict(
    verdict="in TRIP",
    layers=["TN Large Truck Accidents (2017 - 2025)", "GA Large Truck Accidents (2020-2025)",
            "Fatal Motor Vehicle Accidents (2019 - 2024)", "TN Pedestrian Crashes (2016 - 2025)",
            "Truck Crashes by County (2019-2025)", "Rail Trespasser Fatalities (2011-2022)"],
    evidence="TN and GA DOT crash files, FARS-derived fatal MVA, TDOT pedestrian crashes, "
             "FHWA truck crashes by county",
    gap="no Alabama crash layer, and no pedestrian layer for GA or AL")
V["Animal collisions"] = dict(verdict="not in TRIP", layers=[],
                              evidence="no collision layer other than vehicle and pedestrian",
                              gap="source still to be found, per the sheet")
V["zoning ? infrastructure planning?"] = dict(verdict="not in TRIP", layers=[],
                                              evidence="no zoning or land use layer",
                                              gap="municode link in the sheet is not data")
V["STIPs?"] = dict(verdict="in TRIP", layers=["AL STIP", "TN STIP", "GA STIP"],
                   evidence="AL: 'digitized from maps obtained from ALDOT'; TN and GA: project "
                            "locations pulled from the state DOT sites",
                   gap="")
V["LTRP?"] = dict(verdict="not in TRIP", layers=[],
                  evidence="no layer or description mentions a long range transportation plan",
                  gap="TRIP's own LTRP is published separately from this service")
V["Data Centers"] = dict(verdict="not in TRIP", layers=[],
                         evidence="the only 'center' hits are unrelated (fueling stations, ports)",
                         gap="the Experience Builder app in the sheet is the source")
V["Broad band access"] = dict(verdict="not in TRIP", layers=[],
                              evidence="no broadband or B28002 layer",
                              gap="separate census pull")
V["Electircity service areas"] = dict(
    verdict="proxy",
    layers=["Electric Power Transmission Lines", "Electric Substations", "Power Plants"],
    evidence="HIFLD transmission lines and substations, HIFLD power plants",
    gap="assets, not utility service territory polygons")
V["Water provider areas"] = dict(verdict="not in TRIP", layers=[],
                                 evidence="Rivers and Water Bodies are hydrology, not service areas",
                                 gap="provider boundaries live with the utilities")
V["Energy use and cost"] = dict(verdict="not in TRIP", layers=[],
                                evidence="TRIP carries energy supply and fuel infrastructure only",
                                gap="ACS B25132/B25133 pull, per the sheet")
V["Infrastructure + capacity"] = dict(verdict="not in TRIP", layers=[],
                                      evidence="nothing in the 67 layers reports capacity",
                                      gap="the sheet itself says 'not sure this is possible'")
V["Background, context, boundaries + mask layers"] = dict(
    verdict="in TRIP",
    layers=["Study Area", "Thrive Counties", "Rivers", "Water Bodies",
            "119th Congressional Districts", "MetropolitanPlanningOrganizations",
            "Local Development Districts", "Incorporated Places", "Navigable Waterways"],
    evidence="TIGER/Line extracts for the study area and counties, census boundaries, hydrology",
    gap="")

# keyword audit behind every "not in TRIP"
AUDIT = {
    "Emissions": ["emission"],
    "Freight traffic: non-permitted / off truck route": ["permit", "non-permitted", "off truck route"],
    "Truck tracking": ["tracking", "telematics", "gps"],
    "Alternative Transportation + Multi modal Options (for people)": ["transit", "bike", "bicycle", "carta"],
    "Animal collisions": ["animal", "deer", "wildlife"],
    "zoning ? infrastructure planning?": ["zoning", "land use", "parcel"],
    "LTRP?": ["ltrp", "long range"],
    "Data Centers": ["data center", "datacenter"],
    "Broad band access": ["broadband", "broad band", "b28002"],
    "Water provider areas": ["water provider", "water utility", "water district"],
    "Energy use and cost": ["energy use", "electricity cost", "gas cost", "b25132", "b25133"],
    "Infrastructure + capacity": ["capacity"],
}

# ---------------------------------------------------------------- walk the tab
wb = openpyxl.load_workbook(SRC)
ws = wb[TAB]
CHAPTERS = {"Freight Mobility", "Transportation Network", "Safety", "Infrastructure Investment",
            "Broadband & Digital Infrastructure", "Utilities & Critical Infrastructure",
            "Background, context, boundaries + mask layers"}

norm = lambda s: re.sub(r"\s+", " ", str(s)).strip().lower()
Vn = {norm(k): v for k, v in V.items()}

targets, unmatched = [], []                    # (row, topic text, verdict)
for r in range(4, ws.max_row + 1):
    a = str(ws.cell(r, 1).value or "").strip()
    b = str(ws.cell(r, 2).value or "").strip()
    if a in CHAPTERS:
        # a chapter row carries only the chapter question, except the last one,
        # which has no topic rows under it and is itself the expectation
        if norm(a) in Vn:
            targets.append((r, a, Vn[norm(a)]))
        continue
    topic = b or a
    if not topic or topic.lower().startswith("http"):
        continue
    if norm(topic) not in Vn:
        unmatched.append((r, topic))
        continue
    targets.append((r, topic, Vn[norm(topic)]))


# first free column, two past the last used one
last = max((c for row in ws.iter_rows() for c in [row[-1].column] if row[-1].value), default=13)
start = last + 2
HDR = ["trip match", "trip layers (sublayer)", "trip evidence", "trip gap"]
for i, h in enumerate(HDR):
    c = ws.cell(3, start + i, h)
    c.font = Font(bold=True, color="FFFFFF")
    c.fill = PatternFill("solid", fgColor="4472C4")
    c.alignment = Alignment(vertical="top", wrap_text=True)

FILL = {"in TRIP": "C6EFCE", "proxy": "FFEB9C", "partial": "FFD8A8", "not in TRIP": "FFC7CE"}
matched = []
for r, topic, v in targets:
    matched.append((r, topic, v))
    layers = "; ".join(f"{t} ({by_title[t]['sub']})" if t in by_title else t for t in v["layers"])
    ws.cell(r, start, v["verdict"]).fill = PatternFill("solid", fgColor=FILL[v["verdict"]])
    ws.cell(r, start + 1, layers)
    ws.cell(r, start + 2, v["evidence"])
    ws.cell(r, start + 3, v["gap"])
    for i in range(4):
        ws.cell(r, start + i).alignment = Alignment(vertical="top", wrap_text=True)
for col, w in zip("OPQR", [14, 46, 52, 40]):
    ws.column_dimensions[col].width = w

# stray layer names in the trip data that no expectation row asks for
asked = {t for _, _, v in matched for t in v["layers"]}
extra = [t["title"] for t in trip if t["title"] not in asked]

# ---------------------------------------------------------------- notes tab
ns = wb.create_sheet("Trip match notes")
notes = [
    ["What this tab is", "The T+I tab annotated with whether Trip Updates 2026 covers each row."],
    ["TRIP source", f"{len(trip)} layers of the Trip Updates 2026 web map, item f5545884a42b4412956620508bef1b2b."],
    ["", ""],
    ["in TRIP", "the data is in the map as asked"],
    ["proxy", "a related TRIP layer stands in, but it is not the same measure"],
    ["partial", "TRIP has part of it, something the row asks for is missing"],
    ["not in TRIP", "nothing in the 67 layers answers the row"],
    ["", ""],
    ["Counts", " ".join(f"{k}: {sum(1 for _, _, v in matched if v['verdict'] == k)}"
                        for k in ["in TRIP", "proxy", "partial", "not in TRIP"])],
    ["Rows annotated", str(len(matched))],
    ["", ""],
    ["Ask the client", "AL crash data, rest areas, industrial zone polygons, speed or delay, "
                       "people origin-destination flows, LTRP."],
    ["", ""],
    ["In TRIP, no row asks for it", ", ".join(extra) if extra else "none"],
]
for row in notes:
    ns.append(row)
ns.column_dimensions["A"].width = 30
ns.column_dimensions["B"].width = 100
for row in ns.iter_rows(min_row=1, max_row=ns.max_row):
    for c in row:
        c.alignment = Alignment(vertical="top", wrap_text=True)
ns["A1"].font = Font(bold=True)
ns["A4"].font = Font(bold=True)
ns["A9"].font = Font(bold=True)
ns["A14"].font = Font(bold=True)

wb.save(OUT)

# ---------------------------------------------------------------- report
print("rows annotated:", len(matched), "| annotation starts at column", start)
for r, topic, v in matched:
    print(f"  r{r:2} {v['verdict']:11} {topic[:58]:60} {len(v['layers'])} layer(s)")
if unmatched:
    print("NOT IN THE TABLE (add a verdict):")
    for r, t in unmatched:
        print(f"  r{r} {t}")
print()
print("keyword audit for every 'not in TRIP':")
for topic, kws in AUDIT.items():
    hits = sorted({t["title"] for t in trip if any(k in (t["title"] + " " + t["desc"]).lower() for k in kws)})
    print(f"  {topic[:52]:54} -> {hits if hits else 'no hit'}")
print()
print("counts:", {k: sum(1 for _, _, v in matched if v["verdict"] == k)
                  for k in ["in TRIP", "proxy", "partial", "not in TRIP"]})
print("trip layers no row asks for:", extra)
print("saved:", OUT)
