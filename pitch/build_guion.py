"""Genera pitch/GUION_EXPOSICION.docx (guion hablado de 4 expositores).

Uso: .venv/bin/python pitch/build_guion.py
Estructura fija: pitch/OUTLINE_PRESENTACION.md. Las palabras del guion hablado se
cuentan por estilo de párrafo ("Guion" y "GuionCorto"); los tiempos de las tablas
salen de ese conteo a 140 palabras por minuto.
"""
from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path(__file__).with_name("GUION_EXPOSICION.docx")
WPM = 140
NAVY = RGBColor(0x1F, 0x3A, 0x5F)
GREY = RGBColor(0x55, 0x5F, 0x6B)
CONTENT_CM = 17.0  # A4 con márgenes de 2 cm

# Color suave del encabezado por expositor, y color de la barra lateral.
SPK = {
    "A": ("DCE9F7", "2F6DB5", "Contexto y cierre"),
    "B": ("E6DFF3", "6B4FA3", "Qiskit y física"),
    "C": ("DDF1E4", "2E8B57", "La aplicación"),
    "D": ("FCEBCF", "C9801A", "Hardware, seguridad y validación"),
}

# --------------------------------------------------------------------------
# CONTENIDO. Cada slide: n, título, expositor, pantalla, guion (párrafos),
# pausa (segundos de clics que no se hablan), nota (indicación), demo (pasos,
# plan B), puente, preguntas [(P, R)].
# **negrita** marca énfasis para la lectura en voz alta.
# --------------------------------------------------------------------------
SLIDES = [
    dict(n=1, titulo="QubitGuard", spk="A", star=True,
         pantalla="Logo ASCII de IBM y el nombre QubitGuard (captura 01_intro o 02_inicio).",
         nota="Cada integrante dice su nombre y su rol en una frase antes de empezar.",
         guion=[
             "Hola, somos el equipo de QubitGuard. Un reto rápido: piensen en un número secreto entre uno y dieciséis. Si yo tuviera que adivinarlo al azar, necesitaría en promedio **ocho intentos y medio**. Un algoritmo cuántico llamado Grover lo encuentra con solo **tres iteraciones** y una probabilidad cercana al 96 por ciento.",
             "Pero no queremos que nos crean: queremos que lo comprueben. En QubitGuard primero **apuestas** qué va a pasar, después ejecutas un circuito real hecho con Qiskit, la herramienta de IBM para programar computadoras cuánticas, y recién ahí ves si tu intuición acertó.",
         ],
         puente="Para entender por qué hace falta algo así, miremos primero el problema que vimos en el reto.",
         preguntas=[
             ("¿Necesito una cuenta de IBM para usarlo?",
              "No. Todo corre en simuladores locales, sin cuenta y sin instalar nada en el navegador. La cuenta solo haría falta para el programa de línea de comandos que envía un circuito a hardware real."),
             ("¿Es un juego o una herramienta?",
              "Una herramienta educativa con elementos de juego, como experiencia y racha. Los resultados son circuitos reales de Qiskit, no animaciones."),
         ]),
    dict(n=2, titulo="El reto y el problema", spk="A", star=True,
         pantalla="Sección «El problema» de la app (captura 03_problema).",
         guion=[
             "El reto 5.3 de EdTech pide enseñar estadística con computación cuántica. Elegimos pasar de las **distribuciones de probabilidad** a la **superposición y las amplitudes**. Y aquí aparece el primer problema. En la estadística del colegio, una probabilidad nunca es negativa. En cuántica trabajamos con amplitudes, que sí pueden ser negativas, y por eso a veces se **cancelan** entre sí. Nada en el colegio nos prepara para eso, y una fórmula en la pizarra no se vuelve intuición.",
             "El segundo problema es la seguridad. La amenaza cuántica suele contarse con alarmismo, tipo «romperá todas las contraseñas», o con fórmulas que nadie comprueba. Nuestra respuesta es **aprender midiendo, no memorizando**.",
         ],
         puente="Antes de seguir, les cuento lo mínimo de computación cuántica que necesitamos.",
         preguntas=[
             ("¿Qué par de conceptos del reto cubren?",
              "Distribuciones de probabilidad hacia superposición y amplitudes. Además comparamos el costo de una búsqueda Monte Carlo con el de Grover. No implementamos estimación cuántica de amplitud."),
             ("¿No exageran cuando dicen que hay alarmismo?",
              "Hablamos de cómo suele contarse: Grover da una ventaja solo cuadrática, y el riesgo concreto es para RSA y curvas elípticas por el algoritmo de Shor. Eso lo explica D."),
         ]),
    dict(n=3, titulo="Lo mínimo de computación cuántica", spk="A", star=False,
         pantalla="Diagrama propio: barras de amplitud o esfera simplificada de un qubit.",
         guion=[
             "Antes de seguir, lo mínimo que necesitan saber. Un bit vale cero o uno, como una moneda que ya cayó. Un qubit, antes de medirlo, se parece a una moneda girando: está en **superposición**, una combinación de cero y uno descrita por dos números llamados **amplitudes**.",
             "Una amplitud puede ser positiva o negativa. Piensen en olas en un estanque: dos olas pueden sumarse o anularse. Cuando medimos, la moneda cae y obtenemos un cero o un uno, y la probabilidad de cada uno es su **amplitud al cuadrado**. Si las dos amplitudes valen cerca de 0,7, cada resultado sale la mitad de las veces. Con n qubits hay N igual a dos a la n resultados posibles.",
         ],
         puente="Con esa base, B les cuenta con qué herramienta de IBM construimos todo.",
         preguntas=[
             ("¿Superposición significa estar en 0 y en 1 a la vez?",
              "Es una forma popular de decirlo, pero imprecisa. Mejor: el estado es una combinación de cero y uno con amplitudes, y al medir sale uno solo, con probabilidad igual a la amplitud al cuadrado."),
             ("¿Por qué una amplitud puede ser negativa?",
              "Porque se comporta como una onda: el signo permite que dos caminos se cancelen. La probabilidad, que es la amplitud al cuadrado, nunca es negativa."),
         ]),
    dict(n=4, titulo="¿Qué es Qiskit?", spk="B", star=True,
         pantalla="Diagrama de flujo: construir, transpilar, ejecutar, medir.",
         guion=[
             "Gracias, A. Soy B. Qiskit es el kit de herramientas de IBM, de **código abierto**, para programar computadoras cuánticas desde Python. Un programa se llama **circuito**: una secuencia de puertas, que son operaciones sobre los qubits, y al final una medición.",
             "El flujo tiene cuatro pasos. Se **construye** el circuito. Se **transpila**, que es traducirlo a las puertas y conexiones de un chip concreto, como adaptar una receta a los utensilios de una cocina específica. Se **ejecuta**, en un simulador llamado Aer o en un procesador real a través de Qiskit Runtime. Y se **miden** los resultados. Todo lo que verán usa estas piezas: no es una animación.",
         ],
         puente="Y ahora la pregunta central: ¿qué ventaja le da Grover a una búsqueda frente al azar?",
         preguntas=[
             ("¿Qué es transpilar?",
              "Adaptar el circuito a lo que sabe hacer un chip: las puertas que admite y qué qubits están conectados entre sí. Después de transpilar medimos la profundidad y las puertas de dos qubits."),
             ("¿Qiskit es gratis?",
              "Sí, es de código abierto. Usar un procesador real de IBM requiere una cuenta y tiene cuota; el plan gratuito es limitado."),
         ]),
    dict(n=5, titulo="De Monte Carlo a Grover", spk="B", star=True,
         pantalla="Gráfico clásico frente a Grover en escala logarítmica (o captura 06_azar).",
         guion=[
             "¿Cuántos intentos hacen falta para encontrar un secreto entre N posibilidades? Con búsqueda **Monte Carlo**, probando candidatos al azar sin repetir, en promedio hacen falta N más uno, dividido entre dos. Si N se duplica, el trabajo se duplica.",
             "Grover empieza con todos los estados con la misma amplitud y en cada iteración la inclina hacia la respuesta: le bastan unas pi cuartos por raíz de N iteraciones. Con N igual a dieciséis, ocho intentos y medio contra **tres** iteraciones. Si cuadruplicamos N, Grover solo duplica su trabajo. Es una mejora **cuadrática**: muy buena, pero ni mágica ni exponencial.",
         ],
         puente="Veamos cómo se construye eso por dentro, bloque por bloque.",
         preguntas=[
             ("¿Grover es exponencialmente más rápido?",
              "No. La mejora es cuadrática: de N a raíz de N consultas. Es muy útil, pero por eso duplicar los bits de una clave devuelve el margen de seguridad."),
             ("¿Por qué N más uno entre dos y no N entre dos?",
              "Porque el número de intentos hasta encontrar el secreto es uniforme entre 1 y N, y su promedio es la suma de los extremos dividida entre dos."),
         ]),
    dict(n=6, titulo="Grover paso a paso", spk="B", star=False,
         pantalla="Captura 05_circuito y esquema de tres bloques: H, oráculo, difusor.",
         guion=[
             "¿Cómo se ve eso dentro del circuito? Tres bloques. Primero, puertas Hadamard sobre todos los qubits: crean la **superposición uniforme**, la misma amplitud para cada estado. Segundo, el **oráculo**: una caja que reconoce el estado marcado y le cambia el signo a su amplitud. Aquí lo construimos nosotros, porque sabemos el secreto.",
             "Tercero, el **difusor**, que refleja todas las amplitudes respecto a su promedio. Imaginen barras de igual altura: el oráculo da vuelta una hacia abajo, el promedio baja un poquito y, al reflejar, esa barra queda más alta que las demás. Ese par, oráculo y difusor, se repite k veces.",
         ],
         puente="Y hay un detalle importante: repetir más veces no siempre es mejor.",
         preguntas=[
             ("¿No es trampa que el oráculo ya conozca la respuesta?",
              "Es una simplificación que declaramos. En un ataque real habría que codificar la función hash o el cifrado como circuito cuántico, mucho más grande. Aquí solo ilustramos la mecánica de Grover."),
             ("¿Qué hace exactamente el difusor?",
              "Refleja cada amplitud respecto al promedio de todas. Lo que quedó por debajo del promedio, como la amplitud negativa del marcado, sube."),
         ]),
    dict(n=7, titulo="La curva sin²", spk="B", star=False,
         pantalla="Captura 04_laboratorio_resultado: curva de probabilidad por iteraciones.",
         guion=[
             "Si cada iteración ayuda, ¿por qué no hacer muchas? Porque la probabilidad de acertar con k iteraciones es **seno cuadrado de dos k más uno, por un ángulo theta** que depende de N. Sube hasta un máximo y luego baja. Es como hornear una galleta: poco tiempo, cruda; demasiado, quemada.",
             "Cada iteración gira el estado un ángulo fijo, y si nos pasamos, giramos más allá de la respuesta. Con 4 qubits el óptimo es 3. Calculamos esta curva con Qiskit de forma exacta, con Statevector, y coincide con la fórmula con un error máximo de **6 por 10 a la menos 14**, de 2 a 6 qubits.",
         ],
         puente="Pasemos de la teoría a la práctica: C les muestra la aplicación funcionando.",
         preguntas=[
             ("¿Cómo saben cuántas iteraciones usar?",
              "El óptimo es la parte entera de pi entre cuatro theta, con theta igual al arcoseno de uno sobre raíz de N. Para 4 qubits da 3, con 96,1 por ciento teórico."),
             ("¿Qué es Statevector?",
              "Una herramienta de Qiskit que calcula el estado cuántico exacto del circuito, sin ruido de muestreo. Por eso la curva es ideal aunque el histograma use ruido."),
         ]),
    dict(n=8, titulo="Recorrido por la app", spk="C", star=False, pausa=5,
         pantalla="App abierta en Inicio (captura 02_inicio con anotaciones).",
         guion=[
             "Gracias, B. Soy C y les muestro la aplicación real. Arriba, la barra reúne todas las secciones y, a la derecha, están nuestro nivel, la experiencia y la racha de días. En Inicio, un control de bits muestra cómo se separan los intentos al azar y las iteraciones de Grover. En «El problema» resumimos para quién es y qué evidencia tenemos. En «Tu ruta» hay cinco pasos guiados y seis logros, y en «Reto diario», una pregunta nueva cada día. Hoy nos quedamos en el laboratorio.",
         ],
         demo=dict(
             pasos=[
                 "Con la app ya cargada en http://127.0.0.1:8000, si aparece la intro con el logo de IBM, saltarla con un clic o con Esc.",
                 "Señalar la cabecera: «Nivel», la barra de XP y «días de racha».",
                 "En Inicio, mover el control «Si el secreto tiene … bits» y señalar «Intentos al azar» y «Iteraciones de Grover».",
                 "Clic en «El problema» en la barra superior; leer solo la frase «Aprender midiendo, no memorizando».",
                 "Clic en «Tu ruta»: señalar los cinco pasos y el recuadro «Logros».",
                 "Clic en «Reto diario»: señalar la pregunta del día y «Racha actual». Luego clic en «Laboratorio Grover».",
             ],
             planb="Mostrar la slide 8 (captura 02_inicio con anotaciones) y señalar con la mano cada zona mientras se dice el mismo texto. Si la app se cae, no pedir disculpas: «Les dejo la captura de la misma pantalla».",
         ),
         puente="Empecemos por el laboratorio, donde nace la idea de Predice, Observa, Explica.",
         preguntas=[
             ("¿Se guarda mi progreso? ¿Necesito crear cuenta?",
              "No hay cuentas ni base de datos. El progreso vive en el almacenamiento del navegador; si se borran los datos del sitio, se pierde."),
             ("¿Cuántas secciones tiene la app?",
              "La barra superior tiene nueve enlaces, de «El problema» a «Limitaciones», además del Inicio con «Explora la escala». Hoy mostramos las que cuentan la historia."),
         ]),
    dict(n=9, titulo="Predice → Observa → Explica", spk="C", star=True, pausa=10,
         pantalla="Laboratorio Grover con la predicción y luego el panel de resultados (capturas 04_laboratorio_prediccion y 04_laboratorio_resultado).",
         nota="Leer en pantalla el valor medido: cambia un poco entre ejecuciones. En nuestras pruebas con 4 qubits, estado 1010 y 2048 disparos salió 0,953 frente a 0,961 teórico.",
         guion=[
             "Esta es la idea pedagógica: **Predice, Observa, Explica**. Elijo 4 qubits y escondo el estado uno cero cero cero. Antes de ejecutar me comprometo: ¿con qué probabilidad saldrá? Digamos que sesenta por ciento. El azar daría uno entre dieciséis, poco más de seis.",
             "Pulso Ejecutar circuito. Qiskit construye el oráculo, aplica las tres iteraciones óptimas y mide 2048 veces. Aparecen tres números: lo que **predije**, la **teoría**, noventa y seis por ciento, y lo **medido**, cerca de noventa y cinco. Mi intuición se quedó corta, y ahí está el aprendizaje: pensar sobre lo que creemos saber se llama **metacognición**. Cuanto más cerca mi predicción, más experiencia, o XP, gano.",
         ],
         demo=dict(
             pasos=[
                 "Sección «Laboratorio Grover»: mover «Qubits» a 4.",
                 "En «Estado marcado» escribir 1010 (o pulsar «Aleatorio»).",
                 "Dejar marcada la casilla «Usar el óptimo (3)» y poner «Disparos (shots)» en 2048. Dejar apagado el interruptor «Ruido de un procesador IBM (FakeFez)».",
                 "En «Tu predicción» elegir «Probabilidad de acertar» y mover el control a unos 60 %; decir la predicción en voz alta.",
                 "Clic en «Ejecutar circuito».",
                 "En el panel «Predice, observa, explica» señalar y leer «Predijiste», «Teoría» y «Medido». Leer una línea de la explicación y señalar la XP que sube en la cabecera.",
                 "Opcional si sobra tiempo: abrir «Ver el circuito» y señalar «Probabilidad medida», «Profundidad» y «Puertas de 2 qubits».",
             ],
             planb="Mostrar las capturas de la slide 9 (04_laboratorio_prediccion y 04_laboratorio_resultado) y decir los mismos números leyéndolos de la imagen: «En la captura vemos que...».",
         ),
         puente="Pero ¿por qué sube esa probabilidad? Eso se ve mejor moviéndolo en vivo.",
         preguntas=[
             ("¿Por qué pedir la predicción antes de ejecutar?",
              "Porque si ves el resultado primero, tu cabeza dice «ya lo sabía». Comprometerte antes te muestra dónde falla tu intuición. Es el principio de Predice, Observa, Explica."),
             ("¿Se gana XP aunque la predicción esté lejos?",
              "La experiencia depende de qué tan cerca estuvo la predicción, con un tope de cinco predicciones puntuables por día."),
         ]),
    dict(n=10, titulo="Explorador de amplitudes en vivo", spk="C", star=False, pausa=5,
         pantalla="Sección «Explorador de amplitudes» (captura 07_explorador).",
         guion=[
             "Para ver por qué sube esa probabilidad, voy a Amplitudes. Todo se recalcula en el navegador con fórmulas exactas. Las barras son las **amplitudes** de cada estado y la línea es su **media**. Pulso Siguiente iteración: primero el oráculo da vuelta la barra del marcado y luego el difusor refleja todo respecto a la media, y esa barra crece.",
             "A la derecha, la flecha del estado gira un ángulo fijo por iteración. Si paso del óptimo, la flecha pasa de largo y la probabilidad baja. Una aclaración honesta: esta sección usa la fórmula, no ejecuta Qiskit; la fórmula la comprobamos contra Qiskit.",
         ],
         demo=dict(
             pasos=[
                 "Clic en «Amplitudes» en la barra superior.",
                 "Si aparece el cuadro «Primero, predice», pulsar «Explorar sin predecir». (Si ya se predijo en el laboratorio, ya está abierto.)",
                 "Dejar «Qubits» en 4 e «Iteraciones» en 0. Señalar las barras y la línea «media».",
                 "Pulsar «Siguiente iteración» una vez y mirar el paso del oráculo y luego el del difusor.",
                 "Pulsar «Siguiente iteración» hasta k = 3 (el óptimo): leer «Grover» frente a «Al azar con k consultas».",
                 "Mover «Iteraciones» a 5 o 6: la probabilidad baja y la flecha pasa de largo. Terminar con «Volver a k = 0».",
             ],
             planb="Mostrar la captura 07_explorador de la slide 10 y explicar con el puntero: barras de amplitud, línea de la media, flecha que gira. Decir que en vivo se mueve con los controles de iteraciones.",
         ),
         puente="Hasta aquí todo era ideal. ¿Qué pasa cuando el circuito corre en un chip de verdad, con ruido?",
         preguntas=[
             ("¿El explorador ejecuta un circuito de Qiskit?",
              "No: calcula con las fórmulas exactas en el navegador, sin servidor, y lo decimos en pantalla. Su fidelidad la comprobamos contra Qiskit de 2 a 6 qubits, con un error máximo de 6,15 por 10 a la menos 14."),
             ("¿Por qué pide primero una predicción?",
              "Porque la comparación enseña más cuando hay un compromiso previo. Igual se puede abrir con «Explorar sin predecir»."),
         ]),
    dict(n=11, titulo="El ruido borra la amplificación", spk="C", star=True, pausa=10,
         pantalla="Gráfico propio con la tabla n = 3 a 6 y captura 08_ruido.",
         nota="Las cifras dichas son las del programa de línea de comandos (FakeFez, 1024 disparos, semilla 7). La app puede dar valores parecidos pero no idénticos: leer la pantalla.",
         guion=[
             "Hasta aquí todo era ideal, pero los chips reales tienen **ruido**: cada puerta se equivoca un poquito. Activo el ruido de un procesador IBM llamado **FakeFez**, un modelo simulado a partir de datos de un chip real. Con 3 qubits el circuito es corto y el éxito sigue cerca de **0,80**, muy por encima del azar.",
             "Subo a 6 qubits. El circuito se vuelve larguísimo: la profundidad pasa de 137 a 4447 y las puertas de dos qubits, de 39 a 1706. El éxito baja a **0,017**, casi igual que adivinar, que es 0,016. Esta es la realidad de los chips NISQ, ruidosos y de tamaño intermedio: más grande no siempre es mejor.",
         ],
         demo=dict(
             pasos=[
                 "Volver a «Laboratorio Grover». Bajar «Disparos (shots)» a 256 para que las ejecuciones sean rápidas.",
                 "Activar el interruptor «Ruido de un procesador IBM (FakeFez)».",
                 "Con «Qubits» en 3 (estado de 3 bits, por ejemplo 101) y el óptimo marcado, clic en «Ejecutar circuito». Leer «Probabilidad medida», «Profundidad» y «Puertas de 2 qubits».",
                 "Subir «Qubits» a 6, escribir un «Estado marcado» de 6 bits (por ejemplo 101010) y clic en «Ejecutar circuito». Puede tardar unos segundos: llenar con la explicación.",
                 "Señalar «Profundidad», «Puertas de 2 qubits» y comparar «Probabilidad medida» con la referencia del azar, 1/N. Mostrar el histograma casi plano.",
             ],
             planb="Mostrar la slide 11: el gráfico con la tabla n = 3 a 6 y la captura 08_ruido. Decir las cifras leyéndolas de la tabla: éxito 0,802, 0,662, 0,184 y 0,0166 frente al azar.",
         ),
         puente="Con ese ruido en mente, D les cuenta qué hace falta para llevar este circuito a una computadora cuántica real de IBM.",
         preguntas=[
             ("¿Ese ruido es de hardware real?",
              "No. FakeFez es un modelo local basado en datos de calibración de un procesador IBM. Ilustra el efecto del ruido, no mide un dispositivo."),
             ("¿Por qué cae tanto de 3 a 6 qubits?",
              "Porque el circuito crece mucho: descomponer y enrutar las puertas multicontroladas en la topología del chip multiplica las puertas de dos qubits, y cada puerta acumula error. Además, los modos no usan exactamente la misma optimización, así que no aislamos el ruido por completo."),
         ]),
    dict(n=12, titulo="Hacia una computadora cuántica real de IBM", spk="D", star=False,
         pantalla="Diagrama: laptop, IBM Quantum Platform, procesador cuántico, resultados.",
         guion=[
             "Gracias, C. Soy D. ¿Y en un chip real? Dejamos el camino listo. Un programa de línea de comandos usa **el mismo circuito** del laboratorio, lo transpila para el chip elegido y lo envía con **SamplerV2**, la primitiva de Qiskit Runtime que ejecuta circuitos y devuelve conteos.",
             "IBM lo recibe como un **job**, un trabajo que entra a una cola, como imprimir en una copistería con fila, y devuelve un identificador para recuperar el resultado. Tiene tres modos: fake, sin cuenta; dry-run, que solo prepara y revisa; e ibm, que sí envía. Pero seamos claros: **todavía no hemos enviado ningún job real**.",
         ],
         puente="Y mientras llega ese primer job, hablemos de lo que sí importa hoy: tus contraseñas.",
         preguntas=[
             ("¿Lo ejecutaron en un chip real?",
              "No, y lo decimos. Medimos en FakeFez. No había una cuenta configurada con cuota; el programa y la guía ya están listos para enviar el primer job."),
             ("¿Cómo protegen la clave de IBM?",
              "El programa no acepta la clave por argumento ni la guarda: se usa una cuenta guardada por el usuario o variables de entorno, y los mensajes de error no la muestran."),
         ]),
    dict(n=13, titulo="Contraseñas y criptografía poscuántica", spk="D", star=False,
         pantalla="Capturas 09_generador y 10_pqc: generador de contraseñas y tarjetas poscuánticas.",
         nota="Si hay tiempo y la app está abierta, mostrar «Genera tu contraseña» (modo «Frase de palabras») y la sección «Poscuántica». No es obligatorio.",
         guion=[
             "Ahora, la seguridad. La fortaleza de una contraseña se mide en bits de **entropía**: cuánta aleatoriedad tiene. Cada bit extra duplica las posibilidades. En el caso idealizado, Grover reduce a la mitad los bits efectivos: 128 pasan a ser unos 64. Por eso nuestra meta educativa es **128 o más**, y la app genera contraseñas con el generador aleatorio seguro del navegador, sin semilla.",
             "Pero el riesgo cuántico más serio es otro: el algoritmo de **Shor** rompería RSA y la criptografía de curvas elípticas, en una computadora cuántica grande y con corrección de errores que todavía no existe. Por eso el NIST, la agencia de estándares de Estados Unidos, ya publicó reemplazos como **ML-KEM** y **ML-DSA**, y hoy se habla de guardar datos cifrados para descifrarlos mañana.",
         ],
         puente="Veamos ahora cómo está armado todo esto y cómo cuidamos esos datos.",
         preguntas=[
             ("¿Shor también rompe AES?",
              "No. Shor ataca RSA y curvas elípticas. Contra AES, Grover da solo una ventaja cuadrática: con claves de 256 bits quedan unos 128 bits de seguridad idealizada."),
             ("¿El medidor de contraseñas es una certificación?",
              "No. Es un estimador heurístico basado en longitud y tipos de caracteres; puede sobreestimar contraseñas predecibles. La meta de 128 bits es educativa."),
         ]),
    dict(n=14, titulo="Arquitectura y seguridad", spk="D", star=False,
         pantalla="Diagrama de arquitectura propio: navegador, FastAPI, Qiskit.",
         guion=[
             "¿Y cómo está armado? Simple, a propósito. Un **solo proceso**, FastAPI, sirve tanto la API, la parte que ejecuta Qiskit, como la página web. El frontend está escrito en TypeScript y no usa librerías externas al ejecutarse, así hay menos superficie de ataque. Y lo más importante: **ninguna contraseña sale del navegador**. Ningún endpoint la recibe, y pruebas automáticas lo comprueban. Una política de seguridad, llamada CSP, impide cargar código de terceros. Y funciona sin internet, útil si el salón tiene mala conexión.",
         ],
         puente="¿Y cómo sabemos que todo esto funciona? Eso es lo que sigue.",
         preguntas=[
             ("¿Por qué sin frameworks en el frontend?",
              "Menos superficie de ataque y menos mantenimiento; el código es legible. Con TypeScript compilado basta, y el código compilado va en el repositorio para que la demo arranque sin Node."),
             ("¿La API recibe alguna contraseña?",
              "No. Los cuerpos de las peticiones rechazan campos extra y ninguna ruta tiene un campo de contraseña; una prueba lo verifica."),
         ]),
    dict(n=15, titulo="Validación y limitaciones", spk="D", star=True,
         pantalla="Tabla de cifras medidas y lista de límites.",
         guion=[
             "¿Cómo sabemos que funciona? Tenemos **72 pruebas de Python y 37 de frontend**, y todas pasan. Con 4 qubits, 3 iteraciones y 2048 disparos, Grover dio **0,953** de éxito frente a 0,961 teórico. Y el Monte Carlo de 10 bits, con 5000 ensayos, dio una media de 513,3 frente a 512,5 esperado.",
             "Ahora, lo que no hicimos. **No ejecutamos en hardware real**: el ruido es simulado. **No hicimos el piloto con estudiantes**, así que no afirmamos mejoras de aprendizaje. El oráculo ya conoce la respuesta, la ventaja es solo cuadrática y no implementamos estimación cuántica de amplitud. Mejor decirlo nosotros.",
         ],
         puente="Con eso, A cierra con el impacto educativo y lo que sigue.",
         preguntas=[
             ("¿Qué evidencia tienen de que los estudiantes aprenden?",
              "Ninguna medida todavía. Validamos la corrección técnica, no el aprendizaje. El piloto con estudiantes es el primer paso pendiente."),
             ("¿Qué falta por validar?",
              "Un job en hardware real, el piloto en aula, y un estudio controlado del ruido con el mismo circuito transpilado con y sin modelo de ruido."),
         ]),
    dict(n=16, titulo="Impacto EdTech y cierre", spk="A", star=True,
         pantalla="Captura 11_reto_diario y llamada a la acción.",
         guion=[
             "Gracias, D. Cierro yo. QubitGuard es para estudiantes **desde 14 años**: solo piden fracciones, porcentajes y la idea de probabilidad. La propuesta es usarlo **unos 3 minutos al día**. ¿Por qué volver? Hay un reto nuevo cada día, una racha que no quieres perder, experiencia y logros. No buscamos algo adictivo, sino un hábito corto en el que siempre te comprometes antes de mirar.",
             "Somos honestos: la retención todavía no está medida. Lo siguiente es un piloto en aula y enviar un primer job a un chip real de IBM. **Monte Carlo adivina. Grover amplifica.** Predice, mira y compruébalo. Muchas gracias.",
         ],
         puente="Cierre: sonreír, agradecer y abrir a preguntas («Con gusto respondemos»). Responde quien tenga el bloque de la pregunta.",
         preguntas=[
             ("¿Cuál es el siguiente paso concreto?",
              "Enviar un job de 3 qubits a un procesador IBM real con nuestro programa y compararlo con FakeFez, y hacer un piloto en aula para medir comprensión y retención."),
             ("¿Sirve para un docente?",
              "Sí: puede pedir una predicción, cambiar una sola condición y pedir que expliquen la diferencia. También sirve como actividad semanal de clase."),
         ]),
]

