"""Genera pitch/QubitGuard_pitch.pptx (8 slides 16:9, solo formas nativas)."""
import math
from pathlib import Path
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt
from lxml import etree

BG, PANEL = RGBColor(0x0A, 0x0B, 0x10), RGBColor(0x14, 0x16, 0x22)
TXT, MUTED = RGBColor(0xE5, 0xE7, 0xEB), RGBColor(0x9C, 0xA3, 0xAF)
CYAN, MAG = RGBColor(0x22, 0xD3, 0xEE), RGBColor(0xE8, 0x79, 0xF9)
SANS, MONO = "Calibri", "Consolas"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)


def new_slide(title=None, n=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    s.background.fill.solid()
    s.background.fill.fore_color.rgb = BG
    if title:
        text(s, 0.6, 0.35, 11.5, 0.9, title, 34, CYAN, True)
        box(s, 0.6, 1.2, 1.2, 0.06, MAG)
        text(s, 12.0, 6.95, 1.0, 0.4, f"{n}/8", 12, MUTED, font=MONO)
    return s


def box(s, x, y, w, h, fill=PANEL, line=None, shape=MSO_SHAPE.RECTANGLE):
    r = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    r.fill.solid()
    r.fill.fore_color.rgb = fill
    if line:
        r.line.color.rgb = line
        r.line.width = Pt(1.5)
    else:
        r.line.fill.background()
    return r


def text(s, x, y, w, h, t, size=18, color=TXT, bold=False, font=SANS):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, line in enumerate(t.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        r = p.add_run()
        r.text = line
        r.font.size, r.font.bold, r.font.name = Pt(size), bold, font
        r.font.color.rgb = color
        p.space_after = Pt(6)
    return tb


def card(s, x, y, w, h, head, body, accent=CYAN, mono=False):
    box(s, x, y, w, h, PANEL, accent)
    text(s, x + 0.2, y + 0.1, w - 0.4, 0.5, head, 20, accent, True)
    text(s, x + 0.2, y + 0.65, w - 0.4, h - 0.7, body, 16, TXT, font=MONO if mono else SANS)


# 1 portada
s = new_slide()
text(s, 0.8, 2.0, 11.5, 1.4, "QubitGuard", 72, CYAN, True, MONO)
box(s, 0.8, 3.5, 2.0, 0.08, MAG)
text(s, 0.8, 3.8, 11.5, 1.2, "Laboratorio educativo de ciberseguridad cuántica\nDe Monte Carlo a Grover, jugando 3 minutos al día", 26, TXT)
text(s, 0.8, 6.3, 11.5, 0.6, "IBM Quantum Hackathon / Qiskit Fall Fest 2026 Lima  |  Reto EdTech IEEE CS PUCP", 16, MUTED, font=MONO)

# 2 problema
s = new_slide("El problema", 2)
card(s, 0.6, 1.6, 5.9, 2.4, "La probabilidad cuántica no se intuye", "Las amplitudes pueden ser negativas y cancelarse; la estadística escolar no lo anticipa.\nFalta algo que el estudiante pueda tocar y comparar contra el azar.", CYAN)
card(s, 6.8, 1.6, 5.9, 2.4, "Una amenaza mal contada", "Se dice «romperá todas las contraseñas». Grover solo da mejora cuadrática; el riesgo real es Shor contra RSA/ECC y los datos que se guardan hoy (harvest now, decrypt later).", MAG)
card(s, 0.6, 4.3, 12.1, 2.0, "Pregunta de adivinar", "Secreto entre N=16 candidatos: Monte Carlo espera (N+1)/2 = 8,5 intentos.\nGrover lo encuentra con 3 iteraciones. ¿Cómo se siente esa diferencia?\nPara quién: desde 14 años, unos 3 minutos al día, sin cuenta IBM ni instalar nada.", CYAN, mono=False)

# 3 mapeo
s = new_slide("Mapeo estadístico a cuántico", 3)
card(s, 0.6, 1.6, 5.9, 2.5, "Monte Carlo (clásico)", "N = 2^n candidatos\nIntentos esperados = (N+1)/2\nCrece como N", CYAN, True)
card(s, 6.8, 1.6, 5.9, 2.5, "Grover (cuántico)", "k = floor(π/4 · √N)\nθ = asin(1/√N)\nP(éxito) = sin²((2k+1)θ)\nCrece como √N", MAG, True)
box(s, 0.6, 4.4, 12.1, 2.2, PANEL, CYAN)
text(s, 0.8, 4.5, 11.7, 2.0, "Ejemplo n=4 (N=16): clásico 8,5 intentos; Grover k=3, P teórica ≈ 96,1 %\nMejora cuadrática, no exponencial.\nEje del reto: distribuciones de probabilidad → superposición y amplitudes.\nMonte Carlo es aquí la referencia clásica: NO implementamos QAE.", 18, TXT, font=MONO)

# 4 demo / arquitectura
s = new_slide("Demo y arquitectura", 4)
parts = [("Frontend", "TypeScript sin frameworks\nni dependencias de runtime\nExplorador y contraseñas\nsolo en el navegador", CYAN),
         ("API FastAPI", "Cabeceras y CSP, caché\ngzip, límite de 2\nsimulaciones ruidosas", MAG),
         ("Motor cuántico", "Qiskit 2.6 + Aer\nRuido FakeFez\nStatevector", CYAN)]
for i, (h, b, c) in enumerate(parts):
    x = 0.6 + i * 4.2
    card(s, x, 1.6, 3.5, 2.4, h, b, c)
    if i < 2:
        a = box(s, x + 3.6, 2.6, 0.5, 0.45, MAG, shape=MSO_SHAPE.RIGHT_ARROW)
text(s, 0.6, 4.4, 12.1, 2.4,
     "Laboratorio Grover 2..6 qubits: Predice, Observa, Explica\n"
     "Explorador de amplitudes en vivo (fórmulas exactas, sin servidor)\n"
     "Tu ruta (5 pasos) | Reto diario | Azar frente a Grover | Tu contraseña\n"
     "CLI scripts/run_ibm_hardware.py: fake | dry-run | ibm | --job-id\n"
     "Calidad: 67 pruebas pytest, 36 de frontend, objetivo WCAG 2.2 AA", 17, TXT, font=MONO)

# 5 por qué Qiskit (gráfica)
s = new_slide("Por qué Qiskit", 5)
text(s, 0.6, 1.5, 5.0, 4.9,
     "Qiskit 2.6: circuitos oráculo + difusor, que se ejecutan\nQiskit Aer: disparos y ruido\nFakeFez: ruido simulado de un backend IBM (no es hardware real)\nStatevector: curva exacta sin²\ntranspile: profundidad y puertas de 2 qubits\nqiskit-ibm-runtime: CLI listo para hardware, aún sin ejecutar", 16, TXT)
cd = CategoryChartData()
ns = list(range(2, 21))
cd.categories = [str(n) for n in ns]
cd.add_series("Intentos clásicos (N+1)/2", [(2 ** n + 1) / 2 for n in ns])
cd.add_series("Iteraciones Grover", [max(1, math.floor(math.pi / 4 * math.sqrt(2 ** n))) for n in ns])
gf = s.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(5.8), Inches(1.5), Inches(7.1), Inches(5.2), cd)
ch = gf.chart
ch.has_legend, ch.legend.position, ch.legend.include_in_layout = True, XL_LEGEND_POSITION.BOTTOM, False
ch.legend.font.color.rgb = TXT
ch.has_title = True
ch.chart_title.text_frame.text = "Qubits n (eje x), escala log (eje y)"
ch.chart_title.text_frame.paragraphs[0].runs[0].font.size = Pt(14)
ch.chart_title.text_frame.paragraphs[0].runs[0].font.color.rgb = MUTED
for ser, col in zip(ch.plots[0].series, (CYAN, MAG)):
    ser.format.line.color.rgb, ser.format.line.width, ser.smooth = col, Pt(3), False
for ax in (ch.category_axis, ch.value_axis):
    ax.tick_labels.font.color.rgb = MUTED
    ax.tick_labels.font.size = Pt(11)
ch.value_axis.major_gridlines.format.line.color.rgb = RGBColor(0x2A, 0x2D, 0x3A)
sc = ch.value_axis._element.find(qn("c:scaling"))
lb = etree.SubElement(sc, qn("c:logBase"))
lb.set("val", "10")
sc.remove(lb)
sc.insert(0, lb)

# 6 ruido NISQ: medido en FakeFez con el CLI (gráfica de columnas)
s = new_slide("El ruido borra la amplificación", 6)
text(s, 0.6, 1.5, 5.0, 5.2,
     "Mismo circuito del laboratorio, medido con el CLI en FakeFez (seed 7, 1024 disparos).\n"
     "n=3: profundidad 137, 39 puertas de 2 qubits, éxito 0,802.\n"
     "n=6: profundidad 4447, 1706 puertas, éxito 0,0166, igual que el azar (0,0156).\n"
     "Al crecer el circuito, el ruido NISQ borra la ventaja.\n"
     "Simulación: NO se ejecutó en hardware real. El CLI (dry-run / ibm) está listo; falta una cuenta.", 16, TXT)
cd = CategoryChartData()
cd.categories = ["n=3 (101)", "n=4 (1010)", "n=5 (10101)", "n=6 (101010)"]
cd.add_series("Ideal (teoría)", [0.945, 0.961, 0.999, 0.997])
cd.add_series("Medido en FakeFez", [0.802, 0.662, 0.184, 0.0166])
cd.add_series("Azar 1/N", [0.125, 0.0625, 0.031, 0.0156])
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Inches(5.8), Inches(1.5), Inches(7.1), Inches(5.2), cd)
ch = gf.chart
ch.has_legend, ch.legend.position, ch.legend.include_in_layout = True, XL_LEGEND_POSITION.BOTTOM, False
ch.legend.font.color.rgb = TXT
ch.has_title = True
ch.chart_title.text_frame.text = "Probabilidad de acertar (simulación FakeFez, no QPU)"
ch.chart_title.text_frame.paragraphs[0].runs[0].font.size = Pt(14)
ch.chart_title.text_frame.paragraphs[0].runs[0].font.color.rgb = MUTED
for ser, col in zip(ch.plots[0].series, (CYAN, MAG, MUTED)):
    ser.format.fill.solid()
    ser.format.fill.fore_color.rgb = col
