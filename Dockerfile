# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install git, which is required for installing packages from GitHub
RUN apt-get update && apt-get install -y git

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
# This includes your 'app', 'core', 'services' folders, etc.
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run your application.
# Render provides the PORT environment variable, so we use it.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]