# Versión corta (slides ★). (n, expositor, guion)
SHORT = [
    (1, "A", "Hola, somos el equipo de QubitGuard. Piensen en un número entre uno y dieciséis: al azar se adivina en ocho intentos y medio; con el algoritmo cuántico de Grover bastan tres iteraciones. Pero aquí no te lo contamos: primero apuestas, después ejecutas un circuito real de Qiskit y lo compruebas."),
    (2, "A", "El reto pide enseñar estadística con computación cuántica, y hay dos problemas. La probabilidad cuántica no se intuye, porque las amplitudes pueden ser negativas y cancelarse. Y la amenaza cuántica a las contraseñas suele contarse con alarmismo. Nuestra respuesta: aprender midiendo."),
    (4, "B", "Todo está hecho con Qiskit, el kit de código abierto de IBM. Se construye un circuito, se transpila, es decir, se traduce a las puertas de un chip concreto, se ejecuta y se miden los resultados. No es una animación: son circuitos que de verdad se ejecutan."),
    (5, "B", "Adivinar un secreto entre N posibilidades al azar cuesta, en promedio, N más uno entre dos intentos. Grover amplifica la amplitud de la respuesta y necesita unas pi cuartos por raíz de N iteraciones. Con N igual a dieciséis: ocho intentos y medio contra tres. Una ventaja cuadrática: fuerte, pero no mágica."),
    (9, "C", "Esta es nuestra metodología: Predice, Observa, Explica. Elijo 4 qubits y un estado secreto, y antes de ejecutar me comprometo con una predicción, digamos sesenta por ciento. Pulso Ejecutar circuito y veo tres números: lo que predije, la teoría, noventa y seis por ciento, y lo medido, cerca de noventa y cinco. Si me equivoqué, ahí aprendo."),
    (11, "C", "Un chip real tiene ruido. Con el modelo de ruido FakeFez, un procesador IBM simulado, el éxito con 3 qubits es 0,80; con 6 qubits cae a 0,017, casi igual que adivinar. El ruido borra la amplificación."),
    (15, "D", "Validamos con 72 pruebas de Python y 37 de frontend, todas pasan, y Grover con 4 qubits dio 0,953 frente a 0,961 teórico. Y somos honestos: no ejecutamos en hardware real, el ruido es simulado y no hicimos el piloto con estudiantes."),
    (16, "A", "Para estudiantes desde 14 años, unos 3 minutos al día, con reto diario, racha y logros: aprender midiendo. Próximos pasos: un piloto en aula y un primer job en un chip IBM real. Monte Carlo adivina. Grover amplifica. Gracias."),
]
SHORT_PAUSE = {9: 8}  # segundos de clic en la demo corta

