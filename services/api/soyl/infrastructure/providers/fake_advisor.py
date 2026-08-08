"""A deterministic advisor, for tests and local development.

Templates the visitor's own answers back at them. That is a lower bar than the
real one clears, and it is the correct bar for a fake: it proves the route, the
rate limit, the sanitiser and the renderer without a key or a bill, and it
cannot accidentally look like evidence of quality.
"""

from __future__ import annotations

from soyl.domain.ai.advisor import AdvisorAnswers, AdvisorBlock, AdvisorInsight, sanitise
from soyl.domain.ai.conversational_advisor import ChatResponse, ChatTurn, ProductSuggestion
from soyl.domain.ai.ports import Usage

PROVIDER = "fake"


class FakeAdvisor:
    """Implements `AdvisorProvider` with no I/O."""

    def __init__(self, *, model: str = "fake-advisor-v1") -> None:
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def advise(self, answers: AdvisorAnswers) -> tuple[AdvisorInsight, Usage]:
        filled = answers.filled()
        rooms = filled.get("rooms", "your")
        pain = filled.get("pain", "finding the right answer quickly")

        insight = AdvisorInsight(
            headline=f"A {rooms}-room property where the problem is {pain.lower()}.",
            blocks=[
                AdvisorBlock(
                    type="text.markdown",
                    markdown=(
                        f"You said the time goes on {pain.lower()}. That is a document "
                        "problem rather than a staffing one: the answer already exists, "
                        "and the cost is in the looking."
                    ),
                ),
                AdvisorBlock(
                    type="list.checklist",
                    title="What you could ask on day one",
                    items=[
                        "What is our cancellation policy for corporate bookings?",
                        "How long do we hold items left behind in a room?",
                        "Who signs off a discount above twenty per cent?",
                    ],
                ),
            ],
        )
        return sanitise(insight, answers=answers), Usage(
            provider=PROVIDER, model=self._model
        )


class FakeConversationalAdvisor:
    """Implements `ConversationalAdvisorProvider` with no I/O."""

    def __init__(self, *, model: str = "fake-conversational-advisor-v1") -> None:
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def chat(self, turn: ChatTurn) -> tuple[ChatResponse, Usage]:
        if len(turn.messages) < 4:
            resp = ChatResponse(
                message="Tell me more about your property.",
                options=["We are independent", "We are a group"],
                phase="profiling",
                insight=None,
                product_suggestions=[]
            )
        else:
            resp = ChatResponse(
                message="Here is my recommendation.",
                options=[],
                phase="insight",
                insight=AdvisorInsight(
                    headline="You run a hotel.",
                    blocks=[AdvisorBlock(type="text.markdown", markdown="Here is some advice.")]
                ),
                product_suggestions=[
                    ProductSuggestion(product="Butler AI", reason="You mentioned guest requests.", relevance="high")
                ]
            )
        return resp, Usage(provider=PROVIDER, model=self._model)