for ax in (ch.category_axis, ch.value_axis):
    ax.tick_labels.font.color.rgb = MUTED
    ax.tick_labels.font.size = Pt(11)
ch.value_axis.maximum_scale = 1.0
ch.value_axis.major_gridlines.format.line.color.rgb = RGBColor(0x2A, 0x2D, 0x3A)

# 7 limitaciones y validación
s = new_slide("Validación y limitaciones", 7)
card(s, 0.6, 1.6, 5.9, 4.8, "Medido (semilla fija)", "Grover n=4, k=3, 2048 disparos:\nmedido 0,953 vs teórico 0,961\nCurva Statevector vs fórmula: error 6e-14\nMonte Carlo 10 bits: media 513,3 vs 512,5\nFakeFez (CLI): 0,802 con n=3, 0,0166 con n=6\n67 pruebas pytest, 36 de frontend", CYAN, mono=True)
card(s, 6.8, 1.6, 5.9, 4.8, "Limitaciones honestas", "Ruido simulado (FakeFez): sin hardware real.\nGrover es mejora cuadrática; no rompe AES hoy.\nSimulación hasta 6 qubits; no hay QAE.\nEl oráculo ya conoce la respuesta.\nPiloto con usuarios y retención: pendientes.", MAG)

# 8 impacto / cierre
s = new_slide("Impacto EdTech", 8)
for i, (v, l, c) in enumerate([("14+", "años", CYAN), ("~3 min", "uso diario", MAG), ("5 pasos", "6 logros, racha, XP", CYAN)]):
    x = 0.6 + i * 4.2
    box(s, x, 1.6, 3.7, 2.2, PANEL, c)
    text(s, x + 0.2, 1.8, 3.3, 1.0, v, 36, c, True, MONO)
    text(s, x + 0.2, 3.0, 3.3, 0.6, l, 20, TXT)
text(s, 0.6, 4.1, 12.1, 1.2, "Predice, Observa, Explica: te comprometes antes de mirar.\nMonte Carlo adivina. Grover amplifica. 3 minutos al día.", 24, TXT, True)
text(s, 0.6, 5.2, 12.1, 0.7, "Explorador de amplitudes en vivo y generador de contraseñas local (CSPRNG, sin semilla): 128 bits = 64 efectivos frente a Grover.", 16, MUTED)
text(s, 0.6, 6.0, 12.1, 0.9, "Equipo: TODO (nombre del equipo)  |  Integrantes: TODO  |  Repo: TODO", 16, MUTED, font=MONO)

out = Path(__file__).with_name("QubitGuard_pitch.pptx")
prs.save(out)
print("guardado", out)