PREGUNTAS = [
    ("¿Por qué cuántico y no solo una animación?", "B", "C",
     "Porque lo que ven no está dibujado. Cada ejecución del laboratorio construye un circuito real con Qiskit, lo transpila y lo ejecuta con el simulador Aer, con ruido de FakeFez si lo activan, y muestra conteos medidos. La curva de probabilidad sale de Statevector y coincide con la fórmula con un error máximo de 6,15 por 10 a la menos 14. Además, si te pasas del número óptimo de iteraciones, la probabilidad baja, algo que una animación fija no enseña. Eso sí, el explorador de amplitudes usa la fórmula, y lo decimos; su fidelidad está comprobada contra Qiskit."),
    ("¿Esto rompe contraseñas hoy?", "D", "B",
     "No. Simulamos hasta 6 qubits y el oráculo conoce la respuesta porque nosotros la elegimos. Un ataque real tendría que codificar el cifrado o la función hash como circuito cuántico, mucho más grande. Además, Grover da una ventaja solo cuadrática: duplicar los bits restaura el margen. Hoy no existe una computadora cuántica tolerante a fallos que ataque AES. El riesgo concreto es para RSA y curvas elípticas por el algoritmo de Shor, y por eso el NIST ya publicó estándares poscuánticos."),
    ("¿Qué es FakeFez y por qué no usaron hardware real?", "D", "B",
     "FakeFez es un modelo de ruido local, basado en datos de calibración de un procesador IBM. No es hardware: es una simulación del tipo de errores que tendría un chip. Lo usamos porque no necesita cuenta, funciona sin internet y es reproducible. No usamos hardware real porque no había una cuenta configurada con cuota. Dejamos listo un programa de línea de comandos con los modos fake, dry-run e ibm, y la guía para enviar el primer job. No afirmamos nada de un chip real hasta medirlo."),
    ("El reto sugiere pasar de Monte Carlo a estimación cuántica de amplitud (QAE). ¿Por qué no la implementaron?", "B", "A",
     "Porque nuestro par del reto es distribuciones de probabilidad hacia superposición y amplitudes, y ahí Grover es la herramienta justa. El Monte Carlo de la app es la búsqueda aleatoria clásica: la referencia contra la que medimos la ventaja de Grover. No lo presentamos como QAE. La estimación cuántica de amplitud pide un diseño científico y pruebas propios, y preferimos hacer bien una cosa que fingir dos. Es parte de lo que haríamos con más tiempo."),
    ("¿Desde qué edad y cada cuánto se usa?", "A", "C",
     "Proponemos desde 14 años, porque solo exige fracciones, porcentajes y la idea de probabilidad, sin álgebra lineal. El uso ideal es diario, unos 3 minutos: un reto del día, una predicción y un experimento. Un docente también puede usarlo como actividad semanal en clase. Aclaramos que es el público propuesto: no lo hemos validado con menores ni hemos medido la retención."),
    ("¿Qué lo hace adictivo?", "A", "C",
     "Preferimos decir «con ganas de volver». El mecanismo es un bucle corto: te comprometes con una predicción, ves el resultado, ganas experiencia, subes de nivel y mantienes la racha del reto diario. Hay una ruta de cinco pasos y seis logros. Lo pensamos como hábito y aprendizaje, no para atrapar: no hay cuentas ni ranking, y el progreso vive solo en tu navegador. Su efecto real sobre el hábito todavía no está probado."),
    ("¿Cómo lo validaron?", "D", "B",
     "Con pruebas automáticas y mediciones reproducibles. Hay 72 pruebas de Python y 37 de frontend, y todas pasan. Con 4 qubits, Grover dio 0,953 frente a 0,961 teórico. La curva de Statevector coincide con la fórmula de 2 a 6 qubits con error máximo de 6,15 por 10 a la menos 14. El Monte Carlo de 10 bits da 513,3 frente a 512,5 esperado. Lo que no validamos es el aprendizaje con estudiantes: el piloto está pendiente."),
    ("¿La contraseña se envía a algún servidor?", "D", "C",
     "No. El análisis y la generación ocurren en el navegador. Ningún endpoint de la API recibe contraseñas y hay una prueba automática que lo comprueba. Además, la política de seguridad impide cargar código de terceros. Cualquiera puede verificarlo abriendo la pestaña Network del navegador mientras usa la herramienta. Lo único que hay que cuidar es el portapapeles si copias la contraseña generada."),
    ("¿Qué pasa si alguien hace ingeniería inversa del generador de contraseñas?", "D", "C",
     "El código es público a propósito, y aun así no sirve para reproducir una contraseña: no hay semilla ni estado. Cada carácter o palabra sale de crypto.getRandomValues, el generador aleatorio seguro del navegador, con muestreo por rechazo para evitar sesgo. Leer el código solo revela el método, no el resultado. La seguridad está en la entropía, no en esconder el algoritmo; es el principio de Kerckhoffs."),
    ("¿Qué harían con más tiempo?", "A", "D",
     "Tres cosas. Primera: enviar un job de 3 qubits a un procesador IBM real con nuestro programa y compararlo con FakeFez. Segunda: hacer un piloto en aula para medir comprensión y retención, que hoy no están medidas. Tercera: mapear más conceptos de estadística a lo cuántico y evaluar con rigor si estimación cuántica de amplitud cabe en el proyecto."),
    ("Si Grover solo es cuadrático, ¿realmente importa?", "B", "D",
     "Sí, pero hay que ponerlo en su lugar. Pasar de N a raíz de N consultas es una gran mejora, y por eso se recomiendan claves más largas: duplicar los bits restaura el margen. Nuestra meta de 128 bits deja unos 64 efectivos frente a Grover idealizado. Pero cada iteración es costosa y secuencial, y hoy no existe una computadora que lo ejecute a esa escala. Ni minimizamos el efecto ni lo exageramos."),
    ("¿No es trampa que el oráculo ya conozca la respuesta?", "B", "D",
     "Es una simplificación declarada. El oráculo marca el estado objetivo porque lo elegimos nosotros. En un ataque real habría que codificar la función hash o el cifrado como circuito cuántico reversible, con muchas más puertas y qubits auxiliares. Aquí lo usamos solo para enseñar la mecánica de Grover, y está dicho en la sección «Limitaciones» de la app."),
    ("¿Por qué solo hasta 6 qubits?", "B", "C",
     "Para que el laboratorio sea inmediato: 6 qubits son 64 estados y se simulan rápido, y con ruido ya se ve el efecto. El explorador llega a más qubits porque usa fórmulas. La tabla comparativa hasta 256 bits es una extrapolación con la fórmula: no simulamos ningún circuito de ese tamaño."),
    ("¿El explorador de amplitudes usa Qiskit?", "C", "B",
     "No. Calcula con las fórmulas exactas en el navegador, sin servidor, y lo dice en pantalla. Para que no sea solo una afirmación, comparamos la curva de Qiskit con esa fórmula de 2 a 6 qubits, y coincide con un error de 6,15 por 10 a la menos 14, con una prueba automática."),
]

