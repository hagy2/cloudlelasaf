import json
import logging
import mysql.connector
import boto3
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging for debugging
logging.getLogger().setLevel(logging.DEBUG)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('UserProfiles')

# CORS headers for frontend compatibility
headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  # Changed to * for broader compatibility
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

def get_db_connection():
    """Connect to RDS MySQL database."""
    try:
        connection = mysql.connector.connect(
            host='tasksdbplease.csjscociq2xx.us-east-1.rds.amazonaws.com',
            user='hager',
            password='Hager200',
            database='task_manager'
        )
        logging.debug("Successfully connected to RDS")
        return connection
    except mysql.connector.Error as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def ensure_profile_exists(user_id, user_email, username=None):
    """Check if profile exists, create if not."""
    try:
        # First check DynamoDB
        response = table.get_item(Key={'userId': user_id})
        if 'Item' in response:
            return True
        
        # If not in DynamoDB, check RDS
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT user_id FROM users WHERE user_id = %s",
            (user_id,)
        )
        profile = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if profile:
            return True
        
        # If profile doesn't exist, create it
        name = username or user_email.split('@')[0]
        current_time = datetime.utcnow()
        
        # Create in RDS
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO users 
                (user_id, email, first_name, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s)""",
                (user_id, user_email, name, current_time, current_time)
            )
            conn.commit()
        
        # Create in DynamoDB
        table.put_item(Item={
            'userId': user_id,
            'email': user_email,
            'name': name,
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        })
        
        return True
        
    except Exception as e:
        logging.error(f"Error ensuring profile exists: {str(e)}")
        raise

def get_user_profile(user_id, headers):
    """Handle GET requests to retrieve a user profile."""
    try:
        # First try DynamoDB
        response = table.get_item(Key={'userId': user_id})
        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'profile': response['Item']})
            }
        
        # Fallback to RDS
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT user_id, email, first_name as name FROM users WHERE user_id = %s",
            (user_id,)
        )
        profile = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if profile:
            # Convert datetime objects to strings if needed
            if 'createdAt' in profile and isinstance(profile['createdAt'], datetime):
                profile['createdAt'] = profile['createdAt'].isoformat()
            if 'updatedAt' in profile and isinstance(profile['updatedAt'], datetime):
                profile['updatedAt'] = profile['updatedAt'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'profile': profile})
            }
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Profile not found'})
            }
    except Exception as e:
        logging.error(f"Error getting profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to get profile: {str(e)}'})
        }

def update_user_profile(event, headers, user_id, requesting_user_id):
    """Handle PUT requests to update a user profile."""
    if user_id != requesting_user_id:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        email = body.get('email')
        
        if not name or not email:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Name and email are required'})
            }
        
        # Update RDS
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET email = %s, first_name = %s WHERE user_id = %s",
            (email, name, user_id)
        )
        conn.commit()
        
        # Update DynamoDB
        current_time = datetime.utcnow()
        table.update_item(
            Key={'userId': user_id},
            UpdateExpression="SET #name = :name, email = :email, updatedAt = :updatedAt",
            ExpressionAttributeNames={"#name": "name"},
            ExpressionAttributeValues={
                ":name": name,
                ":email": email,
                ":updatedAt": current_time.isoformat()
            }
        )
        
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Profile updated successfully'})
        }
    except Exception as e:
        logging.error(f"Error updating profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to update profile: {str(e)}'})
        }

def delete_user_profile(user_id, headers):
    """Handle DELETE requests to remove a user profile."""
    try:
        # Delete from RDS
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        conn.commit()
        
        # Delete from DynamoDB
        table.delete_item(Key={'userId': user_id})
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Profile deleted successfully'})
        }
    except Exception as e:
        logging.error(f"Error deleting profile: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to delete profile: {str(e)}'})
        }
    finally:
        if 'conn' in locals():
            conn.close()

def lambda_handler(event, context):
    """Main Lambda handler for API Gateway requests."""
    logging.debug(f"Raw Event: {json.dumps(event)}")
    
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Extract HTTP method from API Gateway event
        method = event.get('requestContext', {}).get('http', {}).get('method', '')
        logging.debug(f"HTTP Method: {method}")
        
        # Extract user_id and email from Cognito JWT claims
        claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        logging.debug(f"Claims: {claims}")
        
        user_id = claims.get('sub')
        user_email = claims.get('email')
        username = claims.get('cognito:username')
        logging.debug(f"User ID (from token): {user_id}")
        logging.debug(f"User Email (from token): {user_email}")
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized: Missing user ID'})
            }
        
        # Ensure profile exists for all methods except POST and DELETE
        if method not in ['POST', 'DELETE']:
            ensure_profile_exists(user_id, user_email, username)
        
        if method == 'GET':
            return get_user_profile(user_id, headers)
        elif method == 'PUT':
            return update_user_profile(event, headers, user_id, user_id)
        elif method == 'DELETE':
            return delete_user_profile(user_id, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        logging.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }