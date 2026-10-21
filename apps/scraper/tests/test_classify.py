from scraper.classify import categories, is_dev, location, modality, monthly_mxn, seniority, stack


def test_role():
    for t in ["Desarrollador Web Jr", "Software Developer Intern", "Desarrollador(a) Frontend Junior",
              "QA Tester Junior", "Ingeniero de Datos", "Academia Cobol", "Android Developer Trainee"]:
        assert is_dev(t), t
    for t in ["Mercadólogo Junior", "Gerente de Ventas", "Ejecutivo de Desarrollo de Negocios Jr",
              "Business Developer Junior", "Desarrollador Inmobiliario"]:
        assert not is_dev(t), t


def test_seniority():
    assert seniority("Desarrollador Web Jr") == "junior"
    assert seniority("Becario de Desarrollo de Software") == "intern"
    assert seniority("Software Developer Intern") == "intern"
    assert seniority(".NET Trainee") == "trainee"
    assert seniority("Academia Cobol") == "trainee"
    assert seniority("Especialista Sr. Android") is None
    assert seniority("Software Engineer II (FullStack)") is None
    assert seniority("Technical Lead") is None
    assert seniority("Desarrollador Full Stack") is None
    assert seniority("Desarrollador Full Stack", "Buscamos recién egresados") == "junior"
    assert seniority("Desarrollador", "Recién egresado con 3 años de experiencia") is None
    assert seniority("Frontend Developer", job_level="Entry level") == "junior"


def test_categories_stack_modality():
    assert categories("Desarrollador junior full stack .NET") == ["fullstack"]
    assert categories("Flutter Developer Jr") == ["mobile"]
    assert categories("Desarrollador Junior") == ["software"]
    assert stack("React Native Jr", "Experiencia con TypeScript") == ["React Native", "TypeScript"]
    assert "Java" in stack("Java Jr") and "JavaScript" not in stack("Java Jr")
    assert modality(True) == "remote"
    assert modality(False, "Esquema híbrido") == "hybrid"
    assert modality(False, "Oficina en Polanco") == "onsite"


def test_location_salary():
    assert location("Gustavo A. Madero, DIF, Mexico") == ("Gustavo A. Madero", "Ciudad de México")
    assert location("Ciudad de México, Mexico") == (None, "Ciudad de México")
    assert location("Monterrey, Nuevo León, Mexico") == ("Monterrey", "Nuevo León")
    assert location("Mexico") == (None, None)
    assert monthly_mxn(12000, "monthly", "MXN") == 12000
    assert monthly_mxn(240000, "yearly", "MXN") == 20000
    assert monthly_mxn(float("nan"), "monthly", "MXN") is None


def test_combine_fills_gaps():
    from scraper.cli import combine
    a = {"id": "x", "city": None, "state": None, "salaryMin": None, "summary": "", "stack": ["Java"], "firstSeen": "2026-10-02"}
    b = {"id": "x", "city": "Monterrey", "state": "Nuevo León", "salaryMin": 15000, "summary": "Hola", "stack": ["SQL"], "firstSeen": "2026-10-01"}
    out = combine(a, b)
    assert (out["city"], out["salaryMin"], out["summary"], out["stack"], out["firstSeen"]) == ("Monterrey", 15000, "Hola", ["Java", "SQL"], "2026-10-01")


def test_company_key_and_english_years():
    from scraper.classify import company_key
    assert company_key("IDS Comercial, S.A. de C.V.") == company_key("IDS COMERCIAL") == "ids comercial"
    assert company_key("Stefanini LATAM") == company_key("Stefanini")
    assert company_key("SWBC Mexico") == "swbc"
    assert seniority("Data Engineer", "Requirements: 3+ years of experience with Spark") is None
    assert seniority("Data Engineer", "5 years of professional experience", job_level="Entry level") is None
    assert seniority("Associate Software Engineer") == "junior"
    assert seniority("Software Engineer I - OXM") == "junior"
    assert seniority("Data Engineer Especialista en PySpark", job_level="Entry level") is None
