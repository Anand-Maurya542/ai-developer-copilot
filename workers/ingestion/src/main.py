import os
import sys
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"worker-ingestion","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting AI Developer Copilot - Ingestion Worker")
    logger.info("Connecting to Redis queue for 'repository.index.requested' events...")

    # Worker event loop skeleton
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down ingestion worker cleanly.")
        sys.exit(0)

if __name__ == '__main__':
    main()

