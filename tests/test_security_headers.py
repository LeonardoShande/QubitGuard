from app.quantum import experiments


def test_security_headers_are_present_on_frontend_and_api(client):
    for path in ("/", "/api/health"):
        headers = client.get(path).headers
        assert "Content-Security-Policy" in headers
        assert headers["X-Content-Type-Options"] == "nosniff"
        assert headers["Referrer-Policy"] == "no-referrer"
        assert headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        assert headers["Cross-Origin-Opener-Policy"] == "same-origin"
        assert headers["X-Frame-Options"] == "DENY"


def test_docs_omits_csp_but_keeps_other_security_headers(client):
    headers = client.get("/docs").headers
    assert "Content-Security-Policy" not in headers
    assert headers["X-Content-Type-Options"] == "nosniff"


def test_cache_control_by_response_type(client):
    cases = (
        ("GET", "/api/health", "no-store"),
        ("POST", "/api/quantum/grover-curve", "no-store"),
        ("GET", "/api/learn/pqc", "public, max-age=3600"),
        ("GET", "/api/quantum/compare", "public, max-age=3600"),
        ("GET", "/api/quantum/capabilities", "public, max-age=3600"),
        ("GET", "/api/challenge/daily?date=2026-10-24", "public, max-age=300"),
        ("GET", "/", "no-cache"),
        ("GET", "/dist/main.js", "no-cache"),
        ("GET", "/styles.css", "no-cache"),
    )
    for method, path, expected in cases:
        response = client.request(method, path, json={"n_qubits": 4} if method == "POST" else None)
        assert response.headers["Cache-Control"] == expected, path


def test_compare_response_is_gzipped_when_requested(client):
    response = client.get("/api/quantum/compare?max_bits=256", headers={"Accept-Encoding": "gzip"})
    assert response.headers["Content-Encoding"] == "gzip"
    assert len(response.content) > 1024


def test_grover_curve_cached_result_is_copy_isolated():
    expected = experiments.grover_curve(4)
    mutated = experiments.grover_curve(4)
    assert mutated == expected
    mutated["iterations"].append(999)
    mutated["probability"][0] = -1
    assert experiments.grover_curve(4) == expected


def test_simulator_busy_returns_503_with_retry_after(client, monkeypatch):
    def busy(**kwargs):
        raise experiments.SimulatorBusy("Simulador ocupado, reintenta")

    monkeypatch.setattr(experiments, "run_grover", busy)
    response = client.post("/api/quantum/grover", json={"n_qubits": 4})
    assert response.status_code == 503
    assert response.json() == {"detail": "Simulador ocupado, reintenta"}
    assert response.headers["Retry-After"] == "2"


def test_only_browser_files_are_public(client):
    for path in ("/", "/styles.css", "/dist/main.js"):
        assert client.get(path).status_code == 200
    for path in ("/src/main.ts", "/package.json", "/tsconfig.json", "/node_modules/typescript/package.json"):
        assert client.get(path).status_code == 404
