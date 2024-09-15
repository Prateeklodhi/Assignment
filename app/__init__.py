from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from .config import Config
from flask_cors import CORS
#url 
url = Config.LOCALHOST + Config.API_VERSION

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()
jwt = JWTManager()
cors = CORS()
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")  # Enable CORS for SocketIO

    # Register blueprints
    from .routes import main
    app.register_blueprint(main)

    return app
