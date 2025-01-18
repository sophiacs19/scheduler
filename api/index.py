import os
from flask import Flask, jsonify, request, send_from_directory
import psycopg2

# Initialize Flask app
app = Flask(__name__)

# Routes
@app.route('/')
def index():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'calendar.html')

@app.route('/events/all')
def getAllEvents():
    return db_query("SELECT * FROM events")


@app.route('/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    sql = f'delete from events where id = {event_id}'
    deleteCount = db_exec(sql)
    if deleteCount == 1:
        return jsonify({"message": "Event deleted successfully!"}), 200
    else:
        return jsonify({"message": deleteCount + " event deleted!"}), 404

@app.route('/events/add/<dateKey>', methods=['POST'])
def add_event(dateKey):
    eventItem = request.get_json()
    sql = 'INSERT INTO events (title, user_id, date, start_time, end_time) VALUES (%s, %s, %s, %s, %s)'
    affected = db_exec(sql, (eventItem['text'], 1, dateKey, eventItem['startTime'], eventItem['endTime']))
    if affected == 1:
        return jsonify({ "message": "1 Event added successfully!" }), 200
    else:
        return jsonify({ "message": f'{affected} event added!' }), 404


# Database connection details
DB_CONFIG = {
    'dbname': 'neondb',
    'user': 'neondb_owner',
    'password': 'jQ6iBJTAKL9d',
    'host': 'ep-old-bush-a5chll5l-pooler.us-east-2.aws.neon.tech',  
    'port': '5432',       # Default PostgreSQL port
}

def db_exec(sql, values=None):
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute(sql, values)
        connection.commit()
    
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
    finally:
        # Close the database connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def db_query(sql):
    try:
        # Connect to the PostgreSQL database
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()

        # Query to fetch all users
        cursor.execute(sql)

        # Fetch all rows from the result
        resultList = cursor.fetchall()

        # return the result
        return jsonify(resultList)
    
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
    finally:
        # Close the database connection
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    data = request.get_json()
    
    event.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    event.time = datetime.strptime(data['time'], '%H:%M').time() if 'time' in data else None
    event.title = data['title']
    
    db.session.commit()
    
    return jsonify({"message": "Event updated successfully!"}), 200


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({"message": "Task deleted successfully!"}), 200



if __name__ == "__main__":
    app.run(debug=True)