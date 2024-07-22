# cloudhive

cloudhive is a cloud-based social media web application built on AWS. The application features user registration, login, profile management, post creation, and follows functionality. The backend leverages AWS services for scalable and secure infrastructure.

## Table of Contents

1. [Introduction](#introduction)
2. [Technologies and Libraries Used](#technologies-and-libraries-used)
3. [Features](#features)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Contributing](#contributing)
7. [License](#license)

## Introduction

cloudhive is a project designed to explore cloud architecture, security, and big data handling using AWS services. It includes user authentication, profile management, and a dynamic feed with posts. The project demonstrates integration between various AWS services and Node.js.

## Technologies and Libraries Used

### Frontend
- **HTML/CSS**: Markup and styling of the web pages.
- **JavaScript**: Dynamic functionality and AJAX requests.
- **EJS**: Embedded JavaScript templating for dynamic HTML rendering.

### Backend
- **Node.js**: JavaScript runtime for the backend server.
- **Express.js**: Web framework for Node.js.
- **AWS SDK for JavaScript**: AWS services integration.

### Database
- **Amazon RDS (MySQL)**: Relational database service for user and follow data.
- **Amazon DynamoDB**: NoSQL database service for storing posts.

### Storage
- **Amazon S3**: Object storage service for user profile pictures and post images.

### Security
- **AWS IAM**: Identity and Access Management for secure service access.
- **AWS KMS**: Key Management Service for encrypting S3 objects.

### Other
- **multer**: Middleware for handling multipart/form-data for image uploads.
- **jsonwebtoken**: Library for creating and verifying JWT tokens for authentication.
- **bcrypt**: Library for hashing passwords.
- **dotenv**: Environment variable management.

## Features

- **User Registration and Login**: Secure user authentication with JWT.
- **Profile Management**: Users can update their profile information and upload profile pictures.
- **Post Creation**: Users can create posts with optional image uploads.
- **Follow System**: Users can follow/unfollow other users and view their posts.
- **Scalable Architecture**: Utilizing AWS services for scalable and secure infrastructure.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [AWS CLI](https://aws.amazon.com/cli/) (configured with appropriate access)
- MySQL database
- Nginx/Apache Webserver

### Steps

1. **Clone the Repository to your Frontend Servers**

   ```bash
   git clone https://github.com/geofpie/cloudhive.git
   cd cloudhive