CIFRAS = [
    ("Grover ideal, n=4, estado 1010, k=3, 2048 shots, seed 7", "Éxito 0,953 frente a 0,961 teórico"),
    ("Curva Statevector frente a sin²((2k+1)θ), n=2 a 6", "Error máximo 6,15·10⁻¹⁴"),
    ("FakeFez, CLI, seed 7, 1024 shots, n=3", "Éxito 0,802 (azar 0,125); profundidad 137; 39 puertas de 2 qubits"),
    ("FakeFez, n=4", "0,662 (0,0625); profundidad 448; 111 puertas de 2 qubits"),
    ("FakeFez, n=5", "0,184 (0,031); profundidad 1456; 517 puertas de 2 qubits"),
    ("FakeFez, n=6", "0,0166 (0,0156); profundidad 4447; 1706 puertas de 2 qubits"),
    ("Monte Carlo, 10 bits, 5000 ensayos, seed 1", "Media 513,3 frente a 512,5 esperado"),
    ("Pruebas", "72 de pytest y 37 de frontend, todas pasan"),
    ("Generador de frases", "2072 palabras, 11,02 bits por palabra; meta 128 bits (unos 64 efectivos frente a Grover idealizado)"),
    ("Búsqueda clásica frente a Grover", "(N+1)/2 intentos frente a unas π/4·√N iteraciones"),
]


