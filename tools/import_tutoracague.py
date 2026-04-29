import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# ============================================================
# Resolver ruta backend para poder importar app.*
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlmodel import Session, SQLModel, select  # noqa: E402

from app.database import engine  # noqa: E402
from app.models.study import Lesson, StudyArea, StudyTopic  # noqa: E402

# Import opcional: bloques pedagógicos enriquecidos
try:
    from app.models.study_content import StudyContentBlock
except Exception:
    StudyContentBlock = None

# Import opcional: RAG
try:
    from app.models.knowledge import KnowledgeChunk
    from app.services.rag_service import RagService
except Exception:
    KnowledgeChunk = None
    RagService = None


# ============================================================
# Utilidades generales
# ============================================================

def now_iso() -> str:
    return datetime.now(UTC).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"No existe el archivo: {path}")

    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_model_fields(model_class: type) -> set[str]:
    if hasattr(model_class, "model_fields"):
        return set(model_class.model_fields.keys())

    if hasattr(model_class, "__fields__"):
        return set(model_class.__fields__.keys())

    return set()


def build_instance(model_class: type, values: dict[str, Any]):
    fields = get_model_fields(model_class)
    clean_values = {key: value for key, value in values.items() if key in fields}
    return model_class(**clean_values)


def apply_values(instance: Any, values: dict[str, Any]) -> None:
    fields = get_model_fields(type(instance))

    for key, value in values.items():
        if key in fields:
            setattr(instance, key, value)


def as_text(value: Any, default: str = "") -> str:
    if value is None:
        return default

    if isinstance(value, str):
        return value

    if isinstance(value, list):
        return "\n".join(as_text(item) for item in value)

    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False, indent=2)

    return str(value)


def normalize_order(value: Any, default: int = 1) -> int:
    try:
        return int(value)
    except Exception:
        return default


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


# ============================================================
# Construcción de contenido enriquecido
# ============================================================

def build_key_concepts_text(key_concepts: list[dict[str, Any]]) -> str:
    if not key_concepts:
        return ""

    lines: list[str] = []

    for item in key_concepts:
        concept = as_text(item.get("concept")).strip()
        definition = as_text(item.get("definition")).strip()
        importance = as_text(item.get("importance")).strip()

        if not concept and not definition and not importance:
            continue

        line = f"- {concept}"

        if definition:
            line += f": {definition}"

        if importance:
            line += f" Importancia: {importance}"

        lines.append(line)

    return "\n".join(lines)


def build_teaching_blocks_text(blocks: list[dict[str, Any]]) -> str:
    if not blocks:
        return ""

    parts: list[str] = []

    for block in blocks:
        title = as_text(block.get("title")).strip()
        phase = as_text(block.get("phase") or block.get("block_type")).strip()
        content = (
            as_text(block.get("content")).strip()
            or as_text(block.get("tutor_message")).strip()
            or as_text(block.get("expected_answer")).strip()
        )

        if not content:
            continue

        header = title or phase or "Bloque pedagógico"
        parts.append(f"## {header}\n\n{content}")

    return "\n\n".join(parts)


def build_questions_text(title: str, questions: list[dict[str, Any]]) -> str:
    if not questions:
        return ""

    parts: list[str] = [f"## {title}"]

    for index, item in enumerate(questions, start=1):
        question = (
            as_text(item.get("question")).strip()
            or as_text(item.get("prompt")).strip()
        )

        expected = (
            as_text(item.get("expected_answer")).strip()
            or as_text(item.get("expected_reasoning")).strip()
            or as_text(item.get("model_answer")).strip()
        )

        explanation = as_text(item.get("explanation")).strip()

        if question:
            parts.append(f"{index}. {question}")

        if expected:
            parts.append(f"Respuesta esperada: {expected}")

        if explanation:
            parts.append(f"Explicación: {explanation}")

    return "\n\n".join(parts)


