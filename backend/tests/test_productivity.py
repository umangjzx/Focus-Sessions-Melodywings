from app.services.productivity import calculate_productivity_score, calculate_xp


def test_full_score():
    assert calculate_productivity_score(25, 25, True, 5) == 100.0


def test_xp():
    assert calculate_xp(25, 80, True) > 0
