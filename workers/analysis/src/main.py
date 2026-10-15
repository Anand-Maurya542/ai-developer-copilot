import sys
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"worker-analysis","message":"%(message)s"}'
)
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting AI Developer Copilot - Analysis Worker (PR Intelligence & Issue Planner)")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down analysis worker cleanly.")
        sys.exit(0)

if __name__ == '__main__':
    main()
