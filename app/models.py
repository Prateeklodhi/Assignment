from . import db
from datetime import datetime
from werkzeug.security import generate_password_hash,check_password_hash

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'user'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

        # Password hashing method
    def set_password(self, password):
        print(password)
        print(generate_password_hash(password))
        self.password = generate_password_hash(password)

    # Password verification method
    def check_password(self, password):
        return check_password_hash(self.password, password)

    def __repr__(self):
        return f"<User {self.username}>"

class Parcel(db.Model):
    __tablename__ = 'parcels'

    id = db.Column(db.Integer, primary_key=True)
    sender_name = db.Column(db.String(255), nullable=False)
    receiver_name = db.Column(db.String(255), nullable=False)
    delivery_status = db.Column(db.Enum('received', 'in-transit', 'delivered', 'canceled'), nullable=False, default='received')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f"<Parcel {self.id}>"

class TransactionLog(db.Model):
    __tablename__ = 'transaction_logs'

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey('parcels.id'), nullable=False)
    action = db.Column(db.String(255), nullable=False)
    performed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # Relationships
    parcel = db.relationship('Parcel', backref='logs', lazy=True)
    user = db.relationship('User', backref='logs', lazy=True)

    def __repr__(self):
        return f"<TransactionLog {self.id}>"