# --------------------------------------------------------------------------
# Utilidades de formato
# --------------------------------------------------------------------------
def words(text: str) -> int:
    return len(re.sub(r"\*\*", "", text).split())


def mmss(sec: float) -> str:
    sec = int(round(sec))
    return f"{sec // 60}:{sec % 60:02d}"


def slide_seconds(s: dict) -> int:
    w = sum(words(p) for p in s["guion"])
    return int(round(w * 60 / WPM / 5.0) * 5) + s.get("pausa", 0)


def set_font(style, name, size=None, bold=None, color=None, italic=None):
    f = style.font
    f.name = name
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for att in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rfonts.get(qn(att)) is not None:
            del rfonts.attrib[qn(att)]
    for att in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(att), name)
    if size:
        f.size = Pt(size)
    if bold is not None:
        f.bold = bold
    if italic is not None:
        f.italic = italic
    if color is not None:
        f.color.rgb = color


def shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    for old in tcpr.findall(qn("w:shd")):
        tcpr.remove(old)
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcpr.append(shd)


def borders(cell, **kw):
    """kw: top/left/bottom/right = (size_eighths_pt, 'RRGGBB') or None para quitar."""
    tcpr = cell._tc.get_or_add_tcPr()
    b = tcpr.find(qn("w:tcBorders"))
    if b is None:
        b = OxmlElement("w:tcBorders")
        tcpr.append(b)
    for side in ("top", "left", "bottom", "right"):
        el = OxmlElement(f"w:{side}")
        spec = kw.get(side)
        if spec is None:
            el.set(qn("w:val"), "nil")
        else:
            el.set(qn("w:val"), "single")
            el.set(qn("w:sz"), str(spec[0]))
            el.set(qn("w:space"), "0")
            el.set(qn("w:color"), spec[1])
        b.append(el)


