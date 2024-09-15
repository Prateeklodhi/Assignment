import pandas as pd
from flask import Blueprint, jsonify, request
from .models import User, Parcel, TransactionLog
from . import db,socketio
from io import StringIO
from .constants.constant import url_routes
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity


main = Blueprint('main', __name__)

@main.route('/',methods = ["GET"])
def index_page():
    return "Welcome to delivery system webapp."

@main.route('/api/v1',methods = ['GET'])
def apis():
    return jsonify(url_routes),200

#? =====================<Get all parcels >=============================
# Routes for parcel
@main.route('/parcels', methods=['GET'])
@jwt_required()
def get_parcels():
    parcels = Parcel.query.all()
    return jsonify([{
        'id': p.id,
        'sender_name': p.sender_name,
        'receiver_name': p.receiver_name,
        'delivery_status': p.delivery_status
    } for p in parcels]),200

#? =====================<Add new parcel>===============================
@main.route('/parcels', methods=['POST'])
@jwt_required()
def add_parcel():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user.role != 'admin':  # Only admins can add parcels
        return jsonify({'message': 'Access denied'}), 403

    data = request.json
    sender =  data.get('sender_name')
    receiver =  data.get('receiver_name')

    if data:
        if not receiver or not sender:
            return jsonify({'message': 'Please add the required sender or reciver name','status':400,'success':True}),400
        new_parcel = Parcel(sender_name=data['sender_name'], receiver_name=data['receiver_name'])
        db.session.add(new_parcel)
        db.session.commit()

        new_log = TransactionLog(parcel_id=new_parcel.id, action='Created', performed_by=user.id)
        db.session.add(new_log)
        db.session.commit()

        socketio.emit('new_parcel', {
        'parcel_id': new_parcel.id,
        'sender_name': new_parcel.sender_name,
        'receiver_name': new_parcel.receiver_name,
        'status': new_parcel.delivery_status
        })

        return jsonify({'message': 'Parcel added','status':201,'success':True}),201
    else :
        return jsonify({'message': 'Invalid data','status':400,'success':False}),400
    
#? ======================< Update parcel >==============================
@main.route('/parcels/<int:id>', methods=['PUT'])
@jwt_required()
def update_parcel(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user.role != 'admin':  # Only admins can update parcels
        return jsonify({'message': 'Access denied','status':403,'success':False}), 403
    
    parcel = Parcel.query.get_or_404(id)
    data = request.json
    if data :
        delivery_status = data.get('delivery_status')
        if delivery_status not in ['in-transit', 'delivered', 'canceled']:
            return jsonify({'message': 'Vallid values are : delivered, canceled, in-transit','status':403,'success':False}), 403
        parcel.delivery_status = delivery_status
        db.session.commit()

        # Log the transaction
        new_log = TransactionLog(parcel_id=parcel.id, action=f'Updated to {parcel.delivery_status}', performed_by=user.id)
        db.session.add(new_log)
        db.session.commit()

        socketio.emit('update_parcel', {
        'parcel_id': parcel.id,
        'status': parcel.delivery_status
        })

        return jsonify({'message': 'Parcel updated','status':200,'success':True}),200
    else :
        return jsonify({'message': 'Invalid data','status':400,'success':False}),400

#? ==========================<Get logs >==========================
@main.route('/parcels/<int:id>/logs', methods=['GET'])
@jwt_required()
def get_parcel_logs(id):
    logs = TransactionLog.query.filter_by(parcel_id=id).all()

     # Emit event to notify clients about the logs
    socketio.emit('transaction_logs', [{
        'id': log.id,
        'action': log.action,
        'performed_by': User.query.get(log.performed_by).username,
        'created_at': log.created_at
    } for log in logs])

    return jsonify([{
        'id': log.id,
        'action': log.action,
        'performed_by': User.query.get(log.performed_by).username,
        'created_at': log.created_at
    } for log in logs]),200


#? ==========================< Bulk processing >==========================
@main.route('/parcels/bulk', methods=['POST'])
@jwt_required()
def bulk_upload_parcels():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if user.role != 'admin':  # Only admins can bulk upload
        return jsonify({'message': 'Access denied'}), 403

    # Retrieve the uploaded file
    file = request.files['file']

    try:
        # Try reading the file with UTF-8 encoding first
        stream = StringIO(file.stream.read().decode("utf-8"))
    except UnicodeDecodeError:
        # If UTF-8 fails, try reading with a different encoding, such as ISO-8859-1
        stream = StringIO(file.stream.read().decode("ISO-8859-1"))

    try:
        # Read the CSV into a DataFrame using Pandas
        csv_input = pd.read_csv(stream)

        # Iterate through the CSV and create parcels
        for index, row in csv_input.iterrows():
            new_parcel = Parcel(sender_name=row['sender_name'], receiver_name=row['receiver_name'], delivery_status='received')
            db.session.add(new_parcel)
            db.session.commit()

            # Log the transaction (you can add a transaction log model if needed)
            new_log = TransactionLog(parcel_id=new_parcel.id, action='Created in bulk', performed_by=user.id)
            db.session.add(new_log)
            db.session.commit()

        return jsonify({'message': 'Bulk upload successful'}), 201

    except Exception as e:
        # Handle other exceptions such as parsing errors
        return jsonify({'message': f'Error processing file: {str(e)}'}), 400


#? ======================< Register new user>==============================
# Register User
@main.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')
    if not username or not password:
        return jsonify({'message':f'Please fill userrname or password'})
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400

    new_user = User(username=username,role=role,password=password)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

#? =========================<Login user>===========================
# Login User
@main.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password') 
    if not username or not password:
        return jsonify({'message':f'Please fill userrname or password'})
    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=user.id)
        return jsonify({'token': access_token}), 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401


#? =========================<Check admin>===========================
# Route to check if the current user is an admin
@main.route('/check-admin', methods=['GET'])
@jwt_required()
def check_admin():
    # Get the current user's ID from the JWT token
    current_user_id = get_jwt_identity()

    # Find the user in the database
    user = User.query.get(current_user_id)

    # Check if the user is an admin
    if user and user.role == 'admin':
        return jsonify({'is_admin': True}), 200
    else:
        return jsonify({'is_admin': False}), 403