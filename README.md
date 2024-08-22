# Backend Deployment Instructions for Render

This guide provides a detailed process to configure, deploy, and set up the backend environment.

## Prerequisites:
- An AWS account with sufficient permissions
- An account on [Render](https://render.com/) (for deploying the backend)
- An account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (for hosting the database)
- An account on [Open AI Platform](https://platform.openai.com/) (for LLM)

## 1. Fork the Repository:

1. First, fork the repository to your GitHub account.
2. Then, connect your GitHub account to your Render account to proceed with the deployment.

## 2. MongoDB Atlas Configuration

### 2.1. Create a MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. After signing up, log in to the MongoDB Atlas dashboard.

### 2.2. Create a New Cluster
1. Click on **Build a Cluster**.
2. Choose a cloud provider (e.g., AWS) and the region closest to your deployment location.
3. Select the cluster tier (e.g., the free `M0` tier for development).
4. Click **Create Cluster**. This might take a few minutes.

### 2.3. Create a Database User
1. In your MongoDB Atlas dashboard, go to the **Database Access** section.
2. Click **Add New Database User**.
3. Enter a username and password.
4. Set the user’s privileges to **Read and write to any database**.
5. Click **Add User**.

### 2.4. Configure Network Access
1. Go to the **Network Access** section in the MongoDB Atlas dashboard.
2. Click **Add IP Address**.
3. To allow access from anywhere, add `0.0.0.0/0`. (For production, restrict access to specific IPs.)
4. Click **Confirm**.

### 2.5. Get the Connection String
1. In your MongoDB Atlas dashboard, go to the **Clusters** section.
2. Click **Connect** next to your cluster.
3. Choose **Connect Your Application**.
4. Copy the connection string provided, which will look like this:
   ```bash
      mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=<appName>
    ```

## 3. Amazon AWS Configuration

### 3.1. Create an AWS Account
1. Go to [AWS Console](https://aws.amazon.com/console/) and sign up for a free account.
2. After signing up, log in to the console.

### 3.2. Create a User in IAM
1. Go to the IAM (Identity and Access Management) section.
2. Click on "Users" in the sidebar, then click on "Add users."
3. Enter a username.
4. Choose the access type as **Programmatic access** (API, CLI, SDK access).
5. When setting permissions, select "Attach policies directly":
   - AmazonS3FullAccess
   - AmazonTextractFullAccess
6. Then, create the user and save the CSV file with the credentials.

### 3.3. Create a Bucket in S3
1. Search for S3 in the top search bar of the console and go to it.
2. In S3, click on "Create bucket."
3. Set a unique name for the bucket (this name must be globally unique).
4. Choose the region where the bucket will be created (preferably the same region where you will use Textract).
5. Configure the "Bucket settings for Block Public Access" options as needed (by default, public access is blocked).
6. Click "Create bucket" to finish.
7. Open the created bucket and add the folders `invoice-originals` and `invoice-summarized`.

## 4. OpenAI Configuration

### 4.1. Create an OpenAI Account
1. Go to [OpenAI Platform](https://platform.openai.com/) and sign up.
2. After signing up, log in to the console.
3. Add $5.00 in credits.

### 4.2. Create an API Key
1. Go to the settings.
2. Enter the Billing section and add $5.00 in credits.
3. Go to "Your Profile" and add a Secret Key.
4. Save the key to configure it in the project later.

## 5. Project Environment Variables
1. Add the AWS environment variables:

   - `AWS_ACCESS_KEY_ID=<key-id>`
   - `AWS_REGION=<region>`
   - `AWS_SECRET_ACCESS_KEY=<secret-key>`

2. Add the MongoDB variable:

   - `DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=<appName>"`

3. Add the OpenAI variable:

   - `OPENAI_API_KEY=<key>`

4. Add the backend and frontend hosting variables:

   - `FRONT_BASE_URL=<base-url>`
   - `BACK_BASE_URL=<base-url>`

## 6. Install and Build Commands
1. Set the install command: `yarn install`.
2. Set the build command: `yarn build`.