def build_lesson_content(lesson_data: dict[str, Any]) -> str:
    """
    Construye el contenido final de la lección para guardar en Lesson.content
    y para indexar en RAG.

    La idea es que el RAG no quede solo con texto bruto, sino también con:
    - explicación pedagógica;
    - resumen;
    - conceptos clave;
    - bloques de enseñanza;
    - ejemplos;
    - errores comunes;
    - guía oral;
    - preguntas de análisis.
    """

    parts: list[str] = []

    main_content = as_text(lesson_data.get("content")).strip()
    summary = as_text(lesson_data.get("summary")).strip()
    teaching_notes = as_text(lesson_data.get("teaching_notes")).strip()

    if main_content:
        parts.append(f"# Contenido principal\n\n{main_content}")

    if summary:
        parts.append(f"# Explicación resumida\n\n{summary}")

    if teaching_notes:
        parts.append(f"# Notas pedagógicas\n\n{teaching_notes}")

    key_concepts_text = build_key_concepts_text(
        lesson_data.get("key_concepts", []) or []
    )

    if key_concepts_text:
        parts.append(f"# Conceptos clave\n\n{key_concepts_text}")

    teaching_blocks = (
        lesson_data.get("pedagogical_blocks")
        or lesson_data.get("teaching_blocks")
        or lesson_data.get("integrated_session_blocks")
        or []
    )

    teaching_blocks_text = build_teaching_blocks_text(teaching_blocks)

    if teaching_blocks_text:
        parts.append(f"# Bloques pedagógicos\n\n{teaching_blocks_text}")

    examples = lesson_data.get("examples", []) or lesson_data.get("applied_examples", []) or []

    if examples:
        parts.append(
            "# Ejemplos aplicados\n\n"
            + "\n\n".join(
                as_text(example.get("scenario") or example.get("content") or example)
                for example in examples
            )
        )

    common_errors = lesson_data.get("common_errors", []) or []

    if common_errors:
        parts.append(
            "# Errores comunes\n\n"
            + "\n".join(f"- {as_text(error)}" for error in common_errors)
        )

    oral_questions = lesson_data.get("oral_exam_questions", []) or []

    if oral_questions:
        parts.append(build_questions_text("Preparación para examen oral", oral_questions))

    analysis_questions = lesson_data.get("analysis_questions", []) or []

    if analysis_questions:
        parts.append(build_questions_text("Preguntas de análisis", analysis_questions))

    debate_questions = lesson_data.get("debate_questions", []) or []

    if debate_questions:
        parts.append(build_questions_text("Preguntas de debate", debate_questions))

    practice_questions = lesson_data.get("practice_questions", []) or []

    if practice_questions:
        parts.append(build_questions_text("Preguntas de práctica", practice_questions))

    source_fragment = as_text(lesson_data.get("source_fragment")).strip()

    if source_fragment:
        parts.append(f"# Fragmento fuente\n\n{source_fragment}")

    final_content = "\n\n---\n\n".join(part for part in parts if part.strip()).strip()

    if final_content:
        return final_content

    return "Contenido pendiente de desarrollo pedagógico. Debe ser reemplazado por material validado."


# ============================================================
# Upserts principales
# ============================================================

def upsert_area(
    session: Session,
    area_data: dict[str, Any],
) -> StudyArea:
    name = as_text(area_data.get("name")).strip()

    if not name:
        raise ValueError("Área sin nombre.")

    area = session.exec(
        select(StudyArea).where(StudyArea.name == name)
    ).first()

    values = {
        "name": name,
        "description": as_text(area_data.get("description")),
        "order": normalize_order(area_data.get("order"), 1),
    }

    if area:
        apply_values(area, values)
    else:
        area = build_instance(StudyArea, values)

    session.add(area)
    session.commit()
    session.refresh(area)

    return area


def upsert_topic(
    session: Session,
    area: StudyArea,
    topic_data: dict[str, Any],
) -> StudyTopic:
    name = as_text(topic_data.get("name")).strip()

    if not name:
        raise ValueError("Tema sin nombre.")

    topic = session.exec(
        select(StudyTopic)
        .where(StudyTopic.name == name)
        .where(StudyTopic.study_area_id == area.id)
    ).first()

    values = {
        "study_area_id": area.id,
        "name": name,
        "description": as_text(topic_data.get("description")),
        "order": normalize_order(topic_data.get("order"), 1),
    }

    if topic:
        apply_values(topic, values)
    else:
        topic = build_instance(StudyTopic, values)

    session.add(topic)
    session.commit()
    session.refresh(topic)

    return topic


