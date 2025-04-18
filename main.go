package main

import (
	"bufio"
	"embed"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/joho/godotenv"
	sshinteractive "github.com/sshWebTerminal/sshInteractive"
)

//go:embed ui/dist/*
var f embed.FS

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Error loading .env file")
		return
	}

	username := os.Getenv("USERNAME")
	password := os.Getenv("PASSWORD")
	ip := os.Getenv("IP")
	port := os.Getenv("PORT")

	fmt.Printf("username: %v\n", username)
	fmt.Printf("ip: %v\n", ip)

	shell, err := sshinteractive.NewSSHShell(username, password, ip)
	if err != nil {
		fmt.Printf("Error creating SSH shell: %v\n", err)
		panic(1)
	}

	reader := bufio.NewReader(os.Stdin)

	go func() {
		for {
			input, err := reader.ReadBytes('\n')
			if err != nil {
				fmt.Printf("Error reading input: %v\n", err)
				break
			}
			shell.WriteToServer(input)
		}
	}()

	shell.ReadFromServer = func(data []byte) {
		fmt.Printf("data: %v", string(data))
	}

	app := fiber.New()
	app.Use(cors.New())

	app.Post("/init", func(c *fiber.Ctx) error {
		termData := struct {
			Row int16 `json:"row"`
			Col int16 `josn:"col"`
		}{}
		fmt.Printf("termData: %v\n", termData)
		err := c.BodyParser(&termData)

		shell.SetPty(int(termData.Row), int(termData.Col))

		if err != nil {
			fmt.Printf("err: %v\n", err)
			return c.Context().Err()
		}

		data := struct {
			Data string `json:"data"`
		}{
			Data: shell.LastCommand,
		}

		return c.JSON(data)
	})

	app.Get("/ws/:id", websocket.New(func(c *websocket.Conn) {
		shell.ReadFromServer = func(data []byte) {
			if err := c.WriteMessage(websocket.BinaryMessage, data); err != nil {
				fmt.Printf("Error writing to websocket: %v\n", err)
			}
		}

		for {
			_, msg, err := c.ReadMessage()
			if err != nil {
				break // Exit the loop on error (connection closed or read failure)
			}
			shell.WriteToServer(msg)
		}
	}))

	app.Use("/", filesystem.New(filesystem.Config{
		Root:       http.FS(f),
		Browse:     true,
		PathPrefix: "/ui/dist",
	}))
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("failed to start Fiber server: %v", err)
	}

	select {}
}
