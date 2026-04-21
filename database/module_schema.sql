-- Module database script for marketing-management
CREATE DATABASE IF NOT EXISTS tuition_db;
USE tuition_db;

CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,
    role        ENUM('ADMIN','ASSISTANT') NOT NULL DEFAULT 'ASSISTANT',
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(15),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(20) UNIQUE NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    gender          ENUM('MALE','FEMALE') NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100),
    address         TEXT,
    school          VARCHAR(150),
    al_year         INT,
    parent_name     VARCHAR(100),
    parent_phone    VARCHAR(15),
    profile_photo   VARCHAR(255),
    intake_source   VARCHAR(100),  -- for marketing tracking
    is_active       BOOLEAN DEFAULT TRUE,
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    campaign_name   VARCHAR(150) NOT NULL,
    platform        ENUM('FACEBOOK','INSTAGRAM','YOUTUBE','TIKTOK','WHATSAPP','REFERRAL','POSTER','OTHER') NOT NULL,
    start_date      DATE,
    end_date        DATE,
    budget          DECIMAL(10,2) DEFAULT 0.00,
    description     TEXT,
    status          ENUM('ACTIVE','COMPLETED','PAUSED') DEFAULT 'ACTIVE',
    created_by      INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE intake_sources (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE
);

INSERT INTO users (username, password, email, role, full_name, phone) VALUES
('admin', '$2b$10$B4nA0dyuNCgShxSlIjlGauRQan8.DzI0t8i.7f9i2uek5UUk8H4Mu', 'admin@tuition.lk', 'ADMIN', 'System Administrator', '0771234567');

INSERT INTO intake_sources (source_name, description) VALUES
('Facebook', 'Facebook Page / Ads'),
('Instagram', 'Instagram Posts / Reels'),
('YouTube', 'YouTube Channel'),
('WhatsApp', 'WhatsApp Groups'),
('Friend Referral', 'Referred by existing student'),
('School Notice', 'School notice board'),
('Poster/Banner', 'Physical poster or banner'),
('TikTok', 'TikTok Videos'),
('Other', 'Other sources');
