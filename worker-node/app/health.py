from flask import Blueprint, jsonify

from .logger import logger

health_bp = Blueprint('health', __name__) # Health check blueprint

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify if the service is running.
    """
    logger.info("Health check endpoint accessed")
    return jsonify({"status": "Healthy"}), 200