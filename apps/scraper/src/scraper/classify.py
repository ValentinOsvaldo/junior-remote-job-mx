"""Pure functions that turn a raw jobspy row into our Job fields (or reject it)."""

import re
import unicodedata


# Legal suffixes / regional tags that vary between sites for the same employer.
COMPANY_NOISE = {
    "s", "a", "de", "c", "v", "r", "l", "sa", "cv", "rl", "srl", "sapi", "inc", "llc", "ltd", "corp",
    "latam", "mexico", "engineering", "com",
}


def company_key(company: str) -> str:
    """'IDS Comercial, S.A. de C.V.' and 'IDS COMERCIAL' -> 'ids comercial' (used for de-duplication)."""
    return " ".join(w for w in re.sub(r"\W+", " ", fold(company)).split() if w not in COMPANY_NOISE)


def fold(text: str | None) -> str:
    """Lowercase + strip accents so 'Diseño' matches 'diseno'."""
    text = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in text if not unicodedata.combining(c)).lower()


def rx(*words: str) -> re.Pattern:
    return re.compile(r"(?<![a-z0-9])(?:" + "|".join(words) + r")(?![a-z0-9])")


# --- Role --------------------------------------------------------------------

DEV_TITLE = rx(
    r"desarroll\w*", "developer", "dev", r"programad\w*", "programmer", "software",
    r"front[- ]?end", r"back[- ]?end", r"full[- ]?stack", "devops", "sre", "qa", "tester",
    "testing", "automation", "mobile", "android", "ios", "flutter", "react", "angular",
    "vue", "node", "python", "java", r"\.net", "php", "cobol", "web", "programacion",
    r"ingenier[oa] de (?:software|datos|sistemas|desarrollo)", "data engineer",
    "salesforce", "sap abap", "abap", "golang", "ruby", "rpa",
)
NOT_DEV = rx(
    "ventas", "sales", r"mercad\w*", "marketing", "recursos humanos", "contador", "contable",
    r"desarrollo(?:s)? de negocio\w*", r"desarrollador(?:a)? de negocio\w*", "business developer",
    r"inmobiliari\w*", "reclutador", "recruiter", "community manager", "talento",
    r"desarrollo organizacional", r"desarrollo humano", "asesor", "ejecutivo", "promotor",
    "vendedor", "cajero", "almacen", "chofer", "obra", "construccion", r"diseñador grafico",
    "disenador grafico", "producto financiero", "cnc", "plc", "torno", "maquinado", "soldador",
)

# --- Seniority ---------------------------------------------------------------

SENIOR = rx(
    "sr", "senior", "ssr", r"semi[- ]?senior", "semisenior", "lead", r"l[ií]der", "lider",
    r"arquitect\w*", "architect", "principal", "staff", "manager", "gerente", "head",
    "director", r"coordinador\w*", "jefe", "ii", "iii", "iv", "experto", "expert", "especialista",
    "specialist", "all levels",
)
INTERN = rx(r"becari\w*", r"practicante\w*", "intern", "internship", r"pasant\w*", "residente", "servicio social")
TRAINEE = rx("trainee", "academia", "academy", r"aprendiz\w*", "graduate", r"reci[eé]n egresad\w*", "egresado", "bootcamp")
JUNIOR = rx(
    "junior", "jr", "entry level", "entry-level", "sin experiencia", "associate", r"early careers?",
    "new grad", r"(?:engineer|developer|programmer) i", "ic1",
)
DESC_JUNIOR = rx(
    "sin experiencia", r"reci[eé]n egresad\w*", r"no se requiere experiencia",
    r"0 ?(?:a|-) ?1 anos?", r"1 ano de experiencia", r"menos de 1 ano", "entry level",
)
# "3+ años", "4 a 7 años", "minimum 5 years": anything asking 3+ years is not entry level.
DESC_SENIOR_YEARS = re.compile(r"(?<!\d)(?:[3-9]|1\d)\s*\+?\s*(?:anos?|years?)\b")


