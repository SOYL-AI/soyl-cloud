"""S3-compatible object storage.

**The only file in the codebase that imports an S3 SDK.** MinIO locally, R2 or
equivalent in production, Azure Blob eventually — and when that day comes, this
is the file that gets a sibling and nothing else changes.

`import-linter` keeps `soyl.domain` from reaching in here; the discipline that
keeps *application* code out is that `StoragePort` exposes everything worth
asking for, so there is never a reason to reach past it.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import aioboto3
from botocore.config import Config
from botocore.exceptions import ClientError

from soyl.domain.storage import ObjectNotFound, StorageError, UploadTicket


class S3Storage:
    """Implements `StoragePort` against anything speaking the S3 API."""

    def __init__(
        self,
        *,
        endpoint_url: str | None,
        region: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        upload_ttl: timedelta = timedelta(minutes=15),
    ) -> None:
        self._endpoint_url = endpoint_url
        self._region = region
        self._bucket = bucket
        self._access_key = access_key
        self._secret_key = secret_key
        self._upload_ttl = upload_ttl
        self._session = aioboto3.Session()

    def _client(self) -> Any:
        """An async S3 client context manager.

        `Any` because aioboto3 generates its clients at runtime and has no
        inline types; the alternative is the `types-aioboto3` stub package,
        which is large and would only sharpen the types inside this one file.
        Everything crossing the seam is typed by `StoragePort`, which is where
        it matters.
        """
        return self._session.client(
            "s3",
            endpoint_url=self._endpoint_url,
            region_name=self._region,
            aws_access_key_id=self._access_key,
            aws_secret_access_key=self._secret_key,
            config=Config(
                # MinIO and R2 both want path-style addressing; virtual-hosted
                # style requires DNS per bucket, which neither provides
                # locally.
                s3={"addressing_style": "path"},
                signature_version="s3v4",
                retries={"max_attempts": 3, "mode": "standard"},
            ),
        )

    async def upload_ticket(
        self, *, key: str, content_type: str, max_bytes: int
    ) -> UploadTicket:
        """A presigned PUT.

        `content_type` is signed into the URL, so the browser cannot upload a
        script and later have it served as one. `max_bytes` is enforced by the
        caller before the ticket is issued — a presigned PUT cannot itself cap
        the body, which is why the document row is created first and the size
        checked against it.
        """
        async with self._client() as client:
            try:
                url = await client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": self._bucket,
                        "Key": key,
                        "ContentType": content_type,
                    },
                    ExpiresIn=int(self._upload_ttl.total_seconds()),
                )
            except ClientError as exc:
                raise StorageError(f"Could not sign an upload URL: {exc}") from exc

        return UploadTicket(
            url=url,
            key=key,
            expires_in=self._upload_ttl,
            # The client must send exactly this or the signature will not
            # verify, which presents as a 403 that looks like bad credentials.
            required_headers={"Content-Type": content_type},
        )

    async def download(self, *, key: str) -> bytes:
        async with self._client() as client:
            try:
                response = await client.get_object(Bucket=self._bucket, Key=key)
                async with response["Body"] as stream:
                    data: bytes = await stream.read()
                    return data
            except ClientError as exc:
                if _is_missing(exc):
                    raise ObjectNotFound(key) from exc
                raise StorageError(f"Could not read {key}: {exc}") from exc

    async def delete(self, *, key: str) -> None:
        async with self._client() as client:
            try:
                await client.delete_object(Bucket=self._bucket, Key=key)
            except ClientError as exc:
                # S3 treats deleting a missing key as success; some
                # implementations do not. Erasure must be idempotent either
                # way — a retried deletion cannot fail because the first
                # attempt worked.
                if _is_missing(exc):
                    return
                raise StorageError(f"Could not delete {key}: {exc}") from exc

    async def exists(self, *, key: str) -> bool:
        async with self._client() as client:
            try:
                await client.head_object(Bucket=self._bucket, Key=key)
            except ClientError as exc:
                if _is_missing(exc):
                    return False
                raise StorageError(f"Could not stat {key}: {exc}") from exc
        return True

    async def ensure_bucket(self) -> None:
        """Create the bucket if it is absent. Local development only.

        Production buckets are provisioned deliberately, with lifecycle rules
        and access policy attached; a service that creates its own bucket on
        boot would create one without any of that.
        """
        async with self._client() as client:
            try:
                await client.head_bucket(Bucket=self._bucket)
            except ClientError:
                try:
                    await client.create_bucket(Bucket=self._bucket)
                except ClientError as exc:
                    raise StorageError(f"Could not create bucket: {exc}") from exc


def _is_missing(exc: ClientError) -> bool:
    code = exc.response.get("Error", {}).get("Code", "")
    status = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
    return code in ("404", "NoSuchKey", "NoSuchBucket", "NotFound") or status == 404
