
# SSH Terminal

This application provides a simple SSH Terminal accessible via a web browser, built using **React** (frontend) and **Go Fiber** (backend).

## Configuration

Create a file named `d.env` in your project root with this content:

```
USERNAME=username
PASSWORD=password
IP=ipadress
```

Replace:

- `username` with your SSH username  
- `password` with your SSH password  
- `ipadress` with the IP address of your SSH server

## How to Run

From the project root, run this command to build and start the app with Docker:

```
docker-compose up --build
```

Then open your browser and navigate to:

```
http://<hostpc>:3000
```

Replace `<hostpc>` with the hostname or IP of your machine running Docker.

## Technologies Used

- **Frontend:** React  
- **Backend:** Go Fiber  
- **Containerization:** Docker & Docker Compose

## Troubleshooting

- **Docker issues?** Check Docker installation and running status.
- **Connection issues?** Make sure your `d.env` file exists and is correct.
- **Port not accessible?** Ensure port `3000` is open on your Docker host.

## License

MIT
