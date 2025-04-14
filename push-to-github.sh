#!/bin/bash

cd /Users/jacob/Downloads/be-loved-scheduler

echo "Checking Git status..."
git status

echo ""
echo "Adding all changes..."
git add -A

echo ""
echo "Committing changes..."
git commit -m "Update dashboard preview image"

echo ""
echo "Pushing to GitHub..."
echo "You will be prompted for your GitHub username and password/token."
echo "Note: For the password, use a GitHub personal access token with 'repo' scope."
echo ""

git push origin main

echo ""
echo "Done!" 