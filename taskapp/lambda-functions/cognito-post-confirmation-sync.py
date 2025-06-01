import json
import boto3
import pymysql
from datetime import datetime
from pymysql.constants import CLIENT

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table('Users')

# RDS config - update with your values
RDS_HOST = 'tasksdbplease.csjscociq2xx.us-east-1.rds.amazonaws.com'
RDS_USER = 'hager'
RDS_PASSWORD = 'Hager200'
RDS_DB = 'task_manager'
RDS_PORT = 3306

def get_db_connection():
    return pymysql.connect(
        host=RDS_HOST,
        user=RDS_USER,
        password=RDS_PASSWORD,
        database=RDS_DB,
        port=RDS_PORT,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        client_flag=CLIENT.MULTI_STATEMENTS
    )

def lambda_handler(event, context):
    # User info from the event
    user_attributes = event['request']['userAttributes']
    user_id = user_attributes.get('sub')
    email = user_attributes.get('email')
    name = user_attributes.get('name', 'Unknown')

    current_time = datetime.utcnow()

    # Insert into RDS and DynamoDB
    conn = None
    try:
        # RDS insert
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, email, name, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                email = VALUES(email),
                name = VALUES(name),
                updated_at = VALUES(updated_at)
            """, (user_id, email, name, current_time, current_time))
            conn.commit()

        # DynamoDB insert
        users_table.put_item(Item={
            'userId': user_id,
            'email': email,
            'name': name,
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        })

        print(f"User {user_id} synced to DBs successfully.")

    except Exception as e:
        print(f"Error syncing user: {str(e)}")
        # Optionally handle/log error

    finally:
        if conn:
            conn.close()

    # Return event to let Cognito proceed
    return event
