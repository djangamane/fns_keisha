# Requirements Document

## Introduction

This document outlines the requirements for overhauling the Keisha AI backend system. The current backend uses Ollama for AI processing but needs to be migrated to Hugging Face to utilize the fine-tuned "DJanga24/keisha-qwen3-lora" model. The system must be restructured with proper security, encryption for user privacy, conversation history management, and a modular architecture that supports the counter-racism chatbot functionality.

## Requirements

### Requirement 1: AI Service Migration

**User Story:** As a system administrator, I want to migrate from Ollama to Hugging Face API integration, so that we can use the fine-tuned Keisha model for counter-racism conversations.

#### Acceptance Criteria

1. WHEN the system receives a chat request THEN it SHALL use the Hugging Face API with model "DJanga24/keisha-qwen3-lora"
2. WHEN the AI service processes a message THEN it SHALL maintain the existing system prompt for counter-racism focus
3. WHEN the Hugging Face API is unavailable THEN the system SHALL return appropriate error messages
4. WHEN API rate limits are reached THEN the system SHALL handle gracefully with proper error responses

### Requirement 2: User Chat Privacy and Encryption

**User Story:** As a user discussing sensitive racism experiences, I want my conversations to be encrypted, so that my personal stories and discussions remain private and secure.

#### Acceptance Criteria

1. WHEN a user sends a message THEN the system SHALL encrypt the message before storing in the database
2. WHEN retrieving conversation history THEN the system SHALL decrypt messages before sending to the user
3. WHEN encryption fails THEN the system SHALL not store the message and return an error
4. IF a user requests encrypted responses THEN the system SHALL encrypt the AI response before transmission
5. WHEN handling encryption keys THEN the system SHALL use environment variables for key management

### Requirement 3: Conversation History Management

**User Story:** As a user engaging in ongoing discussions about racism/white-supremacy, I want my conversation history preserved across sessions, so that I can continue meaningful dialogues without losing context.

#### Acceptance Criteria

1. WHEN a user starts a new session THEN the system SHALL create a unique session identifier
2. WHEN a user continues an existing session THEN the system SHALL retrieve previous conversation context
3. WHEN storing conversations THEN the system SHALL maintain proper threading with session IDs
4. WHEN retrieving history THEN the system SHALL return messages in chronological order
5. IF conversation history exceeds limits THEN the system SHALL implement proper pagination

### Requirement 4: Modular Architecture Implementation

**User Story:** As a developer maintaining the system, I want a well-structured codebase with separation of concerns, so that the system is maintainable and scalable.

#### Acceptance Criteria

1. WHEN organizing code THEN the system SHALL implement the specified directory structure (src/config, src/controllers, etc.)
2. WHEN handling requests THEN controllers SHALL be separated from business logic services
3. WHEN managing configuration THEN all environment variables SHALL be centralized in a config module
4. WHEN processing requests THEN middleware SHALL be modular and reusable
5. WHEN errors occur THEN centralized error handling SHALL process all exceptions

### Requirement 5: Security and Authentication

**User Story:** As a system administrator, I want robust security measures in place, so that the counter-racism chatbot is protected from malicious attacks and unauthorized access.

#### Acceptance Criteria

1. WHEN receiving requests THEN the system SHALL implement rate limiting per IP address
2. WHEN processing requests THEN security headers SHALL be applied using helmet middleware
3. WHEN authenticating users THEN JWT tokens SHALL be validated properly
4. WHEN handling CORS THEN only allowed origins SHALL be permitted
5. IF authentication fails THEN the system SHALL return appropriate 401/403 status codes

### Requirement 6: Payment System Integration

**User Story:** As a user wanting premium features, I want the existing Coinbase Commerce payment system to continue working, so that I can access subscription tiers.

#### Acceptance Criteria

1. WHEN payment webhooks are received THEN the system SHALL continue processing Coinbase Commerce events
2. WHEN subscription tiers are updated THEN the system SHALL maintain existing tier logic (Starter, Pro, Gold)
3. WHEN integrating with the new architecture THEN payment routes SHALL be properly modularized
4. WHEN handling payment errors THEN appropriate error responses SHALL be returned

### Requirement 7: Database Integration Continuity

**User Story:** As a system administrator, I want to maintain existing Supabase integration, so that user data and conversation history are preserved during the migration.

#### Acceptance Criteria

1. WHEN storing messages THEN the system SHALL continue using the existing Supabase messages table structure
2. WHEN managing user profiles THEN the system SHALL maintain existing profiles table integration
3. WHEN authenticating users THEN Supabase Auth SHALL continue to be used for JWT validation
4. WHEN database operations fail THEN proper error handling and logging SHALL be implemented

### Requirement 8: Logging and Monitoring

**User Story:** As a system administrator, I want comprehensive logging, so that I can monitor system health and troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN the system processes requests THEN all significant events SHALL be logged with appropriate levels
2. WHEN errors occur THEN detailed error information SHALL be logged for debugging
3. WHEN in production THEN log levels SHALL be configurable via environment variables
4. WHEN logging sensitive data THEN personal information SHALL be excluded from logs
5. WHEN system starts THEN initialization events SHALL be logged with configuration status

### Requirement 9: Development and Deployment Support

**User Story:** As a developer, I want proper development tools and deployment configuration, so that I can efficiently develop and deploy the system.

#### Acceptance Criteria

1. WHEN developing locally THEN nodemon SHALL provide automatic server restart on file changes
2. WHEN running in different environments THEN configuration SHALL adapt based on NODE_ENV
3. WHEN deploying THEN all necessary environment variables SHALL be documented
4. WHEN testing the API THEN proper endpoint documentation SHALL be available
5. WHEN building for production THEN the system SHALL include proper startup scripts