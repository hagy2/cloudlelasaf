@@ -1,10 +1,92 @@
# Task Management System on AWS

[![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)

## 📊 Architecture Diagram

```mermaid
graph TD
    A[React Frontend] -->|HTTP Requests| B[API Gateway]
    B -->|Route Requests| C[Lambda Functions]
    C -->|CRUD Operations| D[(DynamoDB)]
    C -->|Relational Data| E[(RDS MySQL)]
    C -->|File Storage| F[(S3 Bucket)]
    A -->|Authentication| G[Cognito User Pool]
    C -->|Async Notifications| H[SQS Queue]
    H -->|Trigger| I[Lambda: Send Emails]
    C -->|Logging & Monitoring| J[CloudWatch]
    subgraph Frontend
        A[React Web App] -->|Authenticate| B[Cognito User Pool]
        A -->|API Calls| C[API Gateway]
    end

    subgraph Backend
        C -->|Routes Requests| D[Lambda Functions]
        D -->|CRUD Tasks| E[(DynamoDB)]
        D -->|User Data| F[(RDS MySQL)]
        D -->|Store Files| G[(S3 Bucket)]
        D -->|Queue Notifications| H[SQS]
        H -->|Process Async| I[Lambda: Send Emails]
    end

    subgraph Monitoring
        D -->|Logs| J[CloudWatch]
    end

    style A fill:#61dafb,stroke:#333
    style B fill:#ff9900,stroke:#333
    style C fill:#ff4f8b,stroke:#333
    style D fill:#faad14,stroke:#333
    style E fill:#2ecc71,stroke:#333
    style F fill:#3498db,stroke:#333
    style G fill:#e67e22,stroke:#333
    style H fill:#9b59b6,stroke:#333
    style I fill:#faad14,stroke:#333
    style J fill:#95a5a6,stroke:#333
```

## 🛠 Setup Guide

### Prerequisites
- AWS Account
- creating iam users and user groups
- AWS CLI configured (`aws configure`)
- react.jsx (for frontend)
- Python 3.8+ (for Lambda)

### Deployment Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/task-manager-aws.git
   cd task-manager-aws
   ```

2. **use lambda for backend**:
   ```bash
   creatug lambda functions for TASK CRUD AND USERS AND NOTIFICATIONS AND UPLOAD to be connected with frontend and connecting gatewys to it ```
3.**apply cognito auth**  

4. **Deploy frontend**:
   ```bash
   cd ../frontend
   npm install
   npm run build
   aws amplify and auth installed 
   ```

## 📖 User Manual

### Authentication
```http
sign up using frontend , the log in, navigate to taksks and create a task, sign out when done
```

### Task Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks` | POST | Create new task |
| `/tasks` | GET | List all tasks |
| `/tasks/{id}` | GET | Get task details |

## 📝 Design Decisions

### Key Architecture Choices
1. **Serverless First** - Using Lambda for cost efficiency
2. **Multi-Database** - DynamoDB for performance + RDS for relations
3. **Cognito Auth** - Managed authentication service
4. 4 **api gateways** - connect backend to frontend

### Challenges Faced
-connecting lambda with RDS
-connecting AUTH and allowing CORS
