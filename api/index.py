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
        return jsonify({"message": f'{deleteCount} event deleted!'}), 404

@app.route('/events/add/<dateKey>', methods=['POST'])
def add_event(dateKey):
    eventItem = request.get_json()
    sql = 'INSERT INTO events (title, user_id, date, start_time, end_time) VALUES (%s, %s, %s, %s, %s)'
    affected = db_exec(sql, (eventItem['text'], 1, dateKey, eventItem['startTime'], eventItem['endTime']))
    if affected == 1:
        return jsonify({ "message": "1 Event added successfully!" }), 200
    else:
        return jsonify({ "message": f'{affected} event added!' }), 404

@app.route('/events/update', methods=['POST'])
def update_event():
    eventItem = request.get_json()
    sql = """
        UPDATE events
        SET title = %s, start_time = %s, end_time = %s
        WHERE id = %s
        """
    affected = db_exec(sql, (eventItem['text'], eventItem['startTime'], eventItem['endTime'], eventItem['id']))
    if affected == 1:
        return jsonify({ "message": "1 Event updated successfully!" }), 200
    else:
        return jsonify({ "message": f'{affected} event updated!' }), 404


@app.route('/tasks/all')
def getAllTasks():
    sql = "SELECT * FROM tasks"
    tasks = db_query(sql)
    print("Fetched tasks:", tasks)  
    return tasks

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    sql = f'delete from tasks where id = {task_id}'
    deleteCount = db_exec(sql)
    if deleteCount == 1:
        return jsonify({"message": "Task deleted successfully!"}), 200
    else:
        return jsonify({"message": f'{deleteCount} task deleted!'}), 404

@app.route('/tasks/add/<dateKey>', methods=['POST'])
def add_task(dateKey):
    taskItem = request.get_json()
    sql = 'INSERT INTO tasks (title, user_id, date, done, "order") VALUES (%s, %s, %s, %s, %s)'
    affected = db_exec(sql, (taskItem['text'], 1, dateKey, taskItem['done'], taskItem['order']))
    if affected == 1:
        return jsonify({ "message": "1 task added successfully!" }), 200
    else:
        return jsonify({ "message": f'{affected} task added!' }), 404

@app.route('/tasks/update', methods=['POST'])
def update_task():
    taskItem = request.get_json()
    sql = 'UPDATE tasks SET title = %s, done = %s, "order" = %s WHERE id = %s'
 
    affected = db_exec(sql, (taskItem['text'], taskItem['done'], taskItem['order'], taskItem['id']))
    if affected == 1:
        return jsonify({ "message": "1 task updated successfully!" }), 200
    else:
        return jsonify({ "message": f'{affected} task updated!' }), 404


# Database connection details
DB_CONFIG = {
    'dbname': 'neondb',
    'user': 'neondb_owner',
    'password': 'jQ6iBJTAKL9d',
    'host': 'ep-old-bush-a5chll5l-pooler.us-east-2.aws.neon.tech',  
    'port': '5432',      
}

def db_exec(sql, values=None):
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute(sql, values)
        connection.commit()
        return cursor.rowcount
    
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def db_query(sql):
    try:
        connection = psycopg2.connect(**DB_CONFIG)
        cursor = connection.cursor()
        cursor.execute(sql)
        resultList = cursor.fetchall()
        return jsonify(resultList)
    
    except psycopg2.Error as e:
        print(f"Error connecting to the database: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()





if __name__ == "__main__":
    app.run(debug=True)