def cell_margins(cell, top=80, bottom=80, left=140, right=140):
    tcpr = cell._tc.get_or_add_tcPr()
    m = OxmlElement("w:tcMar")
    for side, v in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(v))
        el.set(qn("w:type"), "dxa")
        m.append(el)
    tcpr.append(m)


def fix_table(table, widths_cm):
    table.autofit = False
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblpr = table._tbl.tblPr
    tblw = tblpr.find(qn("w:tblW"))
    if tblw is None:
        tblw = OxmlElement("w:tblW")
        tblpr.append(tblw)
    tblw.set(qn("w:type"), "dxa")
    tblw.set(qn("w:w"), str(int(sum(widths_cm) * 567)))
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tblpr.append(layout)
    for row in table.rows:
        trpr = row._tr.get_or_add_trPr()
        cs = OxmlElement("w:cantSplit")
        trpr.append(cs)
        for cell, w in zip(row.cells, widths_cm):
            cell.width = Cm(w)
    grid = table._tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), widths_cm):
        gc.set(qn("w:w"), str(int(w * 567)))


def add_runs(par, text, size=None, color=None, italic=None, bold_all=False):
    """Escribe texto con **negrita** como runs."""
    parts = re.split(r"(\*\*.+?\*\*)", text)
    for part in parts:
        if not part:
            continue
        b = part.startswith("**") and part.endswith("**")
        r = par.add_run(part[2:-2] if b else part)
        r.bold = True if (b or bold_all) else None
        if size:
            r.font.size = Pt(size)
        if color is not None:
            r.font.color.rgb = color
        if italic:
            r.italic = True
    return par


