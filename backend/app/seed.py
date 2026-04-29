from sqlmodel import Session, select
from app.models.study import StudyArea, StudyTopic, Lesson


def seed_initial_data(session: Session) -> None:
    existing = session.exec(select(StudyArea)).first()

    if existing:
        return

    areas = [
        {
            "name": "Funciones Primarias del Mando",
            "description": "Estudio de las funciones primarias evaluadas en el proceso ACAGUE.",
            "weight_percentage": 30,
            "order": 1,
            "topics": [
                "Función Personal",
                "Función Inteligencia",
                "Función Operaciones",
                "Función Logística",
                "Asuntos Civiles y Administración Territorial",
                "Mando y Control",
            ],
        },
        {
            "name": "Historia Militar Universal y de Chile",
            "description": "Historia militar universal, historia militar de Chile y conflictos seleccionados.",
            "weight_percentage": 20,
            "order": 2,
            "topics": [
                "Segunda Guerra Mundial",
                "Guerra de Corea",
                "Guerra de Vietnam",
                "Conflicto Árabe-Israelí",
                "Guerra de las Malvinas",
                "Guerra del Golfo",
                "Independencia de Chile",
                "Guerra contra la Confederación Perú-Boliviana",
                "Guerra del Pacífico",
            ],
        },
        {
            "name": "Geografía Militar",
            "description": "Cartografía, geografía general de Chile, regiones y estudios geográficos militares.",
            "weight_percentage": 20,
            "order": 3,
            "topics": [
                "Cartografía",
                "El Mundo y los Continentes",
                "Geografía General de Chile",
                "Regiones de Chile",
                "Mapa Físico de Chile",
                "Estudio Geográfico Militar",
                "Estudio Topográfico Militar",
            ],
        },
        {
            "name": "Examen Oral",
            "description": "Preparación de exposición, argumentación, síntesis y respuesta ante comisión.",
            "weight_percentage": 25,
            "order": 4,
            "topics": [
                "Exposición de Funciones Primarias",
                "Exposición de Historia Militar",
                "Exposición de Geografía Militar",
                "Actualidad y Defensa Nacional",
                "Ethos y Liderazgo Militar",
                "Derechos Humanos",
            ],
        },
        {
            "name": "Pruebas de Suficiencia Física",
            "description": "Seguimiento referencial de preparación física asociada al proceso.",
            "weight_percentage": 5,
            "order": 5,
            "topics": [
                "Carrera 2.400 metros",
                "Abdominales",
                "Flexoextensiones",
                "Seguimiento físico",
            ],
        },
    ]

    for area_data in areas:
        topics = area_data.pop("topics")

        area = StudyArea(**area_data)
        session.add(area)
        session.commit()
        session.refresh(area)

        for index, topic_name in enumerate(topics, start=1):
            topic = StudyTopic(
                study_area_id=area.id,
                name=topic_name,
                order=index,
            )
            session.add(topic)
            session.commit()
            session.refresh(topic)

            lesson = Lesson(
                study_topic_id=topic.id,
                title=f"Introducción a {topic_name}",
                content=(
                    f"Esta lección corresponde al tema {topic_name}. "
                    "El contenido definitivo deberá ser cargado desde fuentes oficiales "
                    "validadas por el administrador de contenidos de TutorAcague. "
                    "El objetivo de esta lección inicial es permitir que el sistema enseñe, "
                    "explique y genere preguntas únicamente desde el contenido local cargado. "
                    "TutorAcague debe utilizar este contenido como base de estudio, evitando "
                    "incorporar información no respaldada por una fuente oficial o validada."
                ),
                official_source="Contenido inicial TutorAcague",
                source_reference="Base local de prueba",
                order=1,
                is_official_content=True,
            )
            session.add(lesson)

        session.commit()