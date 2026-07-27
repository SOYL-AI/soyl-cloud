"""Password and token primitives.

This is the file where a mistake is a security bug, so the tests assert
properties rather than outputs.
"""

from __future__ import annotations

import pytest

from soyl.domain.identity.secrets import (
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
    PasswordTooLong,
    PasswordTooShort,
    generate_token,
    hash_password,
    hash_token,
    needs_rehash,
    tokens_equal,
    verify_dummy_password,
    verify_password,
)

PASSWORD = "a-perfectly-reasonable-passphrase"


def test_a_password_verifies_against_its_own_hash() -> None:
    assert verify_password(PASSWORD, hash_password(PASSWORD))


def test_a_wrong_password_does_not_verify() -> None:
    assert not verify_password("not-the-password-at-all", hash_password(PASSWORD))


def test_the_hash_is_argon2id_and_not_the_password() -> None:
    encoded = hash_password(PASSWORD)

    assert encoded.startswith("$argon2id$")
    assert PASSWORD not in encoded


def test_the_same_password_hashes_differently_every_time() -> None:
    # Per-password salt. Without it, identical passwords are visibly identical
    # in a dump, which tells an attacker which accounts to try first.
    assert hash_password(PASSWORD) != hash_password(PASSWORD)


def test_a_short_password_is_refused() -> None:
    with pytest.raises(PasswordTooShort):
        hash_password("a" * (MIN_PASSWORD_LENGTH - 1))


def test_an_absurdly_long_password_is_refused() -> None:
    with pytest.raises(PasswordTooLong):
        hash_password("a" * (MAX_PASSWORD_LENGTH + 1))


def test_a_long_but_permitted_password_still_works() -> None:
    long_password = "a" * MAX_PASSWORD_LENGTH
    assert verify_password(long_password, hash_password(long_password))


def test_verification_against_no_password_returns_false() -> None:
    # A user who signed up through Google has no password_hash.
    assert not verify_password(PASSWORD, None)
    assert not verify_password(PASSWORD, "")


def test_verification_against_a_corrupt_hash_returns_false_rather_than_raising() -> None:
    # A malformed row must be a failed login, not a 500 that reveals its shape.
    assert not verify_password(PASSWORD, "not-a-hash")


def test_the_dummy_verifier_always_fails() -> None:
    # It exists to spend time, not to authenticate.
    assert not verify_dummy_password(PASSWORD)
    assert not verify_dummy_password("")


def test_current_parameters_do_not_need_rehashing() -> None:
    assert not needs_rehash(hash_password(PASSWORD))


def test_a_weaker_hash_is_flagged_for_rehash() -> None:
    weak = (
        "$argon2id$v=19$m=1024,t=1,p=1$"
        "c29tZXNhbHRzb21lc2FsdA$Ny3d3Rr3g5nJ8Yb0kqkR6MmMkiTgtBNLDCU8pQTHmZs"
    )
    assert needs_rehash(weak)


def test_an_unparseable_hash_is_flagged_for_rehash() -> None:
    assert needs_rehash("garbage")


def test_tokens_are_unique_and_long() -> None:
    tokens = {generate_token() for _ in range(200)}

    assert len(tokens) == 200
    # 32 bytes base64url-encoded, without padding.
    assert all(len(token) >= 43 for token in tokens)


def test_hashing_a_token_is_deterministic_and_not_reversible() -> None:
    token = generate_token()
    digest = hash_token(token)

    assert digest == hash_token(token)
    assert len(digest) == 32
    assert token.encode() not in digest


def test_different_tokens_hash_differently() -> None:
    assert hash_token(generate_token()) != hash_token(generate_token())


def test_digest_comparison() -> None:
    token = generate_token()

    assert tokens_equal(hash_token(token), hash_token(token))
    assert not tokens_equal(hash_token(token), hash_token(generate_token()))
