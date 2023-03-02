README
This is a web application built using Express that connects to a MySQL database and utilizes the Spotify API. Instead of HTML, this app uses the Pug templating engine to render dynamic content.

Installation
To install this app, clone this repository to your local machine and then run the following command in your terminal:

npm install

This will install all the required dependencies for the app to run properly.

(Maybe you also have to install mysql and pug but I am not sure)

Configuration
Before running the app, you need to configure the MySQL and Spotify API credentials. To do this, create a .env file in the root directory and set the following environment variables:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_DATABASE=spotify_db
SPOTIFY_CLIENT_ID=<your Spotify client ID>
SPOTIFY_CLIENT_SECRET=<your Spotify client secret>
(these values are in the server.js file)

Usage
To start the app, run the following command in your terminal:

npm run start

This will start the app on port 3000. Open your browser and go to http://localhost:3000 to view the app.

Features
This app utilizes the Spotify API to search for and display information about artists, albums, and tracks.

Credits
This app was built by Alexander Joossens. If you have any questions or issues, please contact me at alexander.joossens@student.kuleuven.be