package sshinteractive

import (
	"fmt"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

type SSHInteractive struct {
	Username       string
	Password       string
	IP             string
	WriteToServer  func(data []byte)
	ReadFromServer func(data []byte)
	LastCommand    string
}

func NewSSHShell(username, password, ip string) (*SSHInteractive, error) {
	conf := ssh.ClientConfig{
		Timeout: time.Second * 2,
		User:    username,
		Auth: []ssh.AuthMethod{
			ssh.Password(password),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}

	client, err := ssh.Dial("tcp", ip+":22", &conf)
	if err != nil {
		return nil, fmt.Errorf("issue with dial: %w", err)
	}

	session, err := client.NewSession()
	if err != nil {
		return nil, fmt.Errorf("issue with new session: %w", err)
	}

	// Get stdin and stdout pipes before starting the shell.
	stdin, err := session.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdin pipe: %w", err)
	}

	stdoutPipe, err := session.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to get stdout pipe: %w", err)
	}

	modes := ssh.TerminalModes{
		ssh.ECHO:          1,
		ssh.TTY_OP_ISPEED: 14400,
		ssh.TTY_OP_OSPEED: 14400,
	}

	term := "xterm-256color"
	if err := session.RequestPty(term, 65, 300, modes); err != nil {
		return nil, fmt.Errorf("failed to request pty: %w", err)
	}

	// Start the shell after obtaining the pipes.
	if err := session.Shell(); err != nil {
		return nil, fmt.Errorf("failed to start shell: %w", err)
	}

	writeToServer := func(data []byte) {
		if _, err := stdin.Write(data); err != nil {
			fmt.Printf("error writing to server: %v\n", err)
		}
	}

	readFromServer := func(data []byte) {
		fmt.Printf("Received data but why: %s\n", data)
	}

	shell := &SSHInteractive{
		Username:       username,
		Password:       password,
		IP:             ip,
		WriteToServer:  writeToServer,
		ReadFromServer: readFromServer,
	}
	// Start a goroutine to continuously read from the server.
	go func() {
		buf := make([]byte, 1024) // adjust buffer size as needed
		for {
			n, err := stdoutPipe.Read(buf)
			if err != nil {
				fmt.Printf("error reading from server: %v\n", err)
				break
			}
			if n > 0 {
				// Pass only the bytes read
				s := string(buf)
				if strings.Contains(s, "]$") {
					shell.LastCommand = s

				}
				fmt.Printf("shell.LastCommand: %v\n", shell.LastCommand)
				shell.ReadFromServer(buf[:n])
			}
		}
	}()

	return shell, nil
}
