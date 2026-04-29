from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models.results import (
    PracticeResult,
    PracticeResultCreate,
    PracticeResultRead,
    ProgressSummary,
)

router = APIRouter(prefix="/api/results", tags=["results"])


@router.post("/practice", response_model=PracticeResultRead)
def save_practice_result(
    payload: PracticeResultCreate,
    session: Session = Depends(get_session),
):
    result = PracticeResult(
        topic_id=payload.topic_id,
        topic_name=payload.topic_name,
        source_mode=payload.source_mode,
        total_questions=payload.total_questions,
        correct_answers=payload.correct_answers,
        incorrect_answers=payload.incorrect_answers,
        score_percentage=payload.score_percentage,
    )

    session.add(result)
    session.commit()
    session.refresh(result)

    return result


@router.get("/practice/recent", response_model=list[PracticeResultRead])
def get_recent_results(
    limit: int = 10,
    session: Session = Depends(get_session),
):
    results = session.exec(
        select(PracticeResult)
        .order_by(PracticeResult.created_at.desc())
        .limit(limit)
    ).all()

    return results


@router.get("/summary", response_model=ProgressSummary)
def get_progress_summary(
    session: Session = Depends(get_session),
):
    results = session.exec(
        select(PracticeResult).order_by(PracticeResult.created_at.desc())
    ).all()

    if not results:
        return ProgressSummary(
            total_sessions=0,
            average_score=0,
            best_score=0,
            last_score=0,
            weakest_topics=[],
            recent_results=[],
        )

    total_sessions = len(results)
    average_score = sum(item.score_percentage for item in results) / total_sessions
    best_score = max(item.score_percentage for item in results)
    last_score = results[0].score_percentage

    topic_groups: dict[int, dict] = {}

    for item in results:
        if item.topic_id not in topic_groups:
            topic_groups[item.topic_id] = {
                "topic_id": item.topic_id,
                "topic_name": item.topic_name,
                "sessions": 0,
                "average_score": 0,
                "scores": [],
            }

        topic_groups[item.topic_id]["sessions"] += 1
        topic_groups[item.topic_id]["scores"].append(item.score_percentage)

    weakest_topics = []

    for group in topic_groups.values():
        scores = group["scores"]
        group["average_score"] = sum(scores) / len(scores)
        weakest_topics.append(
            {
                "topic_id": group["topic_id"],
                "topic_name": group["topic_name"],
                "sessions": group["sessions"],
                "average_score": round(group["average_score"], 1),
            }
        )

    weakest_topics = sorted(
        weakest_topics,
        key=lambda item: item["average_score"],
    )[:5]

    return ProgressSummary(
        total_sessions=total_sessions,
        average_score=round(average_score, 1),
        best_score=round(best_score, 1),
        last_score=round(last_score, 1),
        weakest_topics=weakest_topics,
        recent_results=results[:10],
    )