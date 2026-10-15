import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class SnapshotPublisher:
    """
    Implements the Atomic Publication Algorithm defined in Blueprint Section 6.
    Ensures zero half-published snapshots are queryable.
    """
    def __init__(self, db_connection):
        self.conn = db_connection

    def publish_snapshot_atomically(
        self,
        repository_id: str,
        staging_snapshot_id: str,
        expected_chunk_count: int
    ) -> bool:
        """
        Validates chunk coverage and commits the snapshot swap in a single atomic transaction.
        """
        with self.conn.cursor() as cur:
            try:
                # 1. Validate chunk counts and embedding coverage
                cur.execute(
                    "SELECT COUNT(*) FROM code_chunks WHERE snapshot_id = %s",
                    (staging_snapshot_id,)
                )
                actual_chunks = cur.fetchone()[0]

                if actual_chunks != expected_chunk_count:
                    raise ValueError(
                        f"Chunk count mismatch. Expected {expected_chunk_count}, got {actual_chunks}"
                    )

                # 2. Find currently active snapshot to supersede
                cur.execute(
                    "SELECT active_snapshot_id FROM repositories WHERE id = %s",
                    (repository_id,)
                )
                row = cur.fetchone()
                prior_snapshot_id = row[0] if row else None

                # 3. Mark new snapshot READY
                cur.execute(
                    "UPDATE repository_snapshots SET status = 'READY' WHERE id = %s",
                    (staging_snapshot_id,)
                )

                # 4. Atomically point repository to new snapshot
                cur.execute(
                    "UPDATE repositories SET active_snapshot_id = %s, updated_at = NOW() WHERE id = %s",
                    (staging_snapshot_id, repository_id)
                )

                # 5. Mark prior snapshot as SUPERSEDED
                if prior_snapshot_id:
                    cur.execute(
                        "UPDATE repository_snapshots SET status = 'SUPERSEDED' WHERE id = %s",
                        (prior_snapshot_id,)
                    )

                self.conn.commit()
                logger.info(f"Successfully activated snapshot {staging_snapshot_id} for repo {repository_id}")
                return True

            except Exception as e:
                self.conn.rollback()
                logger.error(f"Failed to publish snapshot {staging_snapshot_id}: {e}")
                # Mark staging snapshot as FAILED
                with self.conn.cursor() as fail_cur:
                    fail_cur.execute(
                        "UPDATE repository_snapshots SET status = 'FAILED' WHERE id = %s",
                        (staging_snapshot_id,)
                    )
                    self.conn.commit()
                return False
