import re

from sqlmodel import Session, select

from app.models.knowledge import KnowledgeChunk
from app.models.study import Lesson, StudyTopic


class RagService:
    def __init__(self, session: Session):
        self.session = session

    def index_lesson(
        self,
        lesson: Lesson,
        topic: StudyTopic,
        package_name: str = "",
        package_version: str = "",
        content_origin: str = "official_source",
    ) -> None:
        content = getattr(lesson, "content", "") or ""

        if len(content.strip()) < 100:
            return

        existing_chunks = self.session.exec(
            select(KnowledgeChunk).where(KnowledgeChunk.lesson_id == lesson.id)
        ).all()

        for chunk in existing_chunks:
            self.session.delete(chunk)

        self.session.commit()

        chunks = self._split_text(content)

        for index, chunk_text in enumerate(chunks):
            chunk = KnowledgeChunk(
                package_name=package_name,
                package_version=package_version,
                area_id=getattr(topic, "study_area_id", None),
                topic_id=topic.id,
                lesson_id=lesson.id,
                source_title=getattr(lesson, "title", "") or "",
                source_reference=getattr(lesson, "source_reference", "") or "",
                source_type="official_document",
                chunk_index=index,
                content=chunk_text,
                content_origin=content_origin,
                requires_validation=True,
            )

            self.session.add(chunk)

        self.session.commit()

    def search(
        self,
        topic_id: int,
        query: str,
        limit: int = 8,
    ) -> list[KnowledgeChunk]:
        chunks = list(
            self.session.exec(
                select(KnowledgeChunk).where(KnowledgeChunk.topic_id == topic_id)
            ).all()
        )

        if not chunks:
            return []

        query_words = self._keywords(query)

        scored: list[tuple[int, KnowledgeChunk]] = []

        for chunk in chunks:
            text = " ".join(
                [
                    chunk.source_title or "",
                    chunk.source_reference or "",
                    chunk.content or "",
                ]
            )

            chunk_words = self._keywords(text)
            score = len(query_words.intersection(chunk_words))

            if score > 0:
                scored.append((score, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)

        selected = [chunk for score, chunk in scored[:limit]]

        if selected:
            return selected

        return chunks[:limit]

    def build_context(
        self,
        topic_id: int,
        query: str,
        limit: int = 8,
    ) -> str:
        chunks = self.search(topic_id=topic_id, query=query, limit=limit)

        if not chunks:
            return ""

        parts: list[str] = []

        for index, chunk in enumerate(chunks, start=1):
            parts.append(
                "\n".join(
                    [
                        f"[FUENTE RAG {index}]",
                        f"Título: {chunk.source_title}",
                        f"Referencia: {chunk.source_reference or 'Sin referencia específica'}",
                        f"Origen: {chunk.content_origin}",
                        "Contenido:",
                        chunk.content,
                    ]
                )
            )

        return "\n\n---\n\n".join(parts)

    def _split_text(
        self,
        text: str,
        max_chars: int = 1400,
        overlap: int = 180,
    ) -> list[str]:
        clean = " ".join(text.split())

        if not clean:
            return []

        if len(clean) <= max_chars:
            return [clean]

        chunks: list[str] = []
        start = 0
        text_length = len(clean)

        while start < text_length:
            end = min(start + max_chars, text_length)
            chunk = clean[start:end]

            if end < text_length:
                cut_positions = [
                    chunk.rfind(". "),
                    chunk.rfind("; "),
                    chunk.rfind(": "),
                ]

                best_cut = max(cut_positions)

                if best_cut > int(max_chars * 0.45):
                    end = start + best_cut + 1
                    chunk = clean[start:end]

            chunk = chunk.strip()

            if len(chunk) > 80:
                chunks.append(chunk)

            if end >= text_length:
                break

            next_start = end - overlap

            if next_start <= start:
                next_start = end

            start = next_start

        return chunks

    def _keywords(self, text: str) -> set[str]:
        words = re.findall(r"\b[a-záéíóúñü0-9]{4,}\b", text.lower())

        stopwords = {
            "para",
            "como",
            "este",
            "esta",
            "estos",
            "estas",
            "desde",
            "sobre",
            "entre",
            "donde",
            "cuando",
            "porque",
            "tema",
            "contenido",
            "usuario",
            "explica",
            "explicar",
            "fuente",
            "manual",
            "documento",
            "forma",
            "debe",
            "deben",
        }

        return {word for word in words if word not in stopwords}