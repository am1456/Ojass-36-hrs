#!/usr/bin/env bash
set -e

echo "Setting up NearHelp..."

# install backend dependencies
cd Backend
npm install

# create .env if not exists
cp -n .env.example .env || true

# seed admin user
npm run seed

echo "Setup complete."
echo "Admin credentials: admin@nearhelp.com / admin123"