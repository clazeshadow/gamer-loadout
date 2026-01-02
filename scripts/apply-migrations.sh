#!/bin/bash
# This script manually applies migrations to the production database
# Run this locally with your DATABASE_URL to update production schema

echo "Applying subscription column migration..."
psql "$DATABASE_URL" -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription TEXT;"

echo "Creating site_visits table..."
psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS site_visits (
    id SERIAL NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    page TEXT,
    CONSTRAINT site_visits_pkey PRIMARY KEY (id)
);"

echo "Creating game_popularity table..."
psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS game_popularity (
    id SERIAL NOT NULL,
    gameName TEXT NOT NULL,
    platform TEXT,
    count INTEGER NOT NULL DEFAULT 1,
    lastAccessed TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT game_popularity_pkey PRIMARY KEY (id)
);"

echo "Creating unique index on game_popularity..."
psql "$DATABASE_URL" -c "CREATE UNIQUE INDEX IF NOT EXISTS game_popularity_gameName_platform_key ON game_popularity(gameName, platform);"

echo "Migrations applied successfully!"