def upsert_lesson(
    session: Session,
    topic: StudyTopic,
    lesson_data: dict[str, Any],
) -> Lesson:
    title = as_text(lesson_data.get("title")).strip()

    if not title:
        title = f"Lección de {topic.name}"

    lesson = session.exec(
        select(Lesson)
        .where(Lesson.study_topic_id == topic.id)
        .where(Lesson.title == title)
    ).first()

    content = build_lesson_content(lesson_data)

    values = {
        "study_topic_id": topic.id,
        "title": title,
        "order": normalize_order(lesson_data.get("order"), 1),
        "content": content,
        "official_source": (
            as_text(lesson_data.get("official_source"))
            or as_text(lesson_data.get("source"))
        ),
        "source_reference": as_text(lesson_data.get("source_reference")),
    }

    if lesson:
        apply_values(lesson, values)
    else:
        lesson = build_instance(Lesson, values)

    session.add(lesson)
    session.commit()
    session.refresh(lesson)

    return lesson


# ============================================================
# Bloques pedagógicos opcionales
# ============================================================

def upsert_content_block(
    session: Session,
    lesson_id: int,
    topic_id: int,
    block_type: str,
    title: str,
    content: str,
    order: int,
    source_reference: str = "",
    source_fragment: str = "",
    requires_validation: bool = True,
) -> None:
    if StudyContentBlock is None:
        return

    if not content.strip():
        return

    existing = session.exec(
        select(StudyContentBlock)
        .where(StudyContentBlock.lesson_id == lesson_id)
        .where(StudyContentBlock.block_type == block_type)
        .where(StudyContentBlock.title == title)
    ).first()

    values = {
        "lesson_id": lesson_id,
        "topic_id": topic_id,
        "block_type": block_type,
        "title": title,
        "content": content,
        "order": order,
        "source_reference": source_reference,
        "source_fragment": source_fragment,
        "requires_validation": requires_validation,
    }

    if existing:
        apply_values(existing, values)
        session.add(existing)
    else:
        block = build_instance(StudyContentBlock, values)
        session.add(block)

    session.commit()


def import_pedagogical_blocks(
    session: Session,
    topic: StudyTopic,
    lesson: Lesson,
    lesson_data: dict[str, Any],
) -> int:
    if StudyContentBlock is None:
        return 0

    count = 0

    source_reference = as_text(lesson_data.get("source_reference"))
    source_fragment = as_text(lesson_data.get("source_fragment"))

    # Bloque principal
    main_content = as_text(lesson_data.get("content")).strip()

    if main_content:
        upsert_content_block(
            session=session,
            lesson_id=lesson.id,
            topic_id=topic.id,
            block_type="main_lesson",
            title="Clase principal",
            content=main_content,
            order=1,
            source_reference=source_reference,
            source_fragment=source_fragment,
        )
        count += 1

    # Resumen / explicación simple
    summary = as_text(lesson_data.get("summary")).strip()

    if summary:
        upsert_content_block(
            session=session,
            lesson_id=lesson.id,
            topic_id=topic.id,
            block_type="simple_explanation",
            title="Explicación en simple",
            content=summary,
            order=2,
            source_reference=source_reference,
            source_fragment=source_fragment,
        )
        count += 1

    # Notas pedagógicas
    teaching_notes = as_text(lesson_data.get("teaching_notes")).strip()

    if teaching_notes:
        upsert_content_block(
            session=session,
            lesson_id=lesson.id,
            topic_id=topic.id,
            block_type="doctrinal_analysis",
            title="Análisis pedagógico",
            content=teaching_notes,
            order=3,
            source_reference=source_reference,
            source_fragment=source_fragment,
        )
        count += 1

    # Conceptos clave
    key_concepts_text = build_key_concepts_text(
        lesson_data.get("key_concepts", []) or []
    )

    if key_concepts_text:
        upsert_content_block(
            session=session,
            lesson_id=lesson.id,
            topic_id=topic.id,
            block_type="key_concepts",
            title="Conceptos clave",
            content=key_concepts_text,
            order=4,
            source_reference=source_reference,
            source_fragment=source_fragment,
        )
        count += 1

    # Bloques pedagógicos explícitos del paquete
    explicit_blocks = (
        lesson_data.get("pedagogical_blocks")
        or lesson_data.get("teaching_blocks")
        or lesson_data.get("integrated_session_blocks")
        or []
    )

    base_order = 10

    for index, block in enumerate(explicit_blocks, start=base_order):
        block_type = (
            as_text(block.get("block_type"))
            or as_text(block.get("phase"))
            or "pedagogical_block"
        )

        title = as_text(block.get("title")).strip() or block_type

        content = (
            as_text(block.get("content")).strip()
            or as_text(block.get("tutor_message")).strip()
            or as_text(block.get("expected_answer")).strip()
        )

        if not content:
            continue

        upsert_content_block(
            session=session,
            lesson_id=lesson.id,
            topic_id=topic.id,
            block_type=block_type,
            title=title,
            content=content,
            order=index,
            source_reference=as_text(block.get("source_reference")) or source_reference,
            source_fragment=as_text(block.get("source_fragment")) or source_fragment,
            requires_validation=bool(block.get("requires_validation", True)),
        )
        count += 1

    return count


