import os
import sys

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError

from .logger import logger

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/todo-app")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "todo-app")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "tasks")

_mongoClient = None
_mongoDb = None
_mongoCollection = None

def get_mongo_connection():
    """
    Get a MongoDB connection and return the collection object.
    """
    global _mongoClient, _mongoDb, _mongoCollection

    if _mongoCollection is not None:
        return _mongoCollection
    
    logger.info(f"Attempting to connect to MongoDB at {MONGODB_URI}")
    try:
        # Connect to MongoDB
        _mongoClient = MongoClient(MONGODB_URI)
        # Select the database
        _mongoDb = _mongoClient[MONGODB_DATABASE]
        # Select the collection
        _mongoCollection = _mongoDb[MONGODB_COLLECTION]

        # ping command to check if the connection is successful
        _mongoClient.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {MONGODB_DATABASE}, collection: {MONGODB_COLLECTION}")
        return _mongoCollection
    except ConnectionFailure as err:
        logger.error(f"Failed to connect to MongoDB: {err}", exc_info=True)
        sys.exit(1)
    except PyMongoError as err:
        logger.error(f"An unexpected error occurred in PyMongo: {err}", exc_info=True)
        sys.exit(1)
    except Exception as err:
        logger.error(f"An error occurred while connecting to MongoDB: {err}", exc_info=True)
        sys.exit(1)

def close_mongo_connection():
    """
    Close the MongoBD connection if it is open.
    """
    global _mongoClient
    if _mongoClient is not None:
        try:
            _mongoClient.close()
            logger.info("MongoDB connection closed successfully.")
            _mongoClient = None
        except Exception as err:
            logger.error(f"Failed to close MongoDB connection: {err}", exc_info=True)
    else:
        logger.info("MongoDB connection is already closed or was never opened.")

import atexit

# Register the close connection function to be called on exit
atexit.register(close_mongo_connection)