def spacer(doc, pts=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    r = p.add_run("")
    r.font.size = Pt(pts)
    p.style = doc.styles["Normal"]
    pf = p.paragraph_format
    pf.line_spacing = Pt(pts + 1)
    return p


def page_break(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.add_run().add_break(WD_BREAK.PAGE)


def add_field(par, instr):
    r = par.add_run()
    for kind, text in (("begin", None), (None, instr), ("separate", None), (None, "1"), ("end", None)):
        if kind:
            fc = OxmlElement("w:fldChar")
            fc.set(qn("w:fldCharType"), kind)
            r._r.append(fc)
        elif text == instr:
            it = OxmlElement("w:instrText")
            it.set(qn("xml:space"), "preserve")
            it.text = f" {instr} "
            r._r.append(it)
        else:
            t = OxmlElement("w:t")
            t.text = text
            r._r.append(t)
    return r


def new_numbering(doc, style_name="List Number"):
    numbering = doc.part.numbering_part.numbering_definitions._numbering
    numid = doc.styles[style_name].element.pPr.numPr.numId.val
    abstract = numbering.num_having_numId(numid).abstractNumId.val
    num = numbering.add_num(abstract)
    num.add_lvlOverride(ilvl=0).add_startOverride(1)
    return num.numId


def numbered(cell_or_doc, text, numid, style_doc):
    p = cell_or_doc.add_paragraph(style="List Number")
    ppr = p._p.get_or_add_pPr()
    numpr = ppr.get_or_add_numPr()
    numpr.get_or_add_ilvl().val = 0
    numpr.get_or_add_numId().val = numid
    p.paragraph_format.space_after = Pt(3)
    add_runs(p, text, size=11)
    return p


def box(doc, label, paras, fill, bar, label_color, numbered_steps=None, qa=None):
    """Caja de una celda con barra lateral de color."""
    t = doc.add_table(rows=1, cols=1)
    fix_table(t, [CONTENT_CM])
    c = t.rows[0].cells[0]
    shade(c, fill)
    borders(c, left=(36, bar))
    cell_margins(c, top=90, bottom=90, left=180, right=160)
    first = c.paragraphs[0]
    first.paragraph_format.space_after = Pt(3)
    first.paragraph_format.keep_with_next = True
    r = first.add_run(label)
    r.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = label_color
    for text in paras or []:
        p = c.add_paragraph(style="Caja")
        add_runs(p, text)
    if numbered_steps:
        nid = new_numbering(doc)
        for s in numbered_steps:
            numbered(c, s, nid, doc)
    for q, a in qa or []:
        p = c.add_paragraph(style="Caja")
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(1)
        p.paragraph_format.keep_with_next = True
        add_runs(p, q, bold_all=True)
        p2 = c.add_paragraph(style="Caja")
        p2.paragraph_format.left_indent = Cm(0.4)
        add_runs(p2, a)
    spacer(doc, 5)
    return t


def banner(doc, title, spk, right_text, level=3):
    fill, bar, _ = SPK[spk]
    t = doc.add_table(rows=1, cols=2)
    fix_table(t, [CONTENT_CM - 7.0, 7.0])
    left, right = t.rows[0].cells
    for c in (left, right):
        shade(c, fill)
        borders(c, left=None, top=None, bottom=(12, bar), right=None)
        cell_margins(c, top=100, bottom=100, left=160, right=160)
    left.paragraphs[0].style = doc.styles[f"Heading {level}"]
    left.paragraphs[0].paragraph_format.keep_with_next = True
    left.paragraphs[0].add_run(title)
    rp = right.paragraphs[0]
    rp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    rp.paragraph_format.keep_with_next = True
    rr = rp.add_run(right_text)
    rr.bold = True
    rr.font.size = Pt(10.5)
    rr.font.color.rgb = NAVY
    return t


def header_row(table, fill="1F3A5F", color=RGBColor(0xFF, 0xFF, 0xFF)):
    for c in table.rows[0].cells:
        shade(c, fill)
        for p in c.paragraphs:
            for r in p.runs:
                r.bold = True
                r.font.color.rgb = color
    trpr = table.rows[0]._tr.get_or_add_trPr()
    h = OxmlElement("w:tblHeader")
    trpr.append(h)


def data_table(doc, headers, rows, widths, align_center=(), zebra=True, font=10):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    for i, h in enumerate(headers):
        t.rows[0].cells[i].text = ""
        t.rows[0].cells[i].paragraphs[0].add_run(h)
    for ri, row in enumerate(rows):
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ""
            add_runs(cells[i].paragraphs[0], str(v), size=font)
            if zebra and ri % 2 == 1:
                shade(cells[i], "F3F6FA")
    for row in t.rows:
        for i, c in enumerate(row.cells):
            cell_margins(c, top=50, bottom=50, left=100, right=100)
            for p in c.paragraphs:
                p.paragraph_format.space_after = Pt(0)
                p.paragraph_format.line_spacing = 1.1
                if i in align_center:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for r in p.runs:
                    r.font.size = Pt(font)
    header_row(t)
    fix_table(t, widths)
    # bordes finos grises
    tblpr = t._tbl.tblPr
    tb = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "C5CCD6")
        tb.append(el)
    tblpr.append(tb)
    spacer(doc, 6)
    return t


def bullet(doc, text, size=11):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    add_runs(p, text, size=size)
    return p


def body(doc, text, size=11, italic=False, color=None, after=6):
    p = doc.add_paragraph(style="Normal")
    p.paragraph_format.space_after = Pt(after)
    add_runs(p, text, size=size, italic=italic, color=color)
    return p


# --------------------------------------------------------------------------
# Documento
# --------------------------------------------------------------------------
def build():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.0)
    sec.top_margin, sec.bottom_margin = Cm(2.0), Cm(2.0)
    sec.footer_distance = Cm(1.0)

    st = doc.styles
    set_font(st["Normal"], "Calibri", 11)
    st["Normal"].paragraph_format.space_after = Pt(6)
    set_font(st["Title"], "Calibri", 34, True, NAVY)
    set_font(st["Subtitle"], "Calibri", 15, False, GREY, italic=False)
    set_font(st["Heading 1"], "Calibri", 22, True, NAVY)
    set_font(st["Heading 2"], "Calibri", 16, True, RGBColor(0x2F, 0x6D, 0xB5))
    set_font(st["Heading 3"], "Calibri", 13, True, NAVY)
    for h, before, after in (("Heading 1", 0, 10), ("Heading 2", 14, 6), ("Heading 3", 0, 0)):
        st[h].paragraph_format.space_before = Pt(before)
        st[h].paragraph_format.space_after = Pt(after)
        st[h].paragraph_format.keep_with_next = True
    # Quitar la raya inferior del título por defecto
    tpr = st["Title"].element.get_or_add_pPr()
    for b in tpr.findall(qn("w:pBdr")):
        tpr.remove(b)

    from docx.enum.style import WD_STYLE_TYPE
    g = st.add_style("Guion", WD_STYLE_TYPE.PARAGRAPH)
    g.base_style = st["Normal"]
    set_font(g, "Georgia", 12)
    g.paragraph_format.line_spacing = 1.3
    g.paragraph_format.space_after = Pt(8)
    g.paragraph_format.space_before = Pt(0)
    g.paragraph_format.widow_control = True
    gc = st.add_style("GuionCorto", WD_STYLE_TYPE.PARAGRAPH)
    gc.base_style = g
    cj = st.add_style("Caja", WD_STYLE_TYPE.PARAGRAPH)
    cj.base_style = st["Normal"]
    set_font(cj, "Calibri", 11)
    cj.paragraph_format.space_after = Pt(3)
    cj.paragraph_format.line_spacing = 1.15
    ind = st.add_style("Indicacion", WD_STYLE_TYPE.PARAGRAPH)
    ind.base_style = st["Normal"]
    set_font(ind, "Calibri", 10.5, color=GREY, italic=True)
    ind.paragraph_format.space_after = Pt(4)
    lb = st.add_style("Etiqueta", WD_STYLE_TYPE.PARAGRAPH)
    lb.base_style = st["Normal"]
    set_font(lb, "Calibri", 10, True, color=GREY)
    lb.paragraph_format.space_before = Pt(6)
    lb.paragraph_format.space_after = Pt(3)
    lb.paragraph_format.keep_with_next = True
    for name in ("List Bullet", "List Number"):
        set_font(st[name], "Calibri", 11)

    # Pie de página con número
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("QubitGuard · Guion de exposición · Página ")
    r.font.size = Pt(9)
    r.font.color.rgb = GREY
    f1 = add_field(fp, "PAGE")
    f1.font.size = Pt(9)
    f1.font.color.rgb = GREY
    r = fp.add_run(" de ")
    r.font.size = Pt(9)
    r.font.color.rgb = GREY
    f2 = add_field(fp, "NUMPAGES")
    f2.font.size = Pt(9)
    f2.font.color.rgb = GREY

    doc.core_properties.title = "QubitGuard: guion de exposición"
    doc.core_properties.author = "Equipo QubitGuard"
    doc.core_properties.language = "es-PE"

    # ---- tiempos acumulados ----
    secs = {s["n"]: slide_seconds(s) for s in SLIDES}
    start, acc = {}, 0
    for s in SLIDES:
        start[s["n"]] = acc
        acc += secs[s["n"]]
    total_secs = acc
    spoken_words = {s["n"]: sum(words(p) for p in s["guion"]) for s in SLIDES}
    total_words = sum(spoken_words.values())

    # ============ 1. PORTADA ============
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(60)
    doc.add_paragraph("QubitGuard", style="Title")
    doc.add_paragraph("Guion de exposición de la presentación detallada", style="Subtitle")
    body(doc, "IBM Quantum Hackathon · Qiskit Fall Fest 2026 · Lima · Reto 5.3 EdTech", size=12, color=GREY, after=18)
    body(doc, f"Duración total: unos 12 minutos (versión completa, {len(SLIDES)} slides; según la tabla de tiempos, {mmss(total_secs)}). "
              "Incluye una versión corta de unos 3 minutos, preguntas difíciles del jurado y consejos de exposición.",
         size=12, after=14)

    doc.add_heading("Reparto de roles", level=2)
    spk_secs = {k: 0 for k in SPK}
    spk_slides = {k: [] for k in SPK}
    for s in SLIDES:
        spk_secs[s["spk"]] += secs[s["n"]]
        spk_slides[s["spk"]].append(s["n"])

    def rng(ns):
        out, ns = [], sorted(ns)
        i = 0
        while i < len(ns):
            j = i
            while j + 1 < len(ns) and ns[j + 1] == ns[j] + 1:
                j += 1
            out.append(f"{ns[i]}" if i == j else f"{ns[i]} a {ns[j]}")
            i = j + 1
        return ", ".join(out)

    rows = []
    for k in "ABCD":
        rows.append([f"Integrante {k}: ____________", SPK[k][2], rng(spk_slides[k]), mmss(spk_secs[k])])
    data_table(doc, ["Integrante", "Rol", "Slides", "Tiempo"], rows, [5.4, 6.4, 3.2, 2.0], align_center=(2, 3), font=11)

    doc.add_heading("Cómo usar este guion", level=2)
    for t in [
        "El texto del **GUION HABLADO** está escrito para decirse tal cual, en voz alta. Léanlo varias veces hasta que suene a ustedes; cambiar palabras está bien, cambiar cifras no.",
        "Las cifras son las medidas en el repositorio (simulador y modelo de ruido FakeFez). **No se ejecutó nada en hardware cuántico real** y no se hizo el piloto con estudiantes.",
        "En las slides de demo (8 a 11) hay pasos exactos de qué clicar y un plan B por si la app falla.",
        "La versión corta usa solo las slides marcadas con una estrella en el esquema (1, 2, 4, 5, 9, 11, 15 y 16).",
    ]:
        bullet(doc, t)

    page_break(doc)

    doc.add_heading("Tabla de tiempos por slide", level=2)
    body(doc, f"Tiempo = palabras del guion hablado a {WPM} palabras por minuto, redondeado a 5 segundos, más los segundos de clics en las slides de demo "
              "(8, 10: 5 s; 9, 11: 10 s). Si van más lentos que el reloj, recorten la slide 3 o la 14.", size=10.5, color=GREY)
    rows, cum = [], 0
    for s in SLIDES:
        cum += secs[s["n"]]
        star = " ★" if s["star"] else ""
        rows.append([s["n"], s["titulo"] + star, s["spk"], spoken_words[s["n"]], mmss(secs[s["n"]]), mmss(cum)])
    rows.append(["", "**Total**", "", f"**{total_words}**", f"**{mmss(total_secs)}**", ""])
    data_table(doc, ["#", "Slide (★ = versión corta)", "Exp.", "Palabras", "Tiempo", "Acumulado"], rows,
               [1.0, 8.0, 1.3, 2.2, 2.2, 2.3], align_center=(0, 2, 3, 4, 5))

    # ============ 2. GUION POR SLIDE ============
    page_break(doc)
    doc.add_heading("Guion completo por slide", level=1)
    blocks = [("A", [1, 2, 3]), ("B", [4, 5, 6, 7]), ("C", [8, 9, 10, 11]), ("D", [12, 13, 14, 15]), ("A", [16])]
    by_n = {s["n"]: s for s in SLIDES}
    first = True
    for spk, ns in blocks:
        if not first:
            page_break(doc)
        first = False
        label = "Cierre" if (spk == "A" and ns == [16]) else SPK[spk][2]
        plural = "slides" if len(ns) > 1 else "slide"
        doc.add_heading(f"Bloque {spk}: {label} ({plural} {rng(ns)})", level=2)
        for idx, n in enumerate(ns):
            s = by_n[n]
            if idx > 0:
                pb = doc.add_paragraph()
                pb.paragraph_format.page_break_before = True
                pb.paragraph_format.space_after = Pt(0)
                pb.paragraph_format.line_spacing = Pt(1)
            ttl = f"Slide {s['n']}: {s['titulo']}"
            ts, te = mmss(start[n]), mmss(start[n] + secs[n])
            banner(doc, ttl, spk, f"Expositor {spk} · {mmss(secs[n])} ({ts} a {te})")
            spacer(doc, 4)
            doc.add_paragraph("En pantalla: " + s["pantalla"], style="Indicacion")
            if s.get("nota"):
                doc.add_paragraph("Indicación: " + s["nota"], style="Indicacion")
            doc.add_paragraph("GUION HABLADO", style="Etiqueta")
            for p in s["guion"]:
                par = doc.add_paragraph(style="Guion")
                add_runs(par, p)
            if s.get("demo"):
                box(doc, "DEMO: QUÉ CLICAR EN LA APP", None, "E7F4EC", "2E8B57", RGBColor(0x1E, 0x6B, 0x41),
                    numbered_steps=s["demo"]["pasos"])
                box(doc, "PLAN B SI LA APP FALLA", [s["demo"]["planb"]], "FDEDEC", "C0392B", RGBColor(0x92, 0x2B, 0x21))
            box(doc, "FRASE PUENTE", ["«" + s["puente"] + "»" if not s["puente"].startswith("Cierre") else s["puente"]],
                "FFF6DC", "E0A100", RGBColor(0x8A, 0x62, 0x00))
            box(doc, "SI TE PREGUNTAN…", None, "EEF2F7", "6C7A8C", GREY, qa=[("P: " + q, "R: " + a) for q, a in s["preguntas"]])
            spacer(doc, 8)

    # ============ 3. VERSIÓN CORTA ============
    page_break(doc)
    doc.add_heading("Versión corta (2:30 a 3:00)", level=1)
    body(doc, "Solo las slides marcadas con ★ en el esquema. Mismo reparto de expositores, texto condensado. "
              "Si hay app abierta, la demo de la slide 9 se hace en vivo en unos 8 segundos (predicción, Ejecutar circuito, leer los tres números); si no, se muestra la captura.",
         size=11)
    s_secs = {n: int(round(words(t) * 60 / WPM / 5.0) * 5) + SHORT_PAUSE.get(n, 0) for n, _, t in SHORT}
    s_words = {n: words(t) for n, _, t in SHORT}
    rows, cum = [], 0
    for n, spk, _ in SHORT:
        cum += s_secs[n]
        rows.append([n, by_n[n]["titulo"], spk, s_words[n], mmss(s_secs[n]), mmss(cum)])
    short_total_words, short_total = sum(s_words.values()), sum(s_secs.values())
    rows.append(["", "**Total**", "", f"**{short_total_words}**", f"**{mmss(short_total)}**", ""])
    data_table(doc, ["#", "Slide", "Exp.", "Palabras", "Tiempo", "Acumulado"], rows,
               [1.0, 8.0, 1.3, 2.2, 2.2, 2.3], align_center=(0, 2, 3, 4, 5))
    t0 = 0
    prev = None
    for n, spk, text in SHORT:
        if spk != prev:
            doc.add_heading(f"Expositor {spk}: {SPK[spk][2]}", level=2)
            prev = spk
        banner(doc, f"Slide {n} (corta): {by_n[n]['titulo']}", spk, f"{mmss(s_secs[n])} ({mmss(t0)} a {mmss(t0 + s_secs[n])})")
        t0 += s_secs[n]
        spacer(doc, 4)
        par = doc.add_paragraph(style="GuionCorto")
        add_runs(par, text)
    doc.add_paragraph("Frases puente en la corta: A termina diciendo «Veamos cómo lo construimos»; B: «Y C lo muestra en vivo»; "
                      "C: «Con ese ruido en mente, D cuenta qué falta validar»; D: «A cierra».", style="Indicacion")

    # ============ 4. PREGUNTAS DIFÍCILES ============
    page_break(doc)
    doc.add_heading("Preguntas difíciles del jurado", level=1)
    body(doc, "Cada respuesta es un modelo para decir en 30 a 45 segundos. Responde la persona indicada; la que apoya puede añadir una frase. "
              "Regla de oro: si no lo medimos, lo decimos.", size=11)
    for i, (q, who, helper, a) in enumerate(PREGUNTAS, 1):
        h = doc.add_heading(f"P{i}. {q}", level=3)
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(3)
        p = doc.add_paragraph(style="Indicacion")
        p.add_run(f"Responde: {who}. Apoya: {helper}.")
        p.paragraph_format.keep_with_next = True
        par = doc.add_paragraph(style="Guion")
        par.paragraph_format.space_after = Pt(4)
        add_runs(par, a)

    # ============ 5. CONSEJOS ============
    page_break(doc)
    doc.add_heading("Consejos de exposición", level=1)
    doc.add_heading("Ritmo", level=2)
    for t in [
        f"Ritmo objetivo: unas {WPM} palabras por minuto, es decir, unas 2,3 palabras por segundo. Más lento al leer cifras, más ágil en las explicaciones.",
        "Pausen medio segundo después de cada cifra importante (0,953; 6,15 por 10 a la menos 14; 4447). Es lo que el jurado se lleva.",
        "No lean el papel: usen el guion para ensayar y la slide como guía. Si se les va una palabra, sigan; si se les va una cifra, léanla de la pantalla.",
        "Ensayen completos con cronómetro al menos dos veces. Cada slide tiene su tiempo objetivo en la tabla.",
    ]:
        bullet(doc, t)
    doc.add_heading("Contacto visual y presencia", level=2)
    for t in [
        "Miren al jurado entre 3 y 5 segundos por persona, de a una idea por mirada. Al señalar una cifra, miren la pantalla, señalen con la mano y vuelvan al jurado.",
        "Quien no habla, mira a quien habla o a la pantalla; no a los apuntes ni al celular.",
        "Párense en diagonal hacia el público, no de espaldas a la pantalla.",
    ]:
        bullet(doc, t)
    doc.add_heading("Quién maneja la laptop", level=2)
    for t in [
        "Una sola persona maneja la laptop en cada tramo. Slides 1 a 7: quien está hablando avanza con el control remoto; si no hay control, lo hace A.",
        "Slides 8 a 11: C maneja la app y el teclado. La app queda ya cargada en otra ventana y se cambia con Cmd+Tab (Mac) o Alt+Tab (Windows). Ensayen ese cambio.",
        "Slides 12 a 15: D vuelve a la presentación; A retoma para la slide 16.",
        "Antes de empezar: app abierta en http://127.0.0.1:8000 con la intro ya saltada, zoom del navegador al 125 %, una ejecución previa del laboratorio hecha y las capturas de plan B a mano.",
        "Si el servidor no está arriba, desde la raíz del proyecto: .venv/bin/python -m uvicorn app.main:app --port 8000. La app funciona sin internet.",
    ]:
        bullet(doc, t)
    doc.add_heading("Cómo hacer las transiciones", level=2)
    for t in [
        "Usen la **Frase puente** de cada slide: cierra la idea y entrega la palabra al siguiente por su nombre o letra. El siguiente responde con «Gracias, X» y entra directo.",
        "Entre expositores, el que termina da un paso atrás o mira al siguiente; el siguiente espera un segundo antes de hablar.",
        "No repitan lo que ya dijo el anterior; si hace falta, una frase de enlace y listo.",
        "En la demo, narren mientras clican: la mano no puede ir más rápido que la voz. Si una ejecución tarda, llenen con la explicación (por ejemplo, qué es un shot).",
    ]:
        bullet(doc, t)
    doc.add_heading("Si algo sale mal", level=2)
    for t in [
        "La app falla: sin disculparse, pasen a la captura de la slide y sigan con el mismo texto. Está en el plan B de cada slide de demo.",
        "Falta tiempo: usen la versión corta o recorten las slides 3 y 14.",
        "Pregunta que no saben: «Eso no lo medimos todavía» y mencionen que está en las limitaciones. La honestidad suma puntos.",
    ]:
        bullet(doc, t)

    doc.add_heading("Qué NO decir", level=2)
    rows = [
        ["«Lo ejecutamos en un computador cuántico real de IBM.»",
         "«Lo medimos con FakeFez, un modelo de ruido simulado. El programa para hardware real está listo; falta enviar el primer job.»"],
        ["«Grover prueba todas las respuestas a la vez.»",
         "«Grover empieza con todos los estados en superposición y, con cada iteración, aumenta la amplitud del marcado.»"],
        ["«Esto rompe contraseñas» o «los computadores cuánticos romperán todo el cifrado.»",
         "«Grover da una ventaja cuadrática; el riesgo concreto es para RSA y curvas elípticas por Shor, y ya hay estándares de reemplazo.»"],
        ["«Los estudiantes aprenden más con QubitGuard.»",
         "«Diseñamos una metodología con base en predecir antes de ver; el piloto para medir el aprendizaje está pendiente.»"],
        ["«El explorador ejecuta Qiskit.»",
         "«El explorador usa la fórmula exacta; la comprobamos contra Qiskit.»"],
        ["«Implementamos Quantum Amplitude Estimation.»",
         "«El Monte Carlo es la referencia clásica; no implementamos QAE.»"],
        ["«Es exponencialmente más rápido.»",
         "«La ventaja es cuadrática.»"],
    ]
    data_table(doc, ["No digas", "Di mejor"], rows, [7.5, 9.5], font=10.5)

    doc.add_heading("Hoja de cifras citables", level=2)
    body(doc, "Todas medidas en este repositorio, no en hardware real. Léanlas de la pantalla cuando la app muestre otra.", size=10.5, color=GREY)
    data_table(doc, ["Qué se midió", "Resultado"], [list(c) for c in CIFRAS], [8.0, 9.0], font=10)

    doc.save(OUT)
    return dict(total_words=total_words, total_secs=total_secs, short_words=short_total_words,
                short_secs=short_total, spoken=spoken_words)


if __name__ == "__main__":
    info = build()
    print(f"completa: {info['total_words']} palabras, {mmss(info['total_secs'])}")
    print(f"corta: {info['short_words']} palabras, {mmss(info['short_secs'])}")
    print(info["spoken"])