# ============================================================
# Visual resources
# ============================================================

def export_visual_resources(
    package_data: dict[str, Any],
    package_name: str,
    package_version: str,
) -> None:
    visual_resources = package_data.get("visual_resources", []) or []

    if not visual_resources:
        return

    output_dir = BACKEND_DIR / "storage" / "content"
    ensure_dir(output_dir)

    output_file = output_dir / "visual_resources.json"

    payload = {
        "package_name": package_name,
        "package_version": package_version,
        "imported_at": now_iso(),
        "visual_resources": visual_resources,
    }

    output_file.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# ============================================================
# Manifest de importación
# ============================================================

def write_manifest(
    package_path: Path,
    package_name: str,
    package_version: str,
    stats: dict[str, int],
) -> None:
    packages_dir = BACKEND_DIR / "storage" / "packages"
    ensure_dir(packages_dir)

    manifest_file = packages_dir / f"{package_name}_{package_version}.manifest.json"

    manifest = {
        "package_name": package_name,
        "package_version": package_version,
        "imported_at": now_iso(),
        "source_file": str(package_path),
        "status": "imported_pending_validation",
        "stats": stats,
    }

    manifest_file.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


# ============================================================
# Importador principal
# ============================================================

def import_package(package_path: Path) -> None:
    data = read_json(package_path)

    metadata = data.get("package_metadata", {}) or {}

    package_name = (
        as_text(metadata.get("package_name")).strip()
        or as_text(data.get("package_name")).strip()
        or package_path.stem
    )

    package_version = (
        as_text(metadata.get("package_version")).strip()
        or as_text(data.get("package_version")).strip()
        or "0.1.0"
    )

    stats = {
        "areas": 0,
        "topics": 0,
        "lessons": 0,
        "content_blocks": 0,
        "rag_indexed_lessons": 0,
    }

    # Crear tablas si no existen
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        for area_data in data.get("study_areas", []) or []:
            area = upsert_area(session, area_data)
            stats["areas"] += 1

            for topic_data in area_data.get("topics", []) or []:
                topic = upsert_topic(session, area, topic_data)
                stats["topics"] += 1

                for lesson_data in topic_data.get("lessons", []) or []:
                    lesson = upsert_lesson(session, topic, lesson_data)
                    stats["lessons"] += 1

                    blocks_count = import_pedagogical_blocks(
                        session=session,
                        topic=topic,
                        lesson=lesson,
                        lesson_data=lesson_data,
                    )

                    stats["content_blocks"] += blocks_count

                    # Indexar RAG
                    if RagService is not None:
                        rag = RagService(session)
                        rag.index_lesson(
                            lesson=lesson,
                            topic=topic,
                            package_name=package_name,
                            package_version=package_version,
                            content_origin="official_source",
                        )
                        stats["rag_indexed_lessons"] += 1

    export_visual_resources(data, package_name, package_version)
    write_manifest(package_path, package_name, package_version, stats)

    print("=" * 80)
    print("Paquete importado correctamente")
    print("=" * 80)
    print(f"Nombre: {package_name}")
    print(f"Versión: {package_version}")
    print(f"Archivo: {package_path}")
    print("-" * 80)
    print(f"Áreas importadas: {stats['areas']}")
    print(f"Temas importados: {stats['topics']}")
    print(f"Lecciones importadas: {stats['lessons']}")
    print(f"Bloques pedagógicos importados: {stats['content_blocks']}")
    print(f"Lecciones indexadas en RAG: {stats['rag_indexed_lessons']}")
    print("=" * 80)


# ============================================================
# CLI
# ============================================================

def main() -> None:
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python import_tutoracague.py /ruta/tutoracague_content_package.json")
        sys.exit(1)

    package_path = Path(sys.argv[1]).expanduser().resolve()

    try:
        import_package(package_path)
    except Exception as ex:
        print("Error importando paquete:")
        print(ex)
        sys.exit(1)


if __name__ == "__main__":
    main()