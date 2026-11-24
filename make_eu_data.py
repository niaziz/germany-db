import json, urllib.request

URL = "https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson"
EU = {"AUT","BEL","BGR","HRV","CYP","CZE","DNK","EST","FIN","FRA","DEU","GRC","HUN","IRL",
      "ITA","LVA","LTU","LUX","MLT","NLD","POL","PRT","ROU","SVK","SVN","ESP","SWE"}

def rnd(c):
    return [round(c[0], 3), round(c[1], 3)] if isinstance(c[0], (int, float)) else [rnd(x) for x in c]

def mainland(poly):
    xs = [p[0] for p in poly[0]]; ys = [p[1] for p in poly[0]]
    return min(xs) > -12 and max(xs) < 36 and min(ys) > 34 and max(ys) < 72

data = json.load(urllib.request.urlopen(URL))
all_polys, other_polys = [], []
for f in data["features"]:
    iso = f["properties"].get("ISO3166-1-Alpha-3")
    if iso not in EU:
        continue
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for p in polys:
        if mainland(p):
            p = rnd(p)
            all_polys.append(p)
            if iso != "DEU":
                other_polys.append(p)

def fc(polys):
    return {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {},
            "geometry": {"type": "MultiPolygon", "coordinates": polys}}]}

world = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]
mask = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {},
        "geometry": {"type": "Polygon", "coordinates": [world] + [p[0] for p in all_polys]}}]}

for name, obj in [("eu-other", fc(other_polys)), ("eu-all", fc(all_polys)), ("mask", mask)]:
    json.dump(obj, open(f"public/data/{name}.json", "w"), separators=(",", ":"))