def seniority(title: str, description: str = "", job_level: str = "") -> str | None:
    """'intern' | 'trainee' | 'junior', or None if not an entry-level job."""
    t, d, lvl = fold(title), fold(description), fold(job_level)
    if SENIOR.search(t):
        return None
    if INTERN.search(t):
        return "intern"
    if TRAINEE.search(t):
        return "trainee"
    if JUNIOR.search(t):
        return "junior"
    if DESC_SENIOR_YEARS.search(d) or "senior" in lvl:  # LinkedIn tags "Mid-Senior level"
        return None
    if "internship" in lvl:
        return "intern"
    if "entry" in lvl:
        return "junior"
    if DESC_JUNIOR.search(d) or INTERN.search(d[:400]):
        return "intern" if INTERN.search(d[:400]) else "junior"
    return None


def is_dev(title: str) -> bool:
    t = fold(title)
    return bool(DEV_TITLE.search(t)) and not NOT_DEV.search(t)


# --- Category / stack / modality ---------------------------------------------

STACK = {
    "React": r"react(?:\.?js)?", "React Native": "react native", "Angular": "angular", "Vue": r"vue(?:\.?js)?",
    "Next.js": r"next\.?js", "TypeScript": "typescript", "JavaScript": r"javascript|js",
    "HTML/CSS": "html5?|css3?", "Node.js": r"node(?:\.?js)?", "Python": "python", "Django": "django",
    "FastAPI": "fastapi", "Java": "java", "Spring": "spring(?: boot)?", "Kotlin": "kotlin",
    "Swift": "swift", "Flutter": "flutter", "Dart": "dart", "C#": r"c#", ".NET": r"\.net(?: core)?|asp\.net",
    "PHP": "php", "Laravel": "laravel", "WordPress": "wordpress", "Go": "golang", "Ruby": "ruby|rails",
    "SQL": "sql|mysql|postgres(?:ql)?|sql server", "MongoDB": "mongo(?:db)?", "AWS": "aws",
    "Azure": "azure", "GCP": "gcp|google cloud", "Docker": "docker", "Kubernetes": "kubernetes|k8s",
    "Git": "git|github|gitlab", "COBOL": "cobol", "Salesforce": "salesforce", "SAP": "sap|abap",
    "Power BI": "power ?bi", "Selenium": "selenium", "Cypress": "cypress", "Unity": "unity",
}
STACK_RX = {name: rx(p) for name, p in STACK.items()}

CATEGORY = {
    "frontend": rx(r"front[- ]?end", "frontend", "ui", "react", "angular", "vue", "web", "wordpress", "maquetador"),
    "backend": rx(r"back[- ]?end", "backend", "api", r"\.net", "java", "php", "node", "python", "cobol", "golang", "abap"),
    "fullstack": rx(r"full[- ]?stack", "fullstack"),
    "mobile": rx("mobile", "movil", "android", "ios", "flutter", "react native", "kotlin", "swift"),
    "data": rx("datos", "data", "bi", "power bi", "etl", "analytics", "machine learning", "ml", "ia", "ai"),
    "devops": rx("devops", "sre", "cloud", "infraestructura", "infrastructure", "platform"),
    "qa": rx("qa", "tester", "testing", "quality", "calidad", "automation", "pruebas"),
}


def categories(title: str) -> list[str]:
    t = fold(title)
    cats = [c for c, p in CATEGORY.items() if p.search(t)]
    if "fullstack" in cats:
        cats = [c for c in cats if c not in ("frontend", "backend")] or ["fullstack"]
    elif "mobile" in cats:
        cats = [c for c in cats if c != "frontend"]
    return cats or ["software"]


def stack(title: str, description: str = "") -> list[str]:
    text = fold(f"{title} {description}")
    found = [name for name, p in STACK_RX.items() if p.search(text)]
    if "React Native" in found and not re.search(r"react(?! native)", text):
        found.remove("React")
    return found


def modality(is_remote: bool | None, *texts: str) -> str:
    t = fold(" ".join(texts))
    if re.search(r"hibrid|hybrid", t):
        return "hybrid"
    if is_remote or re.search(r"remot|home ?office|desde casa|teletrabajo", t):
        return "remote"
    return "onsite"


# --- Location ----------------------------------------------------------------

# Indeed uses 3-letter state codes ("Monterrey, NLE, Mexico").
STATE_CODES = {
    "AGU": "Aguascalientes", "BCN": "Baja California", "BCS": "Baja California Sur", "CAM": "Campeche",
    "CHP": "Chiapas", "CHH": "Chihuahua", "COA": "Coahuila", "COL": "Colima", "DIF": "Ciudad de México",
    "CMX": "Ciudad de México", "DUR": "Durango", "GUA": "Guanajuato", "GRO": "Guerrero", "HID": "Hidalgo",
    "JAL": "Jalisco", "MEX": "Estado de México", "MIC": "Michoacán", "MOR": "Morelos", "NAY": "Nayarit",
    "NLE": "Nuevo León", "OAX": "Oaxaca", "PUE": "Puebla", "QUE": "Querétaro", "ROO": "Quintana Roo",
    "SLP": "San Luis Potosí", "SIN": "Sinaloa", "SON": "Sonora", "TAB": "Tabasco", "TAM": "Tamaulipas",
    "TLA": "Tlaxcala", "VER": "Veracruz", "YUC": "Yucatán", "ZAC": "Zacatecas",
}
STATE_BY_NAME = {fold(n): n for n in STATE_CODES.values()} | {
    "cdmx": "Ciudad de México", "mexico city": "Ciudad de México", "ciudad de mexico": "Ciudad de México",
    "mexico city metropolitan area": "Ciudad de México", "distrito federal": "Ciudad de México",
    "estado de mexico": "Estado de México", "state of mexico": "Estado de México", "nuevo leon": "Nuevo León",
    "monterrey": "Nuevo León", "guadalajara": "Jalisco", "zapopan": "Jalisco", "queretaro": "Querétaro",
    "merida": "Yucatán", "tijuana": "Baja California", "leon": "Guanajuato", "cancun": "Quintana Roo",
    "naucalpan": "Estado de México", "naucalpan de juarez": "Estado de México", "tlalnepantla": "Estado de México",
    "metepec": "Estado de México", "toluca": "Estado de México", "cuautitlan izcalli": "Estado de México",
    "ecatepec": "Estado de México", "puebla city": "Puebla", "san pedro garza garcia": "Nuevo León",
}
NOT_A_PLACE = {"mexico", "mx", "desde casa", "remoto", "remote", "home office", ""}
SAME_AS_STATE = {"mexico city", "ciudad de mexico", "mexico city metropolitan area", "cdmx"}


def location(raw: str | None) -> tuple[str | None, str | None]:
    """'Gustavo A. Madero, DIF, Mexico' -> ('Gustavo A. Madero', 'Ciudad de México')."""
    parts = [p.strip() for p in (raw or "").split(",")]
    state = city = None
    for p in parts:
        key = fold(p)
        if p.upper() in STATE_CODES:
            state = STATE_CODES[p.upper()]
        elif key in STATE_BY_NAME and state is None:
            state = STATE_BY_NAME[key]
            if key not in {fold(n) for n in STATE_CODES.values()} and key not in ("cdmx", "mexico city metropolitan area"):
                city = city or p
        elif key not in NOT_A_PLACE and city is None:
            city = p
    if city and (fold(city) == fold(state or "") or fold(city) in SAME_AS_STATE):
        city = None
    return city, state


# --- Salary ------------------------------------------------------------------

PER_MONTH = {"yearly": 1 / 12, "monthly": 1, "weekly": 4.33, "daily": 22, "hourly": 176}
USD_TO_MXN = 18.5  # ponytail: fixed rate, fetch a live rate if USD postings become common


def monthly_mxn(amount, interval: str | None, currency: str | None) -> int | None:
    if amount is None or amount != amount or not amount:  # None / NaN / 0
        return None
    value = float(amount) * PER_MONTH.get(interval or "monthly", 1)
    if (currency or "MXN").upper() == "USD":
        value *= USD_TO_MXN
    if value < 3000:  # "500", "0-500": junk or a misreported interval
        return None
    return round(value / 100) * 100


# --- Summary -----------------------------------------------------------------

MD_NOISE = re.compile(r"[*_#>`|\\]+|[-=~]{3,}|\[([^\]]*)\]\([^)]*\)")


def summary(description: str | None, limit: int = 260) -> str:
    text = MD_NOISE.sub(lambda m: m.group(1) or " ", description or "")
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(".,;:-") + "…"
