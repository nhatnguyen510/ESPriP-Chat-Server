FROM node:20-alpine3.16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN yarn build

# Expose the port on which the application will run (change it to your desired port)
EXPOSE 80

# Set the command to run the application
CMD ["yarn", "start:prod"]
