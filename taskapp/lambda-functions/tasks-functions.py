import json
import boto3
import uuid
import base64
import pymysql
from datetime import datetime
from pymysql.constants import CLIENT

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
tasks_table = dynamodb.Table('Tasks')
sqs = boto3.client('sqs', region_name='us-east-1')
ses = boto3.client('ses', region_name='us-east-1')

# SQS Queue URL (same as processTaskNotifications)
QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/448049794339/TaskUpdateNotificationsQueue'
SENDER_EMAIL = 'shahdsehmawy121@gmail.com'  # Must be verified in SES

# RDS configuration
RDS_HOST = 'tasksdbplease.csjscociq2xx.us-east-1.rds.amazonaws.com'
RDS_USER = 'hager'
RDS_PASSWORD = 'Hager200'
RDS_DB = 'task_manager'
RDS_PORT = 3306

def get_db_connection():
    """Create a new connection to the RDS MySQL database."""
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

def send_notification(user_email, subject, message):
    """Send notification via SQS and SES."""
    try:
        # Verify sender and recipient email addresses (if in SES sandbox mode)
        identities = ses.list_identities(IdentityType='EmailAddress')['Identities']
        if SENDER_EMAIL not in identities:
            print(f"Error: Sender email {SENDER_EMAIL} is not verified in SES")
            return False
        if user_email not in identities:
            print(f"Warning: Recipient email {user_email} is not verified in SES. Email may not be delivered if in sandbox mode.")

        # Queue notification to SQS
        sqs_response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps({
                "toEmail": user_email,
                "subject": subject,
                "messageBody": message
            })
        )
        print(f"Notification queued for {user_email}. SQS MessageId: {sqs_response.get('MessageId')}")

        # Format message for HTML body
        formatted_message = message.replace('\n', '<br>')

        # Send email directly via SES
        ses_response = ses.send_email(
            Source=SENDER_EMAIL,
            Destination={
                'ToAddresses': [user_email],
                'BccAddresses': [],
                'CcAddresses': []
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': message,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': f"""
                        <html>
                        <body>
                            <h2>Task Notification</h2>
                            <p>{formatted_message}</p>
                            <p>Thank you for using Task Manager!</p>
                        </body>
                        </html>
                        """,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        print(f"Email sent to {user_email}: SES MessageId {ses_response['MessageId']}")
        return True
    except ses.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        error_message = e.response['Error']['Message']
        print(f"SES ClientError: {error_code} - {error_message}")
        if error_code == 'MessageRejected':
            print(f"Check if {SENDER_EMAIL} and {user_email} are verified in SES or if SES is in sandbox mode.")
        return False
    except Exception as e:
        print(f"Error sending notification: {str(e)}")
        return False

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-amz-date,x-amz-security-token,x-amz-user-agent,x-api-key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    }

    try:
        print(f"DEBUG: Raw Event: {event}")
        method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', '')).upper()

        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'CORS preflight successful'})
            }

        # Extract authorizer data
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('jwt', {}).get('claims', authorizer.get('claims', {}))
        user_id = claims.get('sub')
        user_email = claims.get('email', 'unknown@example.com')

        print(f"DEBUG: Authorizer: {authorizer}")
        print(f"DEBUG: Claims: {claims}")
        print(f"DEBUG: User ID: {user_id}")
        print(f"DEBUG: User Email: {user_email}")

        if not user_id:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'User ID not found in claims'})
            }

        path_params = event.get('pathParameters') or {}
        query_params = event.get('queryStringParameters') or {}
        task_id = path_params.get('taskId') or query_params.get('taskId')

        if method == 'POST':
            return create_task(event, headers, user_id, user_email)
        elif method == 'GET':
            return get_tasks(task_id, user_id, headers)
        elif method == 'PUT':
            return update_task(event, headers, task_id, user_id, user_email)
        elif method == 'DELETE':
            return delete_task(task_id, headers, user_id, user_email)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_task(event, headers, user_id, user_email):
    conn = None
    try:
        body = json.loads(event.get('body', '{}'))
        title = body.get('title', '').strip()
        description = body.get('description', '').strip()
        status = body.get('status', 'pending')
        file_data = body.get('file')
        filename = body.get('filename')

        if not title or not description:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Title and description are required'})
            }

        task_id = str(uuid.uuid4())
        current_time = datetime.utcnow()

        file_url, file_name, s3_key = handle_file_upload(file_data, filename, task_id, user_id)

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (user_id, email) VALUES (%s, %s) ON DUPLICATE KEY UPDATE email = %s",
                (user_id, user_email, user_email)
            )
            cursor.execute("""
                INSERT INTO tasks 
                (task_id, user_id, title, description, status, file_url, file_name, s3_key, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (task_id, user_id, title, description, status, file_url, file_name, s3_key, current_time))
            conn.commit()

        tasks_table.put_item(Item={
            'taskId': task_id,
            'userId': user_id,
            'userEmail': user_email,
            'title': title,
            'description': description,
            'status': status,
            'fileUrl': file_url,
            'fileName': file_name,
            's3Key': s3_key,
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        })

        # Send notification for task creation
        notification_message = f"New task '{title}' created.\n\nDetails:\n- Title: {title}\n- Description: {description}\n- Status: {status}\n- Created at: {current_time.strftime('%Y-%m-%d %H:%M:%S')}"
        if file_name:
            notification_message += f"\n- File: {file_name}"
        success = send_notification(
            user_email,
            f"Task Created: {title}",
            notification_message
        )
        if not success:
            print(f"Warning: Failed to send notification for task creation {task_id}")

        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'data': {
                    'taskId': task_id,
                    'title': title,
                    'description': description,
                    'status': status,
                    'fileUrl': file_url,
                    'fileName': file_name,
                    'createdAt': current_time.isoformat()
                }
            })
        }

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR in create_task: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()

def get_tasks(task_id, user_id, headers):
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            if task_id:
                cursor.execute("SELECT * FROM tasks WHERE task_id = %s AND user_id = %s", (task_id, user_id))
                task = cursor.fetchone()
                if not task:
                    return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Task not found'})}
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'task': task}, default=str)
                }
            else:
                cursor.execute("SELECT * FROM tasks WHERE user_id = %s", (user_id,))
                tasks = cursor.fetchall()
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'tasks': tasks}, default=str)
                }
    except Exception as e:
        print(f"ERROR in get_tasks: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()

def update_task(event, headers, task_id, user_id, user_email):
    conn = None
    try:
        if not task_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'taskId is required'})}

        body = json.loads(event.get('body', '{}'))
        title = body.get('title')
        description = body.get('description')
        status = body.get('status')

        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verify task ownership and get current task details
            cursor.execute("SELECT user_id, title, description, status FROM tasks WHERE task_id = %s", (task_id,))
            task = cursor.fetchone()
            if not task or task['user_id'] != user_id:
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Not authorized to update this task'})}

            # Track changes for notification
            changes = []
            if title and title != task['title']:
                changes.append(f"- Title changed from '{task['title']}' to '{title}'")
            if description and description != task['description']:
                changes.append(f"- Description changed.")
            if status and status != task['status']:
                changes.append(f"- Status changed from '{task['status']}' to '{status}'")

            # Build dynamic update query for RDS
            update_query = "UPDATE tasks SET updated_at = %s"
            params = [datetime.utcnow()]
            if title:
                update_query += ", title = %s"
                params.append(title)
            if description:
                update_query += ", description = %s"
                params.append(description)
            if status:
                update_query += ", status = %s"
                params.append(status)
            update_query += " WHERE task_id = %s AND user_id = %s"
            params += [task_id, user_id]

            cursor.execute(update_query, tuple(params))
            conn.commit()

        # Update DynamoDB
        if changes:  # Only update DynamoDB if changes were made
            update_expression = "SET updatedAt = :updatedAt"
            expression_attribute_values = {":updatedAt": datetime.utcnow().isoformat()}
            expression_attribute_names = {}  # For reserved keywords

            if title:
                update_expression += ", title = :title"
                expression_attribute_values[":title"] = title
            if description:
                update_expression += ", description = :description"
                expression_attribute_values[":description"] = description
            if status:
                update_expression += ", #status = :status"
                expression_attribute_values[":status"] = status
                expression_attribute_names["#status"] = "status"

            tasks_table.update_item(
                Key={'taskId': task_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names
            )
            print(f"DynamoDB updated for task {task_id}")

        # Send notification if changes were made
        if changes:
            task_title = title if title else task['title']
            changes_text = '\n'.join(changes)
            print(f"DEBUG: Sending notification for task update. Changes: {changes}")
            success = send_notification(
                user_email,
                f"Task Updated: {task_title}",
                f"Your task '{task_title}' has been updated.\n\nChanges made:\n{changes_text}\n\nUpdated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            if not success:
                print(f"Warning: Failed to send notification for task update {task_id}")
        else:
            print(f"DEBUG: No changes detected for task {task_id}, no notification sent")

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Task updated'})}

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR in update_task: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()

def delete_task(task_id, headers, user_id, user_email):
    conn = None
    try:
        if not task_id:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'taskId is required'})}

        conn = get_db_connection()
        with conn.cursor() as cursor:
            # Verify task ownership and get task details
            cursor.execute("SELECT user_id, title, s3_key FROM tasks WHERE task_id = %s", (task_id,))
            task = cursor.fetchone()
            if not task or task['user_id'] != user_id:
                return {'statusCode': 403, 'headers': headers, 'body': json.dumps({'error': 'Not authorized to delete this task'})}

            cursor.execute("DELETE FROM tasks WHERE task_id = %s AND user_id = %s", (task_id, user_id))
            conn.commit()

        tasks_table.delete_item(Key={'taskId': task_id})

        if task.get('s3_key'):
            s3.delete_object(Bucket='files-upload-task', Key=task['s3_key'])

        # Send notification for task deletion
        success = send_notification(
            user_email,
            f"Task Deleted: {task['title']}",
            f"Your task '{task['title']}' was deleted.\n\nDeleted at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        if not success:
            print(f"Warning: Failed to send notification for task deletion {task_id}")

        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'message': 'Task deleted'})}

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"ERROR in delete_task: {str(e)}")
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}
    finally:
        if conn:
            conn.close()

def handle_file_upload(file_data, filename, task_id, user_id):
    """Handle file upload to S3"""
    if not file_data or not filename:
        return None, None, None

    try:
        if ',' in file_data:
            file_data = file_data.split(',')[1]
        file_content = base64.b64decode(file_data)
        timestamp = int(datetime.utcnow().timestamp())
        s3_key = f"tasks/{user_id}/{task_id}/{timestamp}_{filename}"

        s3.put_object(
            Bucket='files-upload-task',
            Key=s3_key,
            Body=file_content,
            ContentType=get_content_type(filename),
            Metadata={
                'task-id': task_id,
                'user-id': user_id,
                'original-filename': filename
            }
        )

        file_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': 'files-upload-task', 'Key': s3_key},
            ExpiresIn=604800  # 7 days
        )

        return file_url, filename, s3_key

    except Exception as e:
        raise Exception(f'File upload failed: {str(e)}')

def get_content_type(filename):
    """Get content type based on file extension"""
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    content_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'zip': 'application/zip',
        'csv': 'text/csv'
    }
    return content_types.get(ext, 'application/octet-